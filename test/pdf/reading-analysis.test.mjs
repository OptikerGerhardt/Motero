import test from 'node:test';
import assert from 'node:assert/strict';
import {OPS} from '../../pdfjs/pdf.js/src/shared/util.js';
import {canUseTextBounds,ReadingMetrics} from '../../src/pdf/reading-analysis.mjs';
const lines=Array.from({length:8},(_,i)=>({text:'A complete line in the ordinary page body.',rect:[.1,.2+i*.04,.9,.22+i*.04]}));
test('text analysis shortcut refuses painted graphics, scans, invisible OCR, forms and unknown operators',()=>{
 const text={fnArray:[OPS.beginText,OPS.setFont,OPS.showText,OPS.endText],argsArray:[[],[],[],[]]};
 assert.equal(canUseTextBounds(text,lines),true);
 for(const op of [OPS.constructPath,OPS.paintImageXObject,OPS.paintFormXObjectBegin,OPS.shadingFill,OPS.setGState,999])
  assert.equal(canUseTextBounds({...text,fnArray:[...text.fnArray,op],argsArray:[...text.argsArray,[]]},lines),false,String(op));
 assert.equal(canUseTextBounds({fnArray:[OPS.setTextRenderingMode,OPS.showText],argsArray:[[3],[]]},lines),false);
 assert.equal(canUseTextBounds(text,lines.slice(0,2)),false);
 assert.equal(canUseTextBounds(null,lines),false);
});
test('performance samples remain bounded and report recent median and p95 without page content',()=>{
 let clock=0;const metrics=new ReadingMetrics({now:()=>clock});
 for(let i=0;i<200;i++){const start=clock;clock+=i;metrics.record('raster',start);}
 assert.equal(metrics.stages.get('raster').samples.length,128);
 const result=metrics.snapshot().raster;
 assert.equal(result.count,200);assert.equal(result.totalMs,19900);assert.equal(result.p50Ms,136);assert.equal(result.p95Ms,193);
});
