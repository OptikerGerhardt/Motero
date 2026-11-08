package org.zotero.android.screens.reader

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.launchIn
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.architecture.coroutines.ApplicationScope
import org.zotero.android.pdf.data.PageAppearanceMode
import org.zotero.android.pdf.data.PdfReaderCurrentThemeEventStream
import org.zotero.android.pdf.data.PdfReaderThemeDecider

class ReaderInitialThemeTest {
    @Test fun `explicit light and dark override the OS on initialization and later changes`() {
        for (mode in listOf(PageAppearanceMode.LIGHT, PageAppearanceMode.DARK)) {
            val stream = PdfReaderCurrentThemeEventStream(ApplicationScope(Dispatchers.Unconfined))
            val decider = PdfReaderThemeDecider(stream)
            for (osDark in listOf(true, false, true)) {
                decider.initialize(mode, osDark)
                assertEquals(mode == PageAppearanceMode.DARK, stream.currentValue()!!.isDark)
                decider.setCurrentOsTheme(!osDark)
                assertEquals(mode == PageAppearanceMode.DARK, stream.currentValue()!!.isDark)
            }
        }
    }
    @Test fun `automatic appearance follows OS immediately`() {
        val stream = PdfReaderCurrentThemeEventStream(ApplicationScope(Dispatchers.Unconfined))
        val decider = PdfReaderThemeDecider(stream)
        decider.initialize(PageAppearanceMode.AUTOMATIC, true)
        assertTrue(stream.currentValue()!!.isDark)
        decider.setCurrentOsTheme(false)
        assertFalse(stream.currentValue()!!.isDark)
    }
    @Test fun `switching documents initializes both inputs without an intermediate wrong theme`() {
        val scope = ApplicationScope(Dispatchers.Unconfined)
        val stream = PdfReaderCurrentThemeEventStream(scope)
        val decider = PdfReaderThemeDecider(stream)
        val emissions = mutableListOf<Boolean>()
        val collection = stream.flow().drop(1).onEach { emissions.add(it!!.isDark) }.launchIn(scope)
        decider.initialize(PageAppearanceMode.DARK, false)
        decider.initialize(PageAppearanceMode.LIGHT, true)
        assertEquals(listOf(true, false), emissions)
        collection.cancel()
    }
}
