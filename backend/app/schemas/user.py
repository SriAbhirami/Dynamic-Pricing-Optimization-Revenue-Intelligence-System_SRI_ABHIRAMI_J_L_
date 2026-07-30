from pydantic import BaseModel, EmailStr


# =========================
# User Registration
# =========================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


# =========================
# User Login
# =========================

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: str


# =========================
# Google Login
# =========================

class GoogleLogin(BaseModel):
    credential: str


# =========================
# JWT Token Response
# =========================

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


# =========================
# User Response
# =========================

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True