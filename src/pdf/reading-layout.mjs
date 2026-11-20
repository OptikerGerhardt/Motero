import { compactReadingImage } from './reading-image.mjs';
import { getInkBounds } from './content-fit.mjs';
import { analyzeTextScan } from './reading-scan-paper.mjs';
import { headerStrip } from './reading-raster-refinement.mjs';

// PDF page indexes, not printed folios. Always sample adjacent odd/even pairs.
export function getReadingSamples(count) {
	if (count <= 8) return Array.from({ length: count }, (_, i) => i);
    // Spread paired samples across front matter, body and final sections.
    let indexes = new Set();
    for (const fraction of [0.03, 0.33, 0.66, 0.95]) {
        const start = Math.max(0, Math.min(count - 2, Math.round(count * fraction / 2) * 2));
        indexes.add(start); indexes.add(start + 1);
    }
	return [...indexes].sort((a, b) => a - b);
}

const clamp = n => Math.max(0, Math.min(1, n));
const normalize = text => text.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
const pageNumber = text => /^(?:[-–—]?\s*)?(?:\d{1,5}|[ivxlcdm]{1,8})(?:\s*[-–—]?)$/i.test(text.trim());
const downloadStamp = text => {
    const value = text.trim();
    // A numbered/source-marked footnote may discuss copyright or downloads.
    // Keywords inside that note are not evidence of a publisher stamp.
    if (/^(?:\d+[.)]?\s|[*†‡]\s)/u.test(value)) return false;
    return /^(?:(?:this content )?downloaded\s+(?:from|by|on)|(?:accessed|retrieved)\s+(?:on|from)|all use subject to|generated for\b|for private use only\b|ausschlie(?:ß|ss)lich zum privaten gebrauch\b)|\b(?:generiert durch|heruntergeladen (?:am|von)|urheberrechtlich geschützter inhalt)\b/i.test(value);
};
// A/B folios can be Roman in introductions (Kant: B XLI) and Arabic in
// the main text. Require canonical Roman numerals so ordinary words such as
// 'bill' do not become references. Geometry below still requires a margin column.
const romanFolio = '(?=[MDCLXVI])M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})';
const editionFolio = '(?:\\d{1,4}|' + romanFolio + ')';
const abReference = '[AB]\\s*' + editionFolio + '(?:\\s*[/–-]\\s*[AB]?\\s*' + editionFolio + ')?';
const editionPattern = new RegExp('^(?:(?:(?:AA|Ak\\.?)\\s*)?(?:[IVXLC]+|\\d{1,3})\\s*[:,.]\\s*\\d{1,4}|'
	+ abReference + '|\\[\\s*\\d{1,4}\\s*\\])$', 'i');
const editionReference = text => editionPattern.test(text.trim());
const romanReference = text => /^[IVXLCDM]{1,9}$/.test(text.trim())
    && new RegExp('^' + romanFolio + '$').test(text.trim());
const marginalSymbol = text => /^[*∗⋆✱✳✻✽•·∙⋅.†‡]+$/u.test(text.trim());
const marginalReference = text => editionReference(text) || romanReference(text);

function splitOuterReference(item, viewport) {
	if (!item.chars?.length) return null;
	let text = item.str.trim(), pattern = '(?:' + abReference + '|\\d{1,3}|\\[\\d{1,4}\\]|[*∗⋆✱✳✻✽•·∙⋅.†‡]+)';
	let tail = text.match(new RegExp('^(.*\\S)\\s+(' + pattern + ')$', 'i'))
        || text.match(/^(.*[^\s*∗⋆✱✳✻✽•·∙⋅.†‡])([*∗⋆✱✳✻✽•·∙⋅†‡]+)$/u);
	let head = !tail && text.match(new RegExp('^(' + pattern + ')\\s+(\\S.*)$', 'i'));
	if (!tail && !head) return null;
	let refText = tail ? tail[2] : head[1], bodyText = tail ? tail[1] : head[2];
	let count = [...refText.replace(/\s/g, '')].length;
	let chars = item.chars.filter(c => (c.u || c.c)?.trim() && c.rect?.length === 4);
	if (chars.length <= count) return null;
	let ref = tail ? chars.slice(-count) : chars.slice(0, count);
	let body = tail ? chars.slice(0, -count) : chars.slice(count);
	if (ref.map(c => c.u || c.c).join('') !== refText.replace(/\s/g, '')) return null;
	let bounds = group => {
		let points = group.flatMap(c => [[c.rect[0], c.rect[1]], [c.rect[2], c.rect[3]]])
			.map(([x, y]) => [viewport.transform[0] * x + viewport.transform[2] * y + viewport.transform[4],
				viewport.transform[1] * x + viewport.transform[3] * y + viewport.transform[5]]);
		return [clamp(Math.min(...points.map(p => p[0])) / viewport.width), clamp(Math.min(...points.map(p => p[1])) / viewport.height),
			clamp(Math.max(...points.map(p => p[0])) / viewport.width), clamp(Math.max(...points.map(p => p[1])) / viewport.height)];
	};
	let r = bounds(ref), b = bounds(body), height = Math.max(...body.map(c => c.fontSize || 0));
	let baseline = body.at(tail ? -1 : 0).baseline;
	// Same baseline and a separate outer position distinguish line references
	// from superscript footnote markers, even in a single merged OCR item.
	if (!(r[2] < 0.14 || r[0] > 0.86) || r[2] - r[0] > 0.1
		|| !Number.isFinite(baseline) || !ref.every(c => Math.abs(c.baseline - baseline) < height * 0.2)
		|| !editionReference(refText) && !romanReference(refText) && !marginalSymbol(refText) && !ref.every(c => c.fontSize < height * 0.9)
		|| Math.max(r[0] - b[2], b[0] - r[2]) < 0.005) return null;
	return [{ text: bodyText, rect: b, vertical: false, sideCandidate: false },
		{ text: refText, rect: r, vertical: false, sideCandidate: true }];
}

