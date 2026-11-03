# Motero Build 301: Prüfungen

| Datei | Nachweis |
|---|---|
| reader-build.log | Erfolgreicher Android-Reader-Bau mit unverändertem PDF.js |
| reader-final-tests.log | 254 Reader-Tests ohne Fehler, Abbruch oder übersprungene Tests |
| reader-features.log | Markieren, Palette, Done, Bookmarks/Rotation, Wrapped und Lesekante |
| reader-final-gestures.log | Finger/Stift, Scrollen, Pinch-Unterbrechung, PDF.js-Übergabe und Resize |
| reader-fitting.log | Vier Fits, Scrollmodi/Rotationen, Kopfzeilen, Fußnoten und aktive Fits mit direktem Markieren |
| reader-stability.log | Vorbereitete Seitenwechsel, Löschen, Originalfarben/Themes, Palettenhälften, Typwechsel, Bookmarks und Bild-PDF |
| reader-controls.log | Bisherige Original-PDF-Fälle; neu Kant 133/134/140, römische Folios, Include/Exclude, Fußnoten, Nachbarseiten, drei Scrollmodi/Fits und vier Drehungen |
| native-tests/ | 81 bestandene Android-Tests in 18 JUnit-Suiten, darunter drei ReaderOptionLabelsTest-Fälle und vier SDK-Unabhängigkeitsfälle |
| android-full-tests.log / android-packaging-final.log | Derselbe erfolgreiche abschließende Test- und APK-Build mit tatsächlich ausgeführten JVM-Tests |
| android-dependencies.log | Aufgelöster Runtime-Abhängigkeitsbaum ohne PSPDFKit/Nutrient |
| sdk-removal-audit.json | Erneuter Vergleich gegen Build 300, mit nur den zwei geprüften Reader-Dateien und der nativen Beschriftungszeile als bestehenden Produktionsänderungen |
| apk-verification.log / update-verification.log | Update-Identität, v2, ZIP-Ausrichtung, eingebettete Quellen/CSS, unveränderte weitere Laufzeitdateien/PDF.js, SDK-Abwesenheit, Motero-M und neue Regressionsnachweise |

Interne Browserbilder bestätigen das Aus-/Einblenden von BXLI bei vollständigen Fußnoten auf der Screenshot-Seite. Diese Bilder und die Original-PDFs sind nicht im Quellarchiv enthalten. Die native Knopfdarstellung ist kompiliert und am Code geprüft, aber nicht auf einem physischen BOOX visuell getestet. Kein echter Kontosync oder E-Ink-Test. Kein neuer Original-Mul-Test behauptet.
