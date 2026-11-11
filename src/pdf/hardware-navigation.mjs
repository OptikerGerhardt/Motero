import {readingUnit,unitFrame} from './reading-unit.mjs';
// Hardware navigation works in CSS viewport pixels and never crosses a PDF page
// during a scroll step. A subsequent press at the edge changes pages.
const EDGE_TOLERANCE = 1.5;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function getHardwareScrollLimits(view, viewer, page) {
	let { container } = viewer;
	let height = container.clientHeight;
	let div = page?.div;
	if (!div || !(height > 0) || !(div.clientHeight > 0)) return null;
	let top = container.scrollTop + div.getBoundingClientRect().top + div.clientTop
		- container.getBoundingClientRect().top - container.clientTop;
	let fullMax = Math.max(0, div.clientHeight - height);
	let pageFit = view._pageFitting;
	const indices=readingUnit(viewer.currentPageNumber-1,viewer.pagesCount || viewer._pages?.length || viewer.currentPageNumber+1,viewer.spreadMode);
    const frames=pageFit?.active && pageFit.layout?.boxes;
    const frame=frames && unitFrame(frames,indices);
    let box=frame && {y:frame.top,height:frame.bottom-frame.top};
	if (box) {
		const min = Math.max(0, box.height <= height ? box.y + (box.height - height) / 2 : box.y);
		return { min, max: Math.max(min, box.y + box.height - height), viewportHeight: height };
	}
	if (pageFit?.active && pageFit.options.mode !== 'width'
			&& pageFit.applied?.pageIndex === viewer.currentPageNumber - 1
			&& pageFit.applied.scale === viewer.currentScale) {
		// The entire fitted height is already visible. Do not scroll through
		// hidden paper margins before accepting the next page button press.
		return { min: pageFit.applied.top, max: pageFit.applied.top, viewportHeight: height };
	}
	if (viewer.spreadMode && indices.length>1) {
        const rects=indices.map(i=>viewer.getPageView(i)?.div.getBoundingClientRect()).filter(Boolean);
        const y0=Math.min(...rects.map(r=>r.top)), y1=Math.max(...rects.map((r,i)=>r.bottom??r.top+viewer.getPageView(indices[i]).div.clientHeight));
        const origin=container.scrollTop+y0-container.getBoundingClientRect().top-container.clientTop;
        const min=Math.max(0,origin+Math.min(0,(y1-y0-height)/2));
        return {min,max:Math.max(min,origin+y1-y0-height),viewportHeight:height};
    }
    let start = 0, end = fullMax;
	if (pageFit?.active && pageFit.options.mode === 'width'
			&& pageFit.options.reference === 'cropped-content'
			&& pageFit.applied?.pageIndex === viewer.currentPageNumber - 1
			&& pageFit.applied.scale === viewer.currentScale) {
		let margin = Math.max(0, pageFit.options.margin || 0) * Math.min(container.clientWidth, height);
		start = clamp(pageFit.applied.bounds[1] * div.clientHeight - margin, 0, fullMax);
		end = clamp(pageFit.applied.bounds[3] * div.clientHeight + margin - height, start, fullMax);
	}
	let fit = view._appliedContentFit;
	if (fit && fit.scale === viewer.currentScale && view._contentFit
			&& fit.margin === view._contentFit.margin && viewer.spreadMode === 0) {
		let margin = Math.max(0, fit.margin || 0) * Math.min(container.clientWidth, height);
		start = clamp(fit.bounds[1] * div.clientHeight - margin, 0, fullMax);
		end = clamp(fit.bounds[3] * div.clientHeight + margin - height, start, fullMax);
	}
	return { min: top + start, max: top + end, viewportHeight: height };
}

