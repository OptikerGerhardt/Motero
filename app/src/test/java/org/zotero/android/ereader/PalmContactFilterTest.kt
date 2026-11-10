package org.zotero.android.ereader

import org.junit.Assert.*
import org.junit.Test

class PalmContactFilterTest {
    @Test fun penAndMouseCanAlwaysOperateNativeControls() {
        val f=PalmContactFilter<Int>()
        assertFalse(f.consume(1,false,true,true));assertFalse(f.consume(1,false,false,true))
    }
    @Test fun rejectedPalmStaysRejectedThroughReleaseAfterPenGuardEnds() {
        val f=PalmContactFilter<Int>()
        assertTrue(f.consume(1,true,true,true));assertTrue(f.consume(1,true,true,false))
        assertTrue(f.consume(1,true,false,false));assertFalse(f.consume(1,true,true,false))
    }
    @Test fun aFingerAlreadyDownIsCancelledAsSoonAsThePenTakesOver() {
        val f=PalmContactFilter<Int>()
        assertFalse(f.consume(1,true,true,false));assertTrue(f.consume(1,true,true,true))
        assertTrue(f.consume(1,true,false,true))
    }
    @Test fun normalFingersHaveNoDelayAndFreshContactsDoNotInheritOldPalmIds() {
        val f=PalmContactFilter<Int>()
        assertFalse(f.consume(1,true,true,false));assertFalse(f.consume(1,true,false,false))
        f.consume(2,true,true,true);assertFalse(f.consume(3,true,true,false))
    }
}
