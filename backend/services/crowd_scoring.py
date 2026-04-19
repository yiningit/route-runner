import math
from datetime import datetime
import numpy as np

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
    # "gym": {
    #     "morning": 0.90,
    #     "lunch": 0.30,
    #     "afternoon": 0.25,
    #     "evening": 0.95,
    #     "night": 0.15,
    # },
    # "retail": {
    #     "morning": 0.35,
    #     "lunch": 0.70,
    #     "afternoon": 0.85,
    #     "evening": 0.45,
    #     "night": 0.05,
    # },
    # "grocery": {
    #     "morning": 0.55,
    #     "lunch": 0.60,
    #     "afternoon": 0.70,
    #     "evening": 0.65,
    #     "night": 0.15,
    # },
    "outdoor": {
        "morning": 0.60,
        "lunch": 0.75,
        "afternoon": 0.85,
        "evening": 0.40,
        "night": 0.05,
    },
    "transit": {
        "morning":   1.00,  # peak commute
        "lunch":     0.50,
        "afternoon": 0.60,
        "evening":   0.90,  # peak commute return
        "night":     0.20,
    },
    "school": {
        "morning":   0.90,  # drop-off
        "lunch":     0.30,
        "afternoon": 0.85,  # pick-up
        "evening":   0.05,
        "night":     0.00,
    },
    "event_venue": {
        "morning":   0.10,
        "lunch":     0.20,
        "afternoon": 0.40,
        "evening":   0.95,  # shows, games
        "night":     0.70,
    },
    "market": {
        "morning":   0.90,  # markets peak early
        "lunch":     0.60,
        "afternoon": 0.20,
        "evening":   0.00,
        "night":     0.00,
    },
    "nightclub": {
        "morning":   0.00,
        "lunch":     0.00,
        "afternoon": 0.05,
        "evening":   0.50,
        "night":     1.00,
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
    if isinstance(labels, (list, tuple, np.ndarray)) and len(labels) == 0:
        return "other"

    # Normalize accented characters and lowercase
    import unicodedata
    text = " ".join([str(x) for x in labels])
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower()

    if "cafe" in text or "coffee" in text or "bakery" in text or "patisserie" in text:
        return "cafe"
    if "restaurant" in text or "dining" in text or "food" in text or "bistro" in text or "brasserie" in text:
        return "restaurant"
    if "bar" in text or "pub" in text or "nightlife" in text or "brewery" in text or "cocktail" in text:
        return "bar"
    # if "gym" in text or "fitness" in text or "yoga" in text or "pilates" in text:
    #     return "gym"
    # if "shop" in text or "store" in text or "retail" in text or "boutique" in text:
    #     return "retail"
    # if "supermarket" in text or "grocery" in text or "convenience" in text:
    #     return "grocery"
    if "park" in text or "beach" in text or "garden" in text or "trail" in text or "outdoor" in text:
        return "outdoor"
    if "transit" in text or "train" in text or "bus station" in text or "metro" in text:
        return "transit"
    if "school" in text or "university" in text or "college" in text:
        return "school"
    if "stadium" in text or "arena" in text or "theatre" in text or "concert" in text:
        return "event_venue"
    if "market" in text:
        return "market"
    if "nightclub" in text or "club" in text or "night club" in text:
        return "nightclub"
    
    return "other"


def is_probably_closed(row) -> bool:
    date_closed = row.get("date_closed")
    if date_closed is not None and not (isinstance(date_closed, float) and math.isnan(date_closed)):
        return True

    flags = row.get("unresolved_flags")
    if flags is None:
        return False
    if isinstance(flags, (list, tuple, np.ndarray)) and len(flags) == 0:
        return False

    text = " ".join([str(x) for x in flags]).lower()
    return "closed" in text or "doesnt_exist" in text


def compute_score(row, hour: int, nearby_total: int = 0, nearby_food: int = 0) -> float:
    if is_probably_closed(row):
        return 0.0

    category = map_category(row.get("fsq_category_labels"))
    bucket = get_time_bucket(hour)
    base = CATEGORY_HOUR_SCORES[category][bucket]
    cluster_multiplier = min(1 + 0.03 * nearby_total + 0.05 * nearby_food, 2.0)
    return round(base * cluster_multiplier, 4)


def sample_route_points(coords, step=10):
    return coords[::step]


def distance_m(lat1, lng1, lat2, lng2):
    x = math.radians(lng2 - lng1) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat2 - lat1)
    return math.sqrt(x * x + y * y) * _EARTH_RADIUS_M


def get_nearby_places(point, places, radius_m=150):
    lat, lng = point
    return [
        place for place in places
        if distance_m(lat, lng, place["lat"], place["lng"]) <= radius_m
    ]


def compute_route_popularity(route, places) -> float:
    coords = route.coordinates
    sampled_points = sample_route_points(coords, step=10)

    hour = datetime.now().hour
    total_score = 0.0
    total_samples = 0

    for point in sampled_points:
        nearby = get_nearby_places(point, places)
        if not nearby:
            continue

        nearby_food_count = sum(
            1 for p in nearby
            if map_category(p.get("fsq_category_labels")) in ("cafe", "restaurant")
        )

        for place in nearby:
            score = compute_score(
                place,
                hour,
                nearby_total=len(nearby),
                nearby_food=nearby_food_count,
            )
            total_score += score
            total_samples += 1

    if total_samples == 0:
        return 0.0

    return round(total_score / total_samples, 4)