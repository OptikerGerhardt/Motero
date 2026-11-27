import { isLegacyReaderBookmark, bookmarkColor, bookmarkFrameAnchor, BOOKMARK_FLAG_HEIGHT, BOOKMARK_FLAG_WIDTH, BOOKMARK_FLAG_PATH } from '../common/reader-bookmark.mjs';
import { readingUnit } from './reading-unit.mjs';

/** Follow the visible PDF frame, with one flag per spread leaf. */
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
        e.style.cssText=`position:fixed;pointer-events:none;z-index:100;display:none;width:${BOOKMARK_FLAG_WIDTH}px;height:${BOOKMARK_FLAG_HEIGHT}px;opacity:.7;filter:drop-shadow(0 1px 2px #0003)`;
        e.innerHTML=`<svg viewBox="0 0 24 16" preserveAspectRatio="none"><path d="${BOOKMARK_FLAG_PATH}"/></svg>`;
        e.firstChild.style.cssText='width:100%;height:100%;fill:currentColor';
        this.doc.documentElement.append(e);this.flags.set(index,e);return e;
    }
    anchor(index) {
        const flag = this.flags.get(index);
        return flag && { left: parseFloat(flag.style.left), top: parseFloat(flag.style.top) };
    }
    setPalettePage(pageIndex) {
        if (this.palettePage != null) this.flags.get(this.palettePage)?.style.removeProperty('visibility');
        this.palettePage = pageIndex;
        if (pageIndex != null) this.flags.get(pageIndex)?.style.setProperty('visibility', 'hidden');
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
                if (isLegacyReaderBookmark(annotation) && Number.isInteger(index) && !this.bookmarked.has(index)) {
                    this.bookmarked.set(index,annotation);
                }
            }
        }
        const reading=this.bookmarked.size > 0 && !view._pageFitting?.editor;
        const indices=reading ? readingUnit(view._pageFitting?.centeredPageIndex() ?? v.currentPageNumber-1,v.pagesCount,v.spreadMode) : [];
        const shown=new Set();
        for (const i of indices) {
            if (!this.bookmarked.has(i)) continue;
            const page=v.getPageView(i),r=page?.div.getBoundingClientRect();
            if (!r) continue;
            const frame=view._pageFitting?.layout?.boxes?.[i];
            const sx=r.width/page.viewport.width;
            const left=frame ? r.left+frame.left*sx : r.left;
            const right=frame ? r.right-frame.right*sx : r.right;
            const sy=r.height/page.viewport.height;
            const top=frame ? r.top+frame.top*sy : r.top;
            const bottom=frame ? r.bottom-frame.bottom*sy : r.bottom;
            if (right<=b.left || left>=b.right || top>=b.bottom || bottom<=b.top) continue;
            const anchor=bookmarkFrameAnchor(b,{ left, right, top },view._options.indicatorInsets);
            const flag=this.flags.get(i)||this.create(i);
            flag.style.left=anchor.left+'px';
            flag.style.top=anchor.top+'px';flag.style.display='block';
            flag.style.visibility=i === this.palettePage ? 'hidden' : '';
            const color=bookmarkColor(this.bookmarked.get(i));
            flag.style.color=color === '#000000' && view._themeColorScheme === 'dark' ? '#ddd' : color;
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
