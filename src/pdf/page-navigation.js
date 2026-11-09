// Android's single-page swipe mode is independent of layout direction and crop.
// PDF.js remains responsible for zoom, rendering and annotation coordinates.
export class PDFPageNavigation {
    constructor(view) {
        this.view = view;
        this.win = view._iframeWindow;
        this.viewer = this.win.PDFViewerApplication.pdfViewer;
        this.bus = this.win.PDFViewerApplication.eventBus;
        // PDF.js must agree with the visible single page. Otherwise it can
        // promote a hidden, fully visible neighbor after a Wrapped reflow.
        this.originalVisible = this.viewer._getVisiblePages;
        this.visible = () => {
            const result = this.originalVisible.call(this.viewer);
            if (!this.single) return result;
            const views = result.views.filter(p => p.id === this.viewer.currentPageNumber);
            return {...result, views, ids:new Set(views.map(p=>p.id)),first:views[0],last:views.at(-1)};
        };
        this.viewer._getVisiblePages = this.visible;
        this.style = this.win.document.createElement('style');
        this.style.textContent = '.motero-jumped .page:not(.motero-current-page){visibility:hidden!important;pointer-events:none!important}';
        this.win.document.head.append(this.style);
        this.onStart = event => {
            if (event.touches.length > 1) {
                this.gesture = null; this.multitouch = true; this.sync(); return;
            }
            if (!this.enabled || !this.isPageTarget(event.target) || this.view.getSelectedAnnotations().length) return;
            const p = event.touches[0];
            this.gesture = { x: p.clientX, y: p.clientY, time: Date.now(), dx: 0, dy: 0 };
        };
        this.onMove = event => {
            if (!this.gesture || event.touches.length !== 1 || !this.enabled) return;
            if (this.view._directHighlight?.gesture.active) { this.gesture.selection = true; return; }
            const p = event.touches[0], g = this.gesture;
            g.dx = p.clientX - g.x; g.dy = p.clientY - g.y;
            // Let the existing text selection handler see the movement, while
            // preventing WebView's continuous scrolling and kinetic overshoot.
            if (event.cancelable) event.preventDefault();
        };
        this.onEnd = event => {
            const g = this.gesture;
            if (event.touches.length) return;
            this.gesture = null;
            if (this.multitouch) {
                this.multitouch = false;
                // Fitting decides whether the pinch becomes a persistent overview.
                this.win.requestAnimationFrame(() => this.sync()); return;
            }
            if (!g || g.selection || event.type === 'touchcancel' || !this.enabled || this.view._directHighlight?.gesture.active) return;
            const p = event.changedTouches?.[0];
            if (p) { g.dx = p.clientX - g.x; g.dy = p.clientY - g.y; }
            const axis = this.viewer.scrollMode === 1 ? g.dx : g.dy;
            const cross = this.viewer.scrollMode === 1 ? g.dy : g.dx;
            const elapsed = Date.now() - g.time;
            // A deliberate swipe, never a tap or the tail of a text selection.
            if (Math.abs(axis) < 48 || Math.abs(axis) < Math.abs(cross) * 1.2 || elapsed > 900) return;
            this.view._directHighlight?.reset();
            this.view._pointerDownTap = null;
            this.view._suppressCompatibilityMouseUntil = Date.now() + 500;
            this.turn(axis < 0 ? 1 : -1);
        };
        this.onWheel = event => {
            if (!this.enabled || event.ctrlKey || !this.isPageTarget(event.target)) return;
            event.preventDefault();
            const now = Date.now();
            if (now < (this.wheelLockedUntil || 0)) return;
            if (now - (this.wheelTime || 0) > 180) this.wheelDistance = 0;
            this.wheelTime = now;
            this.wheelDistance = (this.wheelDistance || 0) + (this.viewer.scrollMode === 1 ? event.deltaX || event.deltaY : event.deltaY);
            if (Math.abs(this.wheelDistance) >= 48) {
                this.turn(this.wheelDistance > 0 ? 1 : -1);
                this.wheelDistance = 0; this.wheelLockedUntil = now + 300;
            }
        };
        this.onChange = () => this.sync();
        for (const [name, listener] of [['touchstart',this.onStart],['touchmove',this.onMove],['touchend',this.onEnd],['touchcancel',this.onEnd],['wheel',this.onWheel]]) {
            this.win.addEventListener(name, listener, { capture: true, passive: false });
        }
        for (const name of ['pagechanging','pagesinit','scalechanging','updateviewarea']) this.bus.on(name, this.onChange);
        this.configure(view._options.pageNavigation);
    }
    get enabled() {
        return this.mode === 'jumped' && !this.multitouch && !this.view._destroyed
            && !this.view._pageFitting?.zooming && !this.view._pageFitting?.editor
            && !this.view._booxReader?.isOverview() && this.view._tool.type === 'pointer';
    }
    isPageTarget(target) {
        return this.viewer.container.contains(target) && !target.closest?.('a,button,input,textarea,select,.boox-highlight-palette,.boox-manual-crop');
    }
    configure(mode) {
        this.mode = mode === 'jumped' ? 'jumped' : 'continuous';
        this.gesture = null; this.multitouch = false;
        this.wheelDistance = 0; this.wheelLockedUntil = 0; this.sync();
    }
    sync() {
        // Drawing tools still show the single reading page; only pinch/overview
        // releases the visual restriction. No page nodes or canvases are removed.
        const single = this.mode === 'jumped' && !this.multitouch && !this.view._pageFitting?.zooming
            && !this.view._booxReader?.isOverview() && !this.view._pageFitting?.editor;
        const current = single ? this.viewer.getPageView(this.viewer.currentPageNumber - 1)?.div : null;
        if (this.single === single && this.current === current) return;
        this.single = single;
        if (this.viewer.viewer.classList.contains('motero-jumped') !== single) this.viewer.viewer.classList.toggle('motero-jumped', single);
        if (this.current !== current) {
            this.current?.classList.remove('motero-current-page');
            current?.classList.add('motero-current-page');
            this.current = current;
        }
    }
    turn(direction) {
        this.view._onManualNavigation();
        this.view._navigateToAdjacentPage(direction)?.catch(error => console.error(error));
    }
    destroy() {
        for (const [name, listener] of [['touchstart',this.onStart],['touchmove',this.onMove],['touchend',this.onEnd],['touchcancel',this.onEnd],['wheel',this.onWheel]]) this.win.removeEventListener(name, listener, true);
        for (const name of ['pagechanging','pagesinit','scalechanging','updateviewarea']) this.bus.off(name, this.onChange);
        this.viewer.viewer.classList.remove('motero-jumped');
        if (this.viewer._getVisiblePages === this.visible) this.viewer._getVisiblePages = this.originalVisible;
        this.current?.classList.remove('motero-current-page');
        this.style.remove();
    }
}
