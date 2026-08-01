from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.config import settings
from core.database import get_db
from api.deps import get_current_user
from models.user import User
from models.dataset import Dataset, DataRow
from schemas.compute import ComputeRequest, ComputeResponse

router = APIRouter(prefix="/dataset", tags=["compute"])

@router.post("/{dataset_id}/compute", response_model=ComputeResponse)
def compute_statistic(
    dataset_id: int,
    data: ComputeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id, Dataset.user_id == user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if data.column not in dataset.column_names:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{data.column}' not found. Available columns: {dataset.column_names}"
        )

    if dataset.row_count > settings.MAX_UPLOAD_ROWS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Dataset has {dataset.row_count} rows; compute is limited to "
                f"{settings.MAX_UPLOAD_ROWS} rows."
            ),
        )

    rows = (
        db.query(DataRow)
        .filter(DataRow.dataset_id == dataset_id)
        .order_by(DataRow.row_index)
        .limit(settings.MAX_UPLOAD_ROWS)
        .all()
    )
    raw_values = [row.data.get(data.column) for row in rows]

    if not raw_values:
        return ComputeResponse(
            dataset_id=dataset_id,
            column=data.column,
            operation=data.operation,
            value=None,
            message=f"Column '{data.column}' is empty (no data rows)",
        )

    non_null_values = [v for v in raw_values if v is not None]

    if not non_null_values:
        return ComputeResponse(
            dataset_id=dataset_id,
            column=data.column,
            operation=data.operation,
            value=None,
            message=f"Column '{data.column}' contains only null values",
        )

    numeric_values = []
    for v in non_null_values:
        try:
            numeric_values.append(float(v))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=422,
                detail=f"Column '{data.column}' contains non-numeric values. Cannot compute {data.operation}.",
            )

    operations = {"min": min, "max": max, "sum": sum}
    result = operations[data.operation](numeric_values)

    return ComputeResponse(
        dataset_id=dataset_id,
        column=data.column,
        operation=data.operation,
        value=result,
    )
