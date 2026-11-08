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
   await page.goto(origin+'/view.html');await page.evaluate(delay=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>{
    const message=JSON.parse(e.data);
    if(message.message?.event==='onManualCropChanged' && delay) setTimeout(()=>window.messages.push(message),delay);
    else window.messages.push(message);
   };window.postMessage('initPort','*',[c.port2]);},Number(process.env.BOOX_TEST_BRIDGE_DELAY_MS)||0);
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(options=>window.createView(btoa(JSON.stringify(options))),{type,url:origin+url,annotations:[],...extra});
   if(type==='pdf') await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);
   else await page.waitForFunction(()=>window._view?._view?.initialized&&window._view._view.flow?.startRange);
   await page.waitForTimeout(100);
  }

  const fit={mode:'content',reference:'content',margin:0,revision:305};
  const read=()=>page.evaluate(()=>{const f=window._view._view._pageFitting;return {options:f.options,bounds:f.applied?.bounds,page:f.viewer.currentPageNumber};});
  const modal=()=>page.frames().find(f=>f.url().includes('/pdf/'));
  async function editor() {
   await page.evaluate(()=>window.beginManualCrop());
   await page.waitForFunction(()=>{let e=window._view._view._pageFitting.editor;return e&&!e.busy&&e.rect;});
   return modal();
  }
  async function setRect(rect) {
   // Actual touch drags of the two corner handles, rather than assigning editor state.
   for(const [handle,x,y] of [['nw',rect[0],rect[1]],['se',rect[2],rect[3]]]) {
    const p=await page.evaluate(handle=>{let e=window._view._view._pageFitting.editor,b=e.sheet.getBoundingClientRect(),r=e.root.querySelector('[data-handle='+handle+']').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,box:{x:b.left,y:b.top,w:b.width,h:b.height}};},handle);
    await touch('touchStart',[{x:p.x,y:p.y}]);
    for(let i=1;i<=5;i++) await touch('touchMove',[{x:p.x+(p.box.x+x*p.box.w-p.x)*i/5,y:p.y+(p.box.y+y*p.box.h-p.y)*i/5}]);
    await touch('touchEnd',[]);
   }
  }
  async function action(name) { await modal().locator('[data-action='+name+']').tap(); }
  async function settled() {await page.waitForFunction(()=>{let f=window._view._view._pageFitting;return !f.editor&&f.applied&&!f.applying;});}
  const close=(a,b)=>a.forEach((x,i)=>assert.ok(Math.abs(x-b[i])<.004,JSON.stringify({a,b})));
  await page.setViewportSize({width:360,height:740});
  await open('pdf','/fixture.pdf',{viewState:{pageIndex:2,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:fit});
  let before=await read();await editor();
  await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onCropEditorChanged' && x.message.params.open===true));
  const editorFrame=modal();
  for(const action of ['cancel','save','previous','next']) {
   const box=await editorFrame.locator('[data-action='+action+']').boundingBox();
   assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=360 && box.y+box.height<=740,JSON.stringify({action,box}));
  }
  if(process.env.BOOX_CROP_SCREENSHOT) await page.screenshot({path:process.env.BOOX_CROP_SCREENSHOT});
  assert.equal(await page.evaluate(()=>window.turnPageWithHardwareButton(true,0)),'ignored');
  assert.equal((await read()).page,before.page);
  await setRect([.12,.14,.82,.84]);
  await action('cancel');
  await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onCropEditorChanged' && x.message.params.open===false));
  assert.deepEqual((await read()).options,before.options);
  assert.equal(await page.evaluate(()=>window.messages.filter(x=>x.message?.event==='onManualCropChanged').length),0);
  console.log('PASS cancelling manual crop preserves document settings; hardware navigation is blocked inside the editor');

  await editor();await setRect([.12,.14,.82,.84]);
  const chosen=await page.evaluate(()=>window._view._view._pageFitting.editor.rect);
  await action('save');await settled();
  let state=await read();close(state.bounds,chosen);close(state.options.manualCrop.all,chosen);
  // MessagePort delivery to Android is asynchronous and can follow the fit.
  await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onManualCropChanged' && x.message.params.crop?.all));
  const saved=await page.evaluate(()=>window.messages.filter(x=>x.message?.event==='onManualCropChanged').at(-1).message.params.crop);
  close(saved.all,chosen);
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,0));
  close((await read()).bounds,chosen);
  await open('pdf','/fixture.pdf',{viewState:{pageIndex:1,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:{...fit,manualCrop:saved}});
  close((await read()).bounds,chosen);
  console.log('PASS touch-created all-pages crop applies to neighbors, subsequent pages and a reopened reader');

  await editor();await modal().locator('.boox-manual-crop select').selectOption('odd');
  await page.waitForFunction(()=>{let e=window._view._view._pageFitting.editor;return !e.busy&&e.index%2===0;});
  await setRect([.2,.2,.75,.8]);
  const odd=await page.evaluate(()=>window._view._view._pageFitting.editor.rect);
  await action('next');
  await page.waitForFunction(()=>!window._view._view._pageFitting.editor.busy);
  close(await page.evaluate(()=>window._view._view._pageFitting.editor.rect),odd);
  await action('previous');
  await page.waitForFunction(()=>!window._view._view._pageFitting.editor.busy);
  await action('save');await settled();state=await read();close(state.options.manualCrop.odd,odd);close(state.options.manualCrop.all,chosen);
  await editor();await modal().locator('.boox-manual-crop select').selectOption('even');
  await page.waitForFunction(()=>{let e=window._view._view._pageFitting.editor;return !e.busy&&e.index%2===1;});
  await setRect([.08,.17,.88,.86]);
  const even=await page.evaluate(()=>window._view._view._pageFitting.editor.rect);
  await action('save');await settled();
  await page.evaluate(async()=>{let v=window._view._view;await v._navigateToPage({pageIndex:2});});
  close((await read()).bounds,odd);
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,0));close((await read()).bounds,even);
  console.log('PASS odd and even PDF page crops override all-pages crop independently');

  for(const angle of [90,180,270]) {
   await page.evaluate(async angle=>{let f=window._view._view._pageFitting;f.viewer.pagesRotation=angle;await f.configure(f.options);},angle);
   await editor();await action('save');await settled();
   // All-pages save now uses the current even-page crop, converted back from display rotation.
   close((await read()).options.manualCrop.all,even);
  }
  const retained=(await read()).options.manualCrop;
  await page.evaluate(()=>{const f=window._view._view._pageFitting;return window.setPageFitting({...f.options,cropMode:'automatic'});});await settled();
  assert.deepEqual((await read()).options.manualCrop,retained);
  assert.equal((await read()).options.cropMode,'automatic');
  console.log('PASS manual crop survives display rotation and can switch to automatic detection without losing manual frames');
  assert.deepEqual(errors,[]);
  console.log('PASS: manual crop editor checks');
 } finally {if(browser) await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
