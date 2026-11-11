# Motero 1.0.7 / Build 322 — local verification

382 reader tests, 43 PDF.js pixel cases, 145 Android tests in 35 suites and all 20 browser suites pass. TypeScript, final APK build, embedded-source verification, production signing guards and receiver-permission guards pass.

The new EPUB suite reproduces the old word-start swipe failure and verifies forward/reverse swipes, margin taps, swiping over annotations, and independent vertical margins in both EPUB flows. Touch-editing tests prepare stable target geometry and then inject a queued scroll during each hold; existing highlight/underline/area/note edits preserve IDs and Undo.

The resource gate uses a synthetic 96-page document. Compared with the independently downloaded Build 321 bundle, observed crop sample arrays decrease from 23,040,000 to 3,840,000 bytes in the final probe; resident JavaScript thumbnails decrease from 96 to 32. Repeated warm turns reuse unchanged layout. These are specific buffer/cache measurements, not total RAM or a BOOX latency promise. Both versions can emit the same upstream PDF.js link-layer cancellation warning, retained in the logs.

The unsigned local APK matches 104 reader sources, 207 unchanged PDF.js files and 45 unchanged runtime files. The protected CI job still needs to sign, verify API 31/35 updates from 303/321 and publish the immutable APK. Public download/source/signature verification is pending publication.

Physical BOOX/Pixel native input and animation appearance, device WebViews and live Zotero account sync remain separate checks. [Implementation and scope](../../docs/READER_322.md).
