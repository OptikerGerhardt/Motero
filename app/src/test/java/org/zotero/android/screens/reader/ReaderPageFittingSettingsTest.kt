package org.zotero.android.screens.reader

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.screens.reader.settings.data.ReaderSettings

class ReaderPageFittingSettingsTest {
    @Test fun `older settings keep their fitting mode and use the selected crop`() {
        val old = Gson().fromJson("""{"fitToWidth":true,"fitToContent":false}""", ReaderSettings::class.java)
        assertEquals("width", old.pageFitMode())
        assertFalse(old.fitToHeight)
        assertFalse(old.fitTextReference)
        assertFalse(old.fitWidthCrop)
        assertFalse(old.includeMarginalia)
        assertEquals("cropped-content", old.fitReference())
        assertEquals(0L, old.fittingRevision)
    }

    @Test fun `every fitting choice clears the other modes`() {
        val settings = ReaderSettings.default()
        for (mode in listOf("content", "width", "height", "none", "width", "content")) {
            settings.setPageFitMode(mode)
            assertEquals(mode, settings.pageFitMode())
            assertEquals(if (mode == "none") 0 else 1,
                listOf(settings.fitToContent, settings.fitToWidth, settings.fitToHeight).count { it })
        }
    }

    @Test fun `new fitting settings survive persistence including revision and text reference`() {
        val settings = ReaderSettings.default().apply {
            setPageFitMode("height")
            fitTextReference = true
            fitWidthCrop = true
            includeMarginalia = true
            fittingRevision = 17
        }
        val restored = Gson().fromJson(Gson().toJson(settings), ReaderSettings::class.java)
        assertEquals(settings, restored)
        assertEquals("height", restored.pageFitMode())
        assertEquals("content", restored.fitReference())
    }

    @Test fun `active width and height fitting always use the chosen crop`() {
        val settings = ReaderSettings.default().apply {
            setPageFitMode("width")
            fitTextReference = true
        }
        assertEquals(if(settings.fitToWidth) "cropped-content" else "content", settings.fitReference())
        settings.fitWidthCrop = true
        assertEquals("cropped-content", settings.fitReference())
        settings.setPageFitMode("height")
        assertEquals(if(settings.fitToWidth) "cropped-content" else "content", settings.fitReference())
        settings.setPageFitMode("width")
        assertEquals("cropped-content", settings.fitReference())
        settings.fitTextReference = false
        assertEquals("cropped-content", settings.fitReference())
    }
    @Test fun `progress setting survives reopening and old settings retain both`() {
        val gson=Gson()
        assertEquals("both", ReaderSettings.default().effectiveProgressMode())
        for(mode in listOf("both", "hidden", "position", "percent")) {
            val settings=ReaderSettings.default().apply { epubProgressMode=mode }
            assertEquals(mode, gson.fromJson(gson.toJson(settings),ReaderSettings::class.java).effectiveProgressMode())
        }
        assertEquals("both", ReaderSettings.default().apply { epubProgressMode="unknown" }.effectiveProgressMode())
    }
    @Test fun `explicit reference survives reopening and overrides the width default`() {
        val settings = ReaderSettings.default()
        for (mode in listOf("width", "height")) for (reference in listOf("page", "content", "cropped-content")) {
            settings.setPageFitMode(mode)
            settings.fitReferenceOverride = reference
            val restored = Gson().fromJson(Gson().toJson(settings), ReaderSettings::class.java)
            assertEquals(reference, restored.fitReference())
        }
        settings.setPageFitMode("none")
        assertEquals("page", settings.fitReference())
    }

}
