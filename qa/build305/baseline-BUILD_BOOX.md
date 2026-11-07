# Motero auf BOOX: Build 304

## Installation

Über die vorhandene Motero-Testversion installieren, vorher nicht deinstallieren. Paket `org.zotero.android.debug`, Version `1.0.0-304`, Versionscode 304. Gleiches Signierzertifikat wie die bereitgestellte Version 303. Datenpfade, Datenbank-/Syncformate und bisheriger Debug-Schlüssel bleiben erhalten. Eine tatsächliche Geräteinstallation ist noch nicht durchgeführt.

## Stand und Wiederherstellung

Änderungen: FEATUREPLAN.md, Abschnitt „Reader-Auftrag vom 6. November“. Abgeschlossene Prüfungen und Grenzen: BUILD_STATUS.md und BUILD_VERIFICATION.json. Neue Berichte: qa/build304/. Ältere Dateien in qa/ sind historische Nachweise.

Das Quellarchiv enthält eigene Android-/Reader-Dateien, Laufzeitpakete, bisherigen Debug-Schlüssel und originale Git-Bundles. SOURCE_SNAPSHOT.json dokumentiert Ausgangscommits und neueren Arbeitsstand. Beim Wiederherstellen zuerst die Bundles importieren und dann die flachen Projektdateien als neueren Arbeitsstand übernehmen. Ein Checkout nur der Bundle-HEADs enthält die neuen Änderungen noch nicht.

Vorhandene Checkouts und lokale Arbeit erhalten. Cloud-Aufgaben laufen bereits isoliert; keinen zusätzlichen Git-Worktree erstellen, sofern nicht ausdrücklich gewünscht. Den Reader als Submodul aus seinem mitgelieferten Bundle bereitstellen und alle festgeschriebenen Unterprojekte mit `git submodule update --init --recursive` initialisieren. Eigene Reader-Commits sind im Bundle enthalten und müssen nicht auf öffentlichem Upstream existieren.

## Neubau

Frisch verwendet: vollständiges JDK 17, Android SDK Platform 37.0 Revision 2, Build Tools 36.0.0, Gradle 9.6.1, Node 24 und npm 11. SDK/JDK, node_modules und Caches sind nicht im Quellarchiv enthalten.

1. Im Reader `npm ci --no-audit --no-fund`; Lockfiles erhalten.
2. Den unveränderten pdf/-Ordner aus app/src/main/assets/reader/reader.zip nach reader/build/mobile/pdf und reader/build/android/pdf übernehmen. PDF.js nicht unnötig neu bauen.
3. Im Reader `npx webpack --config-name android` und `npm test`. Tests müssen tatsächliche Einzeltests zählen. In dieser Cloud-Shell war vollständige Prozessunterstützung nötig; alternativ jede vorhandene Testdatei in einem eigenen Prozess mit `node --test --test-isolation=none --test-reporter=tap <Datei>` ausführen.
4. Im Android-Projekt `python3 scripts/package_reader_assets.py` für Reader-ZIP und Hash.
5. `./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --init-script scripts/test_jvm_agent.gradle --no-build-cache --max-workers=4`. JDK/SDK über die üblichen Umgebungsvariablen aktivieren. ByteBuddy wird nur für die Test-JVM vorgeladen; Main-Thread-Prüfung bleibt aktiv.

In dieser Cloud-Instanz benötigte Gradle die JVM-Optionen `-Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080 -Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 -Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts`. ANDROID_HOME zeigte auf die installierte SDK-Wurzel. TLS-/Artefaktprüfung erhalten. Keine Tokens oder Schlüsselwerte in Skripte oder Logs übernehmen.

## Browser und APK

Playwright getrennt vom Projekt-Lockfile installieren und vorhandenes Chromium verwenden. Die sieben bisherigen reader/scripts/test-boox-*.cjs sowie test-boox-reader-update.cjs ausführen. BOOX_TEST_BROWSER gibt den Browserpfad an; NODE_PATH kann eine getrennte Playwright-Installation auswählen.

EPUB-Fixtures: `python3 reader/scripts/make-navigation-epub.py <Pfad>/navigation.epub`. BOOX_NAVIGATION_EPUB und BOOX_NAVIGATION_RTL_EPUB auf die erzeugten Dateien setzen. BOOX_PLESSNER_PDF muss auf die gelieferte Original-PDF zeigen. Originaldateien und interne Screenshots sind nicht im Quellarchiv. Optionale BOOX_KANT_PDF, BOOX_HOEFFE_PDF, BOOX_FUCHS_PDF und BOOX_PROBLEM_PDF benötigen die jeweiligen Originaldateien.

Abschließend `python3 scripts/verify_reader_update.py --base <303.apk> --apk <304.apk> --build-tools <SDK/build-tools/36.0.0> --checks <frische-Berichte> --output BUILD_VERIFICATION.json`. Das prüft Update-Identität, Signatur/Ausrichtung, Laufzeit-/PDF.js-Erhalt, aktuelle eingebettete Quellen und neue Testnachweise. Das historische verify_boox_update.py prüft ältere Updates mit teils ausdrücklich unveränderter Zuschnittgeometrie und ersetzt die neue Prüfung nicht.
