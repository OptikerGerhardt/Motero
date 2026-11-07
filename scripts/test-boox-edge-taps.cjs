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
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  async function open(type,url,extra={}){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(options=>window.createView(btoa(JSON.stringify(options))),{type,url:origin+url,annotations:[],...extra});
   if(type==='pdf') await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);
   else await page.waitForFunction(()=>window._view?._view?.initialized&&window._view._view.flow?.startRange);
   await page.waitForTimeout(100);
  }

  const fit={mode:'content',reference:'content',margin:0,revision:305};
  async function tap(x,y,hold=0) {await touch('touchStart',[{x,y}]);if(hold)await page.waitForTimeout(hold);await touch('touchEnd',[]);await page.waitForTimeout(500);}
  const state=()=>page.evaluate(()=>{let v=window._view._view,f=v._pageFitting;return {page:f.viewer.currentPageNumber,scale:f.viewer.currentScale,mode:f.viewer.scrollMode,notes:v._annotations.length,edges:window.messages.filter(x=>x.message?.event==='onEdgePageTurnTap').length};});
  for(const scrollMode of [0,1,2]) {
   await open('pdf','/fixture.pdf',{viewState:{pageIndex:4,scale:'page-width',scrollMode,spreadMode:0},pageFitting:fit});
   let original=await state();
   await tap(590,450);
   assert.equal((await state()).page,original.page+1,'right edge mode '+scrollMode);
   await tap(10,450);
   assert.equal((await state()).page,original.page,'left edge mode '+scrollMode);
   assert.equal((await state()).edges,2);
   let before=await state();await tap(590,450,550);
   assert.equal((await state()).page,before.page);assert.equal((await state()).edges,before.edges);
   await touch('touchStart',[{x:590,y:450}]);
   await touch('touchMove',[{x:565,y:465}]);await touch('touchMove',[{x:540,y:480}]);await touch('touchEnd',[]);
   await page.waitForTimeout(500);assert.equal((await state()).edges,before.edges);
   // Bookmark priority is independent of selections that a legitimate long press may create.
   await open('pdf','/fixture.pdf',{viewState:{pageIndex:4,scale:'page-width',scrollMode,spreadMode:0},pageFitting:fit});
   await page.waitForFunction(()=>!window._view._view._scrolling);
   await tap(590,35);await page.waitForFunction(()=>window._view._view._annotations.length===1);
   assert.equal((await state()).page,original.page,'bookmark takes priority');
   await page.waitForFunction(()=>!window._view._view._scrolling);
   await tap(590,35);await page.waitForFunction(()=>window._view._view._annotations.length===0);
   assert.equal((await state()).page,original.page,'bookmark deletion consumes tap');
   console.log('PASS real left/right, long-press, swipe and bookmark priority in PDF scroll mode '+scrollMode);
  }
  await open('pdf','/fixture.pdf',{readOnly:true,viewState:{pageIndex:1,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:fit});
  await tap(590,450);assert.equal((await state()).page,3);
  await tap(10,450);assert.equal((await state()).page,2);
  assert.equal((await state()).notes,0);
  console.log('PASS read-only PDFs still support edge navigation');
  assert.deepEqual(errors,[]);console.log('PASS: all scroll mode edge tap checks');
 } finally {if(browser) await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
