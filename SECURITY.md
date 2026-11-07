# Sicherheit und Test-Signierung

Motero ist derzeit ein privater Entwicklungsfork. Berichte zu Schwachstellen oder versehentlich enthaltenen Zugangsdaten bitte vertraulich über GitHubs „Report a vulnerability“ melden, sofern verfügbar. Keine Tokens, Passwörter oder privaten PDFs in öffentliche Issues schreiben.

## Bestehende Testversion

Die APKs verwenden `org.zotero.android.debug` und denselben **öffentlichen Zotero-Debug-Schlüssel** wie die bereits installierte Testversion. Die Datei ist bytegleich zur öffentlich verfügbaren Upstream-Datei. Das erhält die Update-Kompatibilität, ist jedoch keine geschützte Produktionssignierung.

Zertifikat-SHA-256:

```
c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299
```

APKs über die Releases dieses Repositorys beziehen und die bereitgestellten SHA-256-Summen vergleichen. Ein eigener geheimer Produktionsschlüssel wäre eine separate Migration; dieser Schritt wird hier nicht stillschweigend vorgenommen. Das Repository wird durch den Release-Workflow nicht öffentlich geschaltet.

## Zugangsdaten

Für den normalen Testbuild werden keine neuen Secrets benötigt. Der Release-Workflow verwendet das von GitHub bereitgestellte `GITHUB_TOKEN` mit Schreibrecht nur im Veröffentlichungsjob. Private Signierschlüssel, Kontotokens, OAuth-Zugangsdaten und persönliche Dokumente gehören außerhalb des Repositorys.
