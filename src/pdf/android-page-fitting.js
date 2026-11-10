import { canUseTextBounds, ReadingMetrics } from './reading-analysis.mjs';
import { ReadingGeometryCache } from './reading-geometry-cache.mjs';
import { getReadingSamples, getReadingTextLines, buildReadingModel, getReadingBounds,
	buildReadingProfiles, resolveReadingBounds, getReadingFit, rotateReadingBounds, getReadingMarginalia, getReadingTextBounds, localReadingPages } from './reading-layout.mjs';
import { cropForPage, normalizeCrops } from './manual-crop.mjs';
import { ManualCropEditor } from './manual-crop-editor.js';
import { CroppedPageLayout } from './cropped-page-layout.mjs';
import { ReadingWorkQueue } from './reading-work-queue.mjs';
import { centeredPage, completePages } from './reading-interaction.mjs';

// View-only fitting. PDF coordinates, annotations and the PDF file are untouched.
export class AndroidPageFitting {
	constructor(view) {
		this.view = view;
		this.win = view._iframeWindow;
		this.viewer = this.win.PDFViewerApplication.pdfViewer;
		this.bus = this.win.PDFViewerApplication.eventBus;
		this.options = { mode: 'none', reference: 'page', margin: 0.01 };
		this.active = false;
		this.token = 0;
		this.inputEpoch = 0;
		this.pointers = new Set();
        this.penPointers = new Set();
		this.cache = new Map();
        this.provisionalPages = new Set();
        this.analysisLines = new Map();
        this.work = new ReadingWorkQueue(2);
        this.metrics = new ReadingMetrics(this.win.performance);
        this.presentation = 'reading';
        this.geometry = new Map();
		this.marginaliaByPage = new Map();
		this.preparedPages = new Map();
		this.layout = new CroppedPageLayout(this);
		this.touches = 0;
		this.onDown = event => {
            if (event.pointerType === 'pen') {
                this.work.pauseBackground(true);
                this.penPointers.add(event.pointerId); this.inputEpoch++; this.token++;
                return;
            }
            if (this.inkActive()) return;
			if (event.target?.closest?.('.boox-highlight-palette, .boox-manual-crop')) return;
			this.pointers.add(event.pointerId);
			if (this.pointers.size > 1) this.beginPeek();
			if (this.pointers.size === 1) this.panStart = { x: event.clientX, y: event.clientY };
			this.inputEpoch++;
			this.token++;
		};
		this.onUp = event => {
            this.penPointers.delete(event.pointerId);
            if (!this.penPointers.size) this.work.pauseBackground(false);
            if (!this.penPointers.size && this.prefetchWanted) this.win.setTimeout(() => this.prefetchVisible(), 0);
			const tracked = this.pointers.delete(event.pointerId);
            if (event.pointerType === 'touch') {
                if (!tracked) return; // The priority tap path observes the same up.
                // A page jump can hide the old TouchEvent target before its
                // touchend is delivered. The last PointerEvent is authoritative.
                if (!this.pointers.size) { this.touches = 0; this.touchZoom = false; }
            }
			if (this.view._booxReader?.palette) {
				this.pendingPage = false;
				this.win.clearTimeout(this.timer);
				return;
			}
			if (!this.pointers.size && !this.touches && !this.penPointers.size && (this.pendingPage || this.zooming)) {
                if (this.view.action?.type === 'ink') this.win.setTimeout(() => this.finishGesture(), 0);
                else this.finishGesture();
            }
		};
		this.onTouch = event => {
            if (this.inkActive()) { this.touches = 0; return; }
			this.touches = event.touches.length;
			if (this.touches > 1) { this.touchZoom = true; this.beginPeek(); }
			if (!this.touches) {
				this.touchZoom = false;
				if (this.zooming || this.pendingPage) this.finishGesture();
			}
		};

		this.onPage = () => {
			if (this.active && !this.applying) {
				if (this.layout.boxes && !this.zooming && this.applied
                    && Math.abs(this.viewer.currentScale - this.applied.scale) < 0.002) {
					const index = this.viewer.currentPageNumber - 1, prepared = this.preparedPages.get(index);
					const box = this.layout.boxes[index];
					if (prepared && box) {
						this.applied = { scale: this.viewer.currentScale, bounds: prepared.bounds, pageIndex: index,
							left: this.viewer.container.scrollLeft,
							top: Math.max(0, box.y + (box.height - this.viewer.container.clientHeight) / 2) };
						this.masks = { index, rotation: this.viewer.pagesRotation, rects: prepared.marginalia };
					}
				}
				this.prefetchVisible();
				if (!this.layout.boxes || this.zooming) this.schedule();
			}
		};
		this.onScroll = () => this.prefetchVisible();
		this.viewer.container.addEventListener('scroll', this.onScroll, { passive: true });
		this.onScale = () => {
			if (this.active && !this.applying && (!this.applied
					|| Math.abs(this.viewer.currentScale - this.applied.scale) > 0.002)) {
				if (this.pointers.size || this.touchZoom || this.zooming) {
					this.zooming = true;
					this.token++;
					this.pendingPage = true;
					this.clearClips();
					this.masks = null;
					this.view._render();
					if (!this.pointers.size && !this.touches) this.schedule();
				}
				else this.suspend(); // Explicit zoom buttons still allow the Wrapped overview.
			}
		};
		this.onRotation = () => {
			this.token++; this.clearClips();
			this.preparedPages.clear(); this.geometry.clear();
			if (this.active) this.schedule();
		};
		this.onResize = () => { if (this.active) this.schedule(); };
		this.win.addEventListener('pointerdown', this.onDown, true);

		this.win.addEventListener('pointerup', this.onUp, true);
		this.win.addEventListener('pointercancel', this.onUp, true);
		this.win.addEventListener('resize', this.onResize);
		this.win.addEventListener('touchstart', this.onTouch, { passive: true, capture: true });
		this.win.addEventListener('touchend', this.onTouch, { passive: true, capture: true });
		this.win.addEventListener('touchcancel', this.onTouch, { passive: true, capture: true });
		this.bus.on('pagechanging', this.onPage);
		this.bus.on('scalechanging', this.onScale);
		this.bus.on('rotationchanging', this.onRotation);
	}

