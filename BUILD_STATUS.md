# Build 322 / Motero 1.0.7 — veröffentlicht und unabhängig geprüft

## Build 323 / Motero 1.0.8 — Release-Kandidat

- Reader `7038bbfb`: stabile EPUB-Textanker, Bearbeitungspaletten, Odd-/Even-Spreads und gemeinsame Speicher-/Arbeitssteuerung.
- Lokaler Release-Build und 147 native Tests in 36 Suiten bestanden. Bestehende Browser-Suiten bestanden; neue Spread-/Worker-Fälle werden mit dem endgültigen Stand erneut geprüft.
- Kompakte Crop-Daten stimmen in 96 Vergleichsfällen mit der vorherigen Geometrie überein. PDF.js 5.7.330 unverändert.
- Signatur, API-31/35-Updates von 303/322 und öffentliche APK-Prüfung sind vor der Freigabe erforderlich. [Details und Grenzen](docs/READER_323.md).


- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.7-322 ; erfolgreicher Build-/Release-Prüflauf: https://github.com/OptikerGerhardt/Motero/actions/runs/42929208556 .
- App-Quelle: `0257b1991b86fe843d25c81e37e76827f2106dbf`; Reader: `0aec12a3114e30c53ff4847ffe9351856d02387e`; PDF.js `5f95f712` / 5.7.330 unverändert.
- EPUB-Wischen auf Text und Randtippen korrigiert; eigene obere/untere Ränder, stabiles symmetrisches Textfeld außerhalb des Status-/Aussparungsbereichs und erreichbarer Bookmark-Filter.
- Begrenzter Miniaturspeicher, Raster-Samples nacheinander und wiederverwendete Seitenlayouts. E-Reader-Hintergrundanalyse während Fingereingaben zurückgestellt; obere Leiste ohne normale Einblendanimation.
- 382 Reader-Tests, 43 Engine-Pixeltests, 145 native Tests in 35 Suiten und 20 Browser-Suiten einschließlich 19 offizieller Viewer-Fälle bestanden. Bestehende Annotationsbearbeitung und Crop-/Stift-/Navigationsregressionen erhalten.
- Synthetischer lokaler Speichervergleich: beobachtete Sample-Arrays 23,04 → 3,84 MB, Miniaturen 96 → 32. Keine Messung des gesamten Prozess-RAM oder physischer BOOX-Latenz.
- Öffentliche APK unabhängig geprüft: SHA-256 `9af91ea220698788f9c3bb8784ae970c4207a8cb53ea5d089f1b71c83dc58ebe`. Privater Signierer, Rotation, Receiver-Berechtigung, nicht debuggbar; 104 Reader-Quellen, 207 PDF.js- und 45 Runtime-Dateien stimmen. Tag, vollständige Quellen (9309 Dateien), Berichte und Prüfsummen geprüft.
- API 31/35: Updates von 303 und 321 erhalten Datenmarker und UID und starten die App; alte Schlüssel für Updates/interne Berechtigungen abgewiesen. Latest-Release liefert 322 mit genau einer APK.
- Physische BOOX-/Pixel-Prüfung, native Animationen und Kontosync separat. [Umfang](docs/READER_322.md), [Nachweise](qa/build322/).

