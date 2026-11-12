const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android'),fixture=require('./make-header-fixture.cjs');
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,file=u==='/fixture.pdf'?fixture:path.join(root,u);if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try {
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:600,height:900},isMobile:true,hasTouch:true});page.setDefaultTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.stack));
  const origin='http://127.0.0.1:'+server.address().port;
  await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});await page.waitForFunction(()=>window.messages.some(m=>m.message?.event==='onInitialized'));
  await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/fixture.pdf',annotations:[],pageNavigation:'jumped',pageFitting:{mode:'width',reference:'cropped-content',margin:0},viewState:{pageIndex:0,scrollMode:0,spreadMode:0}});
  await page.waitForFunction(()=>!!window._view?._view?._pageFitting?.applied);
  for(let index=0;index<3;index++) {
   const result=await page.evaluate(async index=>{const v=window._view._view,f=v._pageFitting;await v._navigateToPage({pageIndex:index});const d=f.viewer.getPageView(index).div.getBoundingClientRect();return {bounds:f.applied.bounds,top:d.top,left:d.left,scale:f.viewer.currentScale};},index);
   assert.ok(result.bounds[1]>.08&&result.bounds[1]<.12&&result.bounds[3]>.86&&result.bounds[3]<.92,JSON.stringify({index,result}));
   await page.waitForTimeout(800);
   const settled=await page.evaluate(()=>{const f=window._view._view._pageFitting,d=f.viewer.getPageView(f.viewer.currentPageNumber-1).div.getBoundingClientRect();return {top:d.top,left:d.left,scale:f.viewer.currentScale};});
   assert.equal(settled.scale,result.scale,'learning must not change the visible font size');assert.ok(Math.abs(settled.left-result.left)<2&&Math.abs(settled.top-result.top)<2,'learning must not shift visible text: '+JSON.stringify({index,result,settled}));
   console.log('PASS header case '+index+': Text + crop removes running head/rule/folio/license, preserves the footnote and holds visible geometry');
  }
  assert.deepEqual(errors,[]);
 } finally {await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