    get persistent() {
        if (this._persistent) return this._persistent;
        if (!this.viewer.pdfDocument) return new ReadingGeometryCache(null, null, 0);
        let storage;
        try { storage = this.win.localStorage; } catch (_) {}
        this._persistent = new ReadingGeometryCache(storage,
            this.viewer.pdfDocument.fingerprints?.join('|'), this.viewer.pdfDocument.numPages);
        const savedLearning = this._persistent.learning;
        if (savedLearning) {
            this.model = { ...savedLearning.model, repeated: new Set() };
            this.profiles = savedLearning.profiles;
            this.readingModel = { ...this.model, ...this.profiles,
                aspect: savedLearning.aspect, withMarginalia: savedLearning.withMarginalia };
            this.modelPromise = Promise.resolve(this.readingModel);
        }
        return this._persistent;
    }

	configure(options, apply = true) {
        const cropMode = options?.cropMode === 'automatic' ? 'automatic' : options?.cropMode === 'manual' ? 'manual'
            : (options?.manualCrop || Object.keys(this.options.manualCrop || {}).length ? 'manual' : 'automatic');
		this.options = {
			mode: ['none', 'content', 'width', 'height'].includes(options?.mode) ? options.mode : 'none',
			reference: cropMode === 'manual' ? 'cropped-content'
                : ['content', 'cropped-content'].includes(options?.reference) ? options.reference : 'page',
			includeMarginalia: options?.includeMarginalia === true,
			margin: Math.max(0, Math.min(0.2, Number(options?.margin) || 0)),
			revision: options?.revision || 0,
			manualCrop: normalizeCrops(options?.manualCrop === undefined ? this.options.manualCrop : options.manualCrop),
            cropMode,
		};
		this.configured = true;
		if (!apply) return Promise.resolve(false);
		this.token++;
		this.win.clearTimeout(this.timer);
		this.pendingPage = false;
		this.zooming = false;
        this.presentation = 'reading';
		this.peekAnchor = null;
		this.peekPageIndex = null;
		this.clearClips();
		this.preparedPages.clear(); this.geometry.clear();
		this.masks = null;
		this.active = this.options.mode !== 'none';
		this.applied = null;
		if (!this.active) this.view._booxReader?.rememberReadingView();
		this.view._render();
		return this.active ? this.apply({ alignTop: true }) : Promise.resolve(true);
	}

	usesCropLayout() { return this.options.mode !== 'none'; }

	estimatedBounds(index) {
		const manual = cropForPage(this.options.cropMode === 'manual' ? this.options.manualCrop : {}, index);
		if (manual) return rotateReadingBounds(manual, this.viewer.pagesRotation);
		const profile = this.profiles?.profiles[index % 2];
		return profile ? rotateReadingBounds(profile, this.viewer.pagesRotation) : [0, 0, 1, 1];
	}

