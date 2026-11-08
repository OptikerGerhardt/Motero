package org.zotero.android.screens.reader.web

import android.webkit.WebMessage
import android.webkit.WebView
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.reflect.TypeToken
import dagger.hilt.android.scopes.ViewModelScoped
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.cancel
import kotlinx.coroutines.suspendCancellableCoroutine
import org.zotero.android.architecture.Defaults
import org.zotero.android.architecture.Result
import org.zotero.android.architecture.coroutines.Dispatchers
import org.zotero.android.screens.reader.data.ReaderDocumentData
import org.zotero.android.screens.reader.data.ReaderPage
import org.zotero.android.screens.reader.data.ReaderWebData
import org.zotero.android.screens.reader.data.ReaderWebError
import org.zotero.android.screens.reader.settings.data.PageLayoutFlowMode
import org.zotero.android.screens.reader.settings.data.PageScrollMode
import org.zotero.android.screens.reader.settings.data.PageSpreadsMode
import org.zotero.android.screens.reader.web.data.CreateReaderContentFit
import org.zotero.android.screens.reader.web.data.CreateReaderLocation
import org.zotero.android.screens.reader.web.data.CreateReaderViewOptions
import org.zotero.android.translator.data.WebPortResponse
import org.zotero.android.translator.helper.TranslatorHelper.encodeAsJSONForJavascript
import org.zotero.android.translator.helper.TranslatorHelper.encodeStringToBase64Binary
import timber.log.Timber
import java.io.File
import javax.inject.Inject
import kotlin.coroutines.resume

