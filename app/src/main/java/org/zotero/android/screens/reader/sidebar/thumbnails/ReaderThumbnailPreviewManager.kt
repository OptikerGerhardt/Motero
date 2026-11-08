package org.zotero.android.screens.reader.sidebar.thumbnails

import android.graphics.BitmapFactory
import android.util.Base64
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import dagger.hilt.android.scopes.ViewModelScoped
import kotlinx.collections.immutable.toImmutableList
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.*
import org.zotero.android.architecture.Result
import org.zotero.android.architecture.coroutines.Dispatchers
import org.zotero.android.pdf.data.PdfReaderCurrentThemeEventStream
import org.zotero.android.screens.reader.data.ReaderWebData
import org.zotero.android.screens.reader.sidebar.data.ReaderRequestThumbnailRenderEventStream
import org.zotero.android.screens.reader.sidebar.thumbnails.cache.ReaderThumbnailPreviewCacheSnapshotEventStream
import org.zotero.android.screens.reader.sidebar.thumbnails.cache.ReaderThumbnailPreviewMemoryCache
import org.zotero.android.screens.reader.web.ReaderWebCallChainEventStream
import java.util.Collections
import javax.inject.Inject

@ViewModelScoped
class ReaderThumbnailPreviewManager @Inject constructor(
    private val dispatchers: Dispatchers,
    private val memoryCache: ReaderThumbnailPreviewMemoryCache,
    private val readerThumbnailPreviewCacheSnapshotEventStream: ReaderThumbnailPreviewCacheSnapshotEventStream,
    private val readerRequestThumbnailRenderEventStream: ReaderRequestThumbnailRenderEventStream,
    private val webCallChainEventStream: ReaderWebCallChainEventStream,
    private val theme: PdfReaderCurrentThemeEventStream,
) {
    private lateinit var viewModelScope: CoroutineScope
    private var coroutineScope: CoroutineScope? = null
    private val processing = Collections.synchronizedSet(mutableSetOf<Int>())
    private data class Preview(val key: String, val page: Int, val image: String, val scheme: String)
    private var queue = Channel<Preview>(16)
    @Volatile private var renderKey = ""
    @Volatile private var numOfPagesInDocument = 0
    private val requestedCenter = MutableStateFlow(0)
    private val initialized = MutableStateFlow(false)
    private var requestedExact: List<Int> = emptyList()

    fun init(viewModelScope: CoroutineScope) {
        this.viewModelScope = viewModelScope
        resetWorker()
        webCallChainEventStream.flow().onEach { result ->
            if (result is Result.Success) when (val value = result.value) {
                is ReaderWebData.onInitThumbnails -> initialize(value.thumbnailsJsonArray)
                is ReaderWebData.onRenderThumbnail -> store(value.thumbnailJsonObject)
                else -> Unit
            }
        }.launchIn(viewModelScope)
        requestedCenter.debounce(150).combine(initialized) { center, ready ->
            if (ready) requestNearby(center)
        }.launchIn(viewModelScope)
    }

    private fun initialize(thumbnails: JsonArray) {
        val nextKey = thumbnails.firstOrNull()?.asJsonObject?.get("renderKey")?.asString.orEmpty()
        // Keep page-index requests across renderer recovery; all image data is
        // still discarded and keyed to the new reader instance below.
        renderKey = nextKey
        numOfPagesInDocument = thumbnails.size()
        resetWorker()
        processing.clear()
        memoryCache.clear()
        publish()
        initialized.value = numOfPagesInDocument > 0
        requestNearby(requestedCenter.value)
        requestIndices(requestedExact)
    }

    private fun resetWorker() {
        coroutineScope?.cancel()
        queue.cancel()
        val input = Channel<Preview>(16)
        queue = input
        val scope = CoroutineScope(SupervisorJob(viewModelScope.coroutineContext[Job]) + dispatchers.default)
        coroutineScope = scope
        scope.launch {
            for (preview in input) {
                try {
                    if (!accept(preview)) continue
                    val bytes = Base64.decode(preview.image.substringAfter(','), Base64.DEFAULT)
                    val dimensions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, dimensions)
                    // Reject pathological input before allocating bitmap pixels.
                    if (dimensions.outWidth <= 0 || dimensions.outHeight <= 0 ||
                        dimensions.outWidth.toLong() * dimensions.outHeight > 2_000_000) continue
                    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: continue
                    withContext(dispatchers.main) {
                        if (accept(preview) && isActive) {
                            memoryCache.addToCache(listOf(preview.page to bitmap))
                            publish()
                        }
                    }
                } catch (_: IllegalArgumentException) {
                    // A malformed image must not stop subsequent preview requests.
                } finally {
                    if (preview.key == renderKey) processing.remove(preview.page)
                }
            }
        }
    }

    private fun accept(preview: Preview) = preview.key == renderKey && preview.page in 0 until numOfPagesInDocument &&
        preview.scheme == if (theme.currentValue()?.isDark == true) "dark" else "light"

    fun store(thumbnailJsonObject: JsonObject) {
        val key = thumbnailJsonObject["renderKey"]?.asString ?: return
        val page = thumbnailJsonObject["pageIndex"]?.asInt ?: return
        if (key == renderKey && thumbnailJsonObject["canceled"]?.asBoolean == true) {
            processing.remove(page)
            return
        }
        val image = thumbnailJsonObject["image"]?.asString ?: return
        val scheme = thumbnailJsonObject["colorScheme"]?.asString ?: return
        val preview = Preview(key, page, image, scheme)
        if (!accept(preview)) return
        if (image.length > 4_000_000 || queue.trySend(preview).isFailure) processing.remove(page)
    }

    private fun requestNearby(center: Int) {
        if (!initialized.value) return
        requestIndices(((center - 3).coerceAtLeast(0)..(center + 3).coerceAtMost(numOfPagesInDocument - 1)).toList())
    }

    fun requestThumbnail(centerVisibleItemIndex: Int) { requestedCenter.value = centerVisibleItemIndex }

    fun requestExactThumbnails(indices: List<Int>) {
        requestedExact = indices.distinct().take(32)
        requestIndices(requestedExact)
    }

    private fun requestIndices(indices: List<Int>) {
        if (!initialized.value) return
        val missing = indices.distinct().filter { it in 0 until numOfPagesInDocument && !memoryCache.isInCache(it) && !processing.contains(it) }.take(32).filter { processing.add(it) }
        if (missing.isNotEmpty()) readerRequestThumbnailRenderEventStream.emitAsync(missing)
    }

    private fun publish() {
        val snapshot = generateEmptySnapshot()
        memoryCache.snapshot().forEach { (index, bitmap) -> if (index in snapshot.indices) snapshot[index] = bitmap }
        readerThumbnailPreviewCacheSnapshotEventStream.emitAsync(snapshot.toImmutableList())
    }
    fun generateEmptySnapshot(): MutableList<android.graphics.Bitmap?> = MutableList(numOfPagesInDocument) { null }
    fun isCurrentlyProcessing(index: Int) = processing.contains(index)
    fun cancelProcessing() {
        initialized.value = false
        renderKey = ""
        resetWorker()
        processing.clear()
        memoryCache.clear()
        publish()
    }
}
