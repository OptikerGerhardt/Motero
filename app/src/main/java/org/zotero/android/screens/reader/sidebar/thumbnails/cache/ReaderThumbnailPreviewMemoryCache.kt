package org.zotero.android.screens.reader.sidebar.thumbnails.cache

import android.graphics.Bitmap
import android.util.LruCache
import dagger.hilt.android.scopes.ViewModelScoped
import javax.inject.Inject

@ViewModelScoped
class ReaderThumbnailPreviewMemoryCache @Inject constructor(
){
    private val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    // Bound previews independently of PDF/WebView memory, including low-RAM devices.
    private val cacheSize = (maxMemory / 16).coerceIn(1024, 24 * 1024)
    private val memoryCache: LruCache<Int, Bitmap> = object : LruCache<Int, Bitmap>(cacheSize) {
        override fun sizeOf(key: Int, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }

    fun put(page: Int, bitmap: Bitmap) {
        val eReader = org.zotero.android.ereader.DeviceProfileStore.state.value.eReader
        val limit = previewCacheLimitKb(maxMemory, eReader)
        if (memoryCache.maxSize() != limit) memoryCache.resize(limit)
        memoryCache.put(page, bitmap)
    }

    fun addToCache(pagesToBitmapsList: List<Pair<Int, Bitmap>>): Map<Int, Bitmap> {
        pagesToBitmapsList.forEach {
            put(it.first, it.second)
        }
        return memoryCache.snapshot()
    }

    fun isInCache(index: Int): Boolean {
        return memoryCache.get(index) != null
    }

    fun snapshot(): Map<Int, Bitmap> = memoryCache.snapshot()

    fun trimMemory() { memoryCache.trimToSize((memoryCache.maxSize() / 4).coerceAtLeast(256)) }

    fun clear() {
        memoryCache.evictAll()
    }


}
/** Each native preview cache leaves space for the other cache, WebView and PDF canvases. */
internal fun previewCacheLimitKb(heapKb: Int, eReader: Boolean): Int =
    (heapKb / if (eReader) 32 else 16).coerceIn(1024, if (eReader) 12 * 1024 else 24 * 1024)
