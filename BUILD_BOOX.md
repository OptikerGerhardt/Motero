# Motero auf BOOX: Build 303

## Als Update installieren

Über die vorhandene Motero-Testversion installieren, vorher nicht deinstallieren. Paket `org.zotero.android.debug`, Version `1.0.0-303`, Code 303. Der bisherige Debug-Schlüssel, Datenpfade, Realm-/Syncformat und Einstellungen bleiben erhalten. Die APK-Prüfung vergleicht Paket, Signatur, Versionsanstieg und ZIP-Ausrichtung gegen Build 302.

## Drei Korrekturen

**F29 Teilen-Absturz:** Build 302 lieferte Download-Ereignisse auf IO aus und rief dort unmittelbar die Main-Thread-geschützten UI-Effekte bzw. Fehlerzustände auf. Der Download-Collector läuft jetzt im UI-Scope des ViewModels. Der eigentliche Download bleibt im Hintergrund. Sechs neue Tests verwenden das reale ItemDetailsViewModel mit eingeschalteter Thread-Prüfung und Rückmeldungen aus IO: PDF, EPUB, fehlende Datei, Downloadfehler, fremde Bibliothek mit gleichem Schlüssel und Abbruch mit verspätetem Ready. Normale Download-/Öffnenwege bleiben erhalten.

Share Document bleibt im langen Druck auf einen Dateianhang der Eintragsdetails. Es lädt fehlende Dateien und öffnet Androids Teilenansicht mit FileProvider-URI, ClipData, passendem MIME-Typ und temporärer Leseberechtigung. Geteilt wird weiterhin die gespeicherte Originaldatei, ohne zusätzliches Einbetten separat gespeicherter Zotero-Markierungen. Die unveränderten MIME-/Intent-Tests bleiben bestehen. Die reale Übernahme in einer zweiten Android-App ist hier nicht geprüft.

**F28 Fit-Verlust nach Übersicht:** An der gelieferten Fuchs-PDF wurde nachgestellt, dass eigene Fit-Skalierungen die gemerkte Leseansicht als manuell überschrieben. Nach Zoomknöpfen und Rückkehr aus Wrapped kam deshalb nur die alte Zoomstufe zurück, ohne Fit und Zuschnitt. Ein Pinch im Seitenzwischenraum hatte außerdem keinen gespeicherten Seiten-Pointerdown. Abgeschlossene Fits werden jetzt ausdrücklich gemerkt; ihre eigenen Skalierungsereignisse werden nicht als manuelle Änderung gespeichert. Der bisherige Fit wird vor manuellem Skalieren auch ohne Seiten-Pointerdown gesichert. Wrapped stellt Modus, Margins, Include/Exclude und Clipping gemeinsam wieder her. Explizites Off verwirft den alten Fit.

Die neue Browserprüfung verwendet echte Tipps und einen Pinch, der außerhalb der PDF-Seite beginnt. Original-Fuchs-Seiten 6/100/201/206/207/208/301/411 prüfen vierseitiges Clipping, Navigation, Include/Exclude, Übersichtsrückkehr und Wiederöffnen. Die ursprüngliche freie Gerätebeobachtung war nicht vollständig reproduzierbar; der nachgestellte Zustandsfehler ist konkret behoben. Andere sporadische Abläufe müssen gegebenenfalls weiter beobachtet werden. Rahmen-/Paritäts-/Fußnotenlogik, Scrollmathematik und PDF.js bleiben bytegleich zu Build 302.

**F27 Displaykamera und Leseanker:** Auf Geräten mit gemeldeter Displayaussparung erhält die PDF-/HTML-WebView eine feste sichere Lesefläche unterhalb der Statusleistenhöhe unabhängig von deren Sichtbarkeit und außerhalb der tatsächlichen Aussparung auf allen Seiten. Geräte ohne Aussparung behalten ihre bisherige volle Lesefläche. Floating-Toolbar und Vollbild ändern diese Sicherheitsfläche nicht. Fits, Hardware-Blättern und SmartScroll verwenden dadurch dieselben echten WebView-Abmessungen. Die obere Fläche wird mit der aktuellen Material-Farbe gefüllt; PDF- und Annotationskoordinaten bleiben erhalten. EPUB behält seine bestehende native Aufteilung. Die Compose-Anbindung ist erfolgreich kompiliert; im Browser wird eine obere Sicherheitsfläche mit Leistenwechseln und allen Scrollmodi simuliert. Ein echter Kameraausschnitt ist hier nicht physisch geprüft.

