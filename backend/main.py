from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base
from core.schema_migrate import ensure_user_name_column
from models.user import User  # noqa: F401
from models.dataset import Dataset, DataRow  # noqa: F401
from api.auth import router as auth_router
from api.datasets import router as dataset_router
from api.compute import router as compute_router


def _is_local_frontend() -> bool:
    url = (settings.FRONTEND_URL or "").lower()
    return "localhost" in url or "127.0.0.1" in url


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_user_name_column(engine)
    yield


_docs = "/docs" if _is_local_frontend() else None
_redoc = "/redoc" if _is_local_frontend() else None
_openapi = "/openapi.json" if _is_local_frontend() else None

app = FastAPI(
    title="DataBoard API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=_docs,
    redoc_url=_redoc,
    openapi_url=_openapi,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dataset_router)
app.include_router(compute_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
