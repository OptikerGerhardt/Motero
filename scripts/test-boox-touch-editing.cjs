const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android'),fixture=path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf');
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,file=u==='/fixture.pdf'?fixture:path.join(root,u);if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:600,height:900},isMobile:true,hasTouch:true});page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});
  const origin='http://127.0.0.1:'+server.address().port,cdp=await page.context().newCDPSession(page);
  const touch=(type,p)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1,radiusX:2,radiusY:2}]:[]});
  const drag=async(p,q)=>{await touch('touchStart',p);assert.equal(await page.evaluate(()=>!!window._view._view._booxReader.palette),false,'palette hides while editing');for(let i=1;i<=8;i++){await touch('touchMove',{x:p.x+(q.x-p.x)*i/8,y:p.y+(q.y-p.y)*i/8});await page.waitForTimeout(20);}await touch('touchEnd');await page.waitForTimeout(80);};
  await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
  await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/fixture.pdf',annotations:[],directHighlight:true,viewState:{pageIndex:5,scale:'page-width',scrollMode:0,spreadMode:0},pageFitting:{mode:'content',reference:'content',margin:0}});
  await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied);
  // Measure touch targets only after initial crop learning has finished moving them.
  await page.evaluate(()=>window._view._view._pageFitting.ensureModel());
  await page.waitForFunction(()=>{const v=window._view._view,f=v._pageFitting;return !f.refineForce&&!f.applying&&!f.pendingPage&&!v._scrolling;});
  await page.evaluate(async()=>{const v=window._view._view;await v._ensureBasicPageData(5);const chars=v._pdfPages[5].chars;const seed=chars.find(c=>{const r=v.getClientRect(c.rect,5);return /[a-z]/i.test(c.u||c.c||'')&&r[0]>90&&r[0]<330&&r[1]>260&&r[3]<600;});if(!seed)throw Error('Fixture has no visible body text');const row=chars.filter(c=>Math.abs(c.rect[1]-seed.rect[1])<1&&c.rect[0]>=seed.rect[0]).slice(0,12);window.editRect=[Math.min(...row.map(c=>c.rect[0])),Math.min(...row.map(c=>c.rect[1])),Math.max(...row.map(c=>c.rect[2])),Math.max(...row.map(c=>c.rect[3]))];});
  for(const type of ['highlight','underline','image','note']){
   const original=await page.evaluate(type=>{const v=window._view._view,r=window.editRect.slice();if(type==='image'){r[2]=r[0]+70;r[3]=r[1]+35;}if(type==='note'){r[2]=r[0]+22;r[3]=r[1]+22;}const a=v._onAddAnnotation({type,color:'#ff6666',sortIndex:'00005|000001|00001',pageLabel:'6',text:type==='highlight'||type==='underline'?'Fixture text':'',comment:'',position:{pageIndex:5,rects:[r]}});const c=v.getClientRectForPopup(a.position);return{id:a.id,position:JSON.stringify(a.position),p:{x:(c[0]+c[2])/2,y:(c[1]+c[3])/2}};},type);
   await touch('touchStart',original.p);await page.evaluate(()=>window._view._view._pageFitting.viewer.container.dispatchEvent(new Event('scroll')));await page.waitForTimeout(560);await touch('touchEnd');await page.waitForTimeout(100);
   const selected=await page.evaluate(()=>{const v=window._view._view;return v._selectedAnnotationIDs;});assert.deepEqual(selected,[original.id],type+': long hold should expose the existing edit handles');
   const handle=await page.evaluate(({id,type})=>{const v=window._view._view,a=v._annotations.find(a=>a.id===id),r=v.getClientRectForPopup(a.position);return type==='note'?{x:(r[0]+r[2])/2,y:(r[1]+r[3])/2}:type==='image'?{x:r[2],y:r[1]}:{x:r[2]+18,y:(r[1]+r[3])/2-18};},{id:original.id,type});
   const hadPalette=await page.evaluate(()=>!!window._view._view._booxReader.palette);
   await drag(handle,{x:handle.x+55,y:handle.y+(type==='highlight'||type==='underline'?0:35)});
   assert.equal(await page.evaluate(()=>!!window._view._view._booxReader.palette),hadPalette,type+': palette restores its previous visibility after editing');
   const changed=await page.evaluate(id=>window._view._annotationManager._annotations.find(a=>a.id===id),original.id);
   assert.ok(changed,type);assert.notEqual(JSON.stringify(changed.position),original.position,type+': drag must update geometry under the same ID');
   await page.evaluate(()=>window._view.undo());
   const undone=await page.evaluate(id=>window._view._annotationManager._annotations.find(a=>a.id===id),original.id);assert.equal(JSON.stringify(undone.position),original.position,type+': Undo must restore original geometry');
   await page.evaluate(id=>{window._view._view._onSelectAnnotations([]);window._view._annotationManager.deleteAnnotations([id]);window._view._view._booxReader.closePalette();},original.id);
   console.log('PASS '+type+': real long-hold activates touch editing; endpoint/corner/note drag preserves ID and Undo restores geometry');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
