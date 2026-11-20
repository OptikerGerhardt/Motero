import { isReaderBookmark, bookmarkColor, readerIndicatorPosition, BOOKMARK_FLAG_PATH } from '../common/reader-bookmark.mjs';
import { readingUnit } from './reading-unit.mjs';

/** Reading uses stable viewport hints, one per spread leaf. Only an explicit
 * overview uses physical page flags; scrolling never switches their anchors. */
export class PDFViewportIndicators {
    constructor(view) {
        this.view=view; this.win=view._iframeWindow; this.doc=this.win.document;
        this.viewer=this.win.PDFViewerApplication.pdfViewer;
        this.bus=this.win.PDFViewerApplication.eventBus;
        this.hiddenPageFlags=new Set(); this.flags=new Map();
        this.schedule=()=>{if (!this.frame) this.frame=this.win.requestAnimationFrame(()=>{this.frame=null;this.update();});};
        this.viewer.container.addEventListener('scroll',this.schedule,{passive:true});
        this.events=['pagechanging','scalechanging','rotationchanging','pagerendered','spreadmodechanged'];
        for (const event of this.events) this.bus.on(event,this.schedule);
        this.win.addEventListener('resize',this.schedule); this.schedule();
    }
    create(index) {
        const e=this.doc.createElement('div');e.className='motero-bookmark-indicator';e.dataset.pageIndex=String(index);e.setAttribute('aria-hidden','true');
        e.style.cssText='position:fixed;pointer-events:none;z-index:100;display:none;width:34px;height:34px;opacity:.7';
        // Trim unused SVG margins so the visible flag has equal top/right clearance.
        e.innerHTML=`<svg viewBox="5 2 14 20" preserveAspectRatio="xMaxYMin meet"><path d="${BOOKMARK_FLAG_PATH}"/></svg>`;
        e.firstChild.style.cssText='width:100%;height:100%;fill:currentColor';
        this.doc.documentElement.append(e);this.flags.set(index,e);return e;
    }
    update() {
        for (const flag of this.hiddenPageFlags) flag.style.visibility='';
        this.hiddenPageFlags.clear();
        const view=this.view,v=this.viewer,c=v.container,b=c.getBoundingClientRect();
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
        const reading=this.bookmarked.size > 0 && !view._booxReader?.isOverview() && !view._pageFitting?.editor;
        const indices=reading ? readingUnit(view._pageFitting?.centeredPageIndex() ?? v.currentPageNumber-1,v.pagesCount,v.spreadMode) : [];
        const shown=new Set();
        const safe=readerIndicatorPosition(b,view._options.indicatorInsets || {});
        const gap=b.right-safe.left-34;
        for (const i of indices) {
            if (!this.bookmarked.has(i)) continue;
            const page=v.getPageView(i),r=page?.div.getBoundingClientRect();
            if (!r) continue;
            const frame=view._pageFitting?.layout?.boxes?.[i];
            const sx=r.width/page.viewport.width;
            const left=frame ? r.left+frame.left*sx : r.left;
            const right=frame ? r.right-frame.right*sx : r.right;
            if (right<=b.left || left>=b.right) continue;
            const flag=this.flags.get(i)||this.create(i);
            flag.style.left=(indices.length>1 ? Math.max(b.left+12,Math.min(b.right,right)-gap-34) : safe.left)+'px';
            flag.style.top=safe.top+'px';flag.style.display='block';
            flag.style.color=bookmarkColor(this.bookmarked.get(i));
            shown.add(i);
            for (const physical of page.div.querySelectorAll('[data-reader-bookmark]')) {
                physical.style.visibility='hidden';this.hiddenPageFlags.add(physical);
            }
        }
        for (const [i,flag] of this.flags) if (!shown.has(i)) {flag.remove();this.flags.delete(i);}
    }
    destroy() {
        for (const flag of this.hiddenPageFlags) flag.style.visibility='';
        this.hiddenPageFlags.clear();
        if(this.frame)this.win.cancelAnimationFrame(this.frame);
        this.viewer.container.removeEventListener('scroll',this.schedule);
        for (const event of this.events)this.bus.off(event,this.schedule);
        this.win.removeEventListener('resize',this.schedule);
        for (const flag of this.flags.values()) flag.remove();this.flags.clear();
    }
}
