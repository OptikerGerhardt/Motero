# Motero 1.1.1 / Build 327 verification

[Motero 1.1.1](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.1.1-327) is published; the [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43391083194) passes. Application source: `f4a7e6c48ae370d608decbcc99daf16ef9252185`; unchanged Reader: `9a5947fff4d44095a948dd9c0381bbbf07a99060`. Subsequent documentation commits retain immutable tags/assets.

157 native cases in 38 suites, 421 Reader cases in 49 files, all 23 CI browser gates, 43 PDF.js pixel cases and 19 official viewer cases pass. Local native release build, Reader Controls and UI consistency browser gates also pass. ReaderExitTest uses a real enabled Android Back callback: system Back remains consumed before and after explicit Reader exit, while explicit exit pops the controller. The second regression covers an absent dispatcher.

The independently downloaded APK SHA-256 is `786dd8e8fba192fe2fa4a174cb3001027d4b81e8bf73f6934f046ddf7cdcee21`. Private Motero signer, restricted rotation, receiver namespace, Android 9+ and non-debuggable manifest pass. 114 main-bundle and 117 unique Reader sources including worker maps match the release checkout; all 207 engine, 45 runtime and 9515 source-snapshot files and release checksums were verified. PDF.js remains 5.7.330.

Both API 31/35 emulator gates pass: original 303 and signed 326 update to 327 while preserving private markers/UID, starting the app and refusing old-key updates/internal permission access. Latest-release detection selects Build 327 with one APK. Anonymous access was not independently established because the managed proxy may supply credentials.

Physical BOOX/Pixel UI input and live-account sync remain separate checks. [Change and limits](../../docs/READER_327.md).