	beginPeek() {
		if ((!this.active && this.presentation !== 'overview') || this.zooming || this.editor || this.inkActive()) return;
		const c = this.viewer.container, index = this.centeredPageIndex(), d = this.viewer.getPageView(index)?.div;
		if (!d) return;
		this.peekAnchor = { index, fraction: (c.scrollTop + c.clientHeight / 2 - d.offsetTop - d.clientTop) / d.clientHeight, screenY: c.clientHeight / 2 };
		this.gestureOrigin = { scale: this.viewer.currentScale, presentation: this.presentation };
        this.presentation = 'peek';
        this.zooming = true; this.pendingPage = true; this.token++;
		this.clearClips(); this.masks = null;
		// Removing the view crop must keep the same PDF point under the fingers.
		c.scrollTop = Math.max(0, d.offsetTop + d.clientTop + this.peekAnchor.fraction * d.clientHeight - this.peekAnchor.screenY);
		c.scrollLeft = Math.max(0, d.offsetLeft + d.clientLeft + d.clientWidth / 2 - c.clientWidth / 2);
		this.view._render();
	}

    pageFrames() {
        const c = this.viewer.container, r = c.getBoundingClientRect?.() || {left:0,top:0};
        return this.viewer._pages.map((page,index) => {
            const box = this.layout.boxes?.[index];
            if (box) return {index,left:r.left+box.x-c.scrollLeft,top:r.top+box.y-c.scrollTop,
                right:r.left+box.x+box.width-c.scrollLeft,bottom:r.top+box.y+box.height-c.scrollTop};
            const d = page.div, b = d.getBoundingClientRect();
            return { index,left:b.left,top:b.top,right:b.right??b.left+d.clientWidth,bottom:b.bottom??b.top+d.clientHeight };
        });
    }
    viewportFrame() {
        const c=this.viewer.container, r=c.getBoundingClientRect?.()||{left:0,top:0};
        return {left:r.left,top:r.top,right:r.left+c.clientWidth,bottom:r.top+c.clientHeight};
    }
    centeredPageIndex() { return centeredPage(this.pageFrames(),this.viewportFrame(),this.viewer.currentPageNumber-1); }
    finishGesture() {
        if (this.touches || this.pointers.size || this.inkActive() || this.editor) return;
        if (this.zooming && this.gestureOrigin) {
            const changed = Math.abs(this.viewer.currentScale-this.gestureOrigin.scale)>0.002;
            if (changed && this.viewer.currentScale < (this.view._booxReader?.readingScale || this.gestureOrigin.scale)
                    && completePages(this.pageFrames(),this.viewportFrame()) >= 2
                    || !changed && this.gestureOrigin.presentation === 'overview') {
                this.presentation='overview'; this.active=false; this.zooming=false; this.pendingPage=false;
                this.peekAnchor=null; this.win.clearTimeout(this.timer); this.view._updateViewStats(); return;
            }
            this.active=this.options.mode !== 'none';
            if (this.gestureOrigin.presentation==='overview' && this.peekAnchor) this.peekAnchor.index=this.centeredPageIndex();
        }
        if (this.active && (this.zooming || this.pendingPage)) this.schedule();
    }
    rememberPrepared(prepared) {
        this.preparedPages.delete(prepared.index); this.preparedPages.set(prepared.index,prepared);
        this.geometry.set(prepared.index, {fit:{bounds:prepared.fit.bounds},bounds:prepared.bounds});
        while(this.preparedPages.size>32) this.preparedPages.delete(this.preparedPages.keys().next().value);
    }

