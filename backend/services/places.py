from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "places_sample.parquet"

def load_places():
    return pd.read_parquet(DATA_PATH).copy()
