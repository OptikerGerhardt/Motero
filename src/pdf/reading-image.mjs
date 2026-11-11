// Preserve the exact minimum-channel ink test and the neutral-paper histogram.
// A one-byte plane keeps color scans conservative without retaining RGBA data.
export function compactReadingImage(image) {
    if (image.channels === 1) return image;
    const data = new Uint8ClampedArray(image.width*image.height), histogram = new Uint32Array(256);
    const rgba = image.data; let red = null;
    for (let p=0,i=0;p<data.length;p++,i+=4) {
        const r=rgba[i],g=rgba[i+1],b=rgba[i+2];
        data[p]=Math.min(r,g,b);
        if (r!==data[p] && !red) red=data.slice();
        if (red) red[p]=r;
        if (p%16===0 && Math.max(r,g,b)-Math.min(r,g,b)<8) histogram[Math.round((r+g+b)/3)]++;
    }
    return {width:image.width,height:image.height,channels:1,data,red,histogram,samples:Math.ceil(data.length/16)};
}
