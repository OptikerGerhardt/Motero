# Herkunft, Urheberrecht und Lizenzen

Motero enthält abgeleiteten Code aus Zotero für Android und Zotero Reader. Die vorhandenen Copyright-Hinweise und die AGPLv3-Bedingungen der Corporation for Digital Scholarship bleiben erhalten; siehe `COPYING`, `reader/COPYING` und die Hinweise in den jeweiligen Quelldateien. Die ursprünglichen Autoren werden durch die Fork-Anpassungen nicht ersetzt.

- Android: https://github.com/zotero/zotero-android
- Reader: https://github.com/zotero/reader
- PDF.js: https://github.com/zotero/pdf.js — Apache-2.0 und die enthaltenen Drittanbieter-Lizenzen.
- EPUB.js: https://github.com/zotero/epub.js — BSD-Lizenz, siehe dort enthaltene Lizenz.
- Übersetzungen, Übersetzer, Citation-Styles, Utilities und Document-Worker: auf die exakten Quellstände festgeschriebene Submodule in `.gitmodules` und `reader/.gitmodules`; ihre jeweiligen Copyright- und Lizenzdateien bleiben maßgeblich.

Die Android-/Reader-Historien enthalten die wiederhergestellten Motero-Anpassungen. `qa/` und `FEATUREPLAN.md` dokumentieren Teststände und Änderungen. Die neue Entwicklung ist in getrennten Commits nachvollziehbar.

Die mobile PDF.js-Distribution unter `vendor/pdfjs-mobile.zip` stammt unverändert aus dem verifizierten Testbuild; Herkunft und Dateihashes sind in `vendor/pdfjs-mobile.json` festgehalten. Die zugehörigen PDF.js-Quellen sind im Reader-Submodul `pdfjs/pdf.js` auf Commit `3ec7e00205d95c512a8d74fefee5228611416d46` festgeschrieben. Das Archiv erhält die enthaltenen Lizenzdateien. Weitere mitgelieferte Laufzeitpakete sind in `vendor/runtime-assets.json` verzeichnet; die ursprünglichen Bundle-Skripte und gepinnten Quell-Submodule bleiben verfügbar.

Die öffentlich im Zotero-Upstream mitgelieferten Dateien `debug.keystore` und `app/google-services.json` wurden unverändert beibehalten. Der Debug-Schlüssel ist ausdrücklich kein geheimer Produktionsschlüssel. Eigene Zugangsdaten, private Signierschlüssel und persönliche Dokumente werden nicht benötigt oder hinzugefügt.

Die Verwendung der Zotero-Quellen gewährt keine Rechte an Zotero-Marken. Motero ist ein unabhängiger Fork und kein offizielles Zotero-Produkt.
