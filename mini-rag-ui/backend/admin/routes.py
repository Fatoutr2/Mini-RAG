from fastapi import APIRouter, HTTPException, UploadFile
import os
from auth.security import decode_access_token

router = APIRouter()

def admin_required(token: str):
    user = decode_access_token(token)
    if not user or user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return user

@router.post("/upload")
async def upload_file(file: UploadFile, token: str):
    admin_required(token)
    path = os.path.join("backend/data/documents", file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"status": "ok"}
