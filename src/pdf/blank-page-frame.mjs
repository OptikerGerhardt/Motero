// Compare physical reading frames, not media-box percentages: a large empty
// insert should not change the reading zoom or the width of the document.
export function typicalReadingFrame(samples) {
    const frames = samples.filter(s => !s.blank && s.bounds?.length === 4)
        .map(s => ({width:(s.bounds[2]-s.bounds[0])*s.width, height:(s.bounds[3]-s.bounds[1])*s.height}))
        .filter(s => Number.isFinite(s.width) && s.width > 0 && Number.isFinite(s.height) && s.height > 0);
    if (!frames.length) return null;
    const median = values => {
        values.sort((a,b)=>a-b);
        return (values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2;
    };
    return {width:median(frames.map(s=>s.width)),height:median(frames.map(s=>s.height))};
}
