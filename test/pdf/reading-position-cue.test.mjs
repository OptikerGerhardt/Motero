import test from 'node:test';
import assert from 'node:assert/strict';
import { firstReadingWord, PDFReadingPositionCue } from '../../src/pdf/reading-position-cue.mjs';
const clip={left:0,top:0,right:200,bottom:200},identity=r=>r;
const char=(c,x,y,extra={})=>({c,rect:[x,y,x+8,y+12],...extra});

test('first reading word follows the edge and preserves a complete word',()=>{
 const chars=[char('O',10,10),char('l',18,10,{spaceAfter:true}),char('N',10,40),char('e',18,40,{wordBreakAfter:true})];
 assert.deepEqual(firstReadingWord(chars,identity,clip,30),{left:10,top:40,right:26,bottom:52});
});
test('visible crop/column excludes hidden headers, side columns and incomplete words',()=>{
 const chars=[char('H',10,0,{wordBreakAfter:true}),char('L',10,50,{wordBreakAfter:true}),char('R',110,50,{wordBreakAfter:true}),char('X',190,80),char('Y',198,80,{wordBreakAfter:true})];
 assert.deepEqual(firstReadingWord(chars,identity,{left:100,top:20,right:200,bottom:150}),{left:110,top:50,right:118,bottom:62});
});
test('projection determines visual reading rows rather than source PDF order',()=>{
 const chars=[char('B',10,60,{wordBreakAfter:true}),char('A',20,20,{wordBreakAfter:true})];
 assert.deepEqual(firstReadingWord(chars,r=>[r[0]+5,r[1]+10,r[2]+5,r[3]+10],clip),{left:25,top:30,right:33,bottom:42});
 const sameRow=[char('a',10,20,{wordBreakAfter:true}),char('A',40,17,{wordBreakAfter:true})];
 assert.equal(firstReadingWord(sameRow,identity,clip).left,10,'a taller later word on the same line cannot replace the first word');
});
test('whitespace, excluded flows and scans do not create a false word cue',()=>{
 assert.equal(firstReadingWord([],identity,clip),null);
 assert.equal(firstReadingWord([char('*',10,10,{spaceAfter:true}),char('X',10,30,{flowClass:'excluded'})],identity,clip),null);
});
function fixture({ink=false}={}) {
 const timers=new Map();let id=0,animations=0;
 const node=()=>({style:{},setAttribute(){},remove(){this.removed=true;},animate(){animations++;return{cancel(){}};}});
 const c={scrollTop:0,scrollLeft:0,clientWidth:200,clientHeight:200,clientTop:0,clientLeft:0,getBoundingClientRect:()=>({left:0,top:0})};
 const page={pdfPage:{},div:{getBoundingClientRect:()=>({left:0,top:0,right:200,bottom:200,width:200,height:200})},
  viewport:{width:200,height:200,convertToViewportRectangle:identity,convertToViewportPoint:(x,y)=>[x,y]}};
 const viewer={container:c,currentScale:1,currentPageNumber:1,getPageView:()=>page};
 const win={PDFViewerApplication:{pdfViewer:viewer},document:{createElement:node,documentElement:{append(){}}},matchMedia:()=>({matches:false}),setTimeout(fn){timers.set(++id,fn);return id;},clearTimeout(i){timers.delete(i);}};
 const view={_iframeWindow:win,_options:{deviceProfile:{eReader:ink}},_pdfPages:{0:{chars:[char('A',10,10,{wordBreakAfter:true}),char('B',10,50,{wordBreakAfter:true})]}},_ensureBasicPageData:async()=>{},_booxReader:{isOverview:()=>false}};
 const cue=new PDFReadingPositionCue(view);
 return{cue,view,c,timers,animations:()=>animations};
}
test('oval uses the first word below the guide, animates, expires and remains passive',async()=>{
 const {cue,animations,timers}=fixture();cue.schedule({pageIndex:0,point:[0,35],next:true});await cue.show(cue.pending);
 assert.match(cue.element.style.cssText,/pointer-events:none/);assert.match(cue.element.style.cssText,/top:46px/);
 assert.equal(animations(),1);const element=cue.element;timers.get(cue.expiry)();assert.equal(element.removed,true);assert.equal(cue.element,null);
});
test('e-reader profile shows a static temporary oval with no animation loop',async()=>{
 const {cue,animations}=fixture({ink:true});cue.schedule();await cue.show(cue.pending);assert.ok(cue.element);assert.equal(animations(),0);cue.clear();
});
test('navigation during extraction discards the stale cue',async()=>{
 const {cue,view,c}=fixture();let finish;view._ensureBasicPageData=()=>new Promise(r=>finish=r);
 cue.schedule();const pending=cue.show(cue.pending);c.scrollTop=30;finish();await pending;assert.equal(cue.element,null);
});
test('new scrolls supersede pending requests and clear visible ovals',async()=>{
 const {cue}=fixture();cue.schedule();const old=cue.pending;cue.onScroll();assert.notEqual(cue.pending,old);
 await cue.show(old);assert.equal(cue.element,null);
 await cue.show(cue.pending);assert.ok(cue.element);cue.onScroll();assert.equal(cue.element,null);
});