// Use the rendered viewport transform, including PDF CropBox and rotation.
export function getReadingTextLines(content, viewport) {
	let v = viewport.transform, spans = [];
	for (let item of content?.items || []) {
		if (!item.str?.trim() || !item.transform || !item.width && !marginalSymbol(item.str)) continue;
		let split = splitOuterReference(item, viewport);
		if (split) { spans.push(...split); continue; }
		let t = item.transform;
		let a = v[0] * t[0] + v[2] * t[1], b = v[1] * t[0] + v[3] * t[1];
		let c = v[0] * t[2] + v[2] * t[3], d = v[1] * t[2] + v[3] * t[3];
		let x = v[0] * t[4] + v[2] * t[5] + v[4], y = v[1] * t[4] + v[3] * t[5] + v[5];
		let length = Math.hypot(a, b);
		if (!length) continue;
		let w = (item.width || Math.hypot(t[0],t[1]) * .5 * item.str.trim().length) * viewport.scale, dx = a / length * w, dy = b / length * w;
		let style = content.styles?.[item.fontName] || {};
		let ascent = Number.isFinite(style.ascent) ? style.ascent : 0.85;
		let descent = Number.isFinite(style.descent) ? style.descent : -0.15;
		let xs = [x + c * ascent, x + dx + c * ascent, x + c * descent, x + dx + c * descent];
		let ys = [y + d * ascent, y + dy + d * ascent, y + d * descent, y + dy + d * descent];
		let rect = [clamp(Math.min(...xs) / viewport.width), clamp(Math.min(...ys) / viewport.height),
			clamp(Math.max(...xs) / viewport.width), clamp(Math.max(...ys) / viewport.height)];
		// Vertical/rotated marginal text is kept unless it is a known stamp.
		let text = item.str.trim();
		// OCR often places a line number directly against the final word's text
		// box. Keep outer reference spans separate before merging body words.
		let sideCandidate = rect[2] - rect[0] < 0.1 && (marginalSymbol(text)
            || (rect[2] < 0.20 || rect[0] > 0.80) && (/^\d{1,3}$/.test(text) || marginalReference(text)));
		spans.push({ text, rect, font: item.fontName || style.fontFamily || null, vertical: Math.abs(dy) > Math.abs(dx), sideCandidate });
	}
    // PDF text extraction can split “B XI” into independent items. Combine only
    // short, horizontally adjacent gutter spans before ordinary row merging.
    const consumed = new Set();
    for (const a of spans) {
        if (!/^[AB]$/i.test(a.text) || !(a.rect[2] < .2 || a.rect[0] > .8)) continue;
        const b = spans.find(b => b !== a && !consumed.has(b) && romanReference(b.text)
            && b.rect[0] >= a.rect[2] - .002 && b.rect[0] - a.rect[2] < .025
            && Math.abs((a.rect[1]+a.rect[3]-b.rect[1]-b.rect[3])/2) < Math.max(a.rect[3]-a.rect[1],b.rect[3]-b.rect[1]) * .45);
        if (!b) continue;
        a.text += ' ' + b.text;
        a.rect = [a.rect[0],Math.min(a.rect[1],b.rect[1]),b.rect[2],Math.max(a.rect[3],b.rect[3])];
        a.sideCandidate = true; consumed.add(b);
    }
    spans = spans.filter(s => !consumed.has(s));
	spans.sort((a, b) => a.rect[1] - b.rect[1] || a.rect[0] - b.rect[0]);
	let lines = [];
	for (let span of spans) {
		let [x0, y0, x1, y1] = span.rect;
		let row = [...lines].reverse().find(line => !span.sideCandidate && !line.sideCandidate && !span.vertical && !line.vertical
			&& Math.abs((line.rect[1] + line.rect[3] - y0 - y1) / 2) < Math.max(y1 - y0, line.rect[3] - line.rect[1]) * 0.4
			&& x0 >= line.rect[2] - 0.005 && x0 - line.rect[2] < Math.max(0.025, (y1 - y0) * 2));
		if (row) {
			row.text += ' ' + span.text;
            if (row.font !== span.font) row.font = null;
			row.rect = [Math.min(row.rect[0], x0), Math.min(row.rect[1], y0), Math.max(row.rect[2], x1), Math.max(row.rect[3], y1)];
		}
		else lines.push({ ...span, rect: [...span.rect] });
	}
	return lines;
}

function isOuter(line) {
	let [x0, y0, x1, y1] = line.rect;
	return y1 < 0.18 || y0 > 0.82 || x1 < 0.13 || x0 > 0.87;
}

function bodyLineHeight(lines) {
    // Footnote-heavy pages must not redefine the running prose as small print.
    // Prefer an early group of at least three matching long prose lines;
    // isolated titles and headers cannot establish that group on their own.
    const prose = lines.filter(l=>!l.vertical && l.text.length>30 && l.rect[2]-l.rect[0]>.35
        && l.rect[1]>.12 && l.rect[3]<.65).sort((a,b)=>a.rect[1]-b.rect[1]);
    for (const first of prose) {
        const height=first.rect[3]-first.rect[1];
        const group=prose.filter(l=>(!first.font || !l.font || first.font===l.font)
            && Math.abs(l.rect[3]-l.rect[1]-height)<height*.15);
        if (group.length>=3) return group.map(l=>l.rect[3]-l.rect[1]).sort((a,b)=>a-b)[Math.floor(group.length/2)];
    }
    const heights = lines.filter(l => !l.vertical && l.rect[1] > .18 && l.rect[3] < .8 && l.text.length > 20)
        .map(l => l.rect[3]-l.rect[1]).sort((a,b)=>a-b);
    return heights[Math.floor(heights.length/2)] || 0;
}

function bodyFont(lines) {
    const counts = new Map();
    for (const line of lines) if (line.font && line.text.length > 30 && line.rect[1] > .2 && line.rect[3] < .8)
        counts.set(line.font, (counts.get(line.font) || 0) + line.text.length);
    return [...counts].sort((a,b) => b[1]-a[1])[0]?.[0];
}

function headerCandidatesFor(lines) {
	let bodyHeight = bodyLineHeight(lines);
	if (!bodyHeight) return [];
	let upper = lines.filter(l => !l.sideCandidate && !l.vertical && l.rect[3] < 0.23 && l.text.length > 3
		&& l.rect[3] - l.rect[1] <= bodyHeight * 1.05).sort((a, b) => a.rect[1] - b.rect[1]);
	let groups = [];
	for (let line of upper) {
		let group = groups.at(-1);
		if (!group || line.rect[1] - Math.max(...group.map(l => l.rect[3])) > bodyHeight * 0.8) groups.push([line]);
		else group.push(line);
	}
	let result = [];
	for (let group of groups) {
		let first = Math.min(...group.map(l => l.rect[1])), last = Math.max(...group.map(l => l.rect[3]));
		let rows = new Set(group.map(l => Math.round((l.rect[1] + l.rect[3]) / 2 / bodyHeight)));
		if (rows.size > 3 || group.reduce((n, l) => n + l.text.length, 0) > 180) continue;
		// Lower candidates need smaller type; ordinary first paragraphs and
		// large chapter titles must remain content even at repeatable positions.
		if (last >= 0.10 && group.some(l => l.rect[3] - l.rect[1] > bodyHeight * 0.92
            && !(l.font && bodyFont(lines) && l.font !== bodyFont(lines) && l.text.length < 90))) continue;
		let next = lines.filter(l => !group.includes(l) && l.rect[1] > last && l.text.length > 15)
			.sort((a, b) => a.rect[1] - b.rect[1])[0];
		if (next && next.rect[1] - last > Math.max(bodyHeight * 0.45, Math.max(...group.map(l => l.rect[3] - l.rect[1])) * 0.8)) result.push(...group);
	}
	return result;
}

