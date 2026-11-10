package org.zotero.android.screens.reader.settings

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.Composable
import androidx.compose.material3.TextButton
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.FilterChip
import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.dp
import org.zotero.android.R
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.Modifier
import org.zotero.android.screens.reader.data.ReaderFileType
import org.zotero.android.screens.reader.settings.data.ReaderSettingsOptions
import org.zotero.android.uicomponents.Strings
import java.util.Locale
import kotlin.math.roundToInt

@Composable
internal fun ReaderSettingsTable(
    viewState: ReaderSettingsViewState,
    viewModel: ReaderSettingsViewModel,
    onDeviceSettings: () -> Unit = {},
    onManualCrop: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp),
    ) {
        readerSettingsSettingRow(
            titleResId = Strings.pdf_settings_appearance_title,
            options = viewState.appearanceOptions,
            selectedOption = viewState.selectedAppearanceOption,
            optionSelected = viewModel::onOptionSelected
        )
        if (viewState.fileType == ReaderFileType.PDF && !viewState.readingModeEnabled) {
            readerSettingsSettingRow(
                titleResId = Strings.pdf_settings_scroll_mode_title,
                options = viewState.scrollModeOptions,
                selectedOption = viewState.selectedScrollModeOption,
                optionSelected = viewModel::onOptionSelected
            )
            readerSettingsSettingRow(
                options = listOf(ReaderSettingsOptions.NavigationJumped, ReaderSettingsOptions.NavigationContinuous),
                selectedOption = if (viewState.pageNavigation == "jumped") ReaderSettingsOptions.NavigationJumped else ReaderSettingsOptions.NavigationContinuous,
                optionSelected = viewModel::onOptionSelected,
            )
        }
        // Fitting applies to the PDF pages, not to Reading Mode's reflowed text
        if (viewState.fileType == ReaderFileType.PDF && !viewState.readingModeEnabled) {
            readerSettingsSettingRow(
                titleResId = R.string.reader_content_cropping,
                options = listOf(ReaderSettingsOptions.CropAutomatic, ReaderSettingsOptions.CropManual),
                selectedOption = if (viewState.cropMode == "manual") ReaderSettingsOptions.CropManual else ReaderSettingsOptions.CropAutomatic,
                optionSelected = { if (it == ReaderSettingsOptions.CropManual.ordinal) onManualCrop() else viewModel.useAutomaticCrop() },
            )
            val axisFit = viewState.selectedFitToContentOption == ReaderSettingsOptions.FitToWidth
                || viewState.selectedFitToContentOption == ReaderSettingsOptions.FitToHeight
            if (axisFit && viewState.cropMode != "manual") {
                readerSettingsSettingRow(
                    titleResId = Strings.pdf_settings_fit_reference_title,
                    options = viewState.widthReferenceOptions,
                    selectedOption = viewState.selectedFitReferenceOption,
                    optionSelected = viewModel::onOptionSelected,
                )
            }
            readerSettingsSettingRow(
                titleResId = Strings.pdf_settings_page_fitting_title,
                options = viewState.fitToContentOptions,
                selectedOption = viewState.selectedFitToContentOption,
                columns = 2,
                optionSelected = viewModel::onOptionSelected
            )
            if (viewState.selectedFitToContentOption == ReaderSettingsOptions.FitToContentOn
                || (axisFit && (viewState.cropMode == "manual" || viewState.selectedFitReferenceOption != ReaderSettingsOptions.FitReferencePage))) {
                readerSettingsSettingRow(
                    titleResId = Strings.pdf_settings_content_margin_title,
                    options = viewState.contentMarginOptions,
                    selectedOption = viewState.selectedContentMarginOption,
                    optionSelected = viewModel::onOptionSelected
                )
                readerSettingsSettingRow(
                    titleResId = Strings.pdf_settings_marginalia_title,
                    options = viewState.marginaliaOptions,
                    selectedOption = viewState.selectedMarginaliaOption,
                    optionSelected = viewModel::onOptionSelected
                )
            }

        }
        if ((viewState.fileType == ReaderFileType.PDF && !viewState.readingModeEnabled) || viewState.fileType == ReaderFileType.EPUB) {
            readerSettingsSettingRow(
                titleResId = Strings.pdf_settings_spreads_title,
                options = viewState.spreadsOptions,
                selectedOption = viewState.selectedSpreadsOption,
                optionSelected = viewModel::onOptionSelected
            )
        }
        if (viewState.fileType == ReaderFileType.EPUB) {
            readerSettingsSettingRow(
                titleResId = Strings.pdf_settings_page_layout_title,
                options = viewState.pageLayoutFlowOptions,
                selectedOption = viewState.selectedPageLayoutFlowMode,
                optionSelected = viewModel::onOptionSelected
            )
        }

        if (viewState.fileType == ReaderFileType.EPUB || viewState.readingModeEnabled) {
            item {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
                    Text(stringResource(R.string.reader_font), style = MaterialTheme.typography.titleSmall)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        for ((value, label) in listOf("original" to R.string.reader_font_original, "serif" to R.string.reader_font_serif, "sans-serif" to R.string.reader_font_sans)) {
                            FilterChip(selected = viewState.fontFamily == value, onClick = { viewModel.onFontFamilyChanged(value) }, label = { Text(stringResource(label)) })
                        }
                    }
                }
            }
            readerSettingsSliderRow(
                titleResId = org.zotero.android.R.string.reader_text_size,
                value = viewState.textScale,
                valueRange = 0.6f..1.8f,
                steps = 11,
                valueLabel = "${(viewState.textScale * 100).roundToInt()}%",
                onValueChange = viewModel::onTextScaleChanged,
            )
            readerSettingsSliderRow(
                titleResId = Strings.pdf_settings_line_height_title,
                value = viewState.lineHeight,
                valueRange = 0.80f..2.00f,
                steps = 2,
                valueLabel = String.format(Locale.getDefault(), "%.1f", viewState.lineHeight),
                onValueChange = viewModel::onLineHeightChanged,
            )
            readerSettingsSliderRow(
                titleResId = Strings.pdf_settings_word_spacing_title,
                value = viewState.wordSpacing,
                valueRange = -100f..100f,
                steps = 9,
                valueLabel = "${viewState.wordSpacing.roundToInt()}%",
                onValueChange = viewModel::onWordSpacingChanged,
            )
            readerSettingsSliderRow(
                titleResId = Strings.pdf_settings_letter_spacing_title,
                value = viewState.letterSpacing,
                valueRange = -0.1f..0.1f,
                steps = 9,
                valueLabel = "${(viewState.letterSpacing * 1000).roundToInt()}%",
                onValueChange = viewModel::onLetterSpacingChanged,
            )
            readerSettingsSliderRow(
                titleResId = R.string.reader_margins,
                value = viewState.pageWidth,
                valueRange = 0f..20f,
                steps = 19,
                valueLabel = "${viewState.pageWidth.roundToInt()}%",
                onValueChange = viewModel::onPageWidthChanged,
            )
        }
        item {
            TextButton(onClick = onDeviceSettings) { Text("Stylus") }
        }
    }
}
