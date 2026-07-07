# Changelog – Miriel’s Deck of Encounters v0.7.0


## Kurzfassung

Die neue Version bringt vor allem:

- eine deutlich überarbeitete **Spielleiter-Ansicht**,
- eine passive **Spieltisch-Anzeige** für zweiten Bildschirm, Stream oder Beamer,
- ein Start-System für Encounter,
- ein neues **Spielleiter-Atelier**,
- die **Werkzeugkiste** für schnelle Spielleiter-Aktionen,
- eine erweiterte **Kartenschmiede**,
- **Miriels Schautafel** für Rundenrufe, Initiativefolge und eigene Bild-/Texttafeln,
- ein überarbeitetes **Kartendeck** für Vorbereitung und Reserven,
- Import, Export, Browser-Speicher und Demo-Verwaltung,
- deutlich weiterentwickelte UI, Animationen und öffentliche HP-Zustnadsanzeige.
- Die Smartphone-Ansicht wurde vorerst vollständig deaktiviert.

## Neue Hauptbereiche

### Spielleiter-Ansicht

Die Spielleiter-Ansicht ist jetzt die zentrale Arbeitsfläche für den DM. Sie besteht aus:

- dem aktiven **Spieltisch**,
- der aktuellen Runde und Zugfolge,
- der großen Fokuskarte,
- den Kartendetails mit Tabs,
- der Spielleiter-Konsole,
- der Kartenhand in Initiative-Reihenfolge,
- dem Kartendeck als Vorbereitungsbereich,
- dem Spielleiter-Atelier für Werkzeuge, Schmiede, Schautafel und Archiv.

Die Ansicht ist stärker auf Desktop, Laptop und große Tablet-Displays im Querformat ausgelegt.

### Spieltisch-Anzeige

Die frühere öffentliche Vorschau wurde zur **Spieltisch-Anzeige** ausgebaut. Sie ist als passive Anzeige für Spieler gedacht, zum Beispiel auf einem zweiten Bildschirm, Beamer, Stream oder geteilten Fenster.

Neu hinzugekommen sind:

- große Bühnenansicht mit aktueller Karte,
- vorherige und nächste Karten im Bühnenlayout,
- öffentliche Initiativeleiste,
- öffentliche HP-Darstellung nach Sichtbarkeitsmodus,
- Miriels Schautafel,
- Start-Wartezustand vor Encounter-Beginn.

Wichtig: Die Spieltisch-Anzeige ist aktuell weiterhin Teil derselben lokalen Browser-App. Sie ist noch keine echte sichere Spieleransicht mit serverseitig gefilterten Daten.

## Encounter starten und beenden

Encounter haben jetzt einen eigenen Startzustand.

Vor dem Start zeigt die Spieltisch-Anzeige keine Karten, keine Initiative und keine internen Werte. Stattdessen erscheint eine Wartetafel:

> Die Karten wurden gelegt  
> Der Encounter beginnt, sobald der Spielleiter den Ruf gibt.

Sobald der Spielleiter auf **Starten** klickt:

- wird der Encounter auf Runde 1 gesetzt,
- die Spieltisch-Anzeige wird freigegeben,
- Miriels Schautafel blendet den Start-Rundenruf ein,
- die Initiative- und Bühnenansicht erscheinen.

Nach dem Start wird aus **Starten** an derselben Position **Beenden**.

## Miriels Schautafel

Miriels Schautafel ist ein neues zentrales Präsentationssystem für die Spieltisch-Anzeige.

Sie kann zeigen:

- automatische Rundenrufe,
- die Initiativefolge,
- eigene Bild-/Texttafeln des Spielleiters,
- Wartetafel vor Encounter-Start.

Im Spielleiter-Atelier kann gesteuert werden:

- ob dauerhaft nichts, die Initiativefolge oder eine eigene Tafel angezeigt wird,
- ob bei neuer Runde automatisch ein Rundenruf erscheint,
- ob nach jedem Zug automatisch die Initiativefolge eingeblendet wird,
- welches eigene Bild geteilt wird,
- welcher Text darüberliegt,
- Textgröße und Textposition.

Eigene Tafeln eignen sich für Orte, Hinweise, Stimmungen, Szenenbilder oder kurze Spielleiter-Präsentationen.

## Spielleiter-Atelier

Das neue **Spielleiter-Atelier** bündelt mehrere Arbeitsbereiche:

