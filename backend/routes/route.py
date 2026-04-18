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