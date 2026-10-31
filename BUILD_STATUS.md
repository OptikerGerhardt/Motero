# Motero Build 299: geprüfter Stand

| Eigenschaft | Ergebnis |
|---|---|
| Name / Paket | Motero / org.zotero.android.debug |
| Version | 1.0.0-299 / Code 299 |
| Vorgänger | Build 298 |
| APK-Größe | 197392898 Bytes |
| APK SHA-256 | 11c6f3f64d891f11829bc5a20cdc5ff0177d751ee60c7b2f461361cc1b369dc3 |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | 70b48326c574f85535f393454f8d70c68d9de9df42ac35bda82e26aa5e181fd1 |
| Reader-Tests | 250 bestanden, 0 Fehler, 0 übersprungen |
| Native Tests | 74 bestanden, 0 Fehler, 0 übersprungen; 16 Suiten |
| Browser | Funktionen, Gesten, Fits, Stabilität und neue Reader-Bedienelemente bestanden |
| Konkrete PDFs | Höffe 26/27, 191/192; Kant 369/370, 380/381 |
| Eingebettete Quellen | 11 JS-Quellen geprüft; CSS bytegleich zum getesteten Reader-Build |
| Weitere Laufzeitdateien | 88 bytegleich zur Basis, einschließlich PSPDFKit |
| PDF.js | Vollständig bytegleich zur Basis |
| Paketstruktur | Identische APK-Dateinamen; 8 DEX-Dateien |
| Motero-M | Vektoren und alle fünf Rasterdichten gegenüber Build 298 erhalten |
| Update | Identisches Paket und Zertifikat, erhöhter Code, v2-Signatur und 16-KiB-ZIP-Ausrichtung geprüft |

Die APK lässt sich technisch als Update derselben Test-App zuordnen. Vorher nicht deinstallieren. Der bisherige Debug-Schlüssel und alle Speicherpfade bleiben erhalten; keine Datenmigration oder Änderung des Annotations-/Syncformats wurde eingeführt. Tatsächliche Installation und Kontositzung am BOOX wurden hier nicht geprüft.

Neu sind der undurchsichtige Sidebar-Kopf, der erste PDF-Tipp ausschließlich zum Ausblenden der Leisten und die dritte Breitenvariante Text + crop. Diese nutzt denselben Breitenzoom wie Text und bleibt bei langen Textseiten vertikal scrollbar; SmartScroll überspringt ausgeblendetes Papier. Zeilen-/Editionsreferenzen sind unabhängig von der Randgröße ein-/ausschließbar. Die Anzeige verdeckt bei Exclude auch teilweise in den Inhaltsrahmen ragende Referenzen unter den regulären Annotationen. Fußnoten und ihre Verweiszeichen bleiben Inhalt. Die Erkennung gerader/ungerader Seiten und Inhalts-Bookmarks bleiben erhalten.

In der Höffe-Datei wird der grafische Kopfstrich zusammen mit der erkannten Kopfzeilenhöhe entfernt, ohne den Textbeginn zu schneiden. Die neue obere Grenze beträgt auf den geprüften Seiten rund 9,76 % statt rund 4,83 %. Bei Kant werden separate und in OCR-Textobjekten angehängte Randreferenzen unterschieden; die Optionen wurden auf beiden Seitenparitäten geprüft. Die bereitgestellten PDFs wurden nicht verändert. Original-Mul liegt hier nicht erneut vor; ein neuer Original-Mul-Test wird nicht behauptet.

Alle vier Hauptfits, drei Scrollmodi, Drehungen, Wrapped-Auswahl, direktes Markieren, Farbpalette, Löschen, Bookmarks und der Bild-PDF-Fallback sind in den Browserprüfungen abgedeckt. Die neuen Prüfungen ergänzen kurze Tipps auf bestehende Markierungen, große Margins mit Referenzmasken, Höhenunabhängigkeit des Breitenzooms und die konkreten PDFs. Die Deckkraft der Lesekante bleibt 50 %.

PSPDFKit/Nutrient wurde ausdrücklich nicht entfernt; dies ist der nächste eigene Schritt im Featureplan. Kein physischer BOOX, echte E-Ink-Reaktion oder realer Android-/Desktop-Kontosync geprüft. Heuristische Randklassifikation kann bei unbekannten PDFs mehrdeutig bleiben.

Technische Details: BUILD_BOOX.md, BUILD_VERIFICATION.json und qa/ einschließlich der JUnit-Berichte. ByteBuddy wird ausschließlich für JVM-Tests vorgeladen. Native Änderungen sind regulär kompiliert; kein DEX-Patching.
