const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=process.env.BOOX_TEST_READER_BUILD||path.resolve(__dirname,'../build/android'),fixture=path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf');
(async()=>{
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname,file=u==='/fixture.pdf'?fixture:path.join(root,u);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:393,height:1000},isMobile:true,hasTouch:true});page.setDefaultTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.stack));
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  async function open(mode,fit=true){
   await page.goto('http://127.0.0.1:'+server.address().port+'/view.html');
   await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(m=>m.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:'http://127.0.0.1:'+server.address().port+'/fixture.pdf',annotations:[],pageNavigation:'jumped',directHighlight:true,
    viewState:{pageIndex:5,scale:'page-fit',scrollMode:mode,spreadMode:0},
    pageFitting:{mode:fit?'width':'none',reference:'cropped-content',margin:0,cropMode:'manual',manualCrop:{all:[.1,.3,.9,.6]}}});
   try { await page.waitForFunction(()=>window._view?._view?._resolveInitializedPromise===null, null, {timeout:15000}); }
   catch(e) { console.error('OPEN',errors,await page.evaluate(()=>{const v=window._view?._view,f=v?._pageFitting;return {exists:!!v,options:v?._options,fitting:f?.applied,pages:f?.viewer._pages.length,messages:window.messages.slice(-4)};})); throw e; }
   if(fit)await page.waitForFunction(()=>window._view._view._pageFitting.applied);
   await page.waitForFunction(()=>{const v=window._view._view;return !v._scrolling&&!v._pendingPageTurn&&!v._pageFitting.applying;});
   await page.evaluate(()=>window._view._view._pageNavigation.sync());
  }
  const snapshot=()=>page.evaluate(()=>{
   const v=window._view._view,f=v._pageFitting,c=f.viewportFrame(),frames=f.pageFrames();
   return{number:f.viewer.currentPageNumber,single:f.viewer.viewer.classList.contains('motero-jumped'),visible:frames.filter(r=>r.right>c.left&&r.left<c.right&&r.bottom>c.top&&r.top<c.bottom&&getComputedStyle(f.viewer.getPageView(r.index).div).visibility!=='hidden').map(r=>r.index)};
  });
  const assertCentered=async()=>{
   const delta=await page.evaluate(()=>{const f=window._view._view._pageFitting,r=f.pageFrames()[f.viewer.currentPageNumber-1],c=f.viewportFrame();return(r.top+r.bottom-c.top-c.bottom)/2;});
   assert.ok(Math.abs(delta)<2,'current page must be vertically centered, delta='+delta);
  };
  for(const mode of process.env.BOOX_NAV_MODE ? [Number(process.env.BOOX_NAV_MODE)] : [0,1,2]){
   await open(mode);
   assert.equal((await snapshot()).single,true);assert.equal((await snapshot()).visible.length,1);
   await assertCentered();
   // Real touch input, not a direct call to the navigation implementation.
   const start=await page.evaluate(()=>{const f=window._view._view._pageFitting,r=f.pageFrames()[f.viewer.currentPageNumber-1],c=f.viewportFrame();return{x:(Math.max(r.left,c.left)+Math.min(r.right,c.right))/2,y:(Math.max(r.top,c.top)+Math.min(r.bottom,c.bottom))/2};});
   const before=await snapshot();
   await touch('touchStart',[start]);await page.waitForTimeout(30);
   const down=await page.evaluate(()=>{const v=window._view._view,n=v._pageNavigation;return {gesture:n.gesture,enabled:n.enabled,overview:v._booxReader.isOverview()};});
   for(let i=1;i<=4;i++)await touch('touchMove',[{x:start.x-(mode===1?i*25:0),y:start.y-(mode===1?0:i*25)}]);
   await touch('touchEnd',[]);
   try { await page.waitForFunction(n=>window._view._view._pageFitting.viewer.currentPageNumber===n,before.number+1,{timeout:5000}); }
   catch(e) { console.error('SWIPE', {mode,start,before,down},await snapshot(),await page.evaluate(()=>{const v=window._view._view;return {pending:!!v._pendingPageTurn,pointers:[...v._pageFitting.pointers],touches:v._pageFitting.touches,selected:v.getSelectedAnnotations(),overview:v._booxReader.isOverview()};}));throw e; }
   await page.waitForTimeout(100);
   assert.equal((await snapshot()).visible.length,1);
   await assertCentered();
   for(const [x,step] of [[389,1],[4,-1]]){
    const previous=(await snapshot()).number;
    await touch('touchStart',[{x,y:500}]);await touch('touchEnd',[]);
    await page.waitForFunction(n=>{const v=window._view._view;return v._pageFitting.viewer.currentPageNumber===n&&!v._pendingPageTurn;},previous+step);
    await assertCentered();
   }
   await page.evaluate(()=>window.turnPageWithHardwareButton(true,0));
   await assertCentered();
   const now=(await snapshot()).number;
   await touch('touchStart',[start]);await touch('touchMove',[{x:start.x+4,y:start.y+4}]);await touch('touchEnd',[]);
   await page.waitForTimeout(100);assert.equal((await snapshot()).number,now,'short movement must not turn a page');
   // Returning to continuous immediately makes neighboring cropped pages visible.
   await page.evaluate(()=>window.setPageNavigation('continuous'));
   assert.equal((await snapshot()).single,false);
   if(mode===0)assert.ok((await snapshot()).visible.length>1,'short cropped pages are continuous');
   const centered=await page.evaluate(()=>window._view._view._pageFitting.centeredPageIndex());
   await page.evaluate(()=>window.setPageNavigation('jumped'));
   await page.waitForFunction(i=>{const v=window._view._view;return v._pageFitting.viewer.currentPageNumber===i+1&&!v._pendingPageTurn;},centered);
   assert.equal((await snapshot()).visible.length,1,'mode switch centers the reading page');
   await assertCentered();
   // A genuine two-finger handoff reveals the full page and its neighbors.
   await touch('touchStart',[{x:100,y:350},{x:290,y:650}]);
   assert.equal((await snapshot()).single,false);
   await page.evaluate(()=>{const f=window._view._view._pageFitting;f.viewer.currentScale=.15;});
   await touch('touchEnd',[]);
   await page.waitForFunction(()=>window._view._view._pageFitting.presentation==='overview');
   assert.equal((await snapshot()).single,false);
   await page.waitForFunction(()=>!window._view._view._scrolling);
   const target=await page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const v=window._view._view,f=v._pageFitting,c=f.viewportFrame(),r=f.pageFrames().find(r=>r.index>f.viewer.currentPageNumber-1&&r.top>=c.top&&r.bottom<=c.bottom&&r.left>=c.left&&r.right<=c.right);return r&&{index:r.index,x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};});
   assert.ok(target,'an overview page can be tapped');
   assert.equal(await page.evaluate(p=>window._view._view.pointerEventToPosition({clientX:p.x,clientY:p.y})?.pageIndex,target),target.index);
   await touch('touchStart',[target]);await touch('touchEnd',[]);
   try { await page.waitForFunction(i=>{const v=window._view._view,f=v._pageFitting;return f.presentation==='reading'&&f.viewer.currentPageNumber===i+1;},target.index,{timeout:5000}); }
   catch(e) { console.error('OVERVIEW TAP',{mode,target},await snapshot(),await page.evaluate(()=>{const v=window._view._view,f=v._pageFitting;return {presentation:f.presentation,entering:!!v._booxReader.entering,active:f.active,applied:f.applied,pending:!!v._pendingPageTurn,pointers:[...f.pointers],touches:f.touches};}));throw e; }
   assert.equal((await snapshot()).single,true);assert.equal((await snapshot()).visible.length,1);
   await assertCentered();
   assert.equal(await page.evaluate(()=>window._view._view._pageFitting.touches),0,'page jumps cannot leave a stale touch active');
   console.log('PASS jumped swipe, tap threshold, continuous, two-finger overview and page return; mode '+mode);
  }
  await open(0,false);
  assert.equal((await snapshot()).visible.length,1);
  await page.mouse.wheel(0,100);
  await page.waitForFunction(()=>window._view._view._pageFitting.viewer.currentPageNumber===7);
  assert.equal((await snapshot()).visible.length,1);
  await assertCentered();
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,0));
  await assertCentered();
  for(const pageIndex of [0,11]){
   await page.evaluate(i=>window._view._view._navigateToPage({pageIndex:i}),pageIndex);
   await assertCentered();
  }
  console.log('PASS jumped page navigation without cropping and mouse-wheel input');
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
