# Motero 1.1.2 / Build 328

- The filter download strip uses the same native FlexibleBottomAppBar as the collection actions, removing extra fixed height/padding while retaining navigation-bar insets.
- Native crop controls reserve status/navigation/cutout insets independently of whether the device has a notch. Reading PDFs stays edge-to-edge.
- The Stylus dialog fills its window, draws an opaque Zotero surface and manages its own system-bar contrast. The underlying PDF no longer occupies a strip below the settings. Existing Zotero rows, switches and typography are reused.
- Page Turning controls are inline in Reader Controls and retain their existing persisted values and view model.
- The pen palette uses the full available row; purple stays anchored and every remaining color can be scrolled into view. Color and size no longer compete for horizontal space. Size/eraser controls occupy the row below.
- In Jumped, a double tap can focus a recognized left/right column. SmartScroll and subsequent fitting preserve it; another double tap returns to the previous fit. Continuous and explicit manual crop frames retain their own navigation.
- During column reading, one bounded full-page raster replaces PDF.js viewport-dependent detail surfaces, preventing detail insertion after scrolling. The existing canvas-pixel limit remains unchanged; very large/high-DPI pages can therefore be less sharp than the optional detail canvas. Outside column reading, detail rendering is restored. PDF.js itself and its pinned files are unchanged.
- Continuous uses a 24 CSS-pixel background strip between reading units; pages within a spread retain their 12-pixel gutter.

Unit, native, browser, source/signature and Android API 31/35 update evidence is retained with the release. Synthetic two-column documents exercise double taps, SmartScroll, raster stability and all scroll layouts. The original reported two-column PDF was unavailable for direct reproduction. Physical BOOX/Pixel interactions have not been tested; screenshot-guided UI changes still need device verification. Live-account sync is separate.

Verification: 425 Reader cases, 158 native cases, all 23 local and CI browser suites, 43 engine pixel cases and 19 official viewer cases pass. The [protected workflow](https://github.com/OptikerGerhardt/Motero/actions/runs/43474721332) passes production signing and API 31/35 updates from 303 and signed 327 with data/UID retention and old-key refusal. The published APK, source archive, embedded sources and checksums were independently downloaded and verified. [Evidence](../qa/build328/README.md).
