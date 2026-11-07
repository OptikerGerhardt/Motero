package org.zotero.android.screens.tagpicker

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.lifecycle.viewModelScope
import io.mockk.*
import kotlinx.coroutines.*
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.resetMain
import org.junit.*
import org.junit.Assert.*
import org.zotero.android.architecture.ScreenArguments
import org.zotero.android.screens.tagpicker.data.*
import org.zotero.android.sync.*

@OptIn(ExperimentalCoroutinesApi::class)
class TagPickerConfirmationTest {
    @get:Rule val instant = InstantTaskExecutorRule()
    private lateinit var vm: TagPickerViewModel
    private lateinit var changed: () -> Unit
    private val library = LibraryIdentifier.group(7)
    private val repo = mockk<TagSuggestionRepository>()
    private val tags = listOf(TagUsage(Tag("Anthropologie", "#aaaaaa"), 4, 5),
        TagUsage(Tag("Anth", ""), 1, 1), TagUsage(Tag("Kant", ""), 1, 2))
    @Before fun setup() = runBlocking {
        Dispatchers.setMain(Dispatchers.Unconfined)
        every { repo.observe(any()) } answers { changed = firstArg(); AutoCloseable {} }
        coEvery { repo.load(library, "PDFKEY", null) } returns TagSuggestions(tags)
        ScreenArguments.tagPickerArgs = TagPickerArgs(library, emptySet(), callPoint = TagPickerResult.CallPoint.ReaderAnnotationScreen, documentKey = "PDFKEY")
        vm = TagPickerViewModel(repo).also { it.checkMainThread = false; it.init() }
        ready()
    }
    @After fun teardown() { vm.viewModelScope.cancel(); Dispatchers.resetMain(); unmockkAll() }
    private suspend fun ready() = withTimeout(5000) { while (!vm.viewState.ready) delay(5) }
    private suspend fun type(text: String) { vm.search(TextFieldValue(text, TextRange(text.length))); ready() }
    @Test fun `exact short tag wins over the longer visible completion`() = runBlocking {
        type("Anth"); assertNull(vm.viewState.ghostCandidate)
        vm.acceptSuggestion(); ready()
        assertEquals(setOf("Anth"), vm.viewState.selectedTags)
        assertEquals("", vm.viewState.searchTerm)
    }
    @Test fun `enter uses the full visible proposal without creating the partial text`() = runBlocking {
        type("Anthr"); vm.acceptSuggestion(); ready()
        assertEquals(setOf("Anthropologie"), vm.viewState.selectedTags)
        assertEquals("#aaaaaa", vm.selectedTags().single().color)
        assertFalse(vm.viewState.tags.any { it.name == "Anthropologie" })
    }
    @Test fun `save confirms the visible full tag before closing the picker`() = runBlocking {
        type("Anthr"); vm.onSave()
        assertEquals(setOf("Anthropologie"), vm.viewState.selectedTags)
        assertNotNull(vm.viewEffects.value)
        assertEquals("#aaaaaa", vm.selectedTags().single().color)
    }
    @Test fun `save with an unknown partial input stays open until explicit creation`() = runBlocking {
        type("Neue Kategorie"); vm.onSave()
        assertEquals(TagNotice.ChooseOrCreate, vm.viewState.notice)
        assertTrue(vm.viewState.selectedTags.isEmpty()); assertNull(vm.viewEffects.value)
        vm.createTag(); ready()
        assertEquals(setOf("Neue Kategorie"), vm.viewState.selectedTags)
        vm.selectOrDeselect("Neue Kategorie"); ready()
        assertTrue(vm.viewState.tags.any { it.name == "Neue Kategorie" })
    }
    @Test fun `arrow selection can accept a different suggestion and selected tags can be removed`() = runBlocking {
        type("a"); vm.moveHighlight(1); vm.moveHighlight(1)
        assertEquals(1, vm.viewState.highlighted)
        vm.acceptSuggestion(); ready()
        assertEquals(setOf("Kant"), vm.viewState.selectedTags)
        vm.selectOrDeselect("Kant"); ready(); assertTrue(vm.viewState.selectedTags.isEmpty())
    }
    @Test fun `composition and cursor edits are not silently completed`() = runBlocking {
        vm.search(TextFieldValue("Anthr", TextRange(5), TextRange(0,5))); ready()
        vm.acceptSuggestion(); assertTrue(vm.viewState.selectedTags.isEmpty())
        assertEquals(TagNotice.Wait, vm.viewState.notice)
        vm.search(TextFieldValue("Anthr", TextRange(2))); ready()
        vm.acceptSuggestion(); assertEquals(TagNotice.ChooseOrCreate, vm.viewState.notice)
        assertEquals("Anthr", vm.viewState.searchTerm)
    }
    @Test fun `confirmation never accepts a previous search result after the query changes`() = runBlocking {
        type("Anthr"); vm.search(TextFieldValue("Unknown", TextRange(7)))
        assertTrue(vm.viewState.tags.isEmpty())
        vm.acceptSuggestion(); ready()
        assertTrue(vm.viewState.selectedTags.isEmpty())
        assertEquals("Unknown", vm.viewState.searchTerm)
    }
    @Test fun `a database notification refreshes counts and suggestions without losing selected tags`() = runBlocking {
        vm.selectOrDeselect("Kant"); ready()
        coEvery { repo.load(library, "PDFKEY", null) } returns TagSuggestions(listOf(TagUsage(Tag("New from sync", ""), 8, 8)))
        changed(); ready()
        assertEquals(listOf("New from sync"), vm.viewState.tags.map { it.name })
        assertEquals(setOf("Kant"), vm.viewState.selectedTags)
        coVerify(atLeast = 2) { repo.load(library, "PDFKEY", null) }
    }
}
