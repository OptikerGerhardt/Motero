const fs=require('fs'),path=require('path');
const objects=[null,'','','<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'];
const add=s=>(objects.push(s),objects.length-1),pages=[];
for(let i=0;i<3;i++){
 let stream='';
 if(i!==1)for(let row=0;row<30;row++)stream+=`BT /F1 12 Tf 60 ${720-row*19} Td (Ordinary page text line ${row+1}: complete content.) Tj ET\n`;
 const content=add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
 pages.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${i===1?'1200 1600':'600 800'}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`));
}
objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
objects[2]=`<< /Type /Pages /Count 3 /Kids [${pages.map(i=>i+' 0 R').join(' ')}] >>`;
let pdf='%PDF-1.4\n',offsets=[0];
for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
pdf+=offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const file=path.resolve(__dirname,'../test/fixtures/boox-blank.pdf');fs.writeFileSync(file,pdf);module.exports=file;
