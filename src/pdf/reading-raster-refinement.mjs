export function headerStrip(data, width, height, head, next) {
    const start = Math.ceil(head * height) + 2, end = Math.floor(next * height) - 2;
    let band, strong = false;
    for (let y = start; y <= end; y++) {
        let first = width, last = -1, count = 0, dark = 0;
        if (y < end) for (let x = 0; x < width; x++) {
            if (data[y * width + x] >= 244) continue;
            first = Math.min(first, x); last = x; count++;
            if (data[y * width + x] < 235) dark++;
        }
        if (count > width * .22 && count > (last - first) * .65) {
            if (!band) band = [first, y, last + 1, y + 1];
            else band = [Math.min(band[0], first), band[1], Math.max(band[2], last + 1), y + 1];
            strong ||= dark > width * .5;
        }
        else if (band) {
            if (band[3] - band[1] <= Math.max(2, height * .005)) return {
                kind: 'rule', strong, ink: band, rect: [Math.max(0, band[0]-3)/width, Math.max(start, band[1]-2)/height,
                    Math.min(width, band[2]+3)/width, Math.min(end, band[3]+2)/height]
            };
            band = null;
            strong = false;
        }
    }
    return null;
}

// The patch uses full-page coordinates even though only this rectangle was
// rendered. Reject objects that continue across the patch boundary.
export function inspectCropStrip({ kind, rect }, { width, height, data }) {
    let left = width, top = height, right = 0, bottom = 0, count = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        if (Math.min(data[p], data[p + 1], data[p + 2]) >= 224) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1); count++;
    }
    if (count < 3 || left === 0 || top === 0 || right === width || bottom === height) return null;
    const w = right - left, h = bottom - top;
    if (kind === 'rule' ? w < width * .75 || w < h * 15 || count < w * h * .5
        : Math.max(w, h) > Math.min(w, h) * 4 || count < w * h * .15) return null;
    return [rect[0] + (rect[2] - rect[0]) * left / width, rect[1] + (rect[3] - rect[1]) * top / height,
        rect[0] + (rect[2] - rect[0]) * right / width, rect[1] + (rect[3] - rect[1]) * bottom / height];
}
