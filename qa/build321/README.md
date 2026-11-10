# Motero 1.0.6 / Build 321 — local verification

378 reader tests, 43 additional PDF.js pixel cases, 144 Android tests in 35 suites and all 18 Chromium suites pass. Android release APK compilation, TypeScript checking, five engine-integrity tests, publication/build-reuse tests and production-key/receiver guards pass.

New real-touch suites cover existing PDF highlight/underline/area/note editing with Undo, EPUB direct highlighting with the shared palette, EPUB range resizing/note re-anchoring with Undo, repeated upper-right bookmark toggling, actual phone margins and stable center-tap/focus-return positions in paginated/scrolled layouts. Existing crop, manual crop, SmartScroll/Jumped, stylus, dock/theme and PDF.js regressions remain included.

The unsigned local APK contains 104 current reader sources, 207 unchanged PDF.js files and 45 unchanged runtime files. The production signing key is available only to the protected GitHub release job. Signed API 31/35 updates, source/archive checks and independent public download verification are pending that job; no publication success is claimed here yet.

Physical BOOX/GrapheneOS input, native animation appearance, device-specific WebViews and live Zotero account synchronization are separate checks. No complete personal-PDF or physical-device pass is claimed.
