package org.zotero.android.ereader

import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput

/** Only native reader controls opt in; PDF input and its historical samples stay untouched. */
fun Modifier.rejectPenPalms(): Modifier = pointerInput(Unit) {
    val contacts = PalmContactFilter<androidx.compose.ui.input.pointer.PointerId>()
    awaitPointerEventScope {
        while (true) {
            val event = awaitPointerEvent(PointerEventPass.Initial)
            for (change in event.changes) {
                if (contacts.consume(change.id, change.type == PointerType.Touch, change.pressed, DeviceInput.palmBlocked)) {
                    change.consume()
                }
            }
        }
    }
}
