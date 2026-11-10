package org.zotero.android.ereader

/** A hardware preview is never enabled on the basis of a manufacturer string alone. */
data class InkPreviewCapabilities(
    val sdkPresent: Boolean, val licenseApproved: Boolean, val deviceValidated: Boolean,
    val p95Improvement: Double, val geometryVerified: Boolean, val optedIn: Boolean,
) {
    val enabled get() = sdkPresent && licenseApproved && deviceValidated && geometryVerified && optedIn && p95Improvement >= 0.20
}

/** Adapter seam for a licensed BOOX TouchHelper implementation. No unreviewed SDK is bundled. */
interface InkPreviewDriver {
    fun open(clip: PreviewRect, excluded: List<PreviewRect>)
    fun clear()
    fun close()
}

data class PreviewRect(val left: Float, val top: Float, val right: Float, val bottom: Float) {
    fun contains(x: Float, y: Float) = x >= left && x <= right && y >= top && y <= bottom
}

/** UI-thread transaction: preview -> one standard annotation -> paint acknowledgment. */
class ExperimentalInkPreview(private val driver: InkPreviewDriver) {
    private var open = false
    private var token: Long? = null
    private var committed = false
    private var clip: PreviewRect? = null
    private var excluded: List<PreviewRect> = emptyList()
    fun start(capabilities: InkPreviewCapabilities, clip: PreviewRect, excluded: List<PreviewRect>): Boolean {
        close()
        if (!capabilities.enabled || clip.right <= clip.left || clip.bottom <= clip.top) return false
        this.clip = clip; this.excluded = excluded.toList()
        return try { open = true; driver.open(clip, excluded); true } catch (_: RuntimeException) { close(); false }
    }
    fun begin(id: Long, x: Float, y: Float): Boolean {
        if (!open || token != null || clip?.contains(x,y) != true || excluded.any { it.contains(x,y) }) return false
        token = id; committed = false; return true
    }
    fun commit(id: Long, saveStandardAnnotation: () -> Unit): Boolean {
        if (!open || token != id || committed) return false
        committed = true
        return try { saveStandardAnnotation(); true } catch (_: RuntimeException) { close(); false }
    }
    fun painted(id: Long): Boolean {
        if (!committed || token != id) return false
        driver.clear(); token = null; committed = false; return true
    }
    // Focus loss, page/zoom/crop changes and disposal close raw drawing, restoring WebView input.
    fun close() {
        try { if (open) { runCatching { driver.clear() }; runCatching { driver.close() } } }
        finally { open = false; token = null; committed = false; clip = null; excluded = emptyList() }
    }
}
