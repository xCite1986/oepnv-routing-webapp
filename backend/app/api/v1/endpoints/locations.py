from fastapi import APIRouter, Query
from typing import List
from ....schemas.location import LocationPoint
from ....services.geocoding.geocoding_service import GeocodingService

router = APIRouter()

@router.get("/search", response_model=List[LocationPoint])
async def search_locations(
    q: str = Query("", description="Suchbegriff für Haltestelle, Adresse oder POI"),
    limit: int = Query(8, ge=1, le=20)
):
    """
    Autocomplete für Haltestellen, Adressen und POIs in Wien (§3).
    """
    return await GeocodingService.search(q, limit=limit)
