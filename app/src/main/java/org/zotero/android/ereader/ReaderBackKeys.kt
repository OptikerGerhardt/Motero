package org.zotero.android.ereader

import android.view.KeyEvent

/** Some e-reader keyboards send Escape instead of Android's Back dispatcher. */
class ReaderBackKeys {
    private val held = mutableSetOf<Int>()
    fun handle(code: Int, action: Int, repeat: Int, onBack: (() -> Unit)?): Boolean {
        if (action == KeyEvent.ACTION_UP && held.remove(code)) return true
        if (action != KeyEvent.ACTION_DOWN || onBack == null ||
            code != KeyEvent.KEYCODE_BACK && code != KeyEvent.KEYCODE_ESCAPE) return false
        held.add(code)
        if (repeat == 0) onBack()
        return true
    }
}
