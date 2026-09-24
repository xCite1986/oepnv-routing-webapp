# Entwicklungsprompt: ÖPNV-Routing-Webapp für Wien

Du bist ein Senior Full-Stack-Entwickler und Software-Architekt. Entwickle eine moderne, einfach bedienbare Webapp für ÖPNV-Routing in Wien.

## Projektziel

Die Anwendung soll Nutzern ermöglichen, einen Startpunkt und ein Ziel einzugeben und daraus die aktuell schnellste bzw. sinnvollste Verbindung mit öffentlichen Verkehrsmitteln zu berechnen.

Die Besonderheit der Anwendung ist, dass nicht nur statische Fahrplandaten berücksichtigt werden sollen, sondern auch aktuelle Informationen wie:

- Verspätungen
- Zug- oder Linienausfälle
- nicht bediente Haltestellen
- Störungen
- Baustellen
- Unterbrechungen
- aktuelle Umstiegsmöglichkeiten

Das Hauptziel ist:

> Zeige dem Endnutzer die Verbindung, mit der er unter den aktuell bekannten Bedingungen voraussichtlich am frühesten am Ziel ankommt.

Mehr Umstiege sind ausdrücklich erlaubt, wenn die Gesamtreisezeit dadurch kürzer ist.

Die Anwendung soll dem Nutzer außerdem verständlich erklären, warum eine bestimmte Verbindung empfohlen wird und warum alternative Verbindungen schlechter bewertet wurden.

---

## 1. Technische Zielarchitektur

Die Anwendung besteht aus mehreren Komponenten.

### Frontend

Das Frontend soll auf Netlify deploybar sein.

Verwende:

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- MapLibre GL
- OpenStreetMap

Das Frontend muss vollständig responsive sein und sowohl auf Desktop als auch auf Smartphones sehr gut funktionieren.

Keine native App entwickeln.

Das Ergebnis ist ausschließlich eine Webapp.

### Backend

Das Backend soll als separate REST-API entwickelt werden.

Bevorzugte Technologie:

- Python
- FastAPI
- PostgreSQL
- PostGIS
- Redis

Die Backend-API soll nicht auf Netlify selbst laufen müssen. Sie kann separat auf einer Container-Plattform oder einem VPS betrieben werden.

### Routing Engine

Verwende OpenTripPlanner als eigentliche ÖPNV-Routing-Engine.

OpenTripPlanner soll folgende Daten verwenden:

- GTFS
- GTFS-Realtime
- OpenStreetMap

Die Webapp darf nicht direkt mit OpenTripPlanner kommunizieren.

Die Kommunikation erfolgt immer über das eigene Backend.

Architektur:

```text
Webapp auf Netlify
        |
        v
FastAPI Backend
        |
        +--> OpenTripPlanner
        |
        +--> PostgreSQL/PostGIS
        |
        +--> Redis
        |
        +--> Realtime Adapter
```

---

## 2. Kernfunktion der Webapp

Die Startseite soll extrem einfach aufgebaut sein.

Im Mittelpunkt stehen zwei Eingabefelder:

```text
Von
Nach
```

Zusätzlich soll der Nutzer wählen können:

```text
Jetzt
Abfahrt um
Ankunft bis
```

Danach:

```text
Verbindungen suchen
```

Die Oberfläche soll sich an modernen Mobilitäts-Apps orientieren, aber visuell eigenständig bleiben.

Wichtig:

- sehr wenig visuelle Ablenkung
- große, klare Eingabeelemente
- mobil zuerst denken
- kurze Ladezeiten
- klare Typografie
- verständliche Icons
- barrierearme Bedienung

---

## 3. Standortsuche

Die Eingabefelder `Von` und `Nach` sollen Autocomplete unterstützen.

Mögliche Ergebnisse:

- Adresse
- Haltestelle
- Bahnhof
- POI
- aktueller Standort

Beispiel:

