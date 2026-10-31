import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadingSamples, buildReadingModel, getReadingExclusions, getReadingBounds,
	buildReadingProfiles, resolveReadingBounds, getReadingFit, getReadingTextLines, rotateReadingBounds, getReadingMarginalia } from '../../src/pdf/reading-layout.mjs';

const line = (text, rect) => ({ text, rect });
const body = [line('This is a complete line of ordinary text.', [.2, .2, .8, .22]),
	line('The next full line belongs to the page body.', [.2, .3, .8, .32]),
	line('Another ordinary line, with more content.', [.2, .5, .8, .52])];

test('vector separators in excluded running-head bands do not hold the upper crop edge', () => {
	let header = line('Author or chapter title', [.22,.045,.65,.058]);
	let folio = line('14', [.12,.045,.15,.059]);
	let lines = [header, folio, ...body];
	let model = buildReadingModel(Array.from({length:8},(_,index)=>({index,lines})));
	let pixels = image([...lines.map(l=>l.rect), [.18,.049,.21,.052]]);
	let b = getReadingBounds(pixels, lines, model, 1);
	assert.ok(b[1] >= .198, JSON.stringify(b));
});

test('optional edition and line columns are independent of footnotes and running heads', () => {
	let references = [line('B 288',[.9,.3,.96,.315]),line('[372]',[.9,.5,.96,.515]),
		line('5',[.11,.21,.13,.225]),line('10',[.11,.4,.13,.415]),line('15',[.11,.7,.13,.715])];
	let footnote = line('1 This is an ordinary footnote.',[.2,.92,.75,.94]);
	let header = line('A repeated running title',[.2,.04,.7,.055]);
	let lines = [header,...body,...references,footnote];
	let model = buildReadingModel(Array.from({length:8},(_,index)=>({index,lines})));
	let pixels = image(lines.map(l=>l.rect));
	let without = getReadingBounds(pixels,lines,model,0), withRefs = getReadingBounds(pixels,lines,model,0,{includeMarginalia:true});
	assert.ok(without[0]>.19 && without[2]<.81,JSON.stringify(without));
	assert.ok(withRefs[0]<.12 && withRefs[2]>.95,JSON.stringify(withRefs));
	for(let b of [without,withRefs]) assert.ok(b[1]>.19 && b[3]>=.938,JSON.stringify(b));
});

test('a smaller line number inside one OCR item is split by glyph geometry; superscripts stay', () => {
	let chars = [...'alpha'].map((c,i)=>({c,u:c,rect:[100+i*60,495,150+i*60,510],fontSize:14,baseline:500}));
	chars.push({c:'5',u:'5',rect:[465,498,472,508],fontSize:10,baseline:500});
	let item = {str:'alpha 5',width:372,transform:[14,0,0,14,100,500],chars};
	let viewport = {width:500,height:700,scale:1,transform:[1,0,0,-1,0,700]};
	let lines = getReadingTextLines({items:[item]},viewport);
	assert.equal(lines.length,2);assert.equal(lines.find(l=>l.text==='5').sideCandidate,true);
	assert.ok(lines.find(l=>l.text==='alpha').rect[2]<.81);
	chars.at(-1).baseline = 508;
	assert.equal(getReadingTextLines({items:[item]},viewport).length,1,'superscript footnote marker');
});

test('cropped text width uses the same width scale while taller pages remain scrollable', () => {
	let options = {mode:'width',reference:'content',margin:.01,bounds:[.2,.1,.8,.95],width:600,height:800,pageWidth:600,pageHeight:1200};
	let ordinary = getReadingFit(options), cropped = getReadingFit({...options,reference:'cropped-content'});
	assert.deepEqual(cropped,ordinary);
	assert.equal(cropped.scale,getReadingFit({...options,height:1000,reference:'cropped-content'}).scale);
	assert.ok((cropped.bounds[3]-cropped.bounds[1])*options.pageHeight*cropped.scale>options.height);
});

