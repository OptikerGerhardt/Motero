# Änderungen

## 1.0.0-307 — 7. November 2026

- Update-Konflikt beim Wechsel vom öffentlichen Testschlüssel zum privaten Motero-Schlüssel behoben: eigene neue Receiver-Berechtigung statt erneuter Deklaration der alten Signaturberechtigung.
- AndroidX-Receiver prüfen dieselbe neue Berechtigung auch auf Android 9–12. Der alte Schlüssel erhält weiterhin keine Signaturberechtigungs- oder Rollback-Rechte.
- APK-Prüfung kontrolliert gemeinsam Manifest, Schutzstufe und tatsächliche AndroidX-Strings im DEX-Code.
- Veröffentlichung setzt jetzt echte Android-Updateprüfungen auf API 31 und 35 voraus: ursprüngliches 303 installieren, 306-Konflikt reproduzieren, Update samt privatem Testdatensatz/UID prüfen und Updates/Berechtigungszugriff mit dem alten Schlüssel zurückweisen.
- 109 native Tests und sieben Veröffentlichungs-/Signierprüfungen lokal bestanden. Physische Bestätigung auf GrapheneOS/BOOX steht aus.

## 1.0.0-306 — 7. November 2026

- Öffentliche Variante mit privatem Motero-Signierer, V3-Zertifikatsrotation, Android 9+ und deaktiviertem Debugging/Crash-Reporting; alter Testschlüssel ohne Rollback-Recht.
- GitHub baut ohne Signiersecret, prüft Quellen und veröffentlicht nur nach geschützter Signierung. Fehlende oder falsche Schlüssel stoppen den Release.
- Alte Test-Releases als private Entwürfe archiviert und das alte CI-Test-APK-Artefakt entfernt.
- Historie und Release-Anhänge auf bekannte Geheimnisse/persönliche Dateien geprüft; wiederholbare Veröffentlichungskontrolle ergänzt.
- ChatGPT-/Codex-Unterstützung offengelegt, übernommene Original-PRs eingeordnet und Zotero/Community ausdrücklich gewürdigt.
- Private GitHub-Signierung eingerichtet und Build 306 erfolgreich veröffentlicht; heruntergeladene APK erneut geprüft. 276 Reader-Tests, 109 native Tests, zehn Browserprüfungen und fünf Veröffentlichungs-/Signierprüfungen bestanden. Physischer Update-Test steht noch aus.

## 1.0.0-305 — 7. November 2026

- Tag-Vorschläge nach Häufigkeit im Dokument und in der Bibliothek; graue Ergänzung, einheitliches Bestätigen und ausdrückliche Neuanlage.
- Manueller PDF-Zuschnitt für alle, ungerade und gerade Seiten mit lokaler Speicherung pro Anhang.
- Randtippen in vertikalem, horizontalem und Wrapped-PDF-Modus; Bookmark-, Annotations- und Gestenvorrang bleiben erhalten.
- 276 Reader-Tests, 109 Android-Tests und zehn Browserprüfungen bestanden.
- Vollständigen Android-/Reader-Quellstand und nachvollziehbare Commits nach GitHub übernommen; Build-/Release-Workflow und Fork-Dokumentation vorbereitet.

## 1.0.0-304 — 6. November 2026

- Isolierte Footer samt Trennlinie erkennen, ohne Anmerkungen zu verlieren.
- Vollständigen Annotationstext per Tipp kopieren.
- EPUB-Restabschnitte und Kapitelgrenzen beim Blättern korrekt erreichen.
- Bookmarks durch erneutes Tippen entfernen.
- Aktuelle und beide Nachbarseiten gemeinsam für den Zuschnitt vorbereiten.
- Nach Fingerzoom zum gewählten Fit zurückkehren; vorübergehendes Verschieben bleibt möglich.

Ältere Funktionen und Prüfnachweise stehen in `FEATUREPLAN.md` und `qa/`. Physische Geräte- und echte Kontosync-Tests sind gesondert zu betrachten.
