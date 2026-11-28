package org.zotero.android.screens.reader

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.zotero.android.screens.reader.data.EpubProgressMarker
import org.zotero.android.screens.reader.toolbar.epubTrackWindow

class EpubTrackWindowTest {
    private fun heading(id: String, at: Float, root: String = id, depth: Int = 0, parent: String? = null) =
        EpubProgressMarker("chapter", "chapter.xhtml#$id", "Heading", at, null, id, parent, root, depth)

    @Test fun shortBooksUseTheFullTrack() {
        val markers = listOf(heading("one", 0f), heading("two", .5f))
        val track = epubTrackWindow(markers, .4f)
        assertEquals(markers, track.markers)
        assertEquals(.4f, track.unproject(.4f), .0001f)
        assertTrue(track.previous.isEmpty())
        assertTrue(track.next.isEmpty())
    }

    @Test fun flatOutlineKeepsDistinctMarkersSharingAPosition() {
        val chapters = List(20) { heading("$it", it / 20f) }
        val repeated = heading("repeat", .5f)
        val bookmark = EpubProgressMarker("bookmark", "cfi", "Bookmark", .5f, "#ffd400")
        val track = epubTrackWindow(chapters + repeated + bookmark, .5f)
        assertEquals(chapters.subList(7, 14) + repeated + bookmark, track.markers)
        assertEquals(chapters.subList(0, 7), track.previous)
        assertEquals(chapters.subList(14, 20), track.next)
        assertEquals(.5f, track.unproject(track.project(.5f)), .0001f)
    }

    @Test fun edgeMenusKeepLocalDetailAndCoarsenOutsideBranches() {
        val chapters = listOf(
            heading("1", 0f), heading("1.1", .05f, "1", 1, "1"),
            heading("2", .1f), heading("2.1", .2f, "2", 1, "2"),
            heading("2.2", .3f, "2", 1, "2"), heading("2.2.1", .35f, "2", 2, "2.2"),
            heading("2.3", .4f, "2", 1, "2"), heading("2.3.1", .45f, "2", 2, "2.3"),
            heading("3", .6f), heading("3.1", .65f, "3", 1, "3"), heading("4", .9f),
        )
        val track = epubTrackWindow(chapters, .35f, markerBudget = 4)
        assertEquals(listOf("2.2", "2.2.1"), track.markers.map { it.id })
        assertEquals(listOf("1", "2", "2.1"), track.previous.map { it.id })
        assertEquals(listOf("2.3", "2.3.1", "3", "4"), track.next.map { it.id })
        assertEquals(listOf("3", "3.1"), epubTrackWindow(chapters, .6f, 4).markers.map { it.id })
    }
}
