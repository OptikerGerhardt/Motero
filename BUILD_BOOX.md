# Motero auf BOOX: Build 305

## Installation

Über die vorhandene Motero-Testversion installieren, vorher nicht deinstallieren. Paket `org.zotero.android.debug`, Version `1.0.0-305`, Versionscode 305. Gleiches Signierzertifikat wie die vorherige Version 304. Datenpfade, Datenbank-/Syncformate und bisheriger Debug-Schlüssel bleiben erhalten. Eine tatsächliche Geräteinstallation ist noch nicht durchgeführt.

## Quellstand und Wiederherstellung

Aktueller Code und Änderungen liegen im privaten GitHub-Repository. Normaler Einstieg:

```sh
git clone --recurse-submodules https://github.com/OptikerGerhardt/Motero.git
```

Der Reader ist als Submodul auf den Branch `reader` desselben Repositorys festgeschrieben. Die Releases enthalten außerdem ein vollständiges Quellarchiv einschließlich initialisierter Submodule und `SOURCE_SNAPSHOT.json`. Dieses neue Archiv benötigt keine alten Git-Bundles; Git-Metadaten, Caches und persönliche Dateien sind nicht enthalten. Die ursprünglichen importierten Archive und `qa/`-Baselines dokumentieren frühere Wiederherstellungswege.

Änderungen: FEATUREPLAN.md, Abschnitt „Auftrag vom 7. November“. Prüfungen und Grenzen: BUILD_STATUS.md, BUILD_VERIFICATION.json und qa/build305/. Für GitHub-Builds und Releases gelten README.md und docs/RELEASING.md.

## Neubau

Frisch verwendet: vollständiges JDK 17, Android SDK Platform 37.0 Revision 2, Build Tools 36.0.0, Gradle 9.6.1, Node 24 und npm 11. SDK/JDK, node_modules und Caches sind nicht im Quellarchiv enthalten.

1. Im Reader `npm ci --no-audit --no-fund`; Lockfiles erhalten.
2. Mit `python3 scripts/prepare_reader_assets.py` die geprüften Runtime-Dateien validieren und die mitgelieferte PDF.js-Distribution in reader/build/mobile und reader/build/android bereitstellen. PDF.js nicht unnötig neu bauen.
3. Im Reader `npx webpack --config-name android` und `npm test`. Tests müssen tatsächliche Einzeltests zählen. In dieser Cloud-Shell war vollständige Prozessunterstützung nötig; alternativ jede vorhandene Testdatei in einem eigenen Prozess mit `node --test --test-isolation=none --test-reporter=tap <Datei>` ausführen.
4. Im Android-Projekt `python3 scripts/package_reader_assets.py` für Reader-ZIP und Hash.
5. `./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --init-script scripts/test_jvm_agent.gradle --no-build-cache --max-workers=4`. JDK/SDK über die üblichen Umgebungsvariablen aktivieren. ByteBuddy wird nur für die Test-JVM vorgeladen; Main-Thread-Prüfung bleibt aktiv.

In dieser Cloud-Instanz benötigte Gradle die JVM-Optionen `-Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080 -Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 -Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts`. ANDROID_HOME zeigte auf die installierte SDK-Wurzel. TLS-/Artefaktprüfung erhalten. Keine Tokens oder Schlüsselwerte in Skripte oder Logs übernehmen.

## Browser und APK

Playwright getrennt vom Projekt-Lockfile installieren und vorhandenes Chromium verwenden. Die zehn Browserprüfungen in reader/scripts/ ausführen: test-boox-browser.cjs, test-boox-features.cjs, test-boox-fitting.cjs, test-boox-stability.cjs, test-boox-reader-controls.cjs, test-boox-annotation-tools.cjs, test-boox-fit-recovery.cjs, test-boox-reader-update.cjs, test-boox-manual-crop.cjs und test-boox-edge-taps.cjs. BOOX_TEST_BROWSER gibt den Browserpfad an; NODE_PATH kann eine getrennte Playwright-Installation auswählen.

EPUB-Fixtures: `python3 reader/scripts/make-navigation-epub.py <Pfad>/navigation.epub`. BOOX_NAVIGATION_EPUB und BOOX_NAVIGATION_RTL_EPUB auf die erzeugten Dateien setzen. BOOX_PLESSNER_PDF muss auf die gelieferte Original-PDF zeigen. Originaldateien und interne Screenshots sind nicht im Quellarchiv. Optionale BOOX_KANT_PDF, BOOX_HOEFFE_PDF, BOOX_FUCHS_PDF und BOOX_PROBLEM_PDF benötigen die jeweiligen Originaldateien.

Abschließend `python3 scripts/verify_reader_update.py --base <304.apk> --apk <305.apk> --build-tools <SDK/build-tools/36.0.0> --checks <frische-Berichte> --output BUILD_VERIFICATION.json`. Das prüft Update-Identität, Signatur/Ausrichtung, Laufzeit-/PDF.js-Erhalt, aktuelle eingebettete Quellen und neue Testnachweise. Das historische verify_boox_update.py prüft ältere Updates mit teils ausdrücklich unveränderter Zuschnittgeometrie und ersetzt die neue Prüfung nicht.

## Bedienung der neuen Funktionen

Tags in der bestehenden Tag-Auswahl eingeben; sichtbare Ergänzung mit Enter oder Speichern übernehmen. Neue Namen ausdrücklich über „Neuen Tag … anlegen“ auswählen. Ausgewählte Tags können im oberen Bereich wieder abgewählt werden.

Im PDF-Einstellungsmenü „Manueller Zuschnitt…“ öffnen. Rahmen ziehen, „Alle Seiten“, „Ungerade Seiten“ oder „Gerade Seiten“ wählen und übernehmen. Mit den Pfeilen weitere passende Beispielseiten ansehen; geänderte Rahmen bleiben dabei erhalten. PDF-Seite 1 zählt als ungerade. Zuschnitte sind lokal pro Bibliothek/Anhang; „Automatisch“ entfernt alle manuellen Rahmen. Die PDF-Datei bleibt unverändert.

Randtippen gilt in vertikalem, horizontalem und Wrapped-Modus. Die obere rechte Bookmark-Fläche behält ihre Umschaltfunktion. Vorhandene Links und Annotationen sowie lange Markier- und Wischgesten behalten ihre normale Bedienung.
