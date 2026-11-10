package org.zotero.android.screens.reader

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.settings.data.ReaderSettings

class ReaderComfortSettingsTest {
    @Test fun `old settings migrate to usable margins and preserve their typography`() {
        val settings = Gson().fromJson("""{"pageWidth":1,"textScale":1.3,"lineHeight":1.6}""", ReaderSettings::class.java)
        assertEquals(2f,settings.effectiveMargins(),0f)
        assertEquals(1.3f,settings.effectiveTextScale(),0f)
        assertEquals("serif",settings.effectiveFontFamily())
    }
    @Test fun `invalid stored margins and fonts cannot break a reader layout`() {
        val settings = ReaderSettings.default()
        settings.epubMargins = Float.NaN
        assertEquals(8f,settings.effectiveMargins(),0f)
        settings.epubMargins = -10f
        assertEquals(0f,settings.effectiveMargins(),0f)
        settings.epubMargins = 50f
        assertEquals(20f,settings.effectiveMargins(),0f)
        settings.epubFontFamily = "invalid-font"
        assertEquals("serif",settings.effectiveFontFamily())
        settings.epubFontFamily = "original"
        assertEquals("original",settings.effectiveFontFamily())
    }
    @Test fun `comfort settings round trip alongside existing crop and selection settings`() {
        val settings = ReaderSettings.default().copy(epubMargins=11f,epubFontFamily="sans-serif",nativeTextSelection=true,fitToWidth=true,fitReferenceOverride="cropped-content")
        val restored = Gson().fromJson(Gson().toJson(settings),ReaderSettings::class.java)
        assertEquals(11f,restored.effectiveMargins(),0f)
        assertEquals("sans-serif",restored.effectiveFontFamily())
        assertTrue(restored.nativeTextSelection)
        assertEquals("width",restored.pageFitMode())
        assertEquals("cropped-content",restored.fitReference())
    }
}
