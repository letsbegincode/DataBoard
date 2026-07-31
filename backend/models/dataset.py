from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from core.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    column_names = Column(JSON, nullable=False)
    row_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    rows = relationship("DataRow", back_populates="dataset", cascade="all, delete-orphan")

class DataRow(Base):
    __tablename__ = "data_rows"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    row_index = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False)

    dataset = relationship("Dataset", back_populates="rows")
