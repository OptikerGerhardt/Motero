package org.zotero.android.screens.reader.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.zotero.android.R
import org.zotero.android.androidx.text.strippedRichTextTags
import org.zotero.android.architecture.Defaults
import org.zotero.android.database.DbWrapperMain
import org.zotero.android.database.RealmDbCoordinator
import org.zotero.android.database.objects.RItem
import org.zotero.android.files.FileStore
import org.zotero.android.screens.reader.data.ReaderLaunchTarget
import org.zotero.android.sync.SessionController
import org.zotero.android.uicomponents.themem3.AppThemeM3
import timber.log.Timber
import javax.inject.Inject

private data class WidgetDocument(
    val target: ReaderLaunchTarget,
    val title: String,
    val filename: String,
    val shortTitle: String,
    val author: String,
    val year: String,
) {
    fun label(style: WidgetLabel): String = when (style) {
        WidgetLabel.AUTHOR -> author.ifBlank { title }
        WidgetLabel.AUTHOR_YEAR -> listOf(author.ifBlank { title }, year).filter { it.isNotBlank() }.joinToString(" · ")
        WidgetLabel.TITLE -> shortTitle
    }
}

@AndroidEntryPoint
class DocumentWidgetConfigActivity : ComponentActivity() {
    @Inject lateinit var defaults: Defaults
    @Inject lateinit var database: DbWrapperMain
    @Inject lateinit var fileStore: FileStore
    @Inject lateinit var session: SessionController

    private var documents by mutableStateOf<List<WidgetDocument>?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        val result = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id)
        setResult(RESULT_CANCELED, result)
        val manager = AppWidgetManager.getInstance(this)
        if (intent.action != AppWidgetManager.ACTION_APPWIDGET_CONFIGURE ||
            manager.getAppWidgetInfo(id)?.provider != ComponentName(this, DocumentWidgetProvider::class.java)
        ) {
            finish()
            return
        }

        val saved = DocumentWidget.read(this, id)
        setContent {
            AppThemeM3 {
                Surface(Modifier.fillMaxSize()) {
                    ConfigureWidget(documents, saved, onCancel = ::finish) { document, symbol, style ->
                        if (!session.isLoggedIn || document.target.accountId != defaults.getUserId()) return@ConfigureWidget false
                        val widget = DocumentWidget(document.target, symbol, style, document.label(style), document.year)
                        if (!widget.save(this, id)) return@ConfigureWidget false
                        DocumentWidgetProvider.update(this, manager, id)
                        setResult(RESULT_OK, result)
                        finish()
                        true
                    }
                }
            }
        }
        lifecycleScope.launch {
            documents = withContext(Dispatchers.IO) {
                runCatching { loadDocuments() }.onFailure { Timber.w(it, "Cannot list documents for widget setup") }
                    .getOrDefault(emptyList())
            }
        }
    }

    private fun loadDocuments(): List<WidgetDocument> {
        if (!session.isLoggedIn || !database.isInitialized) return emptyList()
        val user = defaults.getUserId()
        val coordinator = RealmDbCoordinator().init(database.config)
        return try {
            coordinator.realm.where(RItem::class.java)
                .equalTo("rawType", "attachment").equalTo("deleted", false).equalTo("trash", false)
                .findAll().mapNotNull { item ->
                    val library = item.libraryId ?: return@mapNotNull null
                    val target = ReaderLaunchTarget.from(user, library, item.key) ?: return@mapNotNull null
                    val file = runCatching { target.localDocument(item, fileStore, defaults) }.getOrNull()
                        ?: return@mapNotNull null
                    val parent = item.parent
                    val title = parent?.displayTitle.orEmpty().strippedRichTextTags.ifBlank {
                        item.displayTitle.strippedRichTextTags.ifBlank { file.name }
                    }
                    val metadata = parent ?: item
                    val shortTitle = metadata.fields.firstOrNull { it.key == "shortTitle" }?.value.orEmpty().strippedRichTextTags.ifBlank { title }
                    WidgetDocument(target, title, file.name, shortTitle, metadata.creatorSummary.orEmpty(),
                        metadata.parsedYear.takeIf { it > 0 }?.toString().orEmpty())
                }.sortedBy { it.title.lowercase() }
        } finally {
            coordinator.invalidate()
        }
    }
}

