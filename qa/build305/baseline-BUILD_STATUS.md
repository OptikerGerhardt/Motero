# Motero 304: Build und Prüfung

Stand: 6. November 2026. Die neue APK ist erfolgreich nativ gebaut und als Update der bereitgestellten Version 303 technisch geprüft.

Umgesetzt sind Footer-Erkennung einschließlich Trennlinie, vollständiges Kopieren des Annotationstexts per Tipp, erreichbare EPUB-Restabschnitte beim Hardware-Blättern, Bookmark-Umschaltung, gemeinsam vorbereitete Zuschnitte der aktuellen und beiden Nachbarseiten sowie Rückkehr zum gewählten Fit nach Fingerzoom. Einfingriges Verschieben darf vorübergehend aktuelle Seitenränder zeigen; die Menüeinstellung bleibt gespeichert. Zoomknöpfe erhalten den Zugang zur Wrapped-Übersicht.

- 268 Reader-Tests bestanden; keine fehlgeschlagenen, abgebrochenen oder übersprungenen Tests.
- 91 native Tests in 21 Suiten bestanden; keine Fehler oder übersprungenen Tests. Zwei neue Clipboard-Tests prüfen vollständigen langen Unicode-Text und den Schutz des Clipboards bei leerem Text.
- Acht Browserprüfungen bestanden: Gesten, Features, Fitting, Stabilität, Bedienelemente, Annotationswerkzeuge, Fit-Wiederherstellung und Reader-Update.
- Original-Plessner-PDF: alle 116 Seiten und alle 19 Quellenlabels im Anmerkungsbereich geprüft. Fließtext und Anmerkungen bleiben erhalten. Die alten Original-Kant-/Höffe-/Fuchs-/Mul-Dateien lagen nicht vor; deren vorhandene synthetische Regressionen wurden ausgeführt.
- EPUB: paginiert und gescrollt, LTR und RTL; vorwärts/rückwärts über Kapitelgrenzen, letzte kurze Scrollabschnitte, Eingabesicherung und echte Bookmark-Tipps mit normalem Speichern/Löschen geprüft.
- Update: Paket org.zotero.android.debug, Name Motero, Code 304, Version 1.0.0-304. Gleiches Signierzertifikat wie 303; v2-Signatur und ZIP-Ausrichtung geprüft. Zertifikat-SHA-256: c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299.
- 57 weitere Laufzeitdateien und sämtliche 207 PDF.js-Dateien sind bytegleich zur Referenz-APK. Die APK enthält die frisch gebauten Reader-Quellen und die neue native Clipboard-Funktion. PSPDFKit/Nutrient bleibt entfernt.

APK-SHA-256: 95a7c6119f771a38084e3857eed7d7a2780aadf189b3784ace0daa0c206da07d
Reader-SHA-256: ae52b3fdce28654311063aadde1a4d3e273ad3386d1679bdd21a6e39e5876aca

Die letzte Reader-Absicherung wurde nach den nativen Tests erneut paketiert; die unveränderten nativen Kompilate wurden dabei UP-TO-DATE wiederverwendet. Einzelheiten: BUILD_VERIFICATION.json und qa/build304/.

Nicht durchgeführt: physischer BOOX-/Smartphone-Test, reale Lautstärketasten auf einem Gerät, visuelle native Clipboard-/Scroll-Prüfung, echte Update-Installation und Kontosynchronisation. Die vorbereitete lokale EPUB-Zustandswiederherstellung muss zusätzlich am Gerät erprobt werden. Paket-/Signaturvergleich belegt die technische Update-Identität, keine bereits erfolgte Geräteinstallation. Es wurde nichts auf GitHub veröffentlicht.
