from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "pricepilot_super_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def verify_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("=" * 60)
        print("✅ JWT decoded successfully!")
        print("Payload:", payload)
        print("=" * 60)

        return payload

    except Exception as e:
        print("=" * 60)
        print("❌ JWT Verification Failed")
        print("Exception Type:", type(e).__name__)
        print("Exception Message:", str(e))
        print("=" * 60)

        return None