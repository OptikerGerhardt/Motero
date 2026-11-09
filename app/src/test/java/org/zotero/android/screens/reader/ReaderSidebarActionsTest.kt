package org.zotero.android.screens.reader

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.*
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.*
import org.junit.Assert.*
import org.zotero.android.database.objects.AnnotationType
import org.zotero.android.screens.reader.data.*
import org.zotero.android.screens.reader.web.ReaderWebCallChainExecutor
import java.util.Date

@OptIn(ExperimentalCoroutinesApi::class)
class ReaderSidebarActionsTest {
    @get:Rule val instant = InstantTaskExecutorRule()
    private lateinit var vm: ReaderViewModel
    private val bridge = mockk<ReaderWebCallChainExecutor>(relaxed = true)

    @Before fun setup() {
        Dispatchers.setMain(Dispatchers.Unconfined)
        vm = ReaderViewModel(
            defaults = mockk(relaxed = true), pdfReaderCurrentThemeEventStream = mockk(relaxed = true),
            pdfReaderThemeDecider = mockk(relaxed = true), context = mockk(relaxed = true),
            navigationParamsMarshaller = mockk(relaxed = true), sessionDataEventStream = mockk(relaxed = true),
            fileStore = mockk(relaxed = true), dbWrapperMain = mockk(relaxed = true),
            editItemFieldsDbRequestFactory = mockk(relaxed = true), createHtmlEpubAnnotationsDbRequestFactory = mockk(relaxed = true),
            createPDFAnnotationsDbRequestFactory = mockk(relaxed = true), readerSearchResultsEventStream = mockk(relaxed = true),
            readerSearchTermEventStream = mockk(relaxed = true), webCallChainEventStream = mockk(relaxed = true),
            readerRequestThumbnailRenderEventStream = mockk(relaxed = true), readerRequestAnnotationImageRenderEventStream = mockk(relaxed = true),
            readerWebCallChainExecutor = bridge, lastReadWatcher = mockk(relaxed = true),
            progressHandler = mockk(relaxed = true), documentWorkerController = mockk(relaxed = true), stateHandle = SavedStateHandle(),
        )
    }
    @After fun teardown() { vm.viewModelScope.cancel(); Dispatchers.resetMain() }

    private fun put(annotation: ReaderAnnotation) {
        val field = ReaderViewModel::class.java.getDeclaredField("annotations").apply { isAccessible = true }
        @Suppress("UNCHECKED_CAST")
        (field.get(vm) as MutableMap<String, ReaderAnnotation?>)[annotation.key] = annotation
    }
    private fun annotation(type: AnnotationType) = NewReaderAnnotation(type.name, type, "IX", JsonObject(), "Author", true,
        "#000000", if (type == AnnotationType.note) "Bookmark · test" else "", "Text", "00008|00001", Date(0), Date(0), emptyList())
    private fun state(value: ReaderViewState) { (vm.viewStates as MutableLiveData).value = value }

    @Test fun `more options target the clicked card while a different annotation is selected`() {
        state(vm.viewState.copy(selectedAnnotationKey = "another", showSideBar = true))
        for (type in AnnotationType.entries) {
            val target = annotation(type); put(target)
            vm.onMoreOptionsForItemClicked(target.key)
            assertEquals(target, vm.viewState.readerAnnotationMoreArgs!!.selectedAnnotation)
            assertEquals("another", vm.viewState.selectedAnnotationKey)
            assertTrue(vm.viewState.showSideBar)
        }
    }
    @Test fun `jump works for every annotation type and closes editor chrome`() {
        coEvery { bridge.focusAnnotation(any()) } returns Unit
        for (type in AnnotationType.entries) {
            val target = annotation(type); put(target)
            state(vm.viewState.copy(selectedAnnotationKey = target.key, isTopBarVisible = true, showSideBar = true, showCreationToolbar = true))
            vm.focusAnnotation(target.key)
            coVerify { bridge.focusAnnotation(target.key) }
            assertNull(vm.viewState.selectedAnnotationKey)
            assertNull(vm.viewState.readerAnnotationMoreArgs)
            assertFalse(vm.viewState.isTopBarVisible)
            assertFalse(vm.viewState.showSideBar)
            assertFalse(vm.viewState.showCreationToolbar)
        }
    }
}
