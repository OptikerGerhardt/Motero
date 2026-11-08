// Resolve reading intent from the viewport, never from a fragment under a tap.
export function centeredPage(pages, viewport, fallback = 0) {
    const x = (viewport.left + viewport.right) / 2, y = (viewport.top + viewport.bottom) / 2;
    const candidates = pages.filter(p => p.right > viewport.left && p.left < viewport.right
        && p.bottom > viewport.top && p.top < viewport.bottom);
    candidates.sort((a, b) => {
        const score = p => Math.hypot(Math.max(p.left - x, 0, x - p.right), Math.max(p.top - y, 0, y - p.bottom));
        const area = p => (Math.min(p.right, viewport.right) - Math.max(p.left, viewport.left))
            * (Math.min(p.bottom, viewport.bottom) - Math.max(p.top, viewport.top));
        return score(a) - score(b) || Math.hypot((a.left+a.right)/2-x,(a.top+a.bottom)/2-y)
            - Math.hypot((b.left+b.right)/2-x,(b.top+b.bottom)/2-y) || area(b)-area(a) || a.index-b.index;
    });
    return candidates[0]?.index ?? fallback;
}
export function completePages(pages, viewport) {
    return pages.filter(p => p.left >= viewport.left - 2 && p.right <= viewport.right + 2
        && p.top >= viewport.top - 2 && p.bottom <= viewport.bottom + 2).length;
}