function sameHeaderBand(a, b) {
	return Math.abs(a.y0 - b.y0) < 0.012 && Math.abs(a.y1 - b.y1) < 0.012;
}

function readingTextEdges(lines) {
    const prose = lines.filter(line => !line.sideCandidate && !line.vertical && line.text.length > 30
        && line.rect[2] - line.rect[0] > .28 && line.rect[1] > .12 && line.rect[3] < .85);
    if (prose.length < 3) return null;
    const quarter = values => values.sort((a,b) => a-b)[Math.floor(values.length*.25)];
    return [quarter(prose.map(line => line.rect[0])), -quarter(prose.map(line => -line.rect[2]))];
}

// An isolated small running head with a separate outer folio is strong local
// evidence, even when paired-page book margins place it far from the paper edge.
function runningFolio(line, lines, bodyHeight, edges) {
    if (!bodyHeight || line.vertical || line.text.length < 4 || line.text.length > 140
            || line.rect[3] >= .2 || line.rect[3]-line.rect[1] > bodyHeight*1.25
            || /^(?:\d+\s+)?(?:chapter|kapitel|section|teil)\b|^\d+[.)]\s/i.test(line.text.trim())) return false;
    const folio = lines.find(other => other !== line && (pageNumber(other.text) || editionReference(other.text))
        && other.rect[2]-other.rect[0] < .10
        && ((other.rect[2] < .18 || edges && other.rect[0] < edges[0]+.025) && line.rect[0]-other.rect[2] > .04
            || (other.rect[0] > .82 || edges && other.rect[2] > edges[1]-.025) && other.rect[0]-line.rect[2] > .04)
        && Math.abs(other.rect[1]+other.rect[3]-line.rect[1]-line.rect[3]) < bodyHeight);
    const next = lines.filter(l => l !== line && l !== folio && l.text.length > 15 && l.rect[1] > line.rect[3])
        .sort((a,b)=>a.rect[1]-b.rect[1])[0];
    const merged = line.rect[2]-line.rect[0]>.5 && (line.rect[0]<.13 || line.rect[2]>.87)
        && line.rect[3]-line.rect[1]<=bodyHeight*1.05
        && /^(?:\d{1,5}\s+.{8,}|.{8,}\s+\d{1,5})$/.test(line.text.trim());
    return (!!folio || merged) && !!next && next.rect[1]-line.rect[3] > bodyHeight*.7 ? {folio} : null;
}

function footerCandidatesFor(lines, fallbackHeight = 0) {
	let bodyHeight = bodyLineHeight(lines) || fallbackHeight;
	if (!bodyHeight) return [];
	return lines.filter(line => {
		let [x0, y0, x1, y1] = line.rect, text = line.text.trim();
		if (line.vertical || y0 < 0.82 || text.length < 3 || text.length > 120
				|| y1 - y0 > bodyHeight * 0.9 || pageNumber(text)
				|| /^(?:\d+[.)]?\s|[*†‡]|ibid\b|ebd\b|vgl\b|cf\b)/i.test(text)) return false;
		// A separate folio on the same baseline supplies evidence beyond small
		// type or repetition. Sources within notes must never become footers.
		let folio = lines.some(other => other !== line && pageNumber(other.text)
			&& other.rect[1] > 0.82 && Math.abs(other.rect[1] - y0) < bodyHeight * 0.4
			&& Math.max(other.rect[0] - x1, x0 - other.rect[2]) > 0.12);
		if (!folio) return false;
		let above = lines.filter(other => other !== line && other.rect[3] <= y0
			&& !pageNumber(other.text));
		return !above.length || y0 - Math.max(...above.map(l => l.rect[3])) > bodyHeight * 1.5;
	});
}

export function buildReadingModel(pages) {
	let occurrences = new Map();
	let headerCandidates = [];
	let footerCandidates = [];
	let heights = pages.map(p => bodyLineHeight(p.lines)).filter(Boolean).sort((a, b) => a - b);
	let bodyHeight = heights[Math.floor(heights.length / 2)] || 0;
	for (let page of pages) {
		for (let line of footerCandidatesFor(page.lines, bodyHeight)) {
			footerCandidates.push({ index: page.index, y0: line.rect[1], y1: line.rect[3] });
		}
		for (let line of headerCandidatesFor(page.lines)) {
			headerCandidates.push({ index: page.index, y0: line.rect[1], y1: line.rect[3] });
		}
		for (let line of page.lines) {
			if (!isOuter(line) || line.text.length < 4) continue;
			let key = normalize(line.text);
			if (!occurrences.has(key)) occurrences.set(key, new Set());
			occurrences.get(key).add(page.index);
		}
	}
	let repeated = new Set([...occurrences].filter(([, ids]) => ids.size >= Math.max(3, Math.ceil(pages.length / 3))).map(([key]) => key));
	// Running chapter titles can change between sampled page pairs. A stable
	// small, separated header position is evidence even when the words differ.
	let headerBands = headerCandidates.filter(candidate => new Set(headerCandidates
		.filter(other => sameHeaderBand(other, candidate)).map(other => other.index))
		.size >= Math.max(3, Math.ceil(pages.length / 2)));
	for (let parity = 0; parity < 2; parity++) {
		let count = pages.filter(p => p.index % 2 === parity).length;
		if (count < 3) continue;
		let candidates = headerCandidates.filter(c => c.index % 2 === parity);
		for (let candidate of candidates) {
			if (new Set(candidates.filter(other => sameHeaderBand(other, candidate)).map(c => c.index))
				.size >= Math.max(3, Math.ceil(count * 0.65))) headerBands.push({ ...candidate, parity });
		}
	}

	let footerBands = footerCandidates.filter(candidate => new Set(footerCandidates
		.filter(other => sameHeaderBand(other, candidate)).map(other => other.index))
		.size >= Math.max(3, Math.ceil(pages.length / 2)));
	// A repeated lower-page lane with a sequential folio offset is stronger
    // evidence than the whitespace gap alone (dense Fuchs footnote pages).
    const folios = pages.flatMap(page => page.lines.filter(line => folioNumber(line.text)
        && (line.rect[1] > .78 || line.rect[3] < .23) && line.rect[2]-line.rect[0] < .09
        && !(line.sideCandidate && romanReference(line.text))
        && (!bodyHeight || line.rect[3]-line.rect[1] <= bodyHeight*1.1)
        && !page.lines.some(other => other !== line && other.text.length > 2 && other.rect[1] < line.rect[3]
            && other.rect[3] > line.rect[1] && Math.max(other.rect[0]-line.rect[2],line.rect[0]-other.rect[2]) < .09))
        .map(line => ({index:page.index, offset:folioNumber(line.text).value-page.index,
            kind:folioNumber(line.text).kind, y0:line.rect[1], y1:line.rect[3]})));
    const folioBands = folios.filter(f => new Set(folios.filter(g => g.kind===f.kind
        && g.offset===f.offset && sameHeaderBand(f,g)).map(g=>g.index)).size >= 3);
    return { repeated, headerBands, footerBands, folioBands, bodyHeight };
}