	prefetchVisible() {
        if (this.inkActive()) { this.prefetchWanted = true; return; }
        if (!this.active || !this.usesCropLayout() || this.zooming || this.editor || this.view._destroyed) return;
        this.prefetchWanted = true;
        // Throttle rather than restarting a trailing timer on every scroll event.
        if (this.prefetchTimer || this.prefetching) return;
        this.prefetchTimer = this.win.setTimeout(async () => {
            this.prefetchTimer = null;
            if (this.inkActive()) return;
            if (!this.active || this.zooming || this.applying || this.view._destroyed) return;
            this.prefetching = true; this.prefetchWanted = false;
            const key=this.key(), rotation=this.viewer.pagesRotation;
            const center=this.viewer.currentPageNumber-1;
            const direction=center < (this.prefetchCenter ?? center) ? -1 : 1;
            this.prefetchCenter=center;
            const visible=this.layout.boxes ? this.layout.getVisiblePages().views.map(p=>p.id-1) : [];
            const indexes=new Set([center,...visible]);
            const wanted=new Set();
            for (const index of indexes) for (let delta=-4;delta<=4;delta++) {
                const i=index+delta;
                if (i>=0 && i<this.viewer.pagesCount && !this.preparedPages.has(i)) wanted.add(i);
            }
            const rank=i=>indexes.has(i) ? Math.abs(i-center)-20 : Math.abs(i-center)*2+(Math.sign(i-center)===direction ? 0 : 1);
            try {
                for (const i of [...wanted].sort((a,b)=>rank(a)-rank(b))) {
                    if (!this.active || this.inkActive() || this.zooming || this.editor || key!==this.key() || rotation!==this.viewer.pagesRotation
                            || center!==this.viewer.currentPageNumber-1 || this.view._destroyed) break;
                    const prepared=await this.prepare(i,this.options,false,5);
                    if (!prepared || this.zooming || key!==this.key() || rotation!==this.viewer.pagesRotation) break;
                    this.rememberPrepared(prepared);
                    if (this.layout.boxes && !this.applying) this.queueGeometryRefresh();
                }
            }
            catch(error) { if (!['AbortError','RenderingCancelledException'].includes(error.name)) console.error(error); }
            finally { this.prefetching=false; if (this.prefetchWanted) this.prefetchVisible(); }
        }, 20);
    }

    queueGeometryRefresh() {
        if (this.layoutFrame) return;
        this.layoutFrame = this.win.requestAnimationFrame(() => {
            this.layoutFrame = null;
            if (!this.active || this.zooming || this.view._destroyed || !this.layout.boxes) return;
            // A turn snapshots scale/scroll before awaiting its target crop. Moving
            // neighboring pages here would cancel that entire queued navigation.
            if (this.view._pendingPageTurn || this.inkActive() || this.pointers.size || this.touches || this.applying) {
                if (!this.layoutRetryTimer) this.layoutRetryTimer = this.win.setTimeout(() => {
                    this.layoutRetryTimer = null; this.queueGeometryRefresh();
                }, 50);
                return;
            }
            this.win.clearTimeout(this.layoutRetryTimer); this.layoutRetryTimer = null;
            const start=this.metrics.now();
            this.layout.apply(this.geometry, { preservePosition:true });
            // Reference masks can change without changing the page frame.
            // The view's incremental renderer still needs that notification.
            this.view._render();
            this.metrics.record('layout',start);
        });
    }

	snapshot() { return this.active && this.applied ? { ...this.options } : null; }

	state() {
		return this.configured && !this.applying && (this.applied || !this.active)
			? { pageFitMode: this.options.mode, pageFitRevision: this.options.revision, readingPresentation: this.presentation } : {};
	}

	suspend() {
		this.token++; this.active = false; this.applied = null;
		this.win.clearTimeout(this.timer); this.pendingPage = false; this.clearClips();
		this.masks = null; this.view._render();
	}

	schedule(delay = 70) {
		this.pendingPage = true;
		this.win.clearTimeout(this.timer);
		this.timer = this.win.setTimeout(() => {
            if (this.view._pendingPageTurn) { this.schedule(50); return; }
			if (this.pointers.size || this.touches || this.inkActive() || this.applying || !this.active || this.view._destroyed) return;
			this.pendingPage = false;
			this.apply().catch(error => console.error(error));
		}, delay);
	}

	readPage(index, priority = 0) {
        const start=this.metrics.now();
        return this.work.run(index, signal => {
            this.metrics.record('queue',start);
            return this.renderAnalysis(index,signal);
        }, priority);
    }

