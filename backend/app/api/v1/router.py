from fastapi import APIRouter
from .endpoints import journeys, locations, incidents, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(journeys.router, prefix="/journeys", tags=["Journeys"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
