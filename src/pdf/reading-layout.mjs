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

// Use the rendered viewport transform, including PDF CropBox and rotation.
export function getReadingTextLines(content, viewport) {
	let v = viewport.transform, spans = [];
	for (let item of content?.items || []) {
		if (!item.str?.trim() || !item.transform || !item.width) continue;
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
		spans.push({ text: item.str.trim(), rect, vertical: Math.abs(dy) > Math.abs(dx) });
	}
	spans.sort((a, b) => a.rect[1] - b.rect[1] || a.rect[0] - b.rect[0]);
	let lines = [];
	for (let span of spans) {
		let [x0, y0, x1, y1] = span.rect;
		let row = [...lines].reverse().find(line => !span.vertical && !line.vertical
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

export function buildReadingModel(pages) {
	let occurrences = new Map();
	let headerCandidates = [];
	for (let page of pages) {
		let bodyHeights = page.lines.filter(l => l.rect[1] > 0.18 && l.rect[3] < 0.8 && l.text.length > 20)
			.map(l => l.rect[3] - l.rect[1]).sort((a, b) => a - b);
		let bodyHeight = bodyHeights[Math.floor(bodyHeights.length / 2)] || 0;
		for (let line of page.lines) {
			let [, y0, , y1] = line.rect;
			if (bodyHeight && y1 < 0.15 && line.text.length > 4 && y1 - y0 < bodyHeight * 1.05) {
				let next = page.lines.filter(l => l.rect[1] > y1 && l.text.length > 15)
					.sort((a, b) => a.rect[1] - b.rect[1])[0];
				if (next && next.rect[1] - y1 > (y1 - y0) * 0.8) headerCandidates.push({ index: page.index, y0, y1 });
			}
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
		.filter(other => Math.abs(other.y0 - candidate.y0) < 0.008 && Math.abs(other.y1 - candidate.y1) < 0.008)
		.map(other => other.index)).size >= Math.max(3, Math.ceil(pages.length / 2)));
	return { repeated, headerBands };
}

export function getReadingExclusions(lines, model = { repeated: new Set() }) {
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
		if (y1 < 0.15 && (model.repeated.has(normalize(line.text))
				|| model.headerBands?.some(band => Math.abs(band.y0 - y0) < 0.008 && Math.abs(band.y1 - y1) < 0.008))) {
			let next = lines.filter(other => other !== line && other.rect[1] > y1
				&& other.rect[0] < 0.85 && other.rect[2] > 0.15)
				.sort((a, b) => a.rect[1] - b.rect[1])[0];
			if (next && next.rect[1] - y1 > (y1 - y0) * 0.65) excluded.add(line);
		}
	}
	// A JSTOR URL can be a legitimate footnote. Remove continuation lines only
	// when they are attached to an identified download/terms block.
	let stamps = [...excluded].filter(line => downloadStamp(line.text));
	for (let line of lines) {
		if (!/^(?:https?:\/\/|terms\s*(?:and|&)\s*conditions)/i.test(line.text.trim())) continue;
		if (stamps.some(stamp => line.rect[1] >= stamp.rect[1] - 0.005
			&& line.rect[1] - stamp.rect[3] < 0.05)) excluded.add(line);
	}
	let numbers = lines.filter(line => /^\d{1,3}$/.test(line.text) && line.rect[2] - line.rect[0] < 0.045);
	for (let line of numbers) {
		let [x0, , x1] = line.rect;
		let column = numbers.filter(other => Math.abs(other.rect[0] - x0) < 0.012);
		if (column.length < 3 || Math.max(...column.map(l => l.rect[3])) - Math.min(...column.map(l => l.rect[1])) < 0.2) continue;
		let neighbors = lines.filter(other => !column.includes(other) && other.text.length > 15
			&& other.rect[1] < 0.92 && other.rect[3] > 0.12);
		if (neighbors.length >= 3 && neighbors.every(other => other.rect[0] > x1 + 0.012
			|| other.rect[2] < x0 - 0.012)) column.forEach(item => excluded.add(item));
	}
	// Edition references occupy a separate narrow outer column, never an
	// arbitrary number inside an equation or a footnote citation.
	for (let line of lines) {
		if (!/^(?:(?:AA|Ak\.?)\s*)?(?:[IVXLC]+|\d{1,3})\s*[:,.]\s*\d{1,4}$|^[AB]\s*\d{1,4}(?:\s*[/–-]\s*[AB]?\s*\d{1,4})?$/i.test(line.text)) continue;
		let [x0, y0, x1, y1] = line.rect;
		if (x1 - x0 > 0.10) continue;
		let body = lines.filter(other => other.text.length > 20 && other.rect[1] < y1 + 0.03 && other.rect[3] > y0 - 0.03);
		if (body.length && body.every(other => other.rect[0] > x1 + 0.012 || other.rect[2] < x0 - 0.012)) excluded.add(line);
	}
	return [...excluded].map(line => line.rect);
}

export function getReadingBounds(image, lines, model) {
	let ignored = getReadingExclusions(lines, model);
	let { width, height } = image;
	let data = new Uint8ClampedArray(image.data);
	for (let rect of ignored) {
		let x0 = Math.max(0, Math.floor(rect[0] * width) - 2), y0 = Math.max(0, Math.floor(rect[1] * height) - 2);
		let x1 = Math.min(width, Math.ceil(rect[2] * width) + 2), y1 = Math.min(height, Math.ceil(rect[3] * height) + 2);
		for (let y = y0; y < y1; y++) data.fill(255, (y * width + x0) * 4, (y * width + x1) * 4);
	}
	// Remove a thin rule belonging to an excluded running header, while keeping
	// the rules above footnotes and tables intact.
	for (let rect of ignored.filter(rect => rect[3] < 0.15)) {
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
	let bounds = getInkBounds({ data, width, height }, { trimVertical: false });
	return bounds && bounds[2] - bounds[0] > 0.015 && bounds[3] - bounds[1] > 0.015 ? bounds : null;
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
	let content = mode === 'content' || reference === 'content';
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
