// A small crop of the already-rendered PDF canvas, painted only on input frames.
// It does not render the PDF again and never intercepts touch or pen events.
export class PDFSelectionMagnifier {
    constructor(view) { this.view = view; this.win = view._iframeWindow; }
    show(event, position) {
        this.point = { x: event.clientX, y: event.clientY, position };
        if (!this.frame) this.frame = this.win.requestAnimationFrame(() => {
            this.frame = null; this.paint();
        });
    }
    paint() {
        const point = this.point;
        if (!point || this.view._destroyed) return;
        const page = this.win.PDFViewerApplication.pdfViewer.getPageView(point.position.pageIndex);
        const source = page?.canvas;
        if (!source?.width || !source.height) { this.hide(); return; }
        const rect = source.getBoundingClientRect();
        if (!rect.width || !rect.height) { this.hide(); return; }
        if (!this.box) {
            this.box = this.win.document.createElement('div');
            this.box.className = 'boox-selection-magnifier'; this.box.setAttribute('aria-hidden','true');
            this.box.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;overflow:hidden;border-radius:9px;border:1px solid var(--color-border,#ccc);box-shadow:0 2px 8px #0003;background:var(--color-background,#fff);';
            this.canvas = this.win.document.createElement('canvas'); this.box.append(this.canvas);
            const theme = this.win.parent.getComputedStyle(this.win.parent.document.documentElement);
            for (const name of ['--color-background','--color-border']) {
                const value = theme.getPropertyValue(name); if (value) this.box.style.setProperty(name,value);
            }
            this.win.document.body.append(this.box);
        }
        const width = Math.min(144, this.win.innerWidth - 16), height = 72, zoom = 1.8;
        const ratio = Math.min(2, this.win.devicePixelRatio || 1);
        this.canvas.width = Math.round(width * ratio); this.canvas.height = height * ratio;
        this.canvas.style.width = width + 'px'; this.canvas.style.height = height + 'px';
        this.canvas.style.filter = this.win.getComputedStyle(source).filter;
        this.box.style.left = Math.max(8, Math.min(point.x - width / 2, this.win.innerWidth - width - 8)) + 'px';
        const top = point.y - height - 42;
        this.box.style.top = Math.max(8, Math.min(top >= 8 ? top : point.y + 42, this.win.innerHeight - height - 8)) + 'px';
        const ctx = this.canvas.getContext('2d'), cropWidth = width / zoom, cropHeight = height / zoom;
        const x = point.x - cropWidth / 2, y = point.y - cropHeight / 2;
        ctx.scale(ratio,ratio); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height);
        try {
            ctx.drawImage(source,(x-rect.left)*source.width/rect.width,(y-rect.top)*source.height/rect.height,
                cropWidth*source.width/rect.width,cropHeight*source.height/rect.height,0,0,width,height);
            ctx.fillStyle = /^#[\da-f]{6}$/i.test(this.view._tool.color || '') ? this.view._tool.color : '#ffd400';
            ctx.globalAlpha = .3;
            for (const range of this.view._selectionRanges) {
                if (range.position?.pageIndex !== point.position.pageIndex) continue;
                for (const r of range.position?.rects || []) {
                    const q = page.viewport.convertToViewportRectangle(r);
                    const left = rect.left + Math.min(q[0],q[2])*rect.width/page.viewport.width;
                    const top = rect.top + Math.min(q[1],q[3])*rect.height/page.viewport.height;
                    const w = Math.abs(q[2]-q[0])*rect.width/page.viewport.width;
                    const h = Math.abs(q[3]-q[1])*rect.height/page.viewport.height;
                    ctx.fillRect((left-x)*zoom,(top-y)*zoom,w*zoom,h*zoom);
                }
            }
            ctx.globalAlpha = .55; ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
            ctx.beginPath();ctx.moveTo(width/2,height/2-5);ctx.lineTo(width/2,height/2+5);ctx.stroke();
        } catch (error) { this.hide(); }
    }
    hide() {
        if (this.frame) this.win.cancelAnimationFrame(this.frame);
        this.frame = null; this.point = null; this.box?.remove(); this.box = this.canvas = null;
    }
}
