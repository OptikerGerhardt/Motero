# Motero 1.0.4 / Build 319 verification

365 Reader unit tests and 15 Chromium suites passed locally. The stylus suite exercises real pen/palm input, barrel-button erasure, native edit undo/redo and retaining a stroke exactly once through focus loss. The 14 existing crop/navigation/bookmark/tool/appearance suites remain covered. 132 native release tests in 32 suites and the final APK build passed. The unsigned APK contains all 101 current reader sources, 207 pinned PDF.js files and 45 runtime files, independently compared before pushing the app commit.

Release publication requires the protected CI signing job and Android API 31/35 update/data/UID/old-key refusal gates, using signed Build 318 as the current baseline. Production-APK verification is recorded after downloading the published artifact.

Physical BOOX/InkSense/EMR/GrapheneOS input, E-Ink latency and live Zotero synchronization remain separate checks. No SDK-native BOOX renderer or hardware refresh is bundled; the preview driver/transaction interface remains gated. See [implementation and limits](../../docs/E_READER_AND_STYLUS.md).
