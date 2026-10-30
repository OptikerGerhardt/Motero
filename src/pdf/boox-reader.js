import highlightIcon from '!!raw-loader!../../res/icons/16/annotate-highlight.svg';
import underlineIcon from '!!raw-loader!../../res/icons/16/annotate-underline.svg';
import { ANNOTATION_COLORS, PDF_NOTE_DIMENSIONS } from '../common/defines';
import { getSortIndex } from './selection';

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
			if (this.isOverview()) {
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

	readingModeForScale(scale) {
		if (this.view._pageFitting?.active && Math.abs((this.view._pageFitting.applied?.scale || 0) - scale) < 0.002) return 'pageFit';
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
		this.addBookmark(pageIndex).catch(console.error);
		return true;
	}

	addBookmark(pageIndex) {
		if (!this.bookmarkRequests.has(pageIndex)) {
			this.bookmarkRequests.set(pageIndex, this.placeBookmark(pageIndex)
				.finally(() => this.bookmarkRequests.delete(pageIndex)));
		}
		return this.bookmarkRequests.get(pageIndex);
	}

	async placeBookmark(pageIndex) {
		let view = this.view, page = this.viewer.getPageView(pageIndex);
		if (!page?.pdfPage || view._destroyed || view._readOnly) return;
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
		let existing = view._annotations.find(a => a.type === 'note'
			&& /^(Lesezeichen|Bookmark) · /.test(a.comment || '') && a.position.pageIndex === pageIndex);
		if (existing) {
			if (!existing.readOnly && JSON.stringify(existing.position) !== JSON.stringify(position)) {
				view._onUpdateAnnotations([{ id: existing.id, position, sortIndex: getSortIndex(view._pdfPages, position) }]);
			}
			view._onSelectAnnotations([existing.id]);
		}
		else view._onAddAnnotation({ type: 'note', color: '#aaaaaa', position,
			pageLabel: view._getPageLabel(pageIndex, true), sortIndex: getSortIndex(view._pdfPages, position),
			comment: (this.de ? 'Lesezeichen' : 'Bookmark') + ' · '
				+ new Intl.DateTimeFormat(this.de ? 'de-DE' : undefined,
					{ dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
		});
	}

	async enterPage(pageIndex) {
		let v = this.viewer, view = this.view;
		let restoreFit = this.readingMode === 'pageFit' && this.readingFit;
		let restoreContent = this.readingMode === 'content' && view._contentFit && v.spreadMode === 0;
		let request = this.entering = {};
		this.clearNavigation();
		view._cancelPendingPageTurn();
		view._onManualNavigation();
		view._history?.save(view._getHistoryLocation(), true);
		try {
			if (restoreFit) {
				let prepared = await view._pageFitting.prepare(pageIndex, restoreFit);
				if (view._destroyed || this.entering !== request || v.scrollMode !== 2) return;
				await view._pageFitting.configure(restoreFit, false);
				view._pageFitting.active = true;
				view._pageFitting.commit(prepared, { alignTop: true,
					navigate: () => v.scrollPageIntoView({ pageNumber: pageIndex + 1 }) });
				return;
			}
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
			view._updateViewStats();
		}
		finally { if (this.entering === request) this.entering = null; }
	}

	showPalette(annotations) {
		this.closePalette();
		if (!annotations.length || this.view._readOnly) return;
		let box = this.doc.createElement('div');
		box.className = 'boox-highlight-palette';
		box.setAttribute('role', 'toolbar');
		box.setAttribute('aria-label', this.de ? 'Markierung' : 'Annotation');
		// Use the original Zotero theme tokens, including the outer Android host's dark scheme.
		let theme = this.win.parent.getComputedStyle(this.win.parent.document.documentElement);
		for (let name of ['--color-background', '--fill-primary', '--fill-quinary', '--color-border', '--accent-blue']) {
			let value = theme.getPropertyValue(name); if (value) box.style.setProperty(name, value);
		}
		box.style.cssText += 'position:fixed;z-index:10000;display:flex;flex-direction:column;padding:4px;max-width:calc(100vw - 12px);background:var(--color-background,#fff);color:var(--fill-primary,#222);border-radius:6px;box-shadow:0 2px 10px #0002,0 0 0 1px var(--color-border,#ddd);box-sizing:border-box;';
		for (let event of ['pointerdown', 'pointerup', 'mousedown', 'touchstart', 'touchend']) box.addEventListener(event, e => e.stopPropagation());
		let colors = this.doc.createElement('div');
		colors.style.cssText = 'display:flex;overflow-x:auto;max-width:100%;';
		let labels = this.de ? ['Gelb', 'Rot', 'Grün', 'Blau', 'Violett', 'Magenta', 'Orange', 'Grau']
			: ['Yellow', 'Red', 'Green', 'Blue', 'Purple', 'Magenta', 'Orange', 'Gray'];
		ANNOTATION_COLORS.forEach(([, color], index) => {
			let button = this.doc.createElement('button');
			button.type = 'button'; button.dataset.color = color;
			button.setAttribute('aria-label', labels[index]);
			button.setAttribute('aria-pressed', String(annotations[0].color === color));
			button.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:0 0 38px;width:38px;height:40px;border:0;border-radius:4px;background:transparent;padding:0;';
			let circle = this.doc.createElement('span');
			circle.style.cssText = `display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${color};color:#111;font:18px sans-serif;`;
			circle.textContent = annotations[0].color === color ? '✓' : ''; button.append(circle);
			button.addEventListener('click', event => {
				event.preventDefault(); event.stopPropagation();
				let ids = new Set(annotations.map(a => a.id));
				let current = this.view._annotations.filter(a => ids.has(a.id) && !a.readOnly);
				if (!this.view._readOnly && current.length) this.view._onUpdateAnnotations(current.map(a => ({ id: a.id, color })));
				this.closePalette();
			});
			colors.append(button);
		});
		box.append(colors);
		let tools = this.doc.createElement('div');
		tools.style.cssText = 'display:flex;justify-content:center;gap:4px;border-top:1px solid var(--color-border,#ddd);padding-top:4px;margin-top:4px;';
		for (let [type, icon, label] of [['highlight', highlightIcon, this.de ? 'Hervorheben' : 'Highlight'], ['underline', underlineIcon, this.de ? 'Unterstreichen' : 'Underline']]) {
			let button = this.doc.createElement('button'); button.type = 'button'; button.dataset.type = type;
			button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', String(annotations[0].type === type));
			button.style.cssText = `display:flex;align-items:center;justify-content:center;width:48px;height:40px;border:0;border-radius:4px;color:inherit;background:${annotations[0].type === type ? 'var(--fill-quinary,#0001)' : 'transparent'};`;
			button.innerHTML = icon; let svg = button.querySelector('svg'); svg.style.width = svg.style.height = '20px';
			button.addEventListener('click', event => {
				event.preventDefault(); event.stopPropagation();
				if (this.view._readOnly) return;
				let ids = annotations.filter(a => !a.readOnly && this.view._annotations.some(x => x.id === a.id)).map(a => a.id);
				if (!ids.length) return;
				this.view._directHighlightType = type;
				let converted = this.view._onConvertAnnotations(ids, type);
				this.showPalette(converted);
			});
			tools.append(button);
		}
		box.append(tools);
		this.doc.body.append(box); this.palette = box;
		let rect = this.view.getClientRectForPopup(annotations.at(-1).position);
		let width = box.offsetWidth, height = box.offsetHeight;
		let below = rect[3] + height + 10 < this.win.innerHeight;
		let left = Math.max(6, Math.min((rect[0] + rect[2] - width) / 2, this.win.innerWidth - width - 6));
		box.style.left = left + 'px';
		box.style.top = (below ? rect[3] + 8 : Math.max(6, rect[1] - height - 8)) + 'px';
		let arrow = this.doc.createElement('span'); arrow.className = 'boox-palette-arrow';
		arrow.style.cssText = `position:absolute;width:10px;height:10px;left:${Math.max(8, Math.min(width - 18, (rect[0] + rect[2]) / 2 - left - 5))}px;${below ? 'top:-5px' : 'bottom:-5px'};background:var(--color-background,#fff);transform:rotate(45deg);pointer-events:none;`;
		box.append(arrow);
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