# Build 321 / Motero 1.0.6 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.6-321 ; erfolgreicher Build-/Release-Prüflauf: https://github.com/OptikerGerhardt/Motero/actions/runs/42911476446 .
- App-Quelle: `6b11d120ddb18a04023e568afaf56aee805a7fcb`; Reader: `319575841df017bd8f567b18b7181c6818f8e9f3`; PDF.js `5f95f712` / 5.7.330 unverändert.
- 378 Reader-Tests, 43 Engine-Pixeltests, 144 native Tests in 35 Suiten und 18 Browser-Suiten bestanden, einschließlich 19 offizieller Viewer-Fälle. Bisherige Cropping-, Scroll-, Bookmark-, Toolbar-, Theme- und Stiftregressionen erhalten.
- EPUB mit direktem Markieren, gemeinsamer Palette, schwebenden Leisten, schwarzen Bookmark-Fähnchen, Margins und Schriftwahl. Bestehende Annotationen per langem Druck bearbeiten; IDs und Undo erhalten. Text-Fit behält die volle nicht angepasste Achse; Text + crop schneidet beide Achsen zu.
- Öffentliche APK unabhängig heruntergeladen: SHA-256 `c3b2bb0427ca601cc0ccc7fce44bd05e4b47d860d1f7c4478afdc0cf1af3d988`. Privater Motero-Signierer, Rotation, Receiver-Berechtigung, Android 9+, nicht debuggbar; 104 Reader-Quellen, 207 PDF.js- und 45 Runtime-Dateien stimmen. Tag, vollständiges Quellarchiv (9267 Dateien) und Prüfsummen geprüft.
- API 31/35: Updates von 303 und 320 erhalten Datenmarker und UID und starten die App; alte Schlüssel für Updates/interne Berechtigungen abgewiesen. Latest-Release liefert 321 mit genau einer APK.
- Physische BOOX-/Pixel-/GrapheneOS-Prüfung, native Animationsansicht und Kontosync separat. [Umfang](docs/READER_NEXT_UPDATE.md), [Nachweise](qa/build321/).

# Build 320 / Motero 1.0.5 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.5-320 ; vollständiger erfolgreicher Prüflauf: https://github.com/OptikerGerhardt/Motero/actions/runs/42820804089 .
- App-Quelle: `3cd29ee1dea387d14226dbe9a608b67c328da9b9`; Reader: `ad0d6bae922d3a3d6d35beb31f54b1c54adbb638`; PDF.js `5f95f712` / 5.7.330.
- 365 Reader-Tests, 43 zusätzliche Engine-Pixeltests, 141 native Tests in 34 Suiten und alle 16 Browser-Suiten bestanden, einschließlich 19 offizieller Viewer-Fälle. Bisherige Cropping-, Scroll-, Bookmark-, Toolbar-, Theme-, EPUB- und Stiftregressionen erhalten.
- Öffentliche APK unabhängig heruntergeladen: SHA-256 `d64af94d57619a934813480da04e32c97a3506fa9cb3e49ebda6544a83815101`. Privater Motero-Signierer, Rotation, Receiver-Berechtigung, Android 9+, nicht debuggbar; 101 Reader-Quellen, 207 PDF.js- und 45 Runtime-Dateien stimmen. Tag, vollständiges Quellarchiv (9223 Dateien) und Prüfsummen geprüft.
- API 31/35: Updates von 303 und 319 erhalten Datenmarker und UID und starten die App; alte Schlüssel für Updates/interne Berechtigungen abgewiesen. Latest-Release liefert 320 mit einer APK; kein unabhängig anonymer API-Zugriff behauptet.
- Physische BOOX-/Pixel-/GrapheneOS-Prüfung und Kontosync separat. [PDF.js-Update und Grenzen](docs/PDFJS_UPDATE.md), [Nachweise](qa/build320/).

