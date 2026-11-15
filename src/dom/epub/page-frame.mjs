export function pageLineBalance(height, margin, lineHeight) {
    if (!(height > 0 && margin > 0 && lineHeight > 0 && Number.isFinite(lineHeight))) return 0;
    const available = height - margin * 2;
    if (available < lineHeight * 2) return 0;
    return (available - Math.floor((available + .01) / lineHeight) * lineHeight) / 2;
}
