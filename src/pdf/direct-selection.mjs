// Direct word selection includes punctuation physically attached to its final
// word, but never crosses whitespace, a line, a flow, or a display rotation.
export function extendTrailingPunctuation(chars, end) {
    while (end > 0 && end < chars.length) {
        const previous = chars[end - 1], next = chars[end];
        if (previous.spaceAfter || previous.lineBreakAfter || previous.paragraphBreakAfter
                || next.ignorable || !/^[.!?…,;:)\]}’”»›"']+$/u.test(next.c || '')
                || (previous.rotation || 0) !== (next.rotation || 0)
                || previous.flowClass !== next.flowClass) break;
        const a = previous.inlineRect || previous.rect, b = next.inlineRect || next.rect;
        if (!a || !b) break;
        const axis = (previous.rotation || 0) % 180 ? 1 : 0, cross = 1 - axis;
        const height = Math.max(a[cross + 2] - a[cross], b[cross + 2] - b[cross]);
        const overlap = Math.min(a[cross + 2], b[cross + 2]) - Math.max(a[cross], b[cross]);
        const gap = Math.max(b[axis] - a[axis + 2], a[axis] - b[axis + 2], 0);
        if (overlap <= 0 || gap > Math.max(1, height * .35)) break;
        end++;
    }
    return end;
}
