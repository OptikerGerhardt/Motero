package org.zotero.android.ereader

import android.os.SystemClock
import android.view.KeyEvent
import android.view.MotionEvent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Live diagnostics contain capabilities/buttons only, never positions or document content. */
object DeviceInput {
    private val penButton = PenButtonState()
    private val mutableDiagnostics = MutableStateFlow("No stylus event received. Backend: standard Android/WebView.")
    val diagnostics = mutableDiagnostics.asStateFlow()
    var learnKey = false
    var onEraser: ((Boolean) -> Unit)? = null
    private val contacts = PenContactState()
    private var deviceId: Int? = null
    private var lastDiagnosticAt = 0L
    val palmBlocked get() = contacts.blocked(SystemClock.uptimeMillis())
    fun motion(event: MotionEvent): Boolean {
        val index = event.actionIndex.coerceIn(0, event.pointerCount - 1)
        val tool = event.getToolType(index)
        val pen = tool == MotionEvent.TOOL_TYPE_STYLUS || tool == MotionEvent.TOOL_TYPE_ERASER
        if (pen) {
            if (deviceId != null && deviceId != event.deviceId) reset()
            deviceId = event.deviceId
            val hover = event.actionMasked == MotionEvent.ACTION_HOVER_MOVE || event.actionMasked == MotionEvent.ACTION_HOVER_ENTER
            if (event.eventTime - lastDiagnosticAt >= 100 || event.actionMasked != MotionEvent.ACTION_MOVE) {
            lastDiagnosticAt = event.eventTime
            mutableDiagnostics.value = "Tool: ${if (tool == MotionEvent.TOOL_TYPE_ERASER) "eraser" else "stylus"}; buttons: ${event.buttonState}; pressure: ${event.getPressure(index)}; hover: $hover. Backend: standard Android/WebView. BOOX SDK/refresh: unavailable (not validated)."
            }
        }
        // Mixed streams must reach WebView, whose pointer router retains the pen
        // and suppresses just the palm. Native toolbar finger taps are blocked here.
        val action = when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> PenContactState.Action.Down
            MotionEvent.ACTION_POINTER_DOWN -> PenContactState.Action.PointerDown
            MotionEvent.ACTION_UP -> PenContactState.Action.Up
            MotionEvent.ACTION_POINTER_UP -> PenContactState.Action.PointerUp
            MotionEvent.ACTION_CANCEL -> PenContactState.Action.Cancel
            else -> PenContactState.Action.Other
        }
        return contacts.motion(action, pen, SystemClock.uptimeMillis())
    }

    fun key(event: KeyEvent, editing: Boolean): Boolean {
        if (editing || onEraser == null && !learnKey) return false
        if (event.keyCode in setOf(KeyEvent.KEYCODE_VOLUME_UP, KeyEvent.KEYCODE_VOLUME_DOWN,
                KeyEvent.KEYCODE_PAGE_UP, KeyEvent.KEYCODE_PAGE_DOWN, KeyEvent.KEYCODE_BACK,
                KeyEvent.KEYCODE_HOME, KeyEvent.KEYCODE_POWER, KeyEvent.KEYCODE_ENTER)) return false
        val descriptor = event.device?.descriptor ?: return false
        val stylusKey = event.keyCode in 308..311
        if (learnKey && event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0 &&
            (stylusKey || event.device?.isVirtual == false && event.keyCode >= KeyEvent.KEYCODE_BUTTON_A)) {
            DeviceProfileStore.assignKey(descriptor, event.keyCode); learnKey = false
            mutableDiagnostics.value = "Assigned ${KeyEvent.keyCodeToString(event.keyCode)} for this input device."
        }
        val assigned = DeviceProfileStore.assignedKey(descriptor) ?: 308
        if (event.keyCode != assigned || event.action !in setOf(KeyEvent.ACTION_DOWN, KeyEvent.ACTION_UP)) return false
        val active = penButton.event(descriptor, event.keyCode, event.action == KeyEvent.ACTION_DOWN,
            event.repeatCount, DeviceProfileStore.state.value.eraserButtonMode == "toggle")
        onEraser?.invoke(active)
        return true
    }
    fun reset() { contacts.reset(); deviceId = null; penButton.reset(); onEraser?.invoke(false) }
}
