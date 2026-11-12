import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadingSamples, buildReadingModel, getReadingExclusions, getReadingBounds,
	buildReadingProfiles, resolveReadingBounds, getReadingFit, getReadingTextLines, rotateReadingBounds, getReadingMarginalia, getReadingTextBounds, localReadingPages } from '../../src/pdf/reading-layout.mjs';

const line = (text, rect) => ({ text, rect });
const body = [line('This is a complete line of ordinary text.', [.2, .2, .8, .22]),
	line('The next full line belongs to the page body.', [.2, .3, .8, .32]),
	line('Another ordinary line, with more content.', [.2, .5, .8, .52])];

test('an isolated changing running head and its rule are removed with a peer folio, keeping chapter headings',()=>{
    const head=line('Perspektiven auf eine Philosophie der Zukunft',[.2,.12,.86,.137]);
    const folio=line('7',[.96,.12,.98,.137]);
    const lines=[head,folio,...body];
    const model=buildReadingModel([{index:0,lines:body}]);
    const excluded=getReadingExclusions(lines,model,6);
    assert.ok(excluded.includes(head.rect));assert.ok(excluded.includes(folio.rect));
    const bounds=getReadingBounds(image([...lines.map(l=>l.rect),[.05,.15,.98,.152]]),lines,model,6);
    assert.ok(bounds[1]>.19,JSON.stringify(bounds));
    const chapter=line('Chapter 7. A new beginning',[.15,.12,.85,.137]);
    assert.ok(!getReadingExclusions([chapter,folio,...body],model,6).includes(chapter.rect));
    assert.ok(!getReadingExclusions([head,...body],model,6).includes(head.rect),'no folio and no repeated header lane remains ambiguous');
});

test('paired lower folios identify changing footer labels and their rule, keeping complete notes', () => {
	let pages = Array.from({ length: 8 }, (_, index) => ({ index, lines: [...body,
		line(`Text ${index % 3 + 1} · PDF ${index + 1} · ${index % 2 ? 'links' : 'rechts'}`, [.1,.947,.32,.958]),
		line(String(index + 1), [.88,.947,.9,.958])] }));
	let model = buildReadingModel(pages);
	for (let title of ['Text 5 · Anmerkungen', 'Inhaltsverzeichnis', 'Text 2 · PDF 14 · links']) {
		let footer = line(title, [.1,.947,.32,.958]);
		let note = line('61 A complete, genuine footnote including its final line.', [.1,.87,.9,.891]);
		let source = line('PDF-Seite 14 · rechts', [.1,.82,.4,.832]);
		let lines = [...body,source,note,footer,line('115',[.88,.947,.91,.958])];
		let exclusions = getReadingExclusions(lines,model,114);
		assert.ok(exclusions.includes(footer.rect));
		assert.ok(!exclusions.includes(note.rect) && !exclusions.includes(source.rect));
		let bounds = getReadingBounds(image([...lines.map(l=>l.rect),[.1,.934,.9,.936],[.1,.85,.4,.853]]),lines,model,114);
		assert.ok(bounds[3] >= .89 && bounds[3] < .90,JSON.stringify(bounds));
	}
});

test('a repeated note at the bottom stays even beside a folio and a model footer band', () => {
	let pages = Array.from({length:8},(_,index)=>({index,lines:[...body,
		line('Text 1 · PDF 2 · links',[.1,.947,.4,.958]),line(String(index+1),[.88,.947,.9,.958])]}));
	let model = buildReadingModel(pages);
	for (let text of ['1 A real footnote.', '* A real footnote.', 'Ibid.', 'Vgl. Plessner.']) {
		let note=line(text,[.1,.947,.4,.958]);
		assert.ok(!getReadingExclusions([...body,note,line('42',[.88,.947,.9,.958])],model).includes(note.rect),text);
	}
});

