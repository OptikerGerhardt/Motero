import { getReadingBounds, getReadingTextBounds, getReadingMarginalia } from './reading-layout.mjs';
import { detectReadingColumns, detectRasterColumns } from './reading-columns.mjs';
import { compactReadingImage } from './reading-image.mjs';

export function analyzeReadingGeometry(page,model) {
    const image=page.image && compactReadingImage(page.image);
    // Text-free alone is insufficient: a scan or illustration is not blank.
    const blank = !page.lines.some(l=>l.text.trim()) && !!image?.data?.length && image.data.every(v=>v>=250);
    if (blank) return {index:page.index,aspect:page.aspect,bounds:[0,0,1,1],withMarginalia:[0,0,1,1],blank:true,marginalia:[],columns:null};
    const boundsFor=options=>page.textOnly ? getReadingTextBounds(page.lines,model,page.index,options)
        : getReadingBounds(image,page.lines,model,page.index,options);
    const marginalia=getReadingMarginalia(page.lines,model,page.index).map(r=>[
        Math.max(0,r[0]-2/page.width),Math.max(0,r[1]-2/page.height),
        Math.min(1,r[2]+2/page.width),Math.min(1,r[3]+2/page.height)]);
    const bounds=boundsFor({});
    return {index:page.index,aspect:page.aspect,bounds,blank:false,marginalia,columns:detectReadingColumns(page.lines,bounds) || (page.lines.length < 6 ? detectRasterColumns(image,bounds) : null),
        withMarginalia:marginalia.length?boundsFor({includeMarginalia:true}):bounds};
}
