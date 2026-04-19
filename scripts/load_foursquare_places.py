from datasets import load_dataset
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "backend" / "data" / "places_sample.parquet"
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

KEEP_COLUMNS = [
    "name",
    "latitude",
    "longitude",
    "fsq_category_labels",
    "date_closed",
    "unresolved_flags",
]

ds = load_dataset(
    "foursquare/fsq-os-places",
    "places",
    split="train",
    streaming=True
)

rows = []

for row in ds:
    # skip rows without coordinates
    if row.get("latitude") is None or row.get("longitude") is None:
        continue

    # keep only needed columns
    filtered_row = {col: row.get(col) for col in KEEP_COLUMNS}
    rows.append(filtered_row)

    if len(rows) >= 20000:
        break

df = pd.DataFrame(rows)

print(df.columns.tolist())
print("Rows collected:", len(df))

df.to_parquet(OUTPUT_PATH, index=False)
print(f"Saved to {OUTPUT_PATH}")

