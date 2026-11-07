import test from 'node:test';
import assert from 'node:assert/strict';
import { AndroidPageFitting } from '../../src/pdf/android-page-fitting.js';

function fixture() {
	let timers = new Map(), serial = 0;
	let pages = Array.from({length:4},(_,index)=>({pdfPage:{getViewport:()=>({width:600,height:800})},
		div:{offsetLeft:0,offsetTop:index*800,clientLeft:0,clientTop:0,clientWidth:600,clientHeight:800,style:{clipPath:'',translate:''}}}));
	let container={clientWidth:600,clientHeight:800,scrollLeft:0,scrollTop:0};
	let viewer={container,currentPageNumber:2,currentScale:1,pagesRotation:0,spreadMode:0,
		pdfDocument:{numPages:4,getPage:async n=>pages[n-1].pdfPage},getPageView:i=>pages[i],scrollPageIntoView(){}};
	let win={PDFViewerApplication:{pdfViewer:viewer,eventBus:{on(){},off(){}}},addEventListener(){},removeEventListener(){},
		setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:id=>timers.delete(id)};
	let view={_iframeWindow:win,_tool:{type:'pointer'},_render(){},_updateViewStats(){}};
	let fitting=new AndroidPageFitting(view);
	fitting.boundsFor=async i=>i%2?[.1,.2,.7,.6]:[.2,.2,.8,.6];
	async function flush() {let jobs=[...timers.values()];timers.clear();jobs.forEach(f=>f());await new Promise(setImmediate);}
	return {fitting,viewer,pages,container,flush,timers};
}

test('current and both neighboring pages are cropped and aligned in the same commit',async()=>{
	let {fitting,pages}=fixture();
	assert.equal(await fitting.configure({mode:'content',reference:'content',margin:0}),true);
	for(let i of [0,1,2]) assert.match(pages[i].div.style.clipPath,/^inset\(/);
	assert.equal(pages[3].div.style.clipPath,'');
	let middle=pages[1].div.clientWidth*.4;
	for(let i of [0,2]) assert.ok(Math.abs(pages[i].div.clientWidth*.5+parseFloat(pages[i].div.style.translate)-middle)<1e-6);
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

test('panning can reveal the current margin without disabling the fit or uncropping neighbors',async()=>{
	let {fitting,pages,container,flush}=fixture();
	await fitting.configure({mode:'content',reference:'content',margin:0});
	fitting.onDown({pointerId:1,clientX:100,clientY:100});
	fitting.onMove({pointerId:1,pointerType:'touch',clientX:130,clientY:150});
	container.scrollTop=137;fitting.onUp({pointerId:1});await flush();
	assert.equal(container.scrollTop,137);assert.equal(fitting.active,true);
	assert.equal(fitting.state().pageFitMode,'content');assert.equal(pages[1].div.style.clipPath,'');
	for(let i of [0,2]) assert.match(pages[i].div.style.clipPath,/^inset\(/);
});

test('a highlight drag keeps the crop and takes precedence over temporary margin peeking',async()=>{
	let {fitting,pages}=fixture();
	await fitting.configure({mode:'content',reference:'content',margin:0});
	fitting.view._directHighlight={gesture:{active:true}};
	fitting.onDown({pointerId:1,clientX:100,clientY:100});
	fitting.onMove({pointerId:1,pointerType:'touch',clientX:150,clientY:100});
	assert.equal(fitting.peekPageIndex,null);assert.match(pages[1].div.style.clipPath,/^inset\(/);
});

test('Off during a zoom cancels the pending fit and is never undone on release',async()=>{
	let {fitting,viewer,pages,flush}=fixture();
	await fitting.configure({mode:'content',reference:'content'});
	fitting.onTouch({touches:[{},{}]});viewer.currentScale*=1.5;fitting.onScale();
	await fitting.configure({mode:'none'});fitting.onTouch({touches:[]});await flush();
	assert.equal(fitting.active,false);assert.equal(fitting.state().pageFitMode,'none');
	for(let p of pages) assert.equal(p.div.style.clipPath,'');
});

test('input during neighbor preparation invalidates the entire commit',async()=>{
	let {fitting,pages}=fixture();
	await fitting.configure({mode:'content',reference:'content'},false);fitting.active=true;
	let release;fitting.boundsFor=i=>i===2?new Promise(r=>release=r):Promise.resolve([.1,.2,.8,.7]);
	let pending=fitting.prepare(1);await new Promise(setImmediate);
	fitting.onDown({pointerId:1,clientX:100,clientY:100});release([.1,.2,.8,.7]);
	assert.equal(fitting.commit(await pending),false);
	assert.ok(pages.every(p=>p.div.style.clipPath===''));
});
