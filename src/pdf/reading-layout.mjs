import { getInkBounds } from './content-fit.mjs';

// PDF page indexes, not printed folios. Always sample adjacent odd/even pairs.
export function getReadingSamples(count) {
	if (count <= 8) return Array.from({ length: count }, (_, i) => i);
	let span = Math.max(8, Math.round(count * 0.1));
	let first = Math.max(0, Math.floor((count - span) / 4) * 2);
	let last = Math.min(count - 2, first + Math.max(6, span - 2));
	let indexes = new Set();
	for (let i = 0; i < 4; i++) {
		let start = Math.min(count - 2, Math.round((first + (last - first) * i / 3) / 2) * 2);
		indexes.add(start); indexes.add(start + 1);
	}
	return [...indexes].sort((a, b) => a - b);
}

const clamp = n => Math.max(0, Math.min(1, n));
const normalize = text => text.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
const pageNumber = text => /^(?:[-–—]?\s*)?(?:\d{1,5}|[ivxlcdm]{1,8})(?:\s*[-–—]?)$/i.test(text.trim());
const downloadStamp = text => /^(?:(?:this content )?downloaded\s+(?:from|by|on)|(?:accessed|retrieved)\s+(?:on|from)|all use subject to)/i.test(text.trim());
// A/B folios can be Roman in introductions (Kant: B XLI) and Arabic in
// the main text. Require canonical Roman numerals so ordinary words such as
// 'bill' do not become references. Geometry below still requires a margin column.
const romanFolio = '(?=[MDCLXVI])M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})';
const editionFolio = '(?:\\d{1,4}|' + romanFolio + ')';
const abReference = '[AB]\\s*' + editionFolio + '(?:\\s*[/–-]\\s*[AB]?\\s*' + editionFolio + ')?';
const editionPattern = new RegExp('^(?:(?:(?:AA|Ak\\.?)\\s*)?(?:[IVXLC]+|\\d{1,3})\\s*[:,.]\\s*\\d{1,4}|'
	+ abReference + '|\\[\\s*\\d{1,4}\\s*\\])$', 'i');
const editionReference = text => editionPattern.test(text.trim());

function splitOuterReference(item, viewport) {
	if (!item.chars?.length) return null;
	let text = item.str.trim(), pattern = '(?:' + abReference + '|\\d{1,3}|\\[\\d{1,4}\\])';
	let tail = text.match(new RegExp('^(.*\\S)\\s+(' + pattern + ')$', 'i'));
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
		|| !editionReference(refText) && !ref.every(c => c.fontSize < height * 0.9)
		|| Math.max(r[0] - b[2], b[0] - r[2]) < 0.005) return null;
	return [{ text: bodyText, rect: b, vertical: false, sideCandidate: false },
		{ text: refText, rect: r, vertical: false, sideCandidate: true }];
}

