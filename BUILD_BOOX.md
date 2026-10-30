# Motero auf BOOX: Build 296

## Installation als Update

Über die vorhandene Motero-/Zotero-Testversion installieren, vorher nicht deinstallieren.
Paketkennung `org.zotero.android.debug`, Versionscode 296, Version `1.0.0-296`, sichtbarer Name **Motero**. Der bisherige Debug-Schlüssel, Speicherpfade und normale Zotero-Anmerkungen bleiben erhalten. Paket, Signatur, Versionsanstieg, ZIP-Ausrichtung und die Laufzeitpakete werden direkt gegen Build 295 geprüft. Ein tatsächlicher Login nach Installation am physischen BOOX ist hier nicht geprüft.

## Die vier Ansichtsmodi

| Modus | Berechnung | Zugänglicher Ausschnitt |
|---|---|---|
| Off | Keine automatische Anpassung; vorhandenen Zoom erhalten | Vollständige PDF |
| Fit to Content | Gesamten erkannten Inhalt gleichzeitig in Breite und Höhe einpassen | Der aktuelle Inhaltsrahmen mit Rand; äußere Seitenbereiche werden nur in der Ansicht abgeschnitten. Nach manuellem Verschieben wird die Inhaltsansicht wieder zentriert. |
| Fit to Width | Ausschließlich Breite: PDF-Seite oder Inhalt plus Rand | Ganze PDF-Höhe bleibt scrollbar |
| Fit to Height | Ausschließlich Höhe: PDF-Seite oder Inhalt plus Rand | Ganze PDF-Breite bleibt horizontal verschiebbar |

Für große Schrift mit vertikalem Scrollen: **Fit to Width → Content → Small**. Fit to Content zeigt dagegen den gesamten Inhalt einer Seite, einschließlich Fußnoten, auf einmal. Bei einem anderen Seitenverhältnis bleibt dabei Platz übrig; der Inhalt wird nicht verzerrt.

Bei Breite und Höhe erscheint eine Referenzauswahl PDF page / Content. Beim Inhaltsbezug sind None / Small / Medium / Large als Rand verfügbar: 0 / 1 / 4 / 8 Prozent der kürzeren Seite des Lesefensters je Kante. Eine bereits ausgewählte Fit-Option kann erneut angetippt werden und passt die Ansicht ausdrücklich neu an. Manueller Zoom hebt den aktiven Fit auf und meldet Off an die nativen Einstellungen. Eine monotone Revision verhindert, dass verspätete WebView-Zustände eine neuere Auswahl überschreiben. Die Wrapped-Übersicht merkt sich den aktiven Fit und stellt ihn auf der angetippten Seite wieder her.

Die Fit-Modi arbeiten mit einzelnen PDF-Seiten, auch in Wrapped. Auswahl eines Fits schaltet eine Doppelseitenanzeige auf einzelne Seiten. Eine explizite Doppelseitenwahl schaltet den automatischen Fit aus. Gerade/ungerade Inhaltserkennung ist davon unabhängig.

## Inhaltserkennung

Bis zu vier benachbarte Seitenpaare aus dem mittleren Bereich werden analysiert: bei langen PDFs über ungefähr die mittleren zehn Prozent, bei kurzen PDFs über mindestens acht verfügbare Seiten um die Mitte; bei höchstens acht Seiten werden alle analysiert. Maßgeblich sind PDF-Seitenindizes, nicht gedruckte Folios. Gerade und ungerade Seiten bekommen getrennte horizontale Profile. Gleichartige Buchseiten verwenden eine gemeinsame typische Lesebreite, statt abwechselnd stark zu zoomen.

Die Seiten werden mit 600 Pixeln Breite gerendert. Textpositionen und Schriftmetriken dienen zur Erkennung von laufenden Köpfen, getrennten Zeilenzahl-/Editionenspalten und eindeutigen Downloadblöcken wie JSTOR-Vermerken. Wechselnde Kapitelüberschriften können über die stabile Position, Schriftgröße und den Abstand zum Textkörper erkannt werden. Ein dünner Trennstrich des ausgeschlossenen Kopfes wird mit ausgeschlossen.

