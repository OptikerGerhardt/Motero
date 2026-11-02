# Motero Build 300: PDF-Engine ohne PSPDFKit/Nutrient

Der seit Build 299 aktive Reader bleibt unverändert: Zotero Reader mit PDF.js in einer Android-WebView. Build 300 entfernt die zweite, nicht mehr aufgerufene SDK-Implementierung und ihre gemeinsam genutzten Hilfstypen. Es gibt keine Attrappen unter dem Herstellernamensraum und keinen versteckten SDK-Fallback.

## Ersatz und Datenhaltung

| Bisherige Abhängigkeit | Stand in Build 300 |
|---|---|
| SDK-Artefakt, Maven-Repositories, Lizenzschlüssel, Startinitialisierung, Manifest-Activity und SDK-Themes | Entfernt; der Reader startet über seine bestehende WebView-Initialisierung |
| Alter nativer Reader und seine nicht mehr aufgerufenen Telefon-/Tablet-Routen | Entfernt; beide aktiven PDF-Öffnungspfade führen unverändert zu `showReader` |
| Gemeinsame Annotationsarten | Dieselben sechs gespeicherten Zotero-Namen und dieselbe Reihenfolge; keine SDK-Enums |
| `PDFDocumentAnnotation` | Implementiert direkt die vorhandene `ReaderAnnotation`; Datenfelder und rohe PDF-Koordinaten bleiben erhalten |
| Farb-/Blend-Hilfstyp | Kleines eigenes `AnnotationBlendMode`; ursprüngliche Farb- und Alpha-Berechnung bleibt erhalten |
| Sortierindex-Hilfe einer bestehenden Datenmigration | `AnnotationSortIndex.format` mit identischem ASCII-Format, US-Locale und Begrenzung negativer Y-Werte auf null |
| SDK-Parcelable-Hilfe beim Teilen/Import | AndroidX `BundleCompat` an beiden Aufrufstellen |
| Vier neutrale UI-Bausteine im alten Reader-Paket | In das aktive Reader-Paket verschoben; Darstellung und Bedienung unverändert |
| Bisher indirekt gelieferte AndroidX WebKit-/Compose-Material-Bibliotheken | Direkt eingebunden, exakt mit den aus Build 299 nachgewiesenen Versionen 1.11.0 und 1.6.8 |
| SDK-eigene Assets, Ressourcen und vier native SDK-Bibliotheken | Nicht mehr in der neuen APK; die übrigen Laufzeit-Assets und nativen Bibliotheken werden byteweise gegen Build 299 verglichen |

Paketkennung, Debug-Schlüssel, interne Pfade, Realm-Modelle und Schema-Versionen bleiben erhalten. Die vorhandene `Defaults`-Instanz bleibt für Dateiverwaltung und andere App-Funktionen bestehen. Ausschließlich die unbenutzte SDK-Initialisierungsmarke wird nicht mehr gelesen oder geschrieben. Keine Einstellungen werden zurückgesetzt oder gelöscht. Auch der alte rein datenbasierte `PDFSettings`-Typ bleibt lesbar. Die aktuellen `ReaderSettings`, Reader-/Sync-Konverter und V2-Datenbank-Schreibpfade bleiben erhalten.

Alle sechs Annotationsarten sind weiterhin verfügbar: Note, Highlight, Image, Ink, Underline und Text. Es gibt keine Umrechnung vorhandener Koordinaten. Die Farbe, Identität, Erstellungs-/Änderungszeiten, Kommentare und die Sortierung bleiben im normalen Zotero-Datenformat. Bestehende Tag-, Kommentar- und Synchronisationswege werden unverändert weiterverwendet.

Die Public-Suffix-Datendatei des weiter benötigten OkHttp bleibt erhalten; sie gehört zur Netzwerkbibliothek und nicht zum PDF-SDK. Auch diese APK-Datei ist bytegleich zur Basis.

## Erweiterungen bleiben anschlussfähig

| Offener Punkt | Erhaltener Ansatzpunkt |
|---|---|
| F22 manueller Zuschnitt All/Odd/Even | `reader/src/pdf/content-fit.mjs`, `android-page-fitting.js`, `reading-layout.mjs` und native Reader-Einstellungen; normalisierte Rahmen und getrennte Seitenprofile bleiben erhalten |
| F23 Randtippen in allen Scrollmodi | Bestehende Pointer-/Navigationspfade in `pdf-view.js`, `boox-reader.js` und `hardware-navigation.mjs`; keine neue globale Touch-Sperre |
| F19 Tag-Autocomplete nach Häufigkeit | Nativer TagPicker, Realm-Tagmodell und bestehende Reader-Tagaktionen |
| Stiftdruck, Radierer und Geräteprofile | WebView-Eingabebrücke und Reader-Ink-Werkzeuge; keine SDK-Kopplung hinzugefügt. Gerätespezifische APIs müssten gesondert geprüft werden |
| PDF-Outline vom Desktop | PDF.js liest weiterhin die PDF-Outline; die bestehenden PDF-/Document-Worker-Pakete bleiben bytegleich erhalten |

Es wird keine zusätzliche Engine-Abstraktion eingeführt, die heutige Funktionen oder künftige Zuschnittrechtecke einschränkt. Die APK-Prüfung trennt bewusst `--without-pspdfkit` von `--preserve-reader`: Spätere Reader-Erweiterungen können SDK-frei geprüft werden, ohne den Reader dauerhaft auf Build 299 einzufrieren. Änderungen an diesen Erweiterungen bleiben eigenständige Aufträge; dieser Build fügt sie nicht nebenbei hinzu.

## Nachweise

`scripts/audit_pdf_engine_removal.py` vergleicht die Quellen mit dem entpackten Stand 299. `scripts/verify_boox_update.py --without-pspdfkit --preserve-reader` prüft zusätzlich das ausgelieferte APK: Paket/Zertifikat/Versionsanstieg, v2-Signatur, ZIP-Ausrichtung, vollständige Reader-Bytegleichheit, übrige Laufzeitdateien, ehemalige transitive Bibliotheksversionen, DEX und Manifest ohne Herstellerklassen sowie die aktuellen Testprotokolle.

`PdfEngineIndependenceTest` prüft alle sechs Annotationstypen, rohe Geometrie, Inhalt/Identität/Zeiten, Originalfarben mit Alpha und Blend-Modi sowie locale-unabhängige Sortierindizes. Die vorhandenen Reader- und Browserprüfungen werden erneut ausgeführt. Abschließende Zahlen und Hashwerte stehen in `BUILD_STATUS.md` und `BUILD_VERIFICATION.json`.

Kein physischer BOOX und kein echter Android-/Desktop-Kontosync wurden in dieser Umgebung geprüft. Die Kompatibilitätsprüfung belegt die technische Eignung als Update; ein laufender Kontosync wird dadurch nicht simuliert. Die Heuristiken zum PDF-Zuschnitt bleiben genau auf dem zuvor getesteten Stand.
