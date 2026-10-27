# Build 292: Prüfstand

Reader und Quellcode für direktes Markieren und Fit to Width sind fertig. Der vollständige Android-Build ist noch in Arbeit; eine neue APK wurde zu diesem Zwischenstand nicht ausgeliefert.

- 205 Reader-Tests bestanden.
- Touch-Test mit echtem PDF-Rendering: langes Drücken und Weiterziehen speichert genau eine Hervorhebung ohne native Auswahlgriffe; schnelles Wischen scrollt; Stifteingabe funktioniert.
- Fit to Width überschreibt beim Öffnen einen gespeicherten Zahlenzoom und passt sich an eine veränderte Bildschirmbreite an.
- Umschalten auf die native Android-Textauswahl geprüft.
- Multitouch verwirft die Markierung, bleibt anschließend bedienbar und wird an die bestehende PDF.js-Pinch-Verarbeitung weitergegeben. Eine tatsächliche Skalenänderung wurde in der Simulation auch ohne die neue Markiergeste nicht erreicht.
- Source-Map des gebauten Readers entspricht exakt allen geänderten Reader-Quelldateien.
- Reader-ZIP SHA-256: `1ac05f61c078b7f94875050436efe940d541a6dbcbb6b2a165b5c85efad77c1b`.
- Vorgesehene App-ID `org.zotero.android.debug`, Version-Code 292.
- Der gesicherte Debug-Schlüssel stimmt exakt mit dem Zertifikat der vorherigen SmartScroll-APK überein. Deren Zertifikat SHA-256: `c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299`.

Nicht auf einem echten Android-/Boox-Gerät getestet: Installation als Update, E-Ink-Verhalten, neue Markiergeste, tatsächlicher Pinch-Zoom.
