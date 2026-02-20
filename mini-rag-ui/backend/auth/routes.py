import hashlib
from datetime import datetime
from typing import Optional

import psycopg2
from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from backend.audit import log_admin_action
from backend.database import get_db
from backend.utils import get_all_conversations
from .security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --------- MODELS ----------
class RegisterModel(BaseModel):
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class AdminCreateUserModel(BaseModel):
    email: EmailStr
    password: str
    role: str  # "member" | "admin"
    is_active: bool = True


class AdminUpdateUserModel(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileUpdateModel(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None


# --------- DB ----------
def get_db():
    return psycopg2.connect(
        host="localhost",
        database="rag-db",
        user="postgres",
        password="postgres123"
    )

# --------- UTILS ----------
def normalize_password(password: str) -> str:
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")

# --------- REGISTER ----------
@router.post("/register")
def register(data: RegisterModel):
    conn = get_db()
    cur = conn.cursor()
    hashed_password = pwd_context.hash(normalize_password(data.password))

    try:
        cur.execute(
            "INSERT INTO users (email, password, role, is_active) VALUES (%s, %s, %s, %s)",
            (data.email, hashed_password, "member", True)
        )
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(400, "Utilisateur déjà existant")
    finally:
        cur.close()
        conn.close()
    return {"message": "Compte créé avec succès"}

# --------- LOGIN ----------
@router.post("/login")
def login(data: LoginModel):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, password, role, is_active, first_name, last_name, phone_number, address, avatar_url FROM users WHERE email = %s", (data.email,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        raise HTTPException(401, "Email ou mot de passe incorrect")

    user_id, hashed_password, role, is_active, first_name, last_name, phone_number, address, avatar_url = user

    if not is_active:
        raise HTTPException(403, "Utilisateur désactivé")

    if not pwd_context.verify(normalize_password(data.password), hashed_password):
        raise HTTPException(401, "Email ou mot de passe incorrect")

    token = create_access_token({"user_id": user_id, "role": role})
    return {"access_token": token, "token_type": "bearer", "role": role, "email": data.email, "first_name": first_name, "last_name": last_name, "phone_number": phone_number, "address": address, "avatar_url": avatar_url}

# -------- ADMIN USER MANAGEMENT ----------
@router.get("/admin/users")
def list_users(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, email, role, is_active, first_name, last_name, phone_number, address, avatar_url FROM users ORDER BY id")
    users = [{"id": u[0], "email": u[1], "role": u[2], "is_active": u[3], "first_name": u[4], "last_name": u[5], "phone_number": u[6], "address": u[7], "avatar_url": u[8]} for u in cur.fetchall()]
    cur.close()
    conn.close()
    return users

@router.put("/admin/users/{user_id}/role")
def update_user_role(user_id: int, new_role: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")
    if new_role not in ["visitor", "member", "admin"]:
        raise HTTPException(400, "Rôle invalide")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET role=%s WHERE id=%s", (new_role, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Rôle mis à jour"}

@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Utilisateur supprimé"}

@router.get("/admin/conversations")
def admin_conversations(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")
    return get_all_conversations(user)

@router.post("/admin/users")
def create_user_by_admin(payload: AdminCreateUserModel, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    if payload.role not in ["member", "admin"]:
        raise HTTPException(400, "Rôle invalide")

    conn = get_db()
    cur = conn.cursor()
    hashed_password = pwd_context.hash(normalize_password(payload.password))

    try:
        cur.execute(
            """
            INSERT INTO users (email, password, role, is_active)
            VALUES (%s, %s, %s, %s)
            RETURNING id, email, role, is_active, first_name, last_name, phone_number, address, avatar_url, first_name, last_name, phone_number, address, avatar_url
            """,
            (payload.email, hashed_password, payload.role, payload.is_active)
        )
        row = cur.fetchone()
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(400, "Utilisateur déjà existant")
    finally:
        cur.close()
        conn.close()

    return {"id": row[0], "email": row[1], "role": row[2], "is_active": row[3], "first_name": row[4], "last_name": row[5], "phone_number": row[6], "address": row[7], "avatar_url": row[8]}


@router.put("/admin/users/{user_id}")
def update_user_by_admin(user_id: int, payload: AdminUpdateUserModel, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    fields = []
    values = []

    if payload.email is not None:
        fields.append("email=%s")
        values.append(payload.email)

    if payload.password is not None and payload.password.strip():
        fields.append("password=%s")
        values.append(pwd_context.hash(normalize_password(payload.password)))

    if payload.role is not None:
        if payload.role not in ["visitor", "member", "admin"]:
            raise HTTPException(400, "Rôle invalide")
        fields.append("role=%s")
        values.append(payload.role)

    if payload.is_active is not None:
        fields.append("is_active=%s")
        values.append(payload.is_active)

    if payload.first_name is not None:
        fields.append("first_name=%s")
        values.append(payload.first_name)

    if payload.last_name is not None:
        fields.append("last_name=%s")
        values.append(payload.last_name)

    if payload.phone_number is not None:
        fields.append("phone_number=%s")
        values.append(payload.phone_number)

    if payload.address is not None:
        fields.append("address=%s")
        values.append(payload.address)

    if payload.avatar_url is not None:
        fields.append("avatar_url=%s")
        values.append(payload.avatar_url)

    if not fields:
        raise HTTPException(400, "Aucune donnée à mettre à jour")

    values.append(user_id)

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE users SET {', '.join(fields)} WHERE id=%s RETURNING id, email, role, is_active, first_name, last_name, phone_number, address, avatar_url"
            , tuple(values)
        )
        row = cur.fetchone()
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(400, "Email déjà utilisé")
    finally:
        cur.close()
        conn.close()

    if not row:
        raise HTTPException(404, "Utilisateur introuvable")

    return {"id": row[0], "email": row[1], "role": row[2], "is_active": row[3], "first_name": row[4], "last_name": row[5], "phone_number": row[6], "address": row[7], "avatar_url": row[8]}


@router.get("/me")
def get_my_profile(user=Depends(get_current_user)):
    if not user.get("user_id"):
        raise HTTPException(401, "Authentification requise")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, email, role, is_active, first_name, last_name, phone_number, address, avatar_url
        FROM users
        WHERE id=%s
        """,
        (user["user_id"],)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(404, "Utilisateur introuvable")

    return {
        "id": row[0],
        "email": row[1],
        "role": row[2],
        "is_active": row[3],
        "first_name": row[4],
        "last_name": row[5],
        "phone_number": row[6],
        "address": row[7],
        "avatar_url": row[8],
    }


@router.put("/me")
def update_my_profile(payload: UserProfileUpdateModel, user=Depends(get_current_user)):
    if not user.get("user_id"):
        raise HTTPException(401, "Authentification requise")

    fields = []
    values = []

    if payload.first_name is not None:
        fields.append("first_name=%s")
        values.append(payload.first_name)

    if payload.last_name is not None:
        fields.append("last_name=%s")
        values.append(payload.last_name)

    if payload.phone_number is not None:
        fields.append("phone_number=%s")
        values.append(payload.phone_number)

    if payload.address is not None:
        fields.append("address=%s")
        values.append(payload.address)

    if payload.avatar_url is not None:
        fields.append("avatar_url=%s")
        values.append(payload.avatar_url)

    if not fields:
        raise HTTPException(400, "Aucune donnée à mettre à jour")

    values.append(user["user_id"])

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE users SET {', '.join(fields)} WHERE id=%s RETURNING id, email, role, is_active, first_name, last_name, phone_number, address, avatar_url",
        tuple(values),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(404, "Utilisateur introuvable")

    return {
        "id": row[0],
        "email": row[1],
        "role": row[2],
        "is_active": row[3],
        "first_name": row[4],
        "last_name": row[5],
        "phone_number": row[6],
        "address": row[7],
        "avatar_url": row[8],
    }