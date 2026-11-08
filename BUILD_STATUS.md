# Build 311 — lokaler Prüfstand, 8. November 2026

Release-APK lokal gebaut. Bestanden: 303 Reader-Tests, 118 native Tests, zwölf Browser-Suites und elf Release-/Signierhelfer-Prüfungen. Die neuen Prüfungen decken Theme vor dem ersten HTML-Bild, korrekte Vorschau-Pixel, veraltete Render-Ergebnisse, Bookmark-Fähnchen/Undo, wiederverwendete Zeichenobjekte, persistente Geometrie sowie echte Chromium-Stifteingabe mit Abbruch und zweitem Pointer ab.

Nachweise: [qa/build311](qa/build311/README.md). Signierung und echte API-31/35-Updates von 303 und 310 werden vor Veröffentlichung von GitHub geprüft. Physische BOOX-/GrapheneOS- und Kontosync-Tests sind gesondert auszuweisen.

# Motero 308: Reader-Überarbeitung

**Veröffentlicht:** [Build 308](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-308). GitHub-Lauf [42413319376](https://github.com/OptikerGerhardt/Motero/actions/runs/42413319376) hat Build, 282 Reader-Tests, 113 native Tests in 26 Suiten, zehn Browserprüfungen sowie Veröffentlichungs-/Signierprüfungen erfolgreich abgeschlossen. Vor dem Release bestanden zusätzlich die echten Updateprüfungen auf Android API 31 und 35 mit privatem Testdatensatz, unveränderter UID, App-Start und Abweisung des alten Schlüssels.

Die tatsächlich hochgeladene APK wurde erneut heruntergeladen. Signatur, V3-Rotation, Receiver-Berechtigung, Android 9+, 93 aktuelle eingebettete Reader-Quellen, 207 unveränderte PDF.js-Dateien und 45 Runtime-Dateien sind geprüft. Ihre SHA-256 ist `31867947aa6784689ab0a34329a30bda703b8d840391a5909192f27d22b51f4e`; sie stimmt mit `SHA256SUMS.txt` und beiden Android-Migrationsberichten überein. Die anonyme GitHub-API bietet genau diese APK als neueste Version an. Nachweise: `BUILD_VERIFICATION.json` und `qa/build308/github-*.json`.

Der lokale Build bestand dieselben Reader-/Android-/Browserprüfungen sowie elf Veröffentlichungs-/Signierprüfungen. Seine separate SHA-256 steht in `qa/build308/local-apk-verification.json`. Ein anfänglich zu früher Zugriff im Browsertest auf die asynchrone Crop-Brückenmeldung ist durch explizites Warten korrigiert; zusätzlich mit 750 ms verzögerter Zustellung geprüft. Der Produktcode war davon unverändert.

Physische Bedienprüfungen für die neuen Reader-Funktionen und echter Kontosync stehen aus. Die erfolgreiche Installation von Build 307 auf Pixel 8/GrapheneOS wurde vom Nutzer bestätigt. Der historische Build-305-Nachweis liegt jetzt unter `qa/build305/BUILD_VERIFICATION.json`.

## Vorheriger Stand: Build 307

**Als GitHub-Release verfügbar:** [Build 307](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-307). Die tatsächlich veröffentlichte APK wurde erneut heruntergeladen und geprüft. Beide Android-Updateprüfungen auf API 31 und 35 sind erfolgreich: ursprünglichen 306-Konflikt reproduziert, 303 → 307 installiert, privaten Testdatensatz und UID erhalten, App gestartet, altsigniertes Update und Berechtigungsanfrage abgewiesen. Die SHA-256 der APK lautet `1bcc4e7a816a12f295b01b89ab29ae067d446dd46625d09ca2e859e34b7a805c`. Nachweise: `qa/build307/github-migration-api31.json`, `github-migration-api35.json` und `github-apk-verification.json`.

Der vollständige Build mit 276 Reader-Tests, 109 nativen Tests, zehn Browserprüfungen und sieben Veröffentlichungs-/Signierprüfungen bestand in Lauf 42397300252. Nach Reparatur der CI-Emulatorregistrierung wurde derselbe nachweislich unveränderte App-Build in Lauf 42407694627 signiert, auf beiden Android-Versionen geprüft und veröffentlicht. Die Quellen enthalten die aktualisierte Release-Infrastruktur; `github-build-provenance.json` bindet sie an den geprüften Build. Vier zusätzliche Wiederverwendungsprüfungen weisen geänderte App-/Reader-Quellen, fehlende Build-Erfolge und falsche Quellbindung zurück.

Die Meldung `failureConflict` wurde bei Updates von 303 auf 306 auf GrapheneOS/Pixel 8 und BOOX Go Color 7 beobachtet. Android prüft beim erneuten Deklarieren der bisherigen AndroidX-Signaturberechtigung die bewusst widerrufene `PERMISSION`-Fähigkeit des alten Schlüssels. Die kryptografische Signaturprüfung allein hatte diese Installationshürde nicht erkannt.

Build 307 verwendet eine neue eigene Receiver-Berechtigung. Ein gezielter AndroidX-Core-Transform stellt auch den Lookup auf Android 9–12 darauf um. Alte Schlüssel behalten keine Permission-/Rollback-Rechte. Die Release-APK-Prüfung kontrolliert Manifest, Schutzstufe und tatsächliche DEX-Strings gemeinsam.

Lokal bestanden: 109 native Tests in 25 Suiten und sieben Veröffentlichungs-/Signierprüfungen. APK-Signatur, Version 307, neue Berechtigung, Android 9+, V3-Rotation, ZIP-Ausrichtung sowie 45 Runtime-, 207 PDF.js- und 92 Reader-Quellen sind geprüft. Nachweise: `qa/build307/`.

Der lokale Android-15-/API-35-Emulator hat den ursprünglichen 306-Konflikt reproduziert und das korrigierte Update 303 → 307 erfolgreich installiert. Der private Testdatensatz und die App-UID blieben erhalten. Ein höher versioniertes Update mit dem alten öffentlichen Schlüssel wurde zurückgewiesen; ein anders benanntes, altsigniertes Testprogramm erhielt die neue interne Berechtigung nicht. Nachweis: `qa/build307/local-migration-api35.json`.

Der Release-Job installiert vor Veröffentlichung auf Android API 31 und 35 die originale 303-APK, reproduziert den 306-Konflikt, prüft Datenerhalt/UID beim korrigierten Update und weist Updates sowie interne Berechtigungsanfragen mit dem öffentlichen alten Schlüssel zurück. Physische Bestätigung des korrigierten Updates und echter Kontosync stehen noch aus.

---

## Historischer Stand Build 306

Stand: 7. November 2026. Lokaler nicht debuggbarer Release-Build mit privater Motero-Signierung erfolgreich. Paket `org.zotero.android.debug`, Version `1.0.0-306`, mindestens Android 9/API 28. Crash-/Event-Reporting ist in dieser Variante ausgeschaltet.

Die APK wurde mit `apksigner` für API 28, 32, 33 und 36 geprüft: neuer festgeschriebener Signierer, V3-Signatur, signierte Rotation vom alten Testschlüssel. Die alte Identität erhält nur Datenübernahme, keine Rollback-, Shared-UID-, Signature-Permission- oder Authenticator-Berechtigung. ZIP-Ausrichtung, 45 Runtime-Dateien, 207 PDF.js-Dateien und 92 aktuelle eingebettete Reader-Quellen sind geprüft.

Lokale APK-SHA-256: `020de010574fd67644f0f307d2c59bfc13c2b112e25bbc0f9548b7e4186b13fd`.
Neuer Zertifikat-SHA-256: `f6b9547e9644f44e23bcceac94ec32cfd6576b5f732af7e12094699307de778d`.

109 native Tests in 25 Suiten der Release-Variante und fünf Veröffentlichungs-/Signiertests bestanden. Signier-Negativtests prüfen fehlendes Secret, Verwendung des öffentlichen Testschlüssels und die Zurückweisung einer altsignierten APK. Veröffentlichungstests prüfen auch gelöschte Geheimnisse in der Historie, verschachtelte Archive und bytegenaue öffentliche Testschlüssel-Ausnahmen. Der GitHub-Workflow testet die native Release-Variante sowie Reader und Browser erneut.

Der private Schlüssel bleibt außerhalb von Git. Die einmalige Secret-Einrichtung durch den Besitzer und der automatische GitHub-Release sind erfolgreich abgeschlossen. 276 Reader-Tests, 109 native Release-Tests, zehn Browserprüfungen und fünf Veröffentlichungs-/Signierprüfungen sind bestanden. Die tatsächlich heruntergeladene GitHub-APK wurde erneut geprüft; ihre SHA-256 lautet `8d49d8dd599ce6d611e0c43dafb4bf3a04357cef38d9ba5b45f8d3e0a240eb3b`. Nachweise: `qa/build306/github-publication.json` und `github-apk-verification.json`. Historische Test-Releases bleiben Entwürfe. Die Sichtbarkeit wurde nicht geändert. Prüfumfang und Grenzen: `docs/PUBLICATION_READINESS.md`.

Nicht durchgeführt: physischer BOOX-/GrapheneOS-Update-Test, tatsächliche Datenübernahme und Kontosync. Die kryptografische Rotation ersetzt diesen Gerätetest nicht. Keine neue Reader-Funktion in Build 306; nachfolgend der historische Funktionsnachweis.

---

## Historischer Funktionsstand Build 305

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

Nachweise: qa/build305/BUILD_VERIFICATION.json und qa/build305/. android-final-packaging.log dokumentiert denselben letzten Aufruf mit erfolgreichen nativen Tests und assembleDevDebug; danach wurde kein Produktcode mehr geändert.

Nicht durchgeführt: physischer BOOX-/Smartphone-Test, echte BOOX-Tastaturprüfung, tatsächliche Update-Installation, native visuelle Prüfung und Kontosynchronisation. Der Paket-/Signaturvergleich belegt die technische Update-Identität. Dieser Bericht dokumentiert die lokale APK-Prüfung; die private GitHub-Bereitstellung und der Release-Ablauf sind in README.md beschrieben.
