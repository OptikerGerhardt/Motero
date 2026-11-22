package org.zotero.android.screens.reader.scrubber

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ReaderScrubberGeometryTest {
    @Test fun `synthetic 100 page viewport reproduces old right tail and new flush edge`() {
        // Reproduce the old 0.72 * 44dp assumed thumbnail aspect while actual
        // cells rendered at 32dp with 6dp spacing. No private PDF data is used.
        val pages = 100
        val density = 1f
        for (width in listOf(319, 320, 321, 501, 502)) {
            val oldCount = ((width + 6f) / (44f * 0.72f + 6f)).toInt()
                .coerceIn(2, pages)
            val oldRenderedWidth = oldCount * 32 + (oldCount - 1) * 6
            val newSlots = computeScrubberSlotWidths(width, pages, density)
            val newRenderedWidth = newSlots.sum() + (newSlots.size - 1) * 6
            assertTrue("Expected an old trailing gap at width $width", oldRenderedWidth < width)
            assertEquals("New right edge at width $width", width, newRenderedWidth)
        }
    }

    @Test fun `non divisible widths distribute every remaining pixel`() {
        for (width in listOf(319, 320, 321, 501, 502)) {
            val slots = computeScrubberSlotWidths(width, 100, 1f)
            assertTrue(slots.isNotEmpty())
            assertEquals(width, slots.sum() + (slots.size - 1) * 6)
            assertTrue(slots.maxOrNull()!! - slots.minOrNull()!! <= 1)
        }
    }

    @Test fun `density rounding preserves exact measured width`() {
        for (density in listOf(1f, 1.25f, 1.5f, 2.625f, 3f)) {
            val spacing = kotlin.math.round(6f * density).toInt()
            for (width in listOf(227, 351, 720)) {
                val slots = computeScrubberSlotWidths(width, 200, density)
                assertEquals(width, slots.sum() + (slots.size - 1) * spacing)
            }
        }
    }

    @Test fun `empty and short documents preserve page counts`() {
        assertTrue(computeScrubberSlotWidths(300, 0, 1f).isEmpty())
        assertTrue(computeScrubberSlotWidths(0, 5, 1f).isEmpty())
        assertEquals(listOf(300), computeScrubberSlotWidths(300, 1, 1f))
        assertEquals(2, computeScrubberSlotWidths(300, 2, 1f).size)
    }
    @Test fun `tiny viewport never allocates gaps beyond its measured width`() {
        for (density in listOf(1f, 1.25f, 2.625f, 3f)) {
            val gap = kotlin.math.round(6f * density).toInt()
            for (width in 1..(gap * 3 + 2)) {
                val slots = computeScrubberSlotWidths(width, 100, density)
                assertTrue(slots.isNotEmpty())
                assertTrue(slots.all { it >= 1 })
                assertEquals(width, slots.sum() + (slots.size - 1) * gap)
            }
        }
    }

}
