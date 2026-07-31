from pydantic import BaseModel
from typing import Optional, Literal

class ComputeRequest(BaseModel):
    column: str
    operation: Literal["min", "max", "sum"]

class ComputeResponse(BaseModel):
    dataset_id: int
    column: str
    operation: str
    value: Optional[float] = None
    message: Optional[str] = None
