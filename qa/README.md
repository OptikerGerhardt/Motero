# Motero Build 303: Prüfungen

| Datei | Nachweis |
|---|---|
| reader-build.log | Erfolgreicher Android-Reader-Bau, PDF.js unverändert |
| reader-final-tests.log | 258 Reader-Tests ohne Fehler, Abbruch oder übersprungene Tests |
| reader-features.log | Markieren, Palette, Done, Bookmarks/Rotation, Wrapped und Lesekante |
| reader-final-gestures.log | Finger/Stift, Scrollen, Pinch-Unterbrechung, PDF.js-Übergabe, Resize und Schlusszeichen |
| reader-fitting.log | Vier Fits, Scrollmodi/Rotationen, Kopfzeilen/Fußnoten und aktiver Fit beim Markieren |
| reader-stability.log | Vorbereitete Seitenwechsel, Löschen, Originalfarben/Themes, drei Palettenbereiche, Typwechsel, Bookmarks, Bild-PDF |
| reader-controls.log | Original-Kant/Höffe-Fälle, römische Folios, Include/Exclude, Fußnoten, Nachbarseiten und Drehungen |
| reader-annotation-tools.log | Satzende/Geometrie, tatsächliche Lupenpixel mit Auswahl, drei Touchdrittel, Löschen, langer Druck, Notizbewegung und Mehrfinger-Abbruch |
| reader-fit-recovery.log | Echte Wrapped-Tipps nach Zoomknöpfen, Gutter-Pinch, Off, simulierte sichere obere Fläche, Leisten/Hardware-Blättern, Original-Fuchs und Wiederöffnen |
| reader-fit-recovery-baseline.log | Vorheriger Fehler an Build 302: nach Zoomknöpfen kehrt nur der Maßstab zurück, active=false und clip leer; diagnostischer Ausgangsnachweis |
| native-tests/ | 89 bestandene Android-Tests in 20 Suiten; sechs neue echte Main-Thread-Collector-Fälle und bisherige MIME-/Intent-/Leseberechtigungsfälle |
| android-full-tests.log / android-packaging-final.log | Abschließender erfolgreicher APK-Bau; die bereits bestandenen Tests desselben Quellstands werden UP-TO-DATE wiederverwendet; aktuelle JUnit-Berichte liegen vollständig bei |
| android-dependencies.log | Erfolgreicher aufgelöster Runtime-Abhängigkeitsbaum ohne PSPDFKit/Nutrient |
| sdk-removal-audit.json | Vergleich gegen Build 302, begrenzt auf die geprüften Reader-/Viewport-Änderungen, Datenformate und Signierschlüssel erhalten |
| apk-verification.log / update-verification.log | Paket/Signatur/Versionsanstieg, v2, ZIP-CRC/-Ausrichtung, 14 eingebettete Quellen, unveränderte Rahmen-/Scrollgeometrie/PDF.js, SDK-Freiheit und alle Regressionsnachweise |

JVM-Tests halten Threadnamen stabil (kotlinx.coroutines.debug=off), damit der weiterhin aktivierte Main-Thread-Guard nicht künstliche Coroutine-IDs als unterschiedliche Threads wertet. Die neuen Sharing-Fälle verwenden das reale ViewModel und IO-Ereignisse, ohne seine Thread-Prüfung zu deaktivieren.

Interne Browserbilder dienten der visuellen Prüfung. Bilder und Original-PDFs sind nicht im Quellarchiv enthalten. Die sichere obere Fläche wird im Browser simuliert; die native Anbindung ist kompiliert. Kein physischer Kameraausschnitt, kein Empfang in einer zweiten Android-App, kein echter Kontosync, kein BOOX-/E-Ink-Test. Der nachgestellte Fit-Zustandsfehler ist abgedeckt; die ursprüngliche freie sporadische Gerätefolge bleibt nicht vollständig rekonstruiert. Kein neuer Original-Mul-Test behauptet.
