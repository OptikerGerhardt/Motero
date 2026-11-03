package org.zotero.android.screens.reader

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.Observer
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.Runs
import kotlinx.collections.immutable.persistentListOf
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.withContext
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.zotero.android.architecture.BaseViewModel2
import org.zotero.android.architecture.Consumable
import org.zotero.android.attachmentdownloader.AttachmentDownloader
import org.zotero.android.attachmentdownloader.AttachmentDownloaderEventStream
import org.zotero.android.database.objects.Attachment
import org.zotero.android.database.objects.RCustomLibraryType
import org.zotero.android.files.FileStore
import org.zotero.android.screens.itemdetails.ItemDetailsViewEffect
import org.zotero.android.screens.itemdetails.ItemDetailsViewModel
import org.zotero.android.screens.itemdetails.ItemDetailsViewState
import org.zotero.android.screens.itemdetails.data.ItemDetailError
import org.zotero.android.sync.Library
import org.zotero.android.sync.LibraryIdentifier
import java.io.File
import java.util.concurrent.ConcurrentLinkedQueue

/** Exercise the real download collector with BaseViewModel2's thread check enabled. */
@OptIn(ExperimentalCoroutinesApi::class)
class DocumentSharingThreadTest {
    @get:Rule val instant = InstantTaskExecutorRule()
    @get:Rule val folder = TemporaryFolder()

    @Test fun `PDF ready event from IO reaches the main-thread share effect`() = sharingTest("study.pdf", "application/pdf") {
        request()
        emit(AttachmentDownloader.Update.Kind.ready)
        assertEquals(listOf(ItemDetailsViewEffect.ShareDocument(file, mime)), shares())
        assertEquals("original attachment", file.readText())
    }

    @Test fun `EPUB ready event from IO reaches the main-thread share effect`() = sharingTest("book.epub", "application/epub+zip") {
        request()
        emit(AttachmentDownloader.Update.Kind.ready)
        assertEquals(listOf(ItemDetailsViewEffect.ShareDocument(file, mime)), shares())
    }

    @Test fun `missing downloaded file reports a share error on main instead of crashing`() = sharingTest {
        request()
        file.delete()
        emit(AttachmentDownloader.Update.Kind.ready)
        assertTrue(shares().isEmpty())
        assertEquals(ItemDetailError.cantShareDocument, vm.viewState.error)
    }

    @Test fun `failed download reports a share error on main instead of crashing`() = sharingTest {
        request()
        emit(AttachmentDownloader.Update.Kind.failed(AttachmentDownloader.Error.incompatibleAttachment))
        assertTrue(shares().isEmpty())
        assertEquals(ItemDetailError.cantShareDocument, vm.viewState.error)
    }

    @Test fun `same key in another library cannot consume the pending share`() = sharingTest {
        request()
        emit(AttachmentDownloader.Update.Kind.ready, LibraryIdentifier.group(77))
        assertTrue(shares().isEmpty())
        emit(AttachmentDownloader.Update.Kind.ready)
        assertEquals(1, shares().size)
        emit(AttachmentDownloader.Update.Kind.ready)
        assertEquals(1, shares().size)
    }

    @Test fun `cancelled share cannot launch later when a ready event arrives`() = sharingTest {
        request()
        emit(AttachmentDownloader.Update.Kind.cancelled)
        emit(AttachmentDownloader.Update.Kind.ready)
        assertTrue(shares().isEmpty())
        assertNull(vm.viewState.error)
    }

    private fun sharingTest(filename: String = "study.pdf", mime: String = "application/pdf", block: suspend Fixture.() -> Unit) = runTest {
        Dispatchers.setMain(StandardTestDispatcher(testScheduler))
        val previousHandler = Thread.getDefaultUncaughtExceptionHandler()
        val errors = ConcurrentLinkedQueue<Throwable>()
        Thread.setDefaultUncaughtExceptionHandler { _, error -> errors.add(error) }
        val fixture = Fixture(File(folder.newFolder(), filename).apply { writeText("original attachment") }, mime)
        try {
            fixture.start()
            runCurrent()
            fixture.block()
            runCurrent()
            assertTrue("No background-thread state/effect exception: $errors", errors.isEmpty())
        } finally {
            fixture.close()
            Thread.setDefaultUncaughtExceptionHandler(previousHandler)
            Dispatchers.resetMain()
        }
    }

