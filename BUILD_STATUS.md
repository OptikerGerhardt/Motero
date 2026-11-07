# Motero 305: Build und Prüfung

Stand: 7. November 2026. Die neue APK ist nativ gebaut und als Update von Build 304 technisch geprüft.

Umgesetzt sind F19 Tag-Vorschläge nach Nutzung in Dokument und Bibliothek, F22 manueller PDF-Zuschnitt für alle/ungerade/gerade Seiten und F23 Randtippen in allen drei PDF-Scrollmodi. Die bisherigen Build-304-Funktionen bleiben erhalten.

- 276 Reader-Tests und 109 native Tests in 25 Suiten bestanden; keine Fehler, Abbrüche oder übersprungenen Tests.
- Zehn Browserprüfungen bestanden: Gesten, Features, Fitting, Stabilität, Bedienelemente, Annotationswerkzeuge, Fit-Wiederherstellung, Reader-Update, manueller Zuschnitt und Randtippen.
- Tag-Tests prüfen Ranking, exakte vorhandene Namen, graue Ergänzung, Enter/Speichern, ausdrückliche Neuanlage, getrennte Auswahl, Cursor/Komposition, überholte Suchläufe, Datenbankbenachrichtigungen und aktive Einträge derselben Bibliothek. Alte Vorschläge verschwinden sofort bei neuer Eingabe. Zählung und Sortierung laufen im Hintergrund.
- Manueller Zuschnitt: echte Touch-Ziehgesten, All/Odd/Even, weitere passende Beispielseiten, aktuelle und nächste Seiten, Wiederöffnen, Abbrechen, 90/180/270-Grad-Drehungen und Rücksetzen auf Automatik geprüft. Native Tests prüfen Nutzdaten, lokale Speicherung, Bibliotheks-/Anhangstrennung und Abmelden.
- Randtippen: links/rechts in vertikalem, horizontalem und Wrapped-Modus; Bookmark-Erstellen/Löschen hat Vorrang. Langes Drücken und Wischen lösen kein zusätzliches Randblättern aus. Schreibgeschützte PDFs bleiben navigierbar. Bestehende Unit-Prüfungen für Links, Annotationen und Textauswahl bleiben bestanden.
- Original-Plessner: alle 116 Seiten und 19 Quellenlabels im Anmerkungsbereich erneut geprüft. Frühere Original-Kant-/Höffe-/Fuchs-/Mul-Dateien lagen nicht vor; deren vorhandene synthetische Regressionen wurden ausgeführt.
- EPUB: paginiert und gescrollt, LTR und RTL; Kapitelgrenzen, kurze Restabschnitte, Eingabesicherung und Bookmark-Speichern/Löschen bleiben geprüft.
- Update: Paket org.zotero.android.debug, Name Motero, Version 1.0.0-305, Code 305. Gleicher Signierer wie 304, v2-Signatur und ZIP-Ausrichtung geprüft.
- 57 weitere Laufzeitdateien und alle 207 PDF.js-Dateien sind bytegleich zu 304. Aktuelle Reader-Quellen und neue native Klassen sind in der APK nachgewiesen. PSPDFKit/Nutrient bleibt entfernt.

APK-SHA-256: e02785d5e093882133119d15657dc145e5f1bea43ca09433be5f821271bacc9e
Reader-SHA-256: f6040f78cc2d567c62db9b790c22f76fd9442d522aef9f21fe18da7e6fcff382
Zertifikat-SHA-256: c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299

Zuschnitt: PDF-Einstellungen → „Manueller Zuschnitt…“. Rahmen ändern, Seitenbereich wählen und übernehmen. PDF-Seite 1 zählt als ungerade. Zuschnitt ist lokal pro Bibliothek/Anhang; die PDF-Datei und Annotationskoordinaten werden nicht verändert. „Automatisch“ löscht alle manuellen Rahmen.

Nachweise: BUILD_VERIFICATION.json und qa/build305/. android-final-packaging.log dokumentiert denselben letzten Aufruf mit erfolgreichen nativen Tests und assembleDevDebug; danach wurde kein Produktcode mehr geändert.

Nicht durchgeführt: physischer BOOX-/Smartphone-Test, echte BOOX-Tastaturprüfung, tatsächliche Update-Installation, native visuelle Prüfung und Kontosynchronisation. Der Paket-/Signaturvergleich belegt die technische Update-Identität. Dieser Bericht dokumentiert die lokale APK-Prüfung; die private GitHub-Bereitstellung und der Release-Ablauf sind in README.md beschrieben.
