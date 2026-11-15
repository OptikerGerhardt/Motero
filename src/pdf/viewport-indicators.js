import { isBlackReaderBookmark, bookmarkFlagRect, BOOKMARK_FLAG_PATH } from '../common/reader-bookmark.mjs';
import { getHardwareScrollLimits } from './hardware-navigation.mjs';
import { readingUnit } from './reading-unit.mjs';

export function nextScrollCrossesPage(view, viewer, limits) {
    if (view._pageNavigation?.mode !== 'jumped' || !limits || limits.max-limits.min <= 1.5
        || viewer.container.scrollTop < limits.max-1.5 || view._booxReader?.isOverview()
        || view._pageFitting?.editor || view._pageFitting?.zooming) return false;
    const column=view._pageFitting?.columnActive && view._pageFitting.column;
    if (column && column.index < column.columns.length-1) return false;
    const unit=readingUnit(viewer.currentPageNumber-1,viewer.pagesCount,viewer.spreadMode);
    return unit.at(-1)+1 < viewer.pagesCount;
}

/** Two passive viewport hints; no new canvas, annotation data or input surface. */
export class PDFViewportIndicators {
    constructor(view) {
        this.view=view; this.win=view._iframeWindow; this.doc=this.win.document;
        this.viewer=this.win.PDFViewerApplication.pdfViewer;
        this.bus=this.win.PDFViewerApplication.eventBus;
        this.flag=this.create('motero-bookmark-indicator',`<svg viewBox="0 0 24 24"><path d="${BOOKMARK_FLAG_PATH}"/></svg>`);
        this.arrow=this.create('motero-next-page-indicator','<svg viewBox="0 0 48 48"><path d="M8 24h30M26 12l12 12-12 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
        this.schedule=()=>{if (!this.frame) this.frame=this.win.requestAnimationFrame(()=>{this.frame=null;this.update();});};
        this.viewer.container.addEventListener('scroll',this.schedule,{passive:true});
        this.events=['pagechanging','scalechanging','rotationchanging','pagerendered','spreadmodechanged'];
        for (const event of this.events) this.bus.on(event,this.schedule);
        this.win.addEventListener('resize',this.schedule); this.schedule();
    }
    create(name,svg) {
        const e=this.doc.createElement('div');e.className=name;e.setAttribute('aria-hidden','true');
        e.style.cssText='position:fixed;pointer-events:none;z-index:100;display:none;width:34px;height:34px;opacity:.7';
        e.innerHTML=svg;e.firstChild.style.cssText='width:100%;height:100%;fill:currentColor';
        this.doc.documentElement.append(e);return e;
    }
    update() {
        const view=this.view,v=this.viewer,c=v.container,b=c.getBoundingClientRect();
        const index=view._pageFitting?.centeredPageIndex() ?? v.currentPageNumber-1;
        if (this.annotations!==view._annotations) {
            this.annotations=view._annotations;
            this.bookmarked=new Set((view._annotations||[]).filter(isBlackReaderBookmark).map(a=>a.position.pageIndex));
        }
        const page=v.getPageView(index),r=page?.div?.getBoundingClientRect();
        let flagVisible=false;
        if (r && page.viewport) {
            const [x0,y0,x1,y1]=bookmarkFlagRect(page.viewport);
            const frame=view._pageFitting?.layout?.boxes?.[index];
            const insideCrop=!frame || x0>=frame.left && y0>=frame.top && x1<=page.viewport.width-frame.right && y1<=page.viewport.height-frame.bottom;
            flagVisible=insideCrop && r.left+x0>=b.left && r.top+y0>=b.top && r.left+x1<=b.right && r.top+y1<=b.bottom;
        }
        const inset=Math.max(0,view._options.viewportInset || 0),top=b.top+inset+8;
        this.flag.style.display=this.bookmarked?.has(index) && !flagVisible ? 'block':'none';
        this.flag.style.left=Math.max(b.left,b.right-42)+'px';this.flag.style.top=top+'px';
        const limits=getHardwareScrollLimits(view,v,v.getPageView(v.currentPageNumber-1));
        this.arrow.style.display=nextScrollCrossesPage(view,v,limits)?'block':'none';
        this.arrow.style.width=this.arrow.style.height='48px';
        this.arrow.style.left=(b.left+b.width/2-24)+'px';this.arrow.style.top=top+'px';this.arrow.style.opacity='.22';
        const color=view._themeColorScheme==='dark'?'#ddd':'#000';
        this.flag.style.color=this.arrow.style.color=color;
    }
    destroy() {
        if(this.frame)this.win.cancelAnimationFrame(this.frame);
        this.viewer.container.removeEventListener('scroll',this.schedule);
        for (const event of this.events)this.bus.off(event,this.schedule);
        this.win.removeEventListener('resize',this.schedule);this.flag.remove();this.arrow.remove();
    }
}
