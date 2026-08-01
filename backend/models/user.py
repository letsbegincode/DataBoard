from sqlalchemy import Column, Integer, String, DateTime, func
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)  # display name; null for pre-migration users
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
