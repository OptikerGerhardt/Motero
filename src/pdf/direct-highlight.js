import { HoldToHighlight } from './hold-to-highlight.mjs';
import { getWordSelectionRanges } from './selection';
import { ANNOTATION_COLORS } from '../common/defines';

// Uses the reader's extracted PDF characters, never Android's selection handles.
export class PDFDirectHighlight {
	constructor(view) {
		this.view = view;
		this.handledUps = new WeakSet();
		this.gesture = new HoldToHighlight({
			canStart: event => this.canStart(event),
			prepare: event => this.prepare(event),
			start: (prepared, event) => this.start(prepared, event),
			update: event => this.update(event),
			finish: () => this.finish(),
			cancel: () => this.clear(),
			tap: (down, up) => {
				this.bypass = true;
				try {
					view._handlePointerDown(down);
					view._handlePointerUp(up);
				}
				finally {
					this.bypass = false;
				}
			},
		});
	}

	get enabled() {
		return this.view._options.platform === 'android'
			&& this.view._directHighlightEnabled
			&& !this.view._readOnly
			&& ['pointer', 'highlight', 'underline'].includes(this.view._tool.type);
	}

	canStart(event) {
		if (!this.enabled || !event.target.closest?.('.page')
				|| event.target.closest?.('textarea, input, [contenteditable="true"], .textAnnotation')) {
			return false;
		}
		let position = this.view.pointerEventToPosition(event);
		// Existing notes, links, and selected annotation resize handles keep their gestures.
		return !!position && !this.view._getSelectableOverlay(position)
			&& !this.view.getSelectableAnnotations(position)?.length;
	}

	async prepare(event) {
		let view = this.view;
		let position = view.pointerEventToPosition(event);
		if (!position) {
			return null;
		}
		await view._ensureBasicPageData(position.pageIndex);
		if (view._destroyed || !this.enabled) {
			return null;
		}
		let chars = view._pdfPages[position.pageIndex]?.chars;
		let [x, y] = position.rects[0];
		let scale = view._iframeWindow.PDFViewerApplication.pdfViewer.currentScale * 96 / 72;
		let tolerance = 6 / scale;
		// A hold in the margin or in an image must not select the nearest paragraph.
		if (!chars?.some(({ rect }) => x >= rect[0] - tolerance && x <= rect[2] + tolerance
				&& y >= rect[1] - tolerance && y <= rect[3] + tolerance)) {
			return null;
		}
		let ranges = getWordSelectionRanges(view._pdfPages, position, position);
		return ranges.length && !ranges[0].collapsed ? { position, ranges } : null;
	}

	start({ position, ranges }) {
		let view = this.view;
		view._clearPointerAction();
		view._clearPendingBackdropTap();
		view._nativeTextSelection?.clear();
		view._onSelectAnnotations([]);
		view._onSetAnnotationPopup(null);
		view._onSetSelectionPopup(null);
		this.anchor = position;
		view._selectionRanges = ranges;
		view._render();
	}

	update(event) {
		let view = this.view;
		let position = view.pointerEventToPosition(event);
		if (!position || !view._pdfPages[position.pageIndex]?.chars?.length) {
			return;
		}
		for (let i = Math.min(this.anchor.pageIndex, position.pageIndex);
			i <= Math.max(this.anchor.pageIndex, position.pageIndex); i++) {
			if (!view._pdfPages[i]?.chars) return;
		}
		let ranges = getWordSelectionRanges(view._pdfPages, this.anchor, position);
		if (ranges.length && !ranges[0].collapsed) {
			view._selectionRanges = ranges;
			view._render();
		}
	}

	finish() {
		let view = this.view;
		if (!this.enabled || view._destroyed) {
			this.clear();
			return;
		}
		let ranges = view._selectionRanges.filter(range => !range.collapsed)
			.sort((a, b) => a.pageIndex - b.pageIndex);
		let type = ['highlight', 'underline'].includes(view._tool.type) ? view._tool.type : view._directHighlightType || 'highlight';
		let color = /^#[\da-f]{6}$/i.test(view._tool.color) ? view._tool.color
			: view._directHighlightColor || view._tools?.highlight?.color || ANNOTATION_COLORS[0][1];
		let created = [];
		// The annotation format supports two adjacent pages per highlight.
		while (ranges.length) {
			let group = [ranges.shift()];
			if (ranges[0]?.pageIndex === group[0].pageIndex + 1) {
				group.push(ranges.shift());
			}
			let annotation = view._getAnnotationFromSelectionRanges(group, type, color);
			if (annotation?.text?.trim()) {
				let saved = view._onAddAnnotation(annotation);
				if (saved) created.push(saved);
			}
		}
		this.clear();
		view._booxReader?.showPalette(created);
		this.suppressUntil = Date.now() + 800;
	}

	clear() {
		this.anchor = null;
		this.view._selectionRanges = [];
		this.view._onSetSelectionPopup(null);
		this.view._clearPointerAction();
		this.view._render();
	}

	down(event) {
		if (this.bypass || !this.enabled) {
			return false;
		}
		let handled = this.gesture.down(event);
		if (handled) {
			this.view._suppressCompatibilityMouseUntil = Date.now() + 1500;
			// Pen input emits a compatibility mousedown immediately, unlike finger input.
			if (event.pointerType === 'pen' && event.cancelable) event.preventDefault();
		}
		return handled;
	}

	move(event) {
		return !this.bypass && this.gesture.move(event);
	}

	up(event) {
		if (this.bypass) return false;
		if (this.handledUps.has(event)) return true;
		let handled = !this.bypass && this.gesture.up(event);
		if (handled) {
			this.handledUps.add(event);
			this.view._suppressCompatibilityMouseUntil = Date.now() + 800;
		}
		return handled;
	}

	touchStart(event) {
		if (event.touches.length > 1) {
			this.gesture.abort();
		}
	}

	touchMove(event) {
		if (event.touches.length > 1) {
			this.gesture.abort();
			return false;
		}
		if (!this.gesture.active) {
			return false;
		}
		if (event.cancelable) {
			event.preventDefault();
		}
		let touch = event.touches[0];
		if (touch) {
			this.update(touch);
		}
		return true;
	}

	contextMenu(event) {
		if (this.gesture.state || Date.now() < this.suppressUntil) {
			event.preventDefault();
			return true;
		}
		return false;
	}

	reset() {
		this.gesture.reset();
	}
}
