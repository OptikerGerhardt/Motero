const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=process.env.BOOX_READER_ROOT||path.resolve(__dirname,'../build/android');
const fixtures={'/fixture.pdf':path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf'),'/fuchs.pdf':process.env.BOOX_FUCHS_PDF};
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'};
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname,file=fixtures[url]||path.join(root,url);if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true});page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack)});
  const origin='http://127.0.0.1:'+server.address().port;
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  async function open(pdf,index){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(({origin,pdf,index})=>window.createView(btoa(JSON.stringify({type:'pdf',url:origin+pdf,annotations:[],directHighlight:true,viewState:{pageIndex:index,scale:'page-width',scrollMode:2,spreadMode:0},pageFitting:{mode:'content',reference:'content',margin:0,includeMarginalia:false,revision:303}}))),{origin,pdf,index});
   await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);await page.waitForTimeout(180);
  }
  const state=()=>page.evaluate(()=>{
   const w=window._view._view,f=w._pageFitting,b=w._booxReader,v=f.viewer,p=v.getPageView(v.currentPageNumber-1),c=v.container;
   const d=p.div,box=d.getBoundingClientRect(),container=c.getBoundingClientRect(),bounds=f.applied?.bounds;
   return {page:v.currentPageNumber,scale:v.currentScale,active:f.active,mode:f.options.mode,reference:f.options.reference,margin:f.options.margin,
    includeMarginalia:f.options.includeMarginalia,bounds,clip:d.style.clipPath,readingMode:b.readingMode,readingFit:b.readingFit,
    overview:b.isOverview(),width:c.clientWidth,height:c.clientHeight,frameTop:w._iframe.getBoundingClientRect().top,
    visible:bounds&&[box.left+d.clientLeft+bounds[0]*d.clientWidth-container.left,box.top+d.clientTop+bounds[1]*d.clientHeight-container.top,
     box.left+d.clientLeft+bounds[2]*d.clientWidth-container.left,box.top+d.clientTop+bounds[3]*d.clientHeight-container.top]};
  });
  async function configure(mode='content',includeMarginalia=false,margin=0){await page.evaluate(o=>window.setPageFitting(o),{mode,reference:'content',margin,includeMarginalia,revision:303});await page.waitForTimeout(140);return state();}
  function fitted(s){assert.equal(s.active,true,JSON.stringify(s));assert.equal(s.readingMode,'pageFit',JSON.stringify(s));assert.ok(s.readingFit,JSON.stringify(s));assert.ok(s.clip.startsWith('inset('),JSON.stringify(s));assert.ok(s.bounds[0]>0&&s.bounds[2]<1,JSON.stringify(s));assert.ok(s.visible[0]>=-2&&s.visible[1]>=-2&&s.visible[2]<=s.width+2&&s.visible[3]<=s.height+2,JSON.stringify(s));}
  async function overview(){
   for(let i=0;i<12;i++){if((await state()).overview)return;await page.evaluate(()=>window._view.zoomOut());await page.waitForTimeout(35);}
   assert.fail('zoom buttons did not reach Wrapped overview');
  }
  async function tapCurrentPage(){
   await page.waitForTimeout(120);
   const point=await page.evaluate(()=>{
    const w=window._view._view,v=w._pageFitting.viewer,f=w._iframe.getBoundingClientRect();
    const targets=v._pages.filter(p=>p.pdfPage&&w._booxReader.isOverview(p)).map(p=>{
     const r=p.div.getBoundingClientRect(),left=Math.max(0,r.left),right=Math.min(v.container.clientWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(v.container.clientHeight,r.bottom);
     return{x:f.left+(left+right)/2,y:f.top+(top+bottom)/2,index:p.id-1,area:Math.max(0,right-left)*Math.max(0,bottom-top)};
    }).filter(p=>p.area>400).sort((a,b)=>b.area-a.area);
    return targets[0];
   });
   assert.ok(point,'a loaded overview page must be visible and tappable');
   console.log('DIAG tapping visible overview page',JSON.stringify(point));
   await touch('touchStart',[point]);await touch('touchEnd',[]);
   await page.waitForFunction(index=>{const f=window._view._view._pageFitting;return f.active&&f.applied?.pageIndex===index;},point.index);
   await page.waitForTimeout(160);
  }
  await open('/fixture.pdf',8);fitted(await state());
  for(const include of [false,true]){
   const before=await configure('content',include);
   await overview();await tapCurrentPage();const restored=await state();fitted(restored);
   assert.equal(restored.mode,'content');assert.equal(restored.includeMarginalia,include);
   assert.equal(restored.margin,before.margin);
  }
  console.log('PASS native zoom buttons and real Wrapped taps restore the complete fit without a seeded zoom origin');
  // Both fingers start in the viewer gutters, outside the PDF page. No page
  // pointerdown may be assumed when remembering the previous fitted view.
  await page.setViewportSize({width:1000,height:700});await configure();
  const targets=await page.evaluate(()=>{const w=window._view._view,v=w._pageFitting.viewer,r=v.getPageView(v.currentPageNumber-1).div.getBoundingClientRect();return{left:r.left,right:r.right};});
  assert.ok(targets.left>25&&targets.right<975,JSON.stringify(targets));
  await touch('touchStart',[{x:10,y:350},{x:990,y:350}]);
  for(let i=1;i<=9;i++){await touch('touchMove',[{x:10+i*40,y:350},{x:990-i*40,y:350}]);await page.waitForTimeout(25);}
  await touch('touchEnd',[]);
  await page.waitForFunction(()=>{const f=window._view._view._pageFitting;return f.active&&!f.zooming&&f.applied&&Math.abs(f.viewer.currentScale-f.applied.scale)<.002;});
  await page.waitForTimeout(180);assert.equal((await state()).overview,false);fitted(await state());
  console.log('PASS a real pinch starting outside the PDF page restores fitting on release');
  await overview();await configure('none');await page.evaluate(()=>window._view._view._booxReader.enterPage(8));await page.waitForTimeout(150);
  let off=await state();assert.equal(off.active,false);assert.equal(off.clip,'');assert.equal(off.readingFit,null);
  console.log('PASS explicit Off forgets the old fit instead of restoring it from the overview');
  await page.setViewportSize({width:600,height:800});await configure();
  await page.evaluate(()=>window.setContainerInsets({top:42}));await page.waitForTimeout(220);let safe=await state();fitted(safe);assert.equal(safe.frameTop,42);assert.equal(safe.height,758);
  for(const visible of [true,false,true,false]){await page.evaluate(x=>window.setReaderChromeVisible(x),visible);await page.waitForTimeout(100);let now=await state();assert.equal(now.height,safe.height);assert.equal(now.frameTop,42);assert.ok(Math.abs(now.scale-safe.scale)<.002);}
  for(const mode of [0,1,2]){await page.evaluate(x=>window._view._view.setScrollMode(x),mode);await configure();await page.evaluate(()=>window.turnPageWithHardwareButton(true,2/3));await page.waitForTimeout(120);let now=await state();fitted(now);assert.equal(now.frameTop,42);}
  console.log('PASS simulated camera safe area stays constant through toolbar toggles and hardware page turns in all scroll modes');
  if(fixtures['/fuchs.pdf']){
   await page.setViewportSize({width:600,height:800});await open('/fuchs.pdf',205);fitted(await state());
   const cases=[];
   for(const index of [5,99,200,205,206,207,300,410]){await page.evaluate(i=>window._view._view._navigateToPage({pageIndex:i}),index);await page.waitForTimeout(100);let s=await state();fitted(s);cases.push({page:index+1,bounds:s.bounds});}
   for(const include of [false,true]){
    await configure('content',include);await overview();await tapCurrentPage();let restored=await state();fitted(restored);assert.equal(restored.includeMarginalia,include);
    await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:206}));fitted(await state());
   }
   await page.reload();await open('/fuchs.pdf',206);fitted(await state());
   if(process.env.BOOX_QA_IMAGES){fs.mkdirSync(process.env.BOOX_QA_IMAGES,{recursive:true});await page.screenshot({path:path.join(process.env.BOOX_QA_IMAGES,'fuchs-fit-recovery.png')});}
   console.log('PASS actual Fuchs PDF keeps all four crop edges across page changes, Include/Exclude, overview recovery and reopening',JSON.stringify(cases));
  }
  assert.deepEqual(errors,[]);console.log('PASS: fit recovery and safe viewport regressions');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
