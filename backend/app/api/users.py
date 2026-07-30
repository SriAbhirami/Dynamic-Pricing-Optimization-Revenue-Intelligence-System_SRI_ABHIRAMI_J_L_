from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    GoogleLogin,
    Token
)

from app.auth.hashing import (
    hash_password,
    verify_password
)

from app.auth.jwt_handler import create_access_token

from app.database.database import get_db
from app.models.users import User

from app.core.config import GOOGLE_CLIENT_ID


# =========================
# Router
# =========================

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =========================
# Register User
# =========================

@router.post(
    "/register",
    response_model=UserResponse
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Check if email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Every newly registered user is an Analyst
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="analyst",
        auth_provider="local"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =========================
# Login User
# =========================

@router.post(
    "/login",
    response_model=Token
)
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    # Find user by email
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    # User does not exist
    if existing_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check if this is a Google account
    if existing_user.auth_provider == "google":
        raise HTTPException(
            status_code=400,
            detail=(
                "This account was created using Google. "
                "Please use Google Login."
            )
        )

    # Check password
    if not verify_password(
        user.password,
        existing_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Actual role stored in database
    actual_role = existing_user.role

    # Role selected on frontend
    requested_role = user.role.lower()

    # Validate role
    if requested_role not in ["admin", "analyst"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role selected."
        )

    # =========================
    # ROLE CHECK
    # =========================

    if actual_role != requested_role:

        if requested_role == "admin":
            raise HTTPException(
                status_code=403,
                detail=(
                    "Access Restricted: "
                    "This account is registered as an Analyst "
                    "and cannot access the Admin portal."
                )
            )

        if requested_role == "analyst":
            raise HTTPException(
                status_code=403,
                detail=(
                    "Access Restricted: "
                    "This account is registered as an Admin "
                    "and cannot access the Analyst portal."
                )
            )

    # =========================
    # CREATE JWT
    # =========================

    token = create_access_token(
        {
            "sub": existing_user.email,
            "role": actual_role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": actual_role
    }


# =========================
# Google Login / Registration
# =========================

@router.post(
    "/google",
    response_model=Token
)
def google_login(
    google_data: GoogleLogin,
    db: Session = Depends(get_db)
):

    # =========================
    # Verify Google Credential
    # =========================

    try:

        google_user = id_token.verify_oauth2_token(
            google_data.credential,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

    except ValueError:

        raise HTTPException(
            status_code=401,
            detail="Invalid Google credential"
        )

    # =========================
    # Extract Google Information
    # =========================

    google_email = google_user.get("email")
    google_name = google_user.get("name")

    if not google_email:
        raise HTTPException(
            status_code=400,
            detail="Google account email not available"
        )

    if not google_name:
        google_name = google_email.split("@")[0]

    # =========================
    # Check Existing User
    # =========================

    existing_user = (
        db.query(User)
        .filter(User.email == google_email)
        .first()
    )

    # =========================
    # Existing User
    # =========================

    if existing_user:

        # Existing local account
        if existing_user.auth_provider == "local":
            raise HTTPException(
                status_code=403,
                detail=(
                    "This email is already registered "
                    "with a password. Please use normal login."
                )
            )

        # Existing admin account
        if existing_user.role == "admin":
            raise HTTPException(
                status_code=403,
                detail=(
                    "Google Login is available only "
                    "for Analyst accounts."
                )
            )

        # Existing Google Analyst account
        token = create_access_token(
            {
                "sub": existing_user.email,
                "role": existing_user.role
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": existing_user.role
        }

    # =========================
    # Create New Google Analyst
    # =========================

    new_user = User(
        username=google_name,
        email=google_email,
        hashed_password=None,
        role="analyst",
        auth_provider="google"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # =========================
    # Create JWT
    # =========================

    token = create_access_token(
        {
            "sub": new_user.email,
            "role": new_user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": new_user.role
    }