## Erhalt und Nachweise

PSPDFKit/Nutrient bleibt vollständig entfernt. Die übrigen Laufzeitpakete und PDF.js bleiben unverändert. Bestehende Browserfälle prüfen Markieren/Satzzeichen, Lupe, drei Palettenbereiche, Löschen, langen Druck, Kommentar-/Tag-Erhalt, Quick Tags, Bookmarks, Wrapped, SmartScroll, Lesekante, Fits/Randreferenzen, Leisten und Vollbild. Die bisherigen Kant-/Höffe-Originalfälle werden erneut geprüft. F19 Autocomplete, F22 manuelles All/Odd/Even-Cropping und F23 Randtippen bleiben offen und anschlussfähig.

BUILD_STATUS.md, BUILD_VERIFICATION.json und qa/ enthalten die finalen Testzahlen und Hashwerte. Keine physische BOOX-/E-Ink-/Kontosyncprüfung. Original-PDFs und interne Screenshots sind nicht im Quellarchiv enthalten. Keine öffentliche Veröffentlichung beauftragt.

## Neubau

Das Quellarchiv enthält Android-/Reader-Quellen, beide Git-Bundles, Laufzeitpakete und den bisherigen Debug-Schlüssel. SDK/JDK, node_modules, Caches, APK, private Release-Schlüssel und lokale Test-PDFs sind ausgeschlossen.

JDK 17, Android Platform 37.0 Revision 2, Build Tools 36.0.0, Gradle 9.6.1 und Node/npm verwenden. Reader-Submodule initialisieren. Den unveränderten `pdf`-Ordner aus `app/src/main/assets/reader/reader.zip` nach `reader/build/mobile/pdf` und `reader/build/android/pdf` übernehmen. Im Reader `npm ci`, `npx webpack --config-name android`, `npm test`; anschließend im Android-Projekt `python3 scripts/package_reader_assets.py`. PDF.js nicht unnötig neu bauen.

Sieben Browserprüfungen: `reader/scripts/test-boox-{browser,features,fitting,stability,reader-controls,annotation-tools,fit-recovery}.cjs`. Playwright und Chromium verwenden. `BOOX_TEST_BROWSER` gibt den Browserpfad an. `BOOX_KANT_PDF`, `BOOX_HOEFFE_PDF` und `BOOX_FUCHS_PDF` verweisen auf die jeweiligen Original-Testdateien. Der neue Recovery-Test kann über `BOOX_READER_ROOT` gegen einen getrennten älteren Reader-Bau laufen. Bilder sind nur bei `BOOX_QA_IMAGES` optional und werden nicht veröffentlicht.

Android: `./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --no-build-cache`. Bei Umgebungen ohne Attach zusätzlich `--init-script scripts/test_jvm_agent.gradle`; der ByteBuddy-Agent wird nur in der Test-JVM vorgeladen.

Audit: `python3 scripts/audit_pdf_engine_removal.py --base-source <entpackte-302-Quellen> --reader-recovery --output qa/sdk-removal-audit.json`.

APK: `python3 scripts/verify_boox_update.py --base <302.apk> --apk <303.apk> --build-tools <SDK/build-tools/36.0.0> --qa-directory qa --label Motero --fitting-update --reader-polish --motero-refinement --reader-controls --roman-references --without-pspdfkit --annotation-tools --reader-recovery`. Das prüft die eingebetteten Quellen, unveränderte Rahmen-/Scrollgeometrie und PDF.js, SDK-Abwesenheit, alle bisherigen Nachweise sowie Recovery-/Threadtests und Update-Identität gemeinsam.
