import { navigateWithHardwareButton } from './hardware-navigation.mjs';
import { readingUnit, unitFrame } from './reading-unit.mjs';

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
            const allowed = new Set(readingUnit(this.viewer.currentPageNumber-1, this.viewer.pagesCount || this.viewer._pages?.length || this.viewer.currentPageNumber, this.viewer.spreadMode).map(i=>i+1));
            const views = result.views.filter(p => allowed.has(p.id));
            const documentOrder=views.slice().sort((a,b)=>a.id-b.id);
            views.sort((a,b)=>(b.id===this.viewer.currentPageNumber)-(a.id===this.viewer.currentPageNumber));
            return {...result, views, ids:new Set(views.map(p=>p.id)),first:documentOrder[0],last:documentOrder.at(-1)};
        };
        this.viewer._getVisiblePages = this.visible;
        this.style = this.win.document.createElement('style');
        this.style.textContent = '.motero-jumped .page:not(.motero-current-page){visibility:hidden!important;pointer-events:none!important}'
            + '.motero-page-spacing{padding-block:var(--motero-page-gap,0px)!important}'
            + '.motero-continuous-y #viewerContainer{touch-action:pan-y pinch-zoom!important}'
            + '.motero-continuous-x #viewerContainer{touch-action:pan-x pinch-zoom!important}'
            + '.motero-column-reading #viewerContainer{touch-action:none!important}';
        this.win.document.head.append(this.style);
        this.onStart = event => {
            if (event.touches.length > 1) {
                this.gesture = null; this.multitouch = true; this.sync(); return;
            }
            if (!this.enabled || !this.isPageTarget(event.target) || this.view.getSelectedAnnotations().length) return;
            const p = event.touches[0];
            this.gesture = { x: p.clientX, y: p.clientY, time: Date.now(), dx: 0, dy: 0,
                column:!!this.view._pageFitting?.columnActive };
        };
        this.onMove = event => {
            if (!this.gesture || event.touches.length !== 1 || !this.enabled) return;
            if (this.view._directHighlight?.gesture.active || this.view._nativeTextSelection?.shouldDeferEvent(event)) { this.gesture.selection = true; return; }
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
            const axis = !g.column && this.viewer.scrollMode === 1 ? g.dx : g.dy;
            const cross = !g.column && this.viewer.scrollMode === 1 ? g.dy : g.dx;
            const elapsed = Date.now() - g.time;
            // A deliberate swipe, never a tap or the tail of a text selection.
            if (Math.abs(axis) < 48 || Math.abs(axis) < Math.abs(cross) * 1.2 || elapsed > 900) return;
            this.view._directHighlight?.reset();
            this.view._pointerDownTap = null;
            this.view._suppressCompatibilityMouseUntil = Date.now() + 500;
            if (g.column) {
                navigateWithHardwareButton(this.view,axis<0).catch(error=>console.error(error));
                return;
            }
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
            && !this.view._booxReader?.isOverview() && !this.view._penInput?.busy
            && (this.view._tool.type === 'pointer' || this.view._isPenInUse?.());
    }
    isPageTarget(target) {
        return this.viewer.container.contains(target) && !target.closest?.('a,button,input,textarea,select,.boox-highlight-palette,.boox-manual-crop');
    }
    configure(mode) {
        const previous = this.mode;
        this.mode = mode === 'jumped' ? 'jumped' : 'continuous';
        this.gesture = null; this.multitouch = false;
        this.wheelDistance = 0; this.wheelLockedUntil = 0; this.sync();
        if (previous && previous !== this.mode && this.view._pageFitting?.active) {
            const fitting = this.view._pageFitting;
            fitting.column = null;
            fitting.preparedPages.clear();
            fitting.layoutEpoch++;
            fitting.schedule(0);
        }
        if (previous === 'continuous' && this.mode === 'jumped' && this.viewer.pdfDocument
                && !this.view._booxReader?.isOverview()) {
            // Continuous may show several short pages. Start Jumped on the
            // centered reading page, rather than a fragment at the upper edge.
            const pageIndex = this.view._pageFitting.centeredPageIndex();
            this.view._onManualNavigation();
            this.view._navigateToPage({pageIndex})?.catch(error => console.error(error));
        }
    }
    sync() {
        const root=this.win?.document.documentElement;
        // Restrict ordinary one-finger panning to the reading axis. Pinches and
        // the uncropped overview remain free to move in both directions.
        const lock = this.mode === 'continuous' && this.view._tool?.type === 'pointer' && !this.multitouch
            && !this.view._pageFitting?.zooming && !this.view._pageFitting?.editor
            && !this.view._booxReader?.isOverview();
        root?.classList.toggle('motero-continuous-x', lock && this.viewer.scrollMode === 1);
        root?.classList.toggle('motero-continuous-y', lock && this.viewer.scrollMode !== 1);
        const column=!!this.view._pageFitting?.columnActive && !this.multitouch && !this.view._pageFitting?.editor;
        if (root && root.classList.contains('motero-column-reading')!==column) root.classList.toggle('motero-column-reading',column);
        // Drawing tools still show the single reading page; only pinch/overview
        // releases the visual restriction. No page nodes or canvases are removed.
        const single = this.mode === 'jumped' && !this.multitouch && !this.view._pageFitting?.zooming
            && !this.view._booxReader?.isOverview() && !this.view._pageFitting?.editor;
        if ((!single && !this.keepCenterSpacing) || this.view._pageFitting?.layout.boxes
                || this.multitouch || this.view._pageFitting?.zooming || this.view._booxReader?.isOverview()
                || this.view._pageFitting?.editor) this.clearSpacing();
        const indices = single ? readingUnit(this.viewer.currentPageNumber-1, this.viewer.pagesCount || this.viewer._pages?.length || this.viewer.currentPageNumber, this.viewer.spreadMode) : [];
        const current = single ? this.viewer.getPageView(this.viewer.currentPageNumber - 1)?.div : null;
        const unitKey = indices.join(',');
        if (this.single === single && this.current === current && this.unitKey === unitKey) return;
        this.unitKey = unitKey;
        this.single = single;
        if (this.viewer.viewer.classList.contains('motero-jumped') !== single) this.viewer.viewer.classList.toggle('motero-jumped', single);
        const next = indices.map(i=>i===this.viewer.currentPageNumber-1 ? current : this.viewer.getPageView(i)?.div).filter(Boolean);
        for (const div of this.currentUnit || []) if (!next.includes(div)) div.classList.remove('motero-current-page');
        for (const div of next) if (!this.currentUnit?.includes(div)) div.classList.add('motero-current-page');
        this.currentUnit = next;
        this.current = current;
    }
    turn(direction) {
        if (this.view._pageFitting?.columnActive) {
            navigateWithHardwareButton(this.view,direction>0).catch(error=>console.error(error));
            return;
        }
        this.view._onManualNavigation();
        this.view._navigateToAdjacentPage(direction)?.catch(error => console.error(error));
    }
    centerCurrentPage({ direction = 0, preservePosition = false, force = false } = {}) {
        if ((!force && this.mode !== 'jumped') || this.view._pageFitting?.zooming || this.view._pageFitting?.editor
                || this.view._booxReader?.isOverview()) return;
        const v = this.viewer, c = v.container, index = v.currentPageNumber - 1;
        const indices = readingUnit(index,v.pagesCount || v._pages?.length || index+1,v.spreadMode);
        const frames = this.view._pageFitting?.layout.boxes;
        const frame = frames && unitFrame(frames,indices);
        const box = frame && {x:frame.left,y:frame.top,width:frame.right-frame.left,height:frame.bottom-frame.top};
        const page = v.getPageView(index);
        if (!page) return;
        if (box) {
            this.clearSpacing();
            c.scrollLeft = Math.max(0, box.x + (box.width - c.clientWidth) / 2);
            const start = box.y, end = box.y + box.height - c.clientHeight;
            c.scrollTop = Math.max(0, box.height <= c.clientHeight ? (start + end) / 2
                : preservePosition ? Math.max(start, Math.min(end, c.scrollTop)) : direction < 0 ? end : start);
        }
        else {
            // Without a crop layout, the first/last short page also needs room
            // above/below it so centering is possible at the document edges.
            v.viewer.style.setProperty('--motero-page-gap', Math.max(0, (c.clientHeight - page.div.clientHeight) / 2) + 'px');
            v.viewer.classList.add('motero-page-spacing');
            this.keepCenterSpacing = force && this.mode === 'continuous';
            const rects = indices.map(i=>v.getPageView(i)?.div.getBoundingClientRect()).filter(Boolean);
            const r = {left:Math.min(...rects.map(r=>r.left)),top:Math.min(...rects.map(r=>r.top)),
                width:Math.max(...rects.map(r=>r.right??r.left+r.width))-Math.min(...rects.map(r=>r.left)),
                height:Math.max(...rects.map(r=>r.bottom??r.top+r.height))-Math.min(...rects.map(r=>r.top))};
            const viewport = c.getBoundingClientRect();
            c.scrollLeft += r.left + r.width / 2 - viewport.left - c.clientWidth / 2;
            const start = c.scrollTop + r.top - viewport.top - c.clientTop;
            const end = start + r.height - c.clientHeight;
            c.scrollTop = Math.max(0, r.height <= c.clientHeight ? (start + end) / 2
                : preservePosition ? Math.max(start, Math.min(end, c.scrollTop)) : direction < 0 ? end : start);
        }
        // Hardware navigation and overview return also pass through here after
        // fitting. Center the active column, never the enclosing two-column page.
        const fitting = this.view._pageFitting;
        if (fitting?.columnActive) {
            const prepared = fitting.preparedPages.get(index);
            if (prepared) fitting.positionColumn(prepared, {preservePosition: true});
        }
    }
    clearSpacing() {
        this.keepCenterSpacing = false;
        if (!this.viewer.viewer.classList.contains('motero-page-spacing')) return;
        this.viewer.viewer.classList.remove('motero-page-spacing');
        this.viewer.viewer.style.removeProperty('--motero-page-gap');
    }
    destroy() {
        for (const [name, listener] of [['touchstart',this.onStart],['touchmove',this.onMove],['touchend',this.onEnd],['touchcancel',this.onEnd],['wheel',this.onWheel]]) this.win.removeEventListener(name, listener, true);
        for (const name of ['pagechanging','pagesinit','scalechanging','updateviewarea']) this.bus.off(name, this.onChange);
        this.viewer.viewer.classList.remove('motero-jumped');
        this.win.document.documentElement?.classList.remove('motero-column-reading');
        this.win.document.documentElement?.classList.remove('motero-continuous-x', 'motero-continuous-y');
        this.clearSpacing();
        if (this.viewer._getVisiblePages === this.visible) this.viewer._getVisiblePages = this.originalVisible;
        for (const div of this.currentUnit || []) div.classList.remove('motero-current-page');
        this.style.remove();
    }
}
