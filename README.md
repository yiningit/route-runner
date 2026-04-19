# route-runner

## Setup (NOT FINISHED)

1. Install dependencies: `pip install -r requirements.txt`
2. Fetch places data: `python scripts/load_foursquare_places.py`
3. Copy `.env.example` to `.env` and add your `ORS_API_KEY`
4. Start the server: `uvicorn main:app --reload`