    async renderAnalysis(index, signal) {
        const cached=this.analysisLines.get(index);
        if (cached?.textOnly) return cached;
        const page=await this.viewer.pdfDocument.getPage(index+1);
        if (signal?.aborted) throw this.work.abortError();
        const base=page.getViewport({scale:1,rotation:page.rotate});
        const scale=Math.min(600/base.width,Math.sqrt(800000/(base.width*base.height)));
        const viewport=page.getViewport({scale,rotation:page.rotate});
        const textStart=this.metrics.now();
        let lines=cached?.lines, textOnly=cached?.textOnly;
        if (!lines) {
            const [text,operators]=await Promise.all([
                page.getTextContent().catch(()=>({items:[]})),
                page.getOperatorList?.().catch(()=>null),
            ]);
            if (signal?.aborted) throw this.work.abortError();
            lines=getReadingTextLines(text,viewport);
            textOnly=canUseTextBounds(operators,lines);
        }
        this.metrics.record('text',textStart);
        const analysis={index,aspect:base.width/base.height,lines,textOnly,width:viewport.width,height:viewport.height};
        this.analysisLines.delete(index); this.analysisLines.set(index,analysis);
        while(this.analysisLines.size>32) this.analysisLines.delete(this.analysisLines.keys().next().value);
        if(this.readingModel && this.provisionalPages.size && [...this.provisionalPages].some(i=>this.hasLocalEvidence(i))) this.refineAfterLearning();
        if(textOnly) return analysis;
        const canvas=this.win.document.createElement('canvas');
        canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
        const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
        ctx.skipBlender=true;
        let task;
        const cancel=()=>task?.cancel();
        signal?.addEventListener('abort',cancel,{once:true});
        try {
            if(signal?.aborted) throw this.work.abortError();
            ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
            const start=this.metrics.now();
            task=page.render({canvasContext:ctx,viewport,annotationMode:0});
            this.analysisTasks??=new Set(); this.analysisTasks.add(task);
            await task.promise;
            this.metrics.record('raster',start);
            if(signal?.aborted) throw this.work.abortError();
            return {...analysis,image:ctx.getImageData(0,0,canvas.width,canvas.height)};
        }
        finally {
            signal?.removeEventListener('abort',cancel); this.analysisTasks?.delete(task);
            canvas.width=canvas.height=0;
        }
    }

    readingBounds(page,model,options={}) {
        const start=this.metrics.now();
        const bounds=page.textOnly ? getReadingTextBounds(page.lines,model,page.index,options)
            : getReadingBounds(page.image,page.lines,model,page.index,options);
        this.metrics.record(page.textOnly ? 'textBounds' : 'pixels',start);
        return bounds;
    }

    inkActive() { return this.penPointers.size > 0 || this.view.action?.type === 'ink'; }

    nearbyLines(index) {
        const aspect = this.analysisLines.get(index)?.aspect;
        return localReadingPages([...this.analysisLines.values()].filter(p => !aspect || Math.abs(p.aspect/aspect - 1) < .05),index);
    }
    hasLocalEvidence(index) {
        const required = Math.min(3, Math.ceil((this.viewer.pdfDocument.numPages - index % 2) / 2));
        return this.nearbyLines(index).filter(p => p.index % 2 === index % 2).length >= required;
    }
    localModel(index, fallback) {
        return this.hasLocalEvidence(index) ? buildReadingModel(this.nearbyLines(index)) : fallback;
    }

	async ensureModel() {
        this.persistent; // Initialize only after PDF.js has opened the document.
		if (!this.modelPromise) {
			let rotation = this.viewer.pagesRotation;
			this.modelPromise = (async () => {
				let pages = [];
                const count = this.viewer.pdfDocument.numPages;
                const center = this.centeredPageIndex();
                const local = [center, center + 1, center - 1, center + 2, center - 2].filter(i => i >= 0 && i < count);
                const samples = [...new Set([...local, ...getReadingSamples(count)])];
				for (let index of samples) {
					if (this.view._destroyed) return null;
					try { pages.push({...await this.readPage(index, 10)}); }
					catch (error) { console.error(error); }
				}
                if (this.view._destroyed) return null;
				let model = buildReadingModel(pages);
				for (let page of pages) {
                    const pageModel = this.localModel(page.index, model);
                    Object.assign(page,this.readGeometry(page,pageModel));
                    this.marginaliaByPage.set(page.index,page.marginalia);
					delete page.image; delete page.lines;
					if (rotation === this.viewer.pagesRotation) {
                        this.cache.set(page.index, Promise.resolve(page));
                        if (this.hasLocalEvidence(page.index)) this.provisionalPages.delete(page.index);
                        else this.provisionalPages.add(page.index);
                    }
                    if (this.hasLocalEvidence(page.index)) this.persistent.put(page);
				}
				let aspects = pages.map(p => p.aspect).sort((a, b) => a - b);
				this.model = model;
				this.profiles = buildReadingProfiles(pages);
                this.readingModel = { ...model, ...this.profiles,
                    withMarginalia: buildReadingProfiles(pages.map(page => ({ ...page, bounds: page.withMarginalia }))),
                    aspect: aspects[Math.floor(aspects.length / 2)] };
                // Results computed with the provisional local model are refined once.
                this.persistent.setLearning({ model, profiles: this.profiles, aspect: this.readingModel.aspect,
                    withMarginalia: this.readingModel.withMarginalia });
                this.persistent.flush();
                this.refineAfterLearning(true);
                return this.readingModel;
			})();
		}
		return this.modelPromise;
	}

