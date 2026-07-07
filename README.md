# FlightRadar26

A real-time flight tracker in the browser. It plots live aircraft on an interactive map, lets you click any plane to see its telemetry, and traces the recent path of the flight you're following.

Live aircraft data comes from the [OpenSky Network](https://opensky-network.org/) API, proxied through a small Express backend so the browser never talks to OpenSky (or its credentials) directly.

## Features

- **Live map** — aircraft rendered as heading-rotated plane icons on a Leaflet map (CARTO Voyager tiles), centered on Singapore by default.
- **Auto-refresh** — positions reload on a timer and whenever you pan or zoom.
- **Flight details** — click any aircraft to open a sidebar showing callsign, country, ICAO hex, altitude, speed (converted to knots), track, and coordinates.
- **Path tracing** — the selected flight's last ~20 positions are drawn as a polyline.
- **Search** — a callsign search box in the navbar.

## Tech stack

| Layer | Tools |
|-------|-------|
| Frontend | Vanilla JavaScript, [Leaflet](https://leafletjs.com/), Bootstrap 5, Axios |
| Backend | Node.js, Express 5, Axios, CORS, dotenv |
| Data source | OpenSky Network REST API |

## Project structure

```
Flight-Radar-Project/
├── Backend/
│   ├── index.js          # Express proxy: fetches OpenSky state vectors
│   └── package.json
├── Frontend/
│   ├── index.html        # Map + navbar + detail sidebar
│   ├── script.js         # Map init, polling, aircraft rendering, sidebar
│   ├── style.css
│   ├── aircraft.png      # Plane marker icon
│   └── testdata.json     # Sample OpenSky response for offline testing
└── example.js            # Standalone Aircraft class prototype (scratch)
```

## Getting started

### Prerequisites

- Node.js (18+ recommended)
- An [OpenSky Network](https://opensky-network.org/) account (the public API is rate-limited; an account raises the limits)

### 1. Backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/` with your OpenSky credentials:

```
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

> **Security note:** do not commit real credentials to source. `.env` is already listed in `.gitignore` — keep it that way, and read the credentials from `process.env` inside `index.js`.

Start the server:

```bash
node index.js
```

It listens on **http://localhost:8000**.

### 2. Frontend

The frontend is static — open `Frontend/index.html` in a browser, or serve the folder with any static server (for example `npx serve Frontend`). The page calls the backend at `http://localhost:8000`, so the backend must be running first.

## API endpoints

The backend exposes two proxy routes:

| Route | Description |
|-------|-------------|
| `GET /opensky/api/state/all` | All aircraft state vectors from OpenSky. Accepts the same query params as OpenSky. |
| `GET /opensky/api/state/switzerland` | State vectors bounded to a Switzerland bounding box. |

Responses follow the OpenSky [state vector](https://opensky-network.org/apidoc/rest.html) format — each aircraft is an array where the fields used by the frontend are: `[0] ICAO`, `[1] callsign`, `[2] country`, `[5] longitude`, `[6] latitude`, `[7] altitude`, `[8] onGround`, `[9] velocity`, `[10] heading`.

## Known issues

- **Aircraft don't render as-is.** The Opensky API often gets rate limited
- **Search is a placeholder.** The callsign search currently echoes the entered text into the sidebar rather than filtering the map.

## License

ISC (per `Backend/package.json`).