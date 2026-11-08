package org.zotero.android.screens.reader

import android.graphics.Bitmap
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import org.junit.Assert.assertTrue
import org.junit.Test
import org.zotero.android.architecture.Result
import org.zotero.android.architecture.coroutines.ApplicationScope
import org.zotero.android.pdf.data.PdfReaderCurrentThemeEventStream
import org.zotero.android.screens.reader.data.ReaderWebData
import org.zotero.android.screens.reader.sidebar.data.ReaderRequestThumbnailRenderEventStream
import org.zotero.android.screens.reader.sidebar.thumbnails.ReaderThumbnailPreviewManager
import org.zotero.android.screens.reader.sidebar.thumbnails.cache.ReaderThumbnailPreviewCacheSnapshotEventStream
import org.zotero.android.screens.reader.sidebar.thumbnails.cache.ReaderThumbnailPreviewMemoryCache
import org.zotero.android.screens.reader.web.ReaderWebCallChainEventStream

class ReaderThumbnailRecoveryTest {
    @Test fun `renderer restart re-requests far landmarks as well as nearby previews`() {
        val application = ApplicationScope(Dispatchers.Unconfined)
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Unconfined)
        val dispatchers = object : org.zotero.android.architecture.coroutines.Dispatchers {
            override val default = Dispatchers.Unconfined
            override val main = Dispatchers.Unconfined
            override val unconfined = Dispatchers.Unconfined
            override val io = Dispatchers.Unconfined
        }
        val cache = mockk<ReaderThumbnailPreviewMemoryCache>(relaxUnitFun = true)
        every { cache.isInCache(any()) } returns false
        every { cache.snapshot() } returns emptyMap<Int, Bitmap>()
        val requests = ReaderRequestThumbnailRenderEventStream(application)
        val web = ReaderWebCallChainEventStream(application)
        val observed = mutableListOf<List<Int>>()
        requests.flow().onEach { observed.add(it) }.launchIn(scope)
        val manager = ReaderThumbnailPreviewManager(dispatchers, cache,
            ReaderThumbnailPreviewCacheSnapshotEventStream(application), requests, web,
            PdfReaderCurrentThemeEventStream(application))
        fun initialize(key: String) {
            val pages = JsonArray()
            repeat(100) { pages.add(JsonObject().apply { addProperty("pageIndex", it); addProperty("renderKey", key) }) }
            web.emitAsync(Result.Success(ReaderWebData.onInitThumbnails(pages)))
        }
        try {
            manager.init(scope)
            initialize("first-renderer:0")
            manager.requestExactThumbnails(listOf(0, 50, 99))
            assertTrue(observed.flatten().containsAll(listOf(50, 99)))
            observed.clear()
            initialize("recovered-renderer:0")
            assertTrue("far landmark previews must recover with the document", observed.flatten().containsAll(listOf(50, 99)))
        } finally { scope.cancel() }
    }
}
