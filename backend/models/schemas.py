from pydantic import BaseModel, Field, model_validator
from typing import Any


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class RouteRequest(BaseModel):
    start_lat: float = Field(..., ge=-90, le=90)
    start_lng: float = Field(..., ge=-180, le=180)
    distance_km: float = Field(5.0, gt=0, le=100)
    avoid_traffic_lights: bool = False
    avoid_hills: bool = False

    @model_validator(mode="after")
    def distance_sanity(self) -> "RouteRequest":
        if self.distance_km < 0.5:
            raise ValueError("distance_km must be at least 0.5 km")
        return self


# ---------------------------------------------------------------------------
# Response — field names match routing_service.score_route() output exactly
# ---------------------------------------------------------------------------

class RouteResult(BaseModel):
    id: str
    coordinates: list[list[float]]  # [[lat, lng], ...] - Leaflet order
    elevation_profile: list[float]   # elevation per coord - used by GPX generation
    distance_km: float
    elevation_gain_m: float
    traffic_light_count: int
    flow_score: float
    score: float
    label: str                       # e.g. "Fewest Lights", "Flattest"


class RouteResponse(BaseModel):
    routes: list[RouteResult]
    requested_distance_km: float
    avoid_traffic_lights: bool
    avoid_hills: bool