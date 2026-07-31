from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables (imports added in Step 2)
    yield
    # Shutdown: nothing to clean up

app = FastAPI(title="DataBoard API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}
