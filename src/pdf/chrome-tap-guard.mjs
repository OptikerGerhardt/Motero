// Defer short taps on annotations/links until they can dismiss Android chrome.
// Scrolling and long gestures replay the original down event, preserving their
// coordinates. The direct highlighter already defers taps and keeps its timer.
export class PDFChromeTapGuard {
	constructor(view) {
		this.view = view;
		this.handledUps = new WeakSet();
	}

	consumeTap(down, up) {
		let view = this.view;
		if (!view._readerChromeVisible || view._tool.type !== 'pointer'
			|| up.timeStamp - down.timeStamp >= 350) return false;
		view._readerChromeVisible = false;
		view._suppressCompatibilityMouseUntil = Date.now() + 1500;
		view._clearPendingBackdropTap();
		view._clearPointerAction();
		view._nativeTextSelection?.clear();
		view._onSelectAnnotations?.([]);
		view._onSetAnnotationPopup?.(null);
		view._onDismissReaderChrome?.();
		if (up.cancelable) up.preventDefault();
		return true;
	}

	down(event) {
		let view = this.view;
		if (this.replaying) return false;
		if (this.pending && event.pointerId !== this.pending.pointerId) {
			this.release();
			return false;
		}
		if (!view._readerChromeVisible || view._tool.type !== 'pointer'
			|| event.type !== 'pointerdown' || !['touch', 'pen'].includes(event.pointerType)
			|| event.isPrimary === false || event.button !== 0
			|| !event.target.closest?.('#viewerContainer')
			|| event.target.closest?.('input, textarea, [contenteditable="true"], .boox-highlight-palette')
			|| view._directHighlight?.canStart(event)) return false;
		this.reset();
		this.pending = event;
		view._suppressCompatibilityMouseUntil = Date.now() + 1500;
		this.timer = view._iframeWindow.setTimeout(() => this.release(), 350);
		return true;
	}

	move(event) {
		let down = this.pending;
		if (!down) return false;
		if (event.pointerId !== down.pointerId
			|| Math.hypot(event.clientX - down.clientX, event.clientY - down.clientY) > 10) {
			this.release();
			return false;
		}
		return true;
	}

	up(event) {
		if (this.handledUps.has(event)) return true;
		let down = this.pending;
		if (!down || event.pointerId !== down.pointerId) return false;
		this.reset();
		if (Math.hypot(event.clientX - down.clientX, event.clientY - down.clientY) <= 10
			&& this.consumeTap(down, event)) {
			this.handledUps.add(event);
			return true;
		}
		this.replay(down);
		return false;
	}

	replay(event) {
		this.replaying = true;
		try { this.view._handlePointerDown(event); }
		finally { this.replaying = false; }
	}

	release() {
		let down = this.pending;
		this.reset();
		if (down && !this.view._destroyed) this.replay(down);
	}

	reset() {
		this.view._iframeWindow.clearTimeout(this.timer);
		this.pending = null;
	}
}