test('detached footnote labels and explicitly included outer editions are kept', () => {
	let notes = [.68,.8,.92].flatMap((y,i)=>[line(String(i+1),[.1,y,.12,y+.015]),
		line('An ordinary, complete footnote reference.',[.2,y,.8,y+.02])]);
	let lines = [...body,...notes];
	let excluded = getReadingExclusions(lines);
	assert.ok(notes.every(n=>!excluded.includes(n.rect)));
	let edition = {...line('B 288',[.9,.07,.96,.085]),sideCandidate:true};
	let model = {repeated:new Set(['b #']),headerBands:[]};
	assert.ok(!getReadingExclusions([edition,...body],model,0,{includeMarginalia:true}).includes(edition.rect));
});

test('visible margin masks contain only excluded reference boxes, never footnotes or their markers', () => {
	let references=[line('B 288',[.9,.3,.96,.315]),line('[372]',[.9,.5,.96,.515])];
	let star=line('*',[.94,.2,.96,.22]);
	let footnote=line('1 A complete footnote.',[.2,.91,.8,.93]);
	let lines=[...body,...references,star,footnote],model=buildReadingModel([]);
	assert.deepEqual(getReadingMarginalia(lines,model,0),references.map(l=>l.rect));
});
function image(rectangles) {
	let width = 500, height = 700, data = new Uint8ClampedArray(width * height * 4).fill(255);
	for (let [x0, y0, x1, y1] of rectangles) {
		for (let y = Math.round(y0 * height); y < Math.round(y1 * height); y++) {
			for (let x = Math.round(x0 * width); x < Math.round(x1 * width); x++) {
				let i = (y * width + x) * 4; data[i] = data[i + 1] = data[i + 2] = 0;
			}
		}
	}
	return { width, height, data };
}
test('middle samples contain four adjacent odd/even pairs, excluding covers', () => {
	let indexes = getReadingSamples(499);
	assert.equal(indexes.length, 8);
	assert.ok(indexes.every(i => i >= 220 && i <= 278));
	for (let i = 0; i < indexes.length; i += 2) {
		assert.equal(indexes[i] % 2, 0); assert.equal(indexes[i + 1], indexes[i] + 1);
	}
	assert.deepEqual(getReadingSamples(3), [0, 1, 2]);
});
test('all sample indexes are valid and include both parities in short documents', () => {
	for (let n = 1; n < 80; n++) {
		let a = getReadingSamples(n); assert.ok(a.length <= 8);
		assert.ok(a.every(i => i >= 0 && i < n));
		if (n > 1) { assert.ok(a.some(i => i % 2)); assert.ok(a.some(i => i % 2 === 0)); }
	}
});
test('short, repeated and small footnotes remain content, including the rule', () => {
	let footnote = line('1 Ibid.', [.2, .91, .29, .92]);
	let lines = [...body, footnote];
	let model = buildReadingModel(Array.from({ length: 8 }, (_, index) => ({ index, lines })));
	assert.ok(!getReadingExclusions(lines, model).includes(footnote.rect));
	let bounds = getReadingBounds(image([...body.map(l => l.rect), [.2, .89, .38, .893], footnote.rect]), lines, model);
	assert.ok(bounds[3] >= .918, bounds);
});
test('download stamp, link and page number are removed below a real footnote', () => {
	let note = line('1 This footnote must stay, including its complete reference.', [.2, .86, .78, .88]);
	let stamp = line('Downloaded from JSTOR at 2026-10-30', [.1, .95, .9, .96]);
	let link = line('https://www.jstor.org/stable/12345', [.2, .97, .8, .98]);
	let number = line('27', [.49, .985, .51, .995]);
	let lines = [...body, note, stamp, link, number];
	let bounds = getReadingBounds(image(lines.map(l => l.rect)), lines, buildReadingModel([]));
	assert.ok(bounds[3] >= .878 && bounds[3] < .9, bounds);
	assert.equal(getReadingExclusions(lines).length, 3);
});
test('repeated long footnotes and JSTOR citations at the extreme bottom remain content', () => {
	let note = line('1 A repeated footnote with a JSTOR reference.', [.2,.96,.8,.975]);
	let url = line('https://www.jstor.org/stable/12345', [.2,.98,.7,.995]);
	let lines = [...body,note,url];
	let model = buildReadingModel(Array.from({length:8},(_,index)=>({index,lines})));
	assert.equal(getReadingExclusions(lines,model).length,0);
	assert.ok(getReadingBounds(image(lines.map(l=>l.rect)),lines,model)[3]>.99);
});
test('running headers are detected across pages; first body lines remain', () => {
	let pages = Array.from({ length: 8 }, (_, index) => ({ index,
		lines: [line('Author: A philosophical essay', [.2, .04, .8, .055]), ...body] }));
	let model = buildReadingModel(pages);
	assert.equal(getReadingExclusions(pages[0].lines, model).length, 1);
	let bounds = getReadingBounds(image(pages[0].lines.map(l => l.rect)), pages[0].lines, model);
	assert.ok(bounds[1] >= .19, bounds);
});
test('an unrepeated heading is retained when its role is ambiguous', () => {
	let title = line('Chapter I', [.2, .11, .8, .14]);
	assert.equal(getReadingExclusions([title, ...body]).length, 0);
});
test('changing running titles at a stable header position are excluded', () => {
	let pages = Array.from({ length: 8 }, (_, index) => ({ index,
		lines: [line('A different author or chapter '+index, [.2, .045, .65, .057]), ...body] }));
	let model = buildReadingModel(pages);
	assert.equal(getReadingExclusions(pages[0].lines, model).length, 1);
});
test('a rule underneath an excluded header is excluded without trimming footnote rules', () => {
	let header = line('A repeated author', [.2, .04, .8, .055]);
	let lines = [header, ...body, line('1 Short note', [.2, .9, .35, .915])];
	let model = buildReadingModel(Array.from({ length: 8 }, (_, index) => ({index,lines})));
	let bounds = getReadingBounds(image([...lines.map(l=>l.rect), [.2,.075,.8,.078], [.2,.88,.4,.883]]),lines,model);
	assert.ok(bounds[1] >= .19 && bounds[3] >= .91, bounds);
});
test('natural reading bounds transform exactly with display rotation', () => {
	let b = [.2,.1,.8,.9];
	for(let angle of [0,90,180,270]) {
		let back = rotateReadingBounds(rotateReadingBounds(b,angle),-angle);
		assert.ok(back.every((v,i)=>Math.abs(v-b[i])<1e-9));
	}
});
test('isolated line-number column is excluded without excluding body numbers', () => {
	let nums = [line('5', [.11, .2, .125, .22]), line('10', [.11, .3, .125, .32]), line('15', [.11, .5, .125, .52])];
	assert.equal(getReadingExclusions([...nums, ...body]).length, 3);
	assert.equal(getReadingExclusions([...body, line('2026', [.4, .6, .45, .62])]).length, 0);
});
test('edition references in a separate outer column are excluded', () => {
	let ref = line('AA 5:123', [.85, .3, .94, .32]);
	assert.deepEqual(getReadingExclusions([...body, ref]), [ref.rect]);
	let citation = line('AA 5:123', [.3, .87, .4, .89]);
	assert.equal(getReadingExclusions([...body, citation]).length, 0);
});
test('odd/even profiles retain different centers and a common reading width', () => {
	let pages = Array.from({ length: 8 }, (_, index) => ({ index,
		bounds: index % 2 ? [.12, .13, .76, .9] : [.24, .12, .88, .91] }));
	let model = buildReadingProfiles(pages);
	let a = resolveReadingBounds(pages[0].bounds, 20, model), b = resolveReadingBounds(pages[1].bounds, 21, model);
	assert.ok(Math.abs((a[2] - a[0]) - (b[2] - b[0])) < 1e-9);
	assert.ok(a[0] - b[0] > .11);
});
test('a wider table and deeper footnote expand the sampled frame', () => {
	let model = buildReadingProfiles([{ index: 0, bounds: [.2, .15, .8, .85] }]);
	let actual = [.08, .1, .92, .97];
	assert.deepEqual(resolveReadingBounds(actual, 2, model), actual);
});
test('blank pages have no invented text bounds', () => {
	assert.equal(getReadingBounds(image([]), [], buildReadingModel([])), null);
});
const options = { mode: 'width', reference: 'content', margin: .01, bounds: [.2, .15, .8, .9],
	width: 600, height: 800, pageWidth: 800, pageHeight: 1000 };
