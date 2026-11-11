package org.zotero.android.screens.reader.settings

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import org.greenrobot.eventbus.EventBus
import org.zotero.android.architecture.BaseViewModel2
import org.zotero.android.architecture.ViewEffect
import org.zotero.android.architecture.ViewState
import org.zotero.android.architecture.navigation.NavigationParamsMarshaller
import org.zotero.android.architecture.require
import org.zotero.android.pdf.data.PdfReaderCurrentThemeEventStream
import org.zotero.android.pdf.data.PdfReaderThemeDecider
import org.zotero.android.screens.reader.ARG_READER_SETTINGS_SCREEN
import org.zotero.android.screens.reader.data.ReaderFileType
import org.zotero.android.screens.reader.settings.data.PageAppearanceMode
import org.zotero.android.screens.reader.settings.data.PageContentMargin
import org.zotero.android.screens.reader.settings.data.PageLayoutFlowMode
import org.zotero.android.screens.reader.settings.data.PageScrollMode
import org.zotero.android.screens.reader.settings.data.PageSpreadsMode
import org.zotero.android.screens.reader.settings.data.ReaderSettings
import org.zotero.android.screens.reader.settings.data.ReaderSettingsArgs
import org.zotero.android.screens.reader.settings.data.ReaderSettingsChangeResult
import org.zotero.android.screens.reader.settings.data.ReaderSettingsOptions
import java.nio.charset.StandardCharsets
import kotlin.math.roundToInt
import javax.inject.Inject

