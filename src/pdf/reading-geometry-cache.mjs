// View geometry only. No PDF text, images, annotation data or credentials.
const KEY = 'motero.reading-geometry.v2';
const VERSION = 2;
const validBounds = b => Array.isArray(b) && b.length === 4 && b.every(n => Number.isFinite(n) && n >= 0 && n <= 1)
    && b[0] < b[2] && b[1] < b[3];
export function validGeometry(page) {
    return page && Number.isInteger(page.index) && page.index >= 0 && Number.isFinite(page.aspect) && page.aspect > 0
        && validBounds(page.bounds) && validBounds(page.withMarginalia)
        && Array.isArray(page.marginalia) && page.marginalia.every(validBounds);
}
function numericLearning(value) {
    if (!value || !Number.isFinite(value.aspect) || value.aspect <= 0) return null;
    const profiles = p => p && Array.isArray(p.profiles) && p.profiles.length === 2
        && p.profiles.every(b => b === null || validBounds(b)) && Number.isFinite(p.width) && p.width >= 0 && p.width <= 1
        ? { profiles: p.profiles, width: p.width } : null;
    const normal = profiles(value.profiles), margins = profiles(value.withMarginalia);
    if (!normal || !margins) return null;
    const bands = name => (Array.isArray(value.model?.[name]) ? value.model[name] : []).slice(0, 128)
        .filter(b => Number.isFinite(b.y0) && Number.isFinite(b.y1) && b.y0 >= 0 && b.y1 <= 1 && b.y0 < b.y1)
        .map(b => Object.fromEntries(Object.entries(b).filter(([k,v]) => ['y0','y1','parity','offset','index'].includes(k) && Number.isFinite(v))));
    return { aspect: value.aspect, profiles: normal, withMarginalia: margins,
        model: { bodyHeight: Number.isFinite(value.model?.bodyHeight) ? value.model.bodyHeight : 0,
            headerBands: bands('headerBands'), footerBands: bands('footerBands'), folioBands: bands('folioBands') } };
}
export class ReadingGeometryCache {
    constructor(storage, fingerprint, count) {
        this.storage = storage;
        this.id = fingerprint ? fingerprint + ':' + count : null;
        this.count = count;
        this.documents = {};
        try {
            const raw = storage?.getItem(KEY);
            if (raw?.length < 524288) {
                const data = JSON.parse(raw);
                if (data?.version === VERSION && data.documents && typeof data.documents === 'object') this.documents = data.documents;
            }
        } catch (_) { /* Storage can be disabled or full. */ }
        const saved = this.id && Object.hasOwn(this.documents, this.id) ? this.documents[this.id] : null;
        this.pages = new Map((Array.isArray(saved?.pages) ? saved.pages : [])
            .filter(p => validGeometry(p) && p.index < count).map(p => [p.index, p]));
        this.learning = numericLearning(saved?.learning);
    }
    get(index) { return this.pages.get(index); }
    setLearning(value) { this.learning = numericLearning(value); }
    put(page) {
        if (!validGeometry(page) || page.index >= this.count) return;
        this.pages.delete(page.index);
        this.pages.set(page.index, { index: page.index, aspect: page.aspect, bounds: page.bounds,
            withMarginalia: page.withMarginalia, marginalia: page.marginalia });
        while (this.pages.size > 128) this.pages.delete(this.pages.keys().next().value);
    }
    flush() {
        if (!this.id || !this.storage) return;
        this.documents[this.id] = { accessed: Date.now(), pages: [...this.pages.values()], learning: this.learning };
        let ids = Object.keys(this.documents).sort((a,b) => this.documents[b].accessed - this.documents[a].accessed);
        const selected = Object.fromEntries(ids.slice(0, 6).map(id => [id, this.documents[id]]));
        try { this.storage.setItem(KEY, JSON.stringify({ version: VERSION, documents: selected })); }
        catch (_) { /* Geometry caching must never prevent reading. */ }
    }
}