- Werkzeugkiste,
- Kartenschmiede,
- Miriels Schautafel,
- Archiv.

Das Atelier ist dafür gedacht, während des Spiels Aktionen vorzubereiten oder auszuführen, ohne die Hauptansicht dauerhaft zu überladen.

## Werkzeugkiste

Die Werkzeugkiste ist der schnelle Aktionsbereich für den Spielleiter.

Dort können ausgewählte Zielkarten gesammelt bearbeitet werden:

- Schaden anwenden,
- Heilung anwenden,
- temporäre HP setzen,
- Conditions hinzufügen,
- Conditions entfernen.

Die Farblogik wurde geschärft:

- Blau = aktiv, Fokus oder ausgewählt,
- Gold = Ziel,
- Rubin/Rot = Schaden, Löschen oder kritische Aktion,
- Violett/Flieder = neutrale magische UI.

## Kartenschmiede

Die Kartenerstellung und Kartenbearbeitung wurde stark erweitert.

Karten können jetzt deutlich mehr Informationen enthalten, darunter:

- interne Namen,
- öffentliche Namen,
- Typen wie Spieler, NPC oder Monster,
- Initiative,
- HP, Max HP und temporäre HP,
- Armor Class,
- passive Werte,
- Attribute und Modifikatoren,
- Rettungswürfe,
- Bewegung und Sinne,
- Resistenzen, Immunitäten und Verwundbarkeiten,
- Traits,
- Aktionen,
- Spells,
- Notizen,
- Inventar,
- Conditions,
- Bildpfade oder lokale Bilddaten,
- öffentliche HP-Sichtbarkeit.

## Kartendetails mit Tabs

Die Kartendetails im Spieltisch sind jetzt in Tabs gegliedert:

- Profil,
- Aktionen,
- Traits,
- Spells,
- Notizen,
- Inventar.

Dadurch kann eine Karte deutlich mehr Informationen enthalten, ohne die Hauptansicht zu überladen.

## Kartendeck und Vorbereitung

Das Kartendeck ist jetzt klarer als Vorbereitungsbereich gedacht.

Neu oder erweitert:

- Karten können im Deck vorbereitet bleiben,
- nur Karten auf der Hand nehmen am aktiven Encounter teil,
- Deckkarten können gesucht, gefiltert und sortiert werden,
- mehrere Karten können ausgewählt und auf die Hand gelegt werden,
- Karten können fokussiert, bearbeitet, kopiert oder entfernt werden,
- Deck und Hand haben eigene visuelle Bereiche.

## Öffentliche HP-Sichtbarkeit

Die öffentliche HP-Anzeige wurde erweitert und klarer definiert.

Pro Karte kann gesteuert werden, was Spieler sehen:

- **Volle HP**: Zahlen und Balken,
- **Balken**: nur Balken,
- **Zustandsschleier**: beschreibender Zustand ohne Zahlen oder Balken,
- **Verborgen**: keine öffentliche HP-Information.

Der Spielleiter sieht intern weiterhin die vollständigen Werte.

## Initiative und Animationen

Die öffentliche Anzeige wurde visuell erweitert:

- aktuelle Karte steht im Zentrum,
- vorherige und nächste Karten sind sichtbar,
- Initiativeband zeigt die Reihenfolge ab der aktiven Karte,
- Animationen sind ruhiger und stabiler,
- Karten bewegen sich sichtbarer und nachvollziehbarer.

Auch im Spielleiterbereich wurde die Fokus- und Scroll-Logik mehrfach stabilisiert.

## Spielleiter-Konsole

Die Spielleiter-Konsole enthält:

- Encounter-Chronik,
- Tischgeflüster-Vorschau,
- Tischgeflüster-Eingabe.

Die Konsole wurde optisch beruhigt und als Feed gestaltet, damit sie weniger verschachtelte Rahmen und mehr Lesbarkeit bietet.

## Tischgeflüster

Tischgeflüster ist bereits als Bereich vorhanden, aber noch nicht als endgültige Spielerkommunikation fertig.

Aktuell dient es als lokaler Vorschau- und Eingabebereich für kurze Nachrichten und Stimmungsnotizen.

Geplant ist, Tischgeflüster später stärker mit echten Spieleransichten zu verbinden, sodass Spieler über ihre eigenen Geräte Nachrichten, Hinweise oder kurze Interaktionen erhalten oder senden können.

