# Motero

[![Build und Tests](https://github.com/OptikerGerhardt/Motero/actions/workflows/motero.yml/badge.svg)](https://github.com/OptikerGerhardt/Motero/actions/workflows/motero.yml)

**Motero ist ein inoffizieller Fork von Zotero für Android**, angepasst für PDF-Lektüre auf BOOX-E-Readern und auf dem Smartphone. Das Projekt wird unabhängig von Zotero entwickelt und ist nicht mit der Corporation for Digital Scholarship verbunden.

Aktueller Entwicklungsbuild: **1.0.0-305**. Das Repository bleibt vorerst privat. Code und Dokumentation sind für eine spätere öffentliche Bereitstellung vorbereitet; eine tatsächliche Veröffentlichung des Repositorys erfolgt separat.

## Herunterladen und aktualisieren

Die installierbare APK liegt immer unter **[Releases](https://github.com/OptikerGerhardt/Motero/releases)**. Lade dort `Motero_Build<Nummer>.apk` herunter und installiere sie als Update über die bestehende Motero-App. Paketkennung und bisheriger Test-Signierer bleiben erhalten.

Bei einem privaten Repository musst du auf GitHub angemeldet sein. Obtainium kann dieses Repository als GitHub-Quelle mit Leseberechtigung für das private Repository verwenden; als APK-Dateifilter passt `Motero_Build.*\.apk`. API-Schlüssel oder GitHub-Tokens gehören in die lokale App-Konfiguration, nicht in Issues oder dieses Repository.

Diese APKs sind Entwicklungsbuilds: `org.zotero.android.debug`, mit dem öffentlich mitgelieferten Zotero-Debug-Schlüssel signiert. Die Signatur erhält die Update-Kompatibilität zur bisherigen Testversion; sie ist kein geheimer Produktionsschlüssel. Siehe [Sicherheit und Signierung](SECURITY.md).

## Funktionen

- Direkte Textmarkierung, Annotationswerkzeuge und Zotero-Tags im PDF-Reader.
- Automatische Inhaltserkennung mit wählbaren Fit-, Rand- und Marginalien-Einstellungen.
- Manueller Zuschnitt für alle, gerade oder ungerade PDF-Seiten, lokal pro Dokument gespeichert.
- SmartScroll und Hardware-Blättern, Randtippen in vertikalem, horizontalem und Wrapped-Modus.
- Bookmark-Shortcut oben rechts: einmal tippen setzt das Lesezeichen, erneut tippen entfernt es.
- Tag-Vorschläge nach Nutzung im aktuellen Dokument und in der Bibliothek, mit ausdrücklicher Neuanlage.
- EPUB-Navigation und lokale Wiederherstellung der Leseposition.

Vollständiger Stand: [Featureplan](FEATUREPLAN.md), [Änderungsübersicht](CHANGELOG.md) und [Prüfbericht](BUILD_STATUS.md). PDF-Dateien werden durch die Ansichts-Zuschnitte nicht verändert. Die manuellen Rahmen sind lokale Einstellungen und werden nicht mit Zotero synchronisiert.

## Entwicklung und Build

```sh
git clone --recurse-submodules https://github.com/OptikerGerhardt/Motero.git
cd Motero
python3 scripts/prepare_reader_assets.py
cd reader
npm ci --no-audit --no-fund
npm test
npx webpack --config-name android
cd ..
python3 scripts/package_reader_assets.py
./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --init-script scripts/test_jvm_agent.gradle --no-build-cache
```

Voraussetzungen: **JDK 17**, **Node 24**, Python 3, Android SDK **Platform 37.0** und **Build Tools 36.0.0**. Gradle 9.6.1 wird vom Wrapper mit SHA-256-Prüfung geladen. Der Workflow verwendet Java 21 für aktuelle SDK-Werkzeuge und danach JDK 17 für den App-Build. Die APK entsteht unter `app/build/outputs/apk/dev/debug/app-dev-debug.apk`.

Der angepasste Reader liegt im Branch [`reader`](https://github.com/OptikerGerhardt/Motero/tree/reader) **desselben Repositorys** und wird auf `main` als Submodul festgeschrieben. Damit enthält ein rekursiver Klon den tatsächlichen Motero-Reader statt eines nicht verfügbaren Upstream-Commits. Reader-Änderungen zuerst im Branch `reader` committen/pushen, danach den Submodulstand auf `main` aktualisieren.

Die unveränderten Laufzeitpakete und die geprüfte mobile PDF.js-Distribution werden mitgeliefert. [vendor/README.md](vendor/README.md) beschreibt Quellen, Hashprüfung und Aktualisierung. Keine privaten PDFs oder Kontozugangsdaten werden für den Build benötigt.

## Tests und Releases

```sh
python3 scripts/run_browser_checks.py --browser /usr/bin/chromium
```

Die Browserprüfungen benötigen Playwright 1.56.1 für Node. Installiere es getrennt vom Projekt-Lockfile und setze `NODE_PATH` auf dessen `node_modules`. Eine zusätzliche Prüfung der privaten Original-Plessner-PDF läuft nur, wenn `BOOX_PLESSNER_PDF` gesetzt ist. Die mitgelieferten synthetischen PDF-/EPUB-Fixtures werden immer geprüft.

Bei Änderungen an der App oder am eingebundenen Reader wird `BuildConfig.versionCode` erhöht. Der GitHub-Workflow baut und testet `main` und Pull Requests. Ein neuer Build auf `main` wird nach erfolgreichen Prüfungen automatisch als neuer Release mit APK, vollständigem Quellarchiv, Prüfberichten und SHA-256-Summen angelegt. Bereits vorhandene Releases werden nicht überschrieben. Details: [Release-Ablauf](docs/RELEASING.md).

Build 305: **276 Reader-Tests, 109 Android-Tests in 25 Suiten und zehn Browserprüfungen bestanden**. Die Original-Plessner-Prüfung wurde lokal ebenfalls durchgeführt. Physische BOOX-/Smartphone-Tests, die tatsächliche BOOX-Tastatur und echter Kontosync sind im automatisierten Testlauf nicht enthalten.

## Herkunft und Lizenz

Motero basiert auf [Zotero für Android](https://github.com/zotero/zotero-android) und [Zotero Reader](https://github.com/zotero/reader). Der abgeleitete Anwendungscode wird unter **GNU AGPLv3** weitergegeben, entsprechend den Upstream-Bedingungen. Die ursprünglich im leeren Repository gewählte Apache-Lizenz war für den später übernommenen Zotero-Code nicht die passende Projektlizenz.

Siehe [LICENSE](LICENSE), die erhaltenen Upstream-Hinweise in [COPYING](COPYING) und [NOTICE.md](NOTICE.md). Abhängigkeiten behalten ihre jeweiligen Lizenzen. „Zotero“ ist eine Marke der Corporation for Digital Scholarship; „Motero“ kennzeichnet diesen unabhängigen Fork.

Fehler und Vorschläge zu Motero bitte in [diesem Repository](https://github.com/OptikerGerhardt/Motero/issues) melden. Hinweise zum Mitmachen stehen in [CONTRIBUTING.md](CONTRIBUTING.md).
