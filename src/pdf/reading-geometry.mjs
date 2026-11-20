import { getReadingBounds, getReadingTextBounds, classifyReadingElements, getRasterMarginalia } from './reading-layout.mjs';
import { detectReadingColumns, detectRasterColumns } from './reading-columns.mjs';
import { compactReadingImage } from './reading-image.mjs';
import { analyzeTextScan } from './reading-scan-paper.mjs';

function pageKind(lines, bounds, columns) {
    if (columns) return 'columns';
    if (!lines.length) return 'scan';
    const prose = lines.filter(line => !line.sideCandidate && !line.vertical && line.text.length > 30
        && line.rect[2] - line.rect[0] > .28 && line.rect[1] >= (bounds?.[1] ?? 0) - .005);
    if (prose.length < 5) return lines.length >= 10 ? 'short-lines' : 'sparse';
    let first = prose.reduce((a, b) => a.rect[1] <= b.rect[1] ? a : b);
    const height = first.rect[3] - first.rect[1];
    if (first.rect[1] > .24 || lines.some(line => !line.sideCandidate && line.text.length > 3
            && line.rect[1] >= (bounds?.[1] ?? 0) - .005 && line.rect[3] + height < first.rect[1]
            && line.rect[3] - line.rect[1] >= height * 1.18)) return 'opening';
    return 'prose';
}

export function analyzeReadingGeometry(page,model) {
    const image=page.image && compactReadingImage(page.image);
    // Text-free alone is insufficient: a scan or illustration is not blank.
    const blank = !page.lines.some(l=>l.text.trim()) && !!image?.data?.length && image.data.every(v=>v>=250);
    if (blank) return {index:page.index,aspect:page.aspect,bounds:[0,0,1,1],withMarginalia:[0,0,1,1],blank:true,marginalia:[],columns:null};
    const boundsFor=options=>page.textOnly ? getReadingTextBounds(page.lines,model,page.index,options)
        : getReadingBounds(image,page.lines,model,page.index,options);
    const evidence = { strips: [] };
    const classification = classifyReadingElements(page.lines,model,page.index,image);
    const scan = image && page.lines.length-classification.running.length < 3 ? analyzeTextScan(image) : null;
    const rasterMarks = [...getRasterMarginalia(image,page.lines,page.inspected ? null : evidence.strips,scan), ...(page.rasterMarks || [])];
    const marginalia=[...classification.marginalia,...rasterMarks].map(r=>[
        Math.max(0,r[0]-2/page.width),Math.max(0,r[1]-2/page.height),
        Math.min(1,r[2]+2/page.width),Math.min(1,r[3]+2/page.height)]);
    const options = { evidence, classification, inspected: page.inspected, rasterMarks, rasterRules: page.rasterRules, scan };
    const bounds=boundsFor(options);
    const columns=detectReadingColumns(page.lines,bounds) || (page.lines.length < 6 ? detectRasterColumns(image,bounds) : null);
    return {index:page.index,aspect:page.aspect,bounds,blank:false,marginalia,columns,kind:scan?.body && !columns ? 'scan' : pageKind(page.lines,bounds,columns),
        withMarginalia:marginalia.length?boundsFor({...options,includeMarginalia:true,evidence:null}):bounds,
        strips:evidence.strips,
        ...(page.diagnostics && {diagnostics:{running:evidence.running || [],marginalia,detected:bounds}})};
}
