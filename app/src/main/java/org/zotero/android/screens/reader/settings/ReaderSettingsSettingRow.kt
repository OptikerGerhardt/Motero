package org.zotero.android.screens.reader.settings

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.material3.ButtonGroupDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.ToggleButton
import androidx.compose.material3.ToggleButtonDefaults
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import org.zotero.android.screens.reader.settings.data.MultiSelectorOption
import org.zotero.android.screens.reader.settings.data.ReaderSettingsOptions
import org.zotero.android.uicomponents.Drawables
import org.zotero.android.uicomponents.foundation.safeStringResource

internal fun LazyListScope.readerSettingsSettingRow(
    @StringRes titleResId: Int,
    options: List<ReaderSettingsOptions>,
    selectedOption: ReaderSettingsOptions,
    optionSelected: (Int) -> Unit,
    columns: Int = Int.MAX_VALUE,
) {
    item {
        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = safeStringResource(id = titleResId),
                color = MaterialTheme.colorScheme.onSurface,
                style = MaterialTheme.typography.bodyMedium,
            )
            Spacer(modifier = Modifier.height(8.dp))

            val optionsList = options.map { opt ->
                MultiSelectorOption(
                    ordinal = opt.ordinal,
                    optionString = safeStringResource(id = opt.optionStringId)
                )
            }
            val compactLabels = remember(optionsList) { compactReaderOptionLabels(optionsList.map { it.optionString }) }
            val textMeasurer = rememberTextMeasurer()
            val labelStyle = MaterialTheme.typography.labelLarge
            val density = LocalDensity.current
            optionsList.chunked(columns).forEachIndexed { rowIndex, rowOptions ->
                if (rowIndex > 0) Spacer(Modifier.height(6.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(ButtonGroupDefaults.ConnectedSpaceBetween),
                ) {
                    rowOptions.forEachIndexed { index, opt ->
                        val isSelected = opt.ordinal == selectedOption.ordinal
                        ToggleButton(
                            checked = isSelected,
                            onCheckedChange = { optionSelected(opt.ordinal) },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .semantics {
                                    role = Role.RadioButton
                                    contentDescription = opt.optionString
                                },
                            shapes = when (index) {
                                0 -> ButtonGroupDefaults.connectedLeadingButtonShapes()
                                rowOptions.lastIndex -> ButtonGroupDefaults.connectedTrailingButtonShapes()
                                else -> ButtonGroupDefaults.connectedMiddleButtonShapes()
                            },
                            colors = ToggleButtonDefaults.toggleButtonColors(
                                checkedContainerColor = MaterialTheme.colorScheme.secondary,
                                checkedContentColor = MaterialTheme.colorScheme.onSecondary,
                                contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
                                containerColor = MaterialTheme.colorScheme.secondaryContainer
                            ),
                        ) {
                            BoxWithConstraints(Modifier.fillMaxWidth()) {
                                val compact = compactLabels[optionsList.indexOf(opt)]
                                val fullWidth = textMeasurer.measure(opt.optionString, labelStyle, softWrap = false, maxLines = 1).size.width
                                val compactWidth = textMeasurer.measure(compact, labelStyle, softWrap = false, maxLines = 1).size.width
                                val iconWidth = with(density) { 30.dp.roundToPx() }
                                // Reserve the real checkmark width. At extreme font scales the
                                // checked colors/semantics remain while the icon yields to text.
                                val showCheck = isSelected && compactWidth + iconWidth <= constraints.maxWidth
                                val available = constraints.maxWidth - if (showCheck) iconWidth else 0
                                val label = readerOptionLabel(opt.optionString, compact, fullWidth, available)
                                Row(
                                    modifier = Modifier.align(Alignment.Center),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center,
                                ) {
                                    if (showCheck) {
                                        Icon(
                                            modifier = Modifier.size(24.dp),
                                            painter = painterResource(id = Drawables.check_24px),
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSecondary,
                                        )
                                        Spacer(Modifier.width(6.dp))
                                    }
                                    Text(
                                        text = label,
                                        style = labelStyle,
                                        maxLines = 1,
                                        softWrap = false,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.clearAndSetSemantics { },
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

internal fun LazyListScope.readerSettingsSliderRow(
    @StringRes titleResId: Int,
    value: Float,
    valueRange: ClosedFloatingPointRange<Float>,
    steps: Int,
    valueLabel: String,
    onValueChange: (Float) -> Unit,
) {
    item {
        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = safeStringResource(id = titleResId),
                color = MaterialTheme.colorScheme.onSurface,
                style = MaterialTheme.typography.bodyMedium,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Slider(
                    modifier = Modifier.weight(1f),
                    value = value,
                    onValueChange = onValueChange,
                    valueRange = valueRange,
                    steps = steps,
                    colors = SliderDefaults.colors(
                        activeTrackColor = MaterialTheme.colorScheme.primary,
                        thumbColor = MaterialTheme.colorScheme.primary,
                    ),
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = valueLabel,
                    color = MaterialTheme.colorScheme.onSurface,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.End,
                    modifier = Modifier.widthIn(min = 44.dp),
                )
            }
        }
    }
}
