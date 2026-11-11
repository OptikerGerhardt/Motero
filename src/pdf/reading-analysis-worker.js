import { analyzeReadingGeometry } from './reading-geometry.mjs';
import { compactReadingImage } from './reading-image.mjs';

// Shared only while a foreground request and model learning use the same raster.
const images = new Map();
self.onmessage = ({ data }) => {
    if (data.releaseImage) { images.delete(data.releaseImage); return; }
    const { id, page, model, imageID } = data;
    try {
        if (page.image) images.set(imageID, compactReadingImage(page.image));
        if (imageID) page.image = images.get(imageID);
        self.postMessage({ id, result: analyzeReadingGeometry(page, model) });
    } catch (error) { self.postMessage({ id, error: String(error?.message || error) }); }
};
self.postMessage({ ready: true });
