import test from 'node:test';
import assert from 'node:assert/strict';
import { AndroidPageFitting } from '../../src/pdf/android-page-fitting.js';

function fixture() {
	let timers = new Map(), serial = 0;
    let viewer;
    const container = {clientWidth:600,clientHeight:800,scrollLeft:0,scrollTop:0,addEventListener(){},removeEventListener(){}};
    const pages = Array.from({length:4},(_,index)=>{
        const div = {clientLeft:0,clientTop:0,style:{clipPath:'',translate:''},
            get offsetLeft(){return parseFloat(this.style.left)||0;}, get offsetTop(){return parseFloat(this.style.top)||index*800;},
            get clientWidth(){return 600*viewer.currentScale;},get clientHeight(){return 800*viewer.currentScale;},
            getBoundingClientRect(){return {left:this.offsetLeft-container.scrollLeft,top:this.offsetTop-container.scrollTop};}};
        return {id:index+1,pdfPage:{getViewport:()=>({width:600,height:800})}, div,
            get viewport(){return {width:div.clientWidth,height:div.clientHeight};}};
    });
    viewer={container,viewer:{style:{}},_pages:pages,pagesCount:4,currentPageNumber:2,currentScale:1,pagesRotation:0,spreadMode:0,scrollMode:0,
        pdfDocument:{numPages:4,getPage:async n=>pages[n-1].pdfPage},getPageView:i=>pages[i],scrollPageIntoView(){},
        _getVisiblePages(){return {views:[]};},_setCurrentPageNumber(n){this.currentPageNumber=n;}};
	let win={PDFViewerApplication:{pdfViewer:viewer,eventBus:{on(){},off(){}}},addEventListener(){},removeEventListener(){},
		requestAnimationFrame:f=>{timers.set(++serial,f);return serial;},cancelAnimationFrame:id=>timers.delete(id),
        setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:id=>timers.delete(id)};
	let view={_iframeWindow:win,_tool:{type:'pointer'},_render(){},_updateViewStats(){}};
	let fitting=new AndroidPageFitting(view);
	fitting.boundsFor=async i=>i%2?[.1,.2,.7,.6]:[.2,.2,.8,.6];
	async function flush() {let jobs=[...timers.values()];timers.clear();jobs.forEach(f=>f());await new Promise(setImmediate);}
	return {fitting,viewer,pages,container,flush,timers};
}

