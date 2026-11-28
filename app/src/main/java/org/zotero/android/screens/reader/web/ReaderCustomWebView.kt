package org.zotero.android.screens.reader.web

import android.content.Context
import android.util.AttributeSet
import android.view.ActionMode
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.webkit.WebView
import kotlin.math.abs

class ReaderCustomWebView(context: Context, attrs: AttributeSet? = null) : WebView(context, attrs) {

    private var readerBackground: Int? = null
    fun setReaderBackground(color: Int) {
        if (readerBackground == color) return
        readerBackground = color
        setBackgroundColor(color)
    }

    var selectionActionModeDelegate: ReaderSelectionActionModeDelegate? = null

    private var activeSelectionActionMode: ActionMode? = null

    var onUserGestureDetected: (() -> Unit)? = null
    var neutralStylus = false
    private var ignoreNeutralStylusContact = false
    private var restartedStylusDownTime: Long? = null
    private var gestureDownX = 0f
    private var gestureDownY = 0f
    private var gestureAlreadyReportedThisTouch = false
    private val touchSlop by lazy { ViewConfiguration.get(context).scaledTouchSlop }

    override fun dispatchHoverEvent(event: MotionEvent): Boolean {
        org.zotero.android.ereader.DeviceInput.motion(event)
        return super.dispatchHoverEvent(event)
    }
    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                restartedStylusDownTime = null
                val profile = org.zotero.android.ereader.DeviceProfileStore.state.value
                val barrelButton = if (profile.buttonMask == 4) MotionEvent.BUTTON_TERTIARY else MotionEvent.BUTTON_SECONDARY
                ignoreNeutralStylusContact = neutralStylus
                    && ev.getToolType(0) == MotionEvent.TOOL_TYPE_STYLUS
                    && ev.buttonState and barrelButton == 0
                    && !org.zotero.android.ereader.DeviceInput.isEraserButtonHeld
                gestureDownX = ev.x
                gestureDownY = ev.y
                gestureAlreadyReportedThisTouch = false
            }

            MotionEvent.ACTION_POINTER_DOWN -> {
                // Resizing the WebView during a pinch interrupts PDF.js zoom.
                gestureAlreadyReportedThisTouch = true
            }

            MotionEvent.ACTION_MOVE -> {
                // The Reader starts hold-and-drag highlighting after 250 ms.
                // Keep the layout stable for that gesture and native long-press selection.
                if (!gestureAlreadyReportedThisTouch && ev.pointerCount == 1 &&
                    ev.getToolType(0) == MotionEvent.TOOL_TYPE_FINGER &&
                    ev.eventTime - ev.downTime < 200L &&
                    (abs(ev.x - gestureDownX) > touchSlop || abs(ev.y - gestureDownY) > touchSlop)
                ) {
                    gestureAlreadyReportedThisTouch = true
                    onUserGestureDetected?.invoke()
                }
            }
        }
        if (ignoreNeutralStylusContact && ev.actionMasked == MotionEvent.ACTION_MOVE &&
            ev.pointerCount == 1 && org.zotero.android.ereader.DeviceInput.isEraserButtonHeld
        ) {
            // Give WebView a valid gesture start at the first armed sample.
            // Returning a MOVE with no preceding DOWN can start native selection.
            val down = neutralPenEvent(ev, ev.eventTime, MotionEvent.ACTION_DOWN)
            restartedStylusDownTime = ev.eventTime
            ignoreNeutralStylusContact = false
            try { super.dispatchTouchEvent(down) } finally { down.recycle() }
            return true
        }
        if (ignoreNeutralStylusContact) {
            if (ev.actionMasked == MotionEvent.ACTION_UP || ev.actionMasked == MotionEvent.ACTION_CANCEL) {
                ignoreNeutralStylusContact = false
            }
            return true
        }
        val downTime = restartedStylusDownTime ?: return super.dispatchTouchEvent(ev)
        val contact = neutralPenEvent(ev, downTime, ev.action)
        if (ev.actionMasked == MotionEvent.ACTION_UP || ev.actionMasked == MotionEvent.ACTION_CANCEL) {
            restartedStylusDownTime = null
        }
        return try { super.dispatchTouchEvent(contact) } finally { contact.recycle() }
    }

    private fun neutralPenEvent(event: MotionEvent, downTime: Long, action: Int): MotionEvent {
        val pointers = Array(event.pointerCount) { index ->
            MotionEvent.PointerProperties().also { event.getPointerProperties(index, it) }
        }
        val positions = Array(event.pointerCount) { index ->
            MotionEvent.PointerCoords().also { event.getPointerCoords(index, it) }
        }
        return MotionEvent.obtain(downTime, event.eventTime, action, event.pointerCount, pointers, positions,
            event.metaState, event.buttonState, event.xPrecision, event.yPrecision,
            event.deviceId, event.edgeFlags, event.source, event.flags)
    }

    fun invalidateSelectionActionMode() {
        activeSelectionActionMode?.invalidate()
    }

    override fun startActionModeForChild(
        originalView: View,
        callback: ActionMode.Callback
    ): ActionMode {
        return super.startActionModeForChild(originalView, callback)
    }

    override fun startActionModeForChild(
        originalView: View,
        callback: ActionMode.Callback,
        type: Int
    ): ActionMode {
        return super.startActionModeForChild(originalView, callback, type)
    }

    public override fun startActionMode(callback: ActionMode.Callback): ActionMode {
        val actionMode = startActionModeForChild(this, wrapSelectionCallback(callback))
        activeSelectionActionMode = actionMode
        return actionMode
    }

    public override fun startActionMode(callback: ActionMode.Callback, type: Int): ActionMode {
        val actionMode = startActionModeForChild(this, wrapSelectionCallback(callback), type)
        activeSelectionActionMode = actionMode
        return actionMode
    }

    private fun wrapSelectionCallback(callback: ActionMode.Callback): ActionMode.Callback {
        return ReaderWevViewSelectActionModeCallback(
            context = context,
            original = callback,
            delegate = { selectionActionModeDelegate },
            onDestroyed = { activeSelectionActionMode = null }
        )
    }

    override fun showContextMenu(): Boolean {
        return super.showContextMenu()
    }
}
