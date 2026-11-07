// Rectangles are fractions of the natural PDF page, before user view rotation.
const scopes = ['all', 'odd', 'even'];
export function validCrop(rect) {
	return Array.isArray(rect) && rect.length === 4 && rect.every(Number.isFinite)
		&& rect[0] >= 0 && rect[1] >= 0 && rect[2] <= 1 && rect[3] <= 1
		&& rect[2] - rect[0] >= 0.02 && rect[3] - rect[1] >= 0.02;
}
export function normalizeCrops(value) {
	let result = {};
	for (let key of scopes) if (validCrop(value?.[key])) result[key] = [...value[key]];
	return result;
}
export function cropForPage(crops, index) {
	let value = normalizeCrops(crops);
	return value[index % 2 === 0 ? 'odd' : 'even'] || value.all || null;
}
export function updateCrop(crops, scope, rect) {
	if (!scopes.includes(scope) || !validCrop(rect)) throw new Error('Invalid manual crop');
	// An explicit all-pages crop replaces both parity overrides.
	return scope === 'all' ? { all: [...rect] } : { ...normalizeCrops(crops), [scope]: [...rect] };
}
export function dragCrop(rect, handle, dx, dy) {
	let r = [...rect];
	if (handle === 'move') {
		dx = Math.max(-r[0], Math.min(1 - r[2], dx));
		dy = Math.max(-r[1], Math.min(1 - r[3], dy));
		return [r[0] + dx, r[1] + dy, r[2] + dx, r[3] + dy];
	}
	if (handle.includes('w')) r[0] = Math.max(0, Math.min(r[2] - .02, r[0] + dx));
	if (handle.includes('e')) r[2] = Math.min(1, Math.max(r[0] + .02, r[2] + dx));
	if (handle.includes('n')) r[1] = Math.max(0, Math.min(r[3] - .02, r[1] + dy));
	if (handle.includes('s')) r[3] = Math.min(1, Math.max(r[1] + .02, r[3] + dy));
	return r;
}
