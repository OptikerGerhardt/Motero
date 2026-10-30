package org.zotero.android.screens.reader

import android.widget.Toast
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.toColorInt
import org.zotero.android.screens.settings.elements.NewSettingsDivider
import org.zotero.android.sync.Tag

private fun tagColor(hex: String): Color = runCatching {
    Color((if (hex.startsWith("#")) hex else "#$hex").toColorInt())
}.getOrDefault(Color.Gray)

@Composable
internal fun ReaderFilterColorButton(hex: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        Modifier.size(40.dp)
            .background(if (isSelected) MaterialTheme.colorScheme.secondaryContainer else Color.Transparent, RoundedCornerShape(8.dp))
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
    colorCount: Int = 8,
) {
    if (tags.isEmpty()) return
    val context = LocalContext.current
    NewSettingsDivider()
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        // Extend half a center-to-center color spacing beyond each outer
        // circle's center: with SpaceEvenly this is half its outer gap.
        val count = colorCount.coerceAtLeast(1)
        val inset = ((maxWidth - 28.dp * count) / (count + 1) / 2).coerceAtLeast(0.dp)
        Row(Modifier.fillMaxWidth().padding(horizontal = inset),
            horizontalArrangement = Arrangement.spacedBy(3.dp),
            verticalAlignment = Alignment.CenterVertically) {
            tags.forEach { tag ->
                val checked = selectedTags.any { it.name == tag.name }
                Box(
                    Modifier.weight(1f).height(48.dp)
                        .background(if (checked) MaterialTheme.colorScheme.secondaryContainer else Color.Transparent,
                            RoundedCornerShape(8.dp))
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
    val quoteLineColor = MaterialTheme.colorScheme.outline
    Column(Modifier.fillMaxWidth()) {
        NewSettingsDivider()
        SelectionContainer(Modifier.padding(horizontal = 16.dp)) {
            Text(text, Modifier.fillMaxWidth().heightIn(max = maxHeight)
                .verticalScroll(rememberScrollState())
                .drawBehind {
                    drawLine(quoteLineColor, Offset.Zero, Offset(0f, size.height), strokeWidth = 2.dp.toPx())
                }
                .padding(start = 12.dp, top = 8.dp, bottom = 8.dp),
                style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
        }
        NewSettingsDivider()
    }
}