export function getReadingExclusions(lines, model = { repeated: new Set() }, pageIndex = null,
    { includeMarginalia = false, headerRule = null, running = null } = {}) {
	let excluded = new Set();
	// A Roman/A-B label beside a detached running title is a page header,
    // not a body-margin reference controlled by Include/Exclude.
    const localHeight=bodyLineHeight(lines);
    const edges = readingTextEdges(lines);
    const runningHeads = new Map();
    for (const line of lines) {
        const candidate = runningFolio(line,lines,localHeight,edges);
        if (candidate) runningHeads.set(line,candidate);
    }
	for (const line of lines) if ((romanReference(line.text) || editionReference(line.text))
        && line.rect[3]<.20 && [...runningHeads.keys()].some(head=>head!==line
            && (line.rect[2]<head.rect[0] || line.rect[0]>head.rect[2])
            && Math.abs(line.rect[1]+line.rect[3]-head.rect[1]-head.rect[3]) < (model.bodyHeight || localHeight))) excluded.add(line);
	for (let line of lines) {
		let [x0, y0, x1, y1] = line.rect;
		let outer = isOuter(line);
		if (outer && downloadStamp(line.text)) excluded.add(line);
        if (romanReference(line.text) && y1<.16 && (x1<.22 || x0>.78)
            && localHeight && y1-y0<=localHeight*1.1) {
            const peer=lines.some(other=>other!==line && other.rect[1]<y1 && other.rect[3]>y0);
            const next=lines.filter(other=>other!==line && other.text.length>10 && other.rect[1]>y1)
                .sort((a,b)=>a.rect[1]-b.rect[1])[0];
            if (!peer && next && next.rect[1]-y1>localHeight*.65 && next.rect[1]-y1<.08) excluded.add(line);
        }
		// Footnotes can be short, small and repeated. None of those alone is
		// grounds for removing them: ordinary bottom text remains content.
		let adjacentText = lines.some(other => other !== line && other.text.length > 2
			&& other.rect[1] < y1 && other.rect[3] > y0
			&& Math.min(Math.abs(other.rect[0] - x1), Math.abs(x0 - other.rect[2])) < 0.05);
		if (pageNumber(line.text) && !adjacentText && !(line.sideCandidate && romanReference(line.text))) {
            const above = lines.filter(other => other !== line && other.text.length > 3 && other.rect[3] <= y0);
            const detached = above.length && y0 - Math.max(...above.map(other => other.rect[3])) > Math.max(0.012, (y1 - y0) * 1.2);
            const peer = lines.some(other => other !== line && other.text.length > 3
                && other.rect[1] < y1 && other.rect[3] > y0 && !downloadStamp(other.text)
                && !(model.footerBands?.some(band => sameHeaderBand(band, { y0: other.rect[1], y1: other.rect[3] }))
                    && footerCandidatesFor(lines, model.bodyHeight).includes(other)));
            const learned = pageIndex !== null && model.folioBands?.some(band => band.offset === (folioNumber(line.text)?.value ?? NaN)-pageIndex
                && (band.kind ?? 0) === folioNumber(line.text)?.kind && sameHeaderBand(band,{y0,y1}));
            if (y1 < 0.10 && (!model.bodyHeight || y1-y0 <= model.bodyHeight*1.1) || y0 > 0.94 && !peer || y0 > 0.85 && detached && !peer || learned && !peer) excluded.add(line);
        }
	}
	let bodyHeight = bodyLineHeight(lines);
	for (let line of footerCandidatesFor(lines, model.bodyHeight)) {
		if (model.footerBands?.some(band => sameHeaderBand(band, { y0: line.rect[1], y1: line.rect[3] }))) {
			excluded.add(line);
		}
	}
	const headerCandidates = new Set(headerCandidatesFor(lines));
	let headers = lines.filter(line => {
		let [ , y0, , y1] = line.rect;
        const h = y1-y0;
        const next = lines.filter(l=>l!==line && l.text.length>(headerRule?2:30) && l.rect[1]>y1).sort((a,b)=>a.rect[1]-b.rect[1])[0];
        const isolated = next && next.rect[1]-y1 > bodyHeight*.8;
        if (headerRule && y1 <= headerRule[0]+.003 && headerRule[0]-y1 < .055
            && y1<.23 && h<=Math.max(bodyHeight*1.2,.028)
            && (!next || next.rect[1]-y1 > Math.min(bodyHeight*.8 || h*.8,h*.8))
            && !/^(?:chapter|kapitel|section|teil)\s|^\d+[.)]\s/i.test(line.text.trim())) return true;
        // A small detached author list is local evidence even on the first page
        // of a newly encountered chapter. Preserve ordinary small headings.
        if (y1 < .15 && isolated && h<bodyHeight*.92 && line.text.split(',').length>=3
            && line.text.length<180 && !/[.!?]$/.test(line.text.trim())) return true;
		if (runningHeads.has(line)) return true;
		if (line.sideCandidate && marginalReference(line.text)) return false;
		if (line.vertical || y1 >= 0.23 || bodyHeight && y1 - y0 > bodyHeight * 1.1) return false;
		let knownBand = model.headerBands?.some(band => (band.parity === undefined
			|| pageIndex !== null && band.parity === pageIndex % 2) && sameHeaderBand(band, { y0, y1 }));
		return knownBand || headerCandidates.has(line) && model.repeated.has(normalize(line.text))
			&& (bodyHeight ? y1 - y0 <= bodyHeight * 1.1 : y1 < 0.1);
	}).sort((a, b) => a.rect[1] - b.rect[1]);
	let blocks = [];
	for (let line of headers) {
		let block = blocks.at(-1), h = line.rect[3] - line.rect[1];
		if (!block || line.rect[1] - Math.max(...block.map(l => l.rect[3])) > Math.max(h, bodyHeight) * 0.8) blocks.push([line]);
		else block.push(line);
	}
	for (let block of blocks) {
        const members = new Set(block);
        for (const head of block) {
            const folio = runningHeads.get(head)?.folio;
            if (folio) members.add(folio);
        }
		let end = Math.max(...[...members].map(l => l.rect[3]));
		let height = Math.max(...[...members].map(l => l.rect[3] - l.rect[1]));
		// Tall glyph boxes can overlap the next body line. That is continuous
		// text, not a whitespace gap after a running header.
		if (lines.some(l => !members.has(l) && !headers.includes(l) && !excluded.has(l) && l.rect[1] < end
			&& l.rect[3] > end && l.rect[0] < 0.85 && l.rect[2] > 0.15)) continue;
		let next = lines.filter(l => !members.has(l) && !headers.includes(l) && !excluded.has(l) && l.rect[1] > end
			&& l.rect[0] < 0.85 && l.rect[2] > 0.15).sort((a, b) => a.rect[1] - b.rect[1])[0];
		if (next && next.rect[1] - end > height * 0.65
            || headerRule && end <= headerRule[0]+.003 && !next) {
			for (const member of members) excluded.add(member);
        }
	}

	// A JSTOR URL can be a legitimate footnote. Remove continuation lines only
	// when they are attached to an identified download/terms block.
	let stamps = [...excluded].filter(line => downloadStamp(line.text));
	for (let line of lines) {
		if (!/^(?:https?:\/\/|doi\s*:?\s*https?:\/\/|terms\s*(?:and|&)\s*conditions)/i.test(line.text.trim())) continue;
		if (stamps.some(stamp => Math.max(line.rect[1] - stamp.rect[3], stamp.rect[1] - line.rect[3]) < 0.04)) excluded.add(line);
	}
	if (running) for (const line of excluded) running.push(line.rect);
	if (includeMarginalia) return [...excluded].map(line => line.rect);
	let numbers = lines.filter(line => /^\d{1,3}$/.test(line.text) && line.rect[2] - line.rect[0] < 0.045);
	for (let line of numbers) {
		let [x0, , x1] = line.rect;
		let column = numbers.filter(other => Math.abs(other.rect[0] - x0) < 0.012);
		if (column.length < 3 || Math.max(...column.map(l => l.rect[3])) - Math.min(...column.map(l => l.rect[1])) < 0.2) continue;
		// A detached series confined to the lower page can be footnote labels.
		// Line-number columns also accompany the main body higher on the page.
		if (!column.some(other => other.rect[1] < 0.6)) continue;
		let neighbors = lines.filter(other => !other.sideCandidate && !column.includes(other) && other.text.length > 15
			&& other.rect[1] < 0.92 && other.rect[3] > 0.12);
		if (neighbors.length >= 3 && neighbors.every(other => other.rect[0] >= x1 - 0.002
			|| other.rect[2] <= x0 + 0.002)) column.forEach(item => excluded.add(item));
	}
	// Edition references occupy a separate narrow outer column, never an
	// arbitrary number inside an equation or a footnote citation.
	for (let line of lines) {
		if (!marginalReference(line.text) && !marginalSymbol(line.text)) continue;
		let [x0, y0, x1, y1] = line.rect;
		if (x1 - x0 > 0.10) continue;
        // Use the robust body column of the page, even beside a short chapter
        // heading or a blank baseline. A centered “I.” remains a heading.
        let body = lines.filter(other => !other.sideCandidate && !other.vertical && other.text.length > 30
            && other.rect[2]-other.rect[0] > .35 && other.rect[1] > .12 && other.rect[3] < .9);
        if (body.length >= 3) {
            const quantile = values => values.sort((a,b)=>a-b)[Math.floor(values.length*.25)];
            const left = quantile(body.map(l=>l.rect[0]));
            const bodyHeight = model?.bodyHeight || quantile(body.map(l=>l.rect[3]-l.rect[1]));
            if (marginalSymbol(line.text) && y1-y0 > bodyHeight*1.3) continue;
            if (marginalSymbol(line.text) && y0 > .75 && lines.some(other => other !== line && other.text.length > 20
                && other.rect[3]-other.rect[1] < bodyHeight*.85
                && Math.abs((other.rect[1]+other.rect[3]-y0-y1)/2) < bodyHeight
                && other.rect[0] > x1 && other.rect[0]-x1 < .065)) continue;
            const right = -quantile(body.map(l=>-l.rect[2]));
            if (x1 < left-.004 && x1 < .22 || x0 > right+.004 && x0 > .78
                || marginalSymbol(line.text) && (x0 >= right-.002 && x0>.82 || x1 <= left+.002 && x1<.18)) excluded.add(line);
        }
        else {
            body = lines.filter(other => !other.sideCandidate && other.text.length > 20 && other.rect[1] < y1 + .03 && other.rect[3] > y0 - .03);
            if (body.length && body.every(other => other.rect[0] > x1+.004 || other.rect[2] < x0-.004)) excluded.add(line);
        }
	}
	return [...excluded].map(line => line.rect);
}

