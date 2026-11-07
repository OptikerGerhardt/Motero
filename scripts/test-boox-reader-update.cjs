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
  const fit={mode:'content',reference:'content',margin:0,includeMarginalia:false,revision:304};
  const cropped=pages=>pages.every(p=>p.clip.startsWith('inset('));
  await open('pdf','/fixture.pdf',{viewState:{pageIndex:8,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:fit});
  const neighborhood=()=>page.evaluate(()=>{
   const f=window._view._view._pageFitting,v=f.viewer,index=v.currentPageNumber-1;
   return {active:f.active,index,scale:v.currentScale,mode:f.state().pageFitMode,pages:[index-1,index,index+1].filter(i=>i>=0&&i<v.pdfDocument.numPages).map(i=>{
    const p=v.getPageView(i),d=p.div,r=d.getBoundingClientRect();return {i,clip:d.style.clipPath,translate:d.style.translate,rect:[r.left,r.top,r.right,r.bottom]};})};
  });
  let original=await neighborhood();assert.ok(cropped(original.pages),JSON.stringify(original));
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,0));
  let next=await neighborhood();assert.equal(next.index,original.index+1);assert.ok(cropped(next.pages),JSON.stringify(next));
  await page.evaluate(()=>window.turnPageWithHardwareButton(false,0));
  assert.equal((await neighborhood()).index,original.index);
  console.log('PASS current and previous/next pages are cropped before hardware navigation completes');

  // Real two-finger input: the fit is temporarily free and returns on release.
  original=await neighborhood();
  await touch('touchStart',[{x:210,y:350},{x:390,y:530}]);
  for(let i=1;i<=8;i++){await touch('touchMove',[{x:210-i*8,y:350-i*8},{x:390+i*8,y:530+i*8}]);await page.waitForTimeout(25);}
  assert.equal((await neighborhood()).mode,'content');
  await touch('touchEnd',[]);
  await page.waitForFunction(scale=>{const f=window._view._view._pageFitting;return f.active&&!f.zooming&&Math.abs(f.viewer.currentScale-scale)<.003;},original.scale);
  assert.ok(cropped((await neighborhood()).pages));
  console.log('PASS real finger zoom returns to the selected fit after release');

  const panBefore=await page.evaluate(()=>window._view._view._pageFitting.viewer.container.scrollLeft);
  await touch('touchStart',[{x:350,y:400}]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:350-i*12,y:400}]);await page.waitForTimeout(20);}
  await touch('touchEnd',[]);await page.waitForTimeout(250);
  const pan=await page.evaluate(()=>{let f=window._view._view._pageFitting;return {x:f.viewer.container.scrollLeft,active:f.active,mode:f.state().pageFitMode,peek:f.peekPageIndex,index:f.viewer.currentPageNumber-1};});
  assert.equal(pan.active,true);assert.equal(pan.mode,'content');assert.equal(pan.peek,pan.index);assert.ok(Math.abs(pan.x-panBefore)>8,JSON.stringify({pan,panBefore}));
  assert.equal((await neighborhood()).pages.find(p=>p.i===pan.index).clip,'');
  assert.ok((await neighborhood()).pages.filter(p=>p.i!==pan.index).every(p=>p.clip.startsWith('inset(')));
  console.log('PASS real one-finger panning reveals margins without resetting the chosen fit or uncropping neighbors');

  // The user's complete PDF is checked independently of the synthetic fixtures.
  if(fixtures['/plessner.pdf']) {
  await open('pdf','/plessner.pdf',{viewState:{pageIndex:0,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:fit});
  const pdf=await page.evaluate(async()=>{
   const {getReadingExclusions}=await import('/source/reading-layout.mjs');
   const f=window._view._view._pageFitting,model=await f.ensureModel(),rows=[];let labels=0;
   for(let i=0;i<f.viewer.pdfDocument.numPages;i++){
    const data=await f.readPage(i),bounds=await f.boundsFor(i),excluded=getReadingExclusions(data.lines,model,i);
    const footer=data.lines.filter(l=>l.rect[1]>.94);
    const bodyBottom=Math.max(...data.lines.filter(l=>l.rect[3]<.92).map(l=>l.rect[3]));
    const noteLabels=data.lines.filter(l=>/^PDF-Seite\s+\d/.test(l.text)&&l.rect[1]<.92);
    labels+=noteLabels.length;
    rows.push({page:i+1,bottom:bounds[3],bodyBottom,footerCount:footer.length,allFooterExcluded:footer.every(l=>excluded.includes(l.rect)),notesKept:noteLabels.every(l=>!excluded.includes(l.rect))});
   }
   return {rows,labels,cacheSize:f.cache.size};
  });
  assert.equal(pdf.rows.length,116);assert.equal(pdf.labels,19);assert.ok(pdf.cacheSize<=32);
  for(const row of pdf.rows){assert.equal(row.allFooterExcluded,true,JSON.stringify(row));assert.equal(row.notesKept,true,JSON.stringify(row));assert.ok(row.bottom<.93&&row.bottom>=row.bodyBottom-.006,JSON.stringify(row));}
  console.log('PASS all 116 original Plessner pages exclude the footer/rule; complete body and all 19 note source labels remain; cache bounded');

  } else console.log('SKIP private original Plessner PDF; set BOOX_PLESSNER_PDF to run this additional regression');

  for(const rtl of [false,true]) for(const flowMode of ['paginated','scrolled']){
   await open('epub',rtl?'/navigation-rtl.epub':'/navigation.epub',{viewState:{scale:1},flowMode});
   await page.evaluate(flowMode=>window._view._view.setFlowMode(flowMode),flowMode);
   await page.waitForTimeout(150);
   const epubState=()=>page.evaluate(()=>{const v=window._view._view;return {cfi:v.flow.startCFI?.toString(),chapter:v.flow.startSection?.index,y:v._iframeWindow.scrollY,max:v._iframeDocument.documentElement.scrollHeight-v._iframe.clientHeight};});
   if(flowMode==='scrolled'){
    await page.evaluate(()=>{const v=window._view._view;v._iframeWindow.scrollTo(0,v._iframeDocument.documentElement.scrollHeight-v._iframe.clientHeight-40);});
    await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>window.turnPageWithHardwareButton(true)),'page');
    let state=await epubState();assert.ok(Math.abs(state.y-state.max)<2,JSON.stringify(state));
    assert.equal(await page.evaluate(()=>window.turnPageWithHardwareButton(true)),'none');
    await page.evaluate(()=>window._view._view._iframeWindow.scrollTo(0,40));await page.waitForTimeout(80);
    assert.equal(await page.evaluate(()=>window.turnPageWithHardwareButton(false)),'page');assert.ok((await epubState()).y<2);
   }
   await page.evaluate(()=>window._view._view.navigateToFirstPage());await page.waitForTimeout(80);
   let count=0;
   while((await epubState()).chapter===0&&count++<50){await page.evaluate(()=>window.turnPageWithHardwareButton(true));await page.waitForTimeout(30);}
   assert.equal((await epubState()).chapter,1,`${flowMode} rtl=${rtl}: chapter boundary`);
   count=0;
   while((await epubState()).chapter===1&&count++<50){await page.evaluate(()=>window.turnPageWithHardwareButton(false));await page.waitForTimeout(30);}
   assert.equal((await epubState()).chapter,0);
   await page.evaluate(()=>{let v=window._view._view,e=v._iframeDocument.createElement('textarea');e.id='hardware-input';v._iframeDocument.body.append(e);e.focus();});
   const before=await epubState();assert.equal(await page.evaluate(()=>window.turnPageWithHardwareButton(true)),'ignored');assert.equal((await epubState()).cfi,before.cfi);
   await page.evaluate(()=>window._view._view._iframeDocument.getElementById('hardware-input').remove());
   // Resolve the real CFI anchor, then toggle via the normal annotation manager.
   await page.evaluate(()=>window._view._view.navigateToFirstPage());await page.waitForTimeout(100);
   const bookmarkTap=await page.evaluate(()=>{let r=window._view._view._iframe.getBoundingClientRect();return {x:r.left+r.width*.9,y:r.top+r.height*.04};});
   await touch('touchStart',[bookmarkTap]);await touch('touchEnd',[]);
   await page.waitForFunction(()=>window._view._view._annotations.length===1);
   const bookmark=await page.evaluate(()=>window._view._view._annotations[0]);assert.equal(bookmark.type,'note');assert.equal(bookmark.color,'#aaaaaa');
   await touch('touchStart',[bookmarkTap]);await touch('touchEnd',[]);
   await page.waitForFunction(()=>window._view._view._annotations.length===0);
   await page.waitForFunction(id=>window.messages.some(m=>m.message?.event==='onDeleteAnnotations'&&m.message.params.ids.includes(id)),bookmark.id);
   console.log(`PASS EPUB ${flowMode}, rtl=${rtl}: forward/backward chapters, end fragments, editing guard and bookmark deletion through persistence`);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS reader update regressions');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
