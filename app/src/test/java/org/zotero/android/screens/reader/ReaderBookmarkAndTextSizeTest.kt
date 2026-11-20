package org.zotero.android.screens.reader

import com.google.gson.Gson
import com.google.gson.JsonObject
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.database.objects.AnnotationType
import org.zotero.android.screens.reader.data.NewReaderAnnotation
import org.zotero.android.screens.reader.data.BOOKMARK_TAG
import org.zotero.android.sync.Tag
import org.zotero.android.screens.reader.data.bookmarkDetails
import org.zotero.android.screens.reader.data.isReaderBookmark
import org.zotero.android.screens.reader.settings.data.ReaderSettings
import java.util.Date

class ReaderBookmarkAndTextSizeTest {
    private fun annotation(comment: String, color: String = "#aaaaaa", type: AnnotationType = AnnotationType.note, tags: List<Tag> = emptyList()) =
        NewReaderAnnotation("ABC123", type, "XXIV", JsonObject(), "Author", true, color, comment,
            null, "00023|00001", Date(0), Date(0), tags)

    @Test fun `bookmark filtering recognizes saved languages and edited colors`() {
        for (label in listOf("Bookmark", "Lesezeichen")) for (color in listOf("#aaaaaa", "#2ea8e5", "#ff6666")) {
            val bookmark = annotation("$label · 07.11.26, 20:15\nSeminar", color)
            assertTrue(bookmark.isReaderBookmark())
            assertEquals("07.11.26, 20:15\nSeminar", bookmark.bookmarkDetails())
            assertEquals("XXIV", bookmark.pageLabel)
        }
    }

    @Test fun `ordinary notes and highlighted bookmark text do not become bookmarks`() {
        assertFalse(annotation("A note about Bookmark · navigation").isReaderBookmark())
        assertFalse(annotation("Bookmark", "#2ea8e5").isReaderBookmark())
        assertFalse(annotation("Bookmark · 07.11.26", type = AnnotationType.highlight).isReaderBookmark())
    }


    @Test fun `tagged notes are bookmarks regardless of comment or color`() {
        assertTrue(annotation("Important research detail", "#ff6666",
            tags = listOf(Tag(BOOKMARK_TAG, ""))).isReaderBookmark())
        assertTrue(annotation("", "#2ea8e5",
            tags = listOf(Tag("bookmark", ""))).isReaderBookmark())
        assertFalse(annotation("No tags", "#000000").isReaderBookmark())
        assertFalse(annotation("Own highlight", "#2ea8e5",
            type = AnnotationType.highlight, tags = listOf(Tag(BOOKMARK_TAG, ""))).isReaderBookmark())
        assertEquals("Own text", annotation("Own text", tags = listOf(Tag(BOOKMARK_TAG, ""))).bookmarkDetails())
    }

    @Test fun `bookmark color remains global with backwards compatible default`() {
        val settings = ReaderSettings.default()
        assertEquals("#000000", settings.effectiveBookmarkColor())
        settings.bookmarkColor = "#2ea8e5"
        val restored = Gson().fromJson(Gson().toJson(settings), ReaderSettings::class.java)
        assertEquals("#2ea8e5", restored.effectiveBookmarkColor())
        settings.bookmarkColor = "red"
        assertEquals("#000000", settings.effectiveBookmarkColor())
        settings.bookmarkColor = "javascript:invalid"
        assertEquals("#000000", settings.effectiveBookmarkColor())
    }

    @Test fun `old saved typography migrates to one hundred percent without changing other settings`() {
        val old = Gson().fromJson("""{"lineHeight":1.5,"fitToContent":true}""", ReaderSettings::class.java)
        assertEquals(1f, old.effectiveTextScale(), 0f)
        assertEquals(1.5f, old.lineHeight, 0f)
        assertEquals("content", old.pageFitMode())
        assertEquals("#000000", old.effectiveBookmarkColor())
    }

    @Test fun `font sizes round trip and invalid persisted values recover safely`() {
        val settings = ReaderSettings.default()
        for (scale in listOf(0.6f, 1f, 1.7f, 1.8f)) {
            settings.textScale = scale
            val restored = Gson().fromJson(Gson().toJson(settings), ReaderSettings::class.java)
            assertEquals(scale, restored.effectiveTextScale(), 0f)
        }
        for (invalid in listOf(0f, 0.5f, 3f, -1f, Float.NaN, Float.POSITIVE_INFINITY, 20f)) {
            settings.textScale = invalid
            assertEquals(1f, settings.effectiveTextScale(), 0f)
        }
    }
}
