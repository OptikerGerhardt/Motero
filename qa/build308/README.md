# Build 308 local checks

- 282 reader unit tests, 113 native tests in 26 suites, ten browser checks, and eleven publication/signing guard tests passed.
- The local APK uses the pinned private signer and contains all 93 current reader sources, the 207 pinned PDF.js files, and 45 runtime files. Its digest is in `local-apk-verification.json`; the CI-built GitHub APK has its own verification report and may have a different digest.
- Browser checks include real one-/two-finger input and overview entry in all three PDF scroll modes, touch crop-editor buttons at 360px width, crop persistence/rotation, EPUB font-size feedback and four EPUB flow/direction combinations.
- The private original Plessner PDF was checked on all 116 pages: complete body text and nineteen note-source labels retained, footer/rule excluded, raster cache bounded. The PDF is not included in Git or release artifacts.
- New Kant margin and publisher-watermark cases use synthetic tests. The specific originals visible in the latest screenshots were not provided.
- Physical-device testing of these new reader changes and live-account synchronization are separate. The user reported successful installation of Build 307 on a Pixel 8 with GrapheneOS; BOOX confirmation remains pending.
- Publication additionally requires successful API 31 and 35 emulator migration/security checks in the GitHub release job.
