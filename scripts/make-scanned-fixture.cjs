// A reproducible image-only PDF: gray paper, black text-like rows and footnotes.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const width=600,height=800,pixels=Buffer.alloc(width*height*3,215);
function rect(x,y,w,h){for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)pixels.fill(25,(row*width+col)*3,(row*width+col+1)*3);}
for(let row=0;row<32;row++)for(let word=0;word<10;word++)rect(120+word*35,120+row*16,30,6);
for(let row=0;row<2;row++)for(let word=0;word<7;word++)rect(120+word*35,720+row*14,30,5);
const image=zlib.deflateSync(pixels),content=Buffer.from('q 600 0 0 800 0 0 cm /Im0 Do Q\n');
const objects=[null,Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),Buffer.from('<< /Type /Pages /Count 1 /Kids [3 0 R] >>'),
 Buffer.from('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'),
 Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${image.length} >>\nstream\n`),image,Buffer.from('\nendstream')]),
 Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`),content,Buffer.from('endstream')])];
let chunks=[Buffer.from('%PDF-1.4\n')],offsets=[0],length=chunks[0].length;
for(let i=1;i<objects.length;i++){offsets.push(length);let b=Buffer.concat([Buffer.from(`${i} 0 obj\n`),objects[i],Buffer.from('\nendobj\n')]);chunks.push(b);length+=b.length;}
chunks.push(Buffer.from(`xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`));
const destination=path.resolve(__dirname,'../test/fixtures/boox-scanned.pdf');fs.writeFileSync(destination,Buffer.concat(chunks));console.log(destination);
