/** Find a complete, visible word below the previous reading edge. Geometry is
 * supplied by the page, so rotated/cropped columns use the same coordinates. */
export function firstReadingWord(chars, project, clip, afterY = clip.top) {
    let word = [], best = null;
    const consider = () => {
        if (!word.length) return;
        if (word.some(c => /[\p{L}\p{N}]/u.test(c.u || c.c || ''))) {
            const rect = [Math.min(...word.map(c => c.rect[0])), Math.min(...word.map(c => c.rect[1])),
                Math.max(...word.map(c => c.rect[2])), Math.max(...word.map(c => c.rect[3]))];
            const [left, top, right, bottom] = project(rect);
            if (left >= clip.left - 1 && right <= clip.right + 1 && top >= clip.top - 1 && bottom > afterY + 1
                    && bottom <= clip.bottom + 1 && right > left && bottom > top
                    && (!best || top < best.top - Math.max(2,Math.min(bottom-top,best.bottom-best.top)*.6))) {
                best = {left, top, right, bottom};
            }
        }
        word = [];
    };
    for (const char of chars || []) {
        if (!char.rect || char.ignorable || char.flowClass === 'excluded' || /^\s+$/u.test(char.u || char.c || '')) {
            consider(); continue;
        }
        word.push(char);
        if (char.wordBreakAfter || char.spaceAfter || char.lineBreakAfter || char.paragraphBreakAfter) consider();
    }
    consider();
    return best;
}

/** One transient DOM oval, using cached/shared text extraction; no canvas,
 * annotation mutation, frame loop, or layout change. */
export class PDFReadingPositionCue {
    constructor(view) {
        this.view = view; this.win = view._iframeWindow;
        this.viewer = this.win.PDFViewerApplication.pdfViewer;
    }
    schedule(edge = null) {
        this.clear();
        if (!this.enabled) return;
        const request = this.pending = {edge, pageIndex: edge?.pageIndex ?? this.viewer.currentPageNumber - 1};
        this.timer = this.win.setTimeout(() => this.show(request).catch(() => this.clearIfCurrent(request)), 180);
    }
    get enabled() {
        const f = this.view._pageFitting;
        return this.view._options.deviceProfile?.readingAssist !== false && f?.active && f.options?.mode === 'width';
    }
    onScroll() {
        const pending = this.pending;
        if (pending) this.schedule(pending.edge);
        else this.clear();
    }
    clearIfCurrent(request) { if (this.pending === request) this.clear(); }
    async show(request) {
        const view = this.view, v = this.viewer, c = v.container, index = request.pageIndex;
        const valid = () => this.pending === request && this.enabled && !view._destroyed && !view._pageFitting?.editor
            && !view._pageFitting?.zooming && !view._booxReader?.isOverview() && v.currentPageNumber === index + 1;
        if (!valid()) { this.clearIfCurrent(request); return; }
        const page = v.getPageView(index);
        if (!page?.pdfPage) { this.clearIfCurrent(request); return; }
        const before = [c.scrollLeft,c.scrollTop,c.clientWidth,c.clientHeight,v.currentScale];
        await view._ensureBasicPageData(index, page.pdfPage);
        const after = [c.scrollLeft,c.scrollTop,c.clientWidth,c.clientHeight,v.currentScale];
        if (!valid() || before.some((x,i) => x !== after[i])) { this.clearIfCurrent(request); return; }
        const b = c.getBoundingClientRect(), p = page.div.getBoundingClientRect(), viewport = page.viewport;
        const clip = {left: b.left+c.clientLeft, top:b.top+c.clientTop,
            right:b.left+c.clientLeft+c.clientWidth, bottom:b.top+c.clientTop+c.clientHeight};
        const sx = p.width/viewport.width, sy = p.height/viewport.height;
        const frame = view._pageFitting?.layout?.boxes?.[index];
        const width = frame ? (viewport.width-frame.left-frame.right)*sx : p.width;
        const height = frame ? (viewport.height-frame.top-frame.bottom)*sy : p.height;
        if (width <= c.clientWidth+2 && height <= c.clientHeight+2) { this.clearIfCurrent(request); return; }
        if (frame) {
            clip.left = Math.max(clip.left,p.left+frame.left*sx);
            clip.top = Math.max(clip.top,p.top+frame.top*sy);
            clip.right = Math.min(clip.right,p.right-frame.right*sx);
            clip.bottom = Math.min(clip.bottom,p.bottom-frame.bottom*sy);
        }
        const project = rect => {
            const [x0,y0,x1,y1] = viewport.convertToViewportRectangle(rect);
            return [p.left+Math.min(x0,x1)*sx,p.top+Math.min(y0,y1)*sy,
                p.left+Math.max(x0,x1)*sx,p.top+Math.max(y0,y1)*sy];
        };
        const edgeY = request.edge?.next !== false && request.edge?.point
            ? p.top+viewport.convertToViewportPoint(...request.edge.point)[1]*sy : clip.top;
        const word = firstReadingWord(view._pdfPages[index]?.chars, project, clip, edgeY);
        this.pending = null;
        if (!word) return; // Scans without text remain unchanged.
        const oval = this.element = this.win.document.createElement('div');
        oval.className = 'motero-reading-position-cue'; oval.setAttribute('aria-hidden','true');
        const left = Math.max(clip.left,word.left-9), top = Math.max(clip.top,word.top-6);
        oval.style.cssText = `position:fixed;pointer-events:none;z-index:9001;isolation:isolate;mix-blend-mode:normal;opacity:.9;left:${left}px;top:${top}px;width:${Math.min(clip.right,word.right+9)-left}px;height:${Math.min(clip.bottom,word.bottom+6)-top}px;`;
        const svg = this.win.document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('width','100%'); svg.setAttribute('height','100%'); svg.style.overflow='visible';
        const ring = this.win.document.createElementNS('http://www.w3.org/2000/svg','ellipse');
        for (const [key,value] of Object.entries({cx:'50%',cy:'50%',rx:'47%',ry:'43%',fill:'none',stroke:'#000','stroke-width':'2.5',pathLength:'1'})) ring.setAttribute(key,value);
        svg.append(ring); oval.append(svg);
        this.win.document.documentElement.append(oval);
        if (!view._options.deviceProfile?.eReader && !this.win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            ring.style.strokeDasharray='1';
            this.animation = ring.animate([{strokeDashoffset:'1',opacity:1},
                {offset:.3,strokeDashoffset:'0',opacity:1},{offset:.5,strokeDashoffset:'0',opacity:.85},
                {strokeDashoffset:'0',opacity:0}], {duration:700,easing:'ease-out',fill:'forwards'});
        }
        this.expiry = this.win.setTimeout(() => this.clear(), 700);
    }
    clear() {
        this.pending = null;
        this.win.clearTimeout(this.timer); this.win.clearTimeout(this.expiry);
        this.animation?.cancel(); this.animation = null;
        this.element?.remove(); this.element = null;
    }
}
