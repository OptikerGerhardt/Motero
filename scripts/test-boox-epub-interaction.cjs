const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/android');
(async()=>{
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname,file=u==='/navigation.epub'?process.env.BOOX_NAVIGATION_EPUB:path.join(root,u);
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.epub':'application/epub+zip','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BOOX_TEST_BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:393,height:900},isMobile:true,hasTouch:true});page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});
  const origin='http://127.0.0.1:'+server.address().port,cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({...p,id:i+1,radiusX:2,radiusY:2}))});
  const tap=async p=>{await touch('touchStart',[p]);await touch('touchEnd',[]);await page.waitForTimeout(100);};
  const hold=async(p,end=p)=>{await touch('touchStart',[p]);await page.waitForTimeout(560);if(end!==p){for(let i=1;i<=5;i++){await touch('touchMove',[{x:p.x+(end.x-p.x)*i/5,y:p.y+(end.y-p.y)*i/5}]);await page.waitForTimeout(25);}}await touch('touchEnd',[]);await page.waitForTimeout(100);};
  async function open(flow){
   await page.goto(origin+'/view.html');await page.evaluate(()=>{window.messages=[];const c=new MessageChannel();c.port1.onmessage=e=>window.messages.push(JSON.parse(e.data));window.postMessage('initPort','*',[c.port2]);});
   await page.waitForFunction(()=>window.messages.some(x=>x.message?.event==='onInitialized'));
   await page.evaluate(o=>window.createView(btoa(JSON.stringify(o))),{type:'epub',url:origin+'/navigation.epub',annotations:[],directHighlight:true,viewState:{flowMode:flow,spreadMode:0,appearance:{lineHeight:1.2,wordSpacing:0,letterSpacing:0,pageWidth:0,margins:8,fontFamily:'serif'}}});
   await page.waitForFunction(()=>window._view?._view?.initialized&&window._view._view.flow?.startRange);
  }
  const point=()=>page.evaluate(()=>{
   const v=window._view._view,d=v._iframeDocument,f=v._iframe.getBoundingClientRect();
   const p=Array.from(d.querySelectorAll('p')).find(p=>{const r=p.getBoundingClientRect();return r.top>100&&r.top<400&&r.left>=0&&r.left<300;});
   const range=d.createRange();range.setStart(p.firstChild,0);range.setEnd(p.firstChild,7);const r=range.getBoundingClientRect();
   return{x:f.left+r.left+15,y:f.top+(r.top+r.bottom)/2};
  });
  for(const flow of ['paginated','scrolled']){
   await open(flow);const p=await point();await hold(p,{x:p.x+130,y:p.y+25});
   await page.waitForFunction(()=>window._view._annotationManager._annotations.some(a=>a.type==='highlight'));
   const created=await page.evaluate(()=>{const v=window._view._view,a=window._view._annotationManager._annotations;return{count:a.length,text:a[0].text,palette:!!v._iframeDocument.querySelector('.boox-highlight-palette'),preview:!!v._previewAnnotation,selection:v._iframeWindow.getSelection().toString()};});
   assert.equal(created.count,1);assert.ok(created.text.includes('Chapter'));assert.equal(created.palette,true);assert.equal(created.preview,false);assert.equal(created.selection,'');
   console.log('PASS '+flow+': real touch hold/drag creates a CFI highlight with the shared PDF palette, without Android selection');
   const original=await page.evaluate(()=>{const v=window._view._view,a=window._view._annotationManager._annotations[0];v._directHighlight.closePalette();return{id:a.id,position:JSON.stringify(a.position)};});
   await hold(p);
   const endHandle=await page.evaluate(()=>{const v=window._view._view;const h=v._annotationShadowRoot.querySelectorAll('.resizer');if(h.length!==2)throw Error('Missing EPUB selection handles');const r=h[1].getBoundingClientRect(),f=v._iframe.getBoundingClientRect();if(parseFloat(getComputedStyle(h[1]).strokeWidth)<44)throw Error('Touch endpoint target is too narrow');return{x:f.left+r.left+r.width/2+18,y:f.top+r.top+r.height/2+14};});
   await touch('touchStart',[endHandle]);assert.equal(await page.evaluate(()=>!!window._view._view._directHighlight.host.palette),false,'EPUB palette hides during resize');for(let i=1;i<=5;i++){await touch('touchMove',[{x:endHandle.x+50*i/5,y:endHandle.y}]);await page.waitForTimeout(25);}await touch('touchEnd',[]);await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>!!window._view._view._directHighlight.host.palette),true,'EPUB palette returns after resize');
   const resized=await page.evaluate(id=>window._view._annotationManager._annotations.find(a=>a.id===id),original.id);
   assert.ok(resized);assert.notEqual(JSON.stringify(resized.position),original.position,flow+': real EPUB handle drag must change the CFI range');
   await page.evaluate(()=>window._view.undo());assert.equal(await page.evaluate(id=>JSON.stringify(window._view._annotationManager._annotations.find(a=>a.id===id).position),original.id),original.position);
   await page.evaluate(()=>{const v=window._view._view;v._directHighlight.host.showPalette([window._view._annotationManager._annotations[0]]);});
   console.log('PASS '+flow+': long-press exposes EPUB endpoints; touch resize preserves ID and Undo restores its CFI');

   const deletePoint=await page.evaluate(()=>{const v=window._view._view,r=v._directHighlight.host.palette.querySelector('[data-type="delete"]').getBoundingClientRect(),f=v._iframe.getBoundingClientRect();return{x:f.left+r.left+r.width/2,y:f.top+r.top+r.height/2};}); await tap(deletePoint);
   await page.waitForFunction(()=>!window._view._annotationManager._annotations.length);
   const note=await page.evaluate(p=>{const v=window._view._view,f=v._iframe.getBoundingClientRect(),range=v._directHighlight.wordAt({clientX:p.x-f.left,clientY:p.y-f.top});const a=v._options.onAddAnnotation(v._finalizeAnnotation(v.getAnnotationFromRange(range,'note','#ffd400')));return {id:a.id,position:JSON.stringify(a.position)};},p);
   const notePoint=await page.evaluate(id=>{const v=window._view._view,s=v._annotationShadowRoot.querySelector(`svg[data-annotation-id="${id}"]`),r=s.getBoundingClientRect(),f=v._iframe.getBoundingClientRect();return{x:f.left+r.left+r.width/2,y:f.top+r.top+r.height/2};},note.id);
   await hold(notePoint,{x:p.x+80,y:p.y+50});
   const movedNote=await page.evaluate(id=>window._view._annotationManager._annotations.find(a=>a.id===id),note.id);
   assert.notEqual(JSON.stringify(movedNote.position),note.position,flow+': hold/drag must re-anchor the existing note');
   await page.evaluate(()=>window._view.undo());assert.equal(await page.evaluate(id=>JSON.stringify(window._view._annotationManager._annotations.find(a=>a.id===id).position),note.id),note.position);
   await page.evaluate(id=>{window._view.selectAnnotations([]);window._view._annotationManager.deleteAnnotations([id]);},note.id);
   console.log('PASS '+flow+': real note hold/drag changes its CFI anchor, preserves ID and Undo restores it');
   const before=await page.evaluate(()=>window._view._view.flow.startCFI.toString());
   const frame=await page.evaluate(()=>{const v=window._view._view,r=v._iframe.getBoundingClientRect();return{x:r.left+r.width-20,y:r.top+20,width:r.width};});
   await tap({x:frame.x,y:frame.y});await page.waitForFunction(()=>window._view._annotationManager._annotations.some(a=>a.type==='note'));
   const bookmark=await page.evaluate(()=>{const v=window._view._view,a=window._view._annotationManager._annotations[0],s=v._annotationShadowRoot.querySelector(`svg[data-annotation-id="${a.id}"]`);const r=s.getBoundingClientRect();return{color:a.color,opacity:s.getAttribute('opacity'),flag:s.querySelector('path')?.getAttribute('d'),x:r.left,width:v._iframeWindow.innerWidth};});
   assert.equal(bookmark.color,'#000000');assert.equal(bookmark.opacity,'70%');assert.equal(bookmark.flag,'M5 2h14v20l-7-4.5-7 4.5z');assert.ok(bookmark.x>bookmark.width*.8,JSON.stringify(bookmark));
   await tap({x:frame.x,y:frame.y});await page.waitForFunction(()=>!window._view._annotationManager._annotations.length);
   console.log('PASS '+flow+': upper-right black 70% bookmark flag and repeated tap removal');
   for(const margins of [0,8,20]){
    await page.evaluate(m=>window._view.setAppearance({lineHeight:1.2,wordSpacing:0,letterSpacing:0,pageWidth:0,margins:m,fontFamily:'serif'}),margins);await page.waitForTimeout(150);
    const actual=await page.evaluate(()=>{const v=window._view._view,d=v._iframeDocument,p=d.querySelector('p'),r=p.getBoundingClientRect();return{width:r.width,margin:parseFloat(d.documentElement.style.getPropertyValue('--reader-side-margin')),position:v.flow.startCFI.toString()};});
    assert.equal(actual.margin,margins);assert.ok(Math.abs(actual.width-393*(1-2*margins/100))<3,JSON.stringify(actual));
   }
   const stable=await page.evaluate(()=>{const v=window._view._view;return{cfi:v.flow.startCFI.toString(),offset:v.flow.startCFIOffset,height:v._iframe.offsetHeight};});
   for(let i=0;i<3;i++){await tap({x:195,y:800});await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));const v=window._view._view;v._iframeWindow.dispatchEvent(new Event('focus'));});await page.waitForTimeout(40);}
   const after=await page.evaluate(()=>{const v=window._view._view;return{cfi:v.flow.startCFI.toString(),offset:v.flow.startCFIOffset,height:v._iframe.offsetHeight,transform:v._iframe.style.transform,filter:getComputedStyle(v._iframe).filter};});
   assert.equal(after.cfi,stable.cfi);assert.equal(after.offset,stable.offset);assert.equal(after.height,stable.height);assert.equal(after.transform,'');assert.ok(after.filter==='none'||after.filter==='blur(0px)',JSON.stringify(after));
   console.log('PASS '+flow+': actual margin control and center/focus-return keep the CFI, offset and sharp layout');
   await open(flow);
   await page.evaluate(()=>{const v=window._view._view;v._options.deviceProfile={penOnly:false};v.setPenExclusive(false);v.setAppearance({lineHeight:1.8});});
   await page.waitForTimeout(120);
   for(const tool of ['pointer','highlight','underline']) {
    await page.evaluate(tool=>{const v=window._view._view;v._directHighlight.reset();v._options.onSelectAnnotations([]);v.setTool({type:tool,color:'#ffd400'});},tool);
    const target=await page.evaluate(()=>{
     const v=window._view._view,d=v._iframeDocument,offset=v._iframe.getBoundingClientRect();
     const nodes=d.createTreeWalker(d.body,NodeFilter.SHOW_TEXT);let n;
     while((n=nodes.nextNode())){if(!n.textContent.trim())continue;for(let i=0;i<n.length;i++){
      const r=d.createRange();r.setStart(n,i);r.setEnd(n,i+1);const b=r.getBoundingClientRect();
      if(/[a-z]/i.test(n.textContent[i])&&b.width>0&&b.top>260&&b.bottom<600&&b.left>60&&b.right<300){
       return {x:offset.left+b.left+b.width/2,y:offset.top+(b.top+b.bottom)/2,gap:offset.top+b.bottom+8,top:b.top};
      }
     }}throw Error('No lower EPUB text target');
    });
    await touch('touchStart',[target]);if(tool==='pointer')await page.waitForTimeout(560);
    for(const y of [target.y,target.gap,target.gap+3,target.y]){
     await touch('touchMove',[{x:target.x+40,y}]);await page.waitForTimeout(35);
     const geometry=await page.evaluate(()=>{const v=window._view._view,range=v._directHighlight.range||v.toDisplayedRange(v._previewAnnotation?.position);
      return range?{top:range.getBoundingClientRect().top,scroll:v._iframeWindow.scrollY}:null;});
     if(geometry)assert.ok(geometry.top>target.top-70,tool+': line gap must not jump to chapter start '+JSON.stringify(geometry));
    }
    await touch('touchEnd',[]);await page.waitForTimeout(80);
   }
   console.log('PASS '+flow+': drag and explicit highlight/underline tools retain a local anchor through white line gaps');

  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
