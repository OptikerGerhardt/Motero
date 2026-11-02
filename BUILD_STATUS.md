# Motero Build 300: geprüfter Stand

| Eigenschaft | Ergebnis |
|---|---|
| Name / Paket | Motero / org.zotero.android.debug |
| Version | 1.0.0-300 / Code 300 |
| Vorgänger | Build 299 |
| APK-Größe | 105586377 Bytes; vorher 197392898 Bytes |
| APK SHA-256 | 991ef9c091a8103e8de33419503558201f5a47868628d75650a2e7620d4b71ea |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | 70b48326c574f85535f393454f8d70c68d9de9df42ac35bda82e26aa5e181fd1 |
| Reader-Tests | 250 bestanden, 0 Fehler, 0 übersprungen |
| Native Tests | 78 bestanden, 0 Fehler, 0 übersprungen; 17 Suiten |
| Browser | Funktionen, Gesten, Fits, Stabilität und Reader-Bedienelemente bestanden |
| Konkrete PDFs | Höffe 26/27, 191/192; Kant 369/370, 380/381 |
| Aktiver Reader | Vollständiges Reader-ZIP bytegleich zu Build 299; 212 Reader-Quelldateien unverändert |
| Aktive native Daten-/Reader-Pfade | 396 Dateien unverändert, lediglich erforderliche Importumzüge bei gemeinsamen UI-Helfern normalisiert |
| Weitere APK-Laufzeitdateien | 57 bytegleich zu Build 299, einschließlich Netzwerkdaten und übriger nativer Bibliotheken |
| Entfernte SDK-Laufzeitdateien | 31; zusätzlich SDK-Ressourcen, Manifest-Einträge und Klassen entfernt |
| DEX / Paketstruktur | 7 DEX-Dateien; Dateiliste wegen SDK-Entfernung erwartungsgemäß verkleinert |
| Abhängigkeiten | Aufgelöster devDebugRuntimeClasspath ohne PSPDFKit/Nutrient |
| Motero-M | Beide Vektoren und alle fünf Rasterdichten geprüft und erhalten |
| Update | Identisches Paket und Zertifikat, erhöhter Code, v2-Signatur und 16-KiB-ZIP-Ausrichtung geprüft |

Die APK lässt sich technisch als Update derselben Test-App zuordnen. Vorher nicht deinstallieren. Der bisherige Debug-Schlüssel und alle Speicherpfade bleiben erhalten; weder Datenrücksetzung noch Änderung des Realm-/Annotations-/Syncformats wurde eingeführt. Tatsächliche Installation und Kontositzung am BOOX wurden hier nicht geprüft.

PSPDFKit/Nutrient ist vollständig aus der ausgelieferten App entfernt. Der aktive PDF.js-Reader und die in Build 299 ergänzten Zuschnitt-/Breitenoptionen bleiben unverändert. Die bestehenden Funktionen einschließlich SmartScroll, aller Fit-Modi, Wrapped-Übersicht, direktes Markieren, Highlight/Underline, Farbpalette, Kommentare/Tags, Quick Tags, Bookmarks, Lesekante mit 50 % Deckkraft, Floating Toolbar/Sidebar und Vollbild bleiben auf demselben Stand.

Gemeinsame SDK-Typen sind durch neutrale Zotero-/AndroidX-Typen ersetzt. Die vier neuen JVM-Regressionstests prüfen alle sechs Annotationsarten, Identität/Inhalt/Zeiten und rohe Geometrie, Originalfarben/Alpha/Blend-Modi sowie locale-unabhängige Sortierindizes. WebKit 1.11.0 und Compose Material 1.6.8 werden direkt eingebunden; die APK bestätigt genau die Versionen aus Build 299.

F19 Tag-Autocomplete, F22 manueller Zuschnitt All/Odd/Even, F23 Randtippen und optionale Stifterweiterungen bleiben als nächste unabhängige Aufgaben im Featureplan. Ihre Reader-, TagPicker-, Pointer- und Worker-Pfade sind erhalten. SDK-Freiheit und unveränderter Reader werden in der APK-Prüfung über getrennte Optionen geprüft, damit spätere Reader-Änderungen möglich bleiben.

Kein physischer BOOX, echte E-Ink-Reaktion oder tatsächlicher Android-/Desktop-Kontosync geprüft. Original-Mul liegt hier nicht erneut vor; dafür wird kein neuer konkreter Test behauptet. Die Heuristiken zur Randklassifikation bleiben unverändert und können bei unbekannten PDFs mehrdeutig sein.

Details: BUILD_BOOX.md, SDK_REMOVAL.md, BUILD_VERIFICATION.json und qa/ einschließlich der JUnit-Berichte. ByteBuddy wird ausschließlich für JVM-Tests vorgeladen. Regulärer nativer Build, kein DEX-Patching. Keine öffentliche Veröffentlichung beauftragt.
