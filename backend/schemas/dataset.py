from pydantic import BaseModel
from datetime import datetime

class DatasetResponse(BaseModel):
    id: int
    name: str
    original_filename: str
    column_names: list[str]
    row_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetListResponse(BaseModel):
    items: list[DatasetResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool

class DatasetPreviewResponse(BaseModel):
    dataset_id: int
    name: str
    column_names: list[str]
    rows: list[dict]
    total_rows: int
    preview_rows: int

class PlotDataResponse(BaseModel):
    dataset_id: int
    col1_name: str
    col2_name: str
    col1_values: list
    col2_values: list
    row_count: int
