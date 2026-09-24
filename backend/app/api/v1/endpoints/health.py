from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Wien ÖPNV Routing Backend",
        "timestamp": datetime.now().isoformat(),
        "realtime": True,
        "engine": "active"
    }
