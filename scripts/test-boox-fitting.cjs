const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../build/android');
const fixture = path.resolve(__dirname, '../test/fixtures/boox-fitting.pdf');
const types = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.pdf':'application/pdf', '.wasm':'application/wasm' };
(async () => {
 const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  const file = url === '/fixture.pdf' ? fixture : url === '/problem.pdf' ? process.env.BOOX_PROBLEM_PDF : path.join(root,url);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
  browser = await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true});
  const cpuRate = Number(process.env.BOOX_TEST_CPU_RATE || 1);
  if (cpuRate > 1) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', {rate:cpuRate});
  const errors=[]; page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack)});
  page.setDefaultTimeout(45000);
  const origin='http://127.0.0.1:'+server.address().port;
  async function open(pdf='/fixture.pdf', index=8) {
   await page.goto(origin+'/view.html');
   await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(({origin,pdf,index})=>window.createView(btoa(JSON.stringify({type:'pdf',url:origin+pdf,annotations:[],directHighlight:true,
    viewState:{pageIndex:index,scale:'page-width',scrollMode:2,spreadMode:0},
    pageFitting:{mode:'width',reference:'cropped-content',margin:.01,revision:1}}))),{origin,pdf,index});
   await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);await page.evaluate(async()=>{let f=window._view._view._pageFitting;await f.ensureModel();});await page.waitForTimeout(350);await page.evaluate(()=>{let f=window._view._view._pageFitting;return window.setPageFitting(f.options);});
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
  let odd=await state(); console.log('DIAG odd',odd);
  assert.ok(odd.bounds[0]>.20 && odd.bounds[0]<.24,JSON.stringify(odd));
  assert.ok(odd.bounds[1]>.14 && odd.bounds[1]<.18,JSON.stringify(odd));
  assert.ok(odd.bounds[3]>.89 && odd.bounds[3]<.94,'footnotes retained, stamp excluded: '+JSON.stringify(odd));
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:9}));
  let even=await state();console.log('DIAG even',even);
  assert.equal(even.page,10); assert.ok(Math.abs(even.scale-odd.scale)<.005,JSON.stringify({odd,even}));
  assert.ok(Math.abs(even.x-odd.x)>50,JSON.stringify({odd,even}));
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:8}));
  assert.ok(Math.abs((await state()).x-odd.x)<2);
  console.log('PASS separate odd/even alignment with stable text size and footnotes');
  let full=await fit('content');
  assert.ok(full.clip.startsWith('inset('));
  assert.ok(full.visible[0]>=-2 && full.visible[1]>=-2 && full.visible[2]<=full.width+2 && full.visible[3]<=full.height+2,JSON.stringify(full));
  let snapshot=JSON.stringify(full);
  await page.waitForTimeout(700);assert.equal(JSON.stringify(await state()),snapshot,'fitting must settle without a scroll/rezoom loop');
  console.log('PASS complete content rectangle visible; clipping and view settle');
    await page.evaluate(()=>window.setPageNavigation('jumped'));
	for (let mode of [0,1,2]) {
	 await page.evaluate(mode=>window._view._view.setScrollMode(mode),mode);
	 await fit('content');
	 let before=await state();
	 const result=await page.evaluate(()=>window.turnPageWithHardwareButton(true,2/3));
	 await page.waitForTimeout(220);
	 let after=await state();
	 assert.equal(result,'page');assert.equal(after.page,before.page+1,JSON.stringify({mode,before,after}));
	 assert.ok(after.visible[1]>=-2 && after.visible[3]<=after.height+2,JSON.stringify(after));
	}
	console.log('PASS content fit and first hardware press across Vertical, Horizontal and Wrapped');
	await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:8}));
	let rotations=[];
	for(let rotation of [90,180,270,0]) {
	 await page.evaluate(r=>window._view._view._pageFitting.viewer.pagesRotation=r,rotation);
	 await page.waitForTimeout(250);await fit('content');let rotated=await state();
	 assert.ok(rotated.visible[0]>=-2 && rotated.visible[1]>=-2 && rotated.visible[2]<=rotated.width+2 && rotated.visible[3]<=rotated.height+2,JSON.stringify(rotated));
	 rotations.push(rotated.bounds);
	}
	assert.ok(rotations[3][1]>.14,'header stays excluded after rotating back');
	console.log('PASS all display rotations preserve content and cached recognition');
  let width=await fit('width','page');assert.ok(Math.abs(width.pw-width.width)<4,JSON.stringify(width));assert.ok(width.clip.startsWith('inset('));
  await page.setViewportSize({width:600,height:650});await page.waitForTimeout(250);
  assert.ok(Math.abs((await state()).scale-width.scale)<.002);
  console.log('PASS page-width zoom does not depend on height');
  await page.setViewportSize({width:600,height:800});await page.waitForTimeout(250);
  let height=await fit('height','page');assert.ok(Math.abs(height.ph-height.height)<4,JSON.stringify(height));
  console.log('PASS true page-height zoom');
  let tight=await fit('width','content',0), roomy=await fit('width','content',.08);
  assert.ok(tight.scale>roomy.scale);assert.deepEqual(tight.bounds,roomy.bounds);
  await page.evaluate(()=>{let v=window._view._view._pageFitting.viewer,p=v.getPageView(v.currentPageNumber-1);v.container.scrollTop=p.div.offsetTop+p.div.clientTop;});await page.waitForTimeout(200);
  assert.ok((await state()).y<=0,'width mode permits scrolling to paper top');
  console.log('PASS adjustable content margins, full vertical paper access in width mode');
  const textWidth=await fit('width','content',0),cropWidth=await fit('width','cropped-content',0);
  assert.equal(textWidth.bounds[1],0);assert.equal(textWidth.bounds[3],1);
  assert.ok(cropWidth.bounds[1]>.10&&cropWidth.bounds[3]<.96,JSON.stringify(cropWidth));
  assert.ok(Math.abs(textWidth.scale-cropWidth.scale)<.005,JSON.stringify({textWidth,cropWidth}));
  const textHeight=await fit('height','content',0),cropHeight=await fit('height','cropped-content',0);
  assert.equal(textHeight.bounds[0],0);assert.equal(textHeight.bounds[2],1);
  assert.ok(cropHeight.bounds[0]>.10&&cropHeight.bounds[2]<.95,JSON.stringify(cropHeight));
  assert.ok(Math.abs(textHeight.scale-cropHeight.scale)<.005,JSON.stringify({textHeight,cropHeight}));
  console.log('PASS Text keeps the full non-fitting axis; Text + crop removes both axes at the same fitted scale');
  await fit('width','content',.08);

  await page.evaluate(()=>{window._view._view._pageFitting.viewer.currentScale=1.8;});await page.waitForTimeout(150);
  assert.equal((await state()).active,false);assert.equal((await state()).reported.pageFitMode,'width');
  let reapplied=await fit('width','content',.08);assert.ok(Math.abs(reapplied.scale-roomy.scale)<.002,JSON.stringify({roomy,reapplied}));
  let none=await fit('none');assert.equal(none.active,false);assert.equal(none.scale,reapplied.scale);
  console.log('PASS manual zoom suspends fitting, selecting same mode reapplies, Off preserves zoom');
  await fit('width','content');
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:14}));let wide=await state();
  assert.ok(wide.bounds[0]<.07 && wide.bounds[2]>.93,JSON.stringify(wide));
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:17}));let deep=await state();
  assert.ok(deep.bounds[3]>.93,JSON.stringify(deep));
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:15}));let landscape=await state();
  assert.ok(landscape.bounds[2]<.7,JSON.stringify(landscape));
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:16}));let blank=await state();
  const inherited=await page.evaluate(()=>window._view._view._pageFitting.preparedPages.get(16).blankFrame);
  assert.ok(inherited?.width>0 && inherited?.height>0,'a white page inherits a physical reading frame');
  assert.ok(blank.bounds[0]>0 && blank.bounds[2]<1,JSON.stringify(blank));
  assert.ok(Math.abs(blank.bounds[1])<.001 && Math.abs(blank.bounds[3]-1)<.001,'Text preserves the complete non-fitting axis from typical neighboring pages');
  console.log('PASS wider tables, deep footnotes, landscape and blank page fallbacks');
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:8}));await fit('content');
  let originFit=await state();
  await page.evaluate(()=>{let view=window._view._view,b=view._booxReader,f=view._pageFitting;
   b.zoomOrigin={scale:f.viewer.currentScale,mode:'pageFit',fit:f.snapshot()};f.viewer.currentScale=.25;});
  await page.waitForTimeout(250);assert.equal((await state()).overview,true);
  await page.evaluate(()=>window._view._view._booxReader.enterPage(9));
  let restored=await state();assert.equal(restored.page,10);assert.equal(restored.active,true);assert.equal(restored.mode,'content');
  assert.ok(Math.abs(restored.scale-originFit.scale)<.01,JSON.stringify({originFit,restored}));
  console.log('PASS Wrapped overview restores fitting on selected page');
  // An input during asynchronous detection supersedes the fit, while the
  // document model remains cached for the next explicit request.
  await fit('none');
  let cancelled=await page.evaluate(async()=>{
   let f=window._view._view._pageFitting;let saved=f.boundsFor.bind(f);let release;
   f.boundsFor=()=>new Promise(resolve=>{release=()=>saved(f.viewer.currentPageNumber-1).then(resolve)});
   let old=f.viewer.currentScale, task=f.configure({mode:'width',reference:'content',margin:0});
   f.onDown({pointerId:777,target:{closest:()=>null}});release();let applied=await task;
   f.onUp({pointerId:777});f.boundsFor=saved;
   return {applied,old,scale:f.viewer.currentScale};
  });assert.equal(cancelled.applied,false);assert.equal(cancelled.old,cancelled.scale);
  console.log('PASS new touch cancels pending fitting without late zoom');
  await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:8}));
  for (const fittingMode of ['width','content','height']) {
  await fit(fittingMode,'content');
  const points=await page.evaluate(async()=>{
   let view=window._view._view,v=view._pageFitting.viewer,index=v.currentPageNumber-1;
   await view._ensureBasicPageData(index);
   let p=v.getPageView(index),r=p.div.getBoundingClientRect(),outer=view._iframe.getBoundingClientRect();
   let chars=view._pdfPages[index].chars;
   let visible=chars.map((c,i)=>{let xy=p.viewport.convertToViewportPoint((c.rect[0]+c.rect[2])/2,(c.rect[1]+c.rect[3])/2);
    return {i,x:r.left+outer.left+xy[0],y:r.top+outer.top+xy[1]};}).filter(c=>c.x>80&&c.x<520&&c.y>120&&c.y<600);
   let a=visible[0],b=visible.find(c=>c.x>a.x+90&&Math.abs(c.y-a.y)<3);return [a,b];
  });
  assert.ok(points[1],JSON.stringify(points));
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,point)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:point?[{x:point.x,y:point.y,id:1}]:[]});
  await touch('touchStart',points[0]);await page.waitForTimeout(600);
  for(let i=1;i<=8;i++) await touch('touchMove',{x:points[0].x+(points[1].x-points[0].x)*i/8,y:points[0].y});
  await touch('touchEnd');await page.waitForTimeout(200);
  const annotations=await page.evaluate(()=>window._view._view._annotations);
  assert.equal(annotations.length,1);assert.equal(annotations[0].position.pageIndex,8);
  const palette=page.frameLocator('iframe').locator('.boox-highlight-palette');
  assert.equal(await palette.count(),1,'highlight palette remains open while fitting is active');
  await palette.locator('button[data-color="#2ea8e5"]').click();
  assert.equal((await state()).active,true,'palette interaction keeps fitting');
  await touch('touchStart',points[0]);await touch('touchEnd');await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>window._view.getSelectedAnnotationIDs()),[annotations[0].id]);
  assert.ok(await page.evaluate(id=>window.messages.some(x=>x.message?.event==='onSetAnnotationPopup'&&x.message.params?.annotation?.id===id),annotations[0].id));
  console.log('PASS touch highlighting, palette and first annotation tap with active fitting',fittingMode);
  await page.evaluate(id=>{window._view.selectAnnotations([]);window._view._annotationManager.deleteAnnotations([id]);},annotations[0].id);
  }
  if(process.env.BOOX_PROBLEM_PDF){
   await open('/problem.pdf',249);let a=await state();
   await page.evaluate(()=>window._view._view._navigateToPage({pageIndex:250}));let b=await state();
   console.log('DIAG Mul pages 250/251',JSON.stringify({a,b}));
   assert.equal(b.page,251);assert.ok(a.bounds[0]>0 && b.bounds[0]>0);
   assert.ok(a.bounds[1]>.09 && b.bounds[1]>.09,'running titles excluded: '+JSON.stringify({a,b}));
   assert.ok(Math.abs(a.scale-b.scale)<.03,JSON.stringify({a,b}));
   await fit('content');let all=await state();
   assert.ok(all.visible[1]>=-2 && all.visible[3]<=all.height+2,JSON.stringify(all));
   console.log('PASS original Mul PDF odd/even and complete content fit');
  }
  assert.deepEqual(errors,[]);console.log('PASS: all Android fitting checks');
 } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
