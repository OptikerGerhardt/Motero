package org.zotero.android.ereader

import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.ereader.PenContactState.Action

class PenContactStateTest {
    @Test fun mixedStreamCancellationWithFingerIndexCannotLeavePalmProtectionStuck() {
        val s=PenContactState()
        s.motion(Action.Down,false,0);s.motion(Action.PointerDown,true,10)
        assertTrue(s.blocked(20))
        assertFalse(s.motion(Action.Cancel,false,30))
        assertTrue(s.blocked(31))
        assertFalse(s.blocked(330))
        assertFalse(s.motion(Action.Down,false,340))
    }
    @Test fun ordinaryFingerCancellationAddsNoGuardOrScrollingDelay() {
        val s=PenContactState()
        s.motion(Action.Down,false,0);s.motion(Action.Cancel,false,1)
        assertFalse(s.motion(Action.Down,false,2))
    }
    @Test fun palmLiftDoesNotEndPenOwnershipAndGuardEndsAfter300Milliseconds() {
        val s=PenContactState()
        s.motion(Action.Down,true,0);s.motion(Action.PointerUp,false,10)
        assertTrue(s.blocked(1000))
        s.motion(Action.PointerUp,true,1000)
        assertTrue(s.motion(Action.Down,false,1299));s.motion(Action.Up,false,1299)
        assertFalse(s.motion(Action.Down,false,1300))
    }
    @Test fun blockedNativeGestureStaysConsumedUntilReleaseAndResetRecoversLostUp() {
        val s=PenContactState()
        s.motion(Action.Down,true,0);s.motion(Action.Up,true,1)
        assertTrue(s.motion(Action.Down,false,10))
        assertTrue(s.motion(Action.Other,false,500));assertTrue(s.motion(Action.Up,false,501))
        assertFalse(s.motion(Action.Down,false,502))
        s.motion(Action.PointerDown,true,503);s.reset()
        assertFalse(s.motion(Action.Down,false,504))
    }
}