// Use the rendered viewport transform, including PDF CropBox and rotation.
export function getReadingTextLines(content, viewport) {
	let v = viewport.transform, spans = [];
	for (let item of content?.items || []) {
		if (!item.str?.trim() || !item.transform || !item.width) continue;
		let split = splitOuterReference(item, viewport);
		if (split) { spans.push(...split); continue; }
		let t = item.transform;
		let a = v[0] * t[0] + v[2] * t[1], b = v[1] * t[0] + v[3] * t[1];
		let c = v[0] * t[2] + v[2] * t[3], d = v[1] * t[2] + v[3] * t[3];
		let x = v[0] * t[4] + v[2] * t[5] + v[4], y = v[1] * t[4] + v[3] * t[5] + v[5];
		let length = Math.hypot(a, b);
		if (!length) continue;
		let w = item.width * viewport.scale, dx = a / length * w, dy = b / length * w;
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
		let sideCandidate = (rect[2] < 0.14 || rect[0] > 0.86)
			&& rect[2] - rect[0] < 0.1 && (/^\d{1,3}$/.test(text) || editionReference(text));
		spans.push({ text, rect, vertical: Math.abs(dy) > Math.abs(dx), sideCandidate });
	}
	spans.sort((a, b) => a.rect[1] - b.rect[1] || a.rect[0] - b.rect[0]);
	let lines = [];
	for (let span of spans) {
		let [x0, y0, x1, y1] = span.rect;
		let row = [...lines].reverse().find(line => !span.sideCandidate && !line.sideCandidate && !span.vertical && !line.vertical
			&& Math.abs((line.rect[1] + line.rect[3] - y0 - y1) / 2) < Math.max(y1 - y0, line.rect[3] - line.rect[1]) * 0.4
			&& x0 >= line.rect[2] - 0.005 && x0 - line.rect[2] < Math.max(0.025, (y1 - y0) * 2));
		if (row) {
			row.text += ' ' + span.text;
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
	let heights = lines.filter(l => !l.vertical && l.rect[1] > 0.18 && l.rect[3] < 0.8 && l.text.length > 20)
		.map(l => l.rect[3] - l.rect[1]).sort((a, b) => a - b);
	return heights[Math.floor(heights.length / 2)] || 0;
}

function headerCandidatesFor(lines) {
	let bodyHeight = bodyLineHeight(lines);
	if (!bodyHeight) return [];
	let upper = lines.filter(l => !l.sideCandidate && !l.vertical && l.rect[3] < 0.18 && l.text.length > 3
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
		if (last >= 0.10 && group.some(l => l.rect[3] - l.rect[1] > bodyHeight * 0.92)) continue;
		let next = lines.filter(l => !group.includes(l) && l.rect[1] > last && l.text.length > 15)
			.sort((a, b) => a.rect[1] - b.rect[1])[0];
		if (next && next.rect[1] - last > Math.max(bodyHeight * 0.45, Math.max(...group.map(l => l.rect[3] - l.rect[1])) * 0.8)) result.push(...group);
	}
	return result;
}

function sameHeaderBand(a, b) {
	return Math.abs(a.y0 - b.y0) < 0.012 && Math.abs(a.y1 - b.y1) < 0.012;
}

function footerCandidatesFor(lines, fallbackHeight = 0) {
	let bodyHeight = bodyLineHeight(lines) || fallbackHeight;
	if (!bodyHeight) return [];
	return lines.filter(line => {
		let [x0, y0, x1, y1] = line.rect, text = line.text.trim();
		if (line.vertical || y0 < 0.92 || text.length < 3 || text.length > 120
				|| y1 - y0 > bodyHeight * 0.9 || pageNumber(text)
				|| /^(?:\d+[.)]?\s|[*†‡]|ibid\b|ebd\b|vgl\b|cf\b)/i.test(text)) return false;
		// A separate folio on the same baseline supplies evidence beyond small
		// type or repetition. Sources within notes must never become footers.
		let folio = lines.some(other => other !== line && pageNumber(other.text)
			&& other.rect[1] > 0.94 && Math.abs(other.rect[1] - y0) < bodyHeight * 0.4
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
	return { repeated, headerBands, footerBands, bodyHeight };
}

export function getReadingExclusions(lines, model = { repeated: new Set() }, pageIndex = null, { includeMarginalia = false } = {}) {
	let excluded = new Set();
	for (let line of lines) {
		let [x0, y0, x1, y1] = line.rect;
		let outer = isOuter(line);
		if (outer && downloadStamp(line.text)) excluded.add(line);
		// Footnotes can be short, small and repeated. None of those alone is
		// grounds for removing them: ordinary bottom text remains content.
		let adjacentText = lines.some(other => other !== line && other.text.length > 2
			&& other.rect[1] < y1 && other.rect[3] > y0
			&& Math.min(Math.abs(other.rect[0] - x1), Math.abs(x0 - other.rect[2])) < 0.05);
		if (pageNumber(line.text) && !adjacentText && (y1 < 0.10 || y0 > 0.94)) excluded.add(line);
	}
	let bodyHeight = bodyLineHeight(lines);
	for (let line of footerCandidatesFor(lines, model.bodyHeight)) {
		if (model.footerBands?.some(band => sameHeaderBand(band, { y0: line.rect[1], y1: line.rect[3] }))) {
			excluded.add(line);
		}
	}
	let headers = lines.filter(line => {
		let [ , y0, , y1] = line.rect;
		if (line.sideCandidate && editionReference(line.text)) return false;
		if (line.vertical || y1 >= 0.18 || bodyHeight && y1 - y0 > bodyHeight * 1.1) return false;
		let knownBand = model.headerBands?.some(band => (band.parity === undefined
			|| pageIndex !== null && band.parity === pageIndex % 2) && sameHeaderBand(band, { y0, y1 }));
		return knownBand || model.repeated.has(normalize(line.text))
			&& (bodyHeight ? y1 - y0 <= bodyHeight * 1.1 : y1 < 0.1);
	}).sort((a, b) => a.rect[1] - b.rect[1]);
	let blocks = [];
	for (let line of headers) {
		let block = blocks.at(-1), h = line.rect[3] - line.rect[1];
		if (!block || line.rect[1] - Math.max(...block.map(l => l.rect[3])) > Math.max(h, bodyHeight) * 0.8) blocks.push([line]);
		else block.push(line);
	}
	for (let block of blocks) {
		let end = Math.max(...block.map(l => l.rect[3]));
		let height = Math.max(...block.map(l => l.rect[3] - l.rect[1]));
		// Tall glyph boxes can overlap the next body line. That is continuous
		// text, not a whitespace gap after a running header.
		if (lines.some(l => !headers.includes(l) && !excluded.has(l) && l.rect[1] < end
			&& l.rect[3] > end && l.rect[0] < 0.85 && l.rect[2] > 0.15)) continue;
		let next = lines.filter(l => !headers.includes(l) && !excluded.has(l) && l.rect[1] > end
			&& l.rect[0] < 0.85 && l.rect[2] > 0.15).sort((a, b) => a.rect[1] - b.rect[1])[0];
		if (next && next.rect[1] - end > height * 0.65) block.forEach(l => excluded.add(l));
	}

	// A JSTOR URL can be a legitimate footnote. Remove continuation lines only
	// when they are attached to an identified download/terms block.
	let stamps = [...excluded].filter(line => downloadStamp(line.text));
	for (let line of lines) {
		if (!/^(?:https?:\/\/|terms\s*(?:and|&)\s*conditions)/i.test(line.text.trim())) continue;
		if (stamps.some(stamp => line.rect[1] >= stamp.rect[1] - 0.005
			&& line.rect[1] - stamp.rect[3] < 0.05)) excluded.add(line);
	}
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
		if (!editionReference(line.text)) continue;
		let [x0, y0, x1, y1] = line.rect;
		if (x1 - x0 > 0.10) continue;
		let body = lines.filter(other => !other.sideCandidate && other.text.length > 20 && other.rect[1] < y1 + 0.03 && other.rect[3] > y0 - 0.03);
		if (body.length && body.every(other => other.rect[0] > x1 + 0.004 || other.rect[2] < x0 - 0.004)) excluded.add(line);
	}
	return [...excluded].map(line => line.rect);
}

export function getReadingBounds(image, lines, model, pageIndex = null, options = {}) {
	let ignored = getReadingExclusions(lines, model, pageIndex, options);
	let { width, height } = image;
	let data = new Uint8ClampedArray(image.data);
	// Neutral gray scan paper is not ink. Only normalize it when many distinct
	// text-like horizontal bands support that interpretation; keep photos intact.
	if (lines.length < 3) {
		let histogram = new Uint32Array(256), samples = 0;
		for (let i = 0; i < data.length; i += 64) {
			let r = data[i], g = data[i + 1], b = data[i + 2]; samples++;
			if (Math.max(r, g, b) - Math.min(r, g, b) < 8) histogram[Math.round((r + g + b) / 3)]++;
		}
		let paper = 160;
		for (let value = 161; value <= 246; value++) if (histogram[value] > histogram[paper]) paper = value;
		let near = histogram.slice(Math.max(0, paper - 3), paper + 4).reduce((sum, n) => sum + n, 0);
		if (near > samples * 0.5) {
			let threshold = Math.max(145, paper - 12), bands = 0, inBand = false;
			for (let y = 0; y < height; y++) {
				let ink = 0;
				for (let x = 0; x < width; x++) {
					let i = (y * width + x) * 4;
					if (Math.min(data[i], data[i + 1], data[i + 2]) < threshold) ink++;
				}
				let textRow = ink > width * 0.015 && ink < width * 0.85;
				if (textRow && !inBand) bands++;
				inBand = textRow;
			}
			if (bands >= 8) {
				for (let i = 0; i < data.length; i += 4) {
					if (Math.min(data[i], data[i + 1], data[i + 2]) >= threshold) data[i] = data[i + 1] = data[i + 2] = 255;
				}
			}
		}
	}
	for (let rect of ignored) {
		let x0 = Math.max(0, Math.floor(rect[0] * width) - 2), y0 = Math.max(0, Math.floor(rect[1] * height) - 2);
		let x1 = Math.min(width, Math.ceil(rect[2] * width) + 2), y1 = Math.min(height, Math.ceil(rect[3] * height) + 2);
		for (let y = y0; y < y1; y++) data.fill(255, (y * width + x0) * 4, (y * width + x1) * 4);
	}
	// Running heads can contain vector separators (Höffe: page number — author)
	// which are absent from the text layer. Clear their band only if no retained
	// text overlaps it; a marginal reference beside body text never clears a row.
	for (let rect of ignored.filter(rect => rect[3] < 0.18)) {
		if (lines.some(line => !ignored.includes(line.rect)
			&& line.rect[1] < rect[3] && line.rect[3] > rect[1])) continue;
		let y0 = Math.max(0, Math.floor(rect[1] * height) - 2);
		let y1 = Math.min(height, Math.ceil(rect[3] * height) + 2);
		data.fill(255, y0 * width * 4, y1 * width * 4);
	}
	// Remove a thin rule belonging to an excluded running header, while keeping
	// the rules above footnotes and tables intact.
	for (let rect of ignored.filter(rect => rect[3] < 0.18)) {
		let next = lines.filter(l => !ignored.includes(l.rect) && l.rect[1] > rect[3] && l.text.length > 15)
			.sort((a, b) => a.rect[1] - b.rect[1])[0];
		if (!next) continue;
		for (let y = Math.ceil(rect[3] * height); y < Math.floor(next.rect[1] * height) - 2; y++) {
			let ink = 0;
			for (let x = 0; x < width; x++) if (data[(y * width + x) * 4] < 235) ink++;
			if (ink > width * 0.5) data.fill(255, y * width * 4, (y + 1) * width * 4);
		}
	}
	// No vertical band trimming: even a one-line footnote is part of the page.
	// A footer may also have a vector rule above it. Search only the small empty
	// strip below ALL retained text, so a real footnote and its separator survive.
	let footers = ignored.filter(rect => rect[1] > 0.92 && lines.some(line => line.rect === rect && !pageNumber(line.text)));
	if (footers.length) {
		let top = Math.min(...footers.map(r => r[1]));
		let retainedBottom = Math.max(0, ...lines.filter(l => !ignored.includes(l.rect)
			&& l.rect[1] < top).map(l => l.rect[3]));
		let start = Math.max(Math.ceil(retainedBottom * height) + 2, Math.floor((top - 0.035) * height));
		let end = Math.floor(top * height) - 2, run = null;
		for (let y = start; y <= end; y++) {
			let ink = 0;
			if (y < end) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4] < 235) ink++;
			if (ink > width * 0.5) { if (run === null) run = y; }
			else if (run !== null) {
				if (y - run <= Math.max(2, height * 0.004)) data.fill(255, run * width * 4, y * width * 4);
				run = null;
			}
		}
	}
	let bounds = getInkBounds({ data, width, height }, { trimVertical: false, trimHorizontal: !options.includeMarginalia });
	return bounds && bounds[2] - bounds[0] > 0.015 && bounds[3] - bounds[1] > 0.015 ? bounds : null;
}

export function getReadingMarginalia(lines, model, pageIndex) {
	let always = new Set(getReadingExclusions(lines, model, pageIndex, { includeMarginalia: true }));
	return getReadingExclusions(lines, model, pageIndex).filter(rect => !always.has(rect));
}

export function buildReadingProfiles(pages) {
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

export function resolveReadingBounds(actual, index, profiles) {
	let profile = profiles.profiles[index % 2] || actual;
	if (!actual || !profile) return actual || profile || [0, 0, 1, 1];
	// Keep a stable reading width, but measure each newly visited page once so
	// a wider table or an unusual footnote cannot be clipped by the samples.
	let center = (profile[0] + profile[2]) / 2, width = profiles.width || profile[2] - profile[0];
	return [Math.min(actual[0], clamp(center - width / 2)), actual[1],
		Math.max(actual[2], clamp(center + width / 2)), actual[3]];
}

export function getReadingFit({ mode, reference, margin, bounds, width, height, pageWidth, pageHeight }) {
	let content = mode === 'content' || reference === 'content' || reference === 'cropped-content';
	let b = content ? bounds : [0, 0, 1, 1];
	let pad = content ? Math.max(0, margin || 0) * Math.min(width, height) : 0;
	let sx = Math.max(1, width - 2 * pad) / ((b[2] - b[0]) * pageWidth);
	let sy = Math.max(1, height - 2 * pad) / ((b[3] - b[1]) * pageHeight);
	let scale = mode === 'width' ? sx : mode === 'height' ? sy : Math.min(sx, sy);
	return { scale: Math.max(0.1, Math.min(10, scale)), bounds: b, pad };
}

export function rotateReadingBounds(b, degrees) {
	switch ((degrees % 360 + 360) % 360) {
		case 90: return [1 - b[3], b[0], 1 - b[1], b[2]];
		case 180: return [1 - b[2], 1 - b[3], 1 - b[0], 1 - b[1]];
		case 270: return [b[1], 1 - b[2], b[3], 1 - b[0]];
		default: return b;
	}
}
