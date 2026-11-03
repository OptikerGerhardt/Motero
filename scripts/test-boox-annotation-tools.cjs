const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android'),fixture=path.resolve(__dirname,'../test/fixtures/boox-touch.pdf');
(async()=>{
 const server=http.createServer((req,res)=>{let u=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=u==='/touch.pdf'?fixture:path.join(root,u);if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.pdf':'application/pdf'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let origin='http://127.0.0.1:'+server.address().port,browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  let page=await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.stack));
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  async function open(options={}){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];let c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'pdf',url:origin+'/touch.pdf',annotations:[],directHighlight:true,viewState:{pageIndex:0,scale:'page-width',scrollMode:0,spreadMode:0},...options});
   await page.waitForFunction(()=>window._view?._view?._resolveInitializedPromise===null);await page.evaluate(()=>window._view._view._ensureBasicPageData(0));
  }
  const state=()=>page.evaluate(()=>{let v=window._view._view;return{annotations:v._annotations,selected:window._view.getSelectedAnnotationIDs(),palette:!!v._booxReader.palette,loupe:!!v._iframeWindow.document.querySelector('.boox-selection-magnifier'),pointer:v._pointerDownTriggered};});
  const firstLine=()=>page.evaluate(()=>{let v=window._view._view,p=v._pageFitting.viewer.getPageView(0),r=p.div.getBoundingClientRect(),outer=v._iframe.getBoundingClientRect(),cs=v._pdfPages[0].chars,dot=cs.findIndex(c=>c.c==='.');let point=c=>{let q=p.viewport.convertToViewportPoint((c.rect[0]+c.rect[2])/2,(c.rect[1]+c.rect[3])/2);return{x:outer.left+r.left+q[0],y:outer.top+r.top+q[1]};};return{start:point(cs[1]),end:point(cs[dot-1]),middle:point(cs[8]),dot:point(cs[dot]),chars:cs.slice(0,dot+1).map(c=>({c:c.c,spaceAfter:c.spaceAfter,wordBreakAfter:c.wordBreakAfter}))};});
  await open();let points=await firstLine();
  await touch('touchStart',[points.start]);await page.waitForTimeout(540);assert.equal((await state()).loupe,true);
  await touch('touchMove',[points.end]);await page.waitForTimeout(80);
  const selected=await page.evaluate(()=>window._view._view._selectionRanges.map(r=>r.text).join(' '));assert.ok(selected.endsWith('delta.'),JSON.stringify({selected,chars:points.chars}));
  const pixels=await page.evaluate(()=>{let c=window._view._view._iframeWindow.document.querySelector('.boox-selection-magnifier canvas');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.filter((v,i)=>i%4!==3&&v<180).length;});assert.ok(pixels>20,'loupe contains rendered text');
  const preview=await page.evaluate(()=>{let c=window._view._view._iframeWindow.document.querySelector('.boox-selection-magnifier canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,n=0;for(let i=0;i<a.length;i+=4)if(a[i]>230&&a[i+1]>200&&a[i+2]<230)n++;return n;});assert.ok(preview>10,'loupe shows the actual selected region');
  if(process.env.BOOX_QA_IMAGES){fs.mkdirSync(process.env.BOOX_QA_IMAGES,{recursive:true});await page.screenshot({path:path.join(process.env.BOOX_QA_IMAGES,'drag-magnifier.png')});}
  await touch('touchEnd',[]);await page.waitForTimeout(140);let s=await state();assert.equal(s.loupe,false);assert.equal(s.annotations.length,1);assert.ok(s.annotations[0].text.endsWith('delta.'));
  console.log('PASS attached final punctuation is persisted in text and geometry; live magnifier disappears on release');
  let palette=page.frameLocator('iframe').locator('.boox-highlight-palette');
  const buttons=await palette.locator('[data-type]').evaluateAll(bs=>bs.map(b=>({type:b.dataset.type,width:b.getBoundingClientRect().width,center:b.querySelector('svg').getBoundingClientRect().left+b.querySelector('svg').getBoundingClientRect().width/2-b.getBoundingClientRect().left})));
  assert.deepEqual(buttons.map(b=>b.type),['highlight','delete','underline']);assert.ok(buttons.every(b=>Math.abs(b.width-buttons[0].width)<1&&Math.abs(b.center-b.width/2)<1));
  if(process.env.BOOX_QA_IMAGES)await palette.screenshot({path:path.join(process.env.BOOX_QA_IMAGES,'annotation-palette.png')});
  await palette.locator('[data-type="underline"]').click();await page.waitForTimeout(120);s=await state();assert.equal(s.annotations[0].type,'underline');const id=s.annotations[0].id;
  await palette.locator('[data-type="delete"]').click();await page.waitForTimeout(150);s=await state();assert.equal(s.annotations.length,0);assert.equal(s.palette,false);assert.deepEqual(s.selected,[]);assert.equal(s.pointer,false);
  await page.waitForFunction(id=>window.messages.some(m=>m.message?.event==='onDeleteAnnotations'&&m.message.params.ids.includes(id)),id);
  console.log('PASS equal palette thirds and normal synced deletion clear selection and pointer state');
  await open();points=await firstLine();
  await touch('touchStart',[points.start]);await page.waitForTimeout(530);await touch('touchMove',[points.end]);await touch('touchEnd',[]);await page.waitForTimeout(120);
  await page.evaluate(()=>{window._view._view._booxReader.closePalette();window._view.selectAnnotations([]);window.messages=[];});
  const original=(await state()).annotations[0];
  await touch('touchStart',[points.middle]);await page.waitForTimeout(540);assert.equal((await state()).palette,true);await touch('touchEnd',[]);await page.waitForTimeout(80);
  assert.equal((await state()).annotations.length,1);assert.equal((await state()).annotations[0].id,original.id);
  assert.equal(await page.evaluate(()=>window.messages.filter(m=>m.message?.event==='onSetAnnotationPopup'&&m.message.params?.annotation).length),0);
  await palette.locator('[data-color="#2ea8e5"]').click();await page.waitForTimeout(120);assert.equal((await state()).annotations[0].color,'#2ea8e5');assert.equal((await state()).annotations[0].id,original.id);
  console.log('PASS long press reopens the same annotation quick palette and color updates preserve identity');
  await page.evaluate(()=>{window.setDirectHighlight(false);window.setReaderChromeVisible(true);});
  await touch('touchStart',[points.middle]);await page.waitForTimeout(540);assert.equal((await state()).palette,true);await touch('touchEnd',[]);
  await palette.locator('[data-type="delete"]').click();await page.waitForTimeout(100);assert.equal((await state()).annotations.length,0);
  console.log('PASS long press works with Android selection mode and visible chrome');
  await open();
  let note=await page.evaluate(()=>{let v=window._view._view;let a=v._onAddAnnotation({type:'note',color:'#aaaaaa',comment:'Keep note content',pageLabel:'1',sortIndex:'00000|000010|00500',position:{pageIndex:0,rects:[[400,500,422,522]]}});window._view.selectAnnotations([]);let p=v._pageFitting.viewer.getPageView(0),r=p.div.getBoundingClientRect(),q=p.viewport.convertToViewportPoint(411,511),outer=v._iframe.getBoundingClientRect();return{annotation:a,point:{x:outer.left+r.left+q[0],y:outer.top+r.top+q[1]}};});
  await touch('touchStart',[note.point]);await page.waitForTimeout(540);assert.equal((await state()).palette,true);await touch('touchEnd',[]);
  assert.equal(await palette.locator('[data-type="highlight"]').isDisabled(),true);assert.equal(await palette.locator('[data-type="underline"]').isDisabled(),true);
  await palette.locator('[data-color="#2ea8e5"]').click();await page.waitForTimeout(80);assert.equal((await state()).annotations[0].comment,'Keep note content');
  await page.evaluate(id=>window._view.selectAnnotations([id]),note.annotation.id);
  await touch('touchStart',[note.point]);await page.waitForTimeout(80);await touch('touchMove',[{x:note.point.x+60,y:note.point.y+35}]);await page.waitForTimeout(100);await touch('touchEnd',[]);await page.waitForTimeout(100);
  assert.equal((await state()).palette,false);assert.notDeepEqual((await state()).annotations[0].position,note.annotation.position,'note still drags before hold threshold');
  console.log('PASS note quick colors preserve content and early movement retains native dragging');
  await open();points=await firstLine();await touch('touchStart',[points.start]);await page.waitForTimeout(530);assert.equal((await state()).loupe,true);
  await touch('touchStart',[points.start,{x:points.start.x+100,y:points.start.y+100}]);await page.waitForTimeout(80);assert.equal((await state()).loupe,false);await touch('touchEnd',[]);assert.equal((await state()).annotations.length,0);
  console.log('PASS multitouch cancellation removes the magnifier without creating an annotation');
  assert.deepEqual(errors,[]);console.log('PASS: all annotation tool regressions');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