test('small repeated bottom text without a separate folio remains ambiguous content', () => {
	let note=line('Repeated bibliographic note.',[.1,.947,.6,.958]);
	let lines=[...body,note],model=buildReadingModel(Array.from({length:8},(_,index)=>({index,lines})));
	assert.ok(!getReadingExclusions(lines,model).includes(note.rect));
});

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

test('Roman A/B folios in either margin are optional while body and footnotes stay', () => {
	for (let text of ['BXLI', 'B XLII', 'A XIX / B XX', 'B XLIX', 'B L', 'A i']) {
		for (let rect of [[.01,.3,.075,.315],[.91,.3,.98,.315]]) {
			let reference = { ...line(text, rect), sideCandidate: true };
			let note = line('2 See Kant, B XLI, for the complete footnote.', [.2,.92,.8,.94]);
			let lines = [...body, reference, note], model = buildReadingModel([]);
			assert.deepEqual(getReadingMarginalia(lines,model,132), [rect], text);
			assert.deepEqual(getReadingExclusions(lines,model,132,{includeMarginalia:true}), [], text);
			let without = getReadingBounds(image(lines.map(l=>l.rect)),lines,model,132);
			let included = getReadingBounds(image(lines.map(l=>l.rect)),lines,model,132,{includeMarginalia:true});
			assert.ok(without[0]>.19 && without[2]<.81, text);
			assert.ok(included[2]-included[0] > without[2]-without[0]+.1,text);
			assert.ok(without[3]>=.938,'complete footnote remains');
		}
	}
});

test('a Roman marginal item is separated before the adjacent body line is merged', () => {
	let viewport={width:500,height:700,scale:1,transform:[1,0,0,-1,0,700]};
	let items=[{str:'BXLI',width:28.6,transform:[10,0,0,10,-.3,300]},
		{str:'man uns vorhersagte, daß bei der mindesten Nachforschung',width:400,transform:[14,0,0,14,38,300]}];
	let lines=getReadingTextLines({items},viewport);
	assert.equal(lines.length,2);
	let reference=lines.find(l=>l.text==='BXLI');assert.equal(reference.sideCandidate,true);
	assert.deepEqual(getReadingMarginalia(lines,buildReadingModel([]),132),[reference.rect]);
});

test('Roman folios joined into one OCR item split only at a detached same-baseline margin', () => {
	let ref=[...'BXLI'].map((c,i)=>({c,u:c,rect:[5+i*6,495,10+i*6,505],fontSize:10,baseline:500}));
	let chars=[...ref,...[...'alpha'].map((c,i)=>({c,u:c,rect:[100+i*60,495,150+i*60,510],fontSize:14,baseline:500}))];
	let item={str:'BXLI alpha',width:395,transform:[14,0,0,14,5,500],chars};
	let viewport={width:500,height:700,scale:1,transform:[1,0,0,-1,0,700]};
	let lines=getReadingTextLines({items:[item]},viewport);
	assert.equal(lines.length,2);assert.equal(lines.find(l=>l.text==='BXLI').sideCandidate,true);
	ref.forEach(c=>{c.baseline=508;});
	assert.equal(getReadingTextLines({items:[item]},viewport).length,1,'raised markers are not marginal folios');
});

test('ordinary Roman numerals and words resembling numerals are not edition references', () => {
	for (let text of ['bill','B ILL','B VX','B IL','B', 'See B XLI']) {
		let candidate=line(text,[.01,.3,.08,.315]);
		assert.deepEqual(getReadingMarginalia([...body,candidate],buildReadingModel([]),132),[],text);
	}
	let inside=line('B XLI',[.4,.3,.48,.315]);
	assert.deepEqual(getReadingMarginalia([...body,inside],buildReadingModel([]),132),[]);
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
	assert.equal(cropped.scale,ordinary.scale);
    assert.equal(ordinary.bounds[1],0);assert.equal(ordinary.bounds[3],1);
    assert.deepEqual(cropped.bounds,options.bounds);
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
	assert.deepEqual(getReadingMarginalia(lines,model,0),[...references,star].map(l=>l.rect));
});

