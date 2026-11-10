package org.zotero.android.ereader

import org.junit.Assert.*
import org.junit.Test
import org.zotero.android.ereader.PenContactState.Action

class PenContactStateTest {
    @Test fun mixedCancellationWithFingerIndexEndsPenOwnershipAfterTheShortGuard() {
        val s=PenContactState()
        s.motion(Action.Down,false,0);s.motion(Action.PointerDown,true,10)
        assertTrue(s.blocked(20));s.motion(Action.Cancel,false,30)
        assertTrue(s.blocked(31));assertFalse(s.blocked(330))
    }
    @Test fun ordinaryFingerCancellationAddsNoScrollingDelay() {
        val s=PenContactState()
        s.motion(Action.Down,false,0);s.motion(Action.Cancel,false,1)
        assertFalse(s.blocked(2))
    }
    @Test fun palmLiftDoesNotEndPenOwnershipAndGuardEndsAfter300Milliseconds() {
        val s=PenContactState()
        s.motion(Action.Down,true,0);s.motion(Action.PointerUp,false,10)
        assertTrue(s.blocked(1000));s.motion(Action.PointerUp,true,1000)
        assertTrue(s.blocked(1299));assertFalse(s.blocked(1300))
    }
    @Test fun penCanTakeOverAContactStartedInsideThePreviousPostPenGuard() {
        val s=PenContactState()
        s.motion(Action.Down,true,0);s.motion(Action.Up,true,1)
        s.motion(Action.Down,false,10);s.motion(Action.PointerDown,true,20)
        assertTrue(s.blocked(1000));s.motion(Action.PointerUp,true,1000)
        assertFalse(s.blocked(1300))
    }
    @Test fun resetRecoversLostUpWithoutDelayingTheNextFingerGesture() {
        val s=PenContactState()
        s.motion(Action.Down,true,0);s.reset();assertFalse(s.blocked(1))
    }
}
