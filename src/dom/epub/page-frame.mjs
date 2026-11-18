export function pageLineBalance(height, margin, lineHeight, bottom = margin) {
    if (!(height > 0 && margin >= 0 && bottom >= 0 && lineHeight > 0 && Number.isFinite(lineHeight))) return 0;
    if (margin === 0 && bottom === 0) return 0;
    const available = height - margin - bottom;
    if (available < lineHeight * 2) return 0;
    return (available - Math.floor((available + .01) / lineHeight) * lineHeight) / 2;
}
