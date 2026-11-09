const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android');
const sources=path.resolve(__dirname,'../src/pdf');
const fixtures={'/plessner.pdf':process.env.BOOX_PLESSNER_PDF,
 '/fixture.pdf':path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf'),
 '/navigation.epub':process.env.BOOX_NAVIGATION_EPUB,'/navigation-rtl.epub':process.env.BOOX_NAVIGATION_RTL_EPUB};
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.epub':'application/epub+zip','.wasm':'application/wasm'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost').pathname;
  const file=fixtures[url]||(url.startsWith('/source/')?path.join(sources,url.slice(8)):path.join(root,url));
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true});page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
  const origin='http://127.0.0.1:'+server.address().port;
  const cdp=await page.context().newCDPSession(page);
  const cpuRate=Number(process.env.BOOX_TEST_CPU_RATE||1);
  if(cpuRate>1) await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  async function open(type,url,extra={}){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(options=>window.createView(btoa(JSON.stringify(options))),{type,url:origin+url,annotations:[],...extra});
   if(type==='pdf') await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);
   else await page.waitForFunction(()=>window._view?._view?.initialized&&window._view._view.flow?.startRange);
   await page.waitForTimeout(100);
   // Fitting can finish before its scroll events settle, especially in Wrapped.
   // A tap during that transition is correctly rejected as an active scroll.
   if(type==='pdf') await page.waitForFunction(()=>{const v=window._view._view;return v._pageFitting.applied&&!v._pageFitting.pendingPage&&!v._scrolling&&!v._pendingPageTurn;});
  }

  const fit={mode:'content',reference:'content',margin:0,revision:309,cropMode:'manual',manualCrop:{all:[.1,.3,.9,.6]}};
  await page.setViewportSize({width:393,height:1100});
  await open('pdf','/fixture.pdf',{viewState:{pageIndex:8,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:fit});
  await page.waitForFunction(()=>window._view._view._pageFitting.preparedPages.size>=5);
  const centered=await page.evaluate(()=>{const f=window._view._view._pageFitting,v=f.viewer;
   v.container.scrollTop=f.layout.boxes[8].y-35;
   return f.centeredPageIndex();
  });
  await page.waitForTimeout(200);
  await touch('touchStart',[{x:385,y:30}]);await touch('touchEnd',[]);
  await page.waitForFunction(()=>window._view._view._annotations.length===1);
  const bookmark=await page.evaluate(()=>window._view._view._annotations[0]);
  assert.equal(bookmark.position.pageIndex,centered);assert.equal(bookmark.color,'#000000');
  await touch('touchStart',[{x:385,y:30}]);await touch('touchEnd',[]);
  await page.waitForFunction(()=>window._view._view._annotations.length===0);
  console.log('PASS a top fragment never receives the centered page bookmark; corner toggles black bookmarks');

  await page.setViewportSize({width:600,height:800});
  await open('pdf','/fixture.pdf',{viewState:{pageIndex:8,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:{...fit,mode:'height'}});
  await page.evaluate(()=>window.beginManualCrop({nativeControls:true}));
  await page.waitForFunction(()=>{const e=window._view._view._pageFitting.editor;return e&&!e.busy;});
  assert.ok(await page.evaluate(()=>window.messages.some(m=>m.message?.event==='onCropEditorState'&&!m.message.params.busy)));
  await page.evaluate(()=>window.cropEditorAction({action:'insets',top:140,bottom:12}));
  assert.equal(await page.evaluate(()=>getComputedStyle(window._view._view._pageFitting.editor.root.querySelector('.crop-toolbar')).display),'none');
  assert.ok(await page.evaluate(()=>window._view._view._pageFitting.editor.sheet.getBoundingClientRect().top>=140));
  await page.evaluate(()=>window.cropEditorAction({action:'scope',scope:'even'}));
  await page.waitForFunction(()=>{const e=window._view._view._pageFitting.editor;return !e.busy&&e.index%2===1;});
  const index=await page.evaluate(()=>window._view._view._pageFitting.editor.index);
  await page.evaluate(()=>window.cropEditorAction({action:'next'}));
  await page.waitForFunction(i=>{const e=window._view._view._pageFitting.editor;return !e.busy&&e.index===i+2;},index);
  await page.evaluate(()=>window.cropEditorAction({action:'previous'}));
  await page.waitForFunction(i=>{const e=window._view._view._pageFitting.editor;return !e.busy&&e.index===i;},index);
  await page.evaluate(()=>window.cropEditorAction({action:'save'}));
  await page.waitForFunction(()=>{const f=window._view._view._pageFitting;return !f.editor&&f.applied;});
  assert.equal(await page.evaluate(()=>window._view._view._pageFitting.options.mode),'height');
  const saved=await page.evaluate(()=>window._view._view._pageFitting.options.manualCrop);
  await page.evaluate(()=>{const f=window._view._view._pageFitting;return window.setPageFitting({...f.options,cropMode:'automatic'});});
  assert.deepEqual(await page.evaluate(()=>window._view._view._pageFitting.options.manualCrop),saved);
  await page.evaluate(()=>window.beginManualCrop({nativeControls:true}));
  await page.evaluate(()=>window.cropEditorAction({action:'cancel'}));
  assert.equal(await page.evaluate(()=>window._view._view._pageFitting.options.cropMode),'automatic');
  console.log('PASS native crop commands, measured insets, parity, save, cancel and preserved fitting/crops');

  // Jump by position, without selecting a note or showing an annotation popup.
  await page.evaluate(async()=>{const v=window._view._view;await v._booxReader.addBookmark(8);});
  const id=await page.evaluate(()=>window._view._view._annotations.find(a=>a.type==='note').id);
  await page.evaluate(id=>window.focusReaderBookmark(id),id);
  await page.waitForFunction(()=>{const f=window._view._view._pageFitting;return !window._view._view._pendingPageTurn&&f.viewer.currentPageNumber===9;});
  assert.deepEqual(await page.evaluate(()=>window._view.getSelectedAnnotationIDs()),[]);
  assert.equal(await page.evaluate(()=>window._view._view._readerChromeVisible),false);
  console.log('PASS bookmark focus navigates without selection or reader chrome');
  for(const type of ['highlight','underline','note','text','image','ink']){
   const key=await page.evaluate(type=>{
    const m=window._view._annotationManager;
    return m.addAnnotation({type,color:'#2ea8e5',comment:'Ordinary annotation',pageLabel:'7',sortIndex:'00006|000100|00000',text:'Annotation text',
     position:type==='ink'?{pageIndex:6,width:2,paths:[[100,300,150,350]]}:{pageIndex:6,rects:[[100,300,150,350]],fontSize:12,rotation:0}}).id;
   },type);
   await page.evaluate(id=>window.focusReaderAnnotation(id),key);
   await page.waitForFunction(()=>{const v=window._view._view;return v._pageFitting.viewer.currentPageNumber===7&&!v._pendingPageTurn;});
   assert.deepEqual(await page.evaluate(()=>window._view.getSelectedAnnotationIDs()),[]);
   assert.equal(await page.evaluate(()=>window._view._view._readerChromeVisible),false);
  }
  console.log('PASS direct focus for all six annotation types preserves fitting without selection or reader chrome');

  // Rapid alternating requests keep the final target and bound analysis state.
  const rapid=await page.evaluate(async()=>{const w=window._view._view,f=w._pageFitting,v=f.viewer;
   const prepare=f.prepare, first=f.geometry.get(0);
   // Force a late buffered crop and two frames while navigation awaits its target.
   // This used to move scroll offsets and cancel the entire queued turn sequence.
   f.prepare=async function(...args){const result=await prepare.apply(this,args);
    if(first){const bounds=first.fit.bounds.slice();bounds[3]=Math.min(1,bounds[3]+.01);f.geometry.set(0,{...first,fit:{...first.fit,bounds}});}
    f.queueGeometryRefresh();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return result;};
   try {
    const directions=[1,1,1,-1,1,-1,-1,1,1];let expected=v.currentPageNumber;
    const jobs=directions.map(d=>{expected=Math.max(1,Math.min(v.pagesCount,expected+d));return w._navigateToPage({direction:d});});
    await Promise.all(jobs);return {expected,actual:v.currentPageNumber,running:f.work.running,cache:f.cache.size,prepared:f.preparedPages.size};
   } finally {f.prepare=prepare;if(first)f.geometry.set(0,first);f.queueGeometryRefresh();}
  });
  assert.equal(rapid.actual,rapid.expected,JSON.stringify(rapid));assert.ok(rapid.running<=2&&rapid.cache<=32&&rapid.prepared<=32);
  console.log('PASS rapid alternating turns retain the final target with bounded analysis/cache');
  const turnsBefore=await page.evaluate(()=>window.messages.filter(m=>m.message?.event==='onEdgePageTurnTap').length);
  await touch('touchStart',[{x:590,y:450}]);
  await touch('touchMove',[{x:530,y:460}]);await touch('touchMove',[{x:590,y:450}]);
  await touch('touchEnd',[]);await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.messages.filter(m=>m.message?.event==='onEdgePageTurnTap').length),turnsBefore);
  console.log('PASS a drag returning to its starting edge is never mistaken for a tap');
  assert.deepEqual(errors,[]);console.log('PASS: Build 309 reader refinements');
 } finally {if(browser) await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
