package org.zotero.android.screens.reader

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import io.mockk.*
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.test.*
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.architecture.Result
import org.zotero.android.architecture.coroutines.ApplicationScope
import org.zotero.android.pdf.data.PdfReaderCurrentThemeEventStream
import org.zotero.android.screens.reader.data.ReaderWebData
import org.zotero.android.screens.reader.sidebar.data.ReaderRequestThumbnailRenderEventStream
import org.zotero.android.screens.reader.sidebar.thumbnails.ReaderThumbnailPreviewManager
import org.zotero.android.screens.reader.sidebar.thumbnails.cache.*
import org.zotero.android.screens.reader.web.ReaderWebCallChainEventStream

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class ReaderThumbnailBatchTest {
    @Test fun `current preview is immediate while neighbours publish once and recovery cancels old batches`() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val dispatchers = object : org.zotero.android.architecture.coroutines.Dispatchers {
            override val default = dispatcher
            override val main = dispatcher
            override val unconfined = dispatcher
            override val io = dispatcher
        }
        val application = ApplicationScope(dispatcher)
        val pixels = mutableMapOf<Int, Bitmap>()
        val cache = mockk<ReaderThumbnailPreviewMemoryCache>(relaxUnitFun = true)
        every { cache.isInCache(any()) } answers { pixels.containsKey(firstArg()) }
        every { cache.snapshot() } answers { pixels.toMap() }
        every { cache.put(any(), any()) } answers { pixels[firstArg()] = secondArg() }
        every { cache.clear() } answers { pixels.clear() }
        val snapshots = ReaderThumbnailPreviewCacheSnapshotEventStream(application)
        val observed = mutableListOf<List<Bitmap?>>()
        snapshots.flow().onEach { observed.add(it) }.launchIn(backgroundScope)
        val web = ReaderWebCallChainEventStream(application)
        val manager = ReaderThumbnailPreviewManager(dispatchers, cache, snapshots,
            ReaderRequestThumbnailRenderEventStream(application), web, PdfReaderCurrentThemeEventStream(application))
        val bitmap = mockk<Bitmap>()
        mockkStatic(Base64::class, BitmapFactory::class)
        every { Base64.decode(any<String>(), any()) } returns ByteArray(16)
        every { BitmapFactory.decodeByteArray(any(), any(), any(), any()) } answers {
            arg<BitmapFactory.Options>(3).apply { outWidth = 4; outHeight = 4 }
            null
        }
        every { BitmapFactory.decodeByteArray(any(), any(), any()) } returns bitmap
        fun initialize(key: String) {
            val pages = JsonArray()
            repeat(1000) { pages.add(JsonObject().apply { addProperty("renderKey", key) }) }
            web.emitAsync(Result.Success(ReaderWebData.onInitThumbnails(pages)))
        }
        fun store(page: Int, key: String = "first") = manager.store(JsonObject().apply {
            addProperty("renderKey", key); addProperty("pageIndex", page)
            addProperty("image", "data:image/png;base64,test"); addProperty("colorScheme", "light")
        })
        try {
            manager.init(backgroundScope); runCurrent()
            initialize("first"); runCurrent()
            store(0); runCurrent()
            assertEquals(1, observed.last().count { it != null })
            val count = observed.size
            for (page in 1..4) store(page)
            runCurrent(); assertEquals(count, observed.size)
            advanceTimeBy(32); runCurrent()
            assertEquals(count + 1, observed.size)
            assertEquals(5, observed.last().count { it != null })
            store(5); runCurrent()
            initialize("recovered"); runCurrent()
            val recovered = observed.size
            advanceTimeBy(40); runCurrent()
            assertEquals(recovered, observed.size)
            assertEquals(0, observed.last().count { it != null })
            store(6); runCurrent()
            assertEquals(recovered, observed.size)
        } finally {
            manager.cancelProcessing()
            unmockkStatic(Base64::class, BitmapFactory::class)
        }
    }

    @Test fun `preview limits reserve memory on e-readers without increasing ordinary budgets`() {
        for (heap in listOf(32, 64, 128, 256, 512, 1024)) {
            val standard = previewCacheLimitKb(heap * 1024, false)
            val eReader = previewCacheLimitKb(heap * 1024, true)
            assertTrue(eReader <= standard)
            assertTrue(eReader <= 12 * 1024)
            assertTrue(standard <= 24 * 1024)
        }
    }
}
