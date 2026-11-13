# Motero 1.1.1 / Build 327 verification

The targeted ReaderExitTest cases pass with an enabled Android Back callback and without a dispatcher. The full native suite, release APK and browser checks are being verified. The unchanged Reader passes 421 cases in 49 files; PDF.js remains pinned at 5.7.330.

The source change routes the explicit toolbar exit directly through the phone/tablet navigation controller. Existing protected system Back and dialog handling remain in place. The protected release workflow must pass production signing and API 31/35 updates from original 303 and preceding signed 326 before publication. Independent download/source/signature/checksum evidence is added after publication.

Physical BOOX/Pixel UI input and account sync remain separate checks. [Change and limits](../../docs/READER_327.md).
