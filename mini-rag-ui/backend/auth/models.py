from pydantic import BaseModel
from enum import Enum

class UserRole(str, Enum):
    user = "User"
    admin = "Admin"

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.user

class UserOut(BaseModel):
    id: int
    username: str
    role: UserRole
