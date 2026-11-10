const word = character => !!character && /[\p{L}\p{N}\p{M}_]/u.test(character);
const punctuation = character => !!character && /[.,;:!?»”’"')\]]/u.test(character);
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;

export function wordOffsets(text, offset) {
    offset = Math.min(offset, text.length - 1);
    if (!word(text[offset]) && word(text[offset - 1])) offset--;
    if (!word(text[offset])) return null;
    let start = offset, end = offset + 1;
    if (segmenter) {
        const segment = segmenter.segment(text).containing(offset);
        if (segment) { start = segment.index; end = segment.index + segment.segment.length; }
    } else {
        while (start > 0 && word(text[start - 1])) start--;
        while (end < text.length && word(text[end])) end++;
    }
    while (punctuation(text[end])) end++;
    return [start, end];
}

// Joining only the containing paragraph preserves words split by inline emphasis.
// Bound work for malformed books with enormous paragraphs.
export function wordRange(caret) {
    const doc = caret.startContainer.ownerDocument, node = caret.startContainer;
    let root = node.parentElement?.closest('p,li,h1,h2,h3,h4,h5,h6,td,pre,blockquote') || node;
    let nodes = [], size = 0;
    if (root.nodeType === 3) nodes = [root];
    else {
        const walker = doc.createTreeWalker(root, 4);
        while (walker.nextNode()) {
            nodes.push(walker.currentNode); size += walker.currentNode.length;
            if (nodes.length > 256 || size > 20000) { nodes = [node]; break; }
        }
    }
    let offset = caret.startOffset;
    for (const item of nodes) { if (item === node) break; offset += item.length; }
    const bounds = wordOffsets(nodes.map(n => n.textContent).join(''), offset);
    if (!bounds) return null;
    const range = doc.createRange();
    for (let side = 0; side < 2; side++) {
        let remaining = bounds[side];
        for (const item of nodes) {
            if (remaining <= item.length) {
                if (side === 0) range.setStart(item, remaining); else range.setEnd(item, remaining);
                break;
            }
            remaining -= item.length;
        }
    }
    return range;
}