test('isolated stars and dots on either margin follow Include/Exclude while body markers stay', () => {
    const marks = [line('*',[.04,.3,.055,.32]),line('·',[.94,.4,.96,.42]),line('•',[.94,.6,.96,.62])];
    const inline = [line('*',[.5,.4,.51,.42]),line('1 A footnote with an ordinary marker.',[.2,.91,.8,.93])];
    const lines = [...body,...marks,...inline], model = buildReadingModel([]);
    const excluded = getReadingExclusions(lines,model,0);
    for (const mark of marks) assert.ok(excluded.includes(mark.rect));
    for (const mark of inline) assert.ok(!excluded.includes(mark.rect));
    const included = getReadingExclusions(lines,model,0,{includeMarginalia:true});
    for (const mark of marks) assert.ok(!included.includes(mark.rect));
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
test('document samples cover front matter, middle and final sections in paired pages', () => {
	let indexes = getReadingSamples(499);
	assert.equal(indexes.length, 8);
	assert.ok(indexes[0] < 30 && indexes.at(-1) > 450);
    assert.ok(indexes.some(i => i > 150 && i < 350));
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

test('Kant standalone Roman margin folios are separated before body-word merging', () => {
    const viewport={width:500,height:700,scale:1,transform:[1,0,0,-1,0,700]};
    const content={items:[
        {str:'XVIII',width:28,transform:[9,0,0,9,2,300]},
        {str:'Erfahrungsbegriffe haben also zwar ihren Boden in der Natur',width:430,transform:[14,0,0,14,42,300]}
    ]};
    const lines=getReadingTextLines(content,viewport);
    assert.equal(lines.length,2);
    const reference=lines.find(l=>l.text==='XVIII');
    assert.equal(reference.sideCandidate,true);
    assert.ok(getReadingMarginalia(lines,buildReadingModel([]),10).includes(reference.rect));
    assert.equal(getReadingMarginalia(lines,buildReadingModel([]),10).length,1);
});

test('publisher download-watermark blocks and attached DOI are excluded, real DOI footnotes remain', () => {
    const watermark=[line('DOI https://doi.org/10.1234/book',[.3,.935,.7,.948]),
        line('Generated for Universitätsbibliothek on 2026-11-07',[.1,.951,.9,.964]),
        line('FOR PRIVATE USE ONLY | AUSSCHLIESSLICH ZUM PRIVATEN GEBRAUCH',[.1,.967,.9,.98])];
    const note=line('15 See DOI https://doi.org/10.1234/paper for the source.',[.2,.86,.8,.88]);
    const lines=[...body,note,...watermark];
    const exclusions=getReadingExclusions(lines,buildReadingModel([]),2);
    assert.ok(watermark.every(l=>exclusions.includes(l.rect)));
    assert.ok(!exclusions.includes(note.rect));
    const bounds=getReadingBounds(image(lines.map(l=>l.rect)),lines,buildReadingModel([]),2);
    assert.ok(bounds[3]>=.878 && bounds[3]<.89,JSON.stringify(bounds));
});


test('a detached numerical label beside a genuine footnote at the extreme bottom remains content',()=>{
    const label=line('3',[.1,.952,.12,.969]);
    const note=line('A complete final footnote line beside the detached label.',[.2,.952,.8,.974]);
    const exclusions=getReadingExclusions([...body,label,note],buildReadingModel([]),3);
    assert.ok(!exclusions.includes(label.rect));
    assert.ok(!exclusions.includes(note.rect));
});

test('Kant gutter folios beside a short heading use the page body column',()=>{
 for (const text of ['B XI','BXI','IV','I']) {
  const ref=line(text,[.01,.10,.07,.12]);
  assert.ok(getReadingMarginalia([...body,line('Einleitung',[.45,.10,.65,.12]),ref],buildReadingModel([]),0).includes(ref.rect),text);
 }
 const heading=line('IV',[.46,.1,.50,.12]);
 assert.ok(!getReadingMarginalia([...body,heading],buildReadingModel([]),0).includes(heading.rect));
});
test('a learned sequential bottom folio survives a tight gap while footnote text remains',()=>{
 const foot=line('5 See this legitimate footnote and its explanation',[.08,.86,.88,.90]);
 const pages=Array.from({length:4},(_,index)=>({index,lines:[...body,foot,line(String(238+index),[.90,.905,.94,.92])]}));
 const model=buildReadingModel(pages), ref=pages[2].lines.at(-1);
 const excluded=getReadingExclusions(pages[2].lines,model,2);
 assert.ok(excluded.includes(ref.rect));assert.ok(!excluded.includes(foot.rect));
});

test('sequential Roman folios in a tight lower band are distinct from section titles and footnotes',()=>{
 const roman=['XX','XXI','XXII','XXIII','XXIV','XXV'];
 const pages=roman.map((text,index)=>({index,lines:[...body,line('2 A genuine footnote remains intact.',[.2,.82,.8,.84]),
  line(text,[.47,.855,.53,.87])]}));
 const model=buildReadingModel(pages);
 assert.ok(model.folioBands.some(b=>b.kind===1));
 const exclusions=getReadingExclusions(pages[4].lines,model,4);
 assert.ok(exclusions.includes(pages[4].lines.at(-1).rect));
 assert.ok(!exclusions.includes(pages[4].lines.at(-2).rect));
 const title=line('XXIV',[.4,.3,.6,.34]);
 assert.ok(!getReadingExclusions([...body,title],model,4).includes(title.rect));
});
test('learned footer lanes above the old fixed edge keep nearby note lines',()=>{
 const pages=Array.from({length:6},(_,index)=>({index,lines:[...body,
  line('3 Complete footnote text with a source.',[.1,.75,.88,.77]),
  line('Book title',[.1,.885,.4,.897]),line(String(index+20),[.9,.885,.93,.897])]}));
 const model=buildReadingModel(pages), exclusions=getReadingExclusions(pages[2].lines,model,2);
 assert.ok(exclusions.includes(pages[2].lines.at(-2).rect));
 assert.ok(exclusions.includes(pages[2].lines.at(-1).rect));
 assert.ok(!exclusions.includes(pages[2].lines.at(-3).rect));
});
test('font-distinct running heads below the old top band require learned position and whitespace',()=>{
 const main=body.map(l=>({...l,font:'Body'}));
 const header=line('Running chapter title',[.2,.19,.7,.208]);header.font='Header';
 const lowerBody=main.map(l=>({...l,rect:[l.rect[0],l.rect[1]+.08,l.rect[2],l.rect[3]+.08]}));
 const lines=[header,...lowerBody];const model=buildReadingModel(Array.from({length:6},(_,index)=>({index,lines})));
 assert.ok(getReadingExclusions(lines,model,1).includes(header.rect));
 const title={...header,text:'A real chapter heading',rect:[.2,.19,.7,.24]};
 assert.ok(!getReadingExclusions([title,...lowerBody],model,1).includes(title.rect));
});


test('local evidence stays within a chapter even when alternating running heads have different labels',()=>{
 const pages=Array.from({length:9},(_,index)=>({index,lines:[...body,
  line(index%2 ? (index<5 ? 'Chapter One':'Chapter Two') : 'Book title',[.2,.04,.7,.056])]}));
 assert.ok(localReadingPages(pages,7).every(p=>p.index>3));
 assert.ok(localReadingPages(pages,1).every(p=>p.index<5));
});
test('text-only geometry applies exclusions and keeps the complete final footnote',()=>{
 const note=line('9 A complete final note, not a running footer.',[.15,.9,.85,.92]);
 const header=line('Repeated running head',[.2,.04,.7,.055]);
 const lines=[header,...body,note];
 const model=buildReadingModel(Array.from({length:6},(_,index)=>({index,lines})));
 const bounds=getReadingTextBounds(lines,model,2);
 assert.ok(bounds[1]>=.19 && bounds[1]<.21);
 assert.ok(bounds[3]>=.92);
});


test('normalized repeated body lines within the expanded header band remain content',()=>{
 const main=Array.from({length:25},(_,row)=>line('Page 09, line '+(row+1)+': this is ordinary running body text.',[.2,.15+row*.018,.8,.16+row*.018]));
 const lines=[line('A small repeated running head',[.2,.04,.7,.048]),...main];
 const model=buildReadingModel(Array.from({length:6},(_,index)=>({index,lines})));
 const excluded=getReadingExclusions(lines,model,2);
 assert.ok(excluded.includes(lines[0].rect));
 assert.ok(main.every(l=>!excluded.includes(l.rect)));
});


test('continuously changing running titles do not destroy usable local geometric evidence',()=>{
 const pages=Array.from({length:9},(_,index)=>({index,lines:[...body,line('Author: unique title '+index,[.2,.04,.7,.056])]}));
 assert.equal(localReadingPages(pages,4).length,9);
});


test('Text fitting preserves the full non-fit axis in both directions', () => {
 const options={reference:'content',margin:0,bounds:[.2,.1,.8,.85],width:600,height:800,pageWidth:600,pageHeight:1000};
 const width=getReadingFit({...options,mode:'width'}),height=getReadingFit({...options,mode:'height'});
 assert.deepEqual(width.bounds,[.2,0,.8,1]);
 assert.deepEqual(height.bounds,[0,.1,1,.85]);
 assert.deepEqual(getReadingFit({...options,mode:'height',reference:'cropped-content'}).bounds,options.bounds);
});
test('a small footnote star beside footnote text remains readable', () => {
 const star=line('*',[.15,.91,.16,.922]),footnote=line('A complete, smaller footnote remains intact.',[.2,.91,.8,.922]);
 assert.ok(!getReadingExclusions([...body,star,footnote],buildReadingModel([]),0).includes(star.rect));
});


test('a zero-advance gutter star is still extracted as a separate marginal span', () => {
 const lines=getReadingTextLines({items:[{str:'*',width:0,transform:[10,0,0,10,570,500]}]},
  {width:600,height:800,scale:1,transform:[1,0,0,-1,0,800]});
 assert.equal(lines.length,1);assert.equal(lines[0].sideCandidate,true);assert.ok(lines[0].rect[2]>lines[0].rect[0]);
});


test('merged OCR margin stars split without shrinking equal-font body text', () => {
 const chars=[...('alpha')].map((u,i)=>({u,rect:[120+i*7,300,126+i*7,310],fontSize:10,baseline:300}));
 chars.push({u:'*',rect:[570,300,576,310],fontSize:10,baseline:300});
 const viewport={width:600,height:800,scale:1,transform:[1,0,0,-1,0,800]};
 const item={str:'alpha *',width:456,transform:[10,0,0,10,120,300],chars};
 const lines=getReadingTextLines({items:[item]},viewport);
 assert.equal(lines.length,2);assert.equal(lines.find(l=>l.text==='*').sideCandidate,true);
 chars.at(-1).baseline=305;
 assert.equal(getReadingTextLines({items:[item]},viewport).length,1,'superscript marker stays with its text');
});
test('a large title period is not misidentified as a tiny gutter dot', () => {
 const dot=line('.',[.94,.25,.96,.31]);
 const title=line('A large, complete and important chapter title',[.2,.25,.92,.31]);
 assert.ok(!getReadingExclusions([...body,title,dot],buildReadingModel([]),0).includes(dot.rect));
});