# Build 319 / Motero 1.0.4 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.4-319 ; erfolgreicher vollständiger Prüflauf: https://github.com/OptikerGerhardt/Motero/actions/runs/42791143244 .
- App-Quelle: `1237cedaa44daeb57861a88cdd2e2d9fcafafac0`; Reader: `b160afd08e47d431b306bd2ceb31aa23ed46fa7f`.
- 365 Reader-Tests, 141 native Tests in 34 Suiten und alle 15 Browser-Suiten bestanden. Bisherige Cropping-, Scroll-, Bookmark-, Toolbar-, Theme- und EPUB-Regressionen erhalten; zusätzliche Stift-/Handballen-/Abbruch-/Historienfälle geprüft.
- Öffentliche APK unabhängig heruntergeladen: SHA-256 `504a9ccfa5ad84a644bc32d83ded8a5af03a9ad3f886a41e5befcce68baf0a0b`. Privater Motero-Signierer, Rotation, Receiver-Berechtigung, Android 9+, nicht debuggbar; 101 Reader-Quellen, 207 PDF.js- und 45 Runtime-Dateien stimmen. Tag, vollständiges Quellarchiv und Prüfsummen ebenfalls geprüft.
- API 31/35: Updates von 303 und 318 erhalten private Datenmarker und UID und starten die App. Alte Schlüssel werden für Updates/interne Berechtigungen abgewiesen. Latest-Release liefert 319 mit einer APK; kein unabhängig anonymer API-Zugriff behauptet.
- Lokales App-/Reader-E-Reader-Profil und tragbare Stiftsteuerung geliefert. Physische BOOX-/Pixel-/InkSense-/EMR-Prüfung und Kontosync separat; BOOX-SDK/Preview bis Lizenz-/Hardware-/Latenzprüfung deaktiviert. [Umfang und Grenzen](docs/E_READER_AND_STYLUS.md), [Prüfberichte](qa/build319/).

# Build 318 / Motero 1.0.3 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.3-318 ; erfolgreicher Prüflauf: https://github.com/OptikerGerhardt/Motero/actions/runs/42708855081 .
- Quelle: `a4ca1dc9da11b385958c7b16b2e4c31046c5a6b5`; Reader: `e215e5bfb420ea562f4c1c8f7154fabdb6740376`.
- 333 Reader-Tests, 125 native Release-Tests in 30 Suiten und 14 Browser-Suiten bestanden. Signierte öffentliche APK unabhängig heruntergeladen, Quellen, Signierpolitik und Prüfsummen verifiziert.
- APK-SHA-256: `46b2430a47b362577717f51cfc37541733bce1f636b20bd5ab40477893e2cc3e`. Unveränderter privater Signierer; 100 Reader-Quellen, 207 PDF.js- und 45 Runtime-Dateien stimmen.
- API 31/35: Updates von Build 303 und 317 erhalten private Datenmarker und UID und starten die App. Alte Schlüssel werden für Updates und interne Berechtigungen abgewiesen. Latest-Release liefert Build 318; kein unabhängig anonymer API-Zugriff behauptet.
- Randmasken bei unverändertem Seitenrahmen werden wieder sofort gezeichnet. Alle Cropping-, Performance- und Bedienungsänderungen aus 317 sind enthalten. [Algorithmus/Quellen](docs/CROPPING_AND_SCROLLING.md), [Prüfberichte](qa/build318/).
- Physische BOOX-/Pixel-Bedienung und Kontosync separat. Original-Kant-/Fuchs-PDFs der Screenshots lagen nicht vor; entsprechende Muster synthetisch geprüft.

## Build 317 / Motero 1.0.2

- Enthält die gesammelten Cropping-/Performance-/UI-Änderungen mit 332 Reader-, 125 nativen Tests und 14 Browser-Suiten. Beide Update-Gates bestanden.
- Wurde während der Bearbeitung eines Abbruchwunsches vom Workflow veröffentlicht. Ein danach bestätigter Randmasken-Neuzeichnungsfehler ist in 318 korrigiert; Tag und Assets von 317 bleiben unverändert. [Historische Berichte](qa/build317/).