function findRunningHeadRule(image, lines) {
    const {width,height,data} = image;
    if (!width || !height || !data) return null;
    const body = bodyLineHeight(lines);
    let start = null;
    for (let y=0;y<Math.min(height,Math.ceil(height*.23));y++) {
        let ink=0;
        for(let x=0;x<width;x++) if(data[y*width+x]<235) ink++;
        if(ink>width*.55) { if(start===null) start=y; }
        else if(start!==null) {
            const band=[start/height,y/height];
            const above=lines.filter(l=>!l.vertical && l.rect[3]<=band[0]+.003
                && band[0]-l.rect[3]<.055 && l.rect[3]-l.rect[1]<=.028);
            // Image-only body pages still have a text running head and a tiny
            // outer folio. Require that pair and visible content below the rule
            // before accepting a separator without ordinary body text.
            const paired=above.some(head=>head.text.length>5 && above.some(folio=>folio!==head
                && folio.text.length<=8 && (folio.rect[2]<.22 || folio.rect[0]>.78)
                && (folio.rect[2]<head.rect[0] || folio.rect[0]>head.rect[2])
                && Math.abs(folio.rect[1]+folio.rect[3]-head.rect[1]-head.rect[3])<.02));
            let contentRows=0;
            if (paired) for(let row=y+Math.ceil(height*.008);row<Math.min(height,y+height*.12);row++) {
                let ink=0;
                for(let x=0;x<width;x++) if(data[row*width+x]<235) ink++;
                if(ink>width*.05) contentRows++;
            }
            if(y-start<=Math.max(3,height*.005)
                && lines.some(l=>l.text.length>5 && l.rect[3]<=band[0]+.003 && band[0]-l.rect[3]<.055)
                && (paired && contentRows>=3 || (body || lines.length>=4)
                && lines.some(l=>l.text.length>2 && l.rect[1]>band[1] && l.rect[1]-band[1]<.065)
                && new Set(lines.filter(l=>l.text.length>2 && l.rect[1]>band[1])
                    .map(l=>Math.round(l.rect[1]/.006))).size>=3)) return band;
            start=null;
        }
    }
    return null;
}

