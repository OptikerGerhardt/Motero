// A text scan has many separated rows at roughly the same pitch. Require that
// evidence before treating light colored or shaded pixels as paper.
export function analyzeTextScan({ data, width, height }) {
    if (width < 64 || height < 64) return null;
    const tileSize = 48;
    const columns = Math.ceil(width / tileSize), rows = Math.ceil(height / tileSize);
    const paper = new Uint8Array(columns * rows);
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const values = [];
            for (let y = row * tileSize; y < Math.min((row + 1) * tileSize, height); y += 4) {
                for (let x = column * tileSize; x < Math.min((column + 1) * tileSize, width); x += 4) values.push(data[y * width + x]);
            }
            paper[row * columns + column] = values.sort((a, b) => a - b)[Math.floor(values.length * .8)];
        }
    }
    const light = paper.filter(value => value >= 175);
    if (light.length < paper.length * .6) return null;
    const foldInk = new Uint32Array(width), profile = new Uint32Array(height);
    const normalized = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
        const tileRow = Math.floor(y / tileSize) * columns;
        for (let x = 0; x < width; x++) {
            const p = y * width + x;
            const local = paper[tileRow + Math.floor(x / tileSize)];
            // Keep dark or detailed tiles intact. A narrow continuous fold is
            // handled separately after proving there is text next to it.
            const ink = local < 175 || data[p] < Math.min(244, local - 15);
            normalized[p] = ink ? data[p] : 255;
            if (ink && data[p] < 175) {
                foldInk[x]++;
                if (x > width * .12 && x < width * .88) profile[y]++;
            }
        }
    }
    const bands = [];
    let start = -1;
    for (let y = 0; y <= height; y++) {
        if (profile[y] > width * .015 && profile[y] < width * .7) {
            if (start < 0) start = y;
        }
        else if (start >= 0) {
            if (y - start <= height * .045) bands.push({start,end:y});
            start = -1;
        }
    }
    const heights = bands.map(band=>band.end-band.start).sort((a,b)=>a-b);
    const substantial = bands.filter(band=>band.end-band.start >= Math.max(3,heights[Math.floor(heights.length*.75)]*.45));
    if (substantial.length < 8) return null;
    const pitches = substantial.slice(1).map((band, i) => band.start - substantial[i].start).sort((a, b) => a - b);
    const pitch = pitches[Math.floor(pitches.length / 2)];
    if (pitches.filter(p => Math.abs(p - pitch) <= Math.max(2, pitch * .25)).length < 6) return null;

    // Remove a fold only if the dark stripe touches the paper edge and a light
    // gutter separates it from the rest. Keep isolated marks after the gutter.
    for (const direction of [1, -1]) {
        const column = offset => direction === 1 ? offset : width - 1 - offset;
        let size = 0;
        while (size < width * .12 && foldInk[column(size)] > height * .86) size++;
        const gutter = Math.max(2, Math.round(width * .008));
        if (size < 2 || size + gutter >= width * .12) continue;
        if (Array.from({ length: gutter }, (_, i) => foldInk[column(size + i)]).some(count => count > height * .05)) continue;
        for (let y = 0; y < height; y++) {
            const start = direction === 1 ? 0 : width - size;
            normalized.fill(255, y * width + start, y * width + start + size);
        }
    }
    const central = substantial.filter(band => band.start > height*.12 && band.end < height*.9);
    const columnUse = new Uint16Array(width);
    for (const band of central) {
        for (let x = 0; x < width; x++) {
            for (let y = band.start; y < band.end; y++) {
                if (normalized[y*width+x] < 175) { columnUse[x]++; break; }
            }
        }
    }
    const minimumUse = Math.max(3, Math.ceil(central.length*.24));
    const left = columnUse.findIndex(value => value >= minimumUse), right = columnUse.findLastIndex(value => value >= minimumUse);
    if (central.length < 8 || left < 0 || right-left < width*.4) return {data:normalized};

    const body = {left:left/width,right:(right+1)/width,top:central[0].start/height,bottom:central.at(-1).end/height,
        lineHeight:pitch*.68/height};
    const [head,next] = substantial;
    const typicalHeight = heights[Math.floor(heights.length*.75)];
    const running = head.end < height*.19 && next.start-head.end >= pitch*.95
        && head.end-head.start <= Math.max(pitch*.73,typicalHeight)
        ? detectScannedHead(normalized,width,height,head,body) : null;
    if (running) body.top=next.start/height;
    return {data:normalized,body,running};
}

function detectScannedHead(data,width,height,band,body) {
    const minGap=Math.max(2,Math.round(width*.055));
    const spans=[];
    for (let x=0;x<width;x++) {
        let ink=false;
        for (let y=band.start;y<band.end;y++) if (data[y*width+x]<175) { ink=true; break; }
        if (!ink) continue;
        const previous=spans.at(-1);
        if (previous && x-previous[1]<minGap) previous[1]=x+1;
        else spans.push([x,x+1]);
    }
    if (spans.length<2 || spans.length>4) return null;
    const first=spans[0], last=spans.at(-1);
    const leftFolio=(first[1]-first[0])/width<=.085 && first[0]/width<=body.left+.045;
    const rightFolio=(last[1]-last[0])/width<=.085 && last[1]/width>=body.right-.045;
    if (leftFolio===rightFolio) return null;
    const titleStart=leftFolio?spans[1][0]:first[0], titleEnd=rightFolio?spans.at(-2)[1]:last[1];
    const titleCenter=(titleStart+titleEnd)/(2*width);
    if (titleStart<width*.21 || titleEnd>width*.79 || titleCenter<=.30 || titleCenter>=.70
        || (titleEnd-titleStart)/width<=.105) return null;
    // Include the light anti-aliased edges of both printed members.
    return [Math.max(0,spans[0][0]-2)/width,Math.max(0,band.start-2)/height,
        Math.min(width,spans[1][1]+2)/width,Math.min(height,band.end+2)/height];
}