    refineAfterLearning(force = false) {
        this.refineForce ||= force;
        this.win.clearTimeout(this.refineTimer);
        this.refineTimer = this.win.setTimeout(() => {
            if (this.view._destroyed) return;
            if (this.view._pendingPageTurn || this.pointers.size || this.touches || this.inkActive() || this.zooming || this.applying || this.editor) {
                this.refineAfterLearning(); return;
            }
            let changed = this.refineForce;
            this.refineForce = false;
            for (const index of this.provisionalPages) {
                if (!this.hasLocalEvidence(index)) continue;
                this.cache.delete(index); this.marginaliaByPage.delete(index);
                this.provisionalPages.delete(index); this.preparedPages.delete(index); changed = true;
            }
            if (changed) {
                // Only provisional pages that gained usable evidence are rebuilt.
                // Valid buffered crops and their coordinates remain available.
                if (this.active) this.schedule(0);
            }
        }, 250);
    }
	async boundsFor(index, { includeMarginalia = false, manualCrop = this.options.manualCrop, priority = 0 } = {}) {
		let manual = cropForPage(this.options.cropMode === 'automatic' ? {} : manualCrop, index);
		if (manual) return rotateReadingBounds(manual, this.viewer.pagesRotation);
        // Fit the requested page immediately; document learning runs behind it.
        this.persistent;
        const learned = this.readingModel;
        this.metrics.record(this.cache.has(index) || this.persistent.get(index) ? 'cacheHit' : 'cacheMiss',this.metrics.now());
        if (!this.modelPromise) this.ensureModel().catch(error => { if (!this.view._destroyed) console.error(error); });
        let model = learned;
        if (!this.cache.has(index) && this.persistent.get(index)) {
            const saved = this.persistent.get(index);
            this.cache.set(index, Promise.resolve(saved));
            this.marginaliaByPage.set(index, saved.marginalia);
        }
		if (!this.cache.has(index)) {
            if (!learned) this.provisionalPages.add(index);
			let rotation = this.viewer.pagesRotation;
            this.cache.set(index, this.readPage(index,priority).then(page => {
                // Keep the profile's original aspect: an unusual landscape page must
                // use its actual content bounds instead of inheriting portrait width.
                model = { aspect: page.aspect, ...model, ...(this.localModel(index, model) || buildReadingModel([page])) };
                if (!this.hasLocalEvidence(index) && !this.persistent.get(index)) this.provisionalPages.add(index);
                const geometry=this.readGeometry(page,model);
                if (this.cache.has(index)) this.marginaliaByPage.set(index,geometry.marginalia);
                if (learned && !this.provisionalPages.has(index)) {
                    this.persistent.put(geometry);
                    this.win.clearTimeout(this.persistTimer);
                    this.persistTimer = this.win.setTimeout(() => this.persistent.flush(), 1000);
                }
                return geometry;
			}).catch(error => { this.cache.delete(index); if(error.name === 'AbortError' || error.name === 'RenderingCancelledException') throw error; console.error(error); return { bounds: null }; }));
			if (this.cache.size > 32) {
				let oldest = this.cache.keys().next().value;
				this.cache.delete(oldest); this.marginaliaByPage.delete(oldest);
			}
		}
        if (this.work.jobs.has(index)) this.work.run(index, signal=>this.renderAnalysis(index,signal),priority).catch(()=>{});
        const pending = this.cache.get(index);
        let page = await pending;
        model ||= this.readingModel || {aspect:page?.aspect};
        if (!page) return [0,0,1,1];
		let actual = includeMarginalia ? page.withMarginalia : page.bounds;
		if (!actual) return [0, 0, 1, 1];
		let profiles = includeMarginalia ? model.withMarginalia : model;
        let bounds = !profiles?.profiles || Math.abs(page.aspect / model.aspect - 1) > 0.05 ? actual
            : resolveReadingBounds(actual, index, profiles);
		return rotateReadingBounds(bounds, this.viewer.pagesRotation);
	}

