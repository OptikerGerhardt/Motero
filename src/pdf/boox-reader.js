import { showAnnotationPalette } from '../common/mobile-annotation-palette';
import { PDF_NOTE_DIMENSIONS } from '../common/defines';
import { getSortIndex } from './selection';
import { readingUnit, unitFrame } from './reading-unit.mjs';

// Small Android-only controls use existing annotation persistence and PDF.js
// geometry. They do not add a new data format, PDF mutation, or drawing loop.
export class PDFBooxReader {
	constructor(view) {
		this.view = view;
		this.bookmarkRequests = new Map();
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
					mode: this.readingModeForScale(this.viewer.currentScale), fit: this.view._pageFitting?.snapshot() };
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
			let fitting = this.view._pageFitting;
			// Its own scale event precedes the new applied snapshot. Remember
			// that completed state in commit(), rather than calling it manual.
			if (fitting?.applying) return;
			// Native zoom buttons and a pinch starting in the page gutter have
			// no page pointerdown. Preserve the fit before its scale listener
			// suspends it, just as a pinch starting on the page does.
			if (!this.zoomOrigin && fitting?.active && fitting.applied
					&& Math.abs(scale - fitting.applied.scale) > 0.002) {
				this.zoomOrigin = { scale: fitting.applied.scale, mode: 'pageFit', fit: fitting.snapshot() };
			}
			if (fitting?.presentation === 'peek' || this.isOverview()) {
				let origin = this.zoomOrigin || { scale: this.readingScale,
					mode: this.readingModeForScale(this.readingScale), fit: this.readingFit };
				if (origin.scale) { this.readingScale = origin.scale; this.readingMode = origin.mode; this.readingFit = origin.fit; }
			}
			else { this.readingScale = scale; this.readingMode = this.readingModeForScale(scale); this.readingFit = this.view._pageFitting?.snapshot(); }
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

	rememberReadingView() {
		this.readingScale = this.viewer.currentScale;
		this.readingMode = this.readingModeForScale(this.readingScale);
		this.readingFit = this.view._pageFitting?.snapshot();
		this.zoomOrigin = null;
	}

	readingModeForScale(scale) {
		if (this.view._pageFitting?.active && Math.abs((this.view._pageFitting.applied?.scale || 0) - scale) < 0.002) return 'pageFit';
		if (scale && Math.abs((this.view._appliedContentFit?.scale || 0) - scale) < 0.002) return 'content';
		return this.viewer.currentScaleValue === 'page-width' ? 'width' : 'manual';
	}

	isOverview(page = this.viewer.getPageView(this.viewer.currentPageNumber - 1)) {
		let v = this.viewer, c = v.container;
		if (this.view._pageFitting?.presentation === 'overview') return true;
        if (!page?.pdfPage || !(v.currentScale > 0)) return false;
		const indices = readingUnit(page.id-1,v.pagesCount || v._pages?.length || page.id,v.spreadMode);
        const rects = indices.map(i=>v.getPageView(i)?.div?.getBoundingClientRect?.()).filter(Boolean);
        const frame = rects.length === indices.length && unitFrame(rects,rects.map((_,i)=>i));
        let width = frame ? frame.right-frame.left : page.viewport.width;
        let height = frame ? frame.bottom-frame.top : page.viewport.height;
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
		if (view._readOnly) return false;
		let bounds = this.viewer.container.getBoundingClientRect();
		let x = event.clientX - bounds.left, y = event.clientY - bounds.top;
		// The upper-right half of the first 1/11 of the reading viewport is
		// the bookmark target, including the outer page-turn strip.
		if (x < bounds.width / 2 || x > bounds.width || y < 0 || y > bounds.height / 11) return false;
		this.addBookmark(view._pageFitting?.centeredPageIndex() ?? this.viewer.currentPageNumber-1).catch(console.error);
		return true;
	}

	addBookmark(pageIndex) {
		let previous = this.bookmarkRequests.get(pageIndex) || Promise.resolve();
		let request = previous.catch(() => {}).then(() => this.placeBookmark(pageIndex));
		this.bookmarkRequests.set(pageIndex, request);
		return request.finally(() => {
			if (this.bookmarkRequests.get(pageIndex) === request) this.bookmarkRequests.delete(pageIndex);
		});
	}

