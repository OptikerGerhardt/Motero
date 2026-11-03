# Motero Build 302: geprüfter Stand

| Eigenschaft | Ergebnis |
|---|---|
| App / Paket | Motero / org.zotero.android.debug |
| Version | 1.0.0-302 / Code 302; Basis Build 301 |
| APK-Größe | 105615050 Bytes |
| APK SHA-256 | ef83a50cb8f58b2a7725252ee3cfa80083c73d3ffc92794c496068e147d0256d |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | 79428fde1b43ebc314dc1c4d1803e9a9c8dfaa84d402dace62103e4dae072f0f |
| Reader-Tests | 258 bestanden, 0 Fehler, 0 übersprungen |
| Native Tests | 83 bestanden, 0 Fehler, 0 übersprungen; 19 Suiten |
| Browser | Alle sechs Prüfungen bestanden: Funktionen, Gesten, Fits, Stabilität, Reader-Bedienelemente, neue Annotationswerkzeuge |
| Neue Annotationsfälle | Satzende in Text und Geometrie, tatsächliche Lupenpixel mit Auswahl, gleich breite Palettendrittel, reguläres Löschen, langer Druck in beiden Auswahlmodi, Notizfarben/Bewegung, Mehrfinger-Abbruch |
| Teilen | MIME-Typen und Intent mit Datei-URI, ClipData und ausschließlich temporärer Leseberechtigung geprüft; native Integration kompiliert |
| Aussparungsfläche | Deckender Material-Hintergrund vor Inset-Polsterung einschließlich Displayaussparung; Quellprüfung und Kompilierung |
| Original-PDF-Fälle | Höffe 26/27, 191/192; Kant 369/370, 380/381 und römische Referenzen 133/134/140 erneut bestanden |
| Bestehende Fits | Zuschnitt-, Randreferenz- und PDF.js-Quellen unverändert zu Build 301; Regressionen bestanden |
| Weitere Laufzeitdateien | 57 bytegleich zu Build 301, PDF.js vollständig unverändert |
| Quellenvergleich | 406 aktive native Dateien, 206 Reader-Dateien und 45 weitere Quell-Assets unverändert |
| SDK | PSPDFKit/Nutrient bleibt vollständig abwesend; keine Herstellerklassen, -Bibliotheken oder Manifest-Komponenten |
| APK-Struktur | Identische APK-Dateinamen zur Basis; 7 DEX-Dateien; 14 eingebettete Reader-Quellen geprüft |
| Motero-M / Vollbild | Vektorgeometrie, fünf Rasterdichten und Vollbild-Hooks geprüft und erhalten |
| Update | Gleiches Paket und Zertifikat, höherer Code, v2-Signatur und 16-KiB-ZIP-Ausrichtung geprüft |

Die APK ist technisch als Update derselben App geprüft. Über die bestehende Motero-Testversion installieren, vorher nicht deinstallieren. Speicherpfade, Realm-/Syncformat und gespeicherte Einstellungen bleiben erhalten. Ein echter Installationsvorgang mit Kontositzung auf dem BOOX wurde hier nicht ausgeführt.

Direktes Wortmarkieren schließt angehängte Schlusszeichen ein, ohne echte Leerzeichen oder andere Textflüsse zu überschreiten. Die Lupe kopiert den bereits gerenderten Canvas. Die Palette verwendet drei volle gleich breite Touchflächen: Highlight, Löschen, Underline. Das Löschen und die Farbänderung verwenden den vorhandenen Annotationsmanager. Langer Druck öffnet die Schnellpalette auch im Android-Auswahlmodus; bestehende native Größen-/Auswahlgriffe und Transformationen ausgewählter Objekte behalten Vorrang.

Share Document ist im langen Druck auf Dateianhänge der Eintragsdetails verfügbar und lädt fehlende Dateien über den bestehenden Downloader. Geteilt wird die gespeicherte Originaldatei. Separat gespeicherte Zotero-Annotationen werden nicht zusätzlich in die PDF eingebettet. Der Teilen-Endpunkt kann später einen erzeugten PDF-Export übernehmen. Ein tatsächliches Empfangen in einer zweiten Android-App wurde hier nicht getestet.

Das Annotationsfenster füllt seine obere Aussparungs-/Systemleistenfläche mit der aktuellen Material-Fläche, auch während des Ladens. Die physische Darstellung auf einem Gerät mit Notch sowie Androids Teilenansicht müssen am Gerät geprüft werden. Kein physischer BOOX-/E-Ink-/Kontosync-Test wird behauptet.

Fit-Referenzen, Margins, SmartScroll, Wrapped, Kommentare/Tags, Quick Tags, Bookmarks, Lesekante, Leisten und Vollbild behalten ihre bestehenden Prüfungen. F19/F22/F23 und optionale Stifterweiterungen bleiben offen und anschlussfähig. Keine neue OCR und keine Veränderung der Original-PDFs. Original-Mul liegt weiterhin nicht vor; dafür wird kein neuer konkreter Test behauptet. Unbekannte PDFs können für die heuristische Randerkennung mehrdeutig bleiben.

Details: BUILD_BOOX.md, BUILD_VERIFICATION.json und qa/. SDK_REMOVAL.md dokumentiert den historischen Build-300-Schritt. Keine öffentliche Veröffentlichung beauftragt.
