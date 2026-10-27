const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../build/android');
const types = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'};

(async () => {
 const server = http.createServer((req,res) => {
  let name = new URL(req.url,'http://localhost').pathname;console.log('HTTP',name);
  let file = name === '/gesture-test.pdf' ? path.resolve(__dirname, '../test/fixtures/boox-touch.pdf') : path.join(root,name);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404);res.end();return; }
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER || chromium.executablePath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const page=await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(60000);
  page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url(),r.failure()));
  page.on('pageerror',e=>console.log('PAGE ERROR',e.stack));
  await page.goto(origin+'/view.html',{waitUntil:'domcontentloaded'});console.log('View HTML loaded');
  await page.evaluate(()=>{
   window.testMessages=[];
   let channel=new MessageChannel();
   channel.port1.onmessage=e=>window.testMessages.push(JSON.parse(e.data));
   window.postMessage('initPort','*',[channel.port2]);
  });
  await page.waitForFunction(()=>window.testMessages.some(x=>x.message?.event==='onInitialized'));
  await page.evaluate(origin=>{
   const options={type:'pdf',url:origin+'/gesture-test.pdf',annotations:[],directHighlight:true,pageWidthFit:true,viewState:{pageIndex:0,scale:300,left:100,top:1200,scrollMode:0,spreadMode:0}};
   window.createView(btoa(JSON.stringify(options)));
  },origin);
  await page.waitForFunction(()=>window._view?._view?._resolveInitializedPromise===null,{timeout:60000});
  await page.evaluate(async()=>{await window._view._view._ensureBasicPageData(0);});
  await page.waitForTimeout(300);
  const stats=await page.evaluate(()=>{
   let v=window._view._view,viewer=v._iframeWindow.PDFViewerApplication.pdfViewer;
   return {scale:viewer.currentScaleValue,width:viewer.getPageView(0).div.clientWidth,viewport:viewer.container.clientWidth,native:v._nativeTextSelection.enabled,chars:v._pdfPages[0].chars.length};
  });
  console.log('Initial reader',stats);
  assert.equal(stats.scale,'page-width');assert.equal(stats.native,false);assert.ok(Math.abs(stats.width-stats.viewport)<=42);
  async function points(){return await page.evaluate(()=>{
   let v=window._view._view,viewer=v._iframeWindow.PDFViewerApplication.pdfViewer,page=viewer.getPageView(0),outer=v._iframe.getBoundingClientRect(),r=page.div.getBoundingClientRect();
   let chars=v._pdfPages[0].chars;
   function at(i){let c=chars[i],p=page.viewport.convertToViewportPoint((c.rect[0]+c.rect[2])/2,(c.rect[1]+c.rect[3])/2);return {x:r.left+outer.left+p[0],y:r.top+outer.top+p[1]};}
   return {a:at(1),b:at(17),scroll:viewer.container.scrollTop};
  });}
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  let p=await points();console.log('Gesture coordinates',p);
  await touch('touchStart',[p.a]);await page.waitForTimeout(600);
  let state=await page.evaluate(()=>({active:window._view._view._directHighlight.gesture.active,ranges:window._view._view._selectionRanges.length}));
  console.log('After hold',state);assert.equal(state.active,true);
  for(let i=1;i<=7;i++){await touch('touchMove',[{x:p.a.x+(p.b.x-p.a.x)*i/7,y:p.a.y}]);await page.waitForTimeout(25);}
  await touch('touchEnd',[]);await page.waitForTimeout(300);
  let result=await page.evaluate(()=>{
   let v=window._view._view;
   return {saved:window.testMessages.filter(x=>x.message?.event==='onSaveAnnotations').flatMap(x=>x.message.params.annotations),selection:v._iframeWindow.getSelection().toString(),scroll:v._iframeWindow.PDFViewerApplication.pdfViewer.container.scrollTop};
  });
  console.log('Highlight result',result);assert.equal(result.saved.length,1);assert.ok(result.saved[0].text.startsWith('Alpha'));assert.ok(result.saved[0].text.includes('delta'));assert.equal(result.selection,'');assert.ok(Math.abs(result.scroll-p.scroll)<2);
  await touch('touchStart',[{x:300,y:330}]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:300,y:330-i*25}]);await page.waitForTimeout(16);}
  await touch('touchEnd',[]);await page.waitForTimeout(400);
  let scroll=await page.evaluate(()=>window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.container.scrollTop);
  console.log('Quick swipe scroll',scroll);assert.ok(scroll>result.scroll+50);
  let saves=await page.evaluate(()=>window.testMessages.filter(x=>x.message?.event==='onSaveAnnotations').length);assert.equal(saves,1);
  await page.evaluate(()=>{let v=window._view._view;v._iframeWindow.PDFViewerApplication.pdfViewer.container.scrollTop=0;});await page.waitForTimeout(250);
  p=await points();let pinchOffset=await page.evaluate(()=>window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.currentScale*96/72*54);p.a.y+=pinchOffset;
  await touch('touchStart',[p.a]);await page.waitForTimeout(550);assert.equal(await page.evaluate(()=>window._view._view._directHighlight.gesture.active),true);
  await touch('touchStart',[p.a,{x:p.a.x+150,y:p.a.y+150}]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:p.a.x-i*4,y:p.a.y-i*4},{x:p.a.x+150+i*10,y:p.a.y+150+i*10}]);await page.waitForTimeout(35);}
  await touch('touchEnd',[]);await page.waitForTimeout(250);
  const pinch=await page.evaluate(()=>({active:window._view._view._directHighlight.gesture.active,saves:window.testMessages.filter(x=>x.message?.event==='onSaveAnnotations').length,scale:window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.currentScale}));
  console.log('Pinch abort',pinch);assert.equal(pinch.active,false);assert.equal(pinch.saves,1);assert.equal(await page.evaluate(()=>window._view._view._directHighlight.gesture.pointers.size),0);
  await page.evaluate(()=>{let v=window._view._view;window.pinchCalls=[];let app=v._iframeWindow.PDFViewerApplication;let orig=app.updateZoom;app.updateZoom=function(...args){window.pinchCalls.push(args);return orig.apply(this,args);};});
  for(let direct of [false,true]){await page.evaluate(d=>window.setDirectHighlight(d),direct);await touch('touchStart',[{x:200,y:400},{x:350,y:550}]);for(let i=1;i<=8;i++){await touch('touchMove',[{x:200-i*5,y:400-i*5},{x:350+i*8,y:550+i*8}]);await page.waitForTimeout(30);}await touch('touchEnd',[]);await page.waitForTimeout(200);console.log('Pinch mode',direct,await page.evaluate(()=>({calls:window.pinchCalls,scale:window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.currentScale})));}
  const toggle=await page.evaluate(()=>{window.setDirectHighlight(false);let native=window._view._view._nativeTextSelection.enabled;window.setDirectHighlight(true);return {native,direct:!window._view._view._nativeTextSelection.enabled};});
  assert.deepEqual(toggle,{native:true,direct:true});
  await page.evaluate(()=>{window.fitToWidth();window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.container.scrollTop=0;});await page.waitForTimeout(300);
  p=await points();
  let lineHeight=await page.evaluate(()=>window._view._view._iframeWindow.PDFViewerApplication.pdfViewer.currentScale*96/72*27);
  let penA={x:p.a.x,y:p.a.y+lineHeight},penB={x:p.b.x,y:p.b.y+lineHeight};
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...penA,button:'left',buttons:1,pointerType:'pen'});await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>window._view._view._directHighlight.gesture.active),true);
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',...penB,button:'left',buttons:1,pointerType:'pen'});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',...penB,button:'left',buttons:0,pointerType:'pen'});await page.waitForTimeout(250);
  let penSaved=await page.evaluate(()=>window.testMessages.filter(x=>x.message?.event==='onSaveAnnotations').flatMap(x=>x.message.params.annotations));
  assert.equal(penSaved.length,2);assert.equal(penSaved[1].text,'Alpha beta gamma delta');console.log('Pen highlight',penSaved[1].text);
  await page.setViewportSize({width:800,height:800});await page.waitForTimeout(500);
  let resized=await page.evaluate(()=>{let v=window._view._view._iframeWindow.PDFViewerApplication.pdfViewer;return {width:v.getPageView(0).div.clientWidth,viewport:v.container.clientWidth,scale:v.currentScaleValue};});
  assert.equal(resized.scale,'page-width');assert.ok(resized.width>stats.width+150);assert.ok(resized.viewport-resized.width<=42);console.log('Width after resize',resized);
  if(process.env.BOOX_TEST_SCREENSHOT) await page.screenshot({path:process.env.BOOX_TEST_SCREENSHOT});
  console.log('PASS: width and resize, selection fallback, finger and pen highlighting, scrolling, pinch interruption and PDF.js handoff');
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