	async placeBookmark(pageIndex) {
		let view = this.view, page = this.viewer.getPageView(pageIndex);
        if (!page || view._destroyed || view._readOnly) return;
		let existing = view._annotations.find(a => a.type === 'note'
			&& /^(Lesezeichen|Bookmark) · /.test(a.comment || '') && a.position.pageIndex === pageIndex);
		if (existing) {
			if (!existing.readOnly) view._onDeleteAnnotationsFromPalette([existing.id]);
			return;
		}
        if (!page.pdfPage) {
            const pdfPage = await this.viewer.pdfDocument.getPage(pageIndex+1);
            if (view._destroyed) return;
            page.setPdfPage(pdfPage);
        }
		let rotation = page.viewport.rotation;
		// Always use the unpadded content frame, including when paper/manual fit is selected.
		let bounds = await view._pageFitting.boundsFor(pageIndex);
		if (view._destroyed || view._readOnly || page.viewport.rotation !== rotation) return;
		let viewport = page.pdfPage.getViewport({ scale: 1, rotation });
		let size = Math.min(PDF_NOTE_DIMENSIONS, (bounds[2] - bounds[0]) * viewport.width,
			(bounds[3] - bounds[1]) * viewport.height);
		let right = Math.max(bounds[0] * viewport.width + size, bounds[2] * viewport.width - 8);
		let top = Math.max(bounds[1] * viewport.height,
			Math.min(bounds[1] * viewport.height + 4, bounds[3] * viewport.height - size));
		let p0 = viewport.convertToPdfPoint(right - size, top);
		let p1 = viewport.convertToPdfPoint(right, top + size);
		let position = { pageIndex, rects: [[Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]),
			Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1])]] };
		view._onAddAnnotation({ type: 'note', color: '#000000', position,
			pageLabel: view._getPageLabel(pageIndex, true), sortIndex: getSortIndex(view._pdfPages, position),
			comment: (this.de ? 'Lesezeichen' : 'Bookmark') + ' · '
				+ new Intl.DateTimeFormat(this.de ? 'de-DE' : undefined,
					{ dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
		});
	}

	async enterPage(pageIndex) {
		let v = this.viewer, view = this.view;
		let restoreFit = this.readingMode === 'pageFit' && this.readingFit;
		let restoreContent = this.readingMode === 'content' && view._contentFit ;
		let request = this.entering = {};
		this.clearNavigation();
		view._cancelPendingPageTurn();
		view._onManualNavigation();
		view._history?.save(view._getHistoryLocation(), true);
		try {
			if (restoreFit) {
				let prepared = await view._pageFitting.prepare(pageIndex, restoreFit);
				if (view._destroyed || this.entering !== request) return;
				await view._pageFitting.configure(restoreFit, false);
				view._pageFitting.active = true; view._pageFitting.presentation='reading';
				if (view._pageFitting.commit(prepared, { alignTop:true,
                        navigate:()=>v.scrollPageIntoView({pageNumber:pageIndex+1}) })) return;
                    if (this.entering !== request) return;
			}
			v.scrollPageIntoView({ pageNumber: pageIndex + 1 });
			if (restoreContent) {
				await view.fitToContent({ margin: view._contentFit.margin });
			}
			else v.currentScaleValue = this.readingMode === 'width' ? 'page-width'
				: this.readingScale || 'page-width';
			await new Promise(resolve => this.win.requestAnimationFrame(() => this.win.requestAnimationFrame(resolve)));
			if (view._destroyed || this.entering !== request) return;
			let page = v.getPageView(pageIndex), c = v.container;
			// Changing the scale reflows Wrapped rows. Resolve the same target again.
			v.scrollPageIntoView({ pageNumber: pageIndex + 1 });
			if (restoreFit) {
                await view._pageFitting.apply({ alignTop: true });
            }
            else if (!restoreContent) {
				c.scrollLeft = page.div.offsetLeft + page.div.clientLeft
					+ Math.max(0, (page.div.clientWidth - c.clientWidth) / 2);
			}
			else {
				// The second scrollPageIntoView reset X; reapply this page's content fit.
				await view.fitToContent({ margin: view._contentFit.margin });
			}
			view._pageNavigation?.centerCurrentPage({force:true});
			view._updateViewStats();
		}
		finally { if (this.entering === request) this.entering = null; }
	}

	showPalette(annotations) { return showAnnotationPalette.call(this, annotations); }

	closePalette() { const palette = this.palette; this.palette = null; palette?.remove(); }

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
        this.edgeExpiry = this.win.setTimeout(() => {
            if (this.edgeElement === line) this.clearEdge();
        }, 5000);
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

	clearEdge() {
        this.win.clearTimeout(this.edgeExpiry);
        this.edgeExpiry = null;
        this.edgeElement?.remove(); this.edgeElement = null; this.edge = null;
    }

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
