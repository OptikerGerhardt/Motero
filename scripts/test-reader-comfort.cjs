const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android'),fixture=path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf');
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,file=u==='/fixture.pdf'?fixture:path.join(root,u);if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:900,height:750},isMobile:true,hasTouch:true});page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.stack));const origin='http://127.0.0.1:'+server.address().port;
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  const drag=async(p,q)=>{await touch('touchStart',[p]);for(let i=1;i<=8;i++){await touch('touchMove',[{x:p.x+(q.x-p.x)*i/8,y:p.y+(q.y-p.y)*i/8}]);await page.waitForTimeout(12);}await touch('touchEnd');await page.waitForTimeout(180);};
  async function open({spreadMode=0,scrollMode=0,pageIndex=5,mode='content',crop=[.1,.3,.9,.6],navigation='jumped'}={}){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(m=>m.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/fixture.pdf',annotations:[],directHighlight:true,pageNavigation:navigation,indicatorInsets:{top:32,right:0},viewState:{pageIndex,scale:'page-width',scrollMode,spreadMode},pageFitting:{mode,reference:'cropped-content',margin:0,cropMode:'manual',manualCrop:{all:crop}}});
   try {await page.waitForFunction(()=>{const v=window._view?._view,f=v?._pageFitting;return f?.applied&&!f.pendingPage&&!f.applying&&!v._scrolling;});} catch(e) {console.error('OPEN STATE',errors,await page.evaluate(()=>{const v=window._view?._view,f=v?._pageFitting;return{applied:f?.applied,pending:f?.pendingPage,applying:f?.applying,active:f?.active,scrolling:v?._scrolling,pages:f?.viewer.pagesCount,index:f?.viewer.currentPageNumber,options:f?.options};}));throw e;}
  }
  for(const spreadMode of [1,2]){
   const first=spreadMode===1?4:5;await open({spreadMode,pageIndex:first,navigation:'continuous',mode:'width',crop:[0,0,1,1]});
   await page.evaluate(i=>{
    const v=window._view._view;
    for(const [n,color,tags] of [[i,'#000000',[]],[i+1,'#2ea8e5',[{name:'Bookmark'}]]]){
     v._onAddAnnotation({type:'note',color,tags,pageLabel:String(n+1),
      sortIndex:String(n).padStart(5,'0')+'|00001',comment:'Bookmark · fixture',
      position:{pageIndex:n,rects:[[10,10,32,32]]}});
    }
    v._render();
   },first);
   await page.waitForFunction(()=>window._view._view._iframeWindow.document.querySelectorAll('.motero-bookmark-indicator').length===2);
   let expected;
   for(const top of [70,40,20,0,20,40,70]){
    await page.evaluate(({i,top})=>{const v=window._view._view._pageFitting.viewer,p=v.getPageView(i);v.container.scrollTop+=p.div.getBoundingClientRect().top-top;v.update();},{i:first,top});await page.waitForTimeout(60);
    const flags=await page.evaluate(()=>{const v=window._view._view,w=v._iframeWindow;return [...w.document.querySelectorAll('.motero-bookmark-indicator')].map(e=>{const r=e.getBoundingClientRect(),style=w.getComputedStyle(e);const page=v._pageFitting.viewer.getPageView(Number(e.dataset.pageIndex)); const bounds=page.div.getBoundingClientRect(); const box=v._pageFitting.layout?.boxes[Number(e.dataset.pageIndex)]; return{index:e.dataset.pageIndex,x:r.x,y:r.y,expectedY:Math.max(v._pageFitting.viewer.container.getBoundingClientRect().top,bounds.top+(box?.top||0)*bounds.height/page.viewport.height),pointer:style.pointerEvents,color:style.color};}).sort((a,b)=>a.index-b.index);});
    assert.equal(flags.length,2);for(const f of flags){assert.ok(Math.abs(f.y-f.expectedY)<.5,JSON.stringify(f));assert.equal(f.pointer,'none');}
    assert.deepEqual(flags.map(f=>f.color),['rgb(0, 0, 0)','rgb(46, 168, 229)']);
    if(expected)for(let i=0;i<2;i++){assert.equal(flags[i].index,expected[i].index);assert.ok(Math.abs(flags[i].x-expected[i].x)<1,'a spread bookmark cannot teleport when scrolling');}else expected=flags;
   }
   console.log('PASS stable per-leaf bookmark flags in spread '+spreadMode);
  }
  for(const scrollMode of [0,1,2])for(const mode of ['content','height']){
   await open({scrollMode,mode});
   for(const pageIndex of [0,5,11]){
    await page.evaluate(i=>window._view._view._navigateToPage({pageIndex:i}),pageIndex);
    const center=await page.evaluate(()=>{const f=window._view._view._pageFitting,v=f.viewer,c=v.container,b=f.layout.boxes[v.currentPageNumber-1];return{x:b.x+b.width/2-c.scrollLeft-c.clientWidth/2,y:b.y+b.height/2-c.scrollTop-c.clientHeight/2};});
    assert.ok(Math.abs(center.x)<3&&Math.abs(center.y)<3,JSON.stringify({scrollMode,mode,pageIndex,center}));
   }
  }
  console.log('PASS first/middle/last single-page Content/Height fitting centers in all three scroll modes');
  await page.setViewportSize({width:900,height:450});
  for(const horizontal of [false,true]){
   await open(horizontal?{scrollMode:1,mode:'height',crop:[.05,.4,.95,.6]}:{mode:'width',crop:[0,0,1,1]});
   const snapshot=()=>page.evaluate(()=>{const v=window._view._view._pageFitting.viewer;return{x:v.container.scrollLeft,y:v.container.scrollTop,page:v.currentPageNumber};});
   const before=await snapshot();await drag({x:500,y:300},horizontal?{x:350,y:250}:{x:450,y:150});const after=await snapshot();
   assert.equal(after.page,before.page,'panning an oversized page cannot turn it');
   assert.ok((horizontal?after.x-before.x:after.y-before.y)>10,JSON.stringify({horizontal,before,after}));
   assert.ok(Math.abs(horizontal?after.y-before.y:after.x-before.x)<=1,'cross-axis drift is locked');
  }
  console.log('PASS one-finger Jumped panning follows the selected axis without cross-axis drift');
  await open({mode:'width',crop:[0,0,1,1]});
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,.35));
  await page.waitForFunction(()=>!!window._view._view._iframeWindow.document.querySelector('.motero-reading-position-cue'));
  const cue=await page.evaluate(()=>{const v=window._view._view,e=v._iframeWindow.document.querySelector('.motero-reading-position-cue'),ring=e.querySelector('ellipse');return{stroke:ring.getAttribute('stroke'),path:ring.getAttribute('pathLength'),passive:v._iframeWindow.getComputedStyle(e).pointerEvents,frames:ring.getAnimations()[0]?.effect.getKeyframes().map(f=>f.strokeDashoffset)};});
  assert.equal(cue.stroke,'#000');assert.equal(cue.path,'1');assert.equal(cue.passive,'none');assert.ok(cue.frames?.includes('1'));
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,0));
  await page.waitForFunction(()=>!!window._view._view._iframeWindow.document.querySelector('.motero-reading-position-cue'));
  assert.equal(await page.evaluate(()=>window._view._view._pageFitting.viewer.currentPageNumber),7);
  await page.evaluate(()=>window.setDeviceProfile({readingAssist:false}));assert.equal(await page.evaluate(()=>!!window._view._view._iframeWindow.document.querySelector('.motero-reading-position-cue')),false);
  await page.evaluate(()=>window.turnPageWithHardwareButton(true,.2));await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>!!window._view._view._iframeWindow.document.querySelector('.motero-reading-position-cue')),false);
  console.log('PASS black contour drawing, partial-width eligibility and live global Reading Assist switch');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