@HiltViewModel
internal class ReaderSettingsViewModel @Inject constructor(
    private val pdfReaderCurrentThemeEventStream: PdfReaderCurrentThemeEventStream,
    private val pdfReaderThemeDecider: PdfReaderThemeDecider,
    private val navigationParamsMarshaller: NavigationParamsMarshaller,
    stateHandle: SavedStateHandle,
) : BaseViewModel2<ReaderSettingsViewState, ReaderSettingsViewEffect>(ReaderSettingsViewState()) {

    private val screenArgs: ReaderSettingsArgs by lazy {
        val argsEncoded = stateHandle.get<String>(ARG_READER_SETTINGS_SCREEN).require()
        navigationParamsMarshaller.decodeObjectFromBase64(argsEncoded, StandardCharsets.UTF_8)
    }

    private lateinit var readerSettings: ReaderSettings
    private var pdfReaderThemeCancellable: Job? = null

    private var debounceApplyJob: Job? = null
    private var reapplyFitting = false
    private var cropModeChanged: String? = null
    private val DEBOUNCE_APPLY_DELAY_MS = 500L

    private fun startObservingTheme() {
        this.pdfReaderThemeCancellable = pdfReaderCurrentThemeEventStream.flow()
            .onEach { data ->
                updateState {
                    copy(isDark = data!!.isDark)
                }
            }
            .launchIn(viewModelScope)
    }

    fun init(args: ReaderSettingsArgs?) {
        val loadedArgs = args ?: screenArgs
        initOnce {
            updateState {
                copy(isDark = pdfReaderCurrentThemeEventStream.currentValue()!!.isDark)
            }
            startObservingTheme()
        }
        // This ViewModel survives the phone's settings overlay. Reload the
        // document snapshot on every opening, including a manual-crop Apply.
        debounceApplyJob?.cancel()
        debounceApplyJob = null
        reapplyFitting = false
        cropModeChanged = null
        readerSettings = loadedArgs.readerSettings.copy()
        updateState {
            copy(
                selectedAppearanceOption = convert(readerSettings.appearanceMode),
                selectedScrollModeOption = convert(readerSettings.scrollMode),
                pageNavigation = readerSettings.effectivePageNavigation(),
                selectedSpreadsOption = convert(readerSettings.spreadsMode),
                selectedPageLayoutFlowMode = convert(readerSettings.pageLayoutFlowMode),
                lineHeight = readerSettings.lineHeight,
                textScale = readerSettings.effectiveTextScale(),
                wordSpacing = readerSettings.wordSpacing,
                letterSpacing = readerSettings.letterSpacing,
                pageWidth = readerSettings.effectiveMargins(),
                verticalMargins = readerSettings.effectiveVerticalMargins(),
                fontFamily = readerSettings.effectiveFontFamily(),
                selectedFitToContentOption = when (readerSettings.pageFitMode()) {
                    "width" -> ReaderSettingsOptions.FitToWidth
                    "height" -> ReaderSettingsOptions.FitToHeight
                    else -> convertFitToContent(readerSettings.fitToContent)
                },
                selectedFitReferenceOption = when (readerSettings.fitReference()) {
                    "cropped-content" -> ReaderSettingsOptions.FitReferenceCroppedText
                    "content" -> ReaderSettingsOptions.FitReferenceText
                    else -> ReaderSettingsOptions.FitReferencePage
                },
                selectedMarginaliaOption = if (readerSettings.includeMarginalia) ReaderSettingsOptions.MarginaliaInclude
                    else ReaderSettingsOptions.MarginaliaExclude,
                selectedSelectionOption = if (readerSettings.nativeTextSelection) ReaderSettingsOptions.SelectionAndroid
                    else ReaderSettingsOptions.SelectionDirect,
                selectedContentMarginOption = convert(readerSettings.contentMargin),
                fileType = loadedArgs.fileType,
                readingModeEnabled = loadedArgs.readingModeEnabled,
                cropMode = loadedArgs.cropMode,
                progressMode = readerSettings.effectiveProgressMode(),
            )
        }
    }

    private fun convert(transition: PageAppearanceMode): ReaderSettingsOptions {
        return when (transition) {
            PageAppearanceMode.LIGHT -> {
                ReaderSettingsOptions.AppearanceLight
            }
            PageAppearanceMode.DARK -> {
                ReaderSettingsOptions.AppearanceDark
            }
            PageAppearanceMode.AUTOMATIC -> {
                ReaderSettingsOptions.AppearanceAutomatic
            }
        }
    }

    private fun convert(scrollMode: PageScrollMode): ReaderSettingsOptions {
        return when (scrollMode) {
            PageScrollMode.VERTICAL -> {
                ReaderSettingsOptions.ScrollModeVertical
            }
            PageScrollMode.HORIZONTAL -> {
                ReaderSettingsOptions.ScrollModeHorizontal
            }
            PageScrollMode.WRAPPED -> {
                ReaderSettingsOptions.ScrollModeWrapped
            }
        }
    }

    private fun convert(spreadsMode: PageSpreadsMode): ReaderSettingsOptions {
        return when (spreadsMode) {
            PageSpreadsMode.NONE -> {
                ReaderSettingsOptions.PageSpreadsNone
            }
            PageSpreadsMode.ODD -> {
                ReaderSettingsOptions.PageSpreadsDouble
            }
            PageSpreadsMode.EVEN -> {
                ReaderSettingsOptions.PageSpreadsEven
            }
        }
    }

    private fun convert(flowMode: PageLayoutFlowMode): ReaderSettingsOptions {
        return when (flowMode) {
            PageLayoutFlowMode.PAGINATED -> {
                ReaderSettingsOptions.PageLayoutFlowModePaginated
            }
            PageLayoutFlowMode.SCROLLED -> {
                ReaderSettingsOptions.PageLayoutFlowModeScrolled
            }
        }
    }

    private fun convertFitToContent(fitToContent: Boolean): ReaderSettingsOptions {
        return if (fitToContent) {
            ReaderSettingsOptions.FitToContentOn
        } else {
            ReaderSettingsOptions.FitToContentOff
        }
    }

    private fun convert(contentMargin: PageContentMargin): ReaderSettingsOptions {
        return when (contentMargin) {
            PageContentMargin.NONE -> {
                ReaderSettingsOptions.ContentMarginNone
            }
            PageContentMargin.SMALL -> {
                ReaderSettingsOptions.ContentMarginSmall
            }
            PageContentMargin.MEDIUM -> {
                ReaderSettingsOptions.ContentMarginMedium
            }
            PageContentMargin.LARGE -> {
                ReaderSettingsOptions.ContentMarginLarge
            }
        }
    }

    fun onOptionSelected(optionOrdinal: Int) {
        val option = ReaderSettingsOptions.entries[optionOrdinal]

        when (option) {
            ReaderSettingsOptions.NavigationJumped, ReaderSettingsOptions.NavigationContinuous -> {
                updateState { copy(pageNavigation = if (option == ReaderSettingsOptions.NavigationJumped) "jumped" else "continuous") }
            }
            ReaderSettingsOptions.CropAutomatic, ReaderSettingsOptions.CropManual -> Unit
            ReaderSettingsOptions.AppearanceLight, ReaderSettingsOptions.AppearanceDark, ReaderSettingsOptions.AppearanceAutomatic -> {
                updateState {
                    copy(selectedAppearanceOption = option)
                }
            }
            ReaderSettingsOptions.ScrollModeVertical, ReaderSettingsOptions.ScrollModeHorizontal, ReaderSettingsOptions.ScrollModeWrapped -> {
                updateState {
                    copy(selectedScrollModeOption = option)
                }
            }
            ReaderSettingsOptions.PageSpreadsNone, ReaderSettingsOptions.PageSpreadsDouble, ReaderSettingsOptions.PageSpreadsEven -> {
                updateState {
                    copy(selectedSpreadsOption = option)
                }
            }

            ReaderSettingsOptions.PageLayoutFlowModePaginated, ReaderSettingsOptions.PageLayoutFlowModeScrolled -> {
                updateState {
                    copy(selectedPageLayoutFlowMode = option)
                }
            }

            ReaderSettingsOptions.FitToContentOff, ReaderSettingsOptions.FitToContentOn,
            ReaderSettingsOptions.FitToWidth, ReaderSettingsOptions.FitToHeight -> {
                reapplyFitting = true
                updateState {
                    copy(selectedFitToContentOption = option)
                }
            }

            ReaderSettingsOptions.FitReferencePage, ReaderSettingsOptions.FitReferenceText,
            ReaderSettingsOptions.FitReferenceCroppedText -> {
                reapplyFitting = true
                updateState { copy(selectedFitReferenceOption = option) }
            }

            ReaderSettingsOptions.MarginaliaExclude, ReaderSettingsOptions.MarginaliaInclude -> {
                reapplyFitting = true
                updateState { copy(selectedMarginaliaOption = option) }
            }

            ReaderSettingsOptions.SelectionDirect, ReaderSettingsOptions.SelectionAndroid -> {
                updateState { copy(selectedSelectionOption = option) }
            }

            ReaderSettingsOptions.ContentMarginNone, ReaderSettingsOptions.ContentMarginSmall,
            ReaderSettingsOptions.ContentMarginMedium, ReaderSettingsOptions.ContentMarginLarge -> {
                reapplyFitting = true
                updateState {
                    copy(selectedContentMarginOption = option)
                }
            }
        }
        updatePdfSettings(option)
        updateState { copy(selectedFitReferenceOption = when (readerSettings.fitReference()) {
            "cropped-content" -> ReaderSettingsOptions.FitReferenceCroppedText
            "content" -> ReaderSettingsOptions.FitReferenceText
            else -> ReaderSettingsOptions.FitReferencePage
        }) }
        if (option in viewState.fitToContentOptions && option != ReaderSettingsOptions.FitToContentOff) {
            readerSettings.spreadsMode = PageSpreadsMode.NONE
            updateState { copy(selectedSpreadsOption = ReaderSettingsOptions.PageSpreadsNone) }
        } else if (option in viewState.spreadsOptions && option != ReaderSettingsOptions.PageSpreadsNone) {
            readerSettings.setPageFitMode("none")
            reapplyFitting = true
            updateState { copy(selectedFitToContentOption = ReaderSettingsOptions.FitToContentOff) }
        }
        scheduleDebouncedApply()
    }

    fun onLineHeightChanged(value: Float) {
        readerSettings.lineHeight = value
        updateState {
            copy(lineHeight = value)
        }
        scheduleDebouncedApply()
    }

    fun useAutomaticCrop() {
        cropModeChanged = "automatic"
        updateState { copy(cropMode = "automatic") }
        scheduleDebouncedApply()
    }
    fun setProgressMode(mode: String) {
        readerSettings.epubProgressMode = mode
        updateState { copy(progressMode = mode) }
        scheduleDebouncedApply()
    }
    fun onTextScaleChanged(value: Float) {
        val scale = (value * 10).roundToInt().coerceIn(6, 18) / 10f
        readerSettings.textScale = scale
        updateState { copy(textScale = scale) }
        scheduleDebouncedApply()
    }

    fun onWordSpacingChanged(value: Float) {
        readerSettings.wordSpacing = value
        updateState {
            copy(wordSpacing = value)
        }
        scheduleDebouncedApply()
    }

    fun onLetterSpacingChanged(value: Float) {
        readerSettings.letterSpacing = value
        updateState {
            copy(letterSpacing = value)
        }
        scheduleDebouncedApply()
    }

    fun onPageWidthChanged(value: Float) {
        val rounded = value.coerceIn(0f, 20f).roundToInt()
        readerSettings.epubMargins = rounded.toFloat()
        updateState {
            copy(pageWidth = rounded.toFloat())
        }
        scheduleDebouncedApply()
    }

    fun onVerticalMarginsChanged(value: Float) {
        val rounded = value.coerceIn(0f, 15f).roundToInt().toFloat()
        readerSettings.epubVerticalMargins = rounded
        updateState { copy(verticalMargins = rounded) }
        scheduleDebouncedApply()
    }

    fun onFontFamilyChanged(value: String) {
        if (value !in setOf("original", "serif", "sans-serif")) return
        readerSettings.epubFontFamily = value
        updateState { copy(fontFamily = value) }
        scheduleDebouncedApply()
    }

    private fun scheduleDebouncedApply() {
        debounceApplyJob?.cancel()
        debounceApplyJob = viewModelScope.launch {
            delay(DEBOUNCE_APPLY_DELAY_MS)
            sendSettingsParams()
        }
    }

    fun applyChangesImmediately(startManualCrop: Boolean = false) {
        debounceApplyJob?.cancel()
        debounceApplyJob = null
        sendSettingsParams(startManualCrop)
    }

    private fun updatePdfSettings(option: ReaderSettingsOptions) {
        when (option) {
            ReaderSettingsOptions.CropAutomatic, ReaderSettingsOptions.CropManual -> Unit
            ReaderSettingsOptions.AppearanceLight -> {
                readerSettings.appearanceMode = PageAppearanceMode.LIGHT
            }

            ReaderSettingsOptions.AppearanceDark -> {
                readerSettings.appearanceMode = PageAppearanceMode.DARK
            }

            ReaderSettingsOptions.AppearanceAutomatic -> {
                readerSettings.appearanceMode = PageAppearanceMode.AUTOMATIC
            }

            ReaderSettingsOptions.ScrollModeVertical -> {
                readerSettings.scrollMode = PageScrollMode.VERTICAL
            }
            ReaderSettingsOptions.ScrollModeHorizontal -> {
                readerSettings.scrollMode = PageScrollMode.HORIZONTAL
            }
            ReaderSettingsOptions.ScrollModeWrapped -> {
                readerSettings.scrollMode = PageScrollMode.WRAPPED
            }
            ReaderSettingsOptions.NavigationJumped -> readerSettings.pageNavigation = "jumped"
            ReaderSettingsOptions.NavigationContinuous -> readerSettings.pageNavigation = "continuous"

            ReaderSettingsOptions.PageSpreadsNone -> {
                readerSettings.spreadsMode = PageSpreadsMode.NONE
            }
            ReaderSettingsOptions.PageSpreadsDouble -> {
                readerSettings.spreadsMode = PageSpreadsMode.ODD
            }
            ReaderSettingsOptions.PageSpreadsEven -> {
                readerSettings.spreadsMode = PageSpreadsMode.EVEN
            }

            ReaderSettingsOptions.PageLayoutFlowModePaginated -> {
                readerSettings.pageLayoutFlowMode = PageLayoutFlowMode.PAGINATED
            }
            ReaderSettingsOptions.PageLayoutFlowModeScrolled -> {
                readerSettings.pageLayoutFlowMode = PageLayoutFlowMode.SCROLLED
            }

            ReaderSettingsOptions.FitToContentOff -> readerSettings.setPageFitMode("none")
            ReaderSettingsOptions.FitToContentOn -> readerSettings.setPageFitMode("content")
            ReaderSettingsOptions.FitToWidth -> readerSettings.setPageFitMode("width")
            ReaderSettingsOptions.FitToHeight -> readerSettings.setPageFitMode("height")
            ReaderSettingsOptions.FitReferencePage -> {
                readerSettings.fitTextReference = false
                readerSettings.fitReferenceOverride = "page"
            }
            ReaderSettingsOptions.FitReferenceText -> {
                readerSettings.fitReferenceOverride = "content"
                readerSettings.fitTextReference = true
                readerSettings.fitWidthCrop = false
            }
            ReaderSettingsOptions.FitReferenceCroppedText -> {
                readerSettings.fitReferenceOverride = "cropped-content"
                readerSettings.fitTextReference = true
                readerSettings.fitWidthCrop = true
            }
            ReaderSettingsOptions.MarginaliaExclude -> readerSettings.includeMarginalia = false
            ReaderSettingsOptions.MarginaliaInclude -> readerSettings.includeMarginalia = true

            ReaderSettingsOptions.SelectionDirect -> {
                readerSettings.nativeTextSelection = false
            }
            ReaderSettingsOptions.SelectionAndroid -> {
                readerSettings.nativeTextSelection = true
            }

            ReaderSettingsOptions.ContentMarginNone -> {
                readerSettings.contentMargin = PageContentMargin.NONE
            }
            ReaderSettingsOptions.ContentMarginSmall -> {
                readerSettings.contentMargin = PageContentMargin.SMALL
            }
            ReaderSettingsOptions.ContentMarginMedium -> {
                readerSettings.contentMargin = PageContentMargin.MEDIUM
            }
            ReaderSettingsOptions.ContentMarginLarge -> {
                readerSettings.contentMargin = PageContentMargin.LARGE
            }
        }
    }

    fun setOsTheme(isDark: Boolean) {
        pdfReaderThemeDecider.setCurrentOsTheme(isOsThemeDark = isDark)
    }

    private fun sendSettingsParams(startManualCrop: Boolean = false) {
        EventBus.getDefault().post(ReaderSettingsChangeResult(readerSettings.copy(), reapplyFitting, startManualCrop, cropModeChanged))
        reapplyFitting = false
        cropModeChanged = null
    }

}

