import { getHardwareScrollLimits } from '../pdf/hardware-navigation.mjs';

export async function settleReaderViewport(view) {
    const win = view._iframeWindow;
    if (!win?.requestAnimationFrame) return;
    let before;
    for (let i=0;i<6;i++) {
        await new Promise(resolve=>win.requestAnimationFrame(resolve));
        if (view._destroyed) return;
        const size=win.innerWidth+':'+win.innerHeight;
        if (size===before) return;
        before=size;
    }
}

/** Use the reading page controller before positioning an annotation. Native
 * PDF.js annotation destinations bypass cropped/Jumped page ownership. */
export function navigateReaderAnnotation(view, annotation) {
    const request={};view._readerAnnotationNavigation=request;
    const previous=view._readerAnnotationNavigationQueue || Promise.resolve();
    const task=previous.catch(()=>{}).then(async()=>{
        if(view._destroyed || view._readerAnnotationNavigation!==request)return false;
        await settleReaderViewport(view);
        if(view._destroyed || view._readerAnnotationNavigation!==request)return false;
        const index=annotation.position?.pageIndex;
        if (!Number.isInteger(index)) {
            await view.navigate({position:annotation.position});
        } else {
            if (view._booxReader?.isOverview()) await view._booxReader.enterPage(index);
            else await view._navigateToPage({pageIndex:index});
            if (view._destroyed || view._readerAnnotationNavigation!==request)return false;
            const fitting=view._pageFitting, v=fitting?.viewer || view._iframeWindow?.PDFViewerApplication?.pdfViewer;
            if (v && v.currentPageNumber !== index+1 || fitting?.zooming) return false;
            const page=v?.getPageView(index), rect=annotation.position?.rects?.[0];
            if(page && rect && !view._booxReader?.isOverview()) {
                // A right-column annotation must remain in that column when
                // subsequent SmartScroll continues the user's reading.
                if(fitting?.columnActive && fitting.column?.columns?.length) {
                    const converted=page.viewport.convertToViewportRectangle(rect);
                    const x=(converted[0]+converted[2])/2/page.viewport.width;
                    const column=fitting.column.columns.reduce((best,b,i)=>Math.abs((b[0]+b[2])/2-x)
                        <Math.abs((fitting.column.columns[best][0]+fitting.column.columns[best][2])/2-x)?i:best,0);
                    const prepared=fitting.preparedPages.get(index);
                    if(prepared){fitting.column={...fitting.column,index:column,bounds:fitting.column.columns[column]};prepared.columnIndex=column;fitting.positionColumn(prepared);}
                }
                const c=v.container,b=c.getBoundingClientRect(),r=view.getClientRectForPopup(annotation.position);
                const limits=getHardwareScrollLimits(view,v,page);
                if(limits && limits.max-limits.min>1.5) c.scrollTop=Math.max(limits.min,Math.min(limits.max,
                    c.scrollTop+(r[1]+r[3])/2-b.top-c.clientHeight/2));
            }
        }
        return !view._destroyed && view._readerAnnotationNavigation===request;
    });
    view._readerAnnotationNavigationQueue=task;
    return task;
}