```text
Von:
Stephansplatz

Vorschläge:
Stephansplatz
Stephansplatz U
Stephansplatz 1, 1010 Wien
```

Der Nutzer soll außerdem seinen aktuellen Standort verwenden können.

Die Geocoding-Schicht soll austauschbar gebaut werden.

---

## 4. Ergebnisdarstellung

Die Suchergebnisse sollen nicht als simple Liste dargestellt werden.

Die Hauptdarstellung soll eine vertikale Zeitlinie sein.

Beispiel:

```text
15:42
Start
Stephansplatz
|
| 4 min zu Fuß
|
15:46
Stephansplatz U
|
| U1 Richtung Leopoldau
| 3 Stationen
|
15:52
Praterstern
|
| 3 min Umstieg
|
15:55
S7 Richtung Flughafen
|
| 24 min
|
16:19
Flughafen Wien
|
| 2 min zu Fuß
|
16:21
Ziel
```

Jeder Abschnitt soll als `Leg` behandelt werden.

Mögliche Leg-Typen:

- WALK
- SUBWAY
- TRAM
- BUS
- TRAIN
- REGIONAL_TRAIN
- OTHER_TRANSIT

Jedes Leg soll enthalten:

- Startzeit
- Endzeit
- Dauer
- Linie
- Richtung
- Startpunkt
- Endpunkt
- Anzahl Stationen
- Echtzeitstatus
- Verspätung
- Fußweg
- Umstiegszeit

---

## 5. Verbindungskarten

Die Suchergebnisse sollen zunächst kompakt dargestellt werden.

Beispiel:

```text
EMPFOHLEN

15:42 -> 16:21
39 min

U1 -> S7

2 Umstiege
7 min zu Fuß

+3 min aktuelle Verspätung
```

Der Nutzer kann eine Verbindung aufklappen.

Danach wird die vollständige Zeitlinie angezeigt.

---

## 6. Empfohlene Verbindung

Eine Verbindung soll klar als beste Verbindung markiert werden.

Beispielsweise:

```text
Empfohlen
```

oder:

```text
Schnellste aktuelle Verbindung
```

Die empfohlene Verbindung muss nicht die Verbindung mit den wenigsten Umstiegen sein.

Primäres Optimierungsziel:

```text
minimale realistische Ankunftszeit
```

Also:

```text
score = predicted_arrival_time
```

---

## 7. Erklärung für den Nutzer

Ein sehr wichtiges Feature ist die verständliche Erklärung der Auswahl.

Unter jeder empfohlenen Route soll ein Bereich erscheinen:

```text
Warum diese Verbindung?
```

Beispiele:

> Diese Verbindung ist aktuell 8 Minuten schneller als die direkte Alternative.

> Trotz eines zusätzlichen Umstiegs erreichst du dein Ziel früher, da die U4 derzeit etwa 11 Minuten verspätet ist.

> Diese Verbindung wurde gewählt, weil der nächste Zug der Alternative erst in 14 Minuten fährt.

> Die direkte Verbindung fällt aktuell aus.

Die Erklärung muss aus strukturierten Routing-Daten erzeugt werden.

Keine erfundenen Begründungen.

---

## 8. Vergleich mit Alternativen

Neben der empfohlenen Route sollen mindestens zwei Alternativen angezeigt werden.

Beispiel:

```text
1. EMPFOHLEN
39 min
2 Umstiege

2. DIREKTER
45 min
0 Umstiege

3. WENIGER ZU FUSS
47 min
1 Umstieg
```

Der Nutzer soll sofort verstehen können, warum Alternative 2 oder 3 nicht ausgewählt wurde.

Beispiele:

```text
6 min langsamer
```

```text
8 min längerer Fußweg
```

```text
12 min längere Wartezeit
```

```text
aktuell +9 min verspätet
```

---

## 9. Echtzeitinformationen

