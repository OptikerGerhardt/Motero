package org.zotero.android.screens.reader.settings.data

data class ReaderSettingsChangeResult(val readerSettings: ReaderSettings, val reapplyFitting: Boolean = false, val startManualCrop: Boolean = false)
