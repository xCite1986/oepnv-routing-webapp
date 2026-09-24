from pydantic import BaseModel
from typing import List, Optional

class IncidentAlert(BaseModel):
    id: str
    title: str
    description: str
    lines: List[str]
    severity: str = "WARNING" # INFO, WARNING, CRITICAL
    validFrom: str
    validTo: Optional[str] = None