**Fußnoten und ihre Trennlinien gehören zum Inhalt.** Kleine, kurze, wiederholte oder ganz unten stehende Fußnoten werden nicht allein deshalb entfernt. Ein JSTOR-Link kann selbst eine Fußnote sein und wird nur als Teil eines erkannten Downloadblocks ausgeschlossen. Uneindeutige Texte bleiben erhalten. Auf Scans ohne brauchbare Textschicht kann die Bildauswertung Außenraum bestimmen, aber Metadaten nicht so sicher semantisch unterscheiden; solche Ränder können erhalten bleiben. Es gibt keine Garantie fehlerfreier Klassifikation beliebiger PDFs und keine OCR-Neuberechnung.

Jede erstmals besuchte Seite wird zusätzlich einmal analysiert: breitere Tabellen und tiefere Fußnoten erweitern den Rahmen, statt durch die Stichprobe abgeschnitten zu werden. Ergebnisse werden bis zu 32 Seiten im Arbeitsspeicher gehalten; das Dokumentmodell bleibt während des geöffneten Readers erhalten. Unbekannte Formate, leere Seiten und Lesefehler fallen konservativ auf die tatsächliche Seite zurück. Die natürliche Leseorientierung wird analysiert; Ansichtsrotation dreht nur den erkannten Rahmen. Die PDF-Datei und Annotationskoordinaten werden nicht geändert.

Hardwaretasten blättern bei bereits vollständig sichtbarem Inhalts-/Höhenfit sofort zur nächsten Seite, anstatt durch ausgeblendete Papierränder zu scrollen. Breitenfit behält SmartScroll über die vollständige Papierhöhe. Ausstehende Anpassungen werden bei neuen Eingaben verworfen; eine Highlight-Palette löst keine verspätete Neuausrichtung aus.

## Weiterhin enthaltene Nachbesserungen aus Build 294

| Bereich | Verhalten |
|---|---|
| Done / Schließen | Die gerade bearbeitete Annotation wird in Android und Reader abgewählt und kann anschließend unmittelbar wieder angetippt werden. Ein verspätetes Schließereignis eines anderen Highlights lässt eine neuere Auswahl bestehen. Kommentare werden vorher über den bisherigen Speicherpfad weitergegeben. |
| Quick Tags | Ohne Überschrift, mit denselben Formular-Trennlinien und Abständen wie bei Add Tags. Bis zu neun Felder bleiben in einer zentrierten Reihe zwischen den halben Mittelpunktabständen jenseits der äußersten Farben sichtbar. Sie sind 48 dp hoch; ihre Breite passt sich dem Fenster an. |
| Originaltext | Ohne Überschrift und Kasten als eingerücktes Blockzitat mit vertikalem Balken zwischen denselben Trennlinien. Kurze Texte bleiben kompakt; lange Texte bleiben scrollbar und kopierbar. |
| Lesekante F17 | Die graue gestrichelte Linie hat 50 % Deckkraft und fängt keine Eingaben ab. |
| Bookmarks F18 | Die rechte Hälfte des oberen Elftels des Reader-Bereichs ist die Touchfläche bis einschließlich äußerem rechtem Rand. Dort hat das Lesezeichen Vorrang vor dem Blättern. Neue Marker sitzen unabhängig vom Tipppunkt und Zoom oben rechts auf der PDF-Seite, auch bei gedrehten Seiten. |

Die feste Bookmark-Position liegt etwa 1 cm vom rechten Papierrand und 4 PDF-Punkte unter dem oberen Rand. Ihr sichtbarer Abstand skaliert mit dem PDF-Zoom. Ein vorhandenes datiertes Lesezeichen derselben Seite wird geöffnet; vorhandene Marker werden nicht nachträglich verschoben. Andere graue Haftnotizen bleiben normale Notizen. In der Wrapped-Übersicht hat weiterhin die Seitenauswahl Vorrang. Vorhandene Annotationen und Links behalten ihre normale Bedienung. Wischen, langes Markieren, Pinch und aktive Zeichenwerkzeuge erzeugen über diesen Shortcut keine Notizen.

Alle neun Funktionen aus Build 293 bleiben enthalten: F01/F02 Navigation und Wrapped-Seitenauswahl, F05 Farb-/Tagfilter, F06 gekoppelte Leisten, F16 unmittelbare Farbpalette, F17 Lesekante, F18 Notiz-Lesezeichen und F20/F21 Tag-Schnellwahl und Originaltext im Annotationsfenster.