test('prepared buffered pages have compact, centered crops without blocking the target',async()=>{
	let {fitting,pages}=fixture();
	assert.equal(await fitting.configure({mode:'content',reference:'content',margin:0}),true);
    for (let i=0;i<pages.length;i++) fitting.rememberPrepared(await fitting.prepare(i));
    fitting.layout.apply(fitting.geometry);
    for (const page of pages) assert.match(page.div.style.clipPath,/^inset\(/);
    const boxes = fitting.layout.boxes;
    for (let i=1;i<boxes.length;i++) assert.equal(boxes[i].y-boxes[i-1].y-boxes[i-1].height,12);
    assert.ok(boxes.every(b=>Math.abs(b.x+b.width/2-300)<0.001));
	fitting.configure({mode:'none'});
	for(let p of pages) {assert.equal(p.div.style.clipPath,'');assert.equal(p.div.style.translate,'');}
});

test('finger zoom keeps the selected mode and refits only after the final touch ends',async()=>{
	let {fitting,viewer,pages,flush}=fixture();
	await fitting.configure({mode:'content',reference:'content',margin:0,revision:304});
	let scale=viewer.currentScale;
	fitting.onTouch({touches:[{},{}]});
	viewer.currentScale=scale*1.5;fitting.onScale();
	assert.equal(fitting.active,true);assert.equal(fitting.state().pageFitMode,'content');
	assert.equal(pages[1].div.style.clipPath,'');
	fitting.onTouch({touches:[{}]});await flush();
	assert.equal(viewer.currentScale,scale*1.5);
	fitting.onTouch({touches:[]});await flush();
	assert.equal(viewer.currentScale,scale);assert.equal(fitting.zooming,false);
	assert.match(pages[1].div.style.clipPath,/^inset\(/);
});

test('one-finger scrolling keeps every crop and never recenters the scroll',async()=>{
    const {fitting,pages,container,flush}=fixture();
    await fitting.configure({mode:'content',reference:'content',margin:0});
    const clips=pages.map(p=>p.div.style.clipPath);
    fitting.onDown({pointerId:1,clientX:100,clientY:100});
    container.scrollTop=137; fitting.onUp({pointerId:1}); await flush();
    assert.equal(container.scrollTop,137); assert.equal(fitting.active,true);
    assert.deepEqual(pages.map(p=>p.div.style.clipPath),clips);
});

test('a second finger reveals the original page even without changing zoom',async()=>{
    const {fitting,pages,viewer,flush}=fixture();
    await fitting.configure({mode:'content',reference:'content',margin:0});
    const scale=viewer.currentScale;
    fitting.onDown({pointerId:1,clientX:100,clientY:100});
    assert.match(pages[1].div.style.clipPath,/^inset\(/);
    fitting.onDown({pointerId:2,clientX:150,clientY:100});
    assert.equal(pages[1].div.style.clipPath,'');
    fitting.onUp({pointerId:2});await flush();assert.equal(fitting.zooming,true);
    fitting.onUp({pointerId:1});await flush();
    assert.equal(fitting.zooming,false);assert.equal(viewer.currentScale,scale);
    assert.match(pages[1].div.style.clipPath,/^inset\(/);
});

test('Off during a zoom cancels the pending fit and is never undone on release',async()=>{
	let {fitting,viewer,pages,flush}=fixture();
	await fitting.configure({mode:'content',reference:'content'});
	fitting.onTouch({touches:[{},{}]});viewer.currentScale*=1.5;fitting.onScale();
	await fitting.configure({mode:'none'});fitting.onTouch({touches:[]});await flush();
	assert.equal(fitting.active,false);assert.equal(fitting.state().pageFitMode,'none');
	for(let p of pages) assert.equal(p.div.style.clipPath,'');
});

test('input during target preparation invalidates the commit',async()=>{
	let {fitting,pages}=fixture();
	await fitting.configure({mode:'content',reference:'content'},false);fitting.active=true;
	let release;fitting.boundsFor=i=>i===1?new Promise(r=>release=r):Promise.resolve([.1,.2,.8,.7]);
	let pending=fitting.prepare(1);await new Promise(setImmediate);
	fitting.onDown({pointerId:1,clientX:100,clientY:100});release([.1,.2,.8,.7]);
	assert.equal(fitting.commit(await pending),false);
	assert.ok(pages.every(p=>p.div.style.clipPath===''));
});

test('two complete pages retain overview; panning keeps it and zooming back to one page restores fit',async()=>{
 const {fitting,viewer,flush}=fixture();await fitting.configure({mode:'content',reference:'content'});
 fitting.beginPeek();viewer.currentScale=.2;
 fitting.pageFrames=()=>[{index:0,left:0,right:200,top:0,bottom:300},{index:1,left:0,right:200,top:312,bottom:612}];
 fitting.finishGesture();assert.equal(fitting.presentation,'overview');assert.equal(fitting.active,false);
 fitting.beginPeek();fitting.finishGesture();assert.equal(fitting.presentation,'overview');
 fitting.beginPeek();viewer.currentScale=.8;
 fitting.pageFrames=()=>[{index:1,left:0,right:500,top:0,bottom:700}];
 fitting.finishGesture();await flush();assert.equal(fitting.active,true);assert.equal(fitting.presentation,'reading');
});

test('uncached landscape analysis does not inherit a portrait width profile', async()=>{
    const {fitting}=fixture();delete fitting.boundsFor;
    fitting.readingModel={aspect:.75,profiles:[[.1,.1,.9,.9],[.1,.1,.9,.9]],width:.8,repeated:new Set()};
    fitting.modelPromise=Promise.resolve(fitting.readingModel);
    const image={width:100,height:100,data:new Uint8ClampedArray(100*100*4).fill(255)};
    for(let y=20;y<80;y++)for(let x=10;x<30;x++){
        const i=(y*100+x)*4;image.data[i]=image.data[i+1]=image.data[i+2]=0;
    }
    fitting.readPage=async index=>({index,aspect:4/3,image,lines:[{text:'Complete landscape page content.',rect:[.1,.2,.3,.8]}]});
    const bounds=await fitting.boundsFor(0);
    assert.ok(bounds[2]<.5,JSON.stringify(bounds));
});


test('late same-parity evidence refines only provisional geometry and retains valid results', async()=>{
    const {fitting,viewer,flush}=fixture();viewer.pdfDocument.numPages=18;
    const pending=Promise.resolve({bounds:[.1,.04,.9,.9]});
    fitting.cache.set(8,pending);fitting.cache.set(5,pending);fitting.provisionalPages.add(8);
    for(const index of [6,7,8]) fitting.analysisLines.set(index,{index,aspect:.75,lines:[]});
    fitting.refineAfterLearning();await flush();
    assert.equal(fitting.cache.get(8),pending,'two same-parity samples do not finalize the model');
    fitting.analysisLines.set(10,{index:10,aspect:.75,lines:[]});
    fitting.refineAfterLearning();await flush();
    assert.ok(!fitting.cache.has(8),'new local evidence invalidates the provisional result');
    assert.equal(fitting.cache.get(5),pending,'already valid geometry remains cached');
});


test('background crop refinement waits until the pen stroke has finished',async()=>{
    const {fitting,flush}=fixture();fitting.active=true;
    let refits=0;fitting.schedule=()=>refits++;
    fitting.onDown({pointerId:77,pointerType:'pen'});
    fitting.view.action={type:'ink'};
    fitting.refineAfterLearning(true);await flush();
    assert.equal(refits,0);assert.equal(fitting.penPointers.size,1);
    delete fitting.view.action;fitting.onUp({pointerId:77});await flush();
    assert.equal(refits,1);assert.equal(fitting.penPointers.size,0);
});

test('buffered geometry cannot move the viewport while a page turn owns it',async()=>{
    const {fitting,flush}=fixture();
    await fitting.configure({mode:'content',reference:'content',margin:0});
    let layouts=0;const apply=fitting.layout.apply.bind(fitting.layout);
    fitting.layout.apply=(...args)=>{layouts++;return apply(...args);};
    fitting.preparedPages.clear();
    fitting.view._pendingPageTurn={};
    fitting.prefetchVisible();await flush();await flush();
    assert.equal(layouts,0,'background page preparation must not invalidate the navigation snapshot');
    fitting.view._pendingPageTurn=null;await flush();await flush();
    assert.ok(layouts>0,'the buffered geometry is applied after navigation');
});

test('a scheduled reading refit defers to a queued page turn',async()=>{
    const {fitting,flush}=fixture();fitting.active=true;
    let applies=0;fitting.apply=async()=>{applies++;return true;};
    fitting.view._pendingPageTurn={};fitting.schedule(0);await flush();
    assert.equal(applies,0);
    fitting.view._pendingPageTurn=null;await flush();
    assert.equal(applies,1);
});


test('manual fitting uses its saved frame even after an automatic paper reference', async () => {
    const { fitting } = fixture();
    await fitting.configure({ mode: 'width', reference: 'page', cropMode: 'manual', manualCrop: { all: [.1,.1,.9,.9] } }, false);
    assert.equal(fitting.options.reference, 'cropped-content');
    await fitting.configure({ ...fitting.options, reference: 'page', cropMode: 'automatic' }, false);
    assert.equal(fitting.options.reference, 'page');
    assert.deepEqual(fitting.options.manualCrop.all, [.1,.1,.9,.9]);
});
