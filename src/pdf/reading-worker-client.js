import { analyzeReadingGeometry } from './reading-geometry.mjs';

// One worker per document. Concurrent foreground/model requests can share a
// raster promise: transfer that image once, then reference its compact plane
// until the final dependent analysis finishes. Nothing is retained afterward.
export class ReadingAnalysisWorker {
    constructor() {
        this.pending = new Map();
        this.images = new WeakMap();
        this.serial = 0;
        this.imageSerial = 0;
    }

    async init() {
        if (this.closed || this.failed || typeof Worker === 'undefined') return null;
        if (this.ready) return this.ready;
        this.ready = new Promise(resolve => {
            this.resolveReady = resolve;
            const fail = () => { this.fail(); resolve(null); };
            try {
                this.worker = new Worker(new URL('./reading-analysis-worker.js', import.meta.url));
                this.initTimer = setTimeout(fail, 3000);
                this.worker.onerror = fail;
                this.worker.onmessageerror = fail;
                this.worker.onmessage = ({ data }) => {
                    if (data.ready) {
                        clearTimeout(this.initTimer);
                        this.resolveReady = null;
                        resolve(this.worker);
                        return;
                    }
                    const job = this.pending.get(data.id);
                    if (!job) return;
                    if (data.error) { this.fail(data.error); return; }
                    this.pending.delete(data.id);
                    this.active = null;
                    this.releaseImage(job);
                    job.resolve(data.result);
                    this.drain();
                };
            } catch (_) { fail(); }
        });
        return this.ready;
    }

    fail(message = 'Crop analysis worker unavailable') {
        clearTimeout(this.initTimer);
        this.resolveReady?.(null);
        this.resolveReady = null;
        this.failed = true;
        this.worker?.terminate();
        this.worker = null;
        const error = new Error(message);
        error.name = 'ReadingWorkerError';
        for (const job of this.pending.values()) job.reject(error);
        this.pending.clear();
        this.images = new WeakMap();
    }

    async analyze(page, model) {
        const worker = await this.init();
        if (this.closed) {
            const error = new Error('Crop analysis closed');
            error.name = 'AbortError';
            throw error;
        }
        if (!worker || this.failed) return analyzeReadingGeometry(page, model);
        let image;
        if (page.image) {
            image = this.images.get(page.image);
            if (!image) {
                if (!page.image.data.byteLength) {
                    const error = new Error('Crop raster ownership expired');
                    error.name = 'ReadingWorkerError';
                    throw error;
                }
                image = { id: ++this.imageSerial, source: page.image, refs: 0, sent: false };
                this.images.set(page.image, image);
            }
            image.refs++;
        }
        const id = ++this.serial;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject, page, model, image });
            this.drain();
        });
    }

    releaseImage(job) {
        const image = job.image;
        if (!image || --image.refs > 0) return;
        this.images.delete(image.source);
        if (image.sent) this.worker?.postMessage({ releaseImage: image.id });
    }

    drain() {
        if (!this.worker || this.active != null || this.failed || this.closed) return;
        const next = [...this.pending].sort((a,b) => (a[1].page.priority || 0) - (b[1].page.priority || 0))[0];
        if (!next) return;
        const [id, job] = next;
        this.active = id;
        const { image, model } = job;
        const transfer = image && !image.sent ? [image.source.data.buffer] : [];
        const page = { ...job.page, image: image && !image.sent ? image.source : undefined };
        try {
            this.worker.postMessage({ id, page, model, imageID: image?.id }, transfer);
            if (image) image.sent = true;
        } catch (error) {
            this.fail(String(error?.message || error));
        }
    }

    cancelWhere(predicate) {
        for (const [id, job] of this.pending) {
            if (id === this.active || !predicate(job.page.index, job.page.priority || 0)) continue;
            const error = new Error('Crop analysis superseded');
            error.name = 'AbortError';
            this.pending.delete(id);
            this.releaseImage(job);
            job.reject(error);
        }
    }

    close() { this.closed = true; this.fail(); }
}