test('width fitting is independent of page height', () => {
	assert.equal(getReadingFit(options).scale, getReadingFit({ ...options, pageHeight: 9000 }).scale);
});
test('height fitting is independent of page width', () => {
	let a = { ...options, mode: 'height' };
	assert.equal(getReadingFit(a).scale, getReadingFit({ ...a, pageWidth: 9000 }).scale);
});
test('content fitting fits the complete content in both dimensions', () => {
	let fit = getReadingFit({ ...options, mode: 'content' });
	assert.ok(fit.scale * .6 * 800 + fit.pad * 2 <= 600 + 1e-9);
	assert.ok(fit.scale * .75 * 1000 + fit.pad * 2 <= 800 + 1e-9);
});
test('page reference includes the physical paper and ignores content margins', () => {
	let fit = getReadingFit({ ...options, reference: 'page' });
	assert.equal(fit.scale, .75); assert.equal(fit.pad, 0);
	assert.deepEqual(fit.bounds, [0, 0, 1, 1]);
});
test('larger margins lower the zoom without changing detected bounds', () => {
	assert.ok(getReadingFit({ ...options, margin: .08 }).scale < getReadingFit(options).scale);
});
test('PDF text positions respect the actual viewport transform and font ascent', () => {
	let lines = getReadingTextLines({ items: [{ str: 'Body text', width: 100, fontName: 'f', transform: [12, 0, 0, 12, 120, 600] }],
		styles: { f: { ascent: .8, descent: -.2 } } }, { width: 600, height: 800, scale: 1, transform: [1, 0, 0, -1, 0, 800] });
	assert.equal(lines.length, 1); assert.ok(Math.abs(lines[0].rect[0] - .2) < 1e-9);
	assert.ok(Math.abs(lines[0].rect[1] - 190.4 / 800) < 1e-9);
});

