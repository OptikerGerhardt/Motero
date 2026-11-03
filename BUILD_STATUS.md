# Motero Build 301: geprüfter Stand

| Eigenschaft | Ergebnis |
|---|---|
| App / Paket | Motero / org.zotero.android.debug |
| Version | 1.0.0-301 / Code 301; Basis Build 300 |
| APK-Größe | 105604242 Bytes |
| APK SHA-256 | f0932633f30617e994af643f5708c192f9f44c44e605d217a8e95e48bb4c9d13 |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | ad8bdc829dc23c71c45190455341f6254ff4aff939cd5207f5bec1c242da9dd1 |
| Reader-Tests | 254 bestanden, 0 Fehler, 0 übersprungen |
| Native Tests | 81 bestanden, 0 Fehler, 0 übersprungen; 18 Suiten |
| Browser | Funktionen, Gesten, Fits, Stabilität und erweiterte Reader-Bedienelemente bestanden |
| Neue Originalfälle | Kant-PDF-Seiten 133/134/140: BXLI, B XLII, B XLIX, B L |
| Bisherige Originalfälle | Höffe 26/27, 191/192; Kant 369/370, 380/381 |
| Römische Referenzen | Include/Exclude, beide Fußnoten der Screenshot-Seite, Nachbarseiten, drei Scrollmodi, Content/Width/Height und vier Drehungen geprüft |
| Adaptive Knopftexte | Drei neue JVM-Fälle; volle/kurze Labels, exakte Breitenbegrenzung und unterscheidbare lokalisierte Initialen |
| Native Knopfdarstellung | Regulär kompiliert; kein visueller Test am physischen BOOX |
| Weitere Laufzeitdateien | 57 bytegleich zu Build 300, PDF.js vollständig unverändert |
| Quellenvergleich | 405 aktive native Dateien, 210 Reader-Dateien und 45 weitere Quell-Assets unverändert |
| SDK | PSPDFKit/Nutrient bleibt vollständig abwesend; keine Herstellerklassen, -Bibliotheken oder Manifest-Komponenten |
| APK-Struktur | Identische APK-Dateinamen zur Basis; 7 DEX-Dateien |
| Motero-M / Vollbild | Vektorgeometrie und fünf Rasterdichten sowie Vollbild-Hooks geprüft und erhalten |
| Update | Gleiches Paket und Zertifikat, höherer Code, v2-Signatur und 16-KiB-ZIP-Ausrichtung geprüft |

Die neue APK ist technisch als Update derselben App geprüft. Vorher nicht deinstallieren. Speicherpfade, Realm-/Syncformat und gespeicherte Einstellungen bleiben erhalten. Ein echter Installationsvorgang mit Kontositzung auf dem BOOX wurde hier nicht ausgeführt.

Die A-/B-Erkennung berücksichtigt nun kanonische römische Folioangaben. Die konkrete Referenz BXLI auf PDF-Seite 133 wird separat gehalten und bei Exclude verdeckt. Gemeinsame OCR-Objekte mit B XLII, B XLIX und B L werden anhand der Zeichenposition und Grundlinie getrennt. Fußnoten und gewöhnlicher Inhalt bleiben erhalten. Bereits analysierte Nachbarseiten verwenden die gleiche Einstellung aus dem vorhandenen begrenzten Seitencache. Include entfernt die Anzeige-Masken wieder.

Ansichtsknöpfe messen ihre volle Beschriftung mit der aktuellen Schrift und verfügbarem Platz einschließlich Häkchen. Nur bei Platzmangel wird die kurze Form gewählt; alle Labels bleiben einzeilig. Die volle Beschriftung bleibt als Bedienungshilfe vorhanden, die Mindest-Touchhöhe beträgt weiterhin 48 dp. Bei extrem knapper Breite weicht das Häkchen dem Text; Auswahlfarbe und semantischer Zustand bleiben bestehen. Dieser native Layoutpfad ist kompiliert und am Code geprüft; eine physische BOOX-Darstellung wird nicht behauptet.

Fit-Referenzen, Margins, SmartScroll, Wrapped, direkte Markierungen, Palette und Typwechsel, Kommentare/Tags, Quick Tags, Bookmarks, Lesekante, Leisten und Vollbild behalten ihre bestehenden Prüfungen. F19/F22/F23 und optionale Stifterweiterungen bleiben offen und anschlussfähig. Keine neue OCR oder Änderung der PDF-Dateien. Original-Mul liegt weiterhin nicht vor; dafür wird kein neuer konkreter Test behauptet. Unbekannte PDFs können für die heuristische Randerkennung mehrdeutig bleiben.

Details: BUILD_BOOX.md, BUILD_VERIFICATION.json und qa/. Der in SDK_REMOVAL.md dokumentierte Build 300 bleibt der historische SDK-Entfernungsschritt. Keine öffentliche Veröffentlichung beauftragt. Kein physischer BOOX, echte E-Ink-Reaktion oder tatsächlicher Kontosync geprüft.
