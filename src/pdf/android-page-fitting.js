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
		this.clipped = new Map();
		this.onDown = event => {
			if (event.target?.closest?.('.boox-highlight-palette')) return;
			this.pointers.add(event.pointerId);
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
			if (!this.pointers.size && this.pendingPage) this.schedule();
		};
		this.onPage = () => { if (this.active && !this.applying) this.schedule(); };
		this.onScale = () => {
			if (this.active && !this.applying && (!this.applied
					|| Math.abs(this.viewer.currentScale - this.applied.scale) > 0.002)) this.suspend();
		};
		this.onRotation = () => {
			this.token++; this.clearClips();
			if (this.active) this.schedule();
		};
		this.onResize = () => { if (this.active) this.schedule(); };
		this.onScroll = () => {
			let c = this.viewer.container;
			if (this.applied && Math.abs(c.scrollLeft - this.applied.left) < 1
					&& Math.abs(c.scrollTop - this.applied.top) < 1) return;
			if (this.active && !this.applying && this.options.mode === 'content') this.schedule(180);
		};
		this.win.addEventListener('pointerdown', this.onDown, true);
		this.win.addEventListener('pointerup', this.onUp, true);
		this.win.addEventListener('pointercancel', this.onUp, true);
		this.win.addEventListener('resize', this.onResize);
		this.viewer.container.addEventListener('scroll', this.onScroll);
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
		this.clearClips();
		this.masks = null;
		this.active = this.options.mode !== 'none';
		this.applied = null;
		this.view._render();
		return this.active ? this.apply({ alignTop: true }) : Promise.resolve(true);
	}

	snapshot() { return this.active && this.applied ? { ...this.options } : null; }

	state() {
		return this.configured && !this.applying && (this.applied || !this.active)
			? { pageFitMode: this.active ? this.options.mode : 'none', pageFitRevision: this.options.revision } : {};
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
			if (this.pointers.size || this.applying || !this.active || this.view._destroyed) return;
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
			this.cache.set(index, this.readPage(index, rotation).then(page => ({
				index, aspect: page.aspect, bounds: getReadingBounds(page.image, page.lines, model, page.index),
				marginalia: this.readMarginalia(page, model),
				withMarginalia: getReadingBounds(page.image, page.lines, model, page.index, { includeMarginalia: true }),
			})).catch(error => { console.error(error); return { bounds: null }; }));
			if (this.cache.size > 32) this.cache.delete(this.cache.keys().next().value);
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
		return this.active && !this.options.includeMarginalia
			&& (this.options.mode === 'content' || this.options.reference !== 'page')
			&& this.masks?.index === index && this.masks.rotation === this.viewer.pagesRotation
			? this.masks.rects : [];
	}


	key(options = this.options) { return JSON.stringify(options); }

	async prepare(index, options = this.options) {
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
		return { index, key: this.key(options), bounds, pdfPage, fit, rotation, inputEpoch, width, height, marginalia };
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
			this.clearClips();
			this.masks = { index, rotation: v.pagesRotation, rects: prepared.marginalia };
			if (this.options.mode === 'content' || this.isCroppedWidth()) {
				this.clipped.set(d, d.style.clipPath);
				d.style.clipPath = `inset(${Math.max(0, b[1] * d.clientHeight - fit.pad)}px ${Math.max(0, (1 - b[2]) * d.clientWidth - fit.pad)}px ${Math.max(0, (1 - b[3]) * d.clientHeight - fit.pad)}px ${Math.max(0, b[0] * d.clientWidth - fit.pad)}px)`;
			}
			this.applied = { scale: v.currentScale, bounds, pageIndex: index, left: c.scrollLeft, top: c.scrollTop };
		}
		finally { this.applying = false; }
		this.view._render();
		this.view._updateViewStats();
		this.win.clearTimeout(this.prefetchTimer);
		this.prefetchTimer = this.win.setTimeout(() => {
			if (!this.active || this.view._destroyed) return;
			for (let neighbor of [index - 1, index + 1]) {
				if (neighbor >= 0 && neighbor < v.pdfDocument.numPages) this.boundsFor(neighbor).catch(console.error);
			}
		}, 180);
		return true;
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
		this.win.clearTimeout(this.timer);
	}

	clearClips() {
		for (let [element, before] of this.clipped) element.style.clipPath = before;
		this.clipped.clear();
	}

	destroy() {
		this.suspend(); this.cache.clear(); this.win.clearTimeout(this.prefetchTimer);
		this.win.removeEventListener('pointerdown', this.onDown, true);
		this.win.removeEventListener('pointerup', this.onUp, true);
		this.win.removeEventListener('pointercancel', this.onUp, true);
		this.win.removeEventListener('resize', this.onResize);
		this.viewer.container.removeEventListener('scroll', this.onScroll);
		this.bus.off('pagechanging', this.onPage); this.bus.off('scalechanging', this.onScale);
		this.bus.off('rotationchanging', this.onRotation);
	}
}
