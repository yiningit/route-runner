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
   # handle None
   if labels is None:
       return "other"

   # handle empty list safely
   if isinstance(labels, (list, tuple)) and len(labels) == 0:
       return "other"

   # convert everything into a string safely
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


def is_probably_closed(row) -> bool:
   # check date_closed
   if row.get("date_closed") is not None:
       return True

   flags = row.get("unresolved_flags")

   # handle None
   if flags is None:
       return False

   # handle empty list safely
   if isinstance(flags, (list, tuple)) and len(flags) == 0:
       return False

   # convert to string safely
   text = " ".join([str(x) for x in flags]).lower()

   if "closed" in text or "doesnt_exist" in text:
       return True

   return False


def compute_score(row, hour: int, nearby_total: int = 0, nearby_food: int = 0) -> float:
   # skip closed places
   if is_probably_closed(row):
       return 0.0

   # get category
   category = map_category(row.get("fsq_category_labels"))

   # get time bucket
   bucket = get_time_bucket(hour)

   # base score
   base = CATEGORY_HOUR_SCORES[category][bucket]

   # cluster multiplier (simple for now)
   cluster_multiplier = min(1 + 0.03 * nearby_total + 0.05 * nearby_food, 2.0)

   return round(base * cluster_multiplier, 4)