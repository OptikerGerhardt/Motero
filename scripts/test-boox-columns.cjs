const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android'),fixture=path.resolve(__dirname,'../test/fixtures/boox-columns.pdf');
require('./make-column-fixture.cjs');
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
  await page.setViewportSize({width:393,height:900});
  const open=async(mode='jumped')=>{
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(m=>m.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/fixture.pdf',annotations:[],pageNavigation:mode,viewState:{pageIndex:0,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:{mode:'width',reference:'cropped-content',margin:0}});
   await page.waitForFunction(()=>window._view?._view?._pageFitting?.column);
  };
  for(const mode of ['jumped','continuous']){
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
   for(let step=0;step<12;step++){await page.evaluate(()=>window.turnPageWithHardwareButton(true,.5));if((await state()).index===1)break;}
   const next=await state();assert.equal(next.index,1);assert.equal(next.column,0);
   for(let step=0;step<12;step++){await page.evaluate(()=>window.turnPageWithHardwareButton(false,.5));if((await state()).index===0)break;}
   const previous=await state();assert.equal(previous.index,0);assert.equal(previous.column,1,'backwards entry uses the previous page last column');
   console.log('PASS '+mode+': column width, left-to-right order, next page and reverse reading order');
  }
  await open('continuous');
  await page.evaluate(()=>{const v=window._view._view;window.columnTrace=[];for(const type of ['touchstart','touchmove','touchend'])v._iframeWindow.addEventListener(type,e=>{const n=v._pageNavigation,f=v._pageFitting,g=n.gesture;window.columnTrace.push({type,enabled:n.enabled,overview:v._booxReader.isOverview(),tool:v._tool.type,touches:e.touches.length,top:f.viewer.container.scrollTop,column:f.column?.index,inside:f.viewer.container.contains(e.target),g:g&&{dy:g.dy,column:g.column,boundary:g.boundary,startTop:g.startTop,limits:g.limits}});},true);});
  await page.evaluate(()=>{const f=window._view._view._pageFitting,c=f.viewer.container,b=f.layout.boxes[f.viewer.currentPageNumber-1];c.scrollTop=b.y+30;});
  await touch('touchStart',[{x:180,y:600}]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:180,y:600-i*80}]);await page.waitForTimeout(20);}
  await touch('touchEnd');
  assert.deepEqual(await page.evaluate(()=>{const f=window._view._view._pageFitting;return{page:f.viewer.currentPageNumber,column:f.column.index};}),{page:1,column:0},'a continuous swipe cannot skip the unread right column');
  await page.evaluate(()=>{const f=window._view._view._pageFitting,c=f.viewer.container,b=f.layout.boxes[f.viewer.currentPageNumber-1];c.scrollTop=b.y+b.height-c.clientHeight;});
  await touch('touchStart',[{x:180,y:500}]);
  for(let i=1;i<=5;i++){await touch('touchMove',[{x:180,y:500-i*30}]);await page.waitForTimeout(20);}
  await touch('touchEnd');
  try{await page.waitForFunction(()=>window._view._view._pageFitting.column?.index===1,null,{timeout:5000});}
  catch(error){console.error('COLUMN SWIPE STATE',await page.evaluate(()=>{const v=window._view._view,f=v._pageFitting;return{column:f.column,active:f.columnActive,presentation:f.presentation,current:f.viewer.currentPageNumber,top:f.viewer.container.scrollTop,selected:v._selectedAnnotationIDs,gesture:v._pageNavigation.gesture,trace:window.columnTrace};}));throw error;}
  console.log('PASS swipe at left-column bottom continues at right-column top');
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
  await page.evaluate(()=>window._view._view._pageFitting.ensureModel());
  for(const mode of [0,1,2]){
   await page.evaluate(async mode=>{const v=window._view._view;v.setScrollMode(mode);await v._pageFitting.configure({mode:'content',reference:'cropped-content',cropMode:'automatic',margin:0});},mode);
   const before=await page.evaluate(mode=>{const c=window._view._view._pageFitting.viewer.container;return{offset:mode===1?c.scrollLeft:c.scrollTop,size:mode===1?c.clientWidth:c.clientHeight,max:mode===1?c.scrollWidth-c.clientWidth:c.scrollHeight-c.clientHeight};},mode);
   const result=await page.evaluate(()=>window.turnPageWithHardwareButton(true,.5));
   const offset=await page.evaluate(mode=>{const c=window._view._view._pageFitting.viewer.container;return mode===1?c.scrollLeft:c.scrollTop;},mode);
   assert.equal(result,'scroll');assert.ok(Math.abs(offset-Math.min(before.max,before.offset+before.size*.5))<=1,JSON.stringify({mode,before,offset}));
   console.log('PASS continuous '+mode+': real viewport scroll carries the requested fraction across page boundaries');
  }
  for(const [theme,expected] of [['snow',[236,239,244]],['sepia',[244,236,216]],['dark',[46,52,64]],['black',[0,0,0]]]){
   await page.evaluate(theme=>window._view.setPageBackground(theme),theme);
   await page.waitForFunction(()=>{const f=window._view._view._pageFitting,w=f.viewer;return w.getPageView(w.currentPageNumber-1).renderingState===3;});
   const pixel=await page.evaluate(()=>{const f=window._view._view._pageFitting,p=f.viewer.getPageView(f.viewer.currentPageNumber-1),canvas=p.div.querySelector('.canvasWrapper canvas');return Array.from(canvas.getContext('2d').getImageData(0,0,1,1).data).slice(0,3);});
   assert.ok(pixel.every((v,i)=>Math.abs(v-expected[i])<=2),JSON.stringify({theme,pixel,expected}));
  }
  console.log('PASS PDF background colors reach the rendered page pixels');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
