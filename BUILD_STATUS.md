# Motero Build 298: geprüfter Stand

Ergebnisse beziehen sich auf die ausgelieferte APK.

| Eigenschaft | Ergebnis |
|---|---|
| Name | Motero |
| Paket | org.zotero.android.debug |
| Version | 1.0.0-298 / Code 298 |
| Vorgänger | Build 297 |
| APK-Größe | 197379462 Bytes |
| APK SHA-256 | 0c97a44df914b03c5d3f4fdf98ccdc17d5016b4000ac4bc864ac2cae1fb354c5 |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | e949c7fda80a4ccc60fa3c35066a4b080b79b49bb009e758fcdf68ed76e3d60e |
| Reader-Tests | 240 bestanden, 0 Fehler/Abbrüche/übersprungen |
| Native Tests | 73 bestanden, 0 Fehler/übersprungen |
| Browser | Funktionen, Gesten, Fits einschließlich Mul, neue Header-Fixture und Modushälften bestanden |
| Quellen | 9 eingebettete JS-Quellen geprüft, CSS bytegleich zum getesteten Build |
| Weitere Laufzeitdateien | 88 bytegleich zu Build 297 |
| PDF.js | Vollständig bytegleich zu Build 297 |
| APK-Dateinamen | Identisch; 8 DEX-Dateien |
| Motero-M | Beide Vektoren, fünf Rasterdichten und unveränderter Rotverlauf/Hintergrund geprüft |
| Update | Identisches Paket und Signierer, erhöhter Code, v2-Signatur und 16-KiB-ZIP-Ausrichtung geprüft |

PDF/HTML verwenden die vollständige Edge-to-Edge-Fläche ohne dauerhafte Systemleisten-Padding. Die Bars-Steuerung wird nach Compose-Commit, Fensterfokus und Resume mit der Toolbar synchronisiert, beim Verlassen des Readers wiederhergestellt. Sidebar-Abstand ist separat. Hashtag-Außenmittelpunkte liegen unter den Außenmittelpunkten der Highlight-Kreise, Touchhöhen bleiben 48 dp. Native Darstellung und echtes Vollbild auf BOOX sind hier nicht physisch geprüft.

Highlight/Underline sind als vollständige Palettenhälften mit zentrierten Originalsymbolen und Rand-Touchzielen im Browser geprüft. Das neue M verwendet die ursprünglichen Vektor-Farbverläufe; die Farb-/Hintergrund-Ressourcen sind bytegleich zum bisherigen Icon, nur die Buchstabengeometrie ist ersetzt. PNG-Pixel werden direkt gegen die gebauten Quellexporte verglichen.

Die obere Inhaltskante berücksichtigt mehrzeilige Header und eigene gerade/ungerade Muster. Große Überschriften und gewöhnliche erste Absätze bleiben erhalten; überlappende Schriftkästen gelten nicht als Weißraum. Die Mul-Prüfung erhält den Textbeginn bei 10,44 % der Seitenhöhe auf den geprüften PDF-Seiten 250/251. Fußnoten bleiben enthalten. Heuristik kann mehrdeutige Randtexte behalten; die neu erwähnte Problem-PDF wurde nicht bereitgestellt und ist nicht konkret geprüft.

Kein physischer BOOX oder echter Kontosync geprüft. Der vorhandene Debug-Schlüssel und die Paketkennung sind beibehalten. Fit verändert ausschließlich die Ansicht. Manuelles Cropping, Randtippen in allen Modi und Tag-Autocomplete bleiben offen. ByteBuddy-Vorabladung betrifft nur die Test-JVM. Native Änderungen werden regulär kompiliert; kein Smali-/DEX-Patching.

Details: BUILD_BOOX.md, BUILD_VERIFICATION.json und qa/.
