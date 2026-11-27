package org.zotero.android.screens.reader.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import org.zotero.android.R
import org.zotero.android.screens.reader.data.ReaderLaunchTarget

internal enum class WidgetSymbol(val title: Int, val icon: Int) {
    STAR(R.string.reader_widget_star, R.drawable.reader_widget_star),
    FLAG(R.string.reader_widget_flag, R.drawable.ic_reader_bookmark),
    TRIANGLE(R.string.reader_widget_triangle, R.drawable.reader_widget_triangle),
    SQUARE(R.string.reader_widget_square, R.drawable.reader_widget_square),
    YEAR(R.string.reader_widget_year, R.drawable.reader_widget_square),
}

internal enum class WidgetLabel(val title: Int) {
    AUTHOR(R.string.reader_widget_author),
    AUTHOR_YEAR(R.string.reader_widget_author_year),
    TITLE(R.string.reader_widget_short_title),
}

internal data class DocumentWidget(
    val target: ReaderLaunchTarget,
    val symbol: WidgetSymbol,
    val labelStyle: WidgetLabel,
    val label: String,
    val year: String,
) {
    fun save(context: Context, id: Int): Boolean = preferences(context, id).edit()
        .putString("target", target.encode()).putString("symbol", symbol.name).putString("labelStyle", labelStyle.name)
        .putString("label", label).putString("year", year).commit()

    companion object {
        private fun preferences(context: Context, id: Int) =
            context.getSharedPreferences("document-widget-$id", Context.MODE_PRIVATE)

        fun read(context: Context, id: Int): DocumentWidget? {
            val saved = preferences(context, id)
            val target = ReaderLaunchTarget.parse(saved.getString("target", null)) ?: return null
            val symbol = WidgetSymbol.entries.find { it.name == saved.getString("symbol", null) } ?: WidgetSymbol.FLAG
            val style = WidgetLabel.entries.find { it.name == saved.getString("labelStyle", null) } ?: WidgetLabel.TITLE
            return DocumentWidget(target, symbol, style, saved.getString("label", null) ?: target.key,
                saved.getString("year", null).orEmpty())
        }

        fun delete(context: Context, id: Int) {
            preferences(context, id).edit().clear().apply()
        }
    }
}

class DocumentWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        ids.forEach { update(context, manager, it) }
    }

    override fun onDeleted(context: Context, ids: IntArray) {
        ids.forEach { DocumentWidget.delete(context, it) }
    }

    override fun onRestored(context: Context, oldIds: IntArray, newIds: IntArray) {
        val restored = oldIds.map { DocumentWidget.read(context, it) }
        oldIds.forEach { DocumentWidget.delete(context, it) }
        newIds.zip(restored).forEach { (id, widget) -> widget?.save(context, id) }
    }

    companion object {
        internal fun update(context: Context, manager: AppWidgetManager, id: Int) {
            val widget = DocumentWidget.read(context, id)
            val views = RemoteViews(context.packageName, R.layout.reader_document_widget)
            if (widget != null) {
                val showYear = widget.symbol == WidgetSymbol.YEAR && widget.year.isNotEmpty()
                views.setTextViewText(R.id.reader_widget_text, widget.label)
                views.setImageViewResource(R.id.reader_widget_symbol, widget.symbol.icon)
                views.setTextViewText(R.id.reader_widget_year_text, widget.year)
                views.setViewVisibility(R.id.reader_widget_year_text, if (showYear) View.VISIBLE else View.GONE)
                val intent = PendingIntent.getActivity(context, id, widget.target.launchIntent(context),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                views.setOnClickPendingIntent(R.id.reader_widget_root, intent)
            }
            manager.updateAppWidget(id, views)
        }
    }
}
