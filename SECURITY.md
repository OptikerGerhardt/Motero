# Sicherheit, öffentliche Freigabe und Signierung

Motero bleibt privat, bis der Betreiber die Sichtbarkeit ausdrücklich ändert. Der öffentliche Code wird auf bekannte Zugangsdatenmuster, private Dokumente und sensible Dateien geprüft; auch Historie und alte Release-Anhänge werden berücksichtigt. Der konkrete Prüfstand steht in `docs/PUBLICATION_READINESS.md`. Eine solche Prüfung ersetzt keine vollständige Schwachstellenanalyse.

## Öffentliche APKs ab Build 306

Öffentliche Installationspakete müssen nicht debuggbar sein, mindestens Android 9/API 28 erfordern und mit dem privaten Motero-Schlüssel aus `signing/release-policy.json` signiert sein. Geprüft werden Paketkennung, Code, V3-Signatur, Zertifikat, Runtime-/PDF.js-Hashes und die eingebetteten Reader-Quellen. Ein fehlendes oder falsches Secret stoppt die Veröffentlichung; der bekannte Debug-Schlüssel ist kein Ersatz.

Die private Sicherung wird außerhalb des Repositorys erstellt. Für GitHub Actions wird ausschließlich das Repository-Secret `MOTERO_RELEASE_SIGNING` verwendet. Der öffentliche Ordner `signing/` enthält keinen privaten Schlüssel.

## Übergang von den bisherigen Test-APKs

Die APKs bis 305 waren mit dem öffentlichen Zotero-Debug-Schlüssel signiert. Diese Identität ist für eine geschützte öffentliche Verteilung ungeeignet. Die alten Releases werden als Entwürfe archiviert; alte CI-Artefakte mit installierbaren Test-APKs werden nach gesicherter Archivierung entfernt.

Die Paketkennung bleibt `org.zotero.android.debug`. Ein signierter Rotationsnachweis erlaubt Android 9+ den Wechsel zum privaten Schlüssel unter Übernahme vorhandener App-Daten. Das alte Zertifikat erhält keine Rollback-Berechtigung und kann eine bereits umgestellte Installation nicht wieder durch ein altsigniertes Update ersetzen. Android 6–8 werden von diesen öffentlichen APKs nicht mehr unterstützt. Die tatsächliche Installation und Datenübernahme auf einem physischen Gerät sind gesondert zu prüfen.

## Meldungen und Zugangsdaten

Schwachstellen oder versehentlich enthaltene Zugangsdaten vertraulich über GitHubs „Report a vulnerability“ melden, sofern verfügbar. Keine Tokens, privaten Schlüssel, Passwörter oder persönlichen PDFs in öffentliche Issues schreiben.

Die mitgelieferte ältere Datei `debug.keystore` ist unverändert öffentlich aus Zotero übernommen und nur für lokale Entwicklungs-/Negativtests vorgesehen. Ein historischer temporärer Keystore wurde ebenfalls als identischer öffentlicher Upstream-Inhalt nachgewiesen. Keine dieser Identitäten ist als öffentlicher Motero-Release-Signierer zugelassen.
