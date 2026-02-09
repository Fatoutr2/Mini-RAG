from datetime import datetime, timedelta
from fastapi import Header, HTTPException, status, Depends
from passlib.context import CryptContext
import jwt
from jwt import PyJWTError
from typing import Optional

# --- Config JWT ---
SECRET_KEY = "rag-db-super-secret-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------- JWT --------
def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré"
        )

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
