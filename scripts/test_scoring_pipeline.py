import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.services.places import load_places
from backend.services.crowd_scoring import compute_score, map_category

df = load_places().head(20).copy()

hour = 19

for _, row in df.iterrows():
   category = map_category(row.get("fsq_category_labels"))
   score = compute_score(row, hour=hour, nearby_total=5, nearby_food=2)
   print(row.get("name"), "|", category, "|", score)