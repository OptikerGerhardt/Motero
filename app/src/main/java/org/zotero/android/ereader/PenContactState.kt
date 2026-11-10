package org.zotero.android.ereader

/** Native gesture ownership; cancellation ends the entire stream regardless of tool/index. */
class PenContactState {
    enum class Action { Down, PointerDown, Up, PointerUp, Cancel, Other }
    private var penDown = false
    private var guardUntil = 0L
    private var blockedGesture = false
    fun blocked(now: Long) = penDown || now < guardUntil
    fun motion(action: Action, pen: Boolean, now: Long): Boolean {
        // Android can deliver CANCEL with a finger at actionIndex 0 even while a
        // different pointer was the pen. Never wait for a pen-typed UP after it.
        if (action == Action.Cancel) {
            val afterPen = blocked(now)
            reset()
            if (afterPen) guardUntil = now + 300
            return false
        }
        if (pen) when (action) {
            Action.Down, Action.PointerDown -> penDown = true
            Action.Up, Action.PointerUp -> { penDown = false; guardUntil = now + 300 }
            else -> Unit
        }
        if (action == Action.Down) blockedGesture = !pen && blocked(now)
        val consume = blockedGesture
        if (action == Action.Up) blockedGesture = false
        return consume
    }
    fun reset() { penDown = false; guardUntil = 0; blockedGesture = false }
}
