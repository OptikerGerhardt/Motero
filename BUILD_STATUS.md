# Motero Build 303: geprüfter Stand

| Eigenschaft | Ergebnis |
|---|---|
| App / Paket | Motero / org.zotero.android.debug |
| Version | 1.0.0-303 / Code 303; Basis Build 302 |
| APK-Größe | 105615950 Bytes |
| APK SHA-256 | 16ea5d9837c89f3121031077e403ade58cf7f9cad557593abcc8d7e5dfb4edfa |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | 85dcfaf338698821799f3710422887d0e00a8c9214239a3fd83a43258da65bcf |
| Reader-Tests | 258 bestanden, 0 Fehler/Abbruch/übersprungen |
| Native Tests | 89 bestanden in 20 Suiten, 0 Fehler/übersprungen |
| Neue Teilen-Regressionen | Sechs Fälle mit tatsächlichem ItemDetailsViewModel, eingeschalteter Thread-Prüfung und IO-Ereignissen: PDF, EPUB, fehlende Datei, Downloadfehler, fremde Bibliothek und Abbruch |
| Browser | Alle sieben Prüfungen bestanden: Funktionen, Gesten, Fits, Stabilität, Reader-Bedienelemente, Annotationswerkzeuge, Fit-Wiederherstellung/sichere Fensterfläche |
| Fit-Wiederherstellung | Echte Wrapped-Tipps nach Zoomknöpfen, Pinch im Seitenzwischenraum, Include/Exclude und explizites Off geprüft |
| Fuchs-Originalfälle | PDF-Seiten 6/100/201/206/207/208/301/411: vierseitiges Clipping, Navigation, Übersichtsrückkehr und Wiederöffnen |
| Bisherige Originalfälle | Höffe 26/27, 191/192; Kant 369/370, 380/381 und 133/134/140 erneut bestanden |
| Sicherer Lesebereich | Native Compose-Anbindung kompiliert; nur auf Geräten mit gemeldeter Displayaussparung reserviert, einschließlich gedrehter Aussparungen |
| Kamera-Simulation | 42 CSS-Pixel oberer Sicherheitsbereich, stabile Leistenwechsel und Hardware-Blättern in allen drei Scrollmodi geprüft |
| Rahmen und Scrollen | reading-layout.mjs, content-fit.mjs und hardware-navigation.mjs bytegleich zu Build 302 |
| Weitere Laufzeitdateien | 57 bytegleich zu Build 302, PDF.js vollständig unverändert |
| Quellenvergleich | 405 aktive native Dateien, 212 Reader-Dateien und 45 weitere Quell-Assets unverändert |
| SDK | PSPDFKit/Nutrient weiterhin vollständig abwesend |
| APK-Struktur | Identische APK-Dateinamen zur Basis; 7 DEX-Dateien; 14 eingebettete Reader-Quellen geprüft |
| Motero-M / Vollbild | Bestehende Symbolgeometrie, fünf Rasterdichten und Vollbild-Hooks erhalten und geprüft |
| Update | Gleiches Paket und Zertifikat, höherer Code, v2-Signatur, ZIP-CRC und 16-KiB-Ausrichtung geprüft |

Über die vorhandene Motero-Testversion installieren, vorher nicht deinstallieren. Speicherpfade, Realm-/Syncformat und Einstellungen bleiben erhalten. Ein echter Installationsvorgang mit Kontositzung am BOOX wurde hier nicht ausgeführt.

F29: Download-Ereignisse werden auf dem UI-Scope verarbeitet, damit Teilen und Fehlerzustände die unveränderte Main-Thread-Prüfung einhalten. Die JVM-Testkonfiguration schaltet ausschließlich künstliche Coroutine-Debug-Erweiterungen der Threadnamen aus; die Guard-Prüfung bleibt aktiv. Geteilt wird die Originaldatei, ohne zusätzliches Einbetten separat gespeicherter Zotero-Markierungen. FileProvider, MIME-Typen und temporäre Leseberechtigung bleiben erhalten. Empfang in einer zweiten Android-App muss am Gerät bestätigt werden.

F28: Der an der Fuchs-PDF konkret nachgestellte Verlust des Fit-Zustands nach Herauszoomen/Wrapped ist behoben. Eigene Skalierungsereignisse überschreiben den gemerkten Fit nicht mehr als manuelle Ansicht; Pinch-Gesten im äußeren Seitenzwischenraum erhalten ebenfalls ihren Ausgangszustand. Explizites Off verwirft ihn. Die genaue ursprüngliche sporadische Gerätefolge war nicht vollständig reproduzierbar; unbekannte Varianten sind bei der Geräteprüfung weiter zu beobachten. Rahmen-/Paritäts-/Fußnotenlogik wurde hierfür nicht verändert.

F27: Bei gemeldeter Displayaussparung liegt die tatsächliche WebView-Lesefläche außerhalb der Aussparung und unter der theoretischen Statusleistenhöhe. Ohne Aussparung bleibt die bisherige volle Lesefläche erhalten. Der Abstand hängt nicht von der Sichtbarkeit der schwebenden Leisten ab. Fits und SmartScroll verwenden die echte sichere Fenstergröße; PDF-/Annotationskoordinaten bleiben erhalten. Eine physische Displaykamera wurde hier nicht getestet.

Die übrigen Funktionen behalten ihre Regressionen. F19/F22/F23 und optionale Stifterweiterungen bleiben offen und anschlussfähig. Keine neue OCR, keine Änderung der Original-PDFs. Kein neuer Original-Mul-Test behauptet. Keine physische BOOX-/E-Ink-/Kontosyncprüfung und keine öffentliche Veröffentlichung.

Details: BUILD_BOOX.md, BUILD_VERIFICATION.json und qa/. SDK_REMOVAL.md bleibt die historische Dokumentation zu Build 300.
