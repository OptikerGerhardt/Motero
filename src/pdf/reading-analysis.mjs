import { OPS } from '../../pdfjs/pdf.js/src/shared/util.js';

// Fail closed: any painted path, image, form, mask or unknown operator keeps
// raster analysis. This shortcut must never discard an illustration or scan.
const textOperators = new Set([
    OPS.dependency, OPS.save, OPS.restore, OPS.transform,
    OPS.setLineWidth, OPS.setLineCap, OPS.setLineJoin, OPS.setMiterLimit, OPS.setDash,
    OPS.setRenderingIntent, OPS.setFlatness,
    ...Array.from({length:31},(_,i)=>OPS.beginText+i),
    OPS.markPoint, OPS.markPointProps, OPS.beginMarkedContent, OPS.beginMarkedContentProps,
    OPS.endMarkedContent, OPS.beginCompat, OPS.endCompat,
]);
export function canUseTextBounds(operators, lines) {
    if (!operators?.fnArray?.length || !Array.isArray(operators.argsArray)
            || lines.filter(l=>!l.vertical && l.text.length>20).length < 6) return false;
    return operators.fnArray.every((op,i)=>textOperators.has(op)
        && (op!==OPS.setTextRenderingMode || operators.argsArray[i]?.[0]===0));
}

// Bounded, local numeric timings only. No document text or telemetry is stored.
export class ReadingMetrics {
    constructor(clock = globalThis.performance) { this.clock=clock; this.stages=new Map(); }
    now() { return this.clock?.now?.() ?? Date.now(); }
    record(stage, start) {
        const duration=Math.max(0,this.now()-start);
        let entry=this.stages.get(stage);
        if (!entry) this.stages.set(stage,entry={count:0,total:0,samples:[]});
        entry.count++; entry.total+=duration; entry.samples.push(duration);
        if (entry.samples.length>128) entry.samples.shift();
    }
    snapshot() {
        return Object.fromEntries([...this.stages].map(([stage,e])=>{
            const sorted=e.samples.slice().sort((a,b)=>a-b);
            const percentile=p=>Math.round(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]*100)/100;
            return [stage,{count:e.count,totalMs:Math.round(e.total),p50Ms:percentile(.5),p95Ms:percentile(.95)}];
        }));
    }
}