    private class Fixture(val file: File, val mime: String) {
        val libraryId = LibraryIdentifier.custom(RCustomLibraryType.myLibrary)
        val attachment = Attachment(
            type = Attachment.Kind.file(filename = file.name, contentType = mime,
                location = Attachment.FileLocation.remote, linkType = Attachment.FileLinkType.importedFile),
            title = file.name, key = "FILEKEY", libraryId = libraryId,
        )
        val updates = MutableSharedFlow<AttachmentDownloader.Update>()
        val effects = mutableListOf<ItemDetailsViewEffect>()
        private val stream = mockk<AttachmentDownloaderEventStream> { every { flow() } returns updates }
        private val store = mockk<FileStore> { every { attachmentFile(any(), any(), any()) } returns file }
        private val downloader = mockk<AttachmentDownloader> { every { downloadIfNeeded(any(), any()) } just Runs }
        val vm = ItemDetailsViewModel(
            dispatcher = Dispatchers.IO, defaults = mockk(relaxed = true), dbWrapperMain = mockk(),
            fileStore = store, schemaController = mockk(), selectMedia = mockk(), fileDownloader = downloader,
            attachmentDownloaderEventStream = stream, getUriDetailsUseCase = mockk(), fileCleanupController = mockk(),
            conflictResolutionUseCase = mockk(), dateParser = mockk(), context = mockk(), navigationParamsMarshaller = mockk(),
            itemDetailDataCreator = mockk(), editItemFieldsDbRequestFactory = mockk(), createAttachmentsDbRequestFactory = mockk(),
            createItemFromDetailDbRequestFactory = mockk(), editTypeItemDetailDbRequestFactory = mockk(), stateHandle = SavedStateHandle(),
        )
        private val observer = Observer<Consumable<ItemDetailsViewEffect>> { event -> event?.consume()?.let(effects::add) }

        @Suppress("UNCHECKED_CAST")
        fun start() {
            // Seed an already loaded details screen, avoiding unrelated Realm/network initialization.
            val field = BaseViewModel2::class.java.getDeclaredField("internalState").apply { isAccessible = true }
            (field.get(vm) as MutableLiveData<ItemDetailsViewState>).value = ItemDetailsViewState(
                key = "PARENT", library = Library(libraryId, "Library", true, true), attachments = persistentListOf(attachment),
            )
            assertTrue(vm.checkMainThread)
            vm.viewEffects.observeForever(observer)
            ItemDetailsViewModel::class.java.getDeclaredMethod("setupFileObservers").apply { isAccessible = true }.invoke(vm)
        }

        fun request() = ItemDetailsViewModel::class.java.getDeclaredMethod("shareAttachment", Attachment::class.java)
            .apply { isAccessible = true }.invoke(vm, attachment)

        suspend fun emit(kind: AttachmentDownloader.Update.Kind, library: LibraryIdentifier = libraryId) {
            withContext(Dispatchers.IO) {
                updates.emit(AttachmentDownloader.Update.init(key = attachment.key, parentKey = "PARENT", libraryId = library, kind = kind))
            }
        }

        fun shares() = effects.filterIsInstance<ItemDetailsViewEffect.ShareDocument>()

        fun close() {
            vm.viewEffects.removeObserver(observer)
            vm.viewModelScope.cancel()
            (ItemDetailsViewModel::class.java.getDeclaredField("coroutineScope").apply { isAccessible = true }.get(vm) as kotlinx.coroutines.CoroutineScope).cancel()
        }
    }
}
