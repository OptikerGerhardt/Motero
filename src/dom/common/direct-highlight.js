import { wordRange } from './mobile-word-range.mjs';
import { HoldToHighlight } from '../../pdf/hold-to-highlight.mjs';
import { showAnnotationPalette } from '../../common/mobile-annotation-palette';
import { ANNOTATION_COLORS } from '../../common/defines';

// DOM/CFI geometry with the same hold gesture and palette as PDF. Native Android
// selection stays available when selected globally. No new annotation format.
export class DOMDirectHighlight {
	constructor(view) {
		this.view = view;
		this.win = view._iframeWindow;
		this.doc = view._iframeDocument;
		this.enabled = !!view._options.directHighlight;
		this.listeners = [];
		const adapter = {
			get _annotations() { return view._annotations; },
			get _readOnly() { return view._options.readOnly; },
			_onSelectAnnotations: ids => view._options.onSelectAnnotations(ids),
			_onSetAnnotationPopup: value => view._options.onSetAnnotationPopup(value),
			_onUpdateAnnotations: value => view._options.onUpdateAnnotations(value),
			_onDeleteAnnotationsFromPalette: ids => view._options.onDeleteAnnotationsFromPalette?.(ids),
			_onConvertAnnotations: (ids, type) => view._options.onConvertAnnotations?.(ids, type) || [],
			_directHighlight: this,
			getClientRectForPopup: position => {
				const rect = view.toDisplayedRange(position)?.getBoundingClientRect();
				return rect ? [rect.left, rect.top, rect.right, rect.bottom] : [0, 0, 0, 0];
			},
		};
		this.host = { view: adapter, win: this.win, doc: this.doc,
			de: navigator.language.startsWith('de'), closePalette: () => this.closePalette(),
			showPalette: annotations => showAnnotationPalette.call(this.host, annotations) };
		this.gesture = new HoldToHighlight({
			canStart: event => this.canStart(event),
			prepare: event => this.annotationAt(event) || this.wordAt(event),
			start: (prepared, event) => this.start(prepared, event),
			update: event => this.queueUpdate(event), finish: () => this.finish(), cancel: () => this.clear(),
			tap: (down, up) => {
				this.bypass = true;
				try {
					view._handlePointerDown(down);
                    // The capture listener owns the bookmark corner, including note widgets.
                    view._bookmarkPointer = null;
                    const annotation = this.annotationAt(down);
					if (annotation) { view._options.onSelectAnnotations([annotation.id], up); view._openAnnotationPopup(annotation); }
					else view._handlePointerUp(up);
				} finally { this.bypass = false; }
			},
		});
        this.listen('pointerdown', event => {
            this.bookmarkDown = null;
            if (this.inControls(event) || view._penInput?.rejects?.(event)) return;
            if (this.host.palette) { this.closePalette(); this.dismissPointer = event.pointerId; return; }
            if (event.isPrimary && event.button === 0 && view._tool.type === 'pointer' && !view._options.readOnly
                && event.clientX >= this.win.innerWidth/2 && event.clientY >= 0 && event.clientY <= this.win.innerHeight/11
                && this.win.getSelection()?.isCollapsed && !view._selectedAnnotationIDs.filter(Boolean).length) {
                this.bookmarkDown = {x:event.clientX,y:event.clientY,time:Date.now()};
            }
            const annotation = this.annotationAt(event);
            this.gesture.delay = annotation?.id === this.editableNoteID ? 0 : 450;
            if (annotation?.id !== this.editableNoteID) this.editableNoteID = null;
            this.gesture.down(event);
		});
		this.listen('pointermove', event => this.gesture.move(event));
        this.listen('pointerup', event => {
            const down = this.bookmarkDown; this.bookmarkDown = null;
            if (down && event.isPrimary && !this.gesture.active && Date.now()-down.time<=400 && Math.hypot(event.clientX-down.x,event.clientY-down.y)<=8) {
                view._bookmarkPointer = down;
                if (view.tryCreateAndroidBookmark?.(event.clientX,event.clientY,event.target)) {
                    this.gesture.reset(); event.preventDefault(); view._preventNextClickEvent(); return;
                }
            }
            if (this.dismissPointer === event.pointerId || this.gesture.up(event)) {
				this.dismissPointer = null; event.preventDefault(); view._preventNextClickEvent();
			}
		});
		this.listen('pointercancel', event => this.gesture.interrupted(event));
		this.listen('contextmenu', event => {
			if (this.gesture.state || Date.now() < (this.suppressUntil || 0)) event.preventDefault();
		});
		this.listen('touchstart', event => { if (event.touches.length > 1) this.gesture.reset(); });
		this.listen('touchmove', event => { if (this.gesture.active && event.cancelable) event.preventDefault(); });
		this.listen('blur', event => { if (!event.target || event.target === this.win) this.reset(); });
        this.listen('dragstart', event => { if (this.gesture.state) event.preventDefault(); });
		this.setEnabled(this.enabled);
	}

