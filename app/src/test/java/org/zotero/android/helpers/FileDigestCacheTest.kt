package org.zotero.android.helpers

import java.nio.file.Files
import java.nio.file.StandardCopyOption
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class FileDigestCacheTest {
    @get:Rule val folder = TemporaryFolder()

    @Test fun `a replacement with the same length and timestamp refreshes the digest`() {
        val original = folder.newFile("attachment.pdf").apply { writeText("old") }
        val first = FileHelper.cachedMD5(original)
        assertNotNull(first)
        assertEquals(first, FileHelper.cachedMD5(original))
        val replacement = folder.newFile("replacement").apply { writeText("new") }
        Files.setLastModifiedTime(replacement.toPath(), Files.getLastModifiedTime(original.toPath()))
        Files.move(replacement.toPath(), original.toPath(), StandardCopyOption.REPLACE_EXISTING)
        assertNotEquals(first, FileHelper.cachedMD5(original))
        assertEquals(FileHelper.md5(original), FileHelper.cachedMD5(original))
        assertTrue(original.delete())
        assertNull(FileHelper.cachedMD5(original))
    }
}
