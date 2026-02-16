import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWTError
from passlib.context import CryptContext

load_dotenv()

# --- Config JWT ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY manquant dans l'environnement")

REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY", SECRET_KEY)
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _create_token(data: dict, expires_delta: timedelta, token_type: str, secret: str):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


# -------- JWT --------
def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    return _create_token(
        data,
        timedelta(minutes=expires_minutes),
        "access",
        SECRET_KEY,
    )

def create_refresh_token(data: dict, expires_days: int = REFRESH_TOKEN_EXPIRE_DAYS):
    return _create_token(
        data,
        timedelta(days=expires_days),
        "refresh",
        REFRESH_SECRET_KEY,
    )


def decode_token(token: str, expected_type: Optional[str] = None):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except PyJWTError:
        try:
            payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        except PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide ou expiré",
            )

    token_type = payload.get("type")
    if expected_type and token_type != expected_type:
        raise HTTPException(status_code=401, detail=f"Token {expected_type} requis")

    return payload


def decode_access_token(token: str):
    return decode_token(token, expected_type="access")


def decode_refresh_token(token: str):
    return decode_token(token, expected_type="refresh")


# -------- CURRENT USER / VISITOR --------
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return {"user_id": None, "role": "visitor"}

    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Format token invalide")

    token = authorization[len("Bearer "):]
    user = decode_access_token(token)

    if not user or "role" not in user or "user_id" not in user:
        return {"user_id": None, "role": "visitor"}

    return user


# -------- ROLE GUARDS --------
def require_member(user=Depends(get_current_user)):
    if user["role"] not in ["member", "admin"]:
        raise HTTPException(403, "Accès réservé aux membres")
    return user


def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")
    return user
