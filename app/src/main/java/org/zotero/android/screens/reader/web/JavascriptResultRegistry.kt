package org.zotero.android.screens.reader.web

/** UI-thread owned callbacks. A dead/replaced renderer must resolve every
 * pending continuation once; late replies from that renderer are ignored. */
internal class JavascriptResultRegistry {
    private class Pending(val callback: (String) -> Unit)
    private val pending = mutableSetOf<Pending>()
    fun register(callback: (String) -> Unit): (String) -> Unit {
        val item = Pending(callback)
        pending.add(item)
        return { value -> if (pending.remove(item)) item.callback(value) }
    }
    fun failAll() {
        val previous = pending.toList()
        pending.clear()
        previous.forEach { runCatching { it.callback("null") } }
    }
}
