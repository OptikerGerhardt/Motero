# Geprüfter Stand

Die Test-APK wurde erfolgreich gebaut: `assembleDevDebug`, Gradle 9.6.1, JDK 17, Android SDK 37.0. Der erfolgreiche zweite Build dauerte 2m 43s. Beim ersten Build wurde ein alter, unbenutzter Reader-Cache-Verweis aus dem ursprünglichen PR erkannt und anschließend entfernt.

- Datei: `Zotero_Boox_SmartScroll_Test.apk`
- Größe: 197287255 Bytes
- SHA-256: `8bb116e4260a354f5c3ecb4635f0fc101e380f28e968df13b83913d5b32e2826`
- App-ID: `org.zotero.android.debug`; Name: `Zotero Debug`
- Version: `1.0.0-291`, Version-Code 291
- Mindest-API: 23; Ziel-API: 36
- ARM64 für den Boox sowie ARMv7/x86/x86_64 enthalten
- APK-Signaturprüfung erfolgreich, v2-Signatur gültig
- Derselbe öffentliche Debug-Signierschlüssel wie in der ersten Testversion
- ZIP-Integrität und exakte Übereinstimmung des eingebundenen Readers mit dem lokalen Build geprüft
- Der im APK-Source-Map enthaltene Smart-Scroll-Modultext entspricht exakt dem getesteten Quellcode
- Neue Scroll-Einstellungen und native Lifecycle-Anbindung sind in DEX enthalten
- Alle 196 Reader-Tests bestanden

Am realen Boox noch nicht getestet: Installation, Login/Synchronisation, physische Tasten, E-Ink-Reaktionszeit und Flackern. Kein Android-Gerät ist mit dieser Arbeitsumgebung verbunden.

Bedienung: Settings > Page turning aktivieren; Scrollschritt ⅓, ½, ⅔ oder 1 wählen. Standard ist ⅔; "Seite" schaltet auf direktes Umblättern. Die Boox-Tasten auf Lautstärke oder Umblättern stellen. Siehe BUILD_BOOX.md für Details und Bauanleitung.
