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
    var onEraser: ((Boolean, Boolean) -> Unit)? = null
    var onMotionEraser: ((Boolean, Boolean) -> Unit)? = null
    private var motionEraser = false
    private var motionButtonHeld = false
    val isEraserButtonHeld get() = penButton.held || motionButtonHeld
    private val contacts = PenContactState()
    private var deviceId: Int? = null
    private var lastDiagnosticAt = 0L
    val palmBlocked get() = contacts.blocked(SystemClock.uptimeMillis())
    fun motion(event: MotionEvent) {
        if (event.pointerCount == 0) return
        val index = event.actionIndex.coerceIn(0, event.pointerCount - 1)
        val tool = event.getToolType(index)
        val pen = tool == MotionEvent.TOOL_TYPE_STYLUS || tool == MotionEvent.TOOL_TYPE_ERASER
        if (pen) {
            if (deviceId != null && deviceId != event.deviceId) reset()
            deviceId = event.deviceId
            val profile = DeviceProfileStore.state.value
            val button = if (profile.buttonMask == 4) MotionEvent.BUTTON_STYLUS_SECONDARY else MotionEvent.BUTTON_STYLUS_PRIMARY
            val ended = event.actionMasked == MotionEvent.ACTION_CANCEL || event.actionMasked == MotionEvent.ACTION_HOVER_EXIT
            // Some Android WebViews omit the stylus barrel bit in PointerEvent.buttons.
            val held = when {
                ended -> false
                event.actionMasked == MotionEvent.ACTION_BUTTON_PRESS && event.actionButton == button -> true
                event.actionMasked == MotionEvent.ACTION_BUTTON_RELEASE && event.actionButton == button -> false
                else -> event.buttonState and button != 0
            }
            updateMotionEraser(profile.eraserButtonMode == "hold" && held, held)
            val hover = event.actionMasked == MotionEvent.ACTION_HOVER_MOVE || event.actionMasked == MotionEvent.ACTION_HOVER_ENTER
            if (event.eventTime - lastDiagnosticAt >= 100 || event.actionMasked != MotionEvent.ACTION_MOVE) {
                lastDiagnosticAt = event.eventTime
                mutableDiagnostics.value = "Tool: ${if (tool == MotionEvent.TOOL_TYPE_ERASER) "eraser" else "stylus"}; buttons: ${event.buttonState}; pressure: ${event.getPressure(index)}; action: ${MotionEvent.actionToString(event.action)}; actionButton: ${event.actionButton}; held: $held; hover: $hover. Backend: standard Android/WebView. BOOX SDK/refresh: unavailable (not validated)."
            }
        }
        // Observe only. Native controls filter their own palm contacts; WebView
        // receives Android's original stream, including coalesced pen samples.
        val action = when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> PenContactState.Action.Down
            MotionEvent.ACTION_POINTER_DOWN -> PenContactState.Action.PointerDown
            MotionEvent.ACTION_UP -> PenContactState.Action.Up
            MotionEvent.ACTION_POINTER_UP -> PenContactState.Action.PointerUp
            MotionEvent.ACTION_CANCEL -> PenContactState.Action.Cancel
            else -> PenContactState.Action.Other
        }
        contacts.motion(action, pen, SystemClock.uptimeMillis())
    }

    fun key(event: KeyEvent, editing: Boolean): Boolean {
        if ((editing && event.action != KeyEvent.ACTION_UP) || onEraser == null && !learnKey) return false
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
        val defaultKey = if (DeviceProfileStore.state.value.buttonMask == 4) 309 else 308
        val assigned = DeviceProfileStore.assignedKey(descriptor) ?: defaultKey
        if (event.keyCode != assigned) {
            if (stylusKey && event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                mutableDiagnostics.value = "Stylus key ${KeyEvent.keyCodeToString(event.keyCode)} observed; ${KeyEvent.keyCodeToString(assigned)} is assigned."
            }
            return false
        }
        if (event.action !in setOf(KeyEvent.ACTION_DOWN, KeyEvent.ACTION_UP)) return false
        val active = penButton.event(descriptor, event.keyCode, event.action == KeyEvent.ACTION_DOWN,
            event.repeatCount, DeviceProfileStore.state.value.eraserButtonMode == "toggle")
        if (event.repeatCount == 0) {
            mutableDiagnostics.value = "Stylus key: ${KeyEvent.keyCodeToString(event.keyCode)} ${if (event.action == KeyEvent.ACTION_DOWN) "down" else "up"}; eraser: $active."
        }
        onEraser?.invoke(active, penButton.held)
        return true
    }
    private fun updateMotionEraser(active: Boolean, held: Boolean) {
        if (motionEraser == active && motionButtonHeld == held) return
        motionEraser = active
        motionButtonHeld = held
        onMotionEraser?.invoke(active, held)
    }

    fun reset() {
        contacts.reset()
        deviceId = null
        penButton.reset()
        onEraser?.invoke(false, false)
        updateMotionEraser(false, false)
    }
}
