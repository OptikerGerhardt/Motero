# Motero Build 296: geprüfter Stand

Alle folgenden Ergebnisse beziehen sich auf die ausgelieferte APK.

| Eigenschaft | Ergebnis |
|---|---|
| Name | Motero |
| Paket | org.zotero.android.debug |
| Version | 1.0.0-296 / Code 296 |
| Vorgänger | Build 295 |
| APK-Größe | 203708948 Bytes |
| APK SHA-256 | 91f63c37dd267537084cdc6b894fa8cba4f28b7b506ec82e86be6e553cef2bfe |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | 6bbfa312891bd93eba3784a879e45bd0fd112ae8c72ef6c122c191819182a7d3 |
| Reader-Tests | 229 bestanden, 0 Fehler/Abbrüche/übersprungen |
| Native Tests | 73 bestanden, 0 übersprungen |
| Browser | Fit-Prüfung einschließlich Original-Mul, Gesten und bisherige Funktionen bestanden |
| Eingebettete Quellen | 9 direkt gegen die getesteten Quellen geprüft |
| Weitere Laufzeitdateien | 88 bytegleich zur bisherigen APK |
| PDF.js | Vollständig bytegleich zur bisherigen APK |
| APK-Dateinamen | Identisch zur bisherigen APK; 8 DEX-Dateien |
| Update | Gleiche Paketkennung und gleicher Signierer, Versionscode erhöht, v2-Signatur geprüft |
| Ausrichtung | ZIP-Ausrichtung einschließlich 16-KiB-Nativbibliotheken geprüft |

Vier Fit-Modi, Papier-/Inhaltsbezug und Ränder sind umgesetzt. Gerade/ungerade Seiten werden getrennt ausgerichtet. Fußnoten bleiben Inhalt; eindeutig erkannte Metadaten werden bei der Inhaltsbestimmung ausgeschlossen. Die dokumentierte heuristische Erkennung kann mehrdeutige Randtexte erhalten. Die Mul-Prüfung weist auf PDF-Seite 250 und 251 den Textbeginn bei 10,44 % der Seitenhöhe nach, statt den Kopf bei etwa 6,7 % einzubeziehen. Die horizontale Ausrichtung passt sich getrennt an beide Seiten an.

Browserprüfungen decken alle drei Scrollmodi, alle vier Rotationen, echtes Touch-Markieren mit aktiven drei Fits, Farbpalette, ersten Annotationstipp und Wrapped-Rückkehr ab. Neu besuchte Seiten mit breiter Tabelle, tiefer Fußnote, anderem Format und leere Seiten werden geprüft. Ausstehende Fit-Anfragen geben neuen Benutzereingaben Vorrang.

Kein physischer BOOX ist angeschlossen. Native Darstellung, tatsächliche Installation/Login am Zielgerät, E-Ink-Wirkung, echte Pinch-Skalenänderung auf dem Gerät und Kontosynchronisation sind hier nicht geprüft. Bookmarks relativ zum Inhaltsausschnitt, manueller Zuschnitt und Randtippen in allen Modi bleiben offen.

Die ByteBuddy-Vorabladung betrifft ausschließlich die native Test-JVM. Ein Fehler im inkrementellen DEX-Zwischenspeicher wurde durch Entfernen der erzeugten Projekt-DEX-Ausgaben behoben; der anschließende APK-Bau und die Signatur-/Inhaltsprüfung bestanden. Quellcode oder Bibliotheken wurden dafür nicht abgeschwächt.

Details: BUILD_BOOX.md, BUILD_VERIFICATION.json und qa/.
