package org.zotero.android.ereader

/** A rejected palm cannot become a click when the pen/guard ends before that palm lifts. */
class PalmContactFilter<T> {
    private val rejected = mutableSetOf<T>()
    fun consume(id: T, touch: Boolean, pressed: Boolean, penBusy: Boolean): Boolean {
        if (!touch) return false
        if (penBusy && pressed) rejected.add(id)
        val consume = id in rejected
        if (!pressed) rejected.remove(id)
        return consume
    }
}