test('image-only gray paper crops text bands and retains the footnote', () => {
 let rects=Array.from({length:20},(_,i)=>[.2,.15+i*.03,.8,.16+i*.03]);rects.push([.2,.91,.55,.925]);
 let scan=image(rects);for(let i=0;i<scan.data.length;i+=4)if(scan.data[i]===255)scan.data[i]=scan.data[i+1]=scan.data[i+2]=215;
 let b=getReadingBounds(scan,[],buildReadingModel([]));
 assert.ok(b[0]>.18&&b[2]<.82&&b[1]>.13&&b[3]>.92&&b[3]<.94,JSON.stringify(b));
});
test('gray photograph with no separate text bands keeps its outer frame', () => {
 let scan=image([[.25,.2,.75,.8]]);for(let i=0;i<scan.data.length;i+=4)if(scan.data[i]===255)scan.data[i]=scan.data[i+1]=scan.data[i+2]=215;
 assert.deepEqual(getReadingBounds(scan,[],buildReadingModel([])),[0,0,1,1]);
});
test('full color image is not treated as gray scan paper', () => {
 let scan=image([]);for(let i=0;i<scan.data.length;i+=4){scan.data[i]=180;scan.data[i+1]=210;scan.data[i+2]=170;}
 assert.deepEqual(getReadingBounds(scan,[],buildReadingModel([])),[0,0,1,1]);
});


