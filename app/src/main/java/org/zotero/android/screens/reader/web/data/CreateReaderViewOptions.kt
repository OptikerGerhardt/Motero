package org.zotero.android.screens.reader.web.data

import com.google.gson.JsonArray

data class CreateReaderViewOptions(
    val type: String,
    val url: String,
    val annotations: JsonArray,
    var readOnly: Boolean? = null,
    var location: CreateReaderLocation? = null,
    var viewState: CreateReaderViewState = CreateReaderViewState(),
    var contentFit: CreateReaderContentFit? = null,
    var pageFitting: CreateReaderPageFitting? = null,
    var pageWidthFit: Boolean = false,
    var directHighlight: Boolean = false,
    var readerChromeVisible: Boolean = false,
    var pageNavigation: String = "continuous",

    var deviceProfile: org.zotero.android.ereader.DeviceProfile = org.zotero.android.ereader.DeviceProfileStore.state.value,
    var colorScheme: String = "light",
)

data class CreateReaderContentFit(
    val margin: Double,
    val fitOnOpen: Boolean,
)

data class CreateReaderLocation(
    val annotationID: String,
)

data class CreateReaderViewState(
    //html
    var scrollYPercent: Double? = null,
    var scale: Double? = null,
    //epub
    var cfi: String? = null,
    var cfiElementOffset: Double? = null,
    var appearance: CreateReaderReflowableAppearance? = null,

    //pdf
    var pageIndex: Int? = null,
    var top: Double? = null,
    var left: Double? = null,

    var flowMode: String? = null,
    var spreadMode: Int? = null,
    var scrollMode: Int? = null,

)

// Four Android fitting modes share the same detected content geometry.
data class CreateReaderPageFitting(val mode: String, val reference: String, val margin: Double,
    val revision: Long = 0, val includeMarginalia: Boolean = false,
    val manualCrop: org.zotero.android.screens.reader.data.ReaderManualCrops? = null,
    val cropMode: String = manualCrop?.effectiveMode() ?: "automatic")

// Apply EPUB layout before restoring the CFI.
data class CreateReaderReflowableAppearance(
    val lineHeight: Double, val wordSpacing: Double, val letterSpacing: Double,
    val pageWidth: Int, val useOriginalFont: Boolean = false, val textScale: Double? = null,
    val margins: Double? = null, val fontFamily: String? = null, val verticalMargins: Double? = null,
)
