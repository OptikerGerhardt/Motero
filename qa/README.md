# Motero Build 297: Prüfungen

reader-final-tests.log: 233 Reader-Tests, kein Fehler/Abbruch/übersprungen.
reader-features.log: bisherige Funktionen, erste Maus-/Touch-Auswahl nach Palette, Done, Bookmarks/Rotation, Wrapped, Lesekante 50 %.
reader-final-gestures.log: Finger/Stift, Scrollen, Pinch-Unterbrechung, PDF.js-Übergabe, Resize.
reader-fitting.log: vier Fits, drei Scrollmodi, vier Rotationen, Ränder, Fußnoten, breite Tabellen, andere Seitenformate und originale Mul-PDF.
reader-stability.log: RAF-Frames beim verzögerten Seitenwechsel, Eingabeabbruch, Löschen ohne Pointer-Release, erster Backdrop-Tipp, veralteter Fensterschluss, Originalpalette/Dark Mode, Highlight-Unterstreichen-Konvertierung samt Text/Tags/Kommentar, Inhalts-Bookmarks und schreibgeschützte Notiz, echte Bild-PDF mit null Textobjekten.
native-tests/: 73 Android-Tests als aktuelle JUnit-XML. android-full-tests.log und android-packaging-final.log enthalten dasselbe Protokoll des erfolgreichen Test-/APK-Laufs und des abschließenden Reader-Asset-Paketierlaufs.
apk-verification.log: direkter APK-Vergleich gegen Build 296, gleicher Signierer/Paket, erhöhter Code, v2-Signatur, 16-KiB-ZIP-Ausrichtung, Reader-Quellen/CSS und unveränderte sonstige Laufzeitpakete.

Original-Mul-PDF und interne Screenshots sind nicht im Quellarchiv. Keine physische BOOX-Installation oder Kontosynchronisation geprüft. Die Bild-PDF-Fixture ist synthetisch; beliebige schräge/verrauschte Scans und semantische Header/Footer ohne OCR bleiben Grenzen.
