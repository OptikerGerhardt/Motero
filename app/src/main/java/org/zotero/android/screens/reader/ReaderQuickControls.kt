package org.zotero.android.screens.reader

import android.widget.Toast
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.toColorInt
import org.zotero.android.R
import org.zotero.android.sync.Tag

private fun tagColor(hex: String): Color = runCatching {
    Color((if (hex.startsWith("#")) hex else "#$hex").toColorInt())
}.getOrDefault(Color.Gray)

@Composable
internal fun ReaderFilterColorButton(hex: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        Modifier.size(40.dp)
            .border(if (isSelected) 3.dp else 1.dp, MaterialTheme.colorScheme.onSurface, RoundedCornerShape(6.dp))
            .semantics { selected = isSelected; contentDescription = hex }
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Canvas(Modifier.size(24.dp)) { drawCircle(tagColor(hex)) }
        if (isSelected) Text("✓", color = Color.Black, fontSize = 18.sp)
    }
}

@Composable
internal fun ReaderColoredTagShortcuts(
    tags: List<Tag>, selectedTags: List<Tag>, enabled: Boolean, onToggle: (Tag) -> Unit,
) {
    if (tags.isEmpty()) return
    val context = LocalContext.current
    Column(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text(stringResource(R.string.boox_colored_tags), Modifier.padding(horizontal = 16.dp),
            style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface)
        LazyRow(Modifier.fillMaxWidth(), contentPadding = PaddingValues(horizontal = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            items(tags, key = { it.name }) { tag ->
                val checked = selectedTags.any { it.name == tag.name }
                Box(
                    Modifier.size(44.dp)
                        .border(if (checked) 3.dp else 1.dp, MaterialTheme.colorScheme.onSurface,
                            RoundedCornerShape(6.dp))
                        .semantics { selected = checked; contentDescription = tag.name }
                        .combinedClickable(enabled = enabled, onClick = { onToggle(tag) },
                            onLongClick = { Toast.makeText(context, tag.name, Toast.LENGTH_SHORT).show() }),
                    contentAlignment = Alignment.Center
                ) {
                    Text("#", color = tagColor(tag.color), fontSize = 28.sp)
                    if (checked) Text("✓", Modifier.align(Alignment.BottomEnd).padding(end = 2.dp),
                        color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
internal fun ReaderHighlightQuote(text: String) {
    if (text.isBlank()) return
    val maxHeight = (LocalConfiguration.current.screenHeightDp * 0.20f).coerceIn(64f, 220f).dp
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(stringResource(R.string.boox_highlight_text), style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface)
        SelectionContainer {
            Text(text, Modifier.fillMaxWidth().heightIn(max = maxHeight)
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(6.dp))
                .verticalScroll(rememberScrollState()).padding(10.dp),
                style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}
