import { getReadingSamples, getReadingTextLines, buildReadingModel, getReadingBounds,
	buildReadingProfiles, resolveReadingBounds, getReadingFit, rotateReadingBounds, getReadingMarginalia } from './reading-layout.mjs';

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
		this.cache = new Map();
		this.marginaliaByPage = new Map();
		this.clipped = new Map();
		this.touches = 0;
		this.onDown = event => {
			if (event.target?.closest?.('.boox-highlight-palette')) return;
			this.pointers.add(event.pointerId);
			if (this.pointers.size === 1) this.panStart = { x: event.clientX, y: event.clientY };
			this.inputEpoch++;
			this.token++;
		};
		this.onUp = event => {
			this.pointers.delete(event.pointerId);
			if (this.view._booxReader?.palette) {
				this.pendingPage = false;
				this.win.clearTimeout(this.timer);
				return;
			}
			if (!this.pointers.size && (this.pendingPage || this.zooming)) this.schedule();
		};
		this.onTouch = event => {
			this.touches = event.touches.length;
			if (this.touches > 1) this.touchZoom = true;
			if (!this.touches) {
				this.touchZoom = false;
				if (this.zooming || this.pendingPage) this.schedule();
			}
		};
		this.onMove = event => {
			if (!this.active || this.applying || this.zooming || this.touchZoom || this.pointers.size !== 1
					|| event.pointerType !== 'touch' || !this.panStart || this.view._tool.type !== 'pointer'
					|| this.view._directHighlight?.gesture.active || this.view._directHighlight?.pressAnnotation
					|| this.view._selectionRanges?.some(range => !range.collapsed)
					|| Math.hypot(event.clientX - this.panStart.x, event.clientY - this.panStart.y) < 8) return;
			let index = this.viewer.currentPageNumber - 1;
			if (this.peekPageIndex === index) return;
			this.peekPageIndex = index;
			this.restoreCrop(this.viewer.getPageView(index)?.div);
			this.view._render();
		};
		this.onPage = () => { if (this.active && !this.applying) this.schedule(); };
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
			if (this.active) this.schedule();
		};
		this.onResize = () => { if (this.active) this.schedule(); };
		this.win.addEventListener('pointerdown', this.onDown, true);
		this.win.addEventListener('pointermove', this.onMove, true);
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

	configure(options, apply = true) {
		this.options = {
			mode: ['none', 'content', 'width', 'height'].includes(options?.mode) ? options.mode : 'none',
			reference: ['content', 'cropped-content'].includes(options?.reference) ? options.reference : 'page',
			includeMarginalia: options?.includeMarginalia === true,
			margin: Math.max(0, Math.min(0.2, Number(options?.margin) || 0)),
			revision: options?.revision || 0,
		};
		this.configured = true;
		if (!apply) return Promise.resolve(false);
		this.token++;
		this.win.clearTimeout(this.timer);
		this.pendingPage = false;
		this.zooming = false;
		this.peekPageIndex = null;
		this.clearClips();
		this.masks = null;
		this.active = this.options.mode !== 'none';
		this.applied = null;
		if (!this.active) this.view._booxReader?.rememberReadingView();
		this.view._render();
		return this.active ? this.apply({ alignTop: true }) : Promise.resolve(true);
	}

	snapshot() { return this.active && this.applied ? { ...this.options } : null; }

	state() {
		return this.configured && !this.applying && (this.applied || !this.active)
			? { pageFitMode: this.options.mode, pageFitRevision: this.options.revision } : {};
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
			if (this.pointers.size || this.touches || this.applying || !this.active || this.view._destroyed) return;
			this.pendingPage = false;
			this.apply().catch(error => console.error(error));
		}, delay);
	}

	async readPage(index) {
		let page = await this.viewer.pdfDocument.getPage(index + 1);
		// Analyze in the PDF's natural reading orientation. Rotation of the view
		// transforms the result, rather than turning headers into side columns.
		let angle = page.rotate;
		let base = page.getViewport({ scale: 1, rotation: angle });
		let viewport = page.getViewport({ scale: 600 / base.width, rotation: angle });
		let canvas = this.win.document.createElement('canvas');
		canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
		let ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
		try {
			ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
			let [, text] = await Promise.all([
				page.render({ canvasContext: ctx, viewport, annotationMode: 0 }).promise,
				page.getTextContent().catch(() => ({ items: [] })),
			]);
			return { index, aspect: base.width / base.height,
				image: ctx.getImageData(0, 0, canvas.width, canvas.height), lines: getReadingTextLines(text, viewport) };
		}
		finally { canvas.width = canvas.height = 0; }
	}

	async ensureModel() {
		if (!this.modelPromise) {
			let rotation = this.viewer.pagesRotation;
			this.modelPromise = (async () => {
				let pages = [];
				for (let index of getReadingSamples(this.viewer.pdfDocument.numPages)) {
					if (this.view._destroyed) return null;
					try { pages.push(await this.readPage(index, rotation)); }
					catch (error) { console.error(error); }
				}
				let model = buildReadingModel(pages);
				for (let page of pages) {
					page.marginalia = this.readMarginalia(page, model);
					this.marginaliaByPage.set(page.index, page.marginalia);
					page.bounds = getReadingBounds(page.image, page.lines, model, page.index);
					page.withMarginalia = getReadingBounds(page.image, page.lines, model, page.index, { includeMarginalia: true });
					delete page.image; delete page.lines;
					if (rotation === this.viewer.pagesRotation) this.cache.set(page.index, Promise.resolve(page));
				}
				let aspects = pages.map(p => p.aspect).sort((a, b) => a - b);
				return { ...model, ...buildReadingProfiles(pages),
					withMarginalia: buildReadingProfiles(pages.map(page => ({ ...page, bounds: page.withMarginalia }))),
					aspect: aspects[Math.floor(aspects.length / 2)] };
			})();
		}
		return this.modelPromise;
	}

	async boundsFor(index, { includeMarginalia = false } = {}) {
		let model = await this.ensureModel();
		if (!model) return [0, 0, 1, 1];
		if (!this.cache.has(index)) {
			let rotation = this.viewer.pagesRotation;
			this.cache.set(index, this.readPage(index, rotation).then(page => {
				let marginalia = this.readMarginalia(page, model);
				// Keep a synchronous mask lookup beside the existing bounded promise
				// cache, so visible neighboring pages share the Exclude setting.
				if (this.cache.has(index)) this.marginaliaByPage.set(index, marginalia);
				return { index, aspect: page.aspect, bounds: getReadingBounds(page.image, page.lines, model, page.index),
					marginalia,
					withMarginalia: getReadingBounds(page.image, page.lines, model, page.index, { includeMarginalia: true }) };
			}).catch(error => { console.error(error); return { bounds: null }; }));
			if (this.cache.size > 32) {
				let oldest = this.cache.keys().next().value;
				this.cache.delete(oldest); this.marginaliaByPage.delete(oldest);
			}
		}
		let page = await this.cache.get(index);
		let actual = includeMarginalia ? page.withMarginalia : page.bounds;
		if (!actual) return [0, 0, 1, 1];
		let bounds = Math.abs(page.aspect / model.aspect - 1) > 0.05 ? actual
			: resolveReadingBounds(actual, index, includeMarginalia ? model.withMarginalia : model);
		return rotateReadingBounds(bounds, this.viewer.pagesRotation);
	}

	readMarginalia(page, model) {
		return getReadingMarginalia(page.lines, model, page.index).map(r => [
			Math.max(0, r[0] - 2 / page.image.width), Math.max(0, r[1] - 2 / page.image.height),
			Math.min(1, r[2] + 2 / page.image.width), Math.min(1, r[3] + 2 / page.image.height),
		]);
	}

	maskRectsFor(index) {
		if (!this.active || this.zooming || this.peekPageIndex === index || this.options.includeMarginalia
			|| this.options.mode !== 'content' && this.options.reference === 'page') return [];
		if (this.masks?.index === index && this.masks.rotation === this.viewer.pagesRotation) return this.masks.rects;
		return (this.marginaliaByPage.get(index) || []).map(r => rotateReadingBounds(r, this.viewer.pagesRotation));
	}


	key(options = this.options) { return JSON.stringify(options); }

	async prepare(index, options = this.options, includeNeighbors = true) {
		let v = this.viewer, c = v.container;
		if (!v.pdfDocument || this.view._destroyed || v.spreadMode !== 0) return null;
		let rotation = v.pagesRotation, inputEpoch = this.inputEpoch;
		let width = c.clientWidth, height = c.clientHeight;
		let bounds = options.mode === 'content' || options.reference !== 'page'
			? await this.boundsFor(index, options) : [0, 0, 1, 1];
		let pdfPage = await v.pdfDocument.getPage(index + 1);
		let base = pdfPage.getViewport({ scale: 96 / 72, rotation: pdfPage.rotate + rotation });
		let fit = getReadingFit({ ...options, bounds, width, height, pageWidth: base.width, pageHeight: base.height });
		let page = await this.cache.get(index);
		let marginalia = (page?.marginalia || []).map(r => rotateReadingBounds(r, rotation));
		let prepared = { index, key: this.key(options), bounds, pdfPage, fit, rotation, inputEpoch, width, height, marginalia };
		if (includeNeighbors && (options.mode === 'content' || options.reference === 'cropped-content')) {
			prepared.neighbors = (await Promise.all([index - 1, index + 1]
				.filter(i => i >= 0 && i < v.pdfDocument.numPages)
				.map(i => this.prepare(i, options, false).catch(error => { console.error(error); return null; })))).filter(Boolean);
		}
		return prepared;
	}

	commit(prepared, { alignTop = false, topFraction = 0, navigate } = {}) {
		let v = this.viewer, c = v.container;
		if (!prepared || !this.active || this.view._destroyed || v.spreadMode !== 0
				|| prepared.key !== this.key() || prepared.rotation !== v.pagesRotation
				|| prepared.inputEpoch !== this.inputEpoch || this.pointers.size
				|| prepared.width !== c.clientWidth || prepared.height !== c.clientHeight) return false;
		let { index, bounds, pdfPage, fit } = prepared;
		let page = v.getPageView(index);
		if (!page) return false;
		this.token++; this.pendingPage = false; this.win.clearTimeout(this.timer);
		this.applying = true;
		try {
			this.clearClips();
			this.peekPageIndex = null;
			this.zooming = false;
			navigate?.();
			if (!page.pdfPage) page.setPdfPage(pdfPage);
			v.currentScale = fit.scale;
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
			if (this.options.mode === 'content' || this.isCroppedWidth()) {
				let center = d.offsetLeft + d.clientLeft + (b[0] + b[2]) / 2 * d.clientWidth;
				this.cropPage(prepared);
				for (let neighbor of prepared.neighbors || []) this.cropPage(neighbor, center);
			}
			this.applied = { scale: v.currentScale, bounds, pageIndex: index, left: c.scrollLeft, top: c.scrollTop };
			this.view._booxReader?.rememberReadingView();
		}
		finally { this.applying = false; }
		this.view._render();
		this.view._updateViewStats();
		return true;
	}

	cropPage(prepared, center = null) {
		let page = this.viewer.getPageView(prepared.index);
		if (!page) return;
		if (!page.pdfPage) page.setPdfPage(prepared.pdfPage);
		let d = page.div, b = prepared.fit.bounds, pad = prepared.fit.pad;
		this.clipped.set(d, { clipPath: d.style.clipPath, translate: d.style.translate });
		d.style.clipPath = `inset(${Math.max(0, b[1] * d.clientHeight - pad)}px ${Math.max(0, (1 - b[2]) * d.clientWidth - pad)}px ${Math.max(0, (1 - b[3]) * d.clientHeight - pad)}px ${Math.max(0, b[0] * d.clientWidth - pad)}px)`;
		if (center !== null) d.style.translate = `${center - (d.offsetLeft + d.clientLeft + (b[0] + b[2]) / 2 * d.clientWidth)}px 0px`;
	}

	isCroppedWidth() { return this.options.mode === 'width' && this.options.reference === 'cropped-content'; }

	async apply({ alignTop = false } = {}) {
		let v = this.viewer, c = v.container;
		if (!this.active || !v.pdfDocument || this.view._destroyed) return false;
		if (v.spreadMode !== 0) { this.suspend(); return false; }
		let index = v.currentPageNumber - 1, token = ++this.token, scale = v.currentScale;
		let page = v.getPageView(index);
		let topFraction = (c.scrollTop - page.div.offsetTop - page.div.clientTop) / page.div.clientHeight;
		let prepared = await this.prepare(index);
		if (token !== this.token || v.currentPageNumber !== index + 1 || v.currentScale !== scale) return false;
		return this.commit(prepared, { alignTop, topFraction });
	}

	resetInput() {
		this.inputEpoch++; this.token++; this.pointers.clear(); this.pendingPage = false;
		this.touches = 0; this.touchZoom = false;
		this.win.clearTimeout(this.timer);
		if (this.zooming) this.schedule();
	}

	clearClips() {
		for (let element of this.clipped.keys()) this.restoreCrop(element);
	}

	restoreCrop(element) {
		let before = this.clipped.get(element);
		if (!before) return;
		element.style.clipPath = before.clipPath;
		element.style.translate = before.translate;
		this.clipped.delete(element);
	}

	destroy() {
		this.suspend(); this.cache.clear(); this.marginaliaByPage.clear(); this.win.clearTimeout(this.prefetchTimer);
		this.win.removeEventListener('pointerdown', this.onDown, true);
		this.win.removeEventListener('pointermove', this.onMove, true);
		this.win.removeEventListener('pointerup', this.onUp, true);
		this.win.removeEventListener('pointercancel', this.onUp, true);
		this.win.removeEventListener('resize', this.onResize);
		this.win.removeEventListener('touchstart', this.onTouch, true);
		this.win.removeEventListener('touchend', this.onTouch, true);
		this.win.removeEventListener('touchcancel', this.onTouch, true);
		this.bus.off('pagechanging', this.onPage); this.bus.off('scalechanging', this.onScale);
		this.bus.off('rotationchanging', this.onRotation);
	}
}