// Unlabelled raster stars/dots survive OCR surprisingly often. Only consider
// tiny disconnected marks beyond a well-supported prose column, never images
// or text-free scans. A four-pixel guard protects italic overhang and body ink.
export function getRasterMarginalia(image, lines, strips, scan = null) {
    if (!image) return [];
    image=compactReadingImage(image);
    const {width,height}=image, data = scan?.data || image.data;
    const h=scan?.body?.lineHeight || bodyLineHeight(lines);
    if (width<200 || height<200) return [];
    const prose=lines.filter(l=>!l.vertical && !l.sideCandidate && l.text.length>30
        && l.rect[2]-l.rect[0]>.35 && l.rect[1]>.12 && l.rect[3]<.9
        && l.rect[3]-l.rect[1]>h*.8 && l.rect[3]-l.rect[1]<h*1.2);
    if ((!scan?.body && prose.length<6) || !h) return [];
    const quantile=a=>a.sort((a,b)=>a-b)[Math.floor(a.length*.25)];
    const left=scan?.body?.left ?? quantile(prose.map(l=>l.rect[0])), right=scan?.body?.right ?? -quantile(prose.map(l=>-l.rect[2]));
    const top=Math.floor((scan?.body?.top ?? Math.min(...prose.map(l=>l.rect[1])))*height);
    const bottom=Math.ceil((scan?.body?.bottom ?? Math.max(...prose.map(l=>l.rect[3])))*height);
    const seen=new Uint8Array(width*height), marks=[];
    for (const [start,end] of [[0,Math.floor(left*width)-4],[Math.ceil(right*width)+4,width]]) {
        for(let y=top;y<bottom;y++) for(let x=start;x<end;x++) {
            const first=y*width+x;
            if(seen[first] || data[first]>=225) continue;
            const queue=[first];seen[first]=1;
            let strong = 0;
            let x0=x,x1=x,y0=y,y1=y;
            for(let at=0;at<queue.length;at++) {
                const p=queue[at], px=p%width, py=Math.floor(p/width);
                x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);
                if (data[p] < 210) strong++;
                for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
                    const nx=px+dx,ny=py+dy,n=ny*width+nx;
                    if(nx<start || nx>=end || ny<top || ny>=bottom || seen[n] || data[n]>=225) continue;
                    seen[n]=1;queue.push(n);
                }
            }
            if(x1-x0+1>width*.035 || y1-y0+1>Math.max(3,h*height*1.1)) continue;
            if (scan?.body) {
                const w=x1-x0+1, markHeight=y1-y0+1, size=Math.round(h*height*.73);
                if (x0===start && start>0 || x1===end-1 && end<width || Math.max(w,markHeight)>size
                    || Math.max(w,markHeight)>Math.min(w,markHeight)*2.5 || queue.length<3) continue;
                // Without OCR, keep groups of glyphs such as I., II. and III.
                // that are printed as part of an indented paragraph or list.
                const gap=Math.max(2,Math.round(h*height*.26));
                let neighbor=false;
                for(let yy=Math.max(0,y0-gap);yy<=Math.min(height-1,y1+gap) && !neighbor;yy++) {
                    for(let xx=Math.max(0,x0-gap);xx<=Math.min(width-1,x1+gap);xx++) {
                        if (xx>=x0 && xx<=x1 && yy>=y0 && yy<=y1) continue;
                        if (data[yy*width+xx]<210) { neighbor=true; break; }
                    }
                }
                if (neighbor) continue;
            }
            const rect=[x0/width,y0/height,(x1+1)/width,(y1+1)/height];
            // Known text, including footnote labels and references, follows the
            // semantic rules instead of being erased as an unknown raster mark.
            if(lines.some(l=>l.rect[0]<rect[2] && l.rect[2]>rect[0]
                && l.rect[1]<rect[3] && l.rect[3]>rect[1])) continue;
            if (strong >= 2) marks.push(rect);
            else if (strips && !strips.some(strip => strip.kind === 'mark') && (queue.length > 1 || strong)) {
                const patch = [Math.max(0, x0-3)/width, Math.max(0, y0-3)/height,
                    Math.min(width, x1+4)/width, Math.min(height, y1+4)/height];
                if (patch[2] <= left || patch[0] >= right) strips.push({ kind: 'mark', rect: patch });
            }
        }
    }
    return marks;
}

export function classifyReadingElements(lines, model, pageIndex, image) {
    const headerRule = image && findRunningHeadRule(image,lines);
    const running = [];
    const excluded = getReadingExclusions(lines,model,pageIndex,{headerRule,running});
    const fixed = new Set(running);
    return {headerRule, running, excluded, marginalia:excluded.filter(rect => !fixed.has(rect))};
}