internal data class ReaderSettingsViewState(
    val selectedAppearanceOption: ReaderSettingsOptions = ReaderSettingsOptions.AppearanceAutomatic,
    val selectedScrollModeOption: ReaderSettingsOptions = ReaderSettingsOptions.ScrollModeVertical,
    val selectedSpreadsOption: ReaderSettingsOptions = ReaderSettingsOptions.PageSpreadsNone,
    val selectedPageLayoutFlowMode: ReaderSettingsOptions = ReaderSettingsOptions.PageLayoutFlowModePaginated,
    val lineHeight: Float = 1.2f,
    val textScale: Float = 1f,
    val cropMode: String = "automatic",
    val pageNavigation: String = "continuous",
    val progressMode: String = "both",
    val wordSpacing: Float = 0f,
    val letterSpacing: Float = 0f,
    val pageWidth: Float = 8f,
    val verticalMargins: Float = 3f,
    val fontFamily: String = "serif",
    val selectedFitToContentOption: ReaderSettingsOptions = ReaderSettingsOptions.FitToContentOff,
    val selectedFitReferenceOption: ReaderSettingsOptions = ReaderSettingsOptions.FitReferencePage,
    val selectedMarginaliaOption: ReaderSettingsOptions = ReaderSettingsOptions.MarginaliaExclude,
    val selectedContentMarginOption: ReaderSettingsOptions = ReaderSettingsOptions.ContentMarginSmall,
    val selectedSelectionOption: ReaderSettingsOptions = ReaderSettingsOptions.SelectionDirect,
    val isDark: Boolean = false,
    val fileType: ReaderFileType = ReaderFileType.EPUB,
    val readingModeEnabled: Boolean = false,
) : ViewState {
    val scrollModeOptions = listOf(
        ReaderSettingsOptions.ScrollModeVertical,
        ReaderSettingsOptions.ScrollModeHorizontal,
        ReaderSettingsOptions.ScrollModeWrapped,
    )
    val appearanceOptions = listOf(
        ReaderSettingsOptions.AppearanceLight,
        ReaderSettingsOptions.AppearanceDark,
        ReaderSettingsOptions.AppearanceAutomatic
    )

    val spreadsOptions = listOf(
        ReaderSettingsOptions.PageSpreadsNone,
        ReaderSettingsOptions.PageSpreadsDouble,
        ReaderSettingsOptions.PageSpreadsEven
    )
    val pageLayoutFlowOptions = listOf(
        ReaderSettingsOptions.PageLayoutFlowModePaginated,
        ReaderSettingsOptions.PageLayoutFlowModeScrolled,
    )
    val fitToContentOptions = listOf(
        ReaderSettingsOptions.FitToContentOff,
        ReaderSettingsOptions.FitToContentOn,
        ReaderSettingsOptions.FitToWidth,
        ReaderSettingsOptions.FitToHeight,
    )
    val fitReferenceOptions = listOf(ReaderSettingsOptions.FitReferencePage, ReaderSettingsOptions.FitReferenceText)
    val widthReferenceOptions = fitReferenceOptions + ReaderSettingsOptions.FitReferenceCroppedText
    val marginaliaOptions = listOf(ReaderSettingsOptions.MarginaliaExclude, ReaderSettingsOptions.MarginaliaInclude)
    val selectionOptions = listOf(
        ReaderSettingsOptions.SelectionDirect,
        ReaderSettingsOptions.SelectionAndroid,
    )
    val contentMarginOptions = listOf(
        ReaderSettingsOptions.ContentMarginNone,
        ReaderSettingsOptions.ContentMarginSmall,
        ReaderSettingsOptions.ContentMarginMedium,
        ReaderSettingsOptions.ContentMarginLarge,
    )

}

internal sealed class ReaderSettingsViewEffect : ViewEffect
