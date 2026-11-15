import { isBlackReaderBookmark, bookmarkFlagRect, readerIndicatorPosition, BOOKMARK_FLAG_PATH } from '../common/reader-bookmark.mjs';

/** Passive bookmark hint; no new canvas, annotation data or input surface.
 * The former next-page arrow is preserved in the v1.1.5-331 release history. */
export class PDFViewportIndicators {
    constructor(view) {
        this.view=view; this.win=view._iframeWindow; this.doc=this.win.document;
        this.viewer=this.win.PDFViewerApplication.pdfViewer;
        this.bus=this.win.PDFViewerApplication.eventBus;
        this.hiddenPageFlags=new Set();
        this.flag=this.create('motero-bookmark-indicator',`<svg viewBox="0 0 24 24"><path d="${BOOKMARK_FLAG_PATH}"/></svg>`);
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
        for (const flag of this.hiddenPageFlags) flag.style.visibility='';
        this.hiddenPageFlags.clear();
        const view=this.view,v=this.viewer,c=v.container,b=c.getBoundingClientRect();
        const index=view._pageFitting?.centeredPageIndex() ?? v.currentPageNumber-1;
        if (this.annotations!==view._annotations) {
            this.annotations=view._annotations;
            this.bookmarked=new Set((view._annotations||[]).filter(isBlackReaderBookmark).map(a=>a.position.pageIndex));
        }
        const page=v.getPageView(index),r=page?.div?.getBoundingClientRect();
        const safe=readerIndicatorPosition(b,view._options.indicatorInsets || {});
        let flagVisible=false;
        if (r && page.viewport) {
            const [x0,y0,x1,y1]=bookmarkFlagRect(page.viewport);
            const frame=view._pageFitting?.layout?.boxes?.[index];
            const insideCrop=!frame || x0>=frame.left && y0>=frame.top && x1<=page.viewport.width-frame.right && y1<=page.viewport.height-frame.bottom;
            const sx=r.width/page.viewport.width,sy=r.height/page.viewport.height;
            flagVisible=insideCrop && r.left+x0*sx>=b.left+12 && r.top+y0*sy>=safe.top
                && r.left+x1*sx<=b.right-12 && r.top+y1*sy<=b.bottom-12;
        }
        if (!flagVisible && this.bookmarked?.has(index)) for (const flag of page?.div?.querySelectorAll('[data-reader-bookmark]') || []) {
            flag.style.visibility='hidden';this.hiddenPageFlags.add(flag);
        }
        const top=safe.top;
        this.flag.style.display=this.bookmarked?.has(index) && !flagVisible ? 'block':'none';
        this.flag.style.left=safe.left+'px';this.flag.style.top=top+'px';
        const color=view._themeColorScheme==='dark'?'#ddd':'#000';
        this.flag.style.color=color;
    }
    destroy() {
        for (const flag of this.hiddenPageFlags) flag.style.visibility='';
        this.hiddenPageFlags.clear();
        if(this.frame)this.win.cancelAnimationFrame(this.frame);
        this.viewer.container.removeEventListener('scroll',this.schedule);
        for (const event of this.events)this.bus.off(event,this.schedule);
        this.win.removeEventListener('resize',this.schedule);this.flag.remove();
    }
}
