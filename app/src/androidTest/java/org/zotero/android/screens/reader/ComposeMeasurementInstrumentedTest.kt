package org.zotero.android.screens.reader

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Smoke test for the real Android Compose measurement and pointer harness.
 * This is NOT yet the ReaderPageScrubber end-to-end test; issue #21 / PR #20
 * must supply a test of its actual component once this CI harness is available.
 */
class ComposeMeasurementInstrumentedTest {
    @get:Rule val compose = createComposeRule()

    @Test
    fun measuredChildBoundsAndTouchEventAreAvailableOnAnEmulator() {
        val bounds = mutableMapOf<Int, Rect>()
        var rowBounds: Rect? = null
        var selected = -1

        compose.setContent {
            // Stable test geometry so the instrumentation capability is checked,
            // independently of the host emulator's DPI.
            CompositionLocalProvider(LocalDensity provides Density(1f)) {
                Row(
                    modifier = Modifier.width(100.dp).height(32.dp)
                        .onGloballyPositioned { rowBounds = it.boundsInRoot() },
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    listOf(28.dp, 29.dp, 31.dp).forEachIndexed { index, width ->
                        Box(
                            Modifier.width(width).height(32.dp)
                                .testTag("thumbnail-$index")
                                .onGloballyPositioned { bounds[index] = it.boundsInRoot() }
                                .clickable { selected = index }
                        )
                    }
                }
            }
        }

        compose.waitForIdle()
        compose.runOnIdle {
            val row = requireNotNull(rowBounds)
            assertEquals(3, bounds.size)
            assertTrue(kotlin.math.abs(bounds.getValue(0).left - row.left) <= 1f)
            assertTrue(kotlin.math.abs(bounds.getValue(2).right - row.right) <= 1f)
            assertTrue(bounds.getValue(1).left > bounds.getValue(0).right)
            assertTrue(bounds.getValue(2).left > bounds.getValue(1).right)
        }
        compose.onNodeWithTag("thumbnail-2").performClick()
        compose.runOnIdle { assertEquals(2, selected) }
    }
}
