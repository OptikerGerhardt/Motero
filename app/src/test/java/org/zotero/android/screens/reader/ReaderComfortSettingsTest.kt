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
    @Test fun `vertical EPUB margins migrate clamp and persist independently of side margins`() {
        val old = Gson().fromJson("""{"epubMargins":11}""", ReaderSettings::class.java)
        assertEquals(3f, old.effectiveVerticalMargins(), 0f)
        old.epubVerticalMargins = 0f
        assertEquals(0f, old.effectiveVerticalMargins(), 0f)
        old.epubVerticalMargins = Float.NaN
        assertEquals(3f, old.effectiveVerticalMargins(), 0f)
        old.epubVerticalMargins = 40f
        assertEquals(15f, old.effectiveVerticalMargins(), 0f)
        old.epubVerticalMargins = 7f
        val restored = Gson().fromJson(Gson().toJson(old), ReaderSettings::class.java)
        assertEquals(7f, restored.effectiveVerticalMargins(), 0f)
        assertEquals(11f, restored.effectiveMargins(), 0f)
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

    @Test fun `negative vertical margins and page backgrounds persist without altering existing fitting`() {
        val settings=ReaderSettings.default().copy(epubVerticalMargins=-12f,pageBackground="sepia",fitToWidth=true)
        val restored=Gson().fromJson(Gson().toJson(settings),ReaderSettings::class.java)
        assertEquals(-12f,restored.effectiveVerticalMargins(),0f)
        assertEquals("sepia",restored.effectivePageBackground())
        assertEquals("width",restored.pageFitMode())
        restored.pageBackground="untrusted";restored.epubVerticalMargins=-100f
        assertEquals("default",restored.effectivePageBackground())
        assertEquals(-20f,restored.effectiveVerticalMargins(),0f)
    }

    @Test fun `automatic remembers the light and dark paper families independently across restart`() {
        val settings = ReaderSettings.default()
        settings.selectAppearance("sepia")
        settings.selectAppearance("black")
        settings.selectAppearance("automatic")
        val restored = Gson().fromJson(Gson().toJson(settings), ReaderSettings::class.java)
        assertEquals("sepia", restored.effectivePageBackground(false))
        assertEquals("black", restored.effectivePageBackground(true))
        assertEquals(org.zotero.android.screens.reader.settings.data.PageAppearanceMode.AUTOMATIC, restored.effectiveAppearanceMode())
        restored.selectAppearance("snow")
        assertEquals("snow", restored.effectivePageBackground(true))
        assertEquals(org.zotero.android.screens.reader.settings.data.PageAppearanceMode.LIGHT, restored.effectiveAppearanceMode())
        restored.selectAppearance("automatic")
        assertEquals("snow", restored.effectivePageBackground(false))
        assertEquals("black", restored.effectivePageBackground(true))
    }
    @Test fun `legacy paper choices migrate with their family and survive switching to automatic`() {
        val settings = ReaderSettings.default().copy(pageBackground="sepia")
        assertEquals("sepia", settings.effectiveAppearance())
        assertEquals(org.zotero.android.screens.reader.settings.data.PageAppearanceMode.LIGHT, settings.effectiveAppearanceMode())
        settings.selectAppearance("automatic")
        assertEquals("sepia", settings.effectivePageBackground(false))
        assertEquals("dark", settings.effectivePageBackground(true))
    }
    @Test fun `the negative margin endpoint reaches the physical screen without a dead range`() {
        assertEquals(-7f,ReaderSettings.minimumVerticalMargin(60f,900f),0f)
        assertEquals(-3f,ReaderSettings.minimumVerticalMargin(30f,1200f),0f)
        assertEquals(0f,ReaderSettings.minimumVerticalMargin(0f,900f),0f)
        assertEquals(-7f,ReaderSettings.minimumVerticalMargin(60f,0f),0f)
    }
}