# Build 316 / Motero 1.0.1 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.1-316 ; Prüflauf: https://github.com/OptikerGerhardt/Motero/actions/runs/42690410151 .
- Quelle: `da33b516d603a72b05ea692a6198bcfadccf61c3`; Reader: `ffa59d7e414d8a1be46f5b17605189a39be8cb78`.
- 314 Reader-Tests, 125 Android-Tests in 30 Suiten und 13 Browser-Suiten bestanden; lokal zusätzlich elf Infrastrukturtests. Signierte öffentliche APK unabhängig heruntergeladen und gegen Quellen, Signatur und Prüfsummen geprüft.
- APK-SHA-256: `04e8f145a60bf95739b65297dd11c8b5d11c314f703553fa034040f31c2b7d43`. Unveränderter privater Motero-Signierer; 99 Reader-Quellen, 207 PDF.js- und 45 Runtime-Dateien geprüft. Latest-Release liefert Build 316.
- API 31/35: Updates von 303 und 315 erhalten Datenmarker und UID und starten die App. Alter Schlüssel kann weder zurückinstallieren noch die interne Berechtigung nutzen.
- Zentrierungs-Regressionsprüfung reproduziert in Build 315 401,5 CSS-Pixel Versatz nach oben. Korrektur besteht in allen drei Layouts nach Wischen, Randtippen, Hardware-Tasten und Übersichtssprüngen, auch ohne Zuschnitt an den Dokumenträndern.
- Jump-to und Menü im Kopf aller Karten; Bookmark-Filter mit zustandsabhängigem Löschen/Menü. Menü-Ziel bei anderer ausgewählter Annotation und Sprung aller Annotationstypen nativ getestet.
- Freie Mitte des Sidebar-Kopfs fängt Berührungen ab. Zusätzlicher nativer Eingabetest ist durch schwarzen Emulator-Output und Startzeitüberschreitungen blockiert; deshalb kein nativer Input-/Sicht-Pass. Physische BOOX-/Pixel-Prüfung und Kontosync separat. Nachweise: `qa/build316/`.

# Build 315 / Motero 1.0 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-315 ; GitHub-Lauf: https://github.com/OptikerGerhardt/Motero/actions/runs/42608990281 .
- Quelle: `6f44539324d6794cd3de194fdd01100fa751c671`; Reader: `80a4cf6695e18faac38fe418623903c742ab7641`.
- 314 Reader-Tests, 123 Android-Tests und 13 Browser-Suiten in der GitHub-Pipeline bestanden; lokal zusätzlich elf Release-Infrastrukturtests und APK-Build erfolgreich.
- Öffentliche APK unabhängig heruntergeladen und geprüft: privater Motero-Signierer, nicht debuggbar, Rotation, Receiver-Berechtigung, 99 Reader-Quellen, 207 PDF.js- und 45 Runtime-Dateien. SHA-256: `9ff51d3cf40791e98a021cddd23286a61123d013f60dac8e0d4142c932ba62cf`.
- API 31/35: Updates von Build 303 und 314 erhalten Datenmarker und UID, starten die App und verweigern Updates/geschützte Berechtigungen für den alten Schlüssel. Obtainium-Latest-Abfrage liefert Build 315; Repository-Sichtbarkeit ist öffentlich.
- Jumped/Continuous einschließlich zentriertem Moduswechsel und stabilem Wrapped-Rücksprung, langes Undo für Redo, runde Farbflächen mit weißem Auswahlring, Hashtags ohne Haken, adaptive Dock-Breite und Statusleisten-Abdeckung umgesetzt.
- Native Sicht-/Animationsprüfung auf physischen Geräten und Kontosync separat; kein nativer visueller Pass behauptet. Nachweise: `qa/build315/`.

# Build 314 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-314
- Quelle: `7eac431651ab4c4e621a2072396cac48f3555645`; Reader: `60d20ed573f73cf14efc18a7dbb7fab9157612d1`.
- 312 Reader-Tests, 122 native Tests und zwölf Browser-Suites bestanden; lokaler APK-Build und GitHub-Pipeline erfolgreich. Zwei neue Regressionen reproduzierten die bisherigen Dark-Vorschau-/Radierfehler vor der Korrektur.
- Öffentliche APK heruntergeladen und geprüft: Signatur, Quellen, Paketdaten, Receiver-Berechtigung und Prüfsummen stimmen überein. SHA-256: `c57939a0d8099eb85bb4e976de82784acb854b8f1df811660f6088a448bd5cf6`.
- API 31/35: Updates von Build 303 und 313 erhalten Testdaten und UID; App-Start und Ablehnung des alten Schlüssels erfolgreich. Obtainium-Zugriff anonym geprüft.
- Alle 13 gesammelten Nachbesserungen umgesetzt; Details im Featureplan und Changelog.
- Native Sichtprüfung lokal durch schwarzen Emulator-Grafikoutput begrenzt und ausdrücklich nicht als bestanden gewertet. Physische BOOX-/GrapheneOS-Animationen und Kontosync separat. Nachweise: `qa/build314/`.

