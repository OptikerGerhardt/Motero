# Build 305: frische Nachweise

Die Protokolle stammen aus dem aktuellen Quellstand. android-build.log enthält native Tests und APK-Bau; android-final-packaging.log dokumentiert denselben abschließenden Build-Aufruf. native-tests.json wurde aus den JUnit-XML-Ergebnissen gebildet. reader-full-tests.log zählt tatsächliche Einzeltests. Die zehn browser-*.log enthalten die Browserprüfungen. apk-verification.json prüft die neue APK gegen Build 304 einschließlich Paket/Signierer, ZIP-Ausrichtung, unveränderten Laufzeit-/PDF.js-Dateien und aktuellen eingebetteten Quellen. baseline-* dokumentiert den vorherigen Stand.

Kein physischer Geräte-, BOOX-Tastatur- oder Kontosync-Test. Der vollständige Zuschnitt-Editor ist nur für PDF verfügbar; die bestehenden EPUB-Prüfungen bleiben erhalten. Original-Plessner wurde erneut mit 116 Seiten und 19 Quellenlabels geprüft; frühere Original-Kant-/Höffe-/Fuchs-/Mul-Dateien lagen nicht vor, ihre vorhandenen synthetischen Regressionen wurden ausgeführt.
