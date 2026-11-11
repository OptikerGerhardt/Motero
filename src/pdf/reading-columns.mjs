// Conservative text-geometry detection; never splits scans without a text layer.
// Rectangles stay normalized in the original PDF coordinate plane.
export function detectReadingColumns(lines, bounds) {
    if (!bounds || !Array.isArray(lines)) return null;
    const body = lines.filter(l => !l.vertical && !l.sideCandidate && l.text?.trim().length >= 10
        && l.rect[2] - l.rect[0] > .12 && l.rect[3] - l.rect[1] < .06
        && l.rect[0] >= bounds[0] - .01 && l.rect[2] <= bounds[2] + .01
        && l.rect[1] >= bounds[1] - .01 && l.rect[3] <= bounds[3] + .01);
    if (body.length < 14 || body.length > 1200) return null;
    let best;
    for (let split = .32; split <= .68; split += .01) {
        const left = body.filter(l => l.rect[2] < split - .005);
        const right = body.filter(l => l.rect[0] > split + .005);
        if (left.length < 6 || right.length < 6 || left.length + right.length < body.length * .84) continue;
        const a = [Math.min(...left.map(l=>l.rect[0])),Math.min(...left.map(l=>l.rect[1])),Math.max(...left.map(l=>l.rect[2])),Math.max(...left.map(l=>l.rect[3]))];
        const b = [Math.min(...right.map(l=>l.rect[0])),Math.min(...right.map(l=>l.rect[1])),Math.max(...right.map(l=>l.rect[2])),Math.max(...right.map(l=>l.rect[3]))];
        const gap = b[0]-a[2], overlap = Math.min(a[3],b[3])-Math.max(a[1],b[1]);
        const widths = [a[2]-a[0], b[2]-b[0]];
        if (gap < .018 || gap > .16 || Math.min(...widths) < .2 || Math.max(...widths)/Math.min(...widths)>1.6
            || overlap < .28 || overlap < Math.max(a[3]-a[1],b[3]-b[1])*.55) continue;
        const aligned = left.filter(l => right.some(r => Math.abs(l.rect[1]+l.rect[3]-r.rect[1]-r.rect[3])/2
            < Math.max(l.rect[3]-l.rect[1],r.rect[3]-r.rect[1])*.8)).length;
        if (aligned < Math.min(left.length,right.length)*.5) continue;
        // Full-width body prose is evidence against a real two-column page.
        const crossing = body.filter(l => l.rect[0]<split && l.rect[2]>split);
        if (crossing.some(l => (l.rect[1]+l.rect[3])/2 > Math.max(a[1],b[1])+.04
                && (l.rect[1]+l.rect[3])/2 < Math.min(a[3],b[3])-.04)) continue;
        const score = Math.min(left.length,right.length)*overlap;
        if (!best || score>best.score) best = {score,columns:[[bounds[0],bounds[1],a[2],bounds[3]],[b[0],bounds[1],bounds[2],bounds[3]]]};
    }
    return best?.columns || null;
}

// Scan fallback: a long empty gutter plus repeated text-like row bands on BOTH
// sides. Runs on the existing compact analysis plane; no OCR or extra rendering.
export function detectRasterColumns(image, bounds) {
    if (!image || !bounds || image.channels !== 1) return null;
    const {width,height,data}=image;
    const x0=Math.max(0,Math.floor(bounds[0]*width)),x1=Math.min(width,Math.ceil(bounds[2]*width));
    const y0=Math.max(0,Math.floor(bounds[1]*height)),y1=Math.min(height,Math.ceil(bounds[3]*height));
    if (x1-x0<100 || y1-y0<160) return null;
    let paper=255;
    if (image.histogram) for(let v=160;v<256;v++) if(image.histogram[v]>image.histogram[paper]) paper=v;
    const threshold=Math.min(180,paper-24),projection=new Uint32Array(width);
    let ink=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[y*width+x]<threshold){projection[x]++;ink++;}
    const density=ink/((x1-x0)*(y1-y0));
    if(density<.008 || density>.22) return null;
    let start=null,best=null;
    for(let x=Math.max(x0,Math.floor(width*.32));x<=Math.min(x1,Math.ceil(width*.68));x++){
        if(projection[x]<(y1-y0)*.012){start??=x;continue;}
        if(start!==null){if(!best || x-start>best[1]-best[0])best=[start,x];start=null;}
    }
    if(!best || best[1]-best[0]<width*.025 || best[1]-best[0]>width*.16) return null;
    const regions=[[x0,best[0]],[best[1],x1]],widths=regions.map(([a,b])=>b-a);
    if(Math.min(...widths)<width*.2 || Math.max(...widths)/Math.min(...widths)>1.6) return null;
    for(const [a,b] of regions){
        let bands=0,run=0,first=null,last=0;
        for(let y=y0;y<=y1;y++){
            let count=0;
            if(y<y1)for(let x=a;x<b;x++)if(data[y*width+x]<threshold)count++;
            const row=count>(b-a)*.02 && count<(b-a)*.6;
            if(row){run++;first??=y;last=y;}
            else if(run){if(run>=2 && run<height*.045)bands++;run=0;}
        }
        if(bands<12 || last-first<(y1-y0)*.45) return null;
    }
    return [[bounds[0],bounds[1],best[0]/width,bounds[3]],[best[1]/width,bounds[1],bounds[2],bounds[3]]];
}
