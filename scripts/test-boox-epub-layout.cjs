const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android');
(async()=>{
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname,file=u==='/navigation.epub'?process.env.BOOX_NAVIGATION_EPUB:path.join(root,u);
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.epub':'application/epub+zip','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:393,height:900},isMobile:true,hasTouch:true});page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});
  const origin='http://127.0.0.1:'+server.address().port,cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  const tap=async p=>{await touch('touchStart',[p]);await touch('touchEnd',[]);await page.waitForTimeout(100);};
  const hold=async(p,end=p)=>{await touch('touchStart',[p]);await page.waitForTimeout(560);if(end!==p){for(let i=1;i<=5;i++){await touch('touchMove',[{x:p.x+(end.x-p.x)*i/5,y:p.y+(end.y-p.y)*i/5}]);await page.waitForTimeout(25);}}await touch('touchEnd',[]);await page.waitForTimeout(100);};
  async function open(flow){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'epub',url:origin+'/navigation.epub',annotations:[],directHighlight:true,viewportInset:64,viewState:{flowMode:flow,spreadMode:0,appearance:{lineHeight:1.2,wordSpacing:0,letterSpacing:0,pageWidth:0,margins:8,fontFamily:'serif'}}});
   await page.waitForFunction(()=>window._view?._view?.initialized&&window._view._view.flow?.startRange);
  }
  const point=()=>page.evaluate(()=>{
   const v=window._view._view,d=v._iframeDocument,f=v._iframe.getBoundingClientRect();
   const p=Array.from(d.querySelectorAll('p')).find(p=>{const r=p.getBoundingClientRect();return r.top>100&&r.top<400&&r.left>=0&&r.left<300;});
   const range=d.createRange();range.setStart(p.firstChild,0);range.setEnd(p.firstChild,7);const r=range.getBoundingClientRect();
   return{x:f.left+r.left+15,y:f.top+(r.top+r.bottom)/2};
  });
  await open('paginated');
  const before=await page.evaluate(()=>window._view._view.flow.startCFI.toString());
  const p=await point(); p.x+=140;
  await touch('touchStart',[p]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:p.x-130*i/6,y:p.y}]);await page.waitForTimeout(20);}
  await touch('touchEnd',[]);await page.waitForTimeout(200);
  const after=await page.evaluate(()=>({cfi:window._view._view.flow.startCFI.toString(),annotations:window._view._annotationManager._annotations.length,backdrops:window.messages.filter(m=>m.message?.event==='onBackdropTap').length}));
  assert.notEqual(after.cfi,before,'ordinary horizontal swipe starting on text must turn the EPUB page');
  assert.equal(after.annotations,0);assert.equal(after.backdrops,0);
  console.log('PASS word-start swipe turns EPUB page without annotation or toolbar toggle');
  await touch('touchStart',[{x:180,y:300}]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:180+130*i/6,y:300}]);await page.waitForTimeout(20);}
  await touch('touchEnd',[]);await page.waitForTimeout(120);
  assert.equal(await page.evaluate(()=>window._view._view.flow.startCFI.toString()),before,'reverse swipe returns to the previous page');
  console.log('PASS reverse EPUB swipe returns to the previous page');
  await tap({x:385,y:300});
  assert.notEqual(await page.evaluate(()=>window._view._view.flow.startCFI.toString()),before,'right margin tap must turn the EPUB page');
  await tap({x:8,y:300});
  assert.equal(await page.evaluate(()=>window._view._view.flow.startCFI.toString()),before,'left margin tap must return to the previous page');
  console.log('PASS EPUB margin taps keep page-turn priority over pending holds');
  const highlight=await page.evaluate(p=>{const v=window._view._view,r=v._directHighlight.wordAt({clientX:p.x,clientY:p.y});return v._options.onAddAnnotation(v._finalizeAnnotation(v.getAnnotationFromRange(r,'highlight','#ffd400')));},p);
  await touch('touchStart',[p]);
  for(let i=1;i<=6;i++){await touch('touchMove',[{x:p.x-130*i/6,y:p.y}]);await page.waitForTimeout(20);}
  await touch('touchEnd',[]);await page.waitForTimeout(120);
  assert.notEqual(await page.evaluate(()=>window._view._view.flow.startCFI.toString()),before,'swiping over an existing highlight must also turn the page');
  assert.deepEqual(await page.evaluate(()=>window._view.getSelectedAnnotationIDs()),[],'a page swipe must not open the annotation');
  console.log('PASS swiping from an existing annotation keeps page-turn priority');


  for(const flow of ['paginated','scrolled']){
   await open(flow);
   for(const margins of [-20,-5,0,5,12]){
    await page.evaluate(m=>window._view.setAppearance({lineHeight:1.2,wordSpacing:0,letterSpacing:0,pageWidth:0,margins:8,verticalMargins:m,fontFamily:'serif'}),margins);
    await page.waitForTimeout(120);
    const spacing=await page.evaluate(()=>{const v=window._view._view,b=v._iframeDocument.body,sections=b.querySelector('.sections');return{margin:parseFloat(v._iframeDocument.documentElement.style.getPropertyValue('--reader-block-margin')),top:parseFloat(getComputedStyle(b).marginTop),bottom:parseFloat(getComputedStyle(b).marginBottom),padding:parseFloat(getComputedStyle(sections).paddingTop),height:v._iframeWindow.innerHeight};});
    assert.equal(spacing.margin,margins);
    if(flow==='paginated'){assert.ok(Math.abs(spacing.top-Math.max(0,64+spacing.height*margins/100))<2,JSON.stringify(spacing));assert.equal(spacing.top,spacing.bottom);}
    else assert.ok(Math.abs(spacing.padding-Math.max(0,64+spacing.height*margins/100))<2,JSON.stringify(spacing));
   }
   console.log('PASS '+flow+': independent top/bottom margin control is symmetric and applied to layout');
  }
  await open('paginated');
  await page.evaluate(()=>window._view.setAppearance({lineHeight:1.2,wordSpacing:0,letterSpacing:0,pageWidth:0,margins:8,verticalMargins:12,fontFamily:'serif'}));
  await tap({x:385,y:22});
  await page.waitForFunction(()=>window._view._annotationManager._annotations.some(a=>a.comment?.startsWith('Bookmark')));
  const flag=await page.evaluate(()=>{const v=window._view._view,a=v._annotations.find(a=>a.comment?.startsWith('Bookmark'));
   const el=v._annotationShadowRoot.querySelector(`svg[data-annotation-id="${a.id}"]`),r=el.getBoundingClientRect();return{top:r.top,left:r.left,right:r.right,width:r.width,height:v._iframeWindow.innerHeight};});
  assert.ok(flag.width>=18&&flag.top>=0&&flag.top<32&&flag.right<=393,JSON.stringify(flag));
  await tap({x:385,y:22});
  assert.equal(await page.evaluate(()=>window._view._annotationManager._annotations.filter(a=>a.comment?.startsWith('Bookmark')).length),0);
  console.log('PASS viewport corner toggles a larger unclipped EPUB bookmark independently of content margins');
  for(const [theme,color] of [['snow','#ECEFF4'],['sepia','#F4ECD8'],['dark','#2E3440'],['black','#000000']]){
   await page.evaluate(t=>window._view.setPageBackground(t),theme);
   assert.equal(await page.evaluate(()=>window._view._view._iframeDocument.documentElement.style.getPropertyValue('--background-color')),color);
  }
  await page.evaluate(()=>window._view.setDeviceProfile({eReader:true,penOnly:false}));
  assert.equal(await page.evaluate(()=>window._view._view._iframeDocument.documentElement.style.getPropertyValue('--background-color')),'#ffffff');
  console.log('PASS all four desktop page backgrounds and E-Reader override');
  await open('paginated');
  const fast=await point();await touch('touchStart',[fast]);await page.waitForTimeout(320);
  assert.equal(await page.evaluate(()=>window._view._view._directHighlight.gesture.active),true,'a stationary word hold starts within 320 ms in a prepared EPUB');
  await touch('touchEnd',[]);
  console.log('PASS shorter word hold starts direct highlighting before the old hold threshold');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