	listen(type, callback) {
		this.win.addEventListener(type, callback, { capture: true, passive: false });
		this.listeners.push([type, callback]);
	}
	inControls(event) {
		return event.composedPath().some(el => el?.matches?.('.resizer, .boox-highlight-palette, input, textarea, [contenteditable="true"]'));
	}
	annotationAt(event) {
		if (!this.view._annotationShadowRoot) return null;
        const id = this.view._getAnnotationsAtPoint(event.clientX, event.clientY)[0];
		return this.view._annotationsByID.get(id);
	}
	canStart(event) {
		const view = this.view;
		if (!view.initialized || view._options.readOnly || this.inControls(event) || !['pointer', 'highlight', 'underline'].includes(view._tool.type)) return false;
		const annotation = this.annotationAt(event);
		if (annotation) return !annotation.readOnly;
		return this.enabled && !event.composedPath().some(el => el?.matches?.('a[href]')) && !!this.wordAt(event);
	}
	wordAt(event) {
		const caret = this.view._getCaretRangeAtPoint(event.clientX, event.clientY)?.toRange();
		if (!caret || caret.startContainer.nodeType !== 3) return null;
        const range = wordRange(caret);
        if (!range) return null;
		if (!Array.from(range.getClientRects()).some(r => event.clientX >= r.left - 4 && event.clientX <= r.right + 4 && event.clientY >= r.top - 4 && event.clientY <= r.bottom + 4)) return null;
		return range;
	}
	start(prepared) {
		this.view._options.onSetAnnotationPopup(null);
		this.view._options.onSetSelectionPopup(null);
		this.win.getSelection()?.removeAllRanges();
		if (prepared.id) {
			this.editing = prepared;
			this.view._options.onSelectAnnotations([prepared.id], undefined, { touchEditing: true });
			this.view._renderAnnotations(true);
            if (prepared.type === 'note') this.editableNoteID = prepared.id;
            else this.host.showPalette([prepared]);
			return;
		}
		this.anchor = prepared; this.range = prepared;
		this.view._options.onSelectAnnotations([]);
		this.preview();
	}
    queueUpdate(event) {
        this.pendingPoint = {clientX:event.clientX,clientY:event.clientY};
        if (this.pendingFrame == null) this.pendingFrame = this.win.requestAnimationFrame(() => {
            this.pendingFrame = null;
            const point = this.pendingPoint; this.pendingPoint = null;
            if (point && this.gesture.active) this.update(point);
        });
    }
    flushUpdate() {
        if (this.pendingFrame != null) this.win.cancelAnimationFrame(this.pendingFrame);
        this.pendingFrame = null;
        const point = this.pendingPoint; this.pendingPoint = null;
        if (point) this.update(point);
    }
    update(event) {
		if (this.editing) {
			if (this.editing.type !== 'note') return;
			const range = this.wordAt(event);
			if (!range) return;
			this.closePalette(); this.range = range;
			this.view._previewAnnotation = this.view.getAnnotationFromRange(range, 'note', this.editing.color);
			this.view._renderAnnotations(true);
			return;
		}
		if (!this.anchor) return;
		const target = this.wordAt(event);
		if (!target) return;
		const range = this.anchor.cloneRange();
		if (range.compareBoundaryPoints(Range.START_TO_START, target) > 0) range.setStart(target.startContainer, target.startOffset);
		else range.setEnd(target.endContainer, target.endOffset);
		this.range = range; this.preview();
	}
	preview() {
		const view = this.view;
		const type = ['highlight', 'underline'].includes(view._tool.type) ? view._tool.type : this.host.view._directHighlightType || 'highlight';
		const color = view._tool.color || ANNOTATION_COLORS[0][1];
		view._previewAnnotation = view.getAnnotationFromRange(this.range, type, color);
		view._renderAnnotations(true);
	}
    finish() {
        this.flushUpdate();
        const view = this.view;
		if (this.editing) {
			if (this.range && this.editing.type === 'note') view._options.onUpdateAnnotations([view._updateAnnotationRange(this.editing, this.range)]);
		} else if (view._previewAnnotation?.text?.trim()) {
			const saved = view._options.onAddAnnotation(view._finalizeAnnotation(view._previewAnnotation));
			if (saved) this.host.showPalette([saved]);
		}
		this.clear(); this.suppressUntil = Date.now() + 800;
	}
	clear() { if (this.pendingFrame != null) this.win.cancelAnimationFrame(this.pendingFrame); this.pendingFrame = null; this.pendingPoint = null; this.anchor = this.range = this.editing = null; this.view._previewAnnotation = null; this.view._renderAnnotations(); }
	closePalette() { const palette = this.host.palette; this.host.palette = null; palette?.remove(); }
	reset() { this.bookmarkDown = null; this.editableNoteID = null; this.gesture.reset(); this.clear(); this.closePalette(); }
	setEnabled(enabled) {
		this.enabled = !!enabled; this.reset();
		this.doc.body.classList.toggle('mobile-direct-highlight', this.enabled);
	}
	destroy() { this.reset(); for (const [type, callback] of this.listeners) this.win.removeEventListener(type, callback, true); }
}
