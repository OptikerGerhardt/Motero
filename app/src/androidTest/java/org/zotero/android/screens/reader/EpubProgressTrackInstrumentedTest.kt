package org.zotero.android.screens.reader

import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.zotero.android.R
import org.zotero.android.screens.reader.data.EpubProgressMarker
import org.zotero.android.screens.reader.toolbar.EpubProgressTrack

@RunWith(AndroidJUnit4::class)
class EpubProgressTrackInstrumentedTest {
    @get:Rule val compose = createComposeRule()

    @Test
    fun edgeButtonsAndOverlappingBookmarksSelectTheirOwnMarker() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        fun chapter(id: String, fraction: Float, root: String = id, depth: Int = 0) =
            EpubProgressMarker("chapter", "chapter.xhtml#$id", id, fraction, null, id, null, root, depth)
        val first = EpubProgressMarker("bookmark", "epubcfi(/6/2!/4/2:2)", "First flag", .45f, "#ffd400", "FLAG0001")
        val second = EpubProgressMarker("bookmark", "epubcfi(/6/2!/4/2:8)", "Second flag", .45f, "#aaaaaa", "FLAG0002")
        val chapters = listOf(chapter("One", 0f), chapter("One detail", .08f, "One", 1),
            chapter("Two", .2f), chapter("Two detail", .3f, "Two", 1),
            chapter("Three", .7f), chapter("Three detail", .8f, "Three", 1), chapter("Four", .98f))
        val selected = mutableListOf<EpubProgressMarker?>()
        compose.setContent {
            MaterialTheme {
                EpubProgressTrack(
                    state = ReaderViewState(epubPageIndex = 45, epubPageCount = 101, epubProgressMarkers = chapters + listOf(first, second)),
                    enabled = true,
                    modifier = Modifier.size(280.dp, 60.dp),
                ) { _, marker -> selected.add(marker) }
            }
        }
        compose.onNodeWithContentDescription(context.getString(R.string.reader_epub_next_chapter)).performClick()
        compose.runOnIdle { assertTrue(selected.isEmpty()) }
        compose.onNodeWithText("Three detail").assertDoesNotExist()
        compose.onNodeWithText("Three").performClick()
        compose.runOnIdle { assertEquals(chapters[4], selected.single()) }

        compose.onNodeWithContentDescription(context.getString(R.string.reader_epub_previous_chapter)).performClick()
        compose.onNodeWithText("One detail").assertDoesNotExist()
        compose.onNodeWithText("One").performClick()
        compose.runOnIdle { assertEquals(chapters[0], selected.last()) }

        val track = compose.onNodeWithContentDescription(context.getString(R.string.reader_epub_navigation))
        track.performTouchInput { click(center) }
        compose.onNodeWithText("Second flag").performClick()
        compose.runOnIdle { assertEquals(second, selected.last()) }
        track.performTouchInput { click(center) }
        compose.onNodeWithText("First flag").performClick()
        compose.runOnIdle { assertEquals(first, selected.last()) }
    }
}
