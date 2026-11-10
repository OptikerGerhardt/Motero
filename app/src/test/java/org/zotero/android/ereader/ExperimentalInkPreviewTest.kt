package org.zotero.android.ereader

import org.junit.Assert.*
import org.junit.Test

class ExperimentalInkPreviewTest {
    private class Driver: InkPreviewDriver {
        var opened = 0; var cleared = 0; var closed = 0
        override fun open(clip: PreviewRect, excluded: List<PreviewRect>) { opened++ }
        override fun clear() { cleared++ }
        override fun close() { closed++ }
    }
    private val verified = InkPreviewCapabilities(true,true,true,.20,true,true)
    private val clip = PreviewRect(0f,0f,100f,100f)
    @Test fun cleanupClosesTheDriverEvenIfPreviewClearFails() {
        var closed = 0
        val driver = object: InkPreviewDriver {
            override fun open(clip: PreviewRect, excluded: List<PreviewRect>) {}
            override fun clear() { throw IllegalStateException("driver failed") }
            override fun close() { closed++ }
        }
        val session = ExperimentalInkPreview(driver)
        session.start(verified,clip,emptyList());session.close()
        assertEquals(1,closed)
    }
    @Test fun everySafetyAndHardwareGateMustPass() {
        for (caps in listOf(verified.copy(sdkPresent=false), verified.copy(licenseApproved=false),
            verified.copy(deviceValidated=false),verified.copy(p95Improvement=.19),
            verified.copy(geometryVerified=false),verified.copy(optedIn=false))) {
            val d=Driver();assertFalse(ExperimentalInkPreview(d).start(caps,clip,emptyList()));assertEquals(0,d.opened)
        }
    }
    @Test fun excludedToolbarAndOutsideCropCannotStartPreview() {
        val d=Driver();val s=ExperimentalInkPreview(d)
        assertTrue(s.start(verified,clip,listOf(PreviewRect(0f,0f,100f,20f))))
        assertFalse(s.begin(1,50f,10f));assertFalse(s.begin(1,150f,50f));assertTrue(s.begin(1,50f,50f))
    }
    @Test fun commitOnceAndKeepPreviewUntilTheMatchingPaintAck() {
        val d=Driver();val s=ExperimentalInkPreview(d);var saved=0
        s.start(verified,clip,emptyList());s.begin(5,50f,50f)
        assertTrue(s.commit(5){saved++});assertFalse(s.commit(5){saved++});assertEquals(1,saved)
        assertEquals(0,d.cleared);assertFalse(s.painted(4));assertTrue(s.painted(5));assertEquals(1,d.cleared)
        assertTrue(s.begin(6,50f,50f));s.close();assertEquals(1,d.closed)
        assertFalse(s.commit(6){saved++})
    }
}
