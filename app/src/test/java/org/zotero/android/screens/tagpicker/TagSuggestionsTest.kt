package org.zotero.android.screens.tagpicker

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.database.objects.RItem
import org.zotero.android.sync.LibraryIdentifier
import org.zotero.android.sync.Tag

class TagSuggestionsTest {
    private fun usage(name: String, pdf: Int, library: Int) = TagUsage(Tag(name, ""), pdf, library)
    @Test fun `PDF use wins then library use then name and selected tags are excluded`() {
        val index = TagSuggestions(listOf(usage("beta", 2, 90), usage("zeta", 3, 3),
            usage("Alpha", 2, 90), usage("gamma", 2, 100), usage("outside", 0, 1000)))
        assertEquals(listOf("zeta", "gamma", "Alpha", "beta", "outside"), index.search("", emptySet()).tags.map { it.name })
        assertEquals(listOf("Alpha", "beta", "outside"), index.search("", setOf("zeta", "gamma")).tags.map { it.name })
    }
    @Test fun `substring suggestions do not become invalid prefix completions`() {
        val index = TagSuggestions(listOf(usage("Bioanthropologie", 10, 10), usage("Anthropologie", 1, 1)))
        val result = index.search("anth", emptySet())
        assertEquals(2, result.tags.size)
        assertEquals("Anthropologie", result.completion?.name)
        assertEquals("Anthropologie", index.exact("anthropologie")?.name)
        assertNull(index.exact("anth"))
    }
    @Test fun `suggestions are limited and an empty search has no completion`() {
        val index = TagSuggestions((1..40).map { usage("Tag $it", 0, it) })
        assertEquals(8, index.search("", emptySet()).tags.size)
        assertEquals("Tag 40", index.search("", emptySet()).tags.first().name)
        assertNull(index.search("", emptySet()).completion)
    }
    @Test fun `ghost does not replace composing text or editing at another cursor position`() {
        val tag = Tag("Anthropologie", "")
        fun state(input: TextFieldValue) = TagPickerViewState(input = input, completion = tag, ready = true)
        assertEquals(tag, state(TextFieldValue("Anth", TextRange(4))).ghostCandidate)
        assertNull(state(TextFieldValue("An", TextRange(2))).ghostCandidate)
        assertNull(state(TextFieldValue("Anth", TextRange(2))).ghostCandidate)
        assertNull(state(TextFieldValue("Anth", TextRange(4), TextRange(0,4))).ghostCandidate)
        assertNull(state(TextFieldValue("Anthropologie", TextRange(13))).ghostCandidate)
    }
    @Test fun `ghost offset mapping keeps all cursor positions within the entered text`() {
        val rendered = TagCompletionTransformation("Anthropologie").filter(AnnotatedString("anth"))
        assertEquals("anthropologie", rendered.text.text)
        assertEquals(4, rendered.offsetMapping.transformedToOriginal(13))
        assertEquals(3, rendered.offsetMapping.originalToTransformed(3))
    }
    @Test fun `deleted and trashed ancestors and foreign libraries do not count`() {
        val library = LibraryIdentifier.group(7)
        fun item(key: String, parent: RItem? = null, group: Int = 7, trash: Boolean = false, deleted: Boolean = false) = RItem().also {
            it.key = key; it.parent = parent; it.groupKey = group; it.customLibraryKey = null
            it.trash = trash; it.deleted = deleted
        }
        assertTrue(activeTagItem(item("note", item("pdf")), library))
        assertFalse(activeTagItem(item("note", item("pdf", trash = true)), library))
        assertFalse(activeTagItem(item("note", item("pdf", deleted = true)), library))
        assertFalse(activeTagItem(item("foreign", group = 8), library))
        assertFalse(activeTagItem(item("loop", item("loop")), library))
    }
}