export function getReadingBounds(image, lines, model, pageIndex = null, options = {}) {
	image = compactReadingImage(image);
    const {headerRule, running, excluded} = options.classification || classifyReadingElements(lines,model,pageIndex,image);
    const scan = options.scan === undefined && lines.length-running.length < 3 ? analyzeTextScan(image) : options.scan;
	let ignored = [...(options.includeMarginalia ? running : excluded)];
    if (scan?.running) ignored.push(scan.running);
    if (!options.includeMarginalia) ignored.push(...(options.rasterMarks ?? getRasterMarginalia(image,lines,null,scan)));
	let { width, height } = image;
	let data = new Uint8ClampedArray(scan?.data || image.data);
    const red = image.red && new Uint8ClampedArray(image.red);
    const whiten=(start,end)=>{data.fill(255,start,end);red?.fill(255,start,end);};
    if (headerRule && ignored.some(r=>r[3]<=headerRule[0]+.003)
        && !lines.some(l=>!ignored.includes(l.rect) && l.rect[1]<headerRule[1] && l.rect[3]>headerRule[0])) {
        whiten(Math.max(0,Math.floor(headerRule[0]*height)-1)*width,
            Math.min(height,Math.ceil(headerRule[1]*height)+1)*width);
    }
    if (options.evidence) {
        options.evidence.running = [...running, ...(options.rasterRules || [])];
        if (scan?.running) options.evidence.running.push(scan.running);
        if (headerRule && running.some(rect => rect[3] <= headerRule[0]+.003)) {
            options.evidence.running.push([0, headerRule[0], 1, headerRule[1]]);
        }
    }
    for (const rect of options.rasterRules || []) {
        // Confirmed resolution of a short or faint rule in documented white space.
        const x0 = Math.floor(rect[0] * width), x1 = Math.ceil(rect[2] * width);
        const y0 = Math.floor(rect[1] * height), y1 = Math.ceil(rect[3] * height);
        for (let y = y0; y < y1; y++) whiten(y * width + x0, y * width + x1);
    }
	for (let rect of ignored) {
		let x0 = Math.max(0, Math.floor(rect[0] * width) - 2), y0 = Math.max(0, Math.floor(rect[1] * height) - 2);
		let x1 = Math.min(width, Math.ceil(rect[2] * width) + 2), y1 = Math.min(height, Math.ceil(rect[3] * height) + 2);
		for (let y = y0; y < y1; y++) whiten(y * width + x0, y * width + x1);
	}
	// Running heads can contain vector separators (Höffe: page number — author)
	// which are absent from the text layer. Clear their band only if no retained
	// text overlaps it; a marginal reference beside body text never clears a row.
	for (let rect of ignored.filter(rect => rect[3] < 0.23)) {
		if (lines.some(line => !ignored.includes(line.rect)
			&& line.rect[1] < rect[3] && line.rect[3] > rect[1])) continue;
		let y0 = Math.max(0, Math.floor(rect[1] * height) - 2);
		let y1 = Math.min(height, Math.ceil(rect[3] * height) + 2);
		whiten(y0 * width,y1 * width);
	}
    // Inspect a possible separator only in an empty gap below a confirmed head.
    // A different ambiguous edge remains outside the crop independently.
    if (!headerRule && running.some(rect => rect[3] < .23)) {
        const head = Math.max(...running.filter(rect => rect[3] < .23).map(rect => rect[3]));
        const next = Math.min(1, ...lines.filter(line => !running.includes(line.rect) && !line.sideCandidate
            && line.rect[3] > head).map(line => line.rect[1]));
        if (next > head && next < 1) {
            const strip = headerStrip(red || data, width, height, head, Math.min(next,head+.055));
            if (strip?.strong) {
                const [x0,y0,x1,y1] = strip.ink;
                for (let y = y0; y < y1; y++) whiten(y * width + x0, y * width + x1);
                options.evidence?.running.push([x0/width,y0/height,x1/width,y1/height]);
            }
            else if (strip && !options.inspected && options.evidence) {
                options.evidence.strips.push({kind:strip.kind,rect:strip.rect});
            }
        }
    }
	// No vertical band trimming: even a one-line footnote is part of the page.
	// A footer may also have a vector rule above it. Search only the small empty
	// strip below ALL retained text, so a real footnote and its separator survive.
	let footers = ignored.filter(rect => rect[1] > 0.82 && lines.some(line => line.rect === rect && !pageNumber(line.text)));
	if (footers.length) {
		let top = Math.min(...footers.map(r => r[1]));
		let retainedBottom = Math.max(0, ...lines.filter(l => !ignored.includes(l.rect)
			&& l.rect[1] < top).map(l => l.rect[3]));
		let start = Math.max(Math.ceil(retainedBottom * height) + 2, Math.floor((top - 0.035) * height));
		let end = Math.floor(top * height) - 2, run = null;
		for (let y = start; y <= end; y++) {
			let ink = 0;
			if (y < end) for (let x = 0; x < width; x++) if ((red || data)[y * width + x] < 235) ink++;
			if (ink > width * 0.5) { if (run === null) run = y; }
			else if (run !== null) {
				if (y - run <= Math.max(2, height * 0.004)) {
                    whiten(run*width,y*width);
                    options.evidence?.running.push([0,run/height,1,y/height]);
                }
				run = null;
			}
		}
	}
    const retained = lines.filter(line => !ignored.includes(line.rect));
    const canTrimHorizontal = ({ start, end }, counts) => {
        if (retained.some(line => line.rect[0] * width < end && line.rect[2] * width > start)) return false;
        let ink = 0;
        for (let x = start; x < end; x++) ink += counts[x];
        // A narrow detached band may still be a real line or illustration.
        return ink < Math.max(5,width * height * .0015);
    };
	let bounds = getInkBounds({ data, width, height, channels:1 },
        { trimVertical:false, trimHorizontal:!options.includeMarginalia, canTrimHorizontal });
	return bounds && bounds[2] - bounds[0] > 0.015 && bounds[3] - bounds[1] > 0.015 ? bounds : null;
}

export function getReadingMarginalia(lines, model, pageIndex, image = null) {
    const classification = classifyReadingElements(lines,model,pageIndex,image && compactReadingImage(image));
    return [...classification.marginalia, ...getRasterMarginalia(image,lines)];
}

