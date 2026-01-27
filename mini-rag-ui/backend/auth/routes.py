from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from .security import create_access_token
import psycopg2

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --------- MODELS ----------
class RegisterModel(BaseModel):
    email: str
    password: str
    role: str = "user"

class LoginModel(BaseModel):
    email: str
    password: str


# --------- DB ----------
def get_db():
    return psycopg2.connect(
        host="localhost",
        database="rag-db",
        user="postgres",
        password="postgres123"
    )

# --------- REGISTER ----------
@router.post("/register")
def register(data: RegisterModel):
    conn = get_db()
    cur = conn.cursor()

    safe_password = normalize_password(data.password)
    hashed = pwd_context.hash(safe_password)

    try:
        cur.execute(
            "INSERT INTO users (email, password, role) VALUES (%s, %s, %s)",
            (data.email, hashed, data.role)
        )
        conn.commit()
    except:
        raise HTTPException(400, "Utilisateur déjà existant")
    finally:
        cur.close()
        conn.close()

    return {"message": "Utilisateur créé"}


# --------- LOGIN ----------
@router.post("/login")
def login(data: LoginModel):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, password, role FROM users WHERE email=%s",
        (data.email,)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        raise HTTPException(401, "Email ou mot de passe incorrect")

    safe_password = normalize_password(data.password)
    if not pwd_context.verify(safe_password, user[1]):
        raise HTTPException(401, "Email ou mot de passe incorrect")

    token = create_access_token({
        "id": user[0],
        "role": user[2]
    })

    return {
        "access_token": token,
        "role": user[2]
    }

def normalize_password(password: str) -> str:
    # tronque à 72 bytes maximum
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
