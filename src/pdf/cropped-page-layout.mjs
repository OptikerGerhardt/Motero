import { readingUnit } from './reading-unit.mjs';

function setStyles(element, styles) {
    for (const [key,value] of Object.entries(styles)) if (element.style[key] !== value) element.style[key] = value;
}
// Keep the original full-size PDF coordinate plane. Only page positions and the
// visible frame change; selection, annotation rectangles and PDF.js stay intact.
export function layoutReadingPages(pages, { width, height, mode, gap = 12, spreadMode = 0 }) {
    const units = [];
    for (let i = 0; i < pages.length;) {
        const indices = readingUnit(i, pages.length, spreadMode), group = indices.map(i => pages[i]);
        units.push({pages:group, width:group.reduce((w,p)=>w+p.width,0)+gap*(group.length-1),
            height:Math.max(...group.map(p=>p.height))});
        i = indices.at(-1)+1;
    }
    const rows = []; let row = {pages:[],width:0,height:0};
    for (const unit of units) {
        if (row.pages.length && (mode === 0 || mode === 2 && row.width + gap + unit.width > width)) {
            rows.push(row); row = {pages:[],width:0,height:0};
        }
        if (row.pages.length) row.width += gap;
        row.pages.push(...unit.pages); row.width += unit.width; row.height = Math.max(row.height,unit.height);
    }
    if (row.pages.length) rows.push(row);
    const totalWidth = Math.max(width, ...rows.map(r=>r.width)), boxes = [];
    let y = rows.length ? Math.max(0,(height-rows[0].height)/2) : 0;
    for (const row of rows) {
        let x = mode === 1 ? 0 : (totalWidth-row.width)/2;
        for (const page of row.pages) {
            boxes.push({...page,x,y:y+(row.height-page.height)/2}); x += page.width+gap;
        }
        y += row.height+gap;
    }
    return {boxes,width:totalWidth,height:Math.max(height,y-gap+Math.max(0,(height-(rows.at(-1)?.height||height))/2))};
}

