# Build 294: Prüfstand

Die beauftragten Layoutkorrekturen, die direkte Abwahl nach Done, feste Bookmark-Position mit erweiterter Touchfläche und die Lesekante mit 50 % Deckkraft sind umgesetzt. Fit to Content, Fit to Width und gerade/ungerade Ausrichtung bleiben unverändert.

| Prüfung | Ergebnis |
|---|---|
| Paketkennung | `org.zotero.android.debug` |
| Version | `1.0.0-294` / 294 |
| Bisherige Version | 293 |
| Zertifikat SHA-256 | `c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299`; identisch zur bisherigen APK |
| APK SHA-256 | `9d3e5a05e47a9a85fdcf976a534adaa06c3eac859249b2c6411bd3fe681f298c` |
| Größe | 197,326,767 Bytes |
| Reader SHA-256 | `f110fb9463d033cf202feb16ca8907732287dd279f228f5645f1b8ddbb66ca75` |
| Reader-Tests | 206 bestanden |
| Android-Tests | 70 bestanden, 0 übersprungen; darin 6 Reader-Logiktests |
| Browserprüfungen | bestanden: Gesten, erneutes Öffnen nach Auswahl-Abwahl, 50 % Deckkraft, feste Bookmark-Position, Randtipp, Drehung, Wiederherstellen/Löschen und Wrapped-Rückkehr |
| Laufzeitdateien/Bibliotheken | 88 bytegleich zur Basis |
| Dateieinträge der APK | keine entfernt oder hinzugefügt |
| Anpassungsfunktionen und PDF.js | byte- bzw. quelltextgleich zur Basis geprüft |
| DEX-Dateien | 8 |
| APK-Signatur und ZIP-Ausrichtung | geprüft, inklusive 16-KiB-Ausrichtung nativer Bibliotheken |
| Installation und native Darstellung auf physischem BOOX | hier nicht geprüft |

Die APK als Update installieren und vorher nicht deinstallieren. Paketkennung, Signatur und höherer Versionscode wurden direkt an beiden APKs kontrolliert. Datenbankschema und Anmeldedaten-Verwaltung wurden nicht geändert.

Die native Oberfläche ist kompiliert. Echte Fensterdarstellung, Geräte-Login nach Installation und Android-/Desktop-Sync sind nicht am Gerät geprüft. Der Browser prüft die Auswahl-Abwahl über denselben Reader-Aufruf, der vom nativen Schließhandler verwendet wird; dies ersetzt keinen vollständigen Gerätetest des Dialogs.

Für den vollständigen Android-Testlauf wurde der bereits vorhandene MockK-/ByteBuddy-Testagent beim JVM-Start geladen, weil dynamisches Self-Attach in dieser Ausführungsumgebung scheitert. Danach bestanden alle 70 Tests ohne Überspringen; dafür wurde kein Anwendungscode geändert. Dies betrifft ausschließlich den Testprozess, nicht die ausgelieferte APK.