@Composable
private fun ConfigureWidget(
    documents: List<WidgetDocument>?,
    saved: DocumentWidget?,
    onCancel: () -> Unit,
    onSave: (WidgetDocument, WidgetSymbol, WidgetLabel) -> Boolean,
) {
    var target by rememberSaveable { mutableStateOf(saved?.target?.encode()) }
    var symbolName by rememberSaveable { mutableStateOf((saved?.symbol ?: WidgetSymbol.FLAG).name) }
    var labelName by rememberSaveable { mutableStateOf((saved?.labelStyle ?: WidgetLabel.TITLE).name) }
    var query by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf(false) }
    val selected = remember(documents, target) { documents?.firstOrNull { it.target.encode() == target } }
    val symbol = WidgetSymbol.valueOf(symbolName)
    val label = WidgetLabel.valueOf(labelName)

    Column(Modifier.safeDrawingPadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(stringResource(R.string.reader_widget_configure), style = MaterialTheme.typography.headlineSmall)
        when {
            documents == null -> Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            documents.isEmpty() -> Text(stringResource(R.string.reader_widget_no_documents), Modifier.weight(1f))
            selected == null -> {
                OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth(), singleLine = true,
                    label = { Text(stringResource(R.string.reader_widget_search)) })
                val results = remember(documents, query) {
                    val needle = query.trim()
                    documents.filter { it.title.contains(needle, true) || it.filename.contains(needle, true) ||
                        it.author.contains(needle, true) }
                }
                LazyColumn(Modifier.weight(1f)) {
                    items(results, key = { it.target.encode() }) { document ->
                        Column(Modifier.fillMaxWidth().clickable { target = document.target.encode() }
                            .padding(vertical = 10.dp)) {
                            Text(document.title, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Text(document.filename, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
            else -> LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                item {
                    Text(selected.title, style = MaterialTheme.typography.titleMedium)
                    TextButton(onClick = { target = null; error = false }) {
                        Text(stringResource(R.string.reader_widget_choose_document))
                    }
                }
                item {
                    Column(Modifier.selectableGroup()) {
                        Text(stringResource(R.string.reader_widget_symbol_label), style = MaterialTheme.typography.titleMedium)
                        WidgetSymbol.entries.forEach { option ->
                            WidgetRadio(stringResource(option.title), option == symbol, { symbolName = option.name }) {
                                Icon(painterResource(option.icon), contentDescription = null, modifier = Modifier.padding(end = 8.dp))
                            }
                        }
                    }
                }
                item {
                    Column(Modifier.selectableGroup()) {
                        Text(stringResource(R.string.reader_widget_label_label), style = MaterialTheme.typography.titleMedium)
                        WidgetLabel.entries.forEach { option ->
                            WidgetRadio(stringResource(option.title), option == label, { labelName = option.name })
                        }
                        Text(selected.label(label), maxLines = 2, overflow = TextOverflow.Ellipsis,
                            style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp))
                    }
                }
            }
        }
        if (error) Text(stringResource(R.string.reader_shortcut_unavailable), color = MaterialTheme.colorScheme.error)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = onCancel) { Text(stringResource(android.R.string.cancel)) }
            Button(enabled = selected != null, onClick = {
                if (selected != null) error = !onSave(selected, symbol, label)
            }) { Text(stringResource(R.string.reader_widget_save)) }
        }
    }
}

@Composable
private fun WidgetRadio(title: String, selected: Boolean, onSelect: () -> Unit, icon: @Composable () -> Unit = {}) {
    Row(Modifier.fillMaxWidth().selectable(selected, role = Role.RadioButton, onClick = onSelect)
        .padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        RadioButton(selected, onClick = null, modifier = Modifier.padding(end = 12.dp))
        icon()
        Text(title)
    }
}
