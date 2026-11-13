const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android'),fixture=path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf');
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,file=u==='/fixture.pdf'?fixture:path.join(root,u);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:900,height:1000},isMobile:true,hasTouch:true});page.setDefaultTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.stack));
  const origin='http://127.0.0.1:'+server.address().port,cdp=await page.context().newCDPSession(page);
  const touch=(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  for(const activation of ['initial','switch'])for(const spreadMode of process.env.BOOX_SPREAD_MODE?[Number(process.env.BOOX_SPREAD_MODE)]:[1,2])for(const scrollMode of process.env.BOOX_SPREAD_SCROLL?[Number(process.env.BOOX_SPREAD_SCROLL)]:[0,1,2]){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(m=>m.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/fixture.pdf',annotations:[],pageNavigation:'jumped',
    viewState:{pageIndex:5,scale:'page-width',scrollMode,spreadMode:activation==='initial'?spreadMode:0},pageFitting:{mode:'content',reference:'cropped-content',margin:0}});
   await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);
   if(activation==='switch'){
    await page.evaluate(m=>window._view.setSpreadMode(m),spreadMode);
    await page.waitForFunction(m=>{const f=window._view._view._pageFitting;return f.applied&&f.viewer.spreadMode===m&&f.layout.boxes&&f.preparedPages.size>=2;},spreadMode);
    await page.waitForFunction(()=>{const v=window._view._view,w=v._pageFitting.viewer;return w._getVisiblePages().views.every(p=>p.view.div.querySelector('canvas'));});
   }
   const pair=()=>page.evaluate(()=>{const v=window._view._view,f=v._pageFitting,w=f.viewer;
    return{index:w.currentPageNumber-1,spread:w.spreadMode,scale:w.currentScale,active:f.active,
     visible:w._pages.filter(p=>getComputedStyle(p.div).visibility!=='hidden').map(p=>p.id-1),
     frames:f.pageFrames(),viewport:f.viewportFrame(),worker:!!f.analysisWorker.worker};});
   for(const mode of ['content','width','height']){
    await page.evaluate(mode=>window._view._view._pageFitting.configure({mode,reference:'cropped-content',margin:0}),mode);
    const state=await pair();assert.equal(state.active,true);assert.equal(state.visible.length,2,JSON.stringify({spreadMode,scrollMode,mode,state}));
    const boxes=state.visible.map(i=>state.frames[i]);const mid=(Math.min(...boxes.map(b=>b.left))+Math.max(...boxes.map(b=>b.right)))/2;
    const top=Math.min(...boxes.map(b=>b.top)),bottom=Math.max(...boxes.map(b=>b.bottom));
    if(bottom-top<=state.viewport.bottom-state.viewport.top+2) assert.ok(Math.abs((top+bottom-state.viewport.top-state.viewport.bottom)/2)<3,'short spreads must be vertically centered '+JSON.stringify({activation,mode,top,bottom,viewport:state.viewport}));
    assert.ok(Math.abs(mid-(state.viewport.left+state.viewport.right)/2)<3,'spread centers as a unit '+JSON.stringify({spreadMode,scrollMode,mode,mid,boxes,viewport:state.viewport}));
   }
   await page.evaluate(()=>window._view._view._pageFitting.configure({mode:'content',cropMode:'manual',
    manualCrop:{odd:[.15,.1,.85,.95],even:[.1,.12,.82,.93]},margin:0}));
   const manual=await pair();assert.equal(manual.visible.length,2);
   assert.equal(await page.evaluate(()=>window._view._view._pageFitting.options.cropMode),'manual');
   // Jumped swipe/edge navigation must advance to the next pair, not its partner.
   await page.evaluate(()=>window._view._view._pageFitting.configure({mode:'content',reference:'cropped-content',cropMode:'automatic',margin:0}));
   const before=await pair();await touch('touchStart',[{x:885,y:500}]);await touch('touchEnd');
   const expectedNext=Math.max(...before.visible)+1;
   await page.waitForFunction(i=>window._view._view._pageFitting.viewer.currentPageNumber===i+1,expectedNext);
   const after=await pair();assert.deepEqual(after.visible,[expectedNext,expectedNext+1]);assert.equal(after.spread,spreadMode);
   // Two complete pages are still ordinary spread reading. Only further pinch-out
   // to multiple reading units remains in overview after releasing the fingers.
   assert.equal(await page.evaluate(()=>window._view._view._booxReader.isOverview()),false);
   // A reflow can swallow TouchEvent endings after the authoritative pointer
   // releases. Navigation must not retain a stale two-finger visibility lock.
   if(scrollMode===1) await page.evaluate(()=>{const n=window._view._view._pageNavigation;n.win.removeEventListener('touchend',n.onEnd,true);n.win.removeEventListener('touchcancel',n.onEnd,true);});
   await touch('touchStart',[{x:350,y:450},{x:550,y:450}]);
   await page.evaluate(()=>{window._view._view._pageFitting.viewer.currentScale=.16;});await touch('touchEnd');
   try{await page.waitForFunction(()=>window._view._view._pageFitting.presentation==='overview',null,{timeout:5000});}catch(error){console.error('OVERVIEW STATE',JSON.stringify({spreadMode,scrollMode,state:await pair(),extra:await page.evaluate(()=>{const f=window._view._view._pageFitting;return{origin:f.gestureOrigin,presentation:f.presentation,zooming:f.zooming,pointers:f.pointers.size,touches:f.touches};})}));throw error;}
   const target=await page.evaluate(()=>{const f=window._view._view._pageFitting,c=f.viewportFrame();const p=f.pageFrames().find(p=>p.left>=c.left&&p.right<=c.right&&p.top>=c.top&&p.bottom<=c.bottom);
    return{index:p.index,x:(p.left+p.right)/2,y:(p.top+p.bottom)/2};});
   const staleFrame=activation==='initial'&&spreadMode===2&&scrollMode===1;
   if(staleFrame) await page.evaluate(()=>{
    const f=window._view._view._pageFitting,commit=f.commit,apply=f.apply;
    f.commit=function(prepared,...args){this.commit=commit;return commit.call(this,{...prepared,width:prepared.width+1},...args);};
    f.apply=async function(...args){this.apply=apply;window.fallbackPending=true;await new Promise(resolve=>window.releaseFallback=resolve);return apply.apply(this,args);};
   });
   await touch('touchStart',[target]);await touch('touchEnd');
   if(staleFrame){
    await page.waitForFunction(()=>window.fallbackPending);
    assert.equal(await page.evaluate(index=>{const v=window._view._view,f=v._pageFitting;return !!v._booxReader.entering&&f.active&&f.presentation==='reading'&&f.viewer.currentPageNumber===index+1;},target.index),true,'reading flags can precede the completed stale-geometry fallback');
    await page.evaluate(()=>{window.releaseFallback();delete window.releaseFallback;delete window.fallbackPending;});
   }
   // enterPage may need a second preparation after a viewport change. Its
   // reading flags alone do not mean the destination fit has been committed.
   try { await page.waitForFunction(index=>{const v=window._view._view,f=v._pageFitting;return !v._booxReader.entering&&f.active&&!f.zooming&&f.presentation==='reading'&&f.viewer.currentPageNumber===index+1&&f.applied?.pageIndex===index&&Math.abs(f.applied.scale-f.viewer.currentScale)<.002;},target.index,{timeout:10000}); } catch(error) {console.error('RESTORE STATE',JSON.stringify({spreadMode,scrollMode,target,state:await pair(),extra:await page.evaluate(()=>{const v=window._view._view;return{presentation:v._pageFitting.presentation,applied:v._pageFitting.applied,readingMode:v._booxReader.readingMode,fit:v._booxReader.readingFit,entering:!!v._booxReader.entering};})}));throw error;}
   const restored=await pair();assert.equal(restored.spread,spreadMode);
   const first=spreadMode===1?target.index-target.index%2:target.index===0?0:target.index-(target.index-1)%2;
   const expected=spreadMode===2&&target.index===0?[0]:[first,first+1].filter(i=>i<restored.frames.length);
   assert.deepEqual(restored.visible,expected,'cover/final singleton or the complete destination pair must remain visible '+JSON.stringify(await page.evaluate(()=>{const v=window._view._view,n=v._pageNavigation,f=v._pageFitting;return{multitouch:n.multitouch,single:n.single,overview:v._booxReader.isOverview(),touches:f.touches,pointers:f.pointers.size};})));
   if(scrollMode===1) await page.evaluate(()=>{const n=window._view._view._pageNavigation;n.win.addEventListener('touchend',n.onEnd,{capture:true,passive:false});n.win.addEventListener('touchcancel',n.onEnd,{capture:true,passive:false});});
   const fitted=expected.map(i=>restored.frames[i]);
   assert.ok(fitted.every(b=>b.left>=restored.viewport.left-3&&b.right<=restored.viewport.right+3
    &&b.top>=restored.viewport.top-3&&b.bottom<=restored.viewport.bottom+3),'overview tap restores Fit to Content for the destination unit');
   assert.equal(restored.worker,true,'raster crop work uses the actual packaged Worker');
   if(activation==='switch'&&spreadMode===1&&scrollMode===0){
    await page.evaluate(async()=>{const v=window._view._view;window.setPageNavigation('continuous');await v._pageFitting.configure({mode:'none'});await v._booxReader.enterPage(0);});
    await page.waitForTimeout(350);
    const center=await page.evaluate(()=>{const f=window._view._view._pageFitting,c=f.viewportFrame(),frames=f.pageFrames().slice(0,2);return{mid:(Math.min(...frames.map(p=>p.top))+Math.max(...frames.map(p=>p.bottom)))/2,expected:(c.top+c.bottom)/2};});
    assert.ok(Math.abs(center.mid-center.expected)<3,'Continuous overview return stays centered even with fitting Off '+JSON.stringify(center));
   }
   console.log(`PASS ${activation} spread ${spreadMode}, scroll ${scrollMode}: all fits, both pages, edge turn, persistent overview and tap-to-restore`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
