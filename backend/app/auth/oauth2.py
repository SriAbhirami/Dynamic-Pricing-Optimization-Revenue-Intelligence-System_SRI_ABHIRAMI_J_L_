from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.auth.jwt_handler import verify_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/users/login"
)


# =========================
# Get Current User
# =========================
def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return payload


# =========================
# Require Admin Role
# =========================
def require_admin(
    current_user=Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access Restricted: This account is registered as an Analyst and cannot access the Admin portal."
        )

    return current_user


# =========================
# Require Analyst Role
# =========================
def require_analyst(
    current_user=Depends(get_current_user)
):
    if current_user.get("role") != "analyst":
        raise HTTPException(
            status_code=403,
            detail="Access Restricted: This portal is available for Analyst accounts."
        )

    return current_user