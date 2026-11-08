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
    onManualCrop: () -> Unit = {},
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
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
        }
        // Fitting applies to the PDF pages, not to Reading Mode's reflowed text
        if (viewState.fileType == ReaderFileType.PDF && !viewState.readingModeEnabled) {
            item {
                Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Text(stringResource(R.string.reader_content_cropping), style = MaterialTheme.typography.titleSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(selected = viewState.cropMode == "automatic", onClick = viewModel::useAutomaticCrop,
                            label = { Text(stringResource(R.string.reader_crop_automatic)) })
                        FilterChip(selected = viewState.cropMode == "manual", onClick = onManualCrop,
                            label = { Text(stringResource(R.string.reader_crop_manual)) })
                    }
                }
            }
            readerSettingsSettingRow(
                titleResId = Strings.pdf_settings_page_fitting_title,
                options = viewState.fitToContentOptions,
                selectedOption = viewState.selectedFitToContentOption,
                columns = 2,
                optionSelected = viewModel::onOptionSelected
            )
            val axisFit = viewState.selectedFitToContentOption == ReaderSettingsOptions.FitToWidth
                || viewState.selectedFitToContentOption == ReaderSettingsOptions.FitToHeight
            if (viewState.selectedFitToContentOption == ReaderSettingsOptions.FitToContentOn
                || axisFit) {
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
            readerSettingsSettingRow(
                titleResId = Strings.pdf_settings_selection_title,
                options = viewState.selectionOptions,
                selectedOption = viewState.selectedSelectionOption,
                optionSelected = viewModel::onOptionSelected
            )
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

        if (viewState.fileType == ReaderFileType.EPUB) {
            item {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
                    Text(stringResource(R.string.reader_progress_display), style = MaterialTheme.typography.titleSmall)
                    for ((mode, label) in listOf("both" to R.string.reader_progress_both, "hidden" to R.string.reader_progress_hidden,
                        "position" to R.string.reader_progress_position, "percent" to R.string.reader_progress_percent)) {
                        FilterChip(selected = viewState.progressMode == mode, onClick = { viewModel.setProgressMode(mode) },
                            label = { Text(stringResource(label)) })
                    }
                }
            }
        }
        if (viewState.fileType == ReaderFileType.EPUB || viewState.readingModeEnabled) {
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
                titleResId = Strings.pdf_settings_page_width_title,
                value = viewState.pageWidth,
                valueRange = -1f..1f,
                steps = 1,
                valueLabel = "${((viewState.pageWidth + 3) / 4 * 100).roundToInt()}%",
                onValueChange = viewModel::onPageWidthChanged,
            )
        }

    }
}
