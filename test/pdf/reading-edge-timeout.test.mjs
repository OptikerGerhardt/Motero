import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source=(await readFile(new URL('../../src/pdf/boox-reader.js',import.meta.url),'utf8')).replace(/^import .*;$/mg,'');
const {PDFBooxReader}=await import('data:text/javascript,'+encodeURIComponent(source));
test('reading edge expires after five seconds and a new edge gets its own lifetime', t=>{
    t.mock.timers.enable({apis:['setTimeout']});
    const elements=[];
    const p={pdfPage:{},viewport:{convertToViewportPoint:()=>[0,100]},div:{getBoundingClientRect:()=>({top:0}),append:e=>elements.push(e)}};
    const instance=Object.create(PDFBooxReader.prototype);
    const viewer={currentScale:1,getPageView:()=>p,container:{getBoundingClientRect:()=>({top:0,bottom:800})}};
    Object.assign(instance,{view:{_destroyed:false},win:{setTimeout,clearTimeout,PDFViewerApplication:{pdfViewer:viewer}},
        doc:{createElement:()=>({style:{},setAttribute(){},remove(){this.removed=true;}})}});
    instance.showEdge({scale:1,pageIndex:0,point:[0,100]});
    t.mock.timers.tick(4999);assert.ok(instance.edgeElement);
    t.mock.timers.tick(1);assert.equal(instance.edgeElement,null);assert.equal(elements[0].removed,true);
    instance.showEdge({scale:1,pageIndex:0,point:[0,100]});t.mock.timers.tick(4000);
    instance.showEdge({scale:1,pageIndex:0,point:[0,100]});t.mock.timers.tick(1000);assert.ok(instance.edgeElement);
    instance.clearNavigation();t.mock.timers.tick(5000);assert.equal(instance.edgeElement,null);
});