## Archiv, Import und Export

Das Archiv verwaltet jetzt zentrale Speicher- und Verwaltungsfunktionen:

- Browser-Speicher,
- Encounter-Export,
- Encounter-Import,
- Demo-Karten,
- Reset- und Löschfunktionen.

Exportierte Encounter-Dateien eignen sich für Backups oder vorbereitete Sessions auf anderen Geräten.

## Demo-Karten und Demo-Encounter

Der Demo-Encounter wurde deutlich ausgebaut und dient jetzt als Testumgebung für:

- Spieler-, NPC- und Monsterkarten,
- verschiedene HP-Sichtbarkeiten,
- Conditions,
- öffentliche Anzeige,
- Schautafel,
- Kartendetails,
- Werkzeugkiste,
- Deck- und Handlogik.

## Design und Oberfläche

Die Oberfläche wurde umfassend überarbeitet:

- neuer Header,
- neue Hintergrundbilder für Spieltisch, Kartendeck und Atelier,
- bessere visuelle Trennung zwischen Vorbereitung und aktivem Spiel,
- ruhigere Feed-Darstellung in der Konsole,
- klarere Farblogik,
- überarbeitetes Handbuch,
- überarbeitete Spieltisch-Anzeige,
- mehr Fokus auf 1366 × 1024 und ähnliche Desktop-/Laptop-Auflösungen.

## Technische Verbesserungen

Seit der frühen Version wurden viele technische Grundlagen verbessert:

- stabilere lokale Speicherung,
- lokale Tab-Synchronisierung,
- Import-/Export-Struktur,
- robustere Render- und Scroll-Logik,
- bessere Trennung von Spielleiter-Ansicht und Spieltisch-Anzeige,
- stabileres Start-Gate für Encounter,
- Bildverarbeitung für manuell geteilte Schautafelbilder,
- weniger alte UI-Altlasten im Code.

## Aktuelle Einschränkungen

Die App ist weiterhin ein lokales Browser-Projekt.

Noch nicht vorhanden:

- kein Backend,
- keine Datenbank,
- keine Benutzerkonten,
- keine echte serverseitige Trennung zwischen DM-Daten und Spieler-Daten,
- keine echte Netzwerk-Spieleransicht für andere Geräte,
- keine produktive Mehrspieler-Synchronisierung,
- keine offizielle Mobile-Optimierung.

Die aktuelle Spieltisch-Anzeige ist für lokale Präsentation gedacht, nicht als sichere separate Spieler-App.

## Geplante nächste Schritte

Geplant oder angedacht sind unter anderem:

- individuelle Spieleransichten für mobile Geräte,
- echte Spielergeräte mit eigenen Steuerflächen,
- Spieler können später eventuell selbst Schaden, Heilung oder bestimmte Aktionen vorbereiten,
- besser integriertes Tischgeflüster zwischen Spielleiter und Spielern,
- stärkere öffentliche Datenfilterung,
- optionaler lokaler Server für mehrere Geräte im gleichen Netzwerk,
- robustere Speicherverwaltung,
- bessere Bildverwaltung,
- weitere Verbesserungen an Kartenschmiede und Archiv,
- mögliche Desktop- oder lokale Server-Variante in einer späteren Phase.

## Für Beta-Tester besonders interessant

Bitte achtet beim Testen besonders auf:

- funktioniert Starten/Beenden des Encounters verständlich?
- ist die Spieltisch-Anzeige für Spieler klar genug?
- ist Miriels Schautafel hilfreich oder zu dominant?
- sind HP-Sichtbarkeiten verständlich?
- findet man Werkzeugkiste, Kartenschmiede und Archiv intuitiv?
- bleibt die Scrollposition stabil?
- sind Karten auf Hand und Deck logisch getrennt?
- ist das Handbuch ausreichend kurz und hilfreich?

## Hinweis zu Nutzung und Weitergabe

Diese Version ist weiterhin ein privates, nicht-kommerzielles Fan-/Lernprojekt von kuro.

Der Code, die Bilder, die Texte und die Projektstruktur sind nicht zur Weiterverwendung freigegeben. Es gibt keine Open-Source-Lizenz. Bitte nicht kopieren, veröffentlichen, weiterverteilen, forken oder in andere Projekte übernehmen.
