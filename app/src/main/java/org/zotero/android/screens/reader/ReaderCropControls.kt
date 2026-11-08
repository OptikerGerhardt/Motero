package org.zotero.android.screens.reader

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import org.zotero.android.R
import org.zotero.android.uicomponents.Drawables

/** Native controls overlay the existing preview; dragging never recreates the WebView. */
@Composable
internal fun ReaderCropControls(viewModel: ReaderViewModel, state: ReaderViewState) {
    val density = LocalDensity.current
    Surface(color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 12.dp)
            .onSizeChanged { viewModel.cropInsets(it.height.toDouble() / density.density, 12.0) }) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = { viewModel.cropAction("cancel") }) {
                    Text(stringResource(R.string.reader_crop_cancel))
                }
                Text(stringResource(R.string.reader_crop_title), Modifier.weight(1f),
                    style = MaterialTheme.typography.titleLarge)
                FilledTonalButton(enabled = !state.cropEditorBusy, onClick = { viewModel.cropAction("save") }) {
                    Text(stringResource(R.string.reader_crop_apply))
                }
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween) {
                val expanded = androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
                Box {
                    TextButton(onClick = { expanded.value = true }) {
                        Text(stringResource(when(state.cropEditorScope) {
                            "odd" -> R.string.reader_crop_odd
                            "even" -> R.string.reader_crop_even
                            else -> R.string.reader_crop_all
                        }))
                    }
                    DropdownMenu(expanded = expanded.value, onDismissRequest = { expanded.value = false }) {
                        for ((scope, label) in listOf("all" to R.string.reader_crop_all,
                            "odd" to R.string.reader_crop_odd, "even" to R.string.reader_crop_even)) {
                            DropdownMenuItem(text = { Text(stringResource(label)) },
                                enabled = scope != "even" || state.cropEditorCount > 1,
                                onClick = { expanded.value = false; viewModel.cropAction("scope", scope) })
                        }
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    val step = if (state.cropEditorScope == "all") 1 else 2
                    IconButton(enabled = state.cropEditorPage - step >= 1,
                        onClick = { viewModel.cropAction("previous") }) {
                        Icon(painterResource(Drawables.chevron_right_24px), "Previous page", modifier = Modifier.rotate(180f))
                    }
                    Text("${state.cropEditorPage} / ${state.cropEditorCount}", style = MaterialTheme.typography.bodyMedium)
                    IconButton(enabled = state.cropEditorPage + step <= state.cropEditorCount,
                        onClick = { viewModel.cropAction("next") }) {
                        Icon(painterResource(Drawables.chevron_right_24px), "Next page")
                    }
                }
            }
            Text(stringResource(R.string.reader_crop_help),
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
            if (state.cropEditorBusy) LinearProgressIndicator(Modifier.fillMaxWidth())
            else Spacer(Modifier.height(4.dp))
        }
    }
}
