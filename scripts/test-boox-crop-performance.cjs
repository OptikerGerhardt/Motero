// Real PDF.js checks for text/raster dispatch, directional Jumped entry and
// cold/warm operation counts. Timings describe this browser, never BOOX hardware.
const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android');
function textPDF(){
 const objects=[null,'','','<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>'];
 const add=s=>(objects.push(s),objects.length-1),pages=[];
 for(let i=0;i<12;i++){
  let stream='';
  const text=(x,y,t,size=12)=>`BT /F1 ${size} Tf ${x} ${y} Td (${t}) Tj ET\n`;
  stream+=text(90,760,'A running book title',9);
  for(let row=0;row<35;row++)stream+=text(70,700-row*17,'Ordinary body text with enough words to verify the complete page.');
  stream+=text(70,75,'1 A complete footnote must stay in the crop.',9)+text(290,40,String(i+20),9);
  const content=add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
  pages.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`));
 }
 objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Count 12 /Kids [${pages.map(p=>p+' 0 R').join(' ')}] >>`;
 let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
 const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
 return Buffer.from(pdf+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}
(async()=>{
 const pdf=textPDF(),fixture=path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost').pathname;
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
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
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
  assert.deepEqual(errors,[]);console.log('PASS crop-performance checks; graphics retain raster fallback');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
