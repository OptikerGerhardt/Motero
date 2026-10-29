import { ANNOTATION_COLORS, PDF_NOTE_DIMENSIONS } from '../common/defines';
import { getSortIndex } from './selection';

// Small Android-only controls use existing annotation persistence and PDF.js
// geometry. They do not add a new data format, PDF mutation, or drawing loop.
export class PDFBooxReader {
	constructor(view) {
		this.view = view;
		this.win = view._iframeWindow;
		this.doc = this.win.document;
		this.de = (this.doc.documentElement.lang || navigator.language || '').startsWith('de');
		this.onDown = event => {
			if (this.palette?.contains(event.target)) return;
			this.entering = null;
			this.closePalette();
			if (!event.isPrimary || !event.target.closest?.('.page')) return;
			if (!this.isOverview()) {
				this.zoomOrigin = { scale: this.viewer.currentScale,
					mode: this.readingModeForScale(this.viewer.currentScale) };
			}
			this.gestureScroll = {
				top: this.viewer.container.scrollTop, scale: this.viewer.currentScale,
				forward: this.captureEdge(true), backward: this.captureEdge(false),
			};
			this.win.clearTimeout(this.gestureExpiry);
		};
		this.onUp = () => {
			this.win.clearTimeout(this.gestureExpiry);
			this.gestureExpiry = this.win.setTimeout(() => this.gestureScroll = null, 1000);
		};
		this.onKey = event => { if (event.key === 'Escape') this.closePalette(); };
		this.onScale = () => {
			this.clearNavigation();
			let scale = this.viewer.currentScale;
			if (this.isOverview()) {
				let origin = this.zoomOrigin || { scale: this.readingScale,
					mode: this.readingModeForScale(this.readingScale) };
				if (origin.scale) { this.readingScale = origin.scale; this.readingMode = origin.mode; }
			}
			else { this.readingScale = scale; this.readingMode = this.readingModeForScale(scale); }
		};
		this.onPage = () => {
			this.closePalette();
			if (this.edge && this.edge.pageIndex !== this.viewer.currentPageNumber - 1) this.clearEdge();
		};
		this.doc.addEventListener('pointerdown', this.onDown, true);
		this.doc.addEventListener('pointerup', this.onUp, true);
		this.doc.addEventListener('pointercancel', this.onUp, true);
		this.doc.addEventListener('keydown', this.onKey, true);
		this.bus = this.win.PDFViewerApplication.eventBus;
		this.bus.on('scalechanging', this.onScale);
		this.bus.on('pagechanging', this.onPage);
		this.bus.on('rotationchanging', this.onScale);
		this.viewportWidth = this.viewer.container.clientWidth;
		this.onResize = () => {
			let width = this.viewer.container.clientWidth;
			if (width !== this.viewportWidth) this.clearNavigation(true);
			else {
				// Coupled native bars change the WebView's height after scrolling.
				// The old reading edge is still the same PDF point in that case.
				this.entering = null;
				this.closePalette();
				if (this.edge) this.showEdge(this.edge);
			}
			this.viewportWidth = width;
		};
		this.win.addEventListener('resize', this.onResize);
	}

	get viewer() { return this.win.PDFViewerApplication.pdfViewer; }

	readingModeForScale(scale) {
		if (scale && Math.abs((this.view._appliedContentFit?.scale || 0) - scale) < 0.002) return 'content';
		return this.viewer.currentScaleValue === 'page-width' ? 'width' : 'manual';
	}

	isOverview(page = this.viewer.getPageView(this.viewer.currentPageNumber - 1)) {
		let v = this.viewer, c = v.container;
		if (v.scrollMode !== 2 || !page?.pdfPage || !(v.currentScale > 0)) return false;
		let width = page.viewport.width, height = page.viewport.height;
		let reading = this.readingScale || v.currentScale * (c.clientWidth - 32) / width;
		return width < c.clientWidth * 0.86 && height < c.clientHeight * 0.94
			&& v.currentScale < reading * 0.86;
	}

