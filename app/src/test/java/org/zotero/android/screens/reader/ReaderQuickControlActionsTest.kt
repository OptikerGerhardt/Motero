package org.zotero.android.screens.reader

import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.data.ReaderAnnotationsFilter
import org.zotero.android.screens.reader.data.ReaderFileType
import org.zotero.android.sync.Tag

class ReaderQuickControlActionsTest {
    @Test fun quickTagAddsAndRemovesOnlyTheChosenAssignment() {
        val other = Tag("Existing uncolored tag", "")
        val quick = Tag("Important", "#ff6666")
        val added = ReaderQuickControlActions.toggleTag(listOf(other), quick)
        assertEquals(listOf(other, quick), added)
        assertEquals(listOf(other), ReaderQuickControlActions.toggleTag(added, quick))
    }

    @Test fun changedLibraryTagColorDoesNotCreateADuplicateAssignment() {
        val original = Tag("Important", "#ff6666")
        val updated = original.copy(color = "#2ea8e5")
        assertEquals(emptyList<Tag>(), ReaderQuickControlActions.toggleTag(listOf(original), updated))
    }

    @Test fun colorTogglesPreserveTagsAndAllowMultipleColors() {
        val initial = ReaderAnnotationsFilter(setOf("#ff6666"), setOf("chapter"))
        val next = ReaderQuickControlActions.toggleColor(initial, "#2ea8e5")!!
        assertEquals(setOf("#ff6666", "#2ea8e5"), next.colors)
        assertEquals(initial.tags, next.tags)
        val tagsOnly = ReaderQuickControlActions.toggleColor(
            ReaderQuickControlActions.toggleColor(next, "#ff6666"), "#2ea8e5")!!
        assertEquals(emptySet<String>(), tagsOnly.colors)
        assertEquals(initial.tags, tagsOnly.tags)
    }

    @Test fun clearingTheFinalSelectionReturnsToAnUnfilteredList() {
        val single = ReaderQuickControlActions.toggleColor(null, "#aaaaaa")
        assertNull(ReaderQuickControlActions.toggleColor(single, "#aaaaaa"))
        assertNull(ReaderQuickControlActions.setFilterTags(ReaderAnnotationsFilter(emptySet(), setOf("a")), emptySet()))
    }

    @Test fun changingTagFiltersKeepsTheColorFilter() {
        val initial = ReaderAnnotationsFilter(setOf("#aaaaaa"), setOf("old"))
        val next = ReaderQuickControlActions.setFilterTags(initial, setOf("new"))!!
        assertEquals(initial.colors, next.colors)
        assertEquals(setOf("new"), next.tags)
        assertEquals(initial.colors, ReaderQuickControlActions.setFilterTags(next, emptySet())!!.colors)
    }

    @Test fun pdfScrubberUsesTheSameVisibilityFlagAsTheTopBar() {
        val visible = ReaderViewState(fileType = ReaderFileType.PDF, isTopBarVisible = true)
        assertTrue(visible.isScrubberVisible())
        assertFalse(visible.copy(isTopBarVisible = false).isScrubberVisible())
        assertFalse(visible.copy(readingModeEnabled = true).isScrubberVisible())
        assertFalse(visible.copy(fileType = ReaderFileType.EPUB).isScrubberVisible())
    }
}
