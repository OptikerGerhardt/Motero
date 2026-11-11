// PDF.js SpreadMode parity, using zero-based page indices. A cover or final
// unpaired page stays a complete reading unit in its own right.
export function readingUnit(index, count, spreadMode = 0) {
    index = Math.max(0, Math.min(count - 1, index));
    if (!spreadMode || count <= 1) return [index];
    const cover = spreadMode === 2 ? 1 : 0;
    if (index < cover) return [index];
    const first = cover + Math.floor((index - cover) / 2) * 2;
    return first + 1 < count ? [first, first + 1] : [first];
}

export function unitFrame(frames, indices) {
    const pages = indices.map(i => frames[i]).filter(Boolean);
    if (!pages.length) return null;
    return {left:Math.min(...pages.map(p=>p.x ?? p.left)), top:Math.min(...pages.map(p=>p.y ?? p.top)),
        right:Math.max(...pages.map(p=>p.x !== undefined ? p.x+p.width : p.right)), bottom:Math.max(...pages.map(p=>p.y !== undefined ? p.y+p.height : p.bottom))};
}

export function completeReadingUnits(frames, viewport, spreadMode = 0) {
    let count = 0;
    for (let i = 0; i < frames.length;) {
        const indices = readingUnit(i, frames.length, spreadMode), box = unitFrame(frames, indices);
        if (box && box.left >= viewport.left - 2 && box.right <= viewport.right + 2
            && box.top >= viewport.top - 2 && box.bottom <= viewport.bottom + 2) count++;
        i = indices.at(-1) + 1;
    }
    return count;
}
