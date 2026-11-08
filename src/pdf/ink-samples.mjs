// Input fixes informed by Zotero Reader PR #263; no predicted points are saved.
export function appendInkSamples(path, event, project) {
    // A queued hover from before pointer-down must not become a stroke point.
    if (event.type === 'pointermove' && event.buttons === 0) return;
    let samples;
    try { samples = event.getCoalescedEvents?.() || []; } catch (_) { samples = []; }
    for (const sample of [...samples, event]) {
        const point = project(sample);
        if (!point || point.length < 2 || !point.every(Number.isFinite)) continue;
        if (path.at(-2) !== point[0] || path.at(-1) !== point[1]) path.push(...point);
    }
}
