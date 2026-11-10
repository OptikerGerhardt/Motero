package org.zotero.android.ereader

/** One owner and one edge per physical press; independent of Android for testing. */
class PenButtonState {
    var active = false; private set
    private var owner: Pair<String, Int>? = null
    fun event(device: String, code: Int, down: Boolean, repeat: Int, toggle: Boolean): Boolean {
        val key = device to code
        if (down) {
            if (repeat > 0 || owner == key) return active
            owner = key
            active = if (toggle) !active else true
        } else if (owner == key) {
            owner = null
            if (!toggle) active = false
        }
        return active
    }
    fun reset() { owner = null; active = false }
}