	handleTap(event, position) {
		let view = this.view;
		if (this.entering || view._destroyed || view._tool.type !== 'pointer') return false;
		// The outer viewer gutter is part of the touch target too. It has no PDF
		// position, so anchor such a tap to the current reading page.
		let pageIndex = position?.pageIndex ?? this.viewer.currentPageNumber - 1;
		let page = this.viewer.getPageView(pageIndex);
		if (this.isOverview(page)) {
			if (!position) return false;
			this.enterPage(pageIndex).catch(error => console.error(error));
			return true;
		}
		if (view._readOnly || (position && (view._getSelectableOverlay(position)
				|| view.getSelectableAnnotations(position)?.length))) return false;
		let bounds = this.viewer.container.getBoundingClientRect();
		let x = event.clientX - bounds.left, y = event.clientY - bounds.top;
		// The upper-right half of the first 1/11 of the reading viewport is
		// the bookmark target, including the outer page-turn strip.
		if (x < bounds.width / 2 || x > bounds.width || y < 0 || y > bounds.height / 11) return false;
		if (!page?.pdfPage) return false;
		// Store one fixed PDF position, independent of tap coordinates or zoom.
		// About 1cm from the paper's right edge; 4pt below its upper edge.
		let viewport = page.pdfPage.getViewport({ scale: 1, rotation: page.viewport.rotation });
		let size = PDF_NOTE_DIMENSIONS;
		let right = Math.max(size, viewport.width - 72 / 2.54);
		let top = Math.min(4, Math.max(0, viewport.height - size));
		let p0 = viewport.convertToPdfPoint(right - size, top);
		let p1 = viewport.convertToPdfPoint(right, top + size);
		let notePosition = { pageIndex, rects: [[
			Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]),
			Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1]),
		]] };
		let existing = view._annotations.find(a => a.type === 'note'
			&& /^(Lesezeichen|Bookmark) · /.test(a.comment || '')
			&& a.position.pageIndex === pageIndex);
		if (existing) view._onSelectAnnotations([existing.id]);
		else view._onAddAnnotation({
			type: 'note', color: '#aaaaaa', position: notePosition,
			pageLabel: view._getPageLabel(pageIndex, true),
			sortIndex: getSortIndex(view._pdfPages, notePosition),
			comment: (this.de ? 'Lesezeichen' : 'Bookmark') + ' · '
				+ new Intl.DateTimeFormat(this.de ? 'de-DE' : undefined,
					{ dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
		});
		return true;
	}

	async enterPage(pageIndex) {
		let v = this.viewer, view = this.view;
		let restoreContent = this.readingMode === 'content' && view._contentFit && v.spreadMode === 0;
		let request = this.entering = {};
		this.clearNavigation();
		view._cancelPendingPageTurn();
		view._onManualNavigation();
		view._history?.save(view._getHistoryLocation(), true);
		try {
			v.scrollPageIntoView({ pageNumber: pageIndex + 1 });
			if (restoreContent) {
				await view.fitToContent({ margin: view._contentFit.margin });
			}
			else v.currentScaleValue = this.readingMode === 'width' ? 'page-width'
				: this.readingScale || 'page-width';
			await new Promise(resolve => this.win.requestAnimationFrame(() => this.win.requestAnimationFrame(resolve)));
			if (view._destroyed || v.scrollMode !== 2 || this.entering !== request) return;
			let page = v.getPageView(pageIndex), c = v.container;
			// Changing the scale reflows Wrapped rows. Resolve the same target again.
			v.scrollPageIntoView({ pageNumber: pageIndex + 1 });
			if (!restoreContent) {
				c.scrollLeft = page.div.offsetLeft + page.div.clientLeft
					+ Math.max(0, (page.div.clientWidth - c.clientWidth) / 2);
			}
			else {
				// The second scrollPageIntoView reset X; reapply this page's content fit.
				await view.fitToContent({ margin: view._contentFit.margin });
			}
			view._updateViewStats();
		}
		finally { if (this.entering === request) this.entering = null; }
	}

	showPalette(annotations) {
		this.closePalette();
		if (!annotations.length) return;
		let box = this.doc.createElement('div');
		box.className = 'boox-highlight-palette';
		box.setAttribute('role', 'toolbar');
		box.setAttribute('aria-label', this.de ? 'Markierungsfarbe' : 'Highlight color');
		box.style.cssText = 'position:fixed;z-index:10000;display:flex;gap:3px;padding:5px;max-width:calc(100vw - 12px);overflow-x:auto;background:white;border:2px solid #555;border-radius:8px;box-sizing:border-box;';
		for (let event of ['pointerdown', 'pointerup', 'mousedown', 'touchstart', 'touchend']) {
			box.addEventListener(event, e => e.stopPropagation());
		}
		let labels = this.de ? ['Gelb', 'Rot', 'Grün', 'Blau', 'Violett', 'Magenta', 'Orange', 'Grau']
			: ['Yellow', 'Red', 'Green', 'Blue', 'Purple', 'Magenta', 'Orange', 'Gray'];
		ANNOTATION_COLORS.forEach(([, color], index) => {
			let button = this.doc.createElement('button');
			button.type = 'button';
			button.dataset.color = color;
			button.setAttribute('aria-label', labels[index]);
			button.setAttribute('aria-pressed', String(annotations[0].color === color));
			button.style.cssText = `flex:0 0 38px;width:38px;height:40px;border:2px solid #555;border-radius:5px;background:${color};color:#111;padding:0;font:bold 22px sans-serif;`;
			button.textContent = annotations[0].color === color ? '✓' : '';
			button.addEventListener('click', event => {
				event.preventDefault(); event.stopPropagation();
				let ids = new Set(annotations.map(a => a.id));
				let current = this.view._annotations.filter(a => ids.has(a.id) && !a.readOnly);
				if (!this.view._readOnly && current.length) {
					this.view._onUpdateAnnotations(current.map(a => ({ id: a.id, color })));
				}
				this.closePalette();
			});
			box.append(button);
		});
		this.doc.body.append(box);
		this.palette = box;
		let rect = this.view.getClientRectForPopup(annotations.at(-1).position);
		let width = box.offsetWidth, height = box.offsetHeight;
		box.style.left = Math.max(6, Math.min((rect[0] + rect[2] - width) / 2, this.win.innerWidth - width - 6)) + 'px';
		box.style.top = (rect[3] + height + 10 < this.win.innerHeight
			? rect[3] + 8 : Math.max(6, rect[1] - height - 8)) + 'px';
	}

	closePalette() { this.palette?.remove(); this.palette = null; }

	captureEdge(next) {
		let v = this.viewer, p = v.getPageView(v.currentPageNumber - 1), c = v.container;
		if (!p?.pdfPage) return null;
		let r = p.div.getBoundingClientRect(), b = c.getBoundingClientRect();
		let y = (next ? b.top + c.clientTop + c.clientHeight : b.top + c.clientTop) - r.top - p.div.clientTop;
		if (y < 0 || y > p.div.clientHeight) return null;
		return { pageIndex: p.id - 1, scale: v.currentScale,
			point: p.getPagePoint(0, y) };
	}

	showEdge(edge) {
		this.clearEdge();
		if (!edge || edge.scale !== this.viewer.currentScale || this.view._destroyed) return;
		let p = this.viewer.getPageView(edge.pageIndex), c = this.viewer.container;
		if (!p?.pdfPage) return;
		let [, y] = p.viewport.convertToViewportPoint(...edge.point);
		let b = c.getBoundingClientRect(), r = p.div.getBoundingClientRect();
		if (r.top + y <= b.top + 2 || r.top + y >= b.bottom - 2) return;
		let line = this.doc.createElement('div');
		line.className = 'boox-reading-edge';
		line.setAttribute('aria-hidden', 'true');
		line.style.cssText = `position:absolute;left:0;right:0;top:${y}px;border-top:2px dashed #777;opacity:0.5;z-index:20;pointer-events:none;`;
		p.div.append(line);
		this.edge = edge;
		this.edgeElement = line;
	}

	onScroll() {
		this.closePalette();
		let gesture = this.gestureScroll, v = this.viewer;
		if (!gesture || gesture.scale !== v.currentScale || Math.abs(v.container.scrollTop - gesture.top) < 3) return;
		let edge = v.container.scrollTop > gesture.top ? gesture.forward : gesture.backward;
		this.win.clearTimeout(this.scrollSettled);
		this.scrollSettled = this.win.setTimeout(() => {
			if (edge?.pageIndex === v.currentPageNumber - 1) this.showEdge(edge);
			else this.clearEdge();
			this.gestureScroll = null;
		}, 160);
	}

	clearEdge() { this.edgeElement?.remove(); this.edgeElement = null; this.edge = null; }

	clearNavigation(cancelEntry = false) {
		if (cancelEntry) this.entering = null;
		this.closePalette(); this.clearEdge(); this.gestureScroll = null;
		this.win.clearTimeout(this.scrollSettled);
	}

	destroy() {
		this.clearNavigation(); this.win.clearTimeout(this.gestureExpiry);
		this.doc.removeEventListener('pointerdown', this.onDown, true);
		this.doc.removeEventListener('pointerup', this.onUp, true);
		this.doc.removeEventListener('pointercancel', this.onUp, true);
		this.doc.removeEventListener('keydown', this.onKey, true);
		this.bus.off('scalechanging', this.onScale);
		this.bus.off('pagechanging', this.onPage);
		this.bus.off('rotationchanging', this.onScale);
		this.win.removeEventListener('resize', this.onResize);
	}
}
