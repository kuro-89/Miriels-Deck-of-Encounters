# Tests ausführen – Miriel’s Deck of Encounters 0.26.0

Die App bleibt eine statische HTML/CSS/JavaScript-App. Node.js wird nur lokal für Vitest, Playwright und den automatischen HTTP-Testserver benötigt.

## Voraussetzungen

- Node.js 20 oder neuer
- npm
- Python 3 für den lokalen statischen HTTP-Server

Prüfen:

```bash
node --version
npm --version
python3 --version
```

## Einmalige Einrichtung

Im Projektordner ausführen:

```bash
npm install
npm run test:browser:install
```

Der zweite Befehl lädt Chromium für Playwright herunter. Dafür entstehen keine Lizenzkosten, aber lokaler Speicherbedarf und einmaliger Netzwerkverkehr. Ist bereits ein kompatibles Chromium installiert, kann dessen Pfad alternativ über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` gesetzt werden.

## Alle automatisierten Tests

```bash
npm test
```

Dabei laufen zuerst die Unit-Tests mit Vitest und danach die Browser-Smoke-Tests mit Playwright.

## Nur Unit-Tests

```bash
npm run test:unit
```

Beobachtungsmodus während der Entwicklung:

```bash
npm run test:unit:watch
```

Aktuell geprüft werden:

- Import-JSON und Schema-Grundregeln
- unterstützte Schema-Version
- Kartenlimit
- getrennte SRD-5.1- und SRD-5.2.1-Quellen
- doppelte Bibliotheks-IDs
- Überschneidungen zwischen den Bibliotheken
- minimale Pflichtfelder der Spell-Vorlagen

## Nur Browser-Tests

```bash
npm run test:browser
```

Playwright startet den lokalen Server automatisch unter `http://127.0.0.1:4173` und beendet ihn nach dem Lauf.

Browser sichtbar öffnen:

```bash
npm run test:browser:headed
```

Grafische Playwright-Oberfläche:

```bash
npm run test:browser:ui
```

Aktuell geprüft werden:

- Start der App über HTTP
- Seitentitel und Versionsanzeige
- unerwartete Konsolen- und JavaScript-Fehler
- zentrale Demo-Oberflächenbereiche
- Local-Storage-Grundfunktion nach Reload
- paralleles Öffnen von DM- und Spieler-Tab
- Erstellen einer eigenen Karte und Persistenz nach Reload
- Encounterstart sowie nächster und vorheriger Zug
- Schaden auf ein ausgewähltes Ziel und direktes Undo

## Fehlerbericht öffnen

Nach einem fehlgeschlagenen Browser-Test:

```bash
npm run test:report
```

Bei Fehlern speichert Playwright je nach Fall Screenshot, Trace und Video in den automatisch erzeugten Testordnern.

## Noch manuell zu prüfen

Die erste Testphase ersetzt noch nicht folgende Prüfungen:

1. Kartenbearbeitung bestehender Karten und Mengenanlage
2. eigene, SRD-5.1- und SRD-5.2.1-Spells in der Kartenschmiede
3. vollständiger Rundenwechsel über das Ende der Zugfolge
4. Heilung, temporäre Trefferpunkte, Conditions und eigene Effekte
5. Itemverbrauch und Undo-Konfliktfälle
6. echter BroadcastChannel-Inhaltsabgleich zwischen DM- und Spieleransicht
7. Import/Export kompletter Spielstände
8. Tablet-, Touch-, Animations- und Layoutprüfung
9. redaktionelle und rechtliche Prüfung der SRD-Inhalte

Diese Abläufe werden in den folgenden Testphasen schrittweise automatisiert.

## Erzeugte lokale Ordner

Folgende Ordner gehören nicht in eine Release-ZIP oder ins Repository:

- `node_modules/`
- `playwright-report/`
- `test-results/`

Sie sind in `.gitignore` ausgeschlossen.

## Aktueller erwarteter Umfang

```text
12 Unit-Tests
10 Browser-Tests
22 automatische Tests insgesamt
```


## Erweiterte Browserabläufe in 0.26.0

Zusätzlich werden geprüft:

- temporäre HP setzen
- Schaden nach temporären HP korrekt auf normale HP übertragen
- Heilung bis zum Maximalwert
- Condition hinzufügen und entfernen
- Encounterstart zwischen DM- und Spielerseite synchronisieren

## Lokaler Node-Server

Die Browser-Tests starten nicht mehr einen separaten Python-Server, sondern den Projektserver selbst:

```bash
node server.js --port 4173 --host 127.0.0.1
```

Der normale manuelle Start erfolgt mit:

```bash
npm start
```

Die App wird anschließend unter `http://127.0.0.1:3000` geöffnet. Ein Start durch Doppelklick auf `index.html` ist wegen der nativen ES-Module nicht Teil des unterstützten Testpfads.