function parityProfile(pages) {
	let profiles = [null, null];
	for (let parity = 0; parity < 2; parity++) {
		let bounds = pages.filter(page => page.index % 2 === parity && page.bounds).map(page => page.bounds);
		if (!bounds.length) continue;
		let pick = (i, high) => {
			let values = bounds.map(b => b[i]).sort((a, b) => high ? b - a : a - b);
			return values[bounds.length >= 4 ? 1 : 0];
		};
		profiles[parity] = [pick(0), pick(1), pick(2, true), pick(3, true)];
	}
	let widths = profiles.filter(Boolean).map(b => b[2] - b[0]);
	return { profiles, width: Math.max(0, ...widths) };
}

export function buildReadingProfiles(pages) {
	const groups = {};
	for (const kind of new Set(pages.map(page => page.kind).filter(Boolean))) {
		const members = pages.filter(page => page.kind === kind && page.bounds);
		// A lone wide table or title is evidence for its own page only.
		if (members.length >= 2) {
			const widths = members.map(page => page.bounds[2]-page.bounds[0]).sort((a,b) => a-b);
			const profile = parityProfile(members);
			groups[kind] = {...profile, width:widths[Math.floor((widths.length-1)*.5)]};
		}
	}
	const ordinary = pages.filter(page => !page.kind || page.kind === 'prose');
	return { ...parityProfile(ordinary.length ? ordinary : pages), groups };
}

export function resolveReadingBounds(actual, index, profiles, kind) {
	if (kind && profiles.groups) {
		profiles = profiles.groups[kind];
		if (!profiles) return actual;
	}
	let profile = profiles.profiles[index % 2] || actual;
	if (!actual || !profile) return actual || profile || [0, 0, 1, 1];
	// Keep a stable reading width, but measure each newly visited page once so
	// a wider table or an unusual footnote cannot be clipped by the samples.
	let center = (profile[0] + profile[2]) / 2, width = profiles.width || profile[2] - profile[0];
	return [Math.min(actual[0], clamp(center - width / 2)), actual[1],
		Math.max(actual[2], clamp(center + width / 2)), actual[3]];
}

// Text fitting preserves the full paper extent on the scrolling axis.
export function getReadingFrame(bounds, {mode,reference}) {
    if (reference !== 'content') return bounds;
    if (mode === 'width') return [bounds[0],0,bounds[2],1];
    if (mode === 'height') return [0,bounds[1],1,bounds[3]];
    return bounds;
}

export function getReadingFit({ mode, reference, margin, bounds, width, height, pageWidth, pageHeight }) {
	let content = mode === 'content' || reference === 'content' || reference === 'cropped-content';
	let b = content ? bounds : [0, 0, 1, 1];
	let pad = content ? Math.max(0, margin || 0) * Math.min(width, height) : 0;
	let sx = Math.max(1, width - 2 * pad) / ((b[2] - b[0]) * pageWidth);
	let sy = Math.max(1, height - 2 * pad) / ((b[3] - b[1]) * pageHeight);
	let scale = mode === 'width' ? sx : mode === 'height' ? sy : Math.min(sx, sy);
	return { scale: Math.max(0.1, Math.min(10, scale)), bounds: getReadingFrame(b, {mode,reference}), pad };
}

export function rotateReadingBounds(b, degrees) {
	switch ((degrees % 360 + 360) % 360) {
		case 90: return [1 - b[3], b[0], 1 - b[1], b[2]];
		case 180: return [1 - b[2], 1 - b[3], 1 - b[0], 1 - b[1]];
		case 270: return [b[1], 1 - b[2], b[3], 1 - b[0]];
		default: return b;
	}
}

// A canonical Roman numeral is a folio only with matching page-position and
// sequence evidence. Ordinary words and A/B edition references never parse.
function folioNumber(text) {
    const value = text.trim().replace(/^[-–—]\s*|\s*[-–—]$/g, '');
    if (/^\d{1,5}$/.test(value)) return { value:Number(value), kind:0 };
    if (!new RegExp('^' + romanFolio + '$','i').test(value)) return null;
    const digits = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
    let number=0, previous=0;
    for (const letter of [...value.toUpperCase()].reverse()) {
        const digit=digits[letter]; number += digit < previous ? -digit : digit; previous=digit;
    }
    return number > 0 ? {value:number,kind:1} : null;
}

// Split local evidence when a running chapter label changes, comparing each
// parity independently (left and right pages often have different titles).
export function localReadingPages(pages, index) {
    let nearby = pages.filter(p => Math.abs(p.index-index) <= 4);
    for (let parity=0;parity<2;parity++) {
        const labels = nearby.filter(p=>p.index%2===parity).map(p=>({index:p.index,
            key:headerCandidatesFor(p.lines).filter(l=>!pageNumber(l.text)).map(l=>normalize(l.text)).join('|')}));
        // A real chapter label recurs across pages of the same parity.
        // Unique or continuously changing running titles are not boundaries.
        const anchor = labels.filter(p=>p.key && labels.filter(other=>other.key===p.key).length>=2).sort((a,b)=>Math.abs(a.index-index)-Math.abs(b.index-index))[0];
        if (!anchor) continue;
        const before=labels.filter(p=>p.index<anchor.index && p.key && p.key!==anchor.key).map(p=>p.index);
        const after=labels.filter(p=>p.index>anchor.index && p.key && p.key!==anchor.key).map(p=>p.index);
        const low=Math.max(-Infinity,...before), high=Math.min(Infinity,...after);
        nearby=nearby.filter(p=>p.index>low && p.index<high);
    }
    return nearby;
}

// Only used after the operator list proves that the page paints text alone.
// Scans, diagrams, rules and complex graphics retain the raster fallback.
export function getReadingTextBounds(lines, model, index, options = {}) {
    const {running, excluded} = options.classification || classifyReadingElements(lines,model,index);
    const ignored=new Set(options.includeMarginalia ? running : excluded);
    if (options.evidence) options.evidence.running = running;
    const kept=lines.filter(l=>!ignored.has(l.rect));
    if (!kept.length) return null;
    // Advance widths can understate italic overhang; retain a small font-sized
    // guard instead of treating extracted text boxes as exact ink rectangles.
    const heights=kept.map(l=>l.rect[3]-l.rect[1]).sort((a,b)=>a-b);
    const typical=heights[Math.floor(heights.length/2)] || 0;
    const padX=Math.max(.002,typical*.35),padY=Math.max(.002,typical*.15);
    return [clamp(Math.min(...kept.map(l=>l.rect[0]))-padX),clamp(Math.min(...kept.map(l=>l.rect[1]))-padY),
        clamp(Math.max(...kept.map(l=>l.rect[2]))+padX),clamp(Math.max(...kept.map(l=>l.rect[3]))+padY)];
}
