const fs=require('fs'),path=require('path');
const objects=[null,'','','<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'];
const add=s=>(objects.push(s),objects.length-1),pages=[];
const text=(x,y,s,size=12)=>`BT /F1 ${size} Tf ${x} ${y} Td (${s.replace(/[\\()]/g,'\\$&')}) Tj ET\n`;
for(let index=0;index<3;index++){
 let stream='';
 if(index===0)stream+=text(50,762,'Marcus Andreas Born',10)+'30 750 m 570 750 l S\n';
 if(index===1)stream+=text(60,762,'Burow, Daniels, Kaiser, Klinkhamer, Kulbatzki, Schuette, Henkel',8);
 if(index===2)stream+=text(30,762,'320             Vom christlichen Gemeinwesen - XXXIII',10);
 if(index!==2)stream+=text(30,762,String(index+10),10);
 for(let row=0;row<30;row++)stream+=text(60,720-row*18,'Complete body text: all words must remain available here.');
 stream+=text(60,110,'2 A genuine footnote must remain complete.',9);
 if(index===2)stream+=text(465,432,'*',9)+text(465,252,'*',9);
 stream+=text(60,45,String(index+10),10)+text(30,18,'https://doi.org/example - Generiert durch IP 127.0.0.1 - Urheberrechtlich geschuetzter Inhalt',4);
 const content=add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
 pages.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`));
}
objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Count 3 /Kids [${pages.map(i=>i+' 0 R').join(' ')}] >>`;
let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const file=path.resolve(__dirname,'../test/fixtures/boox-headers.pdf');fs.writeFileSync(file,pdf);module.exports=file;
