import math
from datetime import datetime

_EARTH_RADIUS_M = 6_371_000.0

CATEGORY_HOUR_SCORES = {
   "cafe": {
       "morning": 0.95,
       "lunch": 0.55,
       "afternoon": 0.45,
       "evening": 0.20,
       "night": 0.05,
   },
   "restaurant": {
       "morning": 0.10,
       "lunch": 0.90,
       "afternoon": 0.35,
       "evening": 0.95,
       "night": 0.40,
   },
   "bar": {
       "morning": 0.00,
       "lunch": 0.10,
       "afternoon": 0.25,
       "evening": 0.90,
       "night": 1.00,
   },
   "gym": {
       "morning": 0.90,
       "lunch": 0.30,
       "afternoon": 0.25,
       "evening": 0.95,
       "night": 0.15,
   },
   "retail": {
       "morning": 0.35,
       "lunch": 0.70,
       "afternoon": 0.85,
       "evening": 0.45,
       "night": 0.05,
   },
   "grocery": {
       "morning": 0.55,
       "lunch": 0.60,
       "afternoon": 0.70,
       "evening": 0.65,
       "night": 0.15,
   },
   "outdoor": {
       "morning": 0.60,
       "lunch": 0.75,
       "afternoon": 0.85,
       "evening": 0.40,
       "night": 0.05,
   },
   "other": {
       "morning": 0.20,
       "lunch": 0.20,
       "afternoon": 0.20,
       "evening": 0.20,
       "night": 0.10,
   },
}


def get_time_bucket(hour: int) -> str:
   if 6 <= hour <= 10:
       return "morning"
   if 11 <= hour <= 14:
       return "lunch"
   if 15 <= hour <= 17:
       return "afternoon"
   if 18 <= hour <= 21:
       return "evening"
   return "night"


def map_category(labels) -> str:
   if labels is None:
       return "other"

   if isinstance(labels, (list, tuple)) and len(labels) == 0:
       return "other"

   text = " ".join([str(x) for x in labels]).lower()

   if "cafe" in text or "coffee" in text:
       return "cafe"
   if "restaurant" in text or "dining" in text or "food" in text:
       return "restaurant"
   if "bar" in text or "pub" in text or "nightlife" in text:
       return "bar"
   if "gym" in text or "fitness" in text:
       return "gym"
   if "shop" in text or "store" in text or "retail" in text:
       return "retail"
   if "supermarket" in text or "grocery" in text:
       return "grocery"
   if "park" in text or "beach" in text:
       return "outdoor"

   return "other"


def is_probably_closed(row) -> bool:
   # Check date_closed
   if row.get("date_closed") is not None:
       return True

   flags = row.get("unresolved_flags")

   if flags is None:
       return False

   if isinstance(flags, (list, tuple)) and len(flags) == 0:
       return False

   text = " ".join([str(x) for x in flags]).lower()

   if "closed" in text or "doesnt_exist" in text:
       return True

   return False


def compute_score(row, hour: int, nearby_total: int = 0, nearby_food: int = 0) -> float:
   # Skip closed places
   if is_probably_closed(row):
       return 0.0

   category = map_category(row.get("fsq_category_labels"))

   # Get time bucket
   bucket = get_time_bucket(hour)

   # Base score
   base = CATEGORY_HOUR_SCORES[category][bucket]

   # Cluster multiplier (simple for now)
   cluster_multiplier = min(1 + 0.03 * nearby_total + 0.05 * nearby_food, 2.0)

   return round(base * cluster_multiplier, 4)


# Helper to find points along the route
def sample_route_points(coords, step=10):
    return coords[::step]

def distance_m(lat1, lng1, lat2, lng2):
    x = math.radians(lng2 - lng1) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat2 - lat1)
    return math.sqrt(x*x + y*y) * _EARTH_RADIUS_M

def get_nearby_places(point, places, radius_m=50):
    lat, lng = point
    results = []

    for place in places:
        d = distance_m(lat, lng, place["lat"], place["lng"])  # ← fixed args
        if d <= radius_m:
            results.append(place)

    return results



def compute_route_popularity(route, places):
    print(type(places), type(places[0]) if len(places) > 0 else "empty")

    coords = route.coordinates
    sampled_points = sample_route_points(coords, step=10)

    hour = datetime.now().hour
    total_score = 0
    total_samples = 0

    for point in sampled_points:
        nearby = get_nearby_places(point, places)

        if not nearby:
            continue

        for place in nearby:
            try:
                score = compute_score(
                    place,
                    hour,
                    nearby_total=len(nearby),
                    nearby_food=sum(
                        1 for p in nearby
                        if map_category(p.get("fsq_category_labels")) in ["cafe", "restaurant"]
                    )
                )
                total_score += score
                total_samples += 1
            except Exception as e:
                print(f"compute_score crashed: {e}, place={place}")
                raise


    if total_samples == 0:
        return 0

    return total_score / total_samples