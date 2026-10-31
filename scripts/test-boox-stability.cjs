const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../build/android');
const fixture = path.resolve(__dirname, '../test/fixtures/boox-fitting.pdf');
const types = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.pdf':'application/pdf', '.wasm':'application/wasm' };
(async () => {
 const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  const file = url === '/scanned.pdf' ? path.resolve(__dirname,'../test/fixtures/boox-scanned.pdf') : url === '/fixture.pdf' ? fixture : url === '/problem.pdf' ? process.env.BOOX_PROBLEM_PDF : path.join(root,url);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
  browser = await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true});
  const errors=[]; page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack)});
  page.setDefaultTimeout(45000);
  const origin='http://127.0.0.1:'+server.address().port;
  async function open(pdf='/fixture.pdf', index=8) {
   await page.goto(origin+'/view.html');
   await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(({origin,pdf,index})=>window.createView(btoa(JSON.stringify({type:'pdf',url:origin+pdf,annotations:[],directHighlight:true,
    viewState:{pageIndex:index,scale:'page-width',scrollMode:2,spreadMode:0},
    pageFitting:{mode:'width',reference:'content',margin:.01,revision:1}}))),{origin,pdf,index});
   await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);
   await page.waitForTimeout(250);
  }
  async function fit(mode,reference='content',margin=.01) {
   await page.evaluate(async opts=>{await window.setPageFitting(opts);},{mode,reference,margin,revision:2});
   await page.waitForTimeout(180); return state();
  }
  async function state() { return page.evaluate(()=>{
   let view=window._view._view,f=view._pageFitting,v=f.viewer,p=v.getPageView(v.currentPageNumber-1),c=v.container,d=p.div;
   let b=f.applied?.bounds,rect=d.getBoundingClientRect(), cr=c.getBoundingClientRect();
   return {page:v.currentPageNumber,scale:v.currentScale,active:f.active,mode:f.options.mode,reference:f.options.reference,
    bounds:b,x:c.scrollLeft-d.offsetLeft-d.clientLeft,y:c.scrollTop-d.offsetTop-d.clientTop,
    visible:b&&[rect.left+d.clientLeft+b[0]*d.clientWidth-cr.left,rect.top+d.clientTop+b[1]*d.clientHeight-cr.top,
     rect.left+d.clientLeft+b[2]*d.clientWidth-cr.left,rect.top+d.clientTop+b[3]*d.clientHeight-cr.top],
    width:c.clientWidth,height:c.clientHeight,pw:d.clientWidth,ph:d.clientHeight,clip:d.style.clipPath,cache:f.cache.size,
    reported:f.state(), overview:view._booxReader.isOverview()};
  });}

  await open();
  const frames = await page.evaluate(async () => {
   let view=window._view._view,f=view._pageFitting,v=f.viewer,c=v.container;
   clearTimeout(f.prefetchTimer);let original=f.boundsFor.bind(f);
   f.boundsFor=async i=>{if(i===13)await new Promise(r=>setTimeout(r,180));return original(i);};
   let frames=[],running=true;
   const sample=()=>{if(!running)return;let p=v.getPageView(13);if(v.currentPageNumber===14)frames.push({x:c.scrollLeft-p.div.offsetLeft-p.div.clientLeft,y:c.scrollTop-p.div.offsetTop-p.div.clientTop,scale:v.currentScale});requestAnimationFrame(sample);};
   requestAnimationFrame(sample);await view._navigateToPage({pageIndex:13});await new Promise(r=>setTimeout(r,350));running=false;f.boundsFor=original;return frames;
  });
  assert.ok(frames.length>3);let final=frames.at(-1);console.log('DIAG page-turn frames',JSON.stringify(frames));
  assert.ok(frames.every(p=>Math.abs(p.x-final.x)<2&&Math.abs(p.y-final.y)<2&&Math.abs(p.scale-final.scale)<.002),'no intermediate unfitted paint');
  console.log('PASS page turn paints only prepared target geometry');
  const interrupted=await page.evaluate(async()=>{
   let view=window._view._view,f=view._pageFitting,v=f.viewer;
   let original=f.boundsFor.bind(f);f.boundsFor=async i=>{await new Promise(r=>setTimeout(r,150));return original(i);};
   let before=v.currentPageNumber,pending=view._navigateToPage({pageIndex:11});
   await new Promise(r=>setTimeout(r,40));f.onDown({pointerId:99,target:null});
   let result=await pending;f.onUp({pointerId:99});f.boundsFor=original;
   return {before,after:v.currentPageNumber,result};
  });
  assert.equal(interrupted.result,false);assert.equal(interrupted.before,interrupted.after);
  console.log('PASS input during preparation cancels pending page fitting');
  await open();
  const annotation=await page.evaluate(()=>window._view._view._onAddAnnotation({type:'highlight',color:'#ffd400',text:'Preserved text',comment:'Preserved comment',tags:[{name:'method'}],pageLabel:'9',sortIndex:'00008|000001|00001',position:{pageIndex:8,rects:[[132,630,260,642]]}}));
  await page.evaluate(id=>{
   let view=window._view._view;window._view.selectAnnotations([id]);
   view._pointerDownTriggered=true;view._pageFitting.pointers.add(77);view.action={annotation:view._annotations.find(a=>a.id===id)};
   window._view._annotationManager.deleteAnnotations([id]);
  },annotation.id);
  const cleaned=await page.evaluate(()=>({ids:window._view.getSelectedAnnotationIDs(),pointer:window._view._view._pointerDownTriggered,pointers:window._view._view._pageFitting.pointers.size,action:window._view._view.action}));
  assert.deepEqual(cleaned,{ids:[],pointer:false,pointers:0,action:null});
  const count=await page.evaluate(()=>window.messages.filter(m=>m.message?.event==='onBackdropTap').length);
  await page.touchscreen.tap(30,400);await page.waitForTimeout(450);
  assert.ok(await page.evaluate(n=>window.messages.filter(m=>m.message?.event==='onBackdropTap').length>n,count),'first backdrop tap after deletion');
  console.log('PASS deleting selected annotation clears pointer and first backdrop tap works');
  const added=await page.evaluate(()=>window._view._view._onAddAnnotation({type:'highlight',color:'#ffd400',text:'Preserved text',comment:'Preserved comment',tags:[{name:'method'}],pageLabel:'9',sortIndex:'00008|000001|00001',position:{pageIndex:8,rects:[[132,630,260,642]]}}));
  await page.evaluate(a=>{window._view.selectAnnotations([a.id]);window.resetAndroidReaderInput('OLDID');window._view._view._booxReader.showPalette([a]);},added);
  assert.deepEqual(await page.evaluate(()=>window._view.getSelectedAnnotationIDs()),[added.id]);
  console.log('PASS stale editor close preserves newer selection');
  const frame=page.frameLocator('iframe'),palette=frame.locator('.boox-highlight-palette');
  const colors=await palette.locator('[data-color]').evaluateAll(bs=>bs.map(b=>({color:b.dataset.color,border:getComputedStyle(b).borderWidth})));
  assert.deepEqual(colors.map(b=>b.color),['#ffd400','#ff6666','#5fb236','#2ea8e5','#a28ae5','#e56eee','#f19837','#aaaaaa']);assert.ok(colors.every(b=>b.border==='0px'));
  assert.equal(await palette.locator('.boox-palette-arrow').count(),1);
  await page.evaluate(()=>{window._view.setColorScheme('dark');let v=window._view._view;v._booxReader.showPalette(v._annotations);});
  const dark=await palette.evaluate(b=>getComputedStyle(b).backgroundColor);assert.notEqual(dark,'rgb(255, 255, 255)');
  console.log('PASS exact Zotero colors, borderless buttons, pointer and dark theme');
  if(process.env.BOOX_UI_SHOT)await palette.screenshot({path:process.env.BOOX_UI_SHOT});
  const halves=await palette.evaluate(box=>{
   const b=box.getBoundingClientRect();return [...box.querySelectorAll('[data-type]')].map(button=>{
    const r=button.getBoundingClientRect(),s=button.querySelector('svg').getBoundingClientRect();
    return {left:r.left-b.left,right:r.right-b.left,width:r.width,boxWidth:b.width,height:r.height,centerError:Math.abs((s.left+s.right-r.left-r.right)/2)};
   });
  });
  assert.equal(halves.length,2);assert.ok(halves.every(b=>Math.abs(b.width-b.boxWidth/2)<1&&b.height>=44&&b.centerError<.6),JSON.stringify(halves));
  assert.ok(halves[0].left<1&&Math.abs(halves[1].right-halves[1].boxWidth)<1);
  const left=await palette.locator('[data-type="highlight"]').boundingBox();
  await page.touchscreen.tap(left.x+2,left.y+left.height/2);await page.waitForTimeout(100);
  const right=await palette.locator('[data-type="underline"]').boundingBox();
  await page.touchscreen.tap(right.x+right.width-2,right.y+right.height/2);
  await page.waitForFunction(()=>window._view._view._annotations.some(a=>a.type==='underline'));
  console.log('PASS palette mode buttons fill equal halves with centered icons and edge touch targets');
  const converted=await page.evaluate(()=>window._view._view._annotations.find(a=>a.type==='underline'));
  assert.ok(converted);assert.notEqual(converted.id,added.id);assert.equal(converted.comment,added.comment);assert.equal(converted.text,added.text);assert.deepEqual(converted.tags,added.tags);
  await page.waitForFunction(id=>window.messages.some(m=>m.message?.event==='onDeleteAnnotations'&&m.message.params.ids.includes(id)),added.id);
  assert.ok(await page.evaluate(id=>window.messages.some(m=>m.message?.event==='onDeleteAnnotations'&&m.message.params.ids.includes(id)),added.id));
  console.log('PASS canonical underline conversion preserves comments tags text and sends deletion');
  await page.evaluate(()=>window._view._view._booxReader.closePalette());
  await page.evaluate(()=>window._view._view._booxReader.addBookmark(8));
  let bookmark=await page.evaluate(async()=>{
   let v=window._view._view,p=v._pageFitting.viewer.getPageView(8),vp=p.pdfPage.getViewport({scale:1,rotation:p.viewport.rotation});
   let note=v._annotations.find(a=>a.type==='note'),b=await v._pageFitting.boundsFor(8),rect=vp.convertToViewportRectangle(note.position.rects[0]);
   return {position:note.position,right:b[2]*vp.width-Math.max(rect[0],rect[2]),top:Math.min(rect[1],rect[3])-b[1]*vp.height};
  });
  assert.ok(Math.abs(bookmark.right-8)<.1&&Math.abs(bookmark.top-4)<.1,JSON.stringify(bookmark));
  await fit('width','page',.08);await page.evaluate(()=>window._view._view._booxReader.addBookmark(8));
  assert.deepEqual(await page.evaluate(()=>window._view._view._annotations.find(a=>a.type==='note').position),bookmark.position);
  console.log('PASS bookmark uses raw content frame independent of selected fit and margins');
  const protectedPosition=await page.evaluate(async()=>{
   let view=window._view._view,note=view._annotations.find(a=>a.type==='note');
   let position={pageIndex:8,rects:[[10,750,32,772]]};
   await window._view.setAnnotations([{...note,readOnly:true,position}]);
   await view._booxReader.addBookmark(8);return view._annotations.find(a=>a.id===note.id).position;
  });
  assert.deepEqual(protectedPosition,{pageIndex:8,rects:[[10,750,32,772]]});
  console.log('PASS protected bookmark is opened without changing its position');
  await open('/scanned.pdf',0);let scan=await state();
  const textCount=await page.evaluate(async()=>{let p=await window._view._view._pageFitting.viewer.pdfDocument.getPage(1);return (await p.getTextContent()).items.length;});
  assert.equal(textCount,0);assert.ok(scan.bounds[0]>.18&&scan.bounds[2]<.82&&scan.bounds[1]>.13&&scan.bounds[3]>.92&&scan.bounds[3]<.94,JSON.stringify(scan));
  console.log('PASS image-only gray paper and footnote bounds without OCR',JSON.stringify(scan.bounds));
  assert.deepEqual(errors,[]);console.log('PASS: all Android reader stability checks');
 } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
