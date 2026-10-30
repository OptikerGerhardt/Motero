# Motero Build 295: Prüfstand

Die Quick-Tag-Grenzen reichen jeweils einen halben Mittelpunktabstand über die äußerste Highlight-Farbe hinaus. Der erste folgende Tipp auf ein Highlight öffnet nach der Farbwahl wieder das Annotationsfenster. Der sichtbare Android-App-Name ist Motero.

| Prüfung | Ergebnis |
|---|---|
| App-Name | `Motero` |
| Paketkennung | `org.zotero.android.debug` |
| Version | `1.0.0-295` / 295 |
| Bisherige Version | 294 |
| Zertifikat SHA-256 | `c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299`; identisch zur bisherigen APK |
| APK SHA-256 | `eaa898b53f71780d808f706c9a50495cb016e9224d0294df5dd967e35dc6cbaf` |
| Größe | 197,327,041 Bytes |
| Reader SHA-256 | `cb537a5f12f78269d8bebe51026e86dcfbd57751e3f9b360f985007b6df7e4d2` |
| Reader-Tests | 207 bestanden |
| Android-Tests | 70 bestanden, 0 übersprungen; darin 6 Reader-Logiktests |
| Erster Tipp nach Farbwahl | Popup nach Mausklick-/Kompatibilitätsereignissen und echter Touch-Eingabe geprüft |
| Weitere Browserprüfungen | Finger/Stift, Wischen, Palette, Auswahl-Abwahl, Wrapped-Rückkehr, Bookmarks, Lesekante und Viewport bestanden |
| Laufzeitdateien/Bibliotheken | 88 bytegleich zur Basis |
| APK-Dateieinträge | keine entfernt oder hinzugefügt |
| Anpassungsfunktionen und PDF.js | unverändert zur Basis geprüft |
| DEX-Dateien | 8 |
| Signatur und ZIP-Ausrichtung | geprüft, einschließlich 16-KiB-Ausrichtung nativer Bibliotheken |
| Physischer BOOX / native Fensterdarstellung | hier nicht geprüft |

Die APK über die bisherige Testversion installieren, vorher nicht deinstallieren. Paketkennung, Signatur und höherer Versionscode wurden an beiden APKs geprüft. Datenbank, Anmeldung und Speicherpfade wurden nicht verändert. Das Android-App-Label ist direkt aus der fertigen APK geprüft, nicht nur aus dem Quellcode.

Der Zusatz-Tipp wurde im Reader von Build 294 nachgestellt: Nach dem Klick auf eine Palettenfarbe blieb der globale PDF-Zeigerzustand offen. Der globale Capture-Listener ignoriert jetzt Android-Paletteneingaben, bevor er eine PDF-Aktion startet. Der neue Unit-Test prüft Touch, Stift und mousedown; Browserprüfungen prüfen das tatsächliche Popup beim ersten folgenden Tipp. Der native Schließhandler aus Build 294 bleibt erhalten.

Fit-to-Content-Algorithmen, Fit-to-Width-Berechnung und gerade/ungerade Ausrichtung wurden nicht geändert. Der PDFView enthält ausschließlich die kleine zusätzliche Eingabeprüfung vor Pointerdown. Der Verifikationslauf vergleicht die Anpassungsfunktionen, das Inhaltsanpassungsmodul und alle PDF.js-Dateien gegen die bisherige APK.

Die native Oberfläche ist kompiliert. Eine Installation auf dem tatsächlichen BOOX, dortiger Geräte-Login und realer Desktop-Sync wurden hier nicht durchgeführt. Für den vollständigen Android-Testlauf wurde der vorhandene MockK-/ByteBuddy-Agent beim Start der Test-JVM geladen; kein Test wurde dafür übersprungen und die APK enthält diesen Teststartparameter nicht.
