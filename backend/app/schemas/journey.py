from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Tuple
from .location import LocationPoint

class StopPoint(BaseModel):
    id: Optional[str] = None
    name: str
    lat: float
    lon: float
    platform: Optional[str] = None
    scheduledTime: str
    estimatedTime: Optional[str] = None
    delayMinutes: Optional[int] = 0

class TransferInfo(BaseModel):
    stationName: str
    durationSeconds: int
    walkingMeters: int
    difficulty: str = "RELAXED" # RELAXED, TIGHT, RISKY
    difficultyLabel: str
    bufferMinutes: int
    isPlatformCross: Optional[bool] = False

class IntermediateStop(BaseModel):
    name: str
    scheduledTime: str
    estimatedTime: Optional[str] = None
    delayMinutes: Optional[int] = 0

class Leg(BaseModel):
    id: str
    type: str # WALK, SUBWAY, TRAM, BUS, TRAIN, REGIONAL_TRAIN, OTHER_TRANSIT
    line: Optional[str] = None
    headsign: Optional[str] = None
    color: Optional[str] = None
    textColor: Optional[str] = None
    fromStop: StopPoint
    toStop: StopPoint
    startTime: str
    endTime: str
    durationSeconds: int
    distanceMeters: Optional[int] = None
    stopsCount: Optional[int] = None
    intermediateStops: Optional[List[IntermediateStop]] = None
    realtimeStatus: str = "ON_TIME" # ON_TIME, DELAYED, CANCELLED, STOP_SKIPPED, DISRUPTED, NO_DATA
    delayMinutes: int = 0
    isCancelled: Optional[bool] = False
    disruptionNotice: Optional[str] = None
    transferInfo: Optional[TransferInfo] = None
    coordinates: Optional[List[List[float]]] = None # [[lon, lat], ...]

class JourneyExplanation(BaseModel):
    headline: str
    details: List[str]

class AlternativeComparison(BaseModel):
    timeDiffMinutes: int
    transferDiff: int
    walkDiffMinutes: int
    summaryText: str
    reasons: List[str]

class Journey(BaseModel):
    id: str
    recommended: bool = False
    categoryTag: Optional[str] = None # EMPFOHLEN, DIREKTER, WENIGER_FUSSWEG, ALTERNATIVE
    tagLabel: Optional[str] = None
    departureTime: str
    arrivalTime: str
    durationSeconds: int
    walkingSeconds: int
    walkingMeters: int
    transferCount: int
    realtime: bool = True
    totalDelayMinutes: int = 0
    hasCancellations: Optional[bool] = False
    hasDisruptions: Optional[bool] = False
    explanation: JourneyExplanation
    comparisonWithRecommended: Optional[AlternativeComparison] = None
    legs: List[Leg]

class JourneySearchPreferences(BaseModel):
    maxWalkingDistance: Optional[int] = 1500
    maxTransfers: Optional[int] = 6
    wheelchair: Optional[bool] = False
    optimization: Optional[str] = "FASTEST" # FASTEST, LEAST_WALKING, FEWEST_TRANSFERS

class JourneySearchRequest(BaseModel):
    from_: LocationPoint = Field(..., alias="from")
    to: LocationPoint
    dateTime: str
    timeMode: str = "DEPARTURE" # DEPARTURE, ARRIVAL
    preferences: Optional[JourneySearchPreferences] = None

    model_config = ConfigDict(populate_by_name=True)

class JourneySearchResponse(BaseModel):
    generatedAt: str
    recommendedJourneyId: str
    journeys: List[Journey]
    realtimeActive: bool = True
    disruptionSummary: Optional[str] = None
