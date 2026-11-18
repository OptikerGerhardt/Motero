package org.zotero.android.helpers

import timber.log.Timber
import java.io.File
import java.io.InputStream
import java.nio.file.Files
import java.nio.file.attribute.BasicFileAttributes
import java.nio.file.attribute.FileTime
import java.security.DigestInputStream
import java.security.MessageDigest
import kotlin.io.encoding.Base64

object FileHelper {
    fun readFileToString(file: File): String {
        return file.readText(Charsets.UTF_8)
    }

    fun deleteFolder(directory: File) {
        if (directory.exists() && directory.isDirectory) {
            directory.deleteRecursively()
        }
    }

    fun toByteArray(str: String): ByteArray {
        return str.toByteArray(Charsets.UTF_8)
    }

    fun toByteArray(stream: InputStream): ByteArray {
        return stream.use { it.readBytes() }
    }

    fun readFileToByteArray(file: File): ByteArray {
        return file.readBytes()
    }

    fun toString(inputStream: InputStream): String {
        return inputStream.bufferedReader(Charsets.UTF_8).use { reader ->
            reader.readText()
        }
    }

    fun copyInputStreamToFile(inputStream: InputStream, file: File) {
        file.outputStream().use { fileOut ->
            inputStream.copyTo(fileOut)
        }
    }

    fun copyFile(sourceFile: File, targetFile: File) {
        sourceFile.copyTo(targetFile, overwrite = true)
    }

    fun write(file: File, text: String) {
        file.writeText(text, Charsets.UTF_8)
    }

    fun writeByteArrayToFile(file: File, byteArray: ByteArray) {
        file.writeBytes(byteArray)
    }

    fun md5(inputStream: InputStream): String {
        val md5 = DigestInputStream(inputStream, MessageDigest.getInstance("MD5")).use { input ->
            val buffer = ByteArray(1024 * 1024)
            var read = 0
            while (read != -1) {
                read = input.read(buffer)
            }
            input.messageDigest.digest().joinToString("") { "%02x".format(it) }
        }
        return md5
    }

    fun encodeBase64(bytes: ByteArray): ByteArray {
        return Base64.encodeToByteArray(bytes)
    }

    fun decodeBase64(bytes: ByteArray): ByteArray {
        return Base64.decode(bytes)
    }

    private data class FileStamp(val modified: FileTime, val size: Long, val key: Any?)
    private data class CachedDigest(val stamp: FileStamp, val digest: String)
    private val digests = LinkedHashMap<String, CachedDigest>(64, .75f, true)
    private const val MAX_DIGESTS = 512

    private fun stamp(file: File): FileStamp? {
        val attrs = Files.readAttributes(file.toPath(), BasicFileAttributes::class.java)
        return if (attrs.isRegularFile) FileStamp(attrs.lastModifiedTime(), attrs.size(), attrs.fileKey()) else null
    }

    fun cachedMD5(file: File): String? {
        val key = file.absolutePath
        return try {
            // A concurrent atomic replacement must not cache the old digest for the new file.
            repeat(2) {
                val before = stamp(file) ?: return null
                synchronized(digests) { digests[key]?.takeIf { it.stamp == before }?.let { return it.digest } }
                val digest = md5(file)
                if (stamp(file) == before) {
                    synchronized(digests) {
                        digests[key] = CachedDigest(before, digest)
                        if (digests.size > MAX_DIGESTS) digests.remove(digests.entries.first().key)
                    }
                    return digest
                }
            }
            synchronized(digests) { digests.remove(key) }
            null
        } catch (e: java.io.IOException) {
            synchronized(digests) { digests.remove(key) }
            Timber.d(e, "Unable to verify attachment checksum")
            null
        } catch (e: SecurityException) {
            synchronized(digests) { digests.remove(key) }
            Timber.d(e, "Unable to read attachment checksum")
            null
        }
    }

    fun md5(file: File): String = file.inputStream().use(::md5)


}