# Zotero Boox: Scrollen mit Seitentasten

Dieser Stand wurde nach der Bereinigung des Arbeitsbereichs aus den ursprünglichen PRs rekonstruiert. Er ist keine byteidentische Wiederherstellung der ersten Test-APK.

## Enthalten

- Zotero Android PR #298: Lautstärketasten und Einstellungen.
- Android PR #353 einschließlich #352 sowie Reader PR #260: Randbeschnitt und gespeicherter PDF-Zoom.
- Anbindung der Lautstärke- und Page-Up/Down-Tasten an den aktuellen Web-Reader.
- Neue PDF-Steuerung: Scrollen innerhalb einer Seite, erst am Rand umblättern.

## Bedienung auf dem Boox

1. Zotero Debug installieren und mit dem bestehenden Zotero-Konto separat anmelden.
2. In den Boox-Einstellungen für diese App die Tasten auf Lautstärke oder Umblättern stellen.
3. In Zotero unter Settings > Page turning die Tastensteuerung aktivieren.
4. Scrollschritt wählen: Seite (direktes Umblättern), ⅓, ½, ⅔ oder 1 sichtbare Bildschirmhöhe. Standard ist ⅔. Die Richtung ist umkehrbar.
5. Bei Bedarf Fit to Content im PDF-Reader aktivieren.

Leiser scrollt abwärts. Der letzte Schritt endet genau am unteren Rand. Erst der folgende Druck öffnet die nächste Seite oben. Lauter arbeitet spiegelbildlich: aufwärts, dann vorige Seite unten. Passt der Inhalt vollständig auf den Bildschirm, wird sofort umgeblättert. Am Dokumentanfang/-ende passiert nichts weiter.

Die Schrittweite bezieht sich auf die tatsächliche Höhe des PDF-Anzeigebereichs. Der aktive Randbeschnitt wird berücksichtigt; Zoom und horizontale Position bleiben erhalten. Die Schritte sind nicht animiert. Schnelle einzelne Tastendrücke werden nacheinander verarbeitet. Halten wiederholt den Tastendruck nicht.

Die native Tastenbehandlung gilt nur für einen aktiven Reader. Bei Suche, ausgewählten Anmerkungen oder sichtbarer Bildschirmtastatur wird sie nicht aktiviert. Im Web-Reader sind zusätzlich Texteingaben geschützt. Andere Dokumente oder ein inzwischen ersetzter Reader erhalten keine alten Tastendrücke aus der Warteschlange.

Die neue Scrollfunktion betrifft den aktuellen PDF-Reader. Die alte PDF-Reader-Implementierung bleibt im Quellcode erhalten; sie hat lediglich ihre bisherige Tasten-/Zoomfunktion. Es wurde keine Auswahl zwischen Reader-Versionen hinzugefügt. EPUB/Lesemodus verwenden ihre vorhandene Seitennavigation.

## Tests und Grenzen

Der ursprüngliche Reader besitzt 180 Tests. Hinzu kommen 14 Tests für PDF-Grenzen, Schrittweiten, Randbeschnitt, wechselnde Seitengrößen, verzögerte Ladeprozesse und Dokumentgrenzen sowie zwei Tests für die Android-JavaScript-Anbindung und Warteschlange.

Ein physischer Boox oder ein Pixel ist hier nicht angeschlossen. Installation, Login/Synchronisation, E-Ink-Flackern und tatsächliche Tastenereignisse müssen am Gerät geprüft werden. Ein erfolgreicher Build und die automatischen Tests bestätigen diese Geräteeigenschaften nicht.

## Quellcode mit Versionsgeschichte wiederherstellen

Das Archiv enthält vollständige Git-Bundles für das Android-Projekt und den geänderten Reader. Die lokalen Commits sind nicht auf GitHub veröffentlicht.

```bash
git clone -b boox-smart-scroll zotero-android.bundle zotero-boox
git clone -b boox-smart-scroll reader.bundle zotero-boox/reader
cd zotero-boox
git submodule update --init --recursive
```

Zusätzlich liegt ein lesbarer Quellcode-Snapshot bei. Die übrigen Submodule werden beim obigen Git-Schritt von ihren öffentlichen Ursprungs-Repositories geladen.

## APK bauen

Voraussetzungen: vollständiges JDK 17, Node/npm, Python 3, zip/unzip, Android SDK mit Plattform 37.0 und Build Tools 36.0.0. ANDROID_HOME oder local.properties müssen auf das SDK zeigen.

```bash
bash scripts/build_boox_debug.sh
```

Der Reader muss lokal gebaut werden. Das normale `bundle_reader.sh` lädt einen anderen, vorgebauten Reader und würde die neuen Funktionen nicht enthalten. Die lokale Variante heißt `bundle_reader_local.sh`.

Die Debug-App verwendet `org.zotero.android.debug` und den öffentlichen Debug-Schlüssel des Originalprojekts. Sie ist von der offiziellen Zotero-App getrennt. Der Login-Code bleibt unverändert; ein vollständiger Login ist hier nicht getestet. Für den alten Nutrient-PDF-Reader ist keine Produktionslizenz eingebunden.