export async function navigateWithHardwareButton(view, next, fraction = 2 / 3) {
	if (!view || view._destroyed || view._pageFitting?.editor) return 'ignored';
	let viewer = view._iframeWindow?.PDFViewerApplication?.pdfViewer;
	if (!viewer) {
		let navigate = next ? view.navigateToNextPage : view.navigateToPreviousPage;
		if (!navigate || view.initialized === false) return 'ignored';
		let canNavigate = next ? view.canNavigateToNextPage : view.canNavigateToPreviousPage;
		if (canNavigate && !canNavigate.call(view)) return 'none';
		await navigate.call(view);
		return 'page';
	}
    fraction = Number.isFinite(fraction) ? clamp(fraction, 0, 1) : 2 / 3;
    const c = viewer.container;
    if (view._pageNavigation?.mode === 'continuous' && fraction > 0 && !view._pageFitting?.columnActive) {
        const horizontal = viewer.scrollMode === 1;
        const axis = horizontal ? 'scrollLeft' : 'scrollTop';
        const size = horizontal ? c.clientWidth : c.clientHeight;
        const extent = horizontal ? c.scrollWidth : c.scrollHeight;
        if (Number.isFinite(extent)) {
            const origin=c[axis], target=clamp(origin+(next?1:-1)*size*fraction,0,Math.max(0,extent-size));
            if (Math.abs(target-origin)<.1) return 'none';
            view._onManualNavigation?.(); view._cancelPendingPageTurn?.();
            const edge=view._booxReader?.captureEdge(next);
            c[axis]=target;
            viewer.update?.();
            view._pageFitting?.prefetchVisible();
            view._booxReader?.showEdge(edge);
            return 'scroll';
        }
    }
	let index = viewer.currentPageNumber - 1;
	let page = viewer.getPageView(index);
	let limits = getHardwareScrollLimits(view, viewer, page);
	if (!limits) return 'ignored';
	fraction = Number.isFinite(fraction) ? clamp(fraction, 0, 1) : 2 / 3;
	let { container } = viewer;
	let remaining = next ? limits.max - container.scrollTop : container.scrollTop - limits.min;
	if (fraction > 0 && limits.max - limits.min > EDGE_TOLERANCE
			&& remaining > EDGE_TOLERANCE) {
		view._onManualNavigation?.();
		view._cancelPendingPageTurn?.();
		let edge = view._booxReader?.captureEdge(next);
		container.scrollTop = clamp(container.scrollTop + (next ? 1 : -1)
			* limits.viewportHeight * fraction, limits.min, limits.max);
		view._booxReader?.showEdge(edge);
		return 'scroll';
	}
    if (view._pageFitting?.turnColumn?.(next)) return 'column';
	const unit=readingUnit(index,viewer.pagesCount || viewer._pages?.length || index+2,viewer.spreadMode);
    let targetIndex=next ? unit.at(-1)+1 : unit[0]-1;
	let target = viewer.getPageView(targetIndex);
	if (!target) return 'none';
	// Resolve destination geometry before leaving the page. Abort a delayed
	// request if the user scrolls, zooms, resizes or navigates meanwhile.
	if (!target.pdfPage && viewer.pdfDocument?.getPage) {
		let snapshot = [container.scrollTop, container.scrollLeft, container.clientWidth,
			container.clientHeight, viewer.currentScale, viewer.scrollMode];
		let pdfPage;
		try { pdfPage = await viewer.pdfDocument.getPage(targetIndex + 1); }
		catch { return 'none'; }
		let current = [container.scrollTop, container.scrollLeft, container.clientWidth,
			container.clientHeight, viewer.currentScale, viewer.scrollMode];
		if (view._destroyed || viewer.currentPageNumber - 1 !== index
				|| snapshot.some((value, i) => value !== current[i])) return 'ignored';
		if (!target.pdfPage) target.setPdfPage?.(pdfPage);
	}
	view._onManualNavigation?.();
	await view._navigateToPage({ direction: next ? 1 : -1 });
	if (view._destroyed || !readingUnit(viewer.currentPageNumber-1,viewer.pagesCount || viewer._pages?.length || targetIndex+1,viewer.spreadMode).includes(targetIndex)) return 'ignored';
    if (view._pageNavigation?.mode === 'jumped') {
        view._pageNavigation.centerCurrentPage({ direction: next ? 1 : -1 });
        return 'page';
    }
	// Keep the existing zoom and horizontal pan. Only choose the vertical entry
	// point: top going forward, bottom going backward. No animated scrolling.
	limits = getHardwareScrollLimits(view, viewer, viewer.getPageView(targetIndex));
	if (limits) container.scrollTop = next ? limits.min : limits.max;
	return 'page';
}
