const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android'),fixture=path.resolve(__dirname,'../test/fixtures/boox-columns.pdf');
require('./make-column-fixture.cjs');
const blankFixture=require('./make-blank-fixture.cjs');
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,file=u==='/fixture.pdf'?fixture:u==='/blank.pdf'?blankFixture:path.join(root,u);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:900,height:1000},isMobile:true,hasTouch:true,deviceScaleFactor:3});page.setDefaultTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.stack));
  const origin='http://127.0.0.1:'+server.address().port,cdp=await page.context().newCDPSession(page);
  const touch=(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  await page.setViewportSize({width:393,height:900});
  const open=async(mode='jumped')=>{
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(m=>m.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/fixture.pdf',annotations:[],directHighlight:true,pageNavigation:mode,viewState:{pageIndex:0,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:{mode:'width',reference:'cropped-content',margin:0}});
   await page.waitForFunction(()=>!!window._view?._view?._pageFitting?.applied);
  };
  for(const mode of ['jumped']){
   await open(mode);
   const state=()=>page.evaluate(()=>{const v=window._view._view,f=v._pageFitting,c=f.viewer.container,p=f.viewer.getPageView(f.viewer.currentPageNumber-1),b=f.column.bounds;
    return{index:f.viewer.currentPageNumber-1,column:f.column.index,top:c.scrollTop,left:c.scrollLeft,scale:f.viewer.currentScale,
     center:p.div.getBoundingClientRect().left+(b[0]+b[2])*p.div.clientWidth/2,viewport:c.getBoundingClientRect().left+c.clientWidth/2};});
   let before=await state();assert.equal(before.column,0);assert.ok(Math.abs(before.center-before.viewport)<3,JSON.stringify(before));
   for(let step=0;step<12;step++){await page.evaluate(()=>window.turnPageWithHardwareButton(true,.5));if((await state()).column===1)break;}
   const right=await state();assert.equal(right.index,0);assert.equal(right.column,1);assert.ok(Math.abs(right.center-right.viewport)<3,JSON.stringify(right));
   assert.ok(right.top<before.top+5,'right column starts at its top');assert.equal(right.scale,before.scale);
   await page.evaluate(()=>window._view._view._pageFitting.apply());
   assert.equal((await state()).scale,before.scale,'a right-column refit retains text size despite unequal column widths');
   await page.waitForTimeout(400);
   await page.evaluate(()=>window._view._view._pageNavigation.centerCurrentPage({direction:1}));
   const refit=await state();assert.ok(Math.abs(refit.center-refit.viewport)<3,JSON.stringify(refit));
   for(let step=0;step<12;step++){await page.evaluate(()=>window.turnPageWithHardwareButton(true,.5));if((await state()).index===1)break;}
   const next=await state();assert.equal(next.index,1);assert.equal(next.column,0);
   for(let step=0;step<12;step++){await page.evaluate(()=>window.turnPageWithHardwareButton(false,.5));if((await state()).index===0)break;}
   const previous=await state();assert.equal(previous.index,0);assert.equal(previous.column,1,'backwards entry uses the previous page last column');
   console.log('PASS '+mode+': column width, left-to-right order, next page and reverse reading order');
  }
  await open('jumped');
  await page.evaluate(()=>window._view._view._pageFitting.configure({mode:'content',reference:'cropped-content',margin:0}));
  await page.evaluate(()=>window._view._view.initializedPromise);
  await page.waitForFunction(()=>window._view._view._pageFitting.viewer.getPageView(0).renderingState===3);
  await page.waitForFunction(()=>!window._view._view._scrolling);
  const point=await page.evaluate(()=>{const v=window._view._view,r=v.getClientRect([360,500,360,500],0);return{x:r[0],y:r[1]};});
  for(let i=0;i<2;i++){await touch('touchStart',[point]);await touch('touchEnd');await page.waitForTimeout(70);}
  await page.waitForFunction(()=>window._view._view._pageFitting.doubleTapReturn&&window._view._view._pageFitting.column?.index===1);
  await page.waitForFunction(()=>window._view._view._pageFitting.viewer.getPageView(0).renderingState===3);
  await page.evaluate(()=>window.stableCanvas=window._view._view._pageFitting.viewer.getPageView(0).canvas);
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,.33));
  const focus=await page.evaluate(()=>{const v=window._view._view,f=v._pageFitting,c=f.viewer.container,p=f.viewer.getPageView(0),b=f.column.bounds;return{column:f.column.index,offset:p.div.getBoundingClientRect().left+(b[0]+b[2])*p.div.clientWidth/2-c.clientWidth/2,detail:p.enableDetailCanvas};});
  assert.equal(focus.column,1);assert.ok(Math.abs(focus.offset)<3,JSON.stringify(focus));assert.equal(focus.detail,false);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>{const p=window._view._view._pageFitting.viewer.getPageView(0);return p.canvas===window.stableCanvas&&!p.detailView&&p.canvas.width*p.canvas.height<=p.maxCanvasPixels*1.01;}),true,'column scrolling reuses its bounded raster at device pixel ratio 3');
  console.log('PASS real double tap on the right column retains its focus through SmartScroll with a stable page raster');
  await open('jumped');
  await page.evaluate(()=>window._view.setPageNavigation('continuous'));
  await page.waitForFunction(()=>{const f=window._view._view._pageFitting;return !f.columnActive&&!f.columnLayout&&!!f.applied;});
  assert.equal(await page.evaluate(()=>window._view._view._pageFitting.column),null);
  console.log('PASS switching to Continuous fits the full text width and disables column navigation');
  await page.evaluate(()=>window._view.setPageNavigation('jumped'));
  await page.waitForFunction(()=>window._view._view._pageFitting.columnActive);
  const oldScale=await page.evaluate(()=>window._view._view._pageFitting.viewer.currentScale);
  await touch('touchStart',[{x:100,y:450},{x:290,y:450}]);
  for(let i=1;i<=7;i++){await touch('touchMove',[{x:100+i*10,y:450},{x:290-i*10,y:450}]);await page.waitForTimeout(30);}
  const pinchScale=await page.evaluate(()=>window._view._view._pageFitting.viewer.currentScale);
  assert.ok(pinchScale<oldScale*.8,JSON.stringify({oldScale,pinchScale}));
  await touch('touchEnd');await page.waitForFunction(()=>!window._view._view._pageFitting.zooming);
  await page.evaluate(()=>window._view._view._booxReader.enterPage(0));
  assert.equal(await page.evaluate(()=>window._view._view._pageFitting.columnActive),true);
  console.log('PASS two-finger pinch still zooms and restores column reading');
  await page.evaluate(()=>window._view._view._pageFitting.configure({mode:'width',reference:'cropped-content',cropMode:'manual',manualCrop:{all:[.1,.1,.9,.9]},margin:0}));
  assert.equal(await page.evaluate(()=>window._view._view._pageFitting.column),null,'manual frames retain their exact fitting instead of automatic columns');
  console.log('PASS manual cropping keeps its explicit frame');
  await page.evaluate(()=>window._view.setPageNavigation('continuous'));
  await page.waitForFunction(()=>!window._view._view._pageFitting.columnActive);
  await page.evaluate(()=>window._view._view._pageFitting.ensureModel());
  for(const mode of [0,1,2]){
   await page.evaluate(async mode=>{const v=window._view._view;v.setScrollMode(mode);await v._pageFitting.configure({mode:'content',reference:'cropped-content',cropMode:'automatic',margin:0});},mode);
   const before=await page.evaluate(mode=>{const c=window._view._view._pageFitting.viewer.container;return{offset:mode===1?c.scrollLeft:c.scrollTop,size:mode===1?c.clientWidth:c.clientHeight,max:mode===1?c.scrollWidth-c.clientWidth:c.scrollHeight-c.clientHeight};},mode);
   const result=await page.evaluate(()=>window.turnPageWithHardwareButton(true,.5));
   const offset=await page.evaluate(mode=>{const c=window._view._view._pageFitting.viewer.container;return mode===1?c.scrollLeft:c.scrollTop;},mode);
   assert.equal(result,'scroll');assert.ok(Math.abs(offset-Math.min(before.max,before.offset+before.size*.5))<=1,JSON.stringify({mode,before,offset}));
   console.log('PASS continuous '+mode+': real viewport scroll carries the requested fraction across page boundaries');
   // Verify axis locking with real orthogonal overflow, rather than a
   // fit-to-content page which could not move sideways anyway.
   await page.setViewportSize(mode===1?{width:900,height:393}:{width:393,height:900});
   await page.evaluate(async mode=>{const v=window._view._view;await v._pageFitting.configure({mode:mode===1?'width':'height',reference:'cropped-content',cropMode:'automatic',margin:0});v._pageNavigation.sync();},mode);
   const cross=await page.evaluate(mode=>{const c=window._view._view._pageFitting.viewer.container;return {offset:mode===1?c.scrollTop:c.scrollLeft,overflow:mode===1?c.scrollHeight-c.clientHeight:c.scrollWidth-c.clientWidth};},mode);
   assert.ok(cross.overflow>20,JSON.stringify({mode,cross}));
   const start=mode===1?{x:600,y:180}:{x:250,y:500};
   await touch('touchStart',[start]);
   for(let i=1;i<=5;i++){await touch('touchMove',[{x:start.x-i*(mode===1?24:14),y:start.y-i*(mode===1?14:24)}]);await page.waitForTimeout(25);}
   await touch('touchEnd');await page.waitForTimeout(400);
   const afterCross=await page.evaluate(mode=>{const c=window._view._view._pageFitting.viewer.container;return mode===1?c.scrollTop:c.scrollLeft;},mode);
   assert.ok(Math.abs(cross.offset-afterCross)<2,JSON.stringify({mode,cross,afterCross}));
   console.log('PASS continuous '+mode+': diagonal touch keeps the orthogonal offset even on an oversized page');
  }
  for(const [theme,expected] of [['snow',[236,239,244]],['sepia',[244,236,216]],['dark',[46,52,64]],['black',[0,0,0]]]){
   await page.evaluate(theme=>window._view.setPageBackground(theme),theme);
   await page.waitForFunction(()=>{const f=window._view._view._pageFitting,w=f.viewer;return w.getPageView(w.currentPageNumber-1).renderingState===3;});
   const gutters=await page.evaluate(()=>{const v=window._view._view,d=v._iframeWindow.document;return [d.body,d.getElementById('viewerContainer'),document.getElementById('view')].map(e=>e.ownerDocument.defaultView.getComputedStyle(e).backgroundColor);});
   assert.ok(gutters.every(c=>c==='rgb('+expected.join(', ')+')'),JSON.stringify({theme,gutters}));
   const pixel=await page.evaluate(()=>{const f=window._view._view._pageFitting,p=f.viewer.getPageView(f.viewer.currentPageNumber-1),canvas=p.div.querySelector('.canvasWrapper canvas');return Array.from(canvas.getContext('2d').getImageData(0,0,1,1).data).slice(0,3);});
   assert.ok(pixel.every((v,i)=>Math.abs(v-expected[i])<=2),JSON.stringify({theme,pixel,expected}));
  }
  console.log('PASS PDF background colors reach the rendered page pixels');
  for (const cropMode of ['automatic','manual']) for (const fitMode of ['content','width','height']) {
   await page.goto(origin+'/view.html');
   await page.evaluate(()=>{const c=new MessageChannel();c.port1.onmessage=()=>{};window.postMessage('initPort','*',[c.port2]);});
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/blank.pdf',annotations:[],pageNavigation:'jumped',viewState:{pageIndex:0,scrollMode:0,spreadMode:0},pageFitting:{mode:fitMode,reference:'cropped-content',cropMode,margin:0,manualCrop:cropMode==='manual'?{all:[.1,.1,.9,.9]}:null}});
   await page.waitForFunction(()=>!!window._view?._view?._pageFitting?.applied);
   const result=await page.evaluate(async()=>{
    const f=window._view._view._pageFitting;
    await f.ensureModel();
    const a=await f.prepare(0),blank=await f.prepare(1),b=await f.prepare(2);
    const physical=p=>({width:(p.fit.bounds[2]-p.fit.bounds[0])*p.base.width,height:(p.fit.bounds[3]-p.fit.bounds[1])*p.base.height});
    await window._view._view._navigateToPage({pageIndex:1});
    const box=f.layout.boxes[1],c=f.viewer.container;
    return {frame:blank.blankFrame,a:physical(a),b:physical(b),box:{width:box.width,height:box.height},scale:f.viewer.currentScale,center:box.x+box.width/2-c.scrollLeft-c.clientWidth/2};
   });
   assert.ok(result.frame,JSON.stringify({cropMode,fitMode,result}));
   for(const axis of ['width','height'])assert.ok(Math.abs(result.frame[axis]-(result.a[axis]+result.b[axis])/2)<3,JSON.stringify({cropMode,fitMode,result}));
   assert.ok(Math.abs(result.center)<2,JSON.stringify(result));
   assert.ok(Math.abs(result.box.width-result.frame.width*result.scale)<2,JSON.stringify(result));
   console.log('PASS '+cropMode+' '+fitMode+': large white insert inherits physical reading frame without widening the document');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
