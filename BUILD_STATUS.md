# Motero Build 297: geprüfter Stand

Alle folgenden Ergebnisse beziehen sich auf die ausgelieferte APK.

| Eigenschaft | Ergebnis |
|---|---|
| Name | Motero |
| Paket | org.zotero.android.debug |
| Version | 1.0.0-297 / Code 297 |
| Vorgänger | Build 296 |
| APK-Größe | 197510737 Bytes |
| APK SHA-256 | 3567847489b7fa16ff41cc0071da25f84eadf6dd8073d1073247c0ecf4e4451c |
| Zertifikat SHA-256 | c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299 |
| Reader SHA-256 | de4091774a0ce14172585f9be717338757d30c6c5df40696c43fc9345821bd20 |
| Reader-Tests | 233 bestanden, 0 Fehler/Abbrüche/übersprungen |
| Native Tests | 73 bestanden, 0 übersprungen |
| Browser | Funktionen, Gesten, Fits einschließlich Original-Mul und neue Stabilitätsprüfung bestanden |
| Eingebettete Quellen | 9 direkt gegen Source Map geprüft; CSS bytegleich zum geprüften Build |
| Weitere Laufzeitdateien | 88 bytegleich zur bisherigen APK |
| PDF.js | Vollständig bytegleich zur bisherigen APK |
| APK-Dateinamen | Identisch zur bisherigen APK; 8 DEX-Dateien |
| Update | Gleiche Paketkennung und Signierer, Versionscode erhöht, v2-Signatur geprüft |
| Ausrichtung | ZIP einschließlich 16-KiB-Nativbibliotheken geprüft |

Mit aktivem Fit wird die Zielgeometrie vor der Navigation vorbereitet und zusammen mit dem Seitenwechsel gesetzt. Die Browserprüfung zeichnet bei einem künstlich verzögerten uncached Seitenwechsel keine ungepasste Zwischenposition auf. Neue Eingabe verwirft die wartende Navigation. Eine schwebende obere Leiste und feste PDF-Systemleisten-Inset-Geometrie vermeiden Änderungen der WebView-Höhe. Die native Darstellung wurde nicht am physischen Gerät geprüft.

Löschen bereinigt Auswahl, Pointer/Drag und passendes natives Fenster. Original-Zotero-Farben ohne schwarze Kästen, Pointer-Spitze und Highlight/Underline-Wahl sind umgesetzt. Die reguläre Typkonvertierung legt eine neue Annotation an und löscht die alte ID; Tags, Kommentare und Text werden im Browser geprüft. Der native Bridge-Pfad verwendet vorhandene Erstellen-/Löschlogik.

Bookmarks nutzen den ungerandeten Inhaltsrahmen unabhängig vom aktiven Fit. Erneuter Shortcut passt nur die ausgewählte bearbeitbare datierte Notiz an; andere und schreibgeschützte Notizen bleiben unverändert. Die Position wird auch bei Rotation geprüft. Ein Bild-PDF ohne Textschicht mit neutralgrauem Papier und Fußnotenzeilen wird zugeschnitten; Farbbilder und ein graues Foto ohne Zeilenbänder bleiben konservativ. Kein OCR-Verfahren und keine garantierte Metadaten-Erkennung bei Scans.

Kein physischer BOOX angeschlossen. Installation/Login auf dem Zielgerät, E-Ink-Reaktion, tatsächliche Pinch-Skalenänderung auf dem Gerät und Kontosynchronisation sind hier nicht geprüft. Fit ändert die Ansicht, nicht die PDF-Datei. Manueller Zuschnitt, Randtippen in allen Modi und Autocomplete bleiben offen.

Der erste native Kompilierlauf erkannte einen JSON-/String-Typfehler in der neuen Fensterbereinigung; er wurde vor dem erfolgreichen Test-/APK-Lauf korrigiert. Ein fehlgeschlagener JDK-Image-Transform wurde aus dem erzeugten Cache entfernt; der finale Lauf verwendet keinen Gradle-Konfigurationscache. Das schwächt keine App-Prüfung oder Bibliothek ab. ByteBuddy-Vorabladung betrifft ausschließlich die Test-JVM.

Details: BUILD_BOOX.md, BUILD_VERIFICATION.json und qa/.
