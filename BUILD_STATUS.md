# Build 292: Prüfstand

Die neue APK wurde erfolgreich gebaut und geprüft. Sie enthält direktes Markieren durch Halten und Ziehen sowie Fit to Width. Die bisherigen SmartScroll-Änderungen bleiben enthalten.

## APK und Update-Kompatibilität

- App-ID: `org.zotero.android.debug`.
- Version: `1.0.0-292`, Version-Code 292 (vorher 291).
- Dateigröße: 197,279,527 Bytes.
- APK SHA-256: `0257faefcfb33d459357f878e7ea8efc961ac02fb3955f9e93d4a892ba899d41`.
- Android APK Signature Scheme v2 erfolgreich geprüft; ein Signierer.
- Zertifikat SHA-256: `c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299`. Es stimmt exakt mit der zuvor ausgelieferten SmartScroll-APK überein.
- Reader-ZIP SHA-256: `1ac05f61c078b7f94875050436efe940d541a6dbcbb6b2a165b5c85efad77c1b`. Die enthaltenen Reader-Bytes und ihr Hash stimmen mit den lokal gebauten Assets überein und unterscheiden sich von der alten APK.
- Alle sechs geänderten Reader-Quelldateien stimmen exakt mit der Source-Map in der APK überein. Die nativen DEX-Dateien enthalten die neuen Einstellungsfelder und Bridge-Methoden.
- APK- und Reader-ZIP-Integrität geprüft. Maschinell lesbare Prüfdaten: `BUILD_VERIFICATION.json`.

Die APK über die installierte Zotero-Debug-App installieren, ohne diese vorher zu deinstallieren. Gleiche App-ID und Signatur sowie die höhere Version erfüllen die Android-Voraussetzungen für ein Update unter Erhalt der App-Daten. Ein Installationstest auf dem physischen Gerät wurde nicht durchgeführt.

## Funktionsprüfungen

- 205 Reader-Tests bestanden.
- Touch-Test mit echtem PDF-Rendering: langes Drücken und Weiterziehen speichert genau eine Hervorhebung ohne native Auswahlgriffe; schnelles Wischen scrollt; Stifteingabe funktioniert. Hervorhebungen im gerenderten PDF sichtbar geprüft.
- Fit to Width überschreibt beim Öffnen einen gespeicherten Zahlenzoom und passt sich an eine veränderte Bildschirmbreite an.
- Umschalten auf die native Android-Textauswahl und Doppeltippen zum Zoomen geprüft.
- Multitouch verwirft die Markierung, bleibt anschließend bedienbar und wird an die bestehende PDF.js-Pinch-Verarbeitung weitergegeben. Eine tatsächliche Skalenänderung wurde in der Simulation auch ohne die neue Markiergeste nicht erreicht.

## Build-Verlauf

Kotlin und Java wurden für diesen unveränderten Quellcode erfolgreich kompiliert. Danach brach die Verbindung zur Ausführungsumgebung während der DEX-Verarbeitung ab; die vollständigen Klassen blieben erhalten. Der abschließende Offline-Build verwendete diese geprüften Klassen und schloss die bereits erledigten Codegenerierungs- und Compiler-Tasks explizit aus. DEX-Erzeugung, Ressourcenverarbeitung, Paketierung und Signieren wurden durch Gradle abgeschlossen (`BUILD SUCCESSFUL`). Ein vollständiger Neubau ist mit `scripts/build_boox_debug.sh` möglich; dieser schließt keine Compiler-Tasks aus.

Nicht auf einem echten Android-/Boox-Gerät getestet: Installation als Update, E-Ink-Verhalten, neue Markiergeste, tatsächlicher Pinch-Zoom und Erhalt der Anmeldung auf dem Gerät.
