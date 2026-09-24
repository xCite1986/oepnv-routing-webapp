from fastapi import APIRouter
from typing import List
from ....schemas.incident import IncidentAlert
from ....services.realtime.realtime_adapter import RealtimeAdapter

router = APIRouter()

@router.get("", response_model=List[IncidentAlert])
async def get_active_incidents():
    """
    Liefert aktuelle Störungen und Einschränkungen im Wiener ÖPNV-Netz.
    """
    return RealtimeAdapter.get_active_incidents()
