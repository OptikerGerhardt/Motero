package org.zotero.android.screens.reader.toolbar

import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.click
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.zotero.android.screens.reader.ReaderViewState
import org.zotero.android.screens.reader.data.EpubProgressMarker

@RunWith(AndroidJUnit4::class)
class EpubProgressTrackInstrumentedTest {
    @get:Rule val compose = createComposeRule()

    @Test
    fun enlargedCoincidentTargetsAreBothReachableAndTheEndsNavigate() {
        val chapter = EpubProgressMarker("chapter", "chapter.xhtml", "Chapter two", .5f, null)
        val bookmark = EpubProgressMarker("bookmark", "epubcfi(/6/2!/4/1:0)", "Saved passage", .5f, "#ffd400")
        val opens = mutableListOf<Pair<Float, EpubProgressMarker?>>()
        compose.setContent {
            MaterialTheme {
                EpubProgressTrack(
                    state = ReaderViewState(epubPageIndex = 4, epubPageCount = 9,
                        epubProgressMarkers = listOf(chapter, bookmark)),
                    enabled = true,
                    modifier = Modifier.size(300.dp, 60.dp).testTag("epub-progress-track"),
                    onNavigate = { fraction, marker -> opens.add(fraction to marker) },
                )
            }
        }
        val track = compose.onNodeWithTag("epub-progress-track")
        // 18dp to the right of the glyph still hits both discrete targets.
        repeat(2) { choice ->
            track.performTouchInput { click(center + Offset(width * .06f, 0f)) }
            compose.onNodeWithText(if (choice == 0) "Chapter two" else "Saved passage").performClick()
        }
        track.performTouchInput {
            click(Offset(2f, center.y))
            click(Offset(width - 2f, center.y))
        }
        compose.runOnIdle {
            assertEquals(listOf(chapter, bookmark, null, null), opens.map { it.second })
            assertTrue(opens[2].first < .02f)
            assertTrue(opens[3].first > .98f)
        }
    }
}
