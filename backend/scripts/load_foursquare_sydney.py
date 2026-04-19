import re
import os
import time
import httpx
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")   # always finds backend/.env

FSQ_API_KEY = os.environ.get("FSQ_API_KEY")
if not FSQ_API_KEY:
    raise ValueError("FSQ_API_KEY not set in .env")

# Assumes script lives at backend/scripts/load_foursquare_sydney.py
ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "backend" / "data" / "places_sample.parquet"
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Sydney bounding box
SYDNEY_NE = "-33.4,151.5"   # north-east corner
SYDNEY_SW = "-34.2,150.5"   # south-west corner

# Places API integer category IDs — https://docs.foursquare.com/data-products/docs/categories
CATEGORIES = {
    "cafe":       "4bf58dd8d48988d16d941735",
    "restaurant": "4d4b7105d754a06374d81259",
    "bar":        "4bf58dd8d48988d116941735",
    "gym":        "4bf58dd8d48988d176941735",
    "retail":     "4d4b7105d754a06378d81259",
    "grocery":    "4bf58dd8d48988d118951735",
    "outdoor":    "4d4b7105d754a06377d81259",
}

HEADERS = {
    "Authorization": f"Bearer {FSQ_API_KEY}",
    "X-Places-Api-Version": "2025-06-17",
    "Accept": "application/json",
}

rows = []

for category_name, category_id in CATEGORIES.items():
    print(f"Fetching {category_name} (id={category_id})...")
    fetched = 0
    cursor = None

    while True:
        params = {
            "ne": SYDNEY_NE,
            "sw": SYDNEY_SW,
            "fsq_category_ids": category_id,
            "limit": 50,
            "fields": "fsq_place_id,name,latitude,longitude,categories,date_closed,unresolved_flags",
        }
        if cursor:
            params["cursor"] = cursor

        try:
            resp = httpx.get(
                "https://places-api.foursquare.com/places/search",
                headers=HEADERS,
                params=params,
                timeout=15.0,
            )
        except httpx.RequestError as e:
            print(f"  Network error: {e} — skipping remaining pages")
            break

        if resp.status_code == 429:
            print("  Rate limited — waiting 60s...")
            time.sleep(60)
            continue

        if resp.status_code != 200:
            print(f"  Error {resp.status_code}: {resp.text[:200]}")
            break

        data = resp.json()
        results = data.get("results", [])

        if not results:
            break

        for place in results:
            lat = place.get("latitude")
            lng = place.get("longitude")

            if lat is None or lng is None:
                continue

            rows.append({
                "fsq_place_id": place.get("fsq_place_id"),
                "name": place.get("name"),
                "latitude": lat,
                "longitude": lng,
                "fsq_category_labels": [c["name"] for c in place.get("categories", [])],
                "date_closed": place.get("date_closed"),
                "unresolved_flags": place.get("unresolved_flags") or None,
            })

        fetched += len(results)

        # FSQ Places API returns next-page cursor in the Link response header:
        # Link: <https://...?cursor=abc123>; rel="next"
        link_header = resp.headers.get("Link", "")
        if 'rel="next"' in link_header:
            match = re.search(r'cursor=([^&>]+)', link_header)
            cursor = match.group(1) if match else None
        else:
            cursor = None

        print(f"  Page done — {fetched} so far")
        time.sleep(0.2)

        if cursor is None:
            break

    print(f"  → {fetched} total for {category_name}")

df = pd.DataFrame(rows).drop_duplicates(subset="fsq_place_id")
print(f"\nTotal unique Sydney places: {len(df)}")
print(df[["name", "latitude", "longitude", "fsq_category_labels"]].head(10))

df.to_parquet(OUTPUT_PATH, index=False)
print(f"Saved to {OUTPUT_PATH}")