Echtzeitdaten sollen klar, aber nicht alarmistisch dargestellt werden.

Beispiele:

```text
pünktlich
```

```text
+3 min
```

```text
+8 min
```

```text
fällt aus
```

```text
Haltestelle wird nicht bedient
```

```text
Störung auf dieser Linie
```

Farben dürfen unterstützend verwendet werden, dürfen aber niemals die einzige Informationsträger sein.

---

## 10. Umstiege

Umstiege sollen besonders verständlich dargestellt werden.

Beispiel:

```text
Umstieg am Karlsplatz
3 min

ca. 180 m Fußweg
```

Wenn der Umstieg knapp ist:

```text
Knapp, aber aktuell erreichbar
```

Wenn mehr Zeit vorhanden ist:

```text
Entspannter Umstieg
```

Die Anwendung soll keine unrealistischen Umstiege empfehlen.

Berücksichtige:

```text
Ankunft
+ tatsächliche Gehzeit
+ Mindestumstiegszeit
+ Sicherheitspuffer
<= Abfahrt
```

---

## 11. Fußwege

Fußwege sollen explizit dargestellt werden.

Beispiel:

```text
6 min zu Fuß
420 m
```

Wenn ein Fußweg Teil eines Umstiegs ist:

```text
3 min zu Fuß zum Bahnsteig / zur nächsten Haltestelle
```

Die App soll später eine Einstellung unterstützen können:

```text
Maximaler Fußweg
```

Für den MVP ist ein sinnvoller Standardwert ausreichend.

---

## 12. Karte

Die Karte ist sekundär.

Die Zeitlinie ist die primäre Darstellung.

Eine Karte soll optional eingeblendet werden können.

Auf der Karte:

- Start
- Ziel
- Fußwege
- ÖPNV-Verlauf
- Umstiegspunkte
- aktuelle Position

Verwende:

- MapLibre GL
- OpenStreetMap-basierte Tiles

Die Architektur muss erlauben, später andere Tile-Anbieter einzusetzen.

---

## 13. Routing Request

Die öffentliche Backend-API soll beispielsweise folgenden Endpoint anbieten:

```http
POST /api/v1/journeys/search
```

Request:

```json
{
  "from": {
    "lat": 48.20849,
    "lon": 16.37208,
    "label": "Stephansplatz"
  },
  "to": {
    "lat": 48.1103,
    "lon": 16.5697,
    "label": "Flughafen Wien"
  },
  "dateTime": "2026-09-24T15:45:00+02:00",
  "timeMode": "DEPARTURE",
  "preferences": {
    "maxWalkingDistance": 1500,
    "maxTransfers": 6,
    "wheelchair": false,
    "optimization": "FASTEST"
  }
}
```

---

## 14. Routing Response

Das Backend soll keine rohe OTP-Antwort an das Frontend weiterreichen.

Es soll ein eigenes API-Modell erzeugen.

Beispiel:

```json
{
  "generatedAt": "2026-09-24T15:42:00+02:00",
  "recommendedJourneyId": "journey-1",
  "journeys": [
    {
      "id": "journey-1",
      "recommended": true,
      "departureTime": "2026-09-24T15:45:00+02:00",
      "arrivalTime": "2026-09-24T16:21:00+02:00",
      "durationSeconds": 2160,
      "walkingSeconds": 420,
      "transferCount": 2,
      "realtime": true,
      "explanation": {
        "headline": "Aktuell schnellste Verbindung",
        "details": [
          "8 Minuten schneller als die direkte Alternative",
          "Die direkte Verbindung ist aktuell verspätet"
        ]
      },
      "legs": []
    }
  ]
}
```

---

## 15. Datenquellen

Die Architektur soll folgende Datenquellen unterstützen.

### GTFS

Statische Fahrplandaten:

- VOR
- Wiener Linien
- ÖBB

Dabei auf mögliche doppelte Daten achten.

