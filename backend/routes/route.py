import logging
from fastapi import APIRouter, HTTPException


from models.schemas import RouteRequest, RouteResponse
from services import routing_service


logger = logging.getLogger(__name__)


router = APIRouter()




@router.post("/routes", response_model=RouteResponse)
async def generate_routes(request: RouteRequest) -> RouteResponse:
   logger.info(
       "Route request: (%.5f, %.5f) %.1f km  lights=%s hills=%s",
       request.start_lat,
       request.start_lng,
       request.distance_km,
       request.avoid_traffic_lights,
       request.avoid_hills,
   )


   try:
       return await routing_service.generate(request)
   except Exception as e:
       logger.exception("Route generation failed")
       raise HTTPException(status_code=500, detail=str(e))
from fastapi import Query


@router.get("/busy-businesses")
async def get_busy_businesses(hour: int = Query(..., ge=0, le=23)):
   # Demo crowd density data (Sydney)
   sample_data = [
       {
           "id": 1,
           "name": "Newtown nightlife strip",
           "lat": -33.8985,
           "lng": 151.1799,
           "density": 5 if hour >= 20 else 2,
       },
       {
           "id": 2,
           "name": "Central Station precinct",
           "lat": -33.8830,
           "lng": 151.2070,
           "density": 4 if 7 <= hour <= 9 or 17 <= hour <= 19 else 2,
       },
       {
           "id": 3,
           "name": "Darling Harbour",
           "lat": -33.8748,
           "lng": 151.1982,
           "density": 5 if hour >= 18 else 3,
       },
       {
           "id": 4,
           "name": "USYD Eastern Avenue",
           "lat": -33.8898,
           "lng": 151.1873,
           "density": 4 if 10 <= hour <= 16 else 1,
       },
   ]


   return {"businesses": sample_data}