@ViewModelScoped
class ReaderWebCallChainExecutor @Inject constructor(
    dispatchers: Dispatchers,
    private val gson: Gson,
    private val observable: ReaderWebCallChainEventStream,
    private val readerWebViewHandler: ReaderWebViewHandler,
    private val defaults: Defaults,
) {

    var documentCrops: org.zotero.android.screens.reader.data.ReaderManualCrops? = null
    private val limitedParallelismDispatcher =
        dispatchers.io.limitedParallelism(1)
    private var webViewExecutorScope = CoroutineScope(limitedParallelismDispatcher)

    fun start(webView: WebView, file: File) {
        webViewExecutorScope.cancel()
        webViewExecutorScope = CoroutineScope(limitedParallelismDispatcher)
        try {
            val filePath = "file://" + file.absolutePath

            readerWebViewHandler.load(
                webView = webView,
                url = filePath,
                onWebViewLoadPage = ::onIndexHtmlLoaded,
                processWebViewResponses = ::receiveMessage,
                onRendererGone = { observable.emitAsync(Result.Success(ReaderWebData.rendererGone)) },
            )

            Timber.i("ReaderWebCallChainExecutor: initialization succeeded")
        } catch (e: Exception) {
            observable.emitAsync(
                Result.Failure(ReaderWebError.failedToInitializeWebView)
            )
            Timber.i(e, "ReaderWebCallChainExecutor: initialization failed")
        }
    }

    private fun receiveMessage(message: WebMessage) {
        webViewExecutorScope.launch {
            val data = message.data

            val mapType = object : TypeToken<WebPortResponse>() {}.type
            val decodedBody: WebPortResponse = gson.fromJson(data, mapType)
            val handlerName = decodedBody.handlerName
            val bodyElement = decodedBody.message
            when (handlerName) {
                "textHandler" -> {
                    val data = bodyElement.asJsonObject
                    val event = data["event"].asString
                    Timber.i("ReaderWebCallChainExecutor: $event")
                    when (event) {
                        "onInitialized" -> {
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.loadDocument
                                )
                            )
                        }

                        "onInitThumbnails" -> {
                            val params = data["params"].asJsonObject
                            val thumbnailsJsonArray = params["thumbnails"].asJsonArray
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.onInitThumbnails(thumbnailsJsonArray)
                                )
                            )
                        }

                        "onRenderThumbnail" -> {
                            val params = data["params"].asJsonObject
                            val thumbnailJsonObject = params["thumbnail"].asJsonObject
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.onRenderThumbnail(thumbnailJsonObject)
                                )
                            )
                        }

                        "onRenderAnnotationImage" -> {
                            val params = data["params"].asJsonObject
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.onRenderAnnotationImage(params)
                                )
                            )
                        }

                        "onSetPageLabels" -> {
                            val params = data["params"].asJsonObject
                            val pageLabelsJsonArray = params["pageLabels"].asJsonArray
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.onSetPageLabels(pageLabelsJsonArray)
                                )
                            )
                        }

                        "onDeleteAnnotations" -> {
                            observable.emitAsync(Result.Success(ReaderWebData.deleteAnnotations(data["params"].asJsonObject)))
                        }
                        "onSaveAnnotations" -> {
                            val params = data["params"].asJsonObject
                            Timber.i("ReaderWebCallChainExecutor: $params")
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.saveAnnotations(params)
                                )
                            )
                        }

                        "onSetAnnotationPopup" -> {
                            val dParams = data["params"]
                            if (dParams == null
                                || dParams.isJsonNull
                                || !dParams.isJsonObject
                                || dParams.asJsonObject.isEmpty
                            ) {
                                return@launch
                            }
                            val params = dParams.asJsonObject

//                            val rectArray = params["rect"].asJsonArray.map { it.asDouble }
                            val key = params["annotation"].asJsonObject["id"].asString
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.selectAnnotationFromDocument(key)
                                )
                            )

                            //TODO send the event with rect, accommodating for nav and status bar space.
                        }

                        "onSelectAnnotations" -> {
                            val params = data["params"]
                            if (params == null || params.isJsonNull) {
                                Timber.w("ReaderWebCallChainExecutor: event $event missing params")
                                return@launch
                            }
                            val paramsObject = params.asJsonObject
                            val ids = paramsObject["ids"]
                            if (ids == null || ids.isJsonNull) {
                                Timber.w("ReaderWebCallChainExecutor: event $event missing params")
                                return@launch
                            }
                            val idsJsonArrayOfStrings = ids.asJsonArray.mapNotNull {
                                if (it.isJsonNull) {
                                    null
                                } else {
                                    it.asString
                                }
                            }
                            val key = idsJsonArrayOfStrings.firstOrNull()
                            if (key != null) {
                                val inlineTextEditing = paramsObject["inlineTextEditing"]
                                    ?.takeIf { !it.isJsonNull }?.asBoolean ?: false
                                observable.emitAsync(
                                    Result.Success(
                                        ReaderWebData.selectAnnotationFromDocument(
                                            key,
                                            inlineTextEditing
                                        )
                                    )
                                )
                            } else {
                                observable.emitAsync(
                                    Result.Success(
                                        ReaderWebData.deselectSelectedAnnotation
                                    )
                                )
                            }
                        }

                        "onSetSelectionPopup" -> {
                            val dParams = data["params"]
                            if (dParams == null
                                || dParams.isJsonNull
                                || (dParams.isJsonObject && dParams.asJsonObject.isEmpty)
                            ) {
                                observable.emitAsync(
                                    Result.Success(
                                        ReaderWebData.clearSelectedTextParams
                                    )
                                )
                                return@launch
                            }
                            val params = dParams.asJsonObject
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.setSelectedTextParams(params)
                                )
                            )
                        }

                        "onManualCropChanged" -> {
                            observable.emitAsync(Result.Success(ReaderWebData.setManualCrop(data["params"].asJsonObject)))
                        }

                        "onCropEditorState" -> {
                            observable.emitAsync(Result.Success(ReaderWebData.setCropEditorState(data["params"].asJsonObject)))
                        }
                        "onCropEditorChanged" -> {
                            observable.emitAsync(Result.Success(ReaderWebData.setCropEditorOpen(data["params"].asJsonObject["open"].asBoolean)))
                        }

                        "onChangeViewState" -> {
                            val params = data["params"].asJsonObject
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.setViewState(params)
                                )
                            )
                        }

                        "onOpenLink" -> {
                            val params = data["params"].asJsonObject
                            val url = params["url"].asString
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.showUrl(url)
                                )
                            )
                        }

                        "onSetOutline" -> {
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.parseOutline(data)
                                )
                            )
                        }

                        "onFindResult" -> {
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.processDocumentSearchResults(data)
                                )
                            )
                        }

                        "onBackdropTap" -> {
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.toggleInterfaceVisibility
                                )
                            )
                        }

                        "onDismissReaderChrome" -> {
                            observable.emitAsync(Result.Success(ReaderWebData.onDismissReaderChrome))
                        }

                        "onEdgePageTurnTap" -> {
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.onEdgePageTurnTap
                                )
                            )
                        }

                        "onViewContentInitialized" -> {
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.onViewContentInitialized
                                )
                            )
                        }

                        "onChangeViewStats" -> {
                            val params = data["params"].asJsonObject
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.setViewStats(params)
                                )
                            )
                        }

                        "onReadingModeEnabled" -> {
                            val params = data["params"].asJsonObject
                            val enabled = params["enabled"].asBoolean
                            observable.emitAsync(
                                Result.Success(
                                    ReaderWebData.setReadingModeEnabled(enabled)
                                )
                            )
                        }

                    }
                }

                "logHandler" -> {
                    Timber.d("JSLOG: ${bodyElement.asString}")
                }

            }
        }
    }

    private fun onIndexHtmlLoaded() {
        //no-op
    }

    suspend fun resetAndroidReaderInput(key: String) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("window.resetAndroidReaderInput?.(${gson.toJson(key)});") { cont.resume(Unit) }
        }
    }

    suspend fun selectInDocument(key: String, centerInDocument: Boolean = true) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("select({ key: '$key', centerInDocument: $centerInDocument });") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun show(location: Map<String, Any>) {
        val encodedPayload = encodeAsJSONForJavascript(gson = gson, data = location)

        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:navigate({ location: '${encodedPayload}' });") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun turnPage(next: Boolean, fraction: Double) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("window.turnPageWithHardwareButton($next, $fraction);") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun navigateBack() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:navigateBack();") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun navigateForward() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:navigateForward();") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun beginNavigation() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:beginNavigation();") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun endNavigation() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:endNavigation();") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun selectSearchResult(index: Int) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window._view.find({ index: ${index} });") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setTool(toolName: String, colorHex: String? = null, size: Float? = null) {
        return suspendCancellableCoroutine { cont ->
            val javascript = "setTool({ type: '$toolName', color: '$colorHex',  size: '$size' });"
            readerWebViewHandler.evaluateJavascript(javascript) {
                cont.resume(Unit)
            }
        }
    }

    suspend fun renderThumbnails(index: Int) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("renderThumbnails([$index])") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun renderAnnotationImages(id: String) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("renderAnnotationImages(['$id'])") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun search(term: String) {
        val encodedPayload = encodeStringToBase64Binary(term)

        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("search({ term: '${encodedPayload}' });") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun clearTool() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("clearTool();") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun clearSearch() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window._view.find();") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun deselectText() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window._view.selectAnnotations([]);") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun updateView(modifications: JsonArray, insertions: JsonArray, deletions: JsonArray) {
        val encodedDeletions = encodeAsJSONForJavascript(gson = this.gson, data = deletions)
        val encodedInsertions = encodeAsJSONForJavascript(gson = this.gson, data = insertions)
        val encodedModifications = encodeAsJSONForJavascript(gson = this.gson, data = modifications)

        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:updateAnnotations({ deletions: '${encodedDeletions}', insertions: '${encodedInsertions}', modifications: '${encodedModifications}'});") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun loadDocument(data: ReaderDocumentData, isDark: Boolean, chromeVisible: Boolean) {
        Timber.i("ReaderWebCallChainExecutor: try creating view for ${data.type}; page = ${data.page}")
        Timber.i("${data.file.absolutePath}")
        documentCrops = data.manualCrops
        val createReaderViewOptions = CreateReaderViewOptions(
            type = data.type,
            url = "https://appassets.androidplatform.net/local/${data.file.name}",
            annotations = data.annotationsJson,
            pageFitting = if (data.type == "pdf") defaults.getReaderSettings().let {
                org.zotero.android.screens.reader.web.data.CreateReaderPageFitting(
                    it.pageFitMode(), it.fitReference(), it.contentMargin.fraction, it.fittingRevision, it.includeMarginalia, data.manualCrops
                )
            } else null,
            directHighlight = !defaults.getReaderSettings().nativeTextSelection,
            readerChromeVisible = chromeVisible,
        )

        val flowModeString = when (defaults.getReaderSettings().pageLayoutFlowMode) {
            PageLayoutFlowMode.PAGINATED -> {
                "paginated"
            }

            PageLayoutFlowMode.SCROLLED -> {
                "scrolled"
            }
        }

        val spreadsModeInt = when (defaults.getReaderSettings().spreadsMode) {
            PageSpreadsMode.NONE -> {
                0
            }

            PageSpreadsMode.ODD -> {
                1
            }

            PageSpreadsMode.EVEN -> {
                2
            }
        }

        // Apply typography before navigation, including first open and annotation links.
        if (data.type == "epub") {
            createReaderViewOptions.readOnly = data.readOnly
            val settings = defaults.getReaderSettings()
            createReaderViewOptions.viewState.apply {
                flowMode = flowModeString
                spreadMode = spreadsModeInt
                cfi = (data.page as? ReaderPage.epub)?.cfi
                appearance = org.zotero.android.screens.reader.web.data.CreateReaderReflowableAppearance(
                    settings.lineHeight.toDouble(), settings.wordSpacing.toDouble(),
                    settings.letterSpacing.toDouble(), settings.pageWidth,
                    textScale = data.savedEpubViewState?.scale ?: settings.effectiveTextScale().toDouble(),
                )
            }
            data.savedEpubViewState?.restoreInto(createReaderViewOptions.viewState)
        }

        val key = data.selectedAnnotationKey
        val page = data.page
        if (key != null) {
            createReaderViewOptions.location = CreateReaderLocation(annotationID = key)
        } else if (page != null) {
            when (page) {
                is ReaderPage.html -> {
                    createReaderViewOptions.viewState.scrollYPercent = page.scrollYPercent
                    createReaderViewOptions.viewState.scale = 1.0

                }

                is ReaderPage.epub -> {
                    createReaderViewOptions.viewState.cfi = page.cfi
                    createReaderViewOptions.viewState.flowMode = flowModeString
                    createReaderViewOptions.viewState.spreadMode = spreadsModeInt

                }

                is ReaderPage.pdf -> {
                    createReaderViewOptions.viewState.pageIndex = page.pageIndex
                    createReaderViewOptions.viewState.spreadMode = spreadsModeInt
                    createReaderViewOptions.viewState.scrollMode =
                        defaults.getReaderSettings().scrollMode.jsValue
                    val savedViewState = data.savedPdfViewState
                    if (savedViewState != null) {
                        createReaderViewOptions.viewState.scale = savedViewState.scale
                        createReaderViewOptions.viewState.left = savedViewState.left
                        // The page may have changed on another device, then only the zoom applies
                        if (savedViewState.pageIndex == page.pageIndex) {
                            createReaderViewOptions.viewState.top = savedViewState.top
                        }
                    }
                }
            }
        }

        val appearanceString = if (isDark) {
            "dark"
        } else {
            "light"
        }
        createReaderViewOptions.colorScheme = appearanceString

        val toJson = encodeAsJSONForJavascript(this.gson, createReaderViewOptions)
        val javascript = "javascript:createView('${toJson}');"
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript(javascript) {
                cont.resume(Unit)
            }
        }

    }

    suspend fun updateInterface(isDark: Boolean) {
        val appearanceString = if (isDark) {
            "dark"
        } else {
            "light"
        }

        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("window._view.setColorScheme('$appearanceString');") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setFlowMode(flowMode: PageLayoutFlowMode) {
        val flowModeString = when (flowMode) {
            PageLayoutFlowMode.PAGINATED -> {
                "paginated"
            }

            PageLayoutFlowMode.SCROLLED -> {
                "scrolled"
            }
        }

        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("window._view.setFlowMode('$flowModeString');") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setSpreadMode(spreadsMode: PageSpreadsMode) {
        val spreadsModeString = when (spreadsMode) {
            PageSpreadsMode.NONE -> {
                "0"
            }

            PageSpreadsMode.ODD -> {
                "1"
            }

            PageSpreadsMode.EVEN -> {
                "2"
            }
        }

        return suspendCancellableCoroutine { cont ->
            val javascript = "window._view.setSpreadMode(${spreadsModeString.toInt()});"
            readerWebViewHandler.evaluateJavascript(javascript) {
                cont.resume(Unit)
            }
        }
    }

    fun setReaderChromeVisible(visible: Boolean) {
        readerWebViewHandler.evaluateJavascript("window.setReaderChromeVisible?.($visible);") {}
    }

    suspend fun beginManualCrop() = suspendCancellableCoroutine { cont ->
        readerWebViewHandler.evaluateJavascript("javascript:window.beginManualCrop({nativeControls:true});") { cont.resume(Unit) }
    }

    fun cropEditorAction(action: String, scope: String? = null, top: Double? = null, bottom: Double? = null) {
        val json = gson.toJson(mapOf("action" to action, "scope" to scope, "top" to top, "bottom" to bottom))
        readerWebViewHandler.evaluateJavascript("window.cropEditorAction?.($json);") {}
    }
    suspend fun focusBookmark(key: String) = suspendCancellableCoroutine { cont ->
        readerWebViewHandler.evaluateJavascript("window.focusReaderBookmark?.(${gson.toJson(key)});") { cont.resume(Unit) }
    }

    suspend fun cancelManualCrop() = suspendCancellableCoroutine { cont ->
        readerWebViewHandler.evaluateJavascript("javascript:window.cancelManualCrop();") { cont.resume(Unit) }
    }

    suspend fun setPageFitting(settings: org.zotero.android.screens.reader.settings.data.ReaderSettings, apply: Boolean) {
        val options = org.zotero.android.screens.reader.web.data.CreateReaderPageFitting(
            settings.pageFitMode(), settings.fitReference(), settings.contentMargin.fraction, settings.fittingRevision, settings.includeMarginalia, documentCrops
        )
        val json = gson.toJson(options)
        suspendCancellableCoroutine<Unit> { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window.setPageFitting($json, $apply);") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun fitToContent(margin: Double) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window.fitToContent({ margin: $margin });") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun fitToWidth() {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window.fitToWidth();") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setDirectHighlight(enabled: Boolean) {
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window.setDirectHighlight($enabled);") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setContentFit(margin: Double?) {
        val options = if (margin != null) "{ margin: $margin }" else "null"
        return suspendCancellableCoroutine { cont ->
            readerWebViewHandler.evaluateJavascript("javascript:window.setContentFit($options);") {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setScrollMode(scrollMode: PageScrollMode) {
        return suspendCancellableCoroutine { cont ->
            val javascript = "window._view.setScrollMode(${scrollMode.jsValue});"
            readerWebViewHandler.evaluateJavascript(javascript) {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setSDTPack(bytesBase64: String, packVersion: Int, schemaMajorVersion: Int) {
        return suspendCancellableCoroutine { cont ->
            val javascript =
                "javascript:setSDTPack({ bytes: '$bytesBase64', packVersion: $packVersion, schemaMajorVersion: $schemaMajorVersion });"
            readerWebViewHandler.evaluateJavascript(javascript) {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setAppearance(
        lineHeight: Double,
        wordSpacing: Double,
        letterSpacing: Double,
        pageWidth: Int
    ) {
        return suspendCancellableCoroutine { cont ->
            val javascript =
                "javascript:setAppearance({ lineHeight: $lineHeight, wordSpacing: $wordSpacing, letterSpacing: $letterSpacing, pageWidth: $pageWidth, textScale: ${defaults.getReaderSettings().effectiveTextScale()} });"
            readerWebViewHandler.evaluateJavascript(javascript) {
                cont.resume(Unit)
            }
        }
    }

    suspend fun setReadingModeEnabled(enabled: Boolean) {
        return suspendCancellableCoroutine { cont ->
            val javascript = "javascript:setReadingModeEnabled({ enabled: $enabled });"
            readerWebViewHandler.evaluateJavascript(javascript) {
                cont.resume(Unit)
            }
        }
    }

}
