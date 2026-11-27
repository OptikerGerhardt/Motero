package org.zotero.android.screens.reader

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import org.zotero.android.screens.reader.data.EpubProgressMarker
import org.zotero.android.screens.reader.toolbar.epubTrackWindow

class EpubTrackWindowTest {
    private fun chapters(count: Int) = List(count) { index ->
        EpubProgressMarker("chapter", "chapter-$index", "Chapter $index", index.toFloat() / count, null)
    }

    @Test fun shortBooksUseTheFullTrack() {
        val chapters = chapters(4)
        val track = epubTrackWindow(chapters, .4f)
        assertEquals(chapters, track.markers)
        assertEquals(.4f, track.unproject(.4f), .0001f)
        assertNull(track.previous)
        assertNull(track.next)
    }

    @Test fun longBooksExposeAdjacentChaptersAtBothEdges() {
        val chapters = chapters(20)
        val bookmark = EpubProgressMarker("bookmark", "loc-10", "Bookmark", .5f, "#ffd400")
        val marks = chapters + bookmark
        val track = epubTrackWindow(marks, .5f)
        assertEquals(chapters.subList(7, 14) + bookmark, track.markers)
        assertEquals(chapters[6], track.previous)
        assertEquals(chapters[14], track.next)
        assertEquals(.5f, track.unproject(track.project(.5f)), .0001f)
        assertNotNull(epubTrackWindow(marks, chapters[14].fraction).markers.find { it == chapters[14] })
        assertNull(epubTrackWindow(marks, 0f).previous)
        assertNull(epubTrackWindow(marks, 1f).next)
    }
}
