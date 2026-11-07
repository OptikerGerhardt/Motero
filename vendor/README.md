# Mitgelieferte Laufzeitpakete

Der Motero-Reader wird aus seinem eigenen Quellcode gebaut. Die unveränderte mobile PDF.js-Distribution ist separat als `pdfjs-mobile.zip` enthalten, damit ein sauberer Build nicht auf einen privaten Zotero-Buildserver oder einen nicht verfügbaren Motero-Commit angewiesen ist. `pdfjs-mobile.json` enthält Quellcommit, Archivhash und Hash jedes Eintrags; `scripts/prepare_reader_assets.py` prüft und entpackt sie vor Webpack.

`runtime-assets.json` erfasst die unveränderten Android-Laufzeitdateien des geprüften Build 305. Diese Dateien werden einmalig im Repository gespeichert. Die zugehörigen öffentlichen Quellstände sind als Submodule festgeschrieben; die bestehenden `scripts/bundle_*`-Skripte dokumentieren den ursprünglichen Paketierungsweg. Kein Anspruch auf bytegenau reproduzierbare APKs wird daraus abgeleitet.

Bei einem bewussten Abhängigkeitsupdate Quellen, Lizenzen, Pakete und Manifest gemeinsam aktualisieren und die Reader-/Android-Regressionen erneut ausführen. Normale Motero-Reader-Änderungen benötigen kein PDF.js- oder Runtime-Update.
