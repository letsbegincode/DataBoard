from pydantic import BaseModel

class RegisterRequest(BaseModel):
    email: str
    password: str

class RegisterResponse(BaseModel):
    id: int
    email: str
    message: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
