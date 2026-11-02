# Motero Build 300: Prüfungen

| Datei | Nachweis |
|---|---|
| reader-build.log | Historischer Reader-Bau aus Build 299; dessen vollständiges Paket bleibt in Build 300 bytegleich |
| reader-final-tests.log | 250 Reader-Tests ohne Fehler, Abbruch oder übersprungene Tests |
| reader-features.log | Bestehende Reader-Funktionen, erstes Antippen nach Palette/Done, Bookmarks/Rotation, Wrapped und Lesekante |
| reader-final-gestures.log | Finger/Stift, Scrollen, Pinch-Unterbrechung, PDF.js-Übergabe und Resize |
| reader-fitting.log | Vier Fits, Scrollmodi/Rotationen, Kopfzeilen, Fußnoten und aktive Fits mit direktem Markieren |
| reader-stability.log | Vorbereitete Seitenwechsel, Eingabeabbruch, Löschen, Zotero-Farben/Themes, vollständig antippbare Palettenhälften, Typwechsel, Inhalts-Bookmarks und Bild-PDF |
| reader-controls.log | Drei Breitenbezüge, Randreferenzen, Leisten-Tipps und Original-Höffe-/Kant-PDFs |
| native-tests/ | 78 bestandene Android-Tests in 17 JUnit-Suiten; darin vier neue PdfEngineIndependenceTest-Fälle |
| android-full-tests.log | Erfolgreicher Test- und APK-Build mit tatsächlich ausgeführten JVM-Tests |
| android-packaging-final.log | Abschließender erfolgreicher Build nach Prüfung der unveränderten Netzwerk-Asset-Datei; unveränderte Tasks korrekt UP-TO-DATE |
| android-dependencies.log | Erfolgreich aufgelöster Runtime-Abhängigkeitsbaum ohne Hersteller-SDK |
| sdk-removal-audit.json | Quellenvergleich gegen Build 299: aktive native Pfade, Reader, Preferences und Laufzeitpakete |
| apk-verification.log | Vollständige APK-Prüfung gegen Build 299: Update-Identität, v2, ZIP-Ausrichtung, Reader-/Laufzeit-Bytegleichheit, SDK-Abwesenheit, ehemalige transitive Versionen und Motero-M |

Höffe wurde auf PDF-Seiten 26/27 und 191/192 geprüft, Kant auf 369/370 und 380/381. Die bereitgestellten PDFs und internen Browserbilder werden nicht im Quellarchiv verteilt. Keine neue Prüfung der nicht vorliegenden Original-Mul-Datei behauptet. Kein physischer BOOX und keine echte Kontosynchronisation geprüft.
