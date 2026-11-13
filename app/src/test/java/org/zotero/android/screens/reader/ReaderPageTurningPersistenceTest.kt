package org.zotero.android.screens.reader

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.viewModelScope
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.zotero.android.architecture.Defaults
import org.zotero.android.screens.settings.pageturning.SettingsPageTurningViewModel

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class ReaderPageTurningPersistenceTest {
    @get:Rule val instant = InstantTaskExecutorRule()
    @Test fun `inline page turning choices persist when Reader Controls reopens`() {
        Dispatchers.setMain(Dispatchers.Unconfined)
        val defaults = mockk<Defaults>()
        var enabled = false; var reversed = false; var zoom = false; var percent = 67
        every { defaults.isButtonPageTurning() } answers { enabled }
        every { defaults.isPageTurningReversed() } answers { reversed }
        every { defaults.isKeepZoom() } answers { zoom }
        every { defaults.getHardwareScrollPercent() } answers { percent }
        every { defaults.setButtonPageTurning(any()) } answers { enabled = firstArg() }
        every { defaults.setPageTurningReversed(any()) } answers { reversed = firstArg() }
        every { defaults.setKeepZoom(any()) } answers { zoom = firstArg() }
        every { defaults.setHardwareScrollPercent(any()) } answers { percent = firstArg() }
        val first = SettingsPageTurningViewModel(defaults).also { it.checkMainThread = false; it.init() }
        val reopened = SettingsPageTurningViewModel(defaults).also { it.checkMainThread = false }
        try {
            first.onButtonPageTurningSwitchTapped(true); first.onReverseChanged(true)
            first.onButtonKeepZoomSwitchTapped(true); first.onScrollPercentChanged(33)
            reopened.init()
            assertTrue(reopened.viewState.pageTurning); assertTrue(reopened.viewState.reversed)
            assertTrue(reopened.viewState.keepZoom); assertEquals(33, reopened.viewState.scrollPercent)
        } finally { first.viewModelScope.cancel(); reopened.viewModelScope.cancel(); Dispatchers.resetMain() }
    }
}