    readGeometry(page,model) {
        const marginalia=this.readMarginalia(page,model);
        const bounds=this.readingBounds(page,model);
        return {index:page.index,aspect:page.aspect,bounds,marginalia,
            withMarginalia:marginalia.length ? this.readingBounds(page,model,{includeMarginalia:true}) : bounds};
    }

	readMarginalia(page, model) {
		return getReadingMarginalia(page.lines, model, page.index).map(r => [
			Math.max(0, r[0] - 2 / (page.width || page.image.width)), Math.max(0, r[1] - 2 / (page.height || page.image.height)),
			Math.min(1, r[2] + 2 / (page.width || page.image.width)), Math.min(1, r[3] + 2 / (page.height || page.image.height)),
		]);
	}

	maskRectsFor(index) {
		if (cropForPage(this.options.cropMode === 'manual' ? this.options.manualCrop : {}, index)) return [];
		if (!this.active || this.zooming || this.peekPageIndex === index || this.options.includeMarginalia
			|| this.options.mode !== 'content' && this.options.reference === 'page') return [];
		if (this.masks?.index === index && this.masks.rotation === this.viewer.pagesRotation) return this.masks.rects;
		return (this.marginaliaByPage.get(index) || []).map(r => rotateReadingBounds(r, this.viewer.pagesRotation));
	}


	key(options = this.options) { return JSON.stringify(options); }

	async prepare(index, options = this.options, includeNeighbors = true, priority = 0) {
		let v = this.viewer, c = v.container;
		if (!v.pdfDocument || this.view._destroyed || v.spreadMode !== 0) return null;
		let rotation = v.pagesRotation, inputEpoch = this.inputEpoch;
		let width = c.clientWidth, height = c.clientHeight;
		let bounds = options.mode === 'content' || options.reference !== 'page'
			? await this.boundsFor(index, { ...options, priority }) : [0, 0, 1, 1];
		let pdfPage = await v.pdfDocument.getPage(index + 1);
		let base = pdfPage.getViewport({ scale: 96 / 72, rotation: pdfPage.rotate + rotation });
		let fit = getReadingFit({ ...options, bounds, width, height, pageWidth: base.width, pageHeight: base.height });
		let page = await this.cache.get(index);
		let marginalia = cropForPage(options.manualCrop, index) ? []
			: (page?.marginalia || []).map(r => rotateReadingBounds(r, rotation));
		let prepared = { index, key: this.key(options), bounds, pdfPage, fit, rotation, inputEpoch, width, height, marginalia };
        if (includeNeighbors) prepared.neighbors = [...this.preparedPages.values()].filter(p=>p.index!==index && Math.abs(p.index-index)<=4 && p.key===prepared.key && p.rotation===rotation);
		return prepared;
	}

	commit(prepared, { alignTop = false, topFraction = 0, direction = 0, navigate } = {}) {
		let v = this.viewer, c = v.container;
		if (!prepared || !this.active || this.inkActive() || this.view._pendingPageTurn && !navigate || this.view._destroyed || v.spreadMode !== 0
				|| prepared.key !== this.key() || prepared.rotation !== v.pagesRotation
				|| prepared.inputEpoch !== this.inputEpoch || this.pointers.size
				|| prepared.width !== c.clientWidth || prepared.height !== c.clientHeight) return false;
		let { index, bounds, pdfPage, fit } = prepared;
		let page = v.getPageView(index);
		if (!page) return false;
		this.token++; this.pendingPage = false; this.win.clearTimeout(this.timer);
		this.applying = true;
		try {
			if (!this.usesCropLayout()) this.clearClips();
			this.peekPageIndex = null;
			this.zooming = false; this.presentation = 'reading';
			navigate?.();
			if (!page.pdfPage) page.setPdfPage(pdfPage);
			const preserveScroll = this.peekAnchor;
			v.currentScale = fit.scale;
			if (this.usesCropLayout()) {
				this.rememberPrepared(prepared);
				for (const neighbor of prepared.neighbors || []) this.rememberPrepared(neighbor);
				this.layout.apply(this.geometry);
			}
			// Wrapped scale changes can put a different page at the old scroll
			// offset. Resolve the requested page again after the new row layout.
			v.scrollPageIntoView({ pageNumber: index + 1 });
			let d = page.div, b = fit.bounds;
			c.scrollLeft = Math.max(0, d.offsetLeft + d.clientLeft
				+ (b[0] + b[2]) / 2 * d.clientWidth - c.clientWidth / 2);
			if (this.options.mode !== 'width') {
				c.scrollTop = Math.max(0, d.offsetTop + d.clientTop
					+ (b[1] + b[3]) / 2 * d.clientHeight - c.clientHeight / 2);
			}
			else {
				c.scrollTop = Math.max(0, d.offsetTop + d.clientTop + (alignTop
					? Math.max(0, b[1] * d.clientHeight - fit.pad) : topFraction * d.clientHeight));
			}
			this.masks = { index, rotation: v.pagesRotation, rects: prepared.marginalia };
			if (preserveScroll && preserveScroll.index === index) {
				c.scrollTop = Math.max(0, d.offsetTop + d.clientTop + preserveScroll.fraction * d.clientHeight - preserveScroll.screenY);
			}
			this.peekAnchor = null;
			this.view._pageNavigation?.centerCurrentPage({ direction, preservePosition: !navigate && !alignTop });
			this.applied = { scale: v.currentScale, bounds, pageIndex: index, left: c.scrollLeft, top: c.scrollTop };
			this.view._booxReader?.rememberReadingView();
		}
		finally { this.applying = false; }
		this.view._render();
		this.view._pageNavigation?.sync();
		this.view._updateViewStats();
		this.prefetchVisible();
		return true;
	}