Jeder Feed erhält eine eindeutige Feed-ID.

Beispiel:

```text
VOR
OEBB
WL
```

### GTFS-Realtime

Verwende GTFS-RT intern für:

- Trip Updates
- Vehicle Positions
- Alerts

Falls ein Datenanbieter kein natives GTFS-RT liefert, implementiere einen Adapter.

Beispiel:

```text
Wiener Linien Realtime API
        |
        v
Realtime Adapter
        |
        v
internes GTFS-RT
        |
        v
OpenTripPlanner
```

---

## 16. Realtime Adapter

Implementiere einen separaten Realtime-Service.

Aufgaben:

- Provider APIs pollen
- Provider-Daten normalisieren
- GTFS-Realtime erzeugen
- Redis aktualisieren
- Historie in PostgreSQL schreiben

Endpoints:

```text
/trip-updates.pb
/vehicle-positions.pb
/alerts.pb
```

---

## 17. OpenTripPlanner

OpenTripPlanner soll als eigener Docker-Service laufen.

Input:

```text
GTFS
+
OpenStreetMap
+
GTFS-Realtime
```

OTP ist verantwortlich für:

- multimodales Routing
- ÖPNV-Verbindungen
- Fußwege
- Umstiege
- Fahrplanlogik
- Echtzeitänderungen

Das Backend ist verantwortlich für:

- API
- Ranking
- verständliche Erklärungen
- Caching
- Datenhistorisierung
- Nutzerlogik

---

## 18. Routing-Algorithmus

Der MVP soll keine eigene vollständige Routingengine implementieren.

Verwende OTP für die Kandidatensuche.

Ablauf:

```text
Route Search Request
        |
        v
OpenTripPlanner
        |
        v
mehrere valide Kandidaten
        |
        v
normalisieren
        |
        v
Realtime Plausibility Check
        |
        v
Ranking
        |
        v
Top 3
```

Für `FASTEST` gilt primär:

```text
score = realistische Ankunftszeit
```

Zusätzliche Faktoren dürfen nur als Tie-Breaker oder zur Plausibilisierung dienen:

```text
Umstiege
Fußweg
Anschlussrisiko
Störungen
```

Keine Route mit früherer Ankunft darf allein wegen eines zusätzlichen Umstiegs künstlich schlechter bewertet werden.

---

## 19. Erklärungsgenerator

Implementiere eine regelbasierte Explanation Engine.

Sie vergleicht die empfohlene Verbindung mit den Alternativen.

Beispielregeln:

```text
recommended.arrival < alternative.arrival
```

Ergebnis:

```text
"Diese Verbindung ist 7 Minuten schneller."
```

Wenn:

```text
recommended.transfers > alternative.transfers
```

aber trotzdem schneller:

```text
"Trotz eines zusätzlichen Umstiegs erreichst du dein Ziel 7 Minuten früher."
```

Wenn Alternative verspätet:

```text
"Die Alternative ist aktuell etwa 9 Minuten verspätet."
```

Wenn höhere Wartezeit:

```text
"Bei der Alternative beträgt die nächste Wartezeit 14 Minuten."
```

Wenn Ausfall:

```text
"Die direkte Verbindung fällt aktuell aus."
```

Erklärungen müssen:

- kurz
- nachvollziehbar
- nicht technisch
- faktenbasiert

sein.

---

## 20. Datenbank

Verwende PostgreSQL mit PostGIS.

Schemas:

```text
transport
realtime
incident
routing
analytics
```

Beispieltabellen:

```text
transport.stop
transport.route
transport.trip

realtime.trip_update
realtime.stop_time_update
realtime.vehicle_position

incident.disruption

routing.request
routing.journey
routing.journey_leg

analytics.delay_history
analytics.travel_time_history
```

PostGIS wird insbesondere verwendet für:

- Haltestellen in der Nähe
- Incident-Geometrien
- räumliche Analyse
- spätere Heatmaps
- Zuordnung von Ereignissen zu Netzsegmenten

