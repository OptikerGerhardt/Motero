# Motero

[![Build und Tests](https://github.com/OptikerGerhardt/Motero/actions/workflows/motero.yml/badge.svg)](https://github.com/OptikerGerhardt/Motero/actions/workflows/motero.yml)

**Motero ist ein inoffizieller Fork von Zotero für Android**, angepasst für PDF-Lektüre auf BOOX-E-Readern und auf dem Smartphone. Das Projekt wird unabhängig von Zotero entwickelt und ist nicht mit der Corporation for Digital Scholarship verbunden.

Der Quellstand und die Release-Automatisierung sind für eine öffentliche Bereitstellung vorbereitet. Das Repository bleibt bis zur ausdrücklichen Entscheidung des Betreibers privat. Build 306 ist mit dem eigenen, privaten Motero-Schlüssel signiert und auf GitHub verfügbar; die früheren Test-APKs sind als private Entwürfe archiviert. Der genaue Freigabestand steht in [PUBLICATION_READINESS.md](docs/PUBLICATION_READINESS.md).

## Entwicklung mit ChatGPT und übernommene Beiträge

**Die eigenen Motero-Anpassungen und ihre Integration wurden vollständig mithilfe von ChatGPT / OpenAI Codex programmiert.** Anforderungen, Entscheidungen und die praktische Erprobung werden vom Projektbetreiber verantwortet. Auch Tests und Build-/Repository-Konfiguration wurden mit dieser Unterstützung erstellt. Das ist keine unabhängige Sicherheitsprüfung und keine Garantie für fehlerfreie Software.

Die zugrunde liegende Zotero-Software und übernommene Community-Beiträge behalten ihre ursprüngliche Urheberschaft. In diesem Fork wurden außerdem ausgewählte Pull Requests aus den Originalprojekten zusammengeführt bzw. deren bereits gemergte Änderungen übernommen. Beispiele sind die Lautstärketasten-Steuerung, „Fit to Content“ und Korrekturen der Reader-Navigation. **„In Motero übernommen“ bedeutet nicht automatisch „im Zotero-Original gemergt“.** Verifizierte Links und die jeweilige Einordnung stehen in [UPSTREAM_CHANGES.md](UPSTREAM_CHANGES.md).

## Danke an Zotero und die Community

Motero wäre ohne die langjährige Arbeit der Entwicklerinnen und Entwickler von **[Zotero](https://www.zotero.org/)**, **[Zotero für Android](https://www.zotero.org/support/android)** und **[Zotero Reader](https://github.com/zotero/reader)** nicht möglich. Die Grundlage dieser App ist ihre Arbeit an Literaturverwaltung, Synchronisation, PDF-/EPUB-Lektüre, Annotationen, Übersetzungen und Dokumentation.

Vielen Dank an die Corporation for Digital Scholarship sowie an die Maintainer, Beitragenden, Übersetzenden und Testenden für ihre Zeit, ihre Mühe und die offene Bereitstellung ihrer Arbeit. Die Motero-spezifischen Anpassungen bauen darauf auf. Hinweise und Anerkennung gelten ausdrücklich auch den ursprünglichen Autorinnen und Autoren der übernommenen Pull Requests.

Quellen: [Zotero auf GitHub](https://github.com/zotero/zotero), [Zotero für Android auf GitHub](https://github.com/zotero/zotero-android), [Zotero Reader auf GitHub](https://github.com/zotero/reader). Motero ist ein unabhängiger Fork und kein offizielles Zotero-Produkt.

## Herunterladen und aktualisieren

Geprüfte APKs stehen unter **[Releases](https://github.com/OptikerGerhardt/Motero/releases)** als `Motero_Build<Nummer>.apk`. Die öffentliche Variante benötigt **Android 9 oder neuer**, ist nicht debuggbar und wird mit einem privaten Motero-Schlüssel signiert. Der öffentliche Prüf-Schlüssel und die Update-Rotation sind in [signing/](signing/) dokumentiert.

Die Paketkennung bleibt `org.zotero.android.debug`. Für bestehende Motero-Testinstallationen wird der Übergang vom alten Testschlüssel durch Androids signierte Zertifikatsrotation vorbereitet. Rückwechsel auf den bekannten Testschlüssel werden nicht erlaubt. Die Rotation erhält die Berechtigung zum Übernehmen vorhandener App-Daten; eine tatsächliche Update-Installation auf BOOX/GrapheneOS muss gesondert geprüft werden. Vor dem ersten Wechsel eigene Daten sichern.

Die bisherigen APKs 303/305 verwenden einen öffentlich bekannten Debug-Schlüssel. Sie sind keine sicheren öffentlichen Installationspakete und werden nicht als reguläre öffentliche Releases angeboten. Entwicklungsbuilds dürfen nicht als Ersatz für produktionssignierte Updates verwendet werden. Details: [SECURITY.md](SECURITY.md).

Bei einem privaten Repository musst du auf GitHub angemeldet sein. Obtainium kann das Repository mit Leseberechtigung als GitHub-Quelle verwenden; der APK-Dateifilter ist `Motero_Build.*\.apk`. Zugangsdaten gehören ausschließlich in die lokale App-Konfiguration.

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

Bei Änderungen an der App oder am eingebundenen Reader wird `BuildConfig.versionCode` erhöht. Der GitHub-Workflow baut und testet `main` und Pull Requests. Ein neuer Build auf `main` wird nach erfolgreichen Prüfungen und ausschließlich mit vorhandenem privaten Signierschlüssel als Release mit APK, vollständigem Quellarchiv, Prüfberichten und SHA-256-Summen angelegt. Fehlt die sichere Signierung, stoppt die Veröffentlichung; es gibt keinen Rückfall auf den Debug-Schlüssel. Bereits vorhandene Releases werden nicht überschrieben. Details: [Release-Ablauf](docs/RELEASING.md).

Build 306: **276 Reader-Tests, 109 Android-Tests in 25 Suiten, zehn Browserprüfungen und fünf Veröffentlichungs-/Signierprüfungen bestanden**. Die private Signierung und der automatische GitHub-Release wurden erfolgreich ausgeführt; die tatsächlich heruntergeladene APK ist erneut geprüft. [Release und Nachweise](https://github.com/OptikerGerhardt/Motero/releases/tag/v1.0.0-306). Die Original-Plessner-Prüfung wurde lokal ebenfalls durchgeführt. Physische BOOX-/Smartphone-Tests, die tatsächliche BOOX-Tastatur und echter Kontosync sind im automatisierten Testlauf nicht enthalten.

## Herkunft und Lizenz

Motero basiert auf [Zotero für Android](https://github.com/zotero/zotero-android) und [Zotero Reader](https://github.com/zotero/reader). Der abgeleitete Anwendungscode wird unter **GNU AGPLv3** weitergegeben, entsprechend den Upstream-Bedingungen. Die ursprünglich im leeren Repository gewählte Apache-Lizenz war für den später übernommenen Zotero-Code nicht die passende Projektlizenz.

Siehe [LICENSE](LICENSE), die erhaltenen Upstream-Hinweise in [COPYING](COPYING) und [NOTICE.md](NOTICE.md). Abhängigkeiten behalten ihre jeweiligen Lizenzen. „Zotero“ ist eine Marke der Corporation for Digital Scholarship; „Motero“ kennzeichnet diesen unabhängigen Fork.

Fehler und Vorschläge zu Motero bitte in [diesem Repository](https://github.com/OptikerGerhardt/Motero/issues) melden. Hinweise zum Mitmachen stehen in [CONTRIBUTING.md](CONTRIBUTING.md).
