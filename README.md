# Route Runner 🏃

> Smarter running routes: fewer traffic lights, less elevation, lower crowd density.

Route Runner is a web app that generates smarter loop running routes from your current location. Instead of manually planning a route, you drop a pin and get back up to three scored options — ranked by how many traffic lights you'll hit, how hilly the terrain is, and how busy the surrounding streets are likely to be right now.

Built for the **2026 SUDATA × COMM-STEM Datathon**, tackling Theme 2 (The Geography of Everything).

---

## The Problem

Existing tools like Google Maps or Strava's route builder build routes naively. They don't automatically generate loop routes, or don't score routes against factors that matter to runners — traffic light interruptions, elevation gain, or how crowded the streets feel at different times of day.

Route Runner solves this by combining three open datasets to score routes intelligently:

- **OpenRouteService** — generates candidate loop routes from your location
- **Foursquare Open Source Places** — powers the crowd density scoring based on nearby venues
- **NSW Traffic Light data** — counts signalised intersections along each route

---

## Features

- 📍 Detects your location automatically (falls back to Sydney CBD if denied)
- 🔄 Generates up to 3 scored loop routes at your chosen distance
- 🚦 Counts traffic lights along each route
- ⛰️ Shows elevation gain per route
- 👥 Estimates crowd density based on nearby venues and time of day
- 🗺️ Interactive map with clickable routes and popups
- 📤 Export any route as a GPX file for Strava or Garmin easily

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Leaflet, Turf.js, Vite |
| Backend | Python, FastAPI, Uvicorn |
| Routing | OpenRouteService API |
| Places data | Foursquare Open Source Places |
| Traffic data | NSW traffic lights dataset |

---

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.10+
- An [OpenRouteService API key](https://openrouteservice.org/dev/#/signup)
- A [Foursquare Places API key](https://foursquare.com/developer)

### 1. Clone the repo

```bash
git clone https://github.com/your-org/route-runner.git
cd route-runner
```

### 2. Install dependencies

```bash
# Frontend
cd frontend
npm install
 
# Backend (from project root)
cd backend
pip install -r requirements.txt
```
 
### 3. Set up environment variables
 
Create a `backend/.env` file:
 
```
ORS_API_KEY=your_openrouteservice_key
FSQ_API_KEY=your_foursquare_key
```

Create a `frontend/.env` file:
 
```
VITE_API_BASE_URL=http://localhost:8000
```
 
### 4. Fetch Sydney places data (one-time setup)
 
This script fetches venue data for Sydney from the Foursquare Places API and saves it locally. It only needs to be run once, but **may take a few minutes** depending on your API plan and connection.
 
```bash
python backend/scripts/load_foursquare_sydney.py
```
 
### 5. Start the backend
 
```bash
cd backend
uvicorn main:app --reload
```
 
### 6. Start the frontend
 
```bash
cd frontend
npm run dev
```
 
Open [http://localhost:5173](http://localhost:5173) in your browser.
 
---
 
## Project structure
 
```
route-runner/
├── backend/
│   ├── data/                  # traffic_lights.json + generated places parquet
│   ├── models/                # Pydantic schemas
│   ├── routes/                # FastAPI route handlers
│   ├── scripts/               # One-time setup scripts
│   │   └── load_foursquare_sydney.py
│   └── services/
│       ├── crowd_scoring.py   # Foursquare-based crowd density scoring
│       ├── ors_client.py      # OpenRouteService API client
│       └── routing_service.py # Route scoring and ranking
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── MapView.jsx    # Leaflet map with routes and traffic lights
    │   │   └── RoutePanel.jsx # Route selection and controls
    │   ├── hooks/
    │   │   └── useRoutes.js   # Route fetching and state
    │   └── services/
    │       └── api.js         # Backend API client
    └── package.json
```
 
---
 
## How scoring works
 
Each candidate route receives a **penalty score** — lower is better. The score is a weighted sum of:
 
| Factor | Weight (avoid on) | Weight (avoid off) |
|---|---|---|
| Distance deviation from target | 1.0 | 1.0 |
| Traffic light count | 5.0 | 1 |
| Elevation gain | 0.1 | 0.01 |
| Crowd density | 5 | 0.1 |
 
Crowd density is estimated by sampling points along the route, finding nearby Foursquare venues within 150m, and scoring each venue by category and time of day (e.g. cafes score high in the morning, bars score high at night).
 
The top 3 routes are labelled: **Fewest Lights**, **Flattest**, and **Best Flow**.
 
---
 
## Known limitations
 
- Currently covers **Sydney, Australia only**
- The Foursquare data fetch script may be slow on free-tier API plans (rate limited to 1,000 calls/day)
- ORS free tier may return slower responses under load
---
 
## Future features
 
- 🔒 Safety scoring using crime data
- 🚰 Water fountain locations along routes
- 🚲 Cycling route support with cyclist-specific preferences
- 🌏 Expansion beyond Sydney
---
 
## Team
 
- [Yi Ning Tan](https://github.com/yiningit)
- [Kristania Gunawan](https://github.com/FrappyKrissy)
- [Kristina Gunawan](https://github.com/loopsaloy)
- [Gousia Ain](https://github.com/gousiaain)
---
 
## Data sources
 
- [Foursquare Open Source Places](https://huggingface.co/datasets/foursquare/fsq-os-places)
- [OpenRouteService](https://openrouteservice.org/)
- NSW Traffic Light data
---
 
## License
 
This project was built for the 2026 SUDATA × COMM-STEM Datathon. No license has been applied yet.