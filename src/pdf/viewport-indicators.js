import { isReaderBookmark, bookmarkColor, bookmarkFlagContains, bookmarkFrameAnchor, BOOKMARK_FLAG_HEIGHT, BOOKMARK_FLAG_WIDTH, BOOKMARK_FLAG_PATH } from '../common/reader-bookmark.mjs';

/** Follow the visible PDF frame, with one flag per spread leaf. */
export class PDFViewportIndicators {
    constructor(view) {
        this.view=view; this.win=view._iframeWindow; this.doc=this.win.document;
        this.viewer=this.win.PDFViewerApplication.pdfViewer;
        this.bus=this.win.PDFViewerApplication.eventBus;
        this.flags=new Map();
        this.hidePageFlags=this.doc.createElement('style');
        this.hidePageFlags.textContent='[data-reader-bookmark] { visibility: hidden }';
        this.doc.head.append(this.hidePageFlags);
        this.schedule=()=>{if (!this.frame) this.frame=this.win.requestAnimationFrame(()=>{this.frame=null;this.update();});};
        this.viewer.container.addEventListener('scroll',this.schedule,{passive:true});
        this.events=['pagechanging','scalechanging','rotationchanging','pagerendered','spreadmodechanged'];
        for (const event of this.events) this.bus.on(event,this.schedule);
        this.win.addEventListener('resize',this.schedule); this.schedule();
    }
    create(index) {
        const e=this.doc.createElement('div');e.className='motero-bookmark-indicator';e.dataset.pageIndex=String(index);e.setAttribute('aria-hidden','true');
        e.style.cssText=`position:fixed;pointer-events:none;z-index:100;display:none;width:${BOOKMARK_FLAG_WIDTH}px;height:${BOOKMARK_FLAG_HEIGHT}px;opacity:.7;filter:drop-shadow(0 1px 2px #0003)`;
        e.innerHTML=`<svg viewBox="0 0 24 16" preserveAspectRatio="none"><path d="${BOOKMARK_FLAG_PATH}"/></svg>`;
        e.firstChild.style.cssText='width:100%;height:100%;fill:currentColor';
        this.doc.documentElement.append(e);this.flags.set(index,e);return e;
    }
    anchor(index) {
        const view = this.view, v = this.viewer;
        const bounds = v.container.getBoundingClientRect();
        const page = v.getPageView(index);
        if (!page?.viewport?.width || !page.viewport.height) return;
        const rect = page.div.getBoundingClientRect();
        const crop = view._pageFitting?.layout?.boxes?.[index];
        const sx = rect.width / page.viewport.width, sy = rect.height / page.viewport.height;
        const frame = {
            left: rect.left + (crop?.left || 0) * sx, right: rect.right - (crop?.right || 0) * sx,
            top: rect.top + (crop?.top || 0) * sy, bottom: rect.bottom - (crop?.bottom || 0) * sy,
        };
        if (frame.right <= bounds.left || frame.left >= bounds.right
                || frame.top >= bounds.bottom || frame.bottom <= bounds.top) return;
        return bookmarkFrameAnchor(bounds, frame, view._options.indicatorInsets);
    }
    pageAtFlag(x,y) {
        for (const index of this.flags.keys()) {
            if (bookmarkFlagContains(this.anchor(index), x, y)) return index;
        }
    }
    setPalettePage(pageIndex) {
        if (this.palettePage != null) this.flags.get(this.palettePage)?.style.removeProperty('visibility');
        this.palettePage = pageIndex;
        if (pageIndex != null) this.flags.get(pageIndex)?.style.setProperty('visibility', 'hidden');
    }
    update() {
        const view=this.view,v=this.viewer;
        if (this.annotations!==view._annotations) {
            this.annotations=view._annotations;
            this.bookmarked=new Map();
            for (const annotation of view._annotations || []) {
                const index=annotation.position?.pageIndex;
                if (isReaderBookmark(annotation) && Number.isInteger(index) && !this.bookmarked.has(index)) {
                    this.bookmarked.set(index,annotation);
                }
            }
        }
        const visible = this.bookmarked.size && !view._pageFitting?.editor
            ? v._getVisiblePages().views.map(page => page.id - 1) : [];
        const shown=new Set();
        for (const i of visible) {
            if (!this.bookmarked.has(i)) continue;
            const anchor = this.anchor(i);
            if (!anchor) continue;
            const flag=this.flags.get(i)||this.create(i);
            flag.style.left=anchor.left+'px';
            flag.style.top=anchor.top+'px';flag.style.display='block';
            flag.style.visibility=i === this.palettePage ? 'hidden' : '';
            const color=bookmarkColor(this.bookmarked.get(i));
            flag.style.color=color === '#000000' && view._themeColorScheme === 'dark' ? '#ddd' : color;
            shown.add(i);

        }
        for (const [i,flag] of this.flags) if (!shown.has(i)) {flag.remove();this.flags.delete(i);}
        view._booxReader?.bookmarkColors?.checkAnchor();
    }
    destroy() {
        this.hidePageFlags.remove();
        if(this.frame)this.win.cancelAnimationFrame(this.frame);
        this.viewer.container.removeEventListener('scroll',this.schedule);
        for (const event of this.events)this.bus.off(event,this.schedule);
        this.win.removeEventListener('resize',this.schedule);
        for (const flag of this.flags.values()) flag.remove();this.flags.clear();
    }
}
