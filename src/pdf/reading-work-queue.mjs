// One document owns this queue. Pending work is deduplicated independently of
// the bounded result cache, so rapid navigation cannot spawn duplicate renders.
export class ReadingWorkQueue {
    constructor(limit = 2) { this.limit = limit; this.jobs = new Map(); this.running = 0; this.closed = false; }
    run(key, operation, priority = 0) {
        let job = this.jobs.get(key);
        if (job && !job.controller.signal.aborted) { job.priority = Math.min(job.priority, priority); this.drain(); return job.promise; }
        if (this.closed) return Promise.reject(this.abortError());
        job = { key, operation, priority, controller: new AbortController(), started: false };
        job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
        this.jobs.set(key, job); this.drain(); return job.promise;
    }
    abortError() { const error = new Error('Reading work cancelled'); error.name = 'AbortError'; return error; }
    cancelWhere(predicate) {
        for (const job of this.jobs.values()) if (predicate(job.key)) {
            job.controller.abort();
            if (!job.started) { this.jobs.delete(job.key); job.reject(this.abortError()); }
        }
    }
    drain() {
        if (this.closed) return;
        const waiting = [...this.jobs.values()].filter(j => !j.started).sort((a,b) => a.priority-b.priority);
        while (this.running < this.limit && waiting.length) {
            // Reserve one slot for the current reading page. Background model and
            // prefetch jobs cannot occupy both workers ahead of a user's turn.
            const next = waiting.findIndex(job => job.priority <= 0 || [...this.jobs.values()].filter(j=>j.started && j.priority>0).length < Math.max(1,this.limit-1));
            if (next < 0) break;
            const [job] = waiting.splice(next,1); job.started = true; this.running++;
            Promise.resolve().then(() => job.operation(job.controller.signal)).then(job.resolve, job.reject).finally(() => {
                if (this.jobs.get(job.key) === job) this.jobs.delete(job.key);
                this.running--; this.drain();
            });
        }
    }
    close() { this.closed = true; this.cancelWhere(() => true); }
}
