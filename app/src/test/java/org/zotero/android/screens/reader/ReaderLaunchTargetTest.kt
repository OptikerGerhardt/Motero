package org.zotero.android.screens.reader

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.zotero.android.database.objects.RCustomLibraryType
import org.zotero.android.screens.reader.data.ReaderLaunchTarget
import org.zotero.android.sync.LibraryIdentifier

class ReaderLaunchTargetTest {
    @Test
    fun savedReaderTargetsRetainAccountAttachmentAndGroupIdentity() {
        val target = ReaderLaunchTarget.from(42, LibraryIdentifier.group(7), "AB12CD34")
        assertEquals(ReaderLaunchTarget(42, 7, "AB12CD34"), target)
        assertEquals(target, ReaderLaunchTarget.parse(target?.encode()))
        assertEquals(LibraryIdentifier.custom(RCustomLibraryType.myLibrary),
            ReaderLaunchTarget.parse("42:0:AB12CD34")?.libraryId)
    }

    @Test
    fun malformedReaderTargetsCannotBecomePathsOrAnotherLibraryType() {
        assertNull(ReaderLaunchTarget.parse("42:7:../../file"))
        assertNull(ReaderLaunchTarget.parse("42:-7:AB12CD34"))
        assertNull(ReaderLaunchTarget.parse("0:7:AB12CD34"))
        assertNull(ReaderLaunchTarget.parse("42:7:AB12CD34:extra"))
    }
}