export class CroppedPageLayout {
	constructor(fitting) {
		this.fitting = fitting;
		this.viewer = fitting.viewer;
		this.originalVisible = this.viewer._getVisiblePages;
		this.visible = () => this.boxes ? this.getVisiblePages() : this.originalVisible.call(this.viewer);
		this.viewer._getVisiblePages = this.visible;
		this.saved = new Map();
		this.originalScroll = this.viewer.scrollPageIntoView;
		this.scroll = options => {
			if (!this.boxes) return this.originalScroll.call(this.viewer, options);
			const v = this.viewer, c = v.container, box = this.boxes[options.pageNumber - 1];
			if (!box) return;
			v._setCurrentPageNumber(options.pageNumber, false);
			const page = v.getPageView(box.index);
			let x = box.x + box.width / 2, y = box.y + Math.min(box.height, c.clientHeight) / 2;
			const dest = options.destArray;
			if (dest?.[1]?.name === 'XYZ') {
				const point = page.viewport.convertToViewportPoint(dest[2] ?? page.pdfPage.view[0], dest[3] ?? page.pdfPage.view[3]);
				x = box.x - box.left + point[0] + c.clientWidth / 2;
				y = box.y - box.top + point[1] + c.clientHeight / 2;
			}
			c.scrollLeft = Math.max(0, x - c.clientWidth / 2);
			c.scrollTop = Math.max(0, y - c.clientHeight / 2);
		};
		this.viewer.scrollPageIntoView = this.scroll;
	}
	apply(preparedPages, { preservePosition = false } = {}) {
        const v = this.viewer, c = v.container, host = v.viewer;
        const signature = [this.fitting.layoutEpoch, c.clientWidth, c.clientHeight,
            v.currentScale, v.pagesRotation, v.scrollMode, v.spreadMode, this.fitting.options.margin];
        // PDF.js replaces PageViewport when a page's real dimensions or scale
        // changes. Reuse the entire layout only while both frames and viewports
        // are unchanged; scrolling alone does not require rebuilding all pages.
        if (this.boxes && Number.isFinite(signature[0]) && this.lastSignature
            && signature.every((n,i) => n === this.lastSignature[i])
            && v._pages.length === this.lastViewports.length
            && v._pages.every((page,i) => page.viewport === this.lastViewports[i])) return false;
        this.lastSignature = signature;
        this.lastViewports = v._pages.map(page => page.viewport);
        this.rebuildCount = (this.rebuildCount || 0) + 1;
		const previousBox = preservePosition && this.boxes?.[v.currentPageNumber - 1];
        const before = previousBox && {left:previousBox.x-previousBox.left,top:previousBox.y-previousBox.top};
		if (!this.hostBefore) {
			this.hostBefore = {};
			for (let key of ['position', 'width', 'height', 'overflow', 'padding', 'margin']) this.hostBefore[key] = host.style[key];
		}
		const pad = this.fitting.options.margin * Math.min(c.clientWidth, c.clientHeight);
		for (const [index, prepared] of preparedPages) {
			const page = v.getPageView(index);
			if (page && !page.pdfPage && prepared.pdfPage) page.setPdfPage(prepared.pdfPage);
		}
		const pages = v._pages.map((page, index) => {
			const prepared = preparedPages.get(index);
			const bounds = prepared?.fit.bounds || this.fitting.estimatedBounds(index);
			const w = page.viewport.width, h = page.viewport.height;
			const left = Math.max(0, bounds[0] * w - pad), top = Math.max(0, bounds[1] * h - pad);
			const right = Math.min(w, bounds[2] * w + pad), bottom = Math.min(h, bounds[3] * h + pad);
			return { index, width: right - left, height: bottom - top, left, top, right: w - right, bottom: h - bottom, ready: !!prepared };
		});
		const result = layoutReadingPages(pages, { width: c.clientWidth, height: c.clientHeight, mode: v.scrollMode, spreadMode:v.spreadMode });
		setStyles(host, { position: 'relative', width: result.width + 'px', height: result.height + 'px', overflow: 'clip', padding: '0', margin: '0' });
        let changed = !this.boxes || result.width !== this.width || result.height !== this.height;
		for (const box of result.boxes) {
            const old=this.boxes?.[box.index];
            if (old && ['x','y','left','top','right','bottom','width','height','ready'].every(k=>old[k]===box[k])) continue;
            changed=true;
			const d = v.getPageView(box.index).div;
			if (!this.saved.has(d)) {
				const before = {};
				for (let key of ['position', 'left', 'top', 'margin', 'clipPath', 'translate', 'visibility', 'border']) before[key] = d.style[key];
				this.saved.set(d, before);
			}
			setStyles(d, { position: 'absolute', left: (box.x - box.left) + 'px', top: (box.y - box.top) + 'px',
				margin: '0', border: '0', translate: 'none', visibility: box.ready ? '' : 'hidden',
				clipPath: `inset(${box.top}px ${box.right}px ${box.bottom}px ${box.left}px)` });
		}
		host.scrollLeft = host.scrollTop = 0;
		this.boxes = result.boxes; this.width=result.width; this.height=result.height;
		if (before) {
			const after=this.boxes[v.currentPageNumber-1];
            c.scrollLeft += after.x-after.left-before.left;
            c.scrollTop += after.y-after.top-before.top;
		}
        return changed;
	}
	getVisiblePages() {
		const v = this.viewer, c = v.container;
		const left = c.scrollLeft, top = c.scrollTop, right = left + c.clientWidth, bottom = top + c.clientHeight;
		const views = [], ids = new Set();
		// Layout data is small (no canvases) and also covers pages not rendered yet.
		for (const box of this.boxes) {
			const r = box.x + box.width, b = box.y + box.height;
			if (box.x >= right || r <= left || box.y >= bottom || b <= top) continue;
			const minX = Math.max(left, box.x), minY = Math.max(top, box.y), maxX = Math.min(right, r), maxY = Math.min(bottom, b);
			const view = v.getPageView(box.index);
			const x = box.x - box.left, y = box.y - box.top;
			views.push({ id: view.id, view, x, y,
				percent: Math.min(100, Math.round(100 * (maxX - minX) * (maxY - minY) / (box.width * box.height))),
				widthPercent: Math.min(100, Math.round(100 * (maxX - minX) / box.width)),
				visibleArea: { minX: minX - x, minY: minY - y, maxX: maxX - x, maxY: maxY - y } });
			ids.add(view.id);
		}
		const first = views[0], last = views.at(-1);
		views.sort((a, b) => b.percent - a.percent || a.id - b.id);
		return { first, last, views, ids };
	}
	clear() {
		this.boxes = null;
		for (const [element, before] of this.saved) Object.assign(element.style, before);
		this.saved.clear();
		if (this.hostBefore) Object.assign(this.viewer.viewer.style, this.hostBefore);
		this.hostBefore = null;
	}
	destroy() {
		this.clear();
		if (this.viewer._getVisiblePages === this.visible) this.viewer._getVisiblePages = this.originalVisible;
		if (this.viewer.scrollPageIntoView === this.scroll) this.viewer.scrollPageIntoView = this.originalScroll;
	}
}
