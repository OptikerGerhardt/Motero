# Motero 1.1.7 · Build 333

- **Reading Assist** zeichnet ein größeres schwarzes Oval und blendet es zügig aus. Schneidet die Leselinie ein Wort, wird dieselbe Zeile markiert. Die globale Option unter **Reader Controls** ist standardmäßig an. Das Oval erscheint bei teilweise sichtbaren Fit-to-Width-Seiten, auch nach dem Seitenwechsel. E-Reader-Modus und reduzierte Bewegung zeigen kurz eine statische Kontur.
- **PDF-Layout:** Fit to Content und Fit to Height zentrieren Einzelseiten auch an den horizontalen Dokumentgrenzen. Seitenabstände sind um ein Drittel kleiner. Ein-Finger-Scrollen auf vergrößerten Seiten folgt der gewählten Achse. Beim Scrollen mit Spreads bleibt jedes Fähnchen an seiner zugeordneten Seite. Der sichtbare Abstand ist oben und rechts gleich groß und berücksichtigt Statusleiste und Aussparungen.
- **EPUB und Stiftleiste:** EPUBs nutzen einen stabilen Lesebereich zwischen den sicheren oberen und unteren Rändern. Die zusätzliche äußere Einrückung auf Tablets entfällt. Der Stiftbreitenregler richtet sich an der Farbpalette aus, sein Wert steht mittig.
- **Stabilität:** Beim Ziehen der Seitenvorschau wird die PDF-Navigation auf eine Aktualisierung pro 250 ms begrenzt. Tipp und Loslassen übernehmen die Zielseite sofort. Bei Renderer-Verlust werden wartende JavaScript-Aufrufe beendet. Themewechsel entwerten Vorschauen sofort und erneuern bereits gestartete Seitenrenderings.
- **Bibliothek und Downloads:** Der Tablet-Kollektionsbaum klappt nur die Eltern des gewählten Zweigs auf. Downloads melden geänderte ganze Prozentwerte. Die Prüfsumme einer unveränderten Datei wird aus einem begrenzten Cache wiederverwendet.

Die vier Upstream-Verbesserungen sind an Motero angepasst. [Quellen und Beiträge](../UPSTREAM_CHANGES.md)

Die Geräteprüfung auf BOOX, Pixel und Tablets bleibt im [Feature-Plan](../FEATUREPLAN.md) erfasst.
