# Der lokale Node.js-Server – Lernanleitung

## 1. Was der Server in Version 0.26.0 macht

Der Server ist noch kein fachliches Backend. Er speichert keine Spielstände, verwaltet keine Benutzer und besitzt keine Datenbank. Seine einzige Aufgabe ist, die vorhandenen statischen Dateien über HTTP an den Browser auszuliefern.

```text
Browser                         Node.js
GET /                    ->     liest index.html
GET /style.css            ->     liest style.css
GET /js/app.js            ->     liest js/app.js
GET /js/config.js         ->     liest js/config.js
```

Das ist nötig, weil Browser ES-Module bei einem direkten `file://`-Start häufig blockieren. Über `http://127.0.0.1:3000` funktionieren die Modulimporte regulär.

## 2. Installation und Start

Voraussetzung ist Node.js 20 oder neuer.

```bash
npm install
npm start
```

Danach im Browser öffnen:

```text
http://127.0.0.1:3000
```

Beenden:

```text
Strg+C
```

`npm run dev` startet derzeit denselben Server. Der zweite Name ist als verständlicher Einstieg für spätere Entwicklungswerkzeuge vorgesehen.

## 3. Warum GitHub Pages weiterhin funktioniert

GitHub Pages übernimmt online dieselbe Aufgabe wie der lokale Node-Server: Es liefert `index.html`, CSS, Bilder und JavaScript über HTTPS aus. `server.js` wird auf GitHub Pages nicht ausgeführt und dort auch nicht benötigt.

```text
lokal:          Browser -> Node.js -> statische Dateien
GitHub Pages:   Browser -> GitHub Pages -> statische Dateien
```

Die Browser-App bleibt deshalb unabhängig vom lokalen Server. Sie importiert keine Node-Module und greift nicht auf `server.js` zu.

## 4. Die Bestandteile von server.js

### Imports

```js
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
```

- `node:http` erstellt den HTTP-Server.
- `stat` prüft, ob ein angeforderter Pfad existiert und eine Datei ist.
- `createReadStream` liest eine Datei stückweise und sendet sie an den Browser.

Diese Module gehören zu Node.js. Es muss kein zusätzliches Serverpaket installiert werden.

### Projektwurzel

```js
const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url));
```

`PROJECT_ROOT` ist der Ordner, in dem `server.js` liegt. Alle ausgelieferten Dateien müssen innerhalb dieses Ordners liegen.

### Host und Port

```js
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;
```

- `127.0.0.1` bedeutet: Der Server ist nur auf dem eigenen Computer erreichbar.
- `3000` ist die lokale Portnummer.
- Ein Port ist vereinfacht ein nummerierter Eingang zu einem laufenden Netzwerkprogramm.

Alternative Werte sind möglich:

```bash
node server.js --port 4173 --host 127.0.0.1
```

oder über Umgebungsvariablen:

```bash
PORT=4000 npm start
```

### MIME-Typen

Der Browser muss wissen, welche Art Datei er erhält. Deshalb ordnet `MIME_TYPES` Dateiendungen passenden HTTP-Inhaltstypen zu:

```text
.html -> text/html
.css  -> text/css
.js   -> text/javascript
.png  -> image/png
```

Der korrekte JavaScript-MIME-Typ ist besonders für ES-Module wichtig.

### HTTP-Anfrage

Für jede Anfrage ruft Node diese Funktion auf:

```js
createServer(async (request, response) => {
  // Anfrage prüfen, Datei finden und Antwort senden
});
```

- `request` beschreibt, was der Browser anfordert.
- `response` wird verwendet, um Status, Header und Dateidaten zurückzusenden.

### Erlaubte Methoden

Der Server akzeptiert nur:

- `GET`: Datei tatsächlich abrufen.
- `HEAD`: nur Antwortinformationen abrufen, nicht den Dateiinhalt.

Andere Methoden erhalten den Status `405 Method Not Allowed`. Eine spätere API würde zusätzlich beispielsweise `POST`, `PUT` oder `DELETE` behandeln.

### URL in einen Dateipfad übersetzen

Die URL `/js/app.js` wird zu einer Datei innerhalb des Projektordners aufgelöst. `/` wird bewusst auf `index.html` abgebildet.

Der Server prüft außerdem, dass ein manipulierter Pfad nicht aus dem Projektordner herausführt. Ein Browser darf dadurch nicht beliebige Dateien vom Computer anfordern.

### Statuscodes

Der Server verwendet unter anderem:

- `200 OK`: Datei wurde gefunden.
- `400 Bad Request`: Anfragepfad war ungültig.
- `404 Not Found`: Datei existiert nicht.
- `405 Method Not Allowed`: HTTP-Methode ist nicht erlaubt.
- `500 Internal Server Error`: unerwarteter Serverfehler.

### Streams

```js
createReadStream(filePath).pipe(response);
```

Die Datei wird nicht erst vollständig in den Arbeitsspeicher geladen. Node liest sie in Abschnitten und leitet diese direkt an die HTTP-Antwort weiter. Dieses Prinzip heißt Streaming.

### Server starten

```js
server.listen(port, host, () => {
  console.log(`Miriel’s Deck läuft unter http://${host}:${port}`);
});
```

`listen` bindet den Server an Host und Port. Ab diesem Moment kann der Browser Verbindungen herstellen.

### Sauberes Beenden

`SIGINT` entsteht normalerweise bei `Strg+C`, `SIGTERM` wird häufig von Entwicklungs- und Hostingwerkzeugen gesendet. Der Server reagiert darauf und schließt seine Verbindung kontrolliert.

## 5. Was npm start genau bedeutet

In `package.json` steht:

```json
"start": "node server.js"
```

`npm start` ist nur eine bequemere Schreibweise für:

```bash
node server.js
```

Node liest und führt anschließend `server.js` aus.

## 6. Verbindung zu den Browser-Tests

Playwright startet den Server vor den Browser-Tests automatisch:

```js
webServer: {
  command: "node server.js --port 4173 --host 127.0.0.1",
  url: "http://127.0.0.1:4173"
}
```

Die Tests verwenden dadurch denselben Servercode wie der manuelle lokale Start. Nach dem Testlauf beendet Playwright den Prozess wieder.

## 7. Was ein späteres Backend zusätzlich tun würde

Der heutige Server beantwortet Dateianfragen. Ein echtes Backend würde zusätzliche API-Pfade erhalten:

```text
GET  /api/games       -> Spielstände auflisten
POST /api/games       -> Spielstand speichern
GET  /api/games/123   -> bestimmten Spielstand laden
```

Das Frontend würde solche Pfade mit `fetch()` aufrufen. Datenvalidierung, Authentifizierung und Datenbankzugriff gehören in spätere, getrennte Schritte. Sie sind nicht Bestandteil von 0.26.0.

## 8. Sicherheitsgrenze dieses Servers

Der Server ist für lokale Entwicklung und Tests gedacht. Er ist kein fertiger öffentlicher Produktionsserver. Für einen später öffentlich erreichbaren Node-Dienst müssen unter anderem TLS/HTTPS, Sicherheitsheader, Protokollierung, Rate Limits, Eingabevalidierung, Updates und ein Hostingkonzept separat geplant werden.
