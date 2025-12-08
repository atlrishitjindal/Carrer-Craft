from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone, timedelta
from jose import jwt
import uuid
import os

app = FastAPI(title="CareerCraft AI")

# CORS - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserPublic(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime

def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)

@app.get("/")
async def root():
    return {"message": "CareerCraft AI backend is running!"}

@app.get("/api/")
async def api_root():
    return {"message": "CareerCraft AI API"}

@app.post("/api/auth/signup")
async def signup(payload: UserCreate):
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    return {
        "id": user_id,
        "email": payload.email,
        "role": payload.role,
        "created_at": now.isoformat()
    }

@app.post("/api/auth/login")
async def login(payload: UserLogin):
    user_id = str(uuid.uuid4())
    role = "user"
    access = create_token({"sub": user_id, "role": role}, timedelta(minutes=15))
    refresh = create_token({"sub": user_id, "role": role, "type": "refresh"}, timedelta(days=7))
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer"
    }

# Vercel handler
handler = app
