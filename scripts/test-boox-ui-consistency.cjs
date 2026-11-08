const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../build/android');
(async () => {
 const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = pathname === '/fixture.pdf' ? path.resolve(__dirname, '../test/fixtures/boox-fitting.pdf') : path.join(root, pathname);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf','.wasm':'application/wasm'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 let browser;
 try {
  browser = await chromium.launch({ executablePath: process.env.BOOX_TEST_BROWSER, headless:true,args:['--no-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport:{width:393,height:852},isMobile:true,hasTouch:true,colorScheme:'dark' });
  const errors=[];page.on('pageerror', e=>{errors.push(e.message);console.error(e.stack);});page.setDefaultTimeout(45000);
  const origin='http://127.0.0.1:'+server.address().port;
  async function open() {
   const started=Date.now();
   await page.goto(origin+'/view.html?readerColorScheme=light');
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.colorScheme),'light');
   await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(url=>window.createView(btoa(JSON.stringify({type:'pdf',url,annotations:[],colorScheme:'light',directHighlight:true,
    pageFitting:{mode:'width',reference:'cropped-content',margin:0,cropMode:'automatic'},viewState:{pageIndex:0,scale:'page-width',scrollMode:0,spreadMode:0}}))),origin+'/fixture.pdf');
   try { await page.waitForFunction(()=>window._view?._view?._pageFitting?.applied && window._view._view._pdfThumbnails, null, {timeout:12000}); }
   catch(error) { console.error('OPEN DIAGNOSTIC', await page.evaluate(()=>{const v=window._view?._view,f=v?._pageFitting;return {scheme:v?._colorScheme,doc:!!f?.viewer.pdfDocument,applied:f?.applied,active:f?.active,options:f?.options,thumb:!!v?._pdfThumbnails,pages:v?._pages.length,messages:window.messages.slice(-3)};}));throw error;}
   return Date.now()-started;
  }
  const cold=await open();
  assert.equal(await page.evaluate(()=>window._view._view._iframeWindow.document.documentElement.dataset.colorScheme),'light');
  await page.evaluate(()=>window.renderThumbnails([0]));
  await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onRenderThumbnail'));
  const preview=await page.evaluate(async()=>{
   const v=window._view._view, t=v._pdfThumbnails, p=t._thumbnails[0];
   const image=new Image();image.src=p.image;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
   const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
   const pixel=[...ctx.getImageData(0,0,1,1).data];
   const key=t.renderKey;window._view.setColorScheme('light');return {pixel,key,after:t.renderKey,scheme:p.colorScheme};
  });
  assert.equal(preview.scheme,'light');assert.equal(preview.key,preview.after);assert.ok(preview.pixel[0]>235 && preview.pixel[1]>235,JSON.stringify(preview));
  await page.evaluate(()=>window._view.setColorScheme('dark'));
  await page.waitForFunction(old=>window._view._view._pdfThumbnails.renderKey!==old,preview.key);
  await page.evaluate(()=>window.renderThumbnails([0]));
  await page.waitForFunction(()=>window._view._view._pdfThumbnails._thumbnails[0].colorScheme==='dark');
  const darkKey=await page.evaluate(()=>window._view._view._pdfThumbnails.renderKey);
  await page.evaluate(async()=>{const t=window._view._view._pdfThumbnails;const pending=t._render(1);window._view.setColorScheme('light');await pending;});
  await page.waitForFunction(key=>window._view._view._pdfThumbnails.renderKey!==key,darkKey);
  await page.evaluate(()=>window.renderThumbnails([0]));
  await page.waitForFunction(()=>window._view._view._pdfThumbnails._thumbnails[0].colorScheme==='light');
  assert.ok(await page.evaluate(()=>window._view._view._pdfThumbnails._thumbnails.every(p=>!p.image || p.renderKey===window._view._view._pdfThumbnails.renderKey)));
  console.log('PASS explicit Reader Light overrides OS Dark; thumbnails follow theme; stale renders and redundant resets are avoided');

  const bookmark=await page.evaluate(()=>window._view._annotationManager.addAnnotation({type:'note',color:'#000000',comment:'Bookmark · test',pageLabel:'1',sortIndex:'00000|000200|00000',position:{pageIndex:0,rects:[[200,300,222,322]]}}).id);
  await page.waitForFunction(()=>window._view._view._pages[0]._originalPage.div.querySelector('path[d="M6 3h12v18l-6-4-6 4z"]'));
  assert.equal(await page.evaluate(()=>window._view._view._pages[0]._originalPage.div.querySelector('path[d="M6 3h12v18l-6-4-6 4z"]').parentNode.getAttribute('opacity')),'0.7');
  await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onHistoryChanged' && x.message.params.canUndo));
  await page.evaluate(()=>window.undoReaderAnnotation());
  assert.ok(await page.evaluate(id=>!window._view._view._annotations.some(a=>a.id===id),bookmark));
  await page.evaluate(()=>window._view._annotationManager.addAnnotation({type:'note',color:'#000000',comment:'ordinary note',pageLabel:'1',sortIndex:'00000|000200|00000',position:{pageIndex:0,rects:[[200,300,222,322]]}}));
  assert.equal(await page.evaluate(()=>window._view._view._pages[0]._originalPage.div.querySelectorAll('path[d="M6 3h12v18l-6-4-6 4z"]').length),0);
  console.log('PASS semantic black bookmark flag at 70%; ordinary notes retain shape; Undo travels through annotation history');

  await page.evaluate(()=>{
   const m=window._view._annotationManager;
   m.addAnnotation({type:'ink',color:'#ff0000',pageLabel:'1',sortIndex:'00000|000100|00000',position:{pageIndex:0,width:2,paths:[[100,100,150,150]]}});
   const div=window._view._view._pages[0]._originalPage.div;
   window.savedOverlayNodes=[...div.querySelectorAll('.overlayVector > *')];
   m.addAnnotation({type:'ink',color:'#000000',pageLabel:'1',sortIndex:'00000|000101|00000',position:{pageIndex:0,width:2,paths:[[160,150,190,170]]}});
  });
  assert.ok(await page.evaluate(()=>window.savedOverlayNodes.length>0 && window.savedOverlayNodes.every(n=>n.isConnected)));
  console.log('PASS unchanged annotation vectors survive incremental ink redraws');

  await page.evaluate(async()=>{const f=window._view._view._pageFitting;await f.ensureModel();f.persistent.flush();});
  const persisted=await page.evaluate(()=>window._view._view._pageFitting.persistent.pages.size);
  assert.ok(persisted>0);
  const warm=await open();
  const restored=await page.evaluate(()=>{const f=window._view._view._pageFitting;return {learning:!!f.persistent.learning,pages:f.persistent.pages.size,work:f.work.jobs.size};});
  assert.ok(restored.learning && restored.pages>0,JSON.stringify(restored));
  console.log('PASS automatic geometry and numeric learning restore on reopen; browser opening milliseconds '+JSON.stringify({cold,warm,...restored}));
  await page.evaluate(()=>window.setTool({type:'ink',color:'#000000',size:2}));
  const cdp=await page.context().newCDPSession(page);
  const pen=(type,x,y)=>cdp.send('Input.dispatchMouseEvent',{type,x,y,pointerType:'pen',button:type==='mouseMoved'?'none':'left',buttons:type==='mouseReleased'?0:1});
  await pen('mousePressed',180,240);await pen('mouseMoved',181,241);await pen('mouseReleased',182,242);
  await page.waitForFunction(()=>window._view._view._annotations.some(a=>a.type==='ink'));
  assert.ok(await page.evaluate(()=>window._view._view._annotations.find(a=>a.type==='ink').position.paths[0].length>=4));
  await pen('mousePressed',180,260);await pen('mouseMoved',184,264);
  assert.ok(await page.evaluate(()=>{
   const v=window._view._view, id=v.action.pointerID, win=v._iframeWindow;
   win.dispatchEvent(new win.PointerEvent('pointerdown',{pointerId:id+10,pointerType:'touch',clientX:20,clientY:20,bubbles:true}));
   win.dispatchEvent(new win.PointerEvent('pointerup',{pointerId:id+10,pointerType:'touch',clientX:20,clientY:20,bubbles:true}));
   const active=v.action?.pointerID===id;
   win.dispatchEvent(new win.PointerEvent('pointercancel',{pointerId:id,pointerType:'pen',clientX:0,clientY:0,bubbles:true}));
   return active;
  }));
  await pen('mouseReleased',184,264);
  const paths=await page.evaluate(()=>window._view._view._annotations.filter(a=>a.type==='ink').flatMap(a=>a.position.paths));
  assert.ok(paths.length>=2 && paths.every(p=>p.length>=2 && p.every(Number.isFinite)));
  console.log('PASS real Chromium pen stream keeps short strokes, release endpoints and canceled ink; a second pointer cannot hijack an active stroke');
  await page.evaluate(()=>window.beginManualCrop({nativeControls:true}));
  await page.waitForFunction(()=>window._view._view._pageFitting.editor && !window._view._view._pageFitting.editor.busy);
  assert.ok(await page.evaluate(()=>getComputedStyle(window._view._view._pageFitting.editor.root.querySelector('.crop-shade')).clipPath.includes('evenodd')));
  await page.evaluate(()=>window.cropEditorAction({action:'cancel'}));
  assert.deepEqual(errors,[]);console.log('PASS crop mask is confined to PDF sheet; no browser exceptions');
 } finally { if(browser)await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