	isCroppedWidth() { return this.options.mode === 'width' && this.options.reference === 'cropped-content'; }

	async apply({ alignTop = false } = {}) {
		let v = this.viewer, c = v.container;
		if (!this.active || !v.pdfDocument || this.inkActive() || this.view._pendingPageTurn || this.view._destroyed) return false;
		if (v.spreadMode !== 0) { this.suspend(); return false; }
        let index = this.peekAnchor?.index ?? v.currentPageNumber - 1, token = ++this.token, scale = v.currentScale;
        const samples = new Set(getReadingSamples(v.pdfDocument.numPages));
        this.work.cancelWhere(i => Math.abs(i-index)>5 && !samples.has(i));
		let page = v.getPageView(index);
		let topFraction = (c.scrollTop - page.div.offsetTop - page.div.clientTop) / page.div.clientHeight;
		let prepared;
        try { prepared = await this.prepare(index); }
        catch (error) {
            if (!['AbortError','RenderingCancelledException'].includes(error.name)) throw error;
            if (this.active && !this.view._destroyed && token === this.token && v.currentPageNumber === index+1) this.schedule(50);
            return false;
        }
		if (token !== this.token || !this.zooming && v.currentPageNumber !== index + 1 || v.currentScale !== scale) return false;
		return this.commit(prepared, { alignTop, topFraction });
	}

	resetInput() {
        this.penPointers.clear(); this.work.pauseBackground(false);
		this.inputEpoch++; this.token++; this.pointers.clear(); this.pendingPage = false;
		this.touches = 0; this.touchZoom = false;
		this.win.clearTimeout(this.timer);
		if (this.zooming) this.schedule();
	}

	clearClips() { this.layout.clear(); }

	destroy() {
		this.editor?.close();
		this.work.close(); this.win.clearTimeout(this.refineTimer); this.win.cancelAnimationFrame(this.layoutFrame); for(const task of this.analysisTasks || []) task.cancel();
        this.suspend(); this.layout.destroy();
        this.preparedPages.clear(); this.geometry.clear(); this.modelPromise=null; this.readingModel=null;
		this.viewer.container.removeEventListener('scroll', this.onScroll);
		this.cache.clear(); this.marginaliaByPage.clear(); this.win.clearTimeout(this.prefetchTimer);
        this.win.clearTimeout(this.persistTimer); this.win.clearTimeout(this.layoutRetryTimer); this.persistent.flush();
		this.win.removeEventListener('pointerdown', this.onDown, true);

		this.win.removeEventListener('pointerup', this.onUp, true);
		this.win.removeEventListener('pointercancel', this.onUp, true);
		this.win.removeEventListener('resize', this.onResize);
		this.win.removeEventListener('touchstart', this.onTouch, true);
		this.win.removeEventListener('touchend', this.onTouch, true);
		this.win.removeEventListener('touchcancel', this.onTouch, true);
		this.bus.off('pagechanging', this.onPage); this.bus.off('scalechanging', this.onScale);
		this.bus.off('rotationchanging', this.onRotation);
	}

	openCropEditor(options) {
		if (!this.view._destroyed && this.viewer.pdfDocument && !this.editor) {
			this.view._clearPendingBackdropTap?.();
			this.editor = new ManualCropEditor(this, options);
		}
	}
}
