import io
import math
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from core.database import get_db
from api.deps import get_current_user
from models.user import User
from models.dataset import Dataset, DataRow
from schemas.dataset import DatasetResponse, DatasetListResponse, DatasetPreviewResponse, PlotDataResponse

router = APIRouter(prefix="/dataset", tags=["dataset"])

@router.post("", response_model=DatasetResponse, status_code=201)
def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset_name = name.strip()
    if not dataset_name:
        raise HTTPException(status_code=400, detail="Dataset name is required")

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    duplicate = (
        db.query(Dataset)
        .filter(Dataset.user_id == user.id, Dataset.name == dataset_name)
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=f"You already have a dataset named '{dataset_name}'. Choose a different name.",
        )

    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    dataset = Dataset(
        user_id=user.id,
        name=dataset_name,
        original_filename=file.filename,
        column_names=df.columns.tolist(),
        row_count=len(df),
    )
    db.add(dataset)
    db.flush()

    df = df.where(pd.notnull(df), None)
    data_rows = [
        DataRow(
            dataset_id=dataset.id,
            row_index=int(i),
            data={k: (None if pd.isna(v) else v.item() if hasattr(v, "item") else v) for k, v in row.items()},
        )
        for i, row in df.iterrows()
    ]
    db.add_all(data_rows)
    db.commit()
    db.refresh(dataset)

    return dataset


@router.get("", response_model=DatasetListResponse)
def list_datasets(
    page: int = 1,
    limit: int = 10,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 10

    total = db.query(Dataset).filter(Dataset.user_id == user.id).count()
    total_pages = math.ceil(total / limit) if total > 0 else 1

    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == user.id)
        .order_by(Dataset.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return DatasetListResponse(
        items=datasets,
        total=total,
        page=page,
        limit=limit,
        pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: int,
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
    return dataset


@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def preview_dataset(
    dataset_id: int,
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

    rows = (
        db.query(DataRow)
        .filter(DataRow.dataset_id == dataset_id)
        .order_by(DataRow.row_index)
        .limit(25)
        .all()
    )

    return DatasetPreviewResponse(
        dataset_id=dataset.id,
        name=dataset.name,
        column_names=dataset.column_names,
        rows=[row.data for row in rows],
        total_rows=dataset.row_count,
        preview_rows=len(rows),
    )


@router.delete("/{dataset_id}", status_code=200)
def delete_dataset(
    dataset_id: int,
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

    name = dataset.name
    db.delete(dataset)
    db.commit()
    return {"message": f"Dataset '{name}' deleted successfully"}


@router.get("/{dataset_id}/plot", response_model=PlotDataResponse)
def get_plot_data(
    dataset_id: int,
    col1: str,
    col2: str,
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

    for col_name in [col1, col2]:
        if col_name not in dataset.column_names:
            raise HTTPException(
                status_code=400,
                detail=f"Column '{col_name}' not found. Available: {dataset.column_names}"
            )

    rows = (
        db.query(DataRow)
        .filter(DataRow.dataset_id == dataset_id)
        .order_by(DataRow.row_index)
        .limit(30)
        .all()
    )

    col1_values = [row.data.get(col1) for row in rows]
    col2_values = [row.data.get(col2) for row in rows]

    return PlotDataResponse(
        dataset_id=dataset_id,
        col1_name=col1,
        col2_name=col2,
        col1_values=col1_values,
        col2_values=col2_values,
        row_count=len(rows),
    )
