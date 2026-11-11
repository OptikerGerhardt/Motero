// Real PDF.js checks for text/raster dispatch, directional Jumped entry and
// cold/warm operation counts. Timings describe this browser, never BOOX hardware.
const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=process.env.BOOX_PERF_BUNDLE||path.resolve(__dirname,'../build/android');
function textPDF(count=12,graphics=false){
 const objects=[null,'','','<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>'];
 const add=s=>(objects.push(s),objects.length-1),pages=[];
 for(let i=0;i<count;i++){
  let stream='';
  const text=(x,y,t,size=12)=>`BT /F1 ${size} Tf ${x} ${y} Td (${t}) Tj ET\n`;
  stream+=text(90,760,'A running book title',9);
  for(let row=0;row<35;row++)stream+=text(70,700-row*17,'Ordinary body text with enough words to verify the complete page.');
  stream+=text(70,75,'1 A complete footnote must stay in the crop.',9)+text(290,40,String(i+20),9);
  if(graphics) stream+='0 0 0 RG 60 60 480 670 re S\n';
  const content=add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
  pages.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`));
 }
 objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Count ${count} /Kids [${pages.map(p=>p+' 0 R').join(' ')}] >>`;
 let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
 const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
 return Buffer.from(pdf+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}
(async()=>{
 const pdf=textPDF(),fixture=path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost').pathname;
  if(url==='/stress.pdf'){res.setHeader('Content-Type','application/pdf');return res.end(textPDF(96,true));}
  if(url==='/text.pdf'){res.setHeader('Content-Type','application/pdf');return res.end(pdf);}
  const file=url==='/graphics.pdf'?fixture:path.join(root,url);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.pdf':'application/pdf'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:393,height:700},isMobile:true,hasTouch:true});page.setDefaultTimeout(90000);
  await page.addInitScript(()=>{window.readerLongTasks=[];try{new PerformanceObserver(list=>window.readerLongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});}catch(_){}});
  const workerFailures=[];
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});page.on('console',m=>{if(m.type()==='error'){console.error(m.text());if(/DataCloneError|already detached|Crop raster ownership expired/.test(m.text()))workerFailures.push(m.text());}});
  const origin='http://127.0.0.1:'+server.address().port;
  async function open(url='/text.pdf'){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const channel=new MessageChannel();channel.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[channel.port2]);});
   await page.waitForFunction(()=>window.messages.some(m=>m.message?.event==='onInitialized'));
   await page.evaluate(url=>window.createView(btoa(JSON.stringify({type:'pdf',url,annotations:[],pageNavigation:'jumped',directHighlight:true,
    viewState:{pageIndex:5,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:{mode:'width',reference:'cropped-content',cropMode:'automatic',margin:0}}))),origin+url);
   try { await page.waitForFunction(()=>{const v=window._view?._view;return v?._pageFitting?.applied&&!v._scrolling&&!v._pageFitting.applying&&!v._pendingPageTurn;},null,{timeout:20000}); }
   catch(e){console.error('OPEN STATE',await page.evaluate(()=>{const v=window._view?._view,f=v?._pageFitting;return {exists:!!v,active:f?.active,applied:f?.applied,options:f?.options,cache:f?.cache.size,work:f&&[...f.work.jobs].map(([i,j])=>[i,j.priority,j.started]),pages:f?.viewer.pdfDocument?.numPages,metrics:f?.metrics.snapshot(),messages:window.messages.slice(-3)};}));throw e;}
   await page.evaluate(()=>window._view._view._pageFitting.ensureModel());
   await page.waitForFunction(()=>{const f=window._view._view._pageFitting;return f.preparedPages.size>=8&&!f.prefetching&&!f.applying&&!f.pendingPage;});
  }
  const coldStart=Date.now();await open();const coldPreparationMs=Date.now()-coldStart;
  const cold=await page.evaluate(()=>window._view._view._pageFitting.metrics.snapshot());
  assert.ok(cold.textBounds?.count>0,JSON.stringify(cold));assert.equal(cold.raster?.count||0,0,'text-only document must avoid crop rasterization');
  for(const mode of [0,1,2]){
   await page.evaluate(async mode=>{const f=window._view._view._pageFitting;f.viewer.scrollMode=mode;await f.configure(f.options);},mode);
   for(const direction of [1,-1]){
    const result=await page.evaluate(async direction=>{
     const v=window._view._view,f=v._pageFitting,c=f.viewer.container;
     c.scrollTop+=50;await v._navigateToPage({direction});
     const b=f.layout.boxes[f.viewer.currentPageNumber-1];
     return {top:c.scrollTop,start:b.y,end:b.y+b.height-c.clientHeight,height:b.height,screen:c.clientHeight};
    },direction);
    assert.ok(result.height>result.screen,'fixture must exercise a page taller than the viewport');
    assert.ok(Math.abs(result.top-(direction>0?result.start:result.end))<2,JSON.stringify({mode,direction,result}));
   }
  }
  const before=await page.evaluate(()=>window._view._view._pageFitting.metrics.snapshot());
  const stableTurnsMs=[];
  for(let i=0;i<8;i++) stableTurnsMs.push(await page.evaluate(async i=>{const start=performance.now();await window._view._view._navigateToPage({direction:i%2?-1:1});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-start;},i));
  const warm=await page.evaluate(()=>window._view._view._pageFitting.metrics.snapshot());
  assert.equal(warm.text?.count,before.text?.count,'warm revisits must reuse geometry/text without new extraction');
  assert.equal(warm.raster?.count||0,0);
  console.log('PASS text-only cold/warm crop path, bounded prefetch and directional tall-page entry in all scroll layouts');
  console.log(JSON.stringify({coldPreparationMs,stableTurnsMs,longTasksMs:await page.evaluate(()=>window.readerLongTasks),cold,warm}));
  await open('/graphics.pdf');
  const graphics=await page.evaluate(()=>window._view._view._pageFitting.metrics.snapshot());
  assert.ok(graphics.raster?.count>0,'page graphics and separators require the raster fallback');
  await open('/stress.pdf');
  const cdp=await page.context().newCDPSession(page);
  await page.evaluate(()=>{
   const f=window._view._view._pageFitting;f.active=false;f.analysisLines.clear();f.readingModel=null;f.modelPromise=null;f.cache.clear();
   window.sampleRefs=[];window.sampleProbeDone=false;
   const read=f.readPage.bind(f);f.readPage=async(...args)=>{const p=await read(...args);if(p.image){window.sampleRefs.push(new WeakRef(p.image.data));await new Promise(r=>setTimeout(r,75));}return p;};
   f.ensureModel().then(()=>window.sampleProbeDone=true);
  });
  let peak=0,samples=0;
  while(!await page.evaluate(()=>window.sampleProbeDone)){
   await cdp.send('HeapProfiler.collectGarbage');
   const m=await page.evaluate(()=>({bytes:window.sampleRefs.reduce((n,r)=>n+(r.deref()?.byteLength||0),0),samples:window.sampleRefs.length}));
   peak=Math.max(peak,m.bytes);samples=Math.max(samples,m.samples);await page.waitForTimeout(30);
  }
  for(let start=0;start<96;start+=8) await page.evaluate(async start=>{const t=window._view._view._pdfThumbnails;await t.render(Array.from({length:8},(_,i)=>start+i));},start);
  const thumbnail=await page.evaluate(()=>{const t=window._view._view._pdfThumbnails;return{resident:t._thumbnails.filter(x=>x.image).length,bytes:t._thumbnails.reduce((n,x)=>n+(x.image?.length||0)*2,0)};});
  assert.ok(samples>=10,'exercise a complete learned sample set');
  assert.ok(peak<=8*1024*1024,'crop learning must not retain all sample bitmaps: '+peak);
  assert.ok(thumbnail.resident<=32&&thumbnail.bytes<=8*1024*1024,JSON.stringify(thumbnail));
  const layout=await page.evaluate(async()=>{
   const v=window._view._view,f=v._pageFitting;f.active=true;
   await v._navigateToPage({pageIndex:5});await v._navigateToPage({pageIndex:6});await v._navigateToPage({pageIndex:5});
   // Stabilize all prepared geometry before measuring repeated visits.
   await new Promise(r=>setTimeout(r,300));
   const before=f.layout.rebuildCount;
   for(let i=0;i<6;i++)await v._navigateToPage({pageIndex:i%2?5:6});
   return {before,after:f.layout.rebuildCount,page:f.viewer.currentPageNumber};
  });
  assert.equal(layout.after,layout.before,'warm page turns must reuse unchanged page layout');
  assert.equal(layout.page,6);
  console.log('PERF_MEMORY '+JSON.stringify({samplePeakBytes:peak,samples,thumbnail,layout}));
  const pressure=await page.evaluate(async()=>{
   const v=window._view._view,f=v._pageFitting,before={page:f.viewer.currentPageNumber,scale:f.viewer.currentScale};
   window.trimReaderMemory();await new Promise(r=>setTimeout(r,80));
   return{before,page:f.viewer.currentPageNumber,scale:f.viewer.currentScale,active:f.active,
    images:v._pdfThumbnails._thumbnails.filter(t=>t.image).length,failed:f.analysisWorker.failed===true};
  });
  assert.equal(pressure.page,pressure.before.page);assert.equal(pressure.scale,pressure.before.scale);
  assert.equal(pressure.active,true);assert.equal(pressure.images,0);assert.equal(pressure.failed,false);
  assert.deepEqual(workerFailures,[],'shared crop rasters must not be transferred twice');
  assert.deepEqual(errors,[]);console.log('PASS crop-performance checks; graphics retain raster fallback; memory pressure preserves the reading position');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
