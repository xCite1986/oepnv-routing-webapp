from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Wien ÖPNV Routing API"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]
    
    # OpenTripPlanner
    OTP_BASE_URL: str = "http://localhost:8080/otp"
    OTP_ROUTER_ID: str = "default"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False
    
    # PostgreSQL / PostGIS
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/oepnv_wien"
    DB_ENABLED: bool = False

    # Realtime
    REALTIME_ENABLED: bool = True
    WIENER_LINIEN_API_KEY: str = ""

    # Cost Function Parameters (§18, Punctuality & Risk Weighting)
    # cost = ETA + (alpha * transfer_penalty) + (beta * missed_connection_risk) + (gamma * disruption_risk)
    COST_ALPHA: float = 1.0
    COST_BETA: float = 1.0
    COST_GAMMA: float = 1.0
    BASE_TRANSFER_PENALTY_SEC: float = 180.0
    DEFAULT_HEADWAY_PENALTY_SEC: float = 900.0

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
