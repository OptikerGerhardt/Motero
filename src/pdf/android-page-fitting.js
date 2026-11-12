import { analyzeReadingGeometry } from './reading-geometry.mjs';
import { typicalReadingFrame } from './blank-page-frame.mjs';
import { readerResourceBudget } from '../common/reader-resource-budget.mjs';
import { ReadingAnalysisWorker } from './reading-worker-client.js';
import { canUseTextBounds, ReadingMetrics } from './reading-analysis.mjs';
import { ReadingGeometryCache } from './reading-geometry-cache.mjs';
import { getReadingSamples, getReadingTextLines, buildReadingModel,
	buildReadingProfiles, resolveReadingBounds, getReadingFit, getReadingFrame, rotateReadingBounds, localReadingPages } from './reading-layout.mjs';
import { cropForPage, normalizeCrops } from './manual-crop.mjs';
import { ManualCropEditor } from './manual-crop-editor.js';
import { CroppedPageLayout } from './cropped-page-layout.mjs';
import { ReadingWorkQueue } from './reading-work-queue.mjs';
import { centeredPage } from './reading-interaction.mjs';
import { readingUnit, completeReadingUnits, unitFrame } from './reading-unit.mjs';

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
        this.touchPointers = new Set();
        this.penPointers = new Set();
		this.cache = new Map();
        this.provisionalPages = new Set();
        this.analysisLines = new Map();
        this.work = new ReadingWorkQueue(2);
        this.analysisWorker = new ReadingAnalysisWorker();
        this.metrics = new ReadingMetrics(this.win.performance);
        this.presentation = 'reading';
        this.geometry = new Map();
		this.marginaliaByPage = new Map();
		this.preparedPages = new Map();
        this.layoutEpoch = 0;
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
            if (this.view._options?.deviceProfile?.eReader) {
                this.win.clearTimeout(this.workResumeTimer);
                this.work.pauseBackground(true);
            }
			this.pointers.add(event.pointerId);
            if (event.pointerType==='touch') this.touchPointers.add(event.pointerId);
			if (this.pointers.size > 1) this.beginPeek();
			if (this.pointers.size === 1) this.panStart = { x: event.clientX, y: event.clientY };
			this.inputEpoch++;
			this.token++;
		};
		this.onUp = event => {
            this.penPointers.delete(event.pointerId);
            if (!this.penPointers.size && this.prefetchWanted) this.win.setTimeout(() => this.prefetchVisible(), 0);
			const tracked = this.pointers.delete(event.pointerId);
            this.touchPointers.delete(event.pointerId);
            if (!this.penPointers.size && !this.pointers.size) {
                if (this.view._options?.deviceProfile?.eReader && event.pointerType === 'touch') {
                    this.win.clearTimeout(this.workResumeTimer);
                    this.workResumeTimer = this.win.setTimeout(() => {
                        if (!this.penPointers.size && !this.pointers.size) this.work.pauseBackground(false);
                    }, 350);
                } else this.work.pauseBackground(false);
            }
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
                for (const id of this.touchPointers) this.pointers.delete(id);
                this.touchPointers.clear();
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
			this.preparedPages.clear(); this.geometry.clear(); this.layoutEpoch++;
			if (this.active) this.schedule();
		};
        this.onSpread = () => {
            this.spreadNeedsRender = true;
            this.token++; this.inputEpoch++; this.clearClips(); this.applied=null;
            this.preparedPages.clear(); this.geometry.clear(); this.layoutEpoch++;
            this.active=this.configured && this.options.mode !== 'none'; this.presentation='reading';
            if (this.active) this.schedule(0);
            this.view._pageNavigation?.sync();
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
        this.bus.on('spreadmodechanged',this.onSpread);
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
        if (this.options.mode !== 'width' || this.options.reference === 'page' || this.options.cropMode === 'manual' || this.viewer.spreadMode) this.column = null;
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
		this.preparedPages.clear(); this.geometry.clear(); this.layoutEpoch++;
		this.masks = null;
		this.active = this.options.mode !== 'none';
		this.applied = null;
		if (!this.active) { this.view._booxReader?.rememberReadingView(); this.view._pageNavigation?.sync(); }
		this.view._render();
		return this.active ? this.apply({ alignTop: true }) : Promise.resolve(true);
	}

	usesCropLayout() { return this.options.mode !== 'none'; }

	estimatedBounds(index) {
		const manual = cropForPage(this.options.cropMode === 'manual' ? this.options.manualCrop : {}, index);
		if (manual) return rotateReadingBounds(manual, this.viewer.pagesRotation);
		const profile = this.profiles?.profiles[index % 2];
		if (this.options.reference === 'page' && this.options.mode !== 'content') return [0,0,1,1];
        return getReadingFrame(profile ? rotateReadingBounds(profile, this.viewer.pagesRotation) : [0,0,1,1], this.options);
	}

	beginPeek() {
		if ((!this.active && this.presentation !== 'overview') || this.zooming || this.editor || this.inkActive()) return;
		const c = this.viewer.container, index = this.centeredPageIndex(), d = this.viewer.getPageView(index)?.div;
		if (!d) return;
        // Reflowing/uncropping can move a touched page out of the viewport.
        // Capture on the stable container so BOTH pointer-up events still arrive.
        for (const id of this.pointers) { try { c.setPointerCapture?.(id); } catch (_) {} }
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
    centeredPageIndex() {
        const current=this.viewer.currentPageNumber-1;
        const nearest=centeredPage(this.pageFrames(),this.viewportFrame(),current);
        return this.viewer.spreadMode && readingUnit(current,this.viewer.pagesCount,this.viewer.spreadMode).includes(nearest) ? current : nearest;
    }
    finishGesture() {
        if (this.touches || this.pointers.size || this.inkActive() || this.editor) return;
        if (this.zooming && this.gestureOrigin) {
            const changed = Math.abs(this.viewer.currentScale-this.gestureOrigin.scale)>0.002;
            if (changed && this.viewer.currentScale < (this.view._booxReader?.readingScale || this.gestureOrigin.scale)
                    && completeReadingUnits(this.pageFrames(),this.viewportFrame(),this.viewer.spreadMode) >= 2
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
        const previous = this.geometry.get(prepared.index);
        if (!previous || prepared.fit.bounds.some((n, i) => n !== previous.fit.bounds[i])) this.layoutEpoch++;
        this.geometry.set(prepared.index, {fit:{bounds:prepared.fit.bounds},bounds:prepared.bounds,blankFrame:prepared.blankFrame});
        while(this.preparedPages.size>readerResourceBudget(this.view._options?.deviceProfile).cropPages) this.preparedPages.delete(this.preparedPages.keys().next().value);
    }

	prefetchVisible() {
        if (this.inkActive()) { this.prefetchWanted = true; return; }
        if (!this.active || this.options.mode === 'none' || this.zooming || this.editor || this.view._destroyed) return;
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
            const radius = readerResourceBudget(this.view._options?.deviceProfile).prefetchRadius;
            for (const index of indexes) for (let delta=-radius;delta<=radius;delta++) {
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
            return this.renderAnalysis(index,signal).then(page=>({...page,priority}));
        }, priority);
    }

    readTextPage(index, priority = 10) {
        return this.work.run('text:' + index, signal => this.textAnalysis(index, signal), priority);
    }

    async textAnalysis(index, signal) {
        let cached = this.analysisLines.get(index);
        if (cached) return cached;
        this.textPending ??= new Map();
        if (!this.textPending.has(index)) this.textPending.set(index, (async () => {
            const page = await this.viewer.pdfDocument.getPage(index + 1);
            const base = page.getViewport({scale:1, rotation:page.rotate});
            const scale = Math.min(600/base.width, Math.sqrt(800000/(base.width*base.height)));
            const viewport = page.getViewport({scale, rotation:page.rotate});
            const start = this.metrics.now();
            const [text, operators] = await Promise.all([
                page.getTextContent().catch(() => ({items:[]})),
                page.getOperatorList?.().catch(() => null),
            ]);
            if (this.view._destroyed) throw this.work.abortError();
            const lines = getReadingTextLines(text, viewport);
            const analysis = {index, aspect:base.width/base.height, lines,
                textOnly:canUseTextBounds(operators, lines), width:viewport.width, height:viewport.height};
            this.metrics.record('text', start);
            this.analysisLines.delete(index); this.analysisLines.set(index, analysis);
            while (this.analysisLines.size > 32) this.analysisLines.delete(this.analysisLines.keys().next().value);
            if (this.readingModel && this.provisionalPages.size && [...this.provisionalPages].some(i => this.hasLocalEvidence(i))) this.refineAfterLearning();
            return analysis;
        })().finally(() => this.textPending.delete(index)));
        const analysis = await this.textPending.get(index);
        if (signal?.aborted || this.view._destroyed) throw this.work.abortError();
        return analysis;
    }

    async renderAnalysis(index, signal) {
        const analysis = await this.textAnalysis(index, signal);
        if (signal?.aborted || this.view._destroyed) throw this.work.abortError();
        if (analysis.textOnly) return analysis;
        const page = await this.viewer.pdfDocument.getPage(index + 1);
        const base = page.getViewport({scale:1,rotation:page.rotate});
        const scale = Math.min(600/base.width, Math.sqrt(800000/(base.width*base.height)));
        const viewport = page.getViewport({scale,rotation:page.rotate});
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
					try { pages.push({...await this.readTextPage(index, 10)}); }
					catch (error) { if (error.name!=='AbortError') console.error(error); }
				}
                if (this.view._destroyed) return null;
				let model = buildReadingModel(pages);
                const measured = [];
				for (let page of pages) {
                    if (this.view._destroyed) return null;
                    try {
                    const pageModel = this.localModel(page.index, model);
                    // The model needs text only. Rasterize one sample at a time;
                    // retaining all sample ImageData can otherwise cost tens of MB.
                    const sample = page.textOnly ? {...page,priority:10} : await this.readPage(page.index, 10);
                    Object.assign(page, await this.readGeometry(sample, pageModel));
                    this.marginaliaByPage.set(page.index,page.marginalia);
					delete page.image; delete page.lines;
					if (rotation === this.viewer.pagesRotation) {
                        this.cache.set(page.index, Promise.resolve(page));
                        if (this.hasLocalEvidence(page.index)) this.provisionalPages.delete(page.index);
                        else this.provisionalPages.add(page.index);
                    }
                    if (this.hasLocalEvidence(page.index)) this.persistent.put(page);
                    if (!page.blank) measured.push(page);
                    } catch (error) { if (!this.view._destroyed && error.name!=='AbortError') console.error(error); }
                    // Let input, toolbar changes and the current page paint between samples.
                    await new Promise(resolve => this.win.setTimeout(resolve, 0));
				}
                if (!measured.length || this.view._destroyed) return null;
				let aspects = measured.map(p => p.aspect).sort((a, b) => a - b);
				this.model = model;
				this.profiles = buildReadingProfiles(measured);
                this.readingModel = { ...model, ...this.profiles,
                    withMarginalia: buildReadingProfiles(measured.map(page => ({ ...page, bounds: page.withMarginalia }))),
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
            const visible = new Set(this.layout.boxes ? this.layout.getVisiblePages().views.map(p=>p.id-1) : []);
            if (this.applied) visible.add(this.viewer.currentPageNumber-1);
            for (const index of this.provisionalPages) {
                // Learning may improve the next visit, never move text that is
                // already being read. Keep visible frames until navigation/refit.
                if (visible.has(index) && this.preparedPages.has(index)) continue;
                if (!this.hasLocalEvidence(index)) continue;
                this.cache.delete(index); this.marginaliaByPage.delete(index);
                this.provisionalPages.delete(index); this.preparedPages.delete(index); changed = true;
            }
            if (changed) {
                this.layoutEpoch++;
                // Only provisional pages that gained usable evidence are rebuilt.
                // Valid buffered crops and their coordinates remain available.
                if (this.active && !this.applied) this.schedule(0);
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
        if (!this.modelPromise) this.ensureModel().catch(error => { if (!this.view._destroyed && error.name!=='AbortError') console.error(error); });
        let model = learned;
        if (!this.cache.has(index) && this.persistent.get(index)) {
            const saved = this.persistent.get(index);
            this.cache.set(index, Promise.resolve(saved));
            this.marginaliaByPage.set(index, saved.marginalia);
        }
		if (!this.cache.has(index)) {
            if (!learned) this.provisionalPages.add(index);
			let rotation = this.viewer.pagesRotation;
            this.cache.set(index, this.readPage(index,priority).then(async page => {
                // Keep the profile's original aspect: an unusual landscape page must
                // use its actual content bounds instead of inheriting portrait width.
                model = { aspect: page.aspect, ...model, ...(this.localModel(index, model) || buildReadingModel([page])) };
                if (!this.hasLocalEvidence(index) && !this.persistent.get(index)) this.provisionalPages.add(index);
                const geometry=await this.readGeometry(page,model);
                if (this.cache.has(index)) this.marginaliaByPage.set(index,geometry.marginalia);
                if (learned && !this.provisionalPages.has(index)) {
                    this.persistent.put(geometry);
                    this.win.clearTimeout(this.persistTimer);
                    this.persistTimer = this.win.setTimeout(() => this.persistent.flush(), 1000);
                }
                return geometry;
			}).catch(error => { this.cache.delete(index); if(error.name === 'AbortError' || error.name === 'RenderingCancelledException') throw error; console.error(error); return { bounds: null }; }));
			if (this.cache.size > readerResourceBudget(this.view._options?.deviceProfile).cropPages) {
				let oldest = this.cache.keys().next().value;
				this.cache.delete(oldest); this.marginaliaByPage.delete(oldest);
			}
		}
        if (this.work.jobs.has(index)) this.work.run(index, signal=>this.renderAnalysis(index,signal),priority).catch(()=>{});
        const pending = this.cache.get(index);
        let page = await pending;
        model ||= this.readingModel || {aspect:page?.aspect};
        if (!page) return [0,0,1,1];
        const actual = includeMarginalia ? page.withMarginalia : page.bounds;
		if (!actual) return [0, 0, 1, 1];
		let profiles = includeMarginalia ? model.withMarginalia : model;
        let bounds = !profiles?.profiles || Math.abs(page.aspect / model.aspect - 1) > 0.05 ? actual
            : resolveReadingBounds(actual, index, profiles);
		return rotateReadingBounds(bounds, this.viewer.pagesRotation);
	}

    async readGeometry(page,model) {
        const start=this.metrics.now();
        try {
            const geometry=page.textOnly ? analyzeReadingGeometry(page,model) : await this.analysisWorker.analyze(page,model);
            this.metrics.record(page.textOnly?'textBounds':'workerAnalysis',start);
            return geometry;
        } catch(error) {
            // A renderer/worker process may be reclaimed after a transfer. Re-read
            // only that page using the fallback; never analyze a detached buffer.
            if (error.name !== 'ReadingWorkerError' || this.view._destroyed) throw error;
            return this.analysisWorker.analyze(await this.renderAnalysis(page.index),model);
        }
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
        const v = this.viewer, spreadMode = v.spreadMode || 0;
        const indices = readingUnit(index,v.pagesCount || v.pdfDocument?.numPages || index+1,spreadMode);
        const pages = await Promise.all(indices.map(i=>this.preparePage(i,options,includeNeighbors,priority)));
        if (pages.some(p=>!p) || (v.spreadMode || 0) !== spreadMode) return null;
        if (pages.length > 1) {
            const pad = pages[0].fit.pad;
            const content = options.mode === 'content' || options.reference !== 'page';
            const widths = pages.map(p => { const b=content?p.rawBounds:[0,0,1,1]; return p.blankFrame?.width || (b[2]-b[0])*p.base.width; });
            const sx = Math.max(1,pages[0].width-12-2*pad*pages.length)/widths.reduce((a,b)=>a+b,0);
            const sy = Math.min(...pages.map(p=>{
                const b=content?p.rawBounds:[0,0,1,1];
                return Math.max(1,p.height-2*pad)/(p.blankFrame?.height || (b[3]-b[1])*p.base.height);
            }));
            const scale = Math.max(.1,Math.min(10,options.mode === 'width'?sx:options.mode === 'height'?sy:Math.min(sx,sy)));
            for (const p of pages) p.fit = {...p.fit,scale};
        }
        const prepared = pages.find(p=>p.index===index) || pages[0];
        return {...prepared,spreadMode,unitPages:pages,neighbors:prepared.neighbors?.filter(p=>!indices.includes(p.index))};
    }

    async blankFrameFor(index, options, rotation) {
        const samples = [];
        // Bounded, nearest-first evidence. Existing page/operator caches are
        // reused, and ordinary nonempty manual pages never need raster analysis.
        for (const delta of [-1,1,-2,2,-3,3]) {
            const i = index + delta;
            if (i < 0 || i >= this.viewer.pdfDocument.numPages) continue;
            const bounds = await this.boundsFor(i,options);
            let geometry = await this.cache.get(i);
            if (!geometry && options.cropMode === 'manual') {
                const text = await this.readTextPage(i,0);
                if (!text.lines.length) {
                    geometry = await this.readGeometry(await this.readPage(i,0),this.readingModel || {});
                    this.cache.set(i,Promise.resolve(geometry));
                }
            }
            if (geometry?.blank) continue;
            const page = await this.viewer.pdfDocument.getPage(i+1);
            const base = page.getViewport({scale:96/72,rotation:page.rotate+rotation});
            samples.push({bounds:getReadingFrame(bounds,options),width:base.width,height:base.height});
            if (samples.length === 3) break;
        }
        return typicalReadingFrame(samples);
    }

    async preparePage(index, options = this.options, includeNeighbors = true, priority = 0) {
		let v = this.viewer, c = v.container;
		if (!v.pdfDocument || this.view._destroyed) return null;
		let rotation = v.pagesRotation, inputEpoch = this.inputEpoch;
		let width = c.clientWidth, height = c.clientHeight;
		let bounds = options.mode === 'content' || options.reference !== 'page'
			? await this.boundsFor(index, { ...options, priority }) : [0, 0, 1, 1];

		let pdfPage = await v.pdfDocument.getPage(index + 1);
		let base = pdfPage.getViewport({ scale: 96 / 72, rotation: pdfPage.rotate + rotation });
        let geometry = await this.cache.get(index);
        if (!geometry && options.cropMode === 'manual' && pdfPage.getTextContent) {
            const text = await this.readTextPage(index,priority);
            if (!text.lines.length) {
                geometry = await this.readGeometry(await this.readPage(index,priority),this.readingModel || {});
                this.cache.set(index,Promise.resolve(geometry));
            }
        }
        const blankFrame = geometry?.blank ? await this.blankFrameFor(index,options,rotation) : null;
        const columns = options.mode === 'width' && options.reference !== 'page' && options.cropMode !== 'manual'
            && this.view._pageNavigation?.mode === 'jumped'
            && !v.spreadMode && rotation % 180 === 0 ? geometry?.columns?.map(b=>rotateReadingBounds(b,rotation)) : null;
        if (columns && rotation % 360 === 180) columns.reverse();
        const columnIndex = this.column?.pageIndex === index ? this.column.index : 0;
        const columnBounds = columns?.[columnIndex];
        // Ragged line endings must not change the font size when switching columns.
        const columnFit = columnBounds && [0,columnBounds[1],Math.max(...columns.map(b=>b[2]-b[0])),columnBounds[3]];
        let fit = getReadingFit({ ...options, bounds:columnFit || bounds, width, height, pageWidth: base.width, pageHeight: base.height });
        // Crop only the paper margins. Column fitting changes zoom/pan, never the PDF's coordinate plane.
        if (columnBounds) fit = {...fit,bounds:getReadingFrame(bounds,options)};
		if (blankFrame) {
            fit = getReadingFit({...options,reference:'page',bounds:[0,0,1,1],width,height,pageWidth:blankFrame.width,pageHeight:blankFrame.height});
            fit.bounds = [(1-blankFrame.width/base.width)/2,(1-blankFrame.height/base.height)/2,
                (1+blankFrame.width/base.width)/2,(1+blankFrame.height/base.height)/2];
        }
		const rawBounds = bounds;
		bounds = fit.bounds;
		let page = await this.cache.get(index);
		let marginalia = cropForPage(options.manualCrop, index) ? []
			: (page?.marginalia || []).map(r => rotateReadingBounds(r, rotation));
		let prepared = { index, key: this.key(options), bounds, rawBounds, base, pdfPage, fit, rotation, inputEpoch, width, height, marginalia, columns, columnIndex, blankFrame };
        if (includeNeighbors) prepared.neighbors = [...this.preparedPages.values()].filter(p=>p.index!==index && Math.abs(p.index-index)<=4 && p.key===prepared.key && p.rotation===rotation);
		return prepared;
	}

	commit(prepared, { alignTop = false, topFraction = 0, direction = 0, navigate } = {}) {
		let v = this.viewer, c = v.container;
		if (!prepared || !this.active || this.inkActive() || this.view._pendingPageTurn && !navigate || this.view._destroyed
				|| prepared.spreadMode !== (v.spreadMode || 0)
                || prepared.key !== this.key() || prepared.rotation !== v.pagesRotation
				|| prepared.inputEpoch !== this.inputEpoch || this.pointers.size
				|| prepared.width !== c.clientWidth || prepared.height !== c.clientHeight) return false;
		let { index, bounds, pdfPage, fit } = prepared;
        if (prepared.columns && direction < 0 && this.column?.pageIndex !== index) prepared.columnIndex = prepared.columns.length - 1;
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
                if (this.columnLayout !== !!prepared.columns) { this.columnLayout = !!prepared.columns; this.layoutEpoch++; }
				for (const member of prepared.unitPages || [prepared]) this.rememberPrepared(member);
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
            if (prepared.unitPages?.length>1 && this.layout.boxes) {
                const frame=unitFrame(this.layout.boxes,prepared.unitPages.map(p=>p.index));
                c.scrollLeft=Math.max(0,(frame.left+frame.right-c.clientWidth)/2);
                if (this.options.mode !== 'width') c.scrollTop=Math.max(0,(frame.top+frame.bottom-c.clientHeight)/2);
                else if (alignTop) c.scrollTop=Math.max(0,frame.top);
            }
			this.masks = { index, rotation: v.pagesRotation, rects: prepared.marginalia };
			if (preserveScroll && preserveScroll.index === index) {
				c.scrollTop = Math.max(0, d.offsetTop + d.clientTop + preserveScroll.fraction * d.clientHeight - preserveScroll.screenY);
			}
			this.peekAnchor = null;
			this.view._pageNavigation?.centerCurrentPage({ direction, preservePosition: !navigate && !alignTop, force: true });
            this.positionColumn(prepared, {alignTop, direction, preservePosition: !navigate && !alignTop});
			this.applied = { scale: v.currentScale, bounds, pageIndex: index, left: c.scrollLeft, top: c.scrollTop };
			this.view._booxReader?.rememberReadingView();
		}
		finally { this.applying = false; }
		this.view._render();
		this.view._pageNavigation?.sync();
        if (this.spreadNeedsRender) {
            this.spreadNeedsRender = false;
            v.renderingQueue?.renderHighestPriority(); // Repaint the rebuilt spread without promoting its partner page.
        }
		this.view._updateViewStats();
		this.prefetchVisible();
		return true;
	}

    get columnActive() {
        return this.active && !this.zooming && this.options.mode === 'width' && !this.viewer.spreadMode
            && this.view._pageNavigation?.mode === 'jumped'
            && this.column?.pageIndex === this.viewer.currentPageNumber - 1;
    }

    positionColumn(prepared, {alignTop = false, direction = 0, preservePosition = false} = {}) {
        if (!prepared.columns?.length) { this.column = null; return; }
        const index = prepared.columnIndex;
        const saved = this.preparedPages.get(prepared.index);
        if (saved) saved.columnIndex = index;
        this.column = {pageIndex:prepared.index,index,bounds:prepared.columns[index],columns:prepared.columns};
        const c=this.viewer.container, d=this.viewer.getPageView(prepared.index).div, b=this.column.bounds;
        c.scrollLeft=Math.max(0,d.offsetLeft+d.clientLeft+(b[0]+b[2])*d.clientWidth/2-c.clientWidth/2);
        if (!preservePosition || alignTop || direction) c.scrollTop=Math.max(0,d.offsetTop+d.clientTop+
            (direction<0 ? b[3]*d.clientHeight+prepared.fit.pad-c.clientHeight : b[1]*d.clientHeight-prepared.fit.pad));
    }

    turnColumn(next) {
        const col=this.column;
        if (!this.columnActive) return false;
        const index=col.index+(next?1:-1);
        if (index<0 || index>=col.columns.length) return false;
        const prepared=this.preparedPages.get(col.pageIndex);
        if (!prepared) return false;
        this.column={...col,index,bounds:col.columns[index]};
        prepared.columnIndex=index;
        this.positionColumn(prepared,{direction:next?1:-1});
        this.applied={...this.applied,left:this.viewer.container.scrollLeft,top:this.viewer.container.scrollTop};
        return true;
    }

	isCroppedWidth() { return this.options.mode === 'width' && this.options.reference === 'cropped-content'; }

	async apply({ alignTop = false } = {}) {
		let v = this.viewer, c = v.container;
		if (!this.active || !v.pdfDocument || this.inkActive() || this.view._pendingPageTurn || this.view._destroyed) return false;
        let index = this.peekAnchor?.index ?? v.currentPageNumber - 1, token = ++this.token, scale = v.currentScale;
        const samples = new Set(getReadingSamples(v.pdfDocument.numPages));
        this.analysisWorker.cancelWhere(i => Math.abs(i-index)>5 && !samples.has(i));
        this.work.cancelWhere(key => { const i = typeof key === 'number' ? key : Number(key.slice(5)); return Math.abs(i-index)>5 && !samples.has(i); });
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
        this.win.clearTimeout(this.workResumeTimer);
        this.penPointers.clear(); this.work.pauseBackground(false);
		this.inputEpoch++; this.token++; this.pointers.clear(); this.touchPointers.clear(); this.pendingPage = false;
		this.touches = 0; this.touchZoom = false;
		this.win.clearTimeout(this.timer);
		if (this.zooming) this.schedule();
	}

	clearClips() { this.layout.clear(); }

	destroy() {
		this.editor?.close();
        this.win.clearTimeout(this.workResumeTimer);
		this.analysisWorker.close(); this.work.close(); this.win.clearTimeout(this.refineTimer); this.win.cancelAnimationFrame(this.layoutFrame); for(const task of this.analysisTasks || []) task.cancel();
        this.suspend(); this.layout.destroy();
        this.preparedPages.clear(); this.geometry.clear(); this.layoutEpoch++; this.modelPromise=null; this.readingModel=null;
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
        this.bus.off('spreadmodechanged',this.onSpread);
	}

	openCropEditor(options) {
		if (!this.view._destroyed && this.viewer.pdfDocument && !this.editor) {
			this.view._clearPendingBackdropTap?.();
			this.editor = new ManualCropEditor(this, options);
		}
	}
}
