# Motero Build 298: Prüfungen

reader-final-tests.log: 240 Reader-Tests ohne Fehler/Abbruch/übersprungen. Neu: mehrzeilige und parity-spezifische Kopfzeilen, tiefere kleine Header, große echte Überschriften, erste Absätze und überlappende Schriftkästen.
reader-features.log: bisherige Funktionen, erstes Antippen nach Palette, Done, Bookmarks/Rotation, Wrapped und Lesekante.
reader-final-gestures.log: Finger/Stift, Scrollen, Pinch-Unterbrechung, PDF.js-Übergabe und Resize.
reader-fitting.log: vier Fits, alle Scrollmodi/Rotationen, mehrzeilige Header-Fixture, Fußnoten und originale Mul-PDF.
reader-stability.log: Seitenwechsel ohne sichtbare Zwischenposition, Eingabeabbruch, Löschen, Originalfarben und Themes, Modusschaltflächen als gleich breite Hälften mit zentrierten Symbolen und äußerem Rand-Touch, normale Typkonvertierung, Bookmarks und Bild-PDF.
native-tests/: aktuelle 73 Android-Tests als JUnit-XML. android-full-tests.log und android-packaging-final.log enthalten denselben erfolgreichen abschließenden Test-/APK-Lauf. Der Test-Task wurde ausdrücklich erneut ausgeführt.
apk-verification.log: Vergleich gegen Build 297, Update-Identität, v2-Signatur, 16-KiB-ZIP-Ausrichtung, neun Reader-Quellen/CSS, unveränderte Laufzeitdateien/PDF.js, zwei M-Vektoren und fünf Rasterdichten sowie unveränderter Rotverlauf/Hintergrund.

Keine physische BOOX-Prüfung. Vollbild-/Fensterfokussteuerung und native Hashtag-Ausrichtung sind kompiliert und am Code geprüft; deren Darstellung auf dem Zielgerät ist nicht verifiziert. Die neu erwähnte Problem-PDF wurde nicht bereitgestellt. Original-Mul-PDF und interne Screenshots sind nicht im Archiv. Keine echte Kontosynchronisation geprüft.
