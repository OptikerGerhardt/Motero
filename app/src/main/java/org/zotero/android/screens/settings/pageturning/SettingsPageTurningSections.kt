package org.zotero.android.screens.settings.pageturning

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import org.zotero.android.uicomponents.Strings


@Composable
internal fun SettingsPageTurningSections(
    buttonPageTurning: Boolean,
    onButtonPageTurningSwitchTapped: (Boolean) -> Unit,
    reversed: Boolean,
    onReverseChanged: (Boolean) -> Unit,
    scrollPercent: Int,
    onScrollPercentChanged: (Int) -> Unit,
    buttonKeepZoom: Boolean,
    onButtonKeepZoomSwitchTapped: (Boolean) -> Unit,
) {
    SettingsButtonPageTurningSwitchItem(
        title = stringResource(Strings.settings_page_turning_button),
        isChecked = buttonPageTurning,
        onCheckedChange = onButtonPageTurningSwitchTapped
    )
    SettingsButtonPageTurningSwitchItem(
        title = stringResource(org.zotero.android.R.string.settings_reverse_page_buttons),
        isChecked = reversed,
        onCheckedChange = onReverseChanged,
    )
    Column(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
        Text(stringResource(org.zotero.android.R.string.settings_hardware_scroll_step))
        Row {
            listOf(0, 33, 50, 67, 100).forEach { percent ->
                TextButton(modifier = Modifier.weight(1f), onClick = { onScrollPercentChanged(percent) }) {
                    val label = when (percent) {
                        0 -> stringResource(org.zotero.android.R.string.settings_hardware_page_only)
                        33 -> "⅓"
                        50 -> "½"
                        67 -> "⅔"
                        else -> "1"
                    }
                    Text(label, fontWeight = if (scrollPercent == percent) FontWeight.Bold else FontWeight.Normal,
                        color = if (scrollPercent == percent) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
    SettingsButtonKeepZoomSwitchItem(
        title = stringResource(Strings.settings_keep_zoom_button),
        isChecked = buttonKeepZoom,
        onCheckedChange = onButtonKeepZoomSwitchTapped
    )
}
