from datasets import load_dataset
import pandas as pd
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "backend" / "data" / "places_sample.parquet"

os.makedirs("data", exist_ok=True)

ds = load_dataset(
   "foursquare/fsq-os-places",
   "places",
   split="train",
   streaming=True
)

rows = []

for row in ds:
   if row["latitude"] is not None and row["longitude"] is not None:
       rows.append(row)

   if len(rows) >= 20000:
       break


df = pd.DataFrame(rows)

print(df.columns.tolist())
print("Rows collected:", len(df))


df.to_parquet("backend/data/places_sample.parquet", index=False)
print("Saved to data/places_sample.parquet")