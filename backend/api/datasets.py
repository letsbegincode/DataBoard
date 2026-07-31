import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from core.database import get_db
from api.deps import get_current_user
from models.user import User
from models.dataset import Dataset, DataRow
from schemas.dataset import DatasetResponse

router = APIRouter(prefix="/dataset", tags=["dataset"])

@router.post("", response_model=DatasetResponse, status_code=201)
def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    dataset = Dataset(
        user_id=user.id,
        name=name,
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
