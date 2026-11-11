// Browser caret APIs may return a section's first node for a line gap. Accept
// only text close to the actual pointer. A bounded vertical search bridges the
// line gap without walking or measuring an entire EPUB chapter on each move.
export function nearbyTextCaret(doc, x, y, query) {
    let best = null, distance = Infinity;
    for (const delta of [0,-6,6,-12,12,-24,24]) {
        const pos = query(x,y+delta), node = pos?.offsetNode;
        if (node?.nodeType !== 3 || !node.textContent?.trim() || node.isConnected === false) continue;
        const offset = Math.max(0,Math.min(pos.offset,node.textContent.length));
        const range = doc.createRange();
        range.setStart(node,Math.max(0,Math.min(offset,node.textContent.length-1)));
        range.setEnd(node,Math.min(node.textContent.length,Math.max(1,offset+1)));
        for (const r of range.getClientRects()) {
            if (!(r.width>0 && r.height>0)) continue;
            const dx = Math.max(r.left-x,0,x-r.right), dy = Math.max(r.top-y,0,y-r.bottom);
            const d = Math.hypot(dx,dy);
            if (dx <= Math.max(12,r.height) && dy <= Math.max(12,r.height*.9) && d < distance) {
                best=pos; distance=d;
            }
        }
        if (distance===0) break;
    }
    return best;
}
