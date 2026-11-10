package org.zotero.android.ereader

/** Observes native ownership without intercepting or reconstructing Android's input stream. */
class PenContactState {
    enum class Action { Down, PointerDown, Up, PointerUp, Cancel, Other }
    private var penDown = false
    private var guardUntil = 0L
    fun blocked(now: Long) = penDown || now < guardUntil
    fun motion(action: Action, pen: Boolean, now: Long) {
        // CANCEL ends every contact even when Android reports a finger at index 0.
        if (action == Action.Cancel) {
            val afterPen = blocked(now)
            reset()
            if (afterPen) guardUntil = now + 300
            return
        }
        if (pen) when (action) {
            Action.Down, Action.PointerDown -> penDown = true
            Action.Up, Action.PointerUp -> { penDown = false; guardUntil = now + 300 }
            else -> Unit
        }
    }
    fun reset() { penDown = false; guardUntil = 0 }
}
