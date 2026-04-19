from fastapi import APIRouter, Query
from services.places import load_places
from backend.services.crowd_scoring import compute_score, map_category

router = APIRouter()

@router.get("/businesses")
def get_businesses(hour: int = Query(..., ge=0, le=23)):
   df = load_places().copy()
   print("Before drop:", len(df))
   df = df.dropna(subset=["latitude", "longitude"])
   print("After drop:", len(df))

   df["category_group"] = df["fsq_category_labels"].apply(map_category)
   df["score"] = df.apply(
       lambda row: compute_score(row, hour=hour, nearby_total=5, nearby_food=2),
       axis=1
   )

   top = df[df["score"] > 0].sort_values("score", ascending=False).head(100)

   return top[["name", "latitude", "longitude", "category_group", "score"]].to_dict(orient="records")