---

## 21. Redis

Redis ist der Live-Cache.

Verwende Redis für:

```text
aktuelle Verspätungen
aktuelle Abfahrten
Fahrzeugpositionen
Störungen
Route-Search-Cache
```

Beispiele:

```text
delay:trip:{id}
departures:stop:{id}
vehicle:{id}
incident:{id}
journey-search:{hash}
```

Kurze TTLs verwenden.

---

## 22. Frontend-Komponenten

Plane mindestens folgende Komponenten:

```text
AppShell
SearchForm
LocationInput
DateTimeSelector
JourneyResults
JourneyCard
JourneyTimeline
JourneyLeg
TransferStep
WalkStep
RealtimeBadge
JourneyExplanation
AlternativeComparison
MapPanel
LoadingState
ErrorState
EmptyState
```

---

## 23. UX-Anforderungen

Die App soll auch ohne Erklärung verständlich sein.

Prioritäten:

1. Wann fahre ich los?
2. Wann komme ich an?
3. Welche Linien muss ich nehmen?
4. Wo muss ich umsteigen?
5. Wie lange muss ich gehen?
6. Gibt es Verspätungen?
7. Warum ist diese Verbindung die beste?

Vermeide technische Begriffe wie:

```text
GTFS
OTP
Trip Update
Stop Time Update
```

im Benutzerinterface.

---

## 24. Responsive Verhalten

Mobile:

```text
Suchformular
Ergebnisse
Zeitlinie
optionale Karte
```

Desktop:

```text
+----------------------------------+----------------+
| Suche + Verbindungen             | Karte          |
|                                  |                |
| Zeitlinie                        |                |
|                                  |                |
+----------------------------------+----------------+
```

Die App muss aber auch vollständig ohne sichtbare Karte bedienbar sein.

---

## 25. Zustände

Implementiere saubere UX für:

### Loading

```text
Suche aktuelle Verbindungen …
```

### Keine Verbindung

```text
Aktuell konnte keine passende Verbindung gefunden werden.
```

### Realtime nicht verfügbar

```text
Aktuelle Echtzeitdaten sind derzeit nicht verfügbar.
Die Verbindung basiert auf Fahrplandaten.
```

### Backend-Fehler

Keine technischen Stacktraces anzeigen.

---

## 26. Projektstruktur Frontend

Beispiel:

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── features/
│   │   ├── search/
│   │   ├── journeys/
│   │   └── map/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── types/
│   └── utils/
├── public/
├── netlify.toml
├── vite.config.ts
└── package.json
```

---

## 27. Projektstruktur Backend

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   │   ├── otp/
│   │   ├── routing/
│   │   ├── realtime/
│   │   ├── explanations/
│   │   └── geocoding/
│   ├── repositories/
│   └── main.py
├── tests/
├── Dockerfile
└── pyproject.toml
```

---

## 28. Development Setup

Stelle ein lokales Docker-Setup bereit.

```text
docker compose up
```

soll mindestens starten:

```text
backend
otp
postgres
redis
realtime-adapter
```

Das Frontend kann separat laufen:

```bash
npm install
npm run dev
```

---

## 29. Netlify

Das Frontend muss ohne manuelle Änderungen auf Netlify deploybar sein.

Erstelle:

```text
netlify.toml
```

Verwende Umgebungsvariablen:

```text
VITE_API_BASE_URL
VITE_MAP_STYLE_URL
```

Keine Backend-Secrets im Frontend speichern.

---

## 30. Security

Berücksichtige:

- CORS
- Rate Limiting
- Input Validation
- sichere Environment Variables
- keine Secrets im Repository
- Request Timeouts
- API Error Handling

---

## 31. Testing

Frontend:

- Vitest
- React Testing Library
- Playwright

Backend:

- pytest

Teste insbesondere:

