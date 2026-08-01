from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from api.deps import get_current_user
from core.config import settings
from core.database import get_db
from core.rate_limit import check_rate_limit, client_ip
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from models.user import User
from schemas.auth import RegisterRequest, RegisterResponse, LoginRequest, TokenResponse, MeResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _refresh_cookie_kwargs() -> dict:
    """Cookie flags for refresh JWT — use Secure + SameSite=none across Vercel/Render."""
    samesite = settings.COOKIE_SAMESITE.lower()
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"
    return {
        "httponly": True,
        "secure": settings.COOKIE_SECURE,
        "samesite": samesite,
        "max_age": settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        "path": "/",
    }


def _auth_rate_limit(request: Request, route: str) -> None:
    check_rate_limit(
        f"auth:{route}:{client_ip(request)}",
        settings.AUTH_RATE_LIMIT_PER_MINUTE,
        60,
    )


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    _auth_rate_limit(request, "register")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        # Avoid email enumeration — same shape as a generic failure
        raise HTTPException(
            status_code=409,
            detail="Could not register with those credentials",
        )

    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        message="User registered successfully",
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    _auth_rate_limit(request, "login")

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    response.set_cookie(key="refresh_token", value=refresh_token, **_refresh_cookie_kwargs())

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=MeResponse)
def get_me(user: User = Depends(get_current_user)):
    return MeResponse(id=user.id, email=user.email, name=user.name)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    _auth_rate_limit(request, "refresh")

    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_access_token(user.id)

    new_refresh_token = create_refresh_token(user.id)
    response.set_cookie(key="refresh_token", value=new_refresh_token, **_refresh_cookie_kwargs())

    return TokenResponse(access_token=new_access_token)


@router.post("/logout")
def logout(response: Response):
    kwargs = _refresh_cookie_kwargs()
    response.delete_cookie(
        "refresh_token",
        httponly=kwargs["httponly"],
        secure=kwargs["secure"],
        samesite=kwargs["samesite"],
        path=kwargs["path"],
    )
    return {"message": "Logged out successfully"}
