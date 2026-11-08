const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android');
const fixtures={
 '/fixture.pdf':path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf'),
 '/touch.pdf':path.resolve(__dirname,'../test/fixtures/boox-touch.pdf'),
 '/hoeffe.pdf':process.env.BOOX_HOEFFE_PDF,
 '/kant.pdf':process.env.BOOX_KANT_PDF,
};
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname,file=fixtures[u]||path.join(root,u);
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true});page.setDefaultTimeout(60000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack)});
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  const tap=async p=>{await touch('touchStart',[p]);await touch('touchEnd',[]);await page.waitForTimeout(420);};
  async function open(pdf,index=0,fitting=null){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];let c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+pdf,annotations:[],directHighlight:true,viewState:{pageIndex:index,scale:'page-width',scrollMode:2,spreadMode:0},pageFitting:fitting});
   await page.waitForFunction(()=>window._view?._view?._resolveInitializedPromise===null);
   if(fitting)await page.waitForFunction(()=>window._view._view._pageFitting.applied);
   await page.waitForTimeout(200);
  }
  async function fit(reference,includeMarginalia=false,margin=.01){await page.evaluate(async o=>window.setPageFitting(o),{mode:'width',reference,margin,includeMarginalia,revision:9});await page.waitForTimeout(160);return state();}
  function state(){return page.evaluate(()=>{let view=window._view._view,f=view._pageFitting,v=f.viewer,p=v.getPageView(v.currentPageNumber-1),c=v.container;return{page:v.currentPageNumber,scale:v.currentScale,bounds:f.applied?.bounds,clip:p.div.style.clipPath,x:c.scrollLeft,y:c.scrollTop,pw:p.div.clientWidth,ph:p.div.clientHeight,width:c.clientWidth,height:c.clientHeight};});}
  await open('/fixture.pdf',8,{mode:'width',reference:'content',margin:.01});
  for(const mode of [0,1,2]){
   await page.evaluate(m=>window._view._view.setScrollMode(m),mode);
   let text=await fit('content'),crop=await fit('cropped-content');
   assert.ok(Math.abs(text.scale-crop.scale)<.002);assert.ok(text.clip.startsWith('inset('));assert.ok(crop.clip.startsWith('inset('));
   assert.ok((crop.bounds[3]-crop.bounds[1])*crop.ph>crop.height);
   let first=await page.evaluate(()=>window.turnPageWithHardwareButton(true,2/3));assert.equal(first,'scroll');
   let atBottom;for(let i=0;i<8;i++){atBottom=await state();let result=await page.evaluate(()=>window.turnPageWithHardwareButton(true,2/3));if(result==='page')break;assert.equal(result,'scroll');}
   assert.equal((await state()).page,atBottom.page+1);
   await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:8}));
  }
  console.log('PASS three width references, content-height scrolling and cropped hardware page limits in all layouts');
  let before=await fit('cropped-content');await page.setViewportSize({width:600,height:700});await page.waitForTimeout(300);assert.ok(Math.abs((await state()).scale-before.scale)<.002);await page.setViewportSize({width:600,height:800});
  console.log('PASS cropped width never fits the page height');
  await open('/touch.pdf');await page.evaluate(()=>window._view._view._ensureBasicPageData(0));
  const annotation=await page.evaluate(()=>window._view._view._onAddAnnotation({type:'highlight',color:'#ffd400',text:'Alpha beta gamma',pageLabel:'1',sortIndex:'00000|000001|00001',position:{pageIndex:0,rects:[[54,714,250,731]]}}));
  await page.evaluate(()=>{window._view.selectAnnotations([]);window.messages=[];window.setReaderChromeVisible(true);});
  let point=await page.evaluate(()=>{let view=window._view._view,v=view._pageFitting.viewer,p=v.getPageView(0),r=p.div.getBoundingClientRect(),outer=view._iframe.getBoundingClientRect(),q=p.viewport.convertToViewportPoint(90,722);return{x:outer.left+r.left+q[0],y:outer.top+r.top+q[1]};});
  const position=await state();await tap(point);
  let result=await page.evaluate(id=>({chrome:window._view._view._readerChromeVisible,backdrops:window.messages.filter(m=>m.message?.event==='onDismissReaderChrome').length,popups:window.messages.filter(m=>m.message?.event==='onSetAnnotationPopup'&&m.message.params?.annotation?.id===id).length}),annotation.id);
  assert.deepEqual(result,{chrome:false,backdrops:1,popups:0});assert.equal((await state()).scale,position.scale);
  await tap(point);assert.ok(await page.evaluate(id=>window.messages.some(m=>m.message?.event==='onSetAnnotationPopup'&&m.message.params?.annotation?.id===id),annotation.id));
  console.log('PASS first annotation tap only dismisses chrome; second tap opens annotation without moving the PDF');
  await page.evaluate(()=>{window._view.selectAnnotations([]);window.setReaderChromeVisible(true);window.messages=[];});
  await tap({x:300,y:400});assert.equal(await page.evaluate(()=>window.messages.filter(m=>m.message?.event==='onDismissReaderChrome').length),1);
  console.log('PASS first empty-page tap dismisses chrome once');
  // A visible toolbar must not delay the 450-ms direct-highlighting gesture.
  await page.evaluate(()=>{window._view.selectAnnotations([]);window.setReaderChromeVisible(true);});
  const points=await page.evaluate(()=>{let view=window._view._view,v=view._pageFitting.viewer,p=v.getPageView(0),r=p.div.getBoundingClientRect(),outer=view._iframe.getBoundingClientRect();let chars=view._pdfPages[0].chars;let lineY=chars.find(c=>c.rect[1]<690)?.rect[1];let same=chars.filter(c=>Math.abs(c.rect[1]-lineY)<2);return [same[1],same[15]].map(c=>{let q=p.viewport.convertToViewportPoint((c.rect[0]+c.rect[2])/2,(c.rect[1]+c.rect[3])/2);return{x:outer.left+r.left+q[0],y:outer.top+r.top+q[1]};});});
  await touch('touchStart',[points[0]]);await page.waitForTimeout(520);assert.equal(await page.evaluate(()=>window._view._view._directHighlight.gesture.active),true);
  await touch('touchMove',[points[1]]);await touch('touchEnd',[]);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window._view._view._annotations.length),2);
  console.log('PASS visible chrome preserves direct hold-and-drag highlighting');
  for(const [pdf,indexes] of [['/hoeffe.pdf',[25,26,190,191]],['/kant.pdf',[368,369,379,380]]]){
   if(!fixtures[pdf])continue;
   await open(pdf,indexes[0],{mode:'width',reference:'content',margin:0});
   let summaries=[];
   for(const index of indexes){
    await page.evaluate(i=>window._view._view._navigateToPage({pageIndex:i}),index);let without=await fit('cropped-content',false,0);
    const maskCount=()=>page.evaluate(()=>{let f=window._view._view._pageFitting,p=f.viewer.getPageView(f.viewer.currentPageNumber-1);return p.div.querySelectorAll('.boox-marginalia-mask').length;});
    if(pdf==='/kant.pdf'){
     assert.ok(await maskCount()>0,'excluded references are fully covered, including when the crop contains a footnote marker');
     await fit('cropped-content',false,.08);assert.ok(await maskCount()>0,'large reading margins keep reference masks');
    }
    let withRefs=await fit('cropped-content',true,0);assert.equal(await maskCount(),0,'including references removes all reference masks');
    if(pdf==='/hoeffe.pdf')assert.ok(without.bounds[1]>.09&&withRefs.bounds[1]>.09,JSON.stringify(without));
    else{assert.ok(withRefs.bounds[2]-withRefs.bounds[0]>without.bounds[2]-without.bounds[0]+.01,JSON.stringify({without,withRefs}));assert.ok(without.bounds[3]>.98,'bottom body/footnote retained');}
    summaries.push({page:index+1,without:without.bounds,withReferences:withRefs.bounds});
   }
   console.log('PASS actual '+pdf+' header crop and reference toggle',JSON.stringify(summaries));
  }
  if(fixtures['/kant.pdf']){
   await page.setViewportSize({width:692,height:1536});
   await open('/kant.pdf',132,{mode:'content',reference:'content',margin:.04,includeMarginalia:false});
   const configure=async(includeMarginalia,mode='content')=>{await page.evaluate(o=>window.setPageFitting(o),{mode,reference:'content',margin:.08,includeMarginalia,revision:301});await page.waitForTimeout(180);};
   const inspect=index=>page.evaluate(async index=>{let f=window._view._view._pageFitting,p=await f.readPage(index);return{lines:p.lines,masks:f.maskRectsFor(index),bounds:f.applied.bounds,dom:f.viewer.getPageView(index).div.querySelectorAll('.boox-marginalia-mask').length};},index);
   const covered=(m,r)=>m[0]<=r[0]+1e-6&&m[1]<=r[1]+1e-6&&m[2]>=r[2]-1e-6&&m[3]>=r[3]-1e-6;
   const overlaps=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
   let summaries=[];
   for(const [index,names] of [[132,['BXLI']],[133,['B XLII']],[139,['B XLIX','B L']]]){
    await page.evaluate(i=>window._view._view._navigateToPage({pageIndex:i}),index);await configure(false);
    let state=await inspect(index),refs=state.lines.filter(l=>names.includes(l.text));assert.equal(refs.length,names.length);
    for(const ref of refs){assert.equal(ref.sideCandidate,true);assert.ok(state.masks.some(m=>covered(m,ref.rect)),JSON.stringify({ref,masks:state.masks}));}
    assert.ok(state.dom>=refs.length,'actual overlay covers each reference');
    const footnotes=state.lines.filter(l=>l.rect[1]>.89&&l.text.length>15);
    if(index===132)assert.ok(footnotes.length>=2,'the screenshot footnotes are present');
    assert.ok(footnotes.every(l=>state.masks.every(m=>!overlaps(m,l.rect))),'complete footnote text remains uncovered');
    let without=state.bounds;
    if(index===132&&process.env.BOOX_QA_IMAGES){fs.mkdirSync(process.env.BOOX_QA_IMAGES,{recursive:true});await page.screenshot({path:path.join(process.env.BOOX_QA_IMAGES,'kant-roman-exclude.png')});}
    await configure(true);let included=await inspect(index);assert.equal(included.masks.length,0);assert.equal(included.dom,0);
    assert.ok(included.bounds[2]-included.bounds[0]>without[2]-without[0]+.005,'Include restores the outer column');
    if(index===132&&process.env.BOOX_QA_IMAGES)await page.screenshot({path:path.join(process.env.BOOX_QA_IMAGES,'kant-roman-include.png')});
    summaries.push({page:index+1,references:names,exclude:without,include:included.bounds});
   }
   console.log('PASS actual Kant Roman folios B XLI B XLII B XLIX B L, Include/Exclude, masks and complete footnotes',JSON.stringify(summaries));
   await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:132}));await configure(false);
   await page.waitForFunction(()=>window._view._view._pageFitting.maskRectsFor(133).length>0);
   let neighbor=await inspect(133),neighborRef=neighbor.lines.find(l=>l.text==='B XLII');assert.ok(neighbor.masks.some(m=>covered(m,neighborRef.rect)));
   await configure(true);assert.equal((await inspect(133)).masks.length,0);
   console.log('PASS analyzed neighboring pages share Exclude and Include');
   for(const scroll of [0,1,2]){
    await page.evaluate(m=>window._view._view.setScrollMode(m),scroll);
    for(const mode of ['content','width','height']){await configure(false,mode);assert.ok((await inspect(132)).dom>0);await configure(true,mode);assert.equal((await inspect(132)).dom,0);}
   }
   console.log('PASS Roman references across three scroll modes and content width height fitting');
   for(const rotation of [90,180,270,0]){
    await page.evaluate(r=>{window._view._view._pageFitting.viewer.pagesRotation=r;},rotation);
    await page.waitForTimeout(240);await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:132}));await configure(false);assert.ok((await inspect(132)).dom>0);await configure(true);assert.equal((await inspect(132)).dom,0);
   }
   console.log('PASS Roman reference masks follow all display rotations');
  }
  assert.deepEqual(errors,[]);console.log('PASS: all new Android reader controls');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
