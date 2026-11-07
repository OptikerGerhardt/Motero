package org.zotero.android.screens.reader.settings.data

enum class PageAppearanceMode {
    LIGHT, DARK, AUTOMATIC
}

enum class PageScrollMode(val jsValue: Int) {
    VERTICAL(0),
    HORIZONTAL(1),
    WRAPPED(2),
}

enum class PageSpreadsMode {
    NONE,
    ODD,
    EVEN,
}

enum class PageLayoutFlowMode {
    PAGINATED,
    SCROLLED,
}

// Space kept around fitted PDF content, as a fraction of the smaller viewport side
enum class PageContentMargin(val fraction: Double) {
    NONE(0.0),
    SMALL(0.01),
    MEDIUM(0.04),
    LARGE(0.08),
}


data class ReaderSettings(
    var appearanceMode: PageAppearanceMode,
    var scrollMode: PageScrollMode,
    var spreadsMode: PageSpreadsMode,
    var pageLayoutFlowMode: PageLayoutFlowMode,
    var lineHeight: Float,
    var wordSpacing: Float,
    var letterSpacing: Float,
    var pageWidth: Int,
    var fitToContent: Boolean = false,
    var contentMargin: PageContentMargin = PageContentMargin.SMALL,
    var fitToWidth: Boolean = false,
    var fitToHeight: Boolean = false,
    var fittingRevision: Long = 0,
    // Primitive defaults also migrate settings written before these fields existed.
    var fitTextReference: Boolean = false,
    // Missing in older saved settings: false keeps the new direct gesture enabled.
    var nativeTextSelection: Boolean = false,
    var fitWidthCrop: Boolean = false,
    var includeMarginalia: Boolean = false,
    var textScale: Float = 1f,
) {
    fun effectiveTextScale(): Float = textScale.takeIf { it.isFinite() && it in 0.6f..1.8f } ?: 1f
    fun fitReference(): String = when {
        !fitTextReference -> "page"
        fitToWidth && fitWidthCrop -> "cropped-content"
        else -> "content"
    }

    fun pageFitMode(): String = when {
        fitToContent -> "content"
        fitToWidth -> "width"
        fitToHeight -> "height"
        else -> "none"
    }

    fun setPageFitMode(mode: String) {
        fitToContent = mode == "content"
        fitToWidth = mode == "width"
        fitToHeight = mode == "height"
    }

    companion object {
        fun default(): ReaderSettings {
            return ReaderSettings(
                appearanceMode = PageAppearanceMode.AUTOMATIC,
                scrollMode = PageScrollMode.VERTICAL,
                spreadsMode = PageSpreadsMode.NONE,
                pageLayoutFlowMode = PageLayoutFlowMode.PAGINATED,
                lineHeight = 1.2f,
                wordSpacing = 0f,
                letterSpacing = 0f,
                pageWidth = 0,
            )
        }
    }
}
