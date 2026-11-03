package org.zotero.android.screens.reader

import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.settings.compactReaderOptionLabels
import org.zotero.android.screens.reader.settings.readerOptionLabel

class ReaderOptionLabelsTest {
    @Test fun `reported narrow selected Medium uses M while the wide button keeps Medium`() {
        val labels = compactReaderOptionLabels(listOf("None", "Small", "Medium", "Large"))
        assertEquals(listOf("N", "S", "M", "L"), labels)
        assertEquals("M", readerOptionLabel("Medium", labels[2], 58, 32))
        assertEquals("Medium", readerOptionLabel("Medium", labels[2], 58, 58))
        assertEquals("Medium", readerOptionLabel("Medium", labels[2], 58, 100))
    }
    @Test fun `multiword options have distinct initials`() {
        assertEquals(listOf("O", "FTC", "FTW", "FTH"), compactReaderOptionLabels(listOf("Off", "Fit to Content", "Fit to Width", "Fit to Height")))
        assertEquals(listOf("HAD", "AS"), compactReaderOptionLabels(listOf("Hold and drag", "Android selection")))
    }
    @Test fun `localized collisions stay distinguishable without changing full labels`() {
        assertEquals(listOf("Ke", "Kl", "M", "G"), compactReaderOptionLabels(listOf("Keine", "Klein", "Mittel", "Groß")))
        assertEquals(listOf("É", "S"), compactReaderOptionLabels(listOf("Élevé", "Simple")))
        assertEquals(listOf("同じ", "同じ"), compactReaderOptionLabels(listOf("同じ", "同じ")))
    }
}
