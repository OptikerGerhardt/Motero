// Reproducible PDF without third-party generators. All coordinates are PDF points.
const fs = require('fs'), path = require('path');
const objects = [null, '', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'];
const add = value => (objects.push(value), objects.length - 1);
const text = (x,y,s,size=10) => `BT /F1 ${size} Tf ${x} ${y} Td (${s.replace(/[\\()]/g,'\\$&')}) Tj ET\n`;
const pages = [];
for (let index = 0; index < 18; index++) {
 let left = index % 2 ? 78 : 132, stream = '', width = 600, height = 800;
 if (index === 0) stream = text(110,600,'A cover outside the middle sample',18);
 else if (index !== 16) {
  stream += text(180,755,'Author: A recurring running header',9);
  for (let row=0; row<34; row++) {
   const y=670-row*14;
   stream += text(left,y,`Page ${String(index+1).padStart(2,'0')}, line ${String(row+1).padStart(2,'0')}: Philosophy, footnotes and actual body text.`);
   if (row%5===4) stream += text(left-30,y,String(row+1),8);
  }
  stream += text(left+405,390,'AA 5:123',8);
  stream += `${left} 112 m ${left+110} 112 l S\n`;
  stream += text(left,96,'1 Ibid.',8);
  stream += text(left,82,'2 This longer footnote is part of the page content.',8);
  stream += text(40,28,'Downloaded from JSTOR at 2026-10-30, https://www.jstor.org/stable/123',7);
  stream += text(292,12,String(index+1),8);
  if (index === 14) { stream += '35 340 m 565 340 l 565 360 l 35 360 l h S\n'; }
  if (index === 15) { width=800; height=600; stream=text(50,500,'A landscape page with its own dimensions.',14)+text(50,80,'1 A footnote on a landscape page.',9); }
  if (index === 17) stream += text(left,53,'3 One unusual deep footnote must not be lost.',8);
 }
 let content = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
 let page = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`);
 pages.push(page);
}
objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
objects[2]=`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map(i=>i+' 0 R').join(' ')}] >>`;
let pdf='%PDF-1.4\n', offsets=[0];
for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
let xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
pdf+=offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
fs.writeFileSync(path.resolve(__dirname,'../test/fixtures/boox-fitting.pdf'),pdf);
