package org.zotero.android.screens.reader.scrubber

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ReaderScrubberGeometryTest {
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
}