## Weiter enthalten aus Build 295

Motero als sichtbarer App-Name; Quick Tags zwischen halben Farb-Mittelpunktabständen; erster Tipp auf eine Annotation nach Maus- und Touch-Farbwahl öffnet das Fenster. Direkte Markierung, Tag-/Farbfilter, gekoppelte Leisten und normale Annotationsspeicherung sind erhalten.

## Zurückgestellt

Manueller rechteckiger Zuschnitt für All / Odd / Even und eigenes Auswahlfenster. Bookmark-Marker relativ zum Inhaltsrahmen statt zur Papierecke. Erweiterung des Randtippens auf alle Scrollmodi. F19 Tag-Autocomplete und übriger Backlog. Bookmarks behalten in diesem Update ihre bisherige PDF-Position und können bei engem Fit außerhalb des Ausschnitts liegen. Die neue Methode `AndroidPageFitting.boundsFor(index)` liefert den passenden Rahmen als Grundlage für die spätere Positionierung.

## Prüfungen und Grenzen

Aktuelle Zahlen und APK-Metadaten stehen in `BUILD_STATUS.md` und `BUILD_VERIFICATION.json`, Protokolle in `qa/`. Die neue Browserprüfung `test-boox-fitting.cjs` verwendet eine reproduzierbare PDF mit versetztem Buchsatz, laufenden Köpfen, JSTOR-Footer, kurzen Fußnoten, Nummernspalten, breiter Tabelle sowie Querformat- und Leerseiten. Außerdem wird die originale 499-seitige Mul-PDF geprüft. Prüfungen umfassen alle drei Scrollmodi, alle vier Rotationen, Inhalts-/Papierbezug, Randgrößen, manuelles Zoomen, erneutes Anwenden, ausstehende Anfragen und Wrapped-Rückkehr. Echte Browser-Touchereignisse prüfen Markieren, Palette und ersten Annotationstipp bei aktivem Breiten-, Inhalts- und Höhenfit.

Die bisherigen Browser-Gestenprüfungen und Reader-/Android-Tests laufen ebenfalls. Kein physischer BOOX ist angeschlossen: native Fensterdarstellung, Installation mit konkretem Nutzerkonto, echte Pinch-Skalenänderungen am Gerät, E-Ink-Reaktion und Kontosynchronisation sind hier nicht getestet.

## Neubau

Das Archiv enthält Quelltext, vollständige Git-Bundles und alle Laufzeitpakete unter `app/src/main/assets`. Original-Mul-PDF, SDK/JDK, Build-Caches, APK und private Release-Schlüssel sind ausgeschlossen. Der bekannte Debug-Schlüssel ist für künftige Updates enthalten.

JDK 17, Node/npm, Android SDK Platform 37.0 / Build Tools 36.0.0 und Gradle 9.6.1 verwenden. Reader-Submodule auf den im Git-Bundle angegebenen Ständen initialisieren. Das vorhandene PDF.js unter `app/src/main/assets/reader/reader.zip` nach `reader/build/mobile/pdf` übernehmen. Im Reader `npm ci` und `./node_modules/.bin/webpack --config-name android`; im Android-Projekt `python3 scripts/package_reader_assets.py` und Gradle `:app:testDevDebugUnitTest :app:assembleDevDebug --no-build-cache`.

Im Reader `npm test` sowie `scripts/test-boox-features.cjs`, `scripts/test-boox-browser.cjs`, `scripts/test-boox-fitting.cjs` mit Playwright und optional `BOOX_TEST_BROWSER` ausführen. `BOOX_PROBLEM_PDF` verweist für den letzten Test auf die originale Mul-PDF. `scripts/make-fitting-fixture.cjs` erstellt die enthaltene Test-PDF erneut.

Zum APK-Vergleich `scripts/verify_boox_update.py --base <295.apk> --apk <296.apk> --build-tools <SDK/build-tools/36.0.0> --qa-directory qa --label Motero --fitting-update` verwenden. PDF.js selbst muss bytegleich bleiben; die neun eingebetteten Reader-Quellen werden gegen den getesteten Source Map-Inhalt geprüft. In Umgebungen ohne dynamisches Java-Attach muss der vorhandene ByteBuddy-Agent nur für die Test-JVM über einen Gradle-Init-Script vorab geladen werden; die APK enthält keine solche Startoption.