- Location Search
- Routing Requests
- Journey Ranking
- Explanation Engine
- Verspätungen
- Ausfälle
- mehrere Umstiege
- keine Verbindung
- Realtime-Ausfall

---

## 32. Entwicklungsstrategie

Implementiere das Projekt iterativ.

### Phase 1

Erstelle zunächst einen funktionierenden Frontend-Prototyp mit Mock-Daten.

Features:

```text
Von
Nach
Suche
3 Verbindungen
Zeitlinie
Erklärungen
Responsive UI
```

Noch keine reale OTP-Anbindung.

### Phase 2

Backend-Grundgerüst:

```text
FastAPI
PostgreSQL
Redis
```

### Phase 3

OpenTripPlanner integrieren.

Zunächst nur:

```text
GTFS
OSM
```

ohne Echtzeit.

### Phase 4

Realtime Adapter integrieren.

### Phase 5

Ranking und Explanation Engine.

### Phase 6

Live Re-Routing und Historisierung.

---

## 33. Erste konkrete Entwicklungsaufgabe

Beginne jetzt mit Phase 1.

Erzeuge eine produktionsnahe Frontend-Anwendung.

Verwende Mock-Daten für folgende Suche:

```text
Von:
Stephansplatz, Wien

Nach:
Flughafen Wien
```

Erzeuge drei plausible Beispielverbindungen.

Eine Route soll als:

```text
EMPFOHLEN
```

markiert werden.

Die empfohlene Verbindung soll einen zusätzlichen Umstieg haben, aber aufgrund einer Verspätung der direkten Alternative trotzdem schneller sein.

Zeige dies verständlich an:

```text
Warum diese Verbindung?

Trotz eines zusätzlichen Umstiegs bist du aktuell 8 Minuten schneller am Ziel. Die direkte Verbindung ist derzeit verspätet.
```

Implementiere:

- Suchformular
- Journey Cards
- Zeitlinie
- Walking Legs
- Transit Legs
- Transfers
- Realtime Badges
- Explanation Box
- responsive Darstellung
- saubere TypeScript Types
- Mock API Layer

Nutze eine moderne, ruhige Oberfläche.

Keine überladenen Dashboards.

Der Fokus liegt auf:

```text
Von
Nach
Abfahrtszeit
Ankunftszeit
Dauer
Umstiege
Zeitlinie
Warum diese Route?
```

---

## 34. Coding-Regeln

Arbeite bei allen Schritten nach folgenden Regeln:

- vollständigen Code liefern
- keine Pseudocode-Dateien
- keine unvollständigen Platzhalter
- TypeScript strict mode
- kleine, klar abgegrenzte Komponenten
- verständliche Namen
- keine unnötigen Abstraktionen
- keine unnötigen Dependencies
- Business-Logik nicht in UI-Komponenten verstecken
- API-Typen zentral definieren
- Fehlerfälle berücksichtigen
- Accessibility berücksichtigen
- mobile-first CSS
- Code muss lokal startbar sein

Wenn du eine Architekturentscheidung triffst, begründe sie kurz.

Wenn etwas für den MVP noch nicht notwendig ist, implementiere es nicht vorsorglich kompliziert.

Priorität:

```text
funktionierend
verständlich
wartbar
erweiterbar
```

vor:

```text
maximal abstrakt
enterprise overengineering
```

## Endziel

Das Ergebnis soll sich für den Nutzer wie eine sehr einfache Mobilitäts-App anfühlen:

```text
Von wo?
Wohin?
```

Danach soll der Nutzer innerhalb weniger Sekunden erkennen:

```text
Das ist aktuell meine beste Verbindung.
```

Und zusätzlich verstehen:

```text
Warum genau diese?
```

Die technische Komplexität von GTFS, Realtime-Daten, OpenTripPlanner, Routing und Ranking soll vollständig hinter einer einfachen Benutzeroberfläche verborgen bleiben.