# Build 313 — veröffentlicht und unabhängig geprüft

- Release: https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-313
- Quelle: `9be88d7e3b1c76467db9e251a1c34a3928b04a4e`; Reader: `d439d2c315dd142208ead007f698cd8af85a8e0d`.
- 308 Reader-Tests, 122 native Tests und zwölf Browser-Suites bestanden; lokaler APK-Build und GitHub-Pipeline erfolgreich.
- Öffentliche APK heruntergeladen: Signatur, Quellen, Paketdaten, Receiver-Berechtigung und Prüfsummen stimmen überein. SHA-256: `5ddf7311546822a91f8dfe97a3deae6ce9b82af514988a5a00669d06103719a0`.
- API 31/35: Updates von 303 und 312 mit Datenmarker- und UID-Erhalt, App-Start und Ablehnung des alten Schlüssels erfolgreich. Obtainium-Zugriff anonym geprüft.
- Crop-Auswahl und aktuelle Vorschau korrigiert; gemeinsame Annotationsleiste mit Inline-Optionen und Strich-/Flächenradierer; „Fit relative to“ wieder wählbar und gespeichert.
- Vollständige visuelle Dock-Prüfung lokal durch Emulator-/Runtime-Probleme begrenzt; echte GrapheneOS-/BOOX- und Kontosync-Prüfung separat. Nachweise: `qa/build313/`.

# Build 312 — veröffentlicht und unabhängig geprüft, 8. November 2026

[APK und vollständige Quellen](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-312) sind veröffentlicht. Bestanden: 305 Reader-Tests, 119 native Tests, zwölf Browser-Suites und beide echten Android-Update-Gates auf API 31/35. Die Korrektur stellt auch entfernte Miniaturseiten nach einem Renderer-Neustart wieder her.

Die tatsächlich veröffentlichte APK wurde separat heruntergeladen und geprüft: private Motero-Signatur, V3-Rotation, nicht debuggbares Paket, 98 aktuelle Reader-Quellen, 207 unveränderte PDF.js-Dateien und 45 Runtime-Dateien. SHA-256: `7d8a35ad4d5681519e634fba0c2ebe544f59bee761ced7b7fc8b5ac543fe7401`. Prüfsummen und beide Migrationsberichte stimmen überein. Updates von 303 und 311 erhalten Testdaten und UID; alte Schlüssel werden abgewiesen. Die anonyme Latest-Release-API liefert diese APK für Obtainium.

Nachweise: [qa/build312](qa/build312/README.md), [GitHub-Durchlauf](https://github.com/OptikerGerhardt/Motero/actions/runs/42507380160). Physische BOOX-/GrapheneOS- und Kontosync-Tests sind gesondert zu bestätigen.
# Build 311 — veröffentlicht und unabhängig geprüft, 8. November 2026

Enthält die Reader-UI-, Zuschnitt-, Speicher- und Stiftverbesserungen. Erfolgreich geprüft und veröffentlicht mit 305 Reader-Tests, 118 nativen Tests, zwölf Browser-Suites und datenerhaltenden API-31/35-Updates von 303 und 310. Die separat heruntergeladene APK wurde einschließlich Signatur, Quellen, Prüfsummen und Obtainium-Schnittstelle geprüft. Nachweise: [qa/build311](qa/build311/README.md).
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
