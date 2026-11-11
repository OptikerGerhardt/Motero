// Reproducible PDF without third-party generators. All coordinates are PDF points.
const fs = require('fs'), path = require('path');
const objects = [null, '', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'];
const add = value => (objects.push(value), objects.length - 1);
const text = (x,y,s,size=10) => `BT /F1 ${size} Tf ${x} ${y} Td (${s.replace(/[\\()]/g,'\\$&')}) Tj ET\n`;
const pages = [];
for(let index=0;index<3;index++){
 let stream='';
 for(let row=0;row<35;row++)for(const [col,x] of [[0,54],[1,324]])stream+=text(x,720-row*17,`Column ${col+1} line ${String(row+1).padStart(2,'0')}: scientific text.`.slice(0,col===1?-2:undefined),9);
 stream+=text(280,20,String(index+1),8);
 const content=add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
 pages.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`));
}
objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
objects[2]=`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map(i=>i+' 0 R').join(' ')}] >>`;
let pdf='%PDF-1.4\n', offsets=[0];
for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
let xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
pdf+=offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
fs.writeFileSync(path.resolve(__dirname,'../test/fixtures/boox-columns.pdf'),pdf);