const chapterWords = ['Being', 'Time', 'Reason', 'Nature', 'Mind', 'Life', 'History', 'Culture'];
function pairedHeaders(index) {
 const y = index % 2 ? .10 : .04;
 return [line(chapterWords[index] + ' and its interpretation', [.2,y,.7,y+.012]),
  line('Research on ' + chapterWords[7-index], [.2,y+.02,.65,y+.032])];
}
test('two-line changing running headers are recognized per parity with chapter-opening outliers', () => {
 const pages = Array.from({length:8}, (_,index)=>({index,lines:[...(index<2 ? [line('An actual chapter heading', [.2,.04,.8,.068])] : pairedHeaders(index)),...body]}));
 const model = buildReadingModel(pages);
 for(const index of [2,3,4,5,6,7]) {
  const excluded = getReadingExclusions(pages[index].lines,model,index);
  assert.ok(pairedHeaders(index).every(h=>excluded.some(r=>JSON.stringify(r)===JSON.stringify(h.rect))),String(index));
 }
 assert.ok(model.headerBands.some(b=>b.parity===0));assert.ok(model.headerBands.some(b=>b.parity===1));
 assert.equal(getReadingExclusions(pages[0].lines,model,0).length,0);
});
test('a small running header below fifteen percent is excluded while footnotes remain', () => {
 const header=line('Edition and institutional metadata', [.2,.16,.8,.172]);
 const lines=[header,...body,line('1 A real footnote.', [.2,.91,.6,.928])];
 const model=buildReadingModel(Array.from({length:8},(_,index)=>({index,lines})));
 const b=getReadingBounds(image(lines.map(l=>l.rect)),lines,model,2);
 assert.ok(b[1]>=.198&&b[3]>.925,JSON.stringify(b));
});
test('a larger chapter title at a known running-header position stays in the content', () => {
 const model=buildReadingModel(Array.from({length:8},(_,index)=>({index,lines:[line('Running title', [.2,.04,.8,.052]),...body]})));
 const heading=line('A genuine chapter title', [.2,.04,.8,.063]);
 assert.ok(!getReadingExclusions([heading,...body],model,2).includes(heading.rect));
});
test('ordinary first paragraphs are not learned as lower headers from position alone', () => {
 const pages=Array.from({length:8},(_,index)=>({index,lines:[
  line(chapterWords[index]+' begins an ordinary body paragraph.', [.2,.14,.8,.16]),
  line('The argument about '+chapterWords[index]+' continues here.', [.2,.165,.8,.185]),...body]}));
 const model=buildReadingModel(pages),p=pages[2];
 assert.ok(!getReadingExclusions(p.lines,model,2).includes(p.lines[0].rect));
 const b=getReadingBounds(image(p.lines.map(l=>l.rect)),p.lines,model,2);assert.ok(b[1]<=.141,JSON.stringify(b));
});
test('two-line headers do not remove a genuine section heading below them', () => {
 const pages=Array.from({length:8},(_,index)=>({index,lines:[...pairedHeaders(index),...body]}));
 const model=buildReadingModel(pages),heading=line('A real section title', [.2,.15,.8,.18]);
 const lines=[...pairedHeaders(2),heading,...body],b=getReadingBounds(image(lines.map(l=>l.rect)),lines,model,2);
 assert.ok(b[1]>=.148&&b[1]<=.152,JSON.stringify(b));
});


test('a short first body paragraph near the top is not mistaken for a running header', () => {
 const pages=Array.from({length:8},(_,index)=>({index,lines:[
  line('The '+chapterWords[index]+' argument begins here.', [.2,.105,.8,.125]),
  line('A short continuation about '+chapterWords[index]+'.', [.2,.13,.8,.15]),...body]}));
 const model=buildReadingModel(pages);
 for(const p of pages) assert.ok(!getReadingExclusions(p.lines,model,p.index).includes(p.lines[0].rect));
});


test('header separation tolerates body-font boxes that overlap adjacent text lines', () => {
 const pages=Array.from({length:8},(_,index)=>({index,lines:[
  line(chapterWords[index]+' as a running title', [.14,.06458,.50,.07726]),
  line(String(249+index), [.814,.06171,.846,.07802]),
  ...Array.from({length:20},(_,i)=>line('Ordinary body text with a tall font bounding box, row '+i, [.14,.09918+i*.02035,.846,.12294+i*.02035]))]}));
 const model=buildReadingModel(pages),p=pages[2],excluded=getReadingExclusions(p.lines,model,2);
 assert.ok(excluded.includes(p.lines[0].rect));assert.ok(!excluded.includes(p.lines[2].rect));
 const b=getReadingBounds(image(p.lines.map(l=>l.rect)),p.lines,model,2);assert.ok(b[1]>.097&&b[1]<.102,JSON.stringify(b));
});
