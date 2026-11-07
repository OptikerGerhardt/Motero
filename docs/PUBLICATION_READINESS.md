# Vorbereitung einer öffentlichen Freigabe

Stand: 7. November 2026. **Die Repository-Sichtbarkeit wurde nicht geändert.** Der überprüfte Quellstand ist für eine öffentliche Bereitstellung vorbereitet. Automatische signierte GitHub-APKs benötigen noch das einmalige private Actions-Secret. Dies ist eine Prüfung auf versehentliche Offenlegung und sichere Release-Konfiguration, keine unabhängige vollständige Schwachstellenprüfung.

## Durchgeführte Prüfung

| Bereich | Ergebnis und Umfang |
| --- | --- |
| Git-Historie | Alle von den GitHub-Branches `main`/`reader` und den vorhandenen Tags `Release`/`v1.0.0-305` erreichbaren Objekte geprüft: 35.481 Objekte, 13.691 Datei-Blobs, 235.300.386 Bytes im Ausgangsstand. Die ursprünglichen importierten Bundle-Historien sind darin vollständig enthalten. |
| Bekannte Geheimnismuster | GitHub-/AWS-/Slack-Zugänge, private PEM-Schlüssel, Google-Service-Accounts, private Signier-Payloads und sensible Dateinamen geprüft. Keine ungeklärten Treffer. |
| Alte Keystores | Zwei Treffer (`debug.keystore` und historisch `app/zotero.temp.keystore`) sind bytegleich öffentlichen Zotero-Upstream-Blobs. Ausnahmen sind nur für ihre exakten SHA-256-Werte erlaubt; siehe `scripts/publication-exceptions.json`. Sie sind für öffentliche APKs verboten. |
| Weitere öffentliche Konfiguration | `app/google-services.json` ist unverändert öffentlich aus Zotero übernommen, keine private Service-Account-Datei. Die öffentliche Motero-Variante deaktiviert Event-/Crash-Reporting. Upstream-Konfiguration ist keine eigene private Infrastruktur. |
| Release-Anhänge | Alle acht ursprünglichen Anhänge einschließlich Server-Hash und Bytezahl gesichert; 22.822 Archiveinträge bzw. 1.156.890.004 entpackte Bytes einschließlich verschachtelter ZIP/APK-Inhalte geprüft. Keine ungeklärten Treffer. Das beschädigte ursprüngliche Import-ZIP wurde über die zuvor CRC-geprüfte Wiederherstellung untersucht; Originalbytes bleiben erhalten. Git-Bundle-Inhalte sind über die Git-Historienprüfung abgedeckt. |
| Persönliche Daten | Keine gelieferte Seminar-PDF oder eingefügten privaten Textdateien im geprüften Quellen-/Anhangsbestand gefunden. Nicht-Noreply-Autorenmetadaten stammen nachweisbar aus öffentlichen Upstream-Commits; die zusätzliche synthetische lokale Adresse ist kein privates Mailkonto. Die ursprüngliche Urheberschaft bleibt erhalten. |
| Alte installierbare Test-APKs | Beide bisherigen Releases (`Release`, `v1.0.0-305`) sind Entwürfe. Ihre acht Assets und Tags bleiben unverändert erhalten. Das frühere CI-Artefakt `motero-build-305` mit der debug-signierten APK wurde nach Sicherung seiner identischen Release-Dateien gelöscht. |
| Lizenz und Anerkennung | AGPLv3, ursprüngliche Copyright-Hinweise und Drittanbieter-Lizenzen erhalten. README nennt die ChatGPT-/Codex-Unterstützung und würdigt Zotero/Android/Reader. Übernommene PRs mit geprüftem Originalstatus: `UPSTREAM_CHANGES.md`. |

Nachweise: `qa/build306/publication-history-and-archives.json`. Der wiederholbare Guard `scripts/audit_publication.py` prüft erreichbare Git-Historien und verschachtelte Release-Archive, ohne gefundene Geheimniswerte auszugeben. Der Workflow prüft zusätzlich den neuen Quellstand und das vollständige Quellarchiv samt Submodulen. Ausnahmen werden an Dateiinhalt gebunden, nicht allein an Dateinamen. Unbekannte Dateiformate, beliebige Passwörter und alle denkbaren personenbezogenen Inhalte sind durch solche Musterprüfungen nicht vollständig erfassbar.

## Öffentliche Signieridentität ab Build 306

Der private Motero-Schlüssel liegt ausschließlich außerhalb von Git. Im Repository stehen nur Zertifikat und öffentlicher Rotationsnachweis. Der geprüfte lokale Build ist nicht debuggbar, setzt Android 9+ voraus und nutzt V3-Signierung mit dem festgeschriebenen privaten Motero-Zertifikat. Der alte öffentliche Testschlüssel erhält nur die Berechtigung zur Datenübernahme, keine Rollback-, Shared-UID-, Signature-Permission- oder Authenticator-Berechtigung.

Die tatsächliche APK-Signatur und ihre Rotation wurden mit Android Build Tools für API 28, 32, 33 und 36 geprüft. Manifest, Version, ZIP-Ausrichtung, 45 Runtime-Dateien, 207 PDF.js-Dateien und 92 aktuelle Reader-Quellen sind geprüft. Negativtests weisen fehlende Secrets und den öffentlichen alten Signierer zurück. Nachweis: `qa/build306/local-apk-verification.json`.

Die GitHub-CI baut ohne privaten Schlüssel und bewahrt nur eine unsignierte, nicht installierbare APK sowie Quellen/Prüfberichte auf. Nur der Release-Job für `main` erhält den Schlüssel. Er veröffentlicht erst nach erneuter Signatur- und Inhaltsprüfung. Pull Requests erhalten keine Signiersecrets. Ohne Secret gibt es keinen installierbaren Release und keinen Debug-Fallback.

## Noch erforderlich

1. **Besitzer: private Schlüsselsicherung herunterladen und sicher verwahren.** Danach einmal das Repository-Actions-Secret **`MOTERO_RELEASE_SIGNING`** aus der privaten JSON-Datei einrichten. Die aktuelle GitHub-Verbindung verweigert den Zugriff auf die Secrets-API mit HTTP 403; sie kann diesen Schritt nicht ausführen. Der genaue Klickpfad steht in [RELEASING.md](RELEASING.md). Private Schlüssel niemals in Chat, Git, Issues oder Release-Anhänge kopieren.
2. **Geräteprüfung:** Update von der alten Test-APK auf dem konkreten BOOX-/GrapheneOS-Gerät und Erhalt vorhandener Daten prüfen. Die kryptografische Prüfung ersetzt die Installation nicht. Vor dem ersten Wechsel Daten sichern. Android 6–8 werden durch die neue öffentliche Variante nicht unterstützt.
3. Die Sichtbarkeit entscheidet der Besitzer ausdrücklich. Die Vorbereitung allein veröffentlicht weder Repository noch Cloud-Umgebung. Neue Dateien, Tags, Releases und Abhängigkeitsänderungen müssen weiterhin geprüft werden; alte Debug-Releases dürfen nicht wieder öffentlich freigeschaltet werden.
