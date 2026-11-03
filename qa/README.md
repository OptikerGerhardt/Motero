# Motero Build 302: Prüfungen

| Datei | Nachweis |
|---|---|
| reader-build.log | Erfolgreicher Android-Reader-Bau mit unverändertem PDF.js |
| reader-final-tests.log | 258 Reader-Tests ohne Fehler, Abbruch oder übersprungene Tests |
| reader-features.log | Markieren, Palette, Done, Bookmarks/Rotation, Wrapped und Lesekante |
| reader-final-gestures.log | Finger/Stift, Scrollen, Pinch-Unterbrechung, PDF.js-Übergabe, Resize und Schlusszeichen |
| reader-fitting.log | Vier Fits, Scrollmodi/Rotationen, Kopfzeilen, Fußnoten und aktive Fits mit direktem Markieren |
| reader-stability.log | Vorbereitete Seitenwechsel, Löschen, Originalfarben/Themes, drei gleiche Palettenbereiche, Typwechsel, Bookmarks und Bild-PDF |
| reader-controls.log | Original-PDF-Fälle einschließlich Kant 133/134/140, römischer Folios, Include/Exclude, Fußnoten, Nachbarseiten, drei Scrollmodi/Fits und vier Drehungen |
| reader-annotation-tools.log | Satzende in Text/Geometrie, Lupeninhalt mit Auswahl, drei Touchdrittel, normales Löschen, langer Druck in beiden Auswahlmodi, Notizfarben/-bewegung und Mehrfinger-Abbruch |
| native-tests/ | 83 bestandene Android-Tests in 19 JUnit-Suiten, einschließlich DocumentSharingTest, adaptiver Labels und SDK-Unabhängigkeit |
| android-full-tests.log | Vollständiger erfolgreicher Android-Test- und APK-Build mit tatsächlich ausgeführten JVM-Tests |
| android-packaging-final.log | Erfolgreiche abschließende frische APK-Paketierung; bereits bestandene native Tests unverändert und UP-TO-DATE |
| android-dependencies.log | Aufgelöster Runtime-Abhängigkeitsbaum ohne PSPDFKit/Nutrient |
| sdk-removal-audit.json | Vergleich gegen Build 301, mit den geprüften Änderungen für Annotationswerkzeuge und Sharing |
| apk-verification.log / update-verification.log | Update-Identität, v2, ZIP-Ausrichtung, 14 eingebettete Quellen/CSS, unveränderte weitere Laufzeitdateien/PDF.js, SDK-Abwesenheit, Motero-M und neue Regressionsnachweise |

Interne Browserbilder wurden zur Prüfung von Lupe und Palette verwendet. Diese Bilder und die Original-PDFs sind nicht im Quellarchiv enthalten. Native Teilen-Integration und deckender Aussparungshintergrund sind kompiliert und am Code geprüft; MIME-Typen und temporärer Lesezugriff sind JVM-getestet. Keine physische Notch-Darstellung, kein Empfang in einer zweiten Android-App, kein echter Kontosync und kein E-Ink-Test. Kein neuer Original-Mul-Test behauptet.
