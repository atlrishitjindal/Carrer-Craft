import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional, Any, Dict

from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from google import genai
from docx import Document
from PyPDF2 import PdfReader


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("careercraft")

# MongoDB connection (optional - server can run without it)
mongo_url = os.environ.get("MONGO_URL", "")
db = None
if mongo_url:
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ.get("DB_NAME", "careercraft")]
        logger.info("MongoDB connected")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e} - running without database")
else:
    logger.warning("No MONGO_URL set - running without database")

# JWT / Auth
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = os.environ.get("JWT_ALG", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# AI (Gemini via google-genai, using Emergent LLM key if present)
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GENAI_API_KEY = EMERGENT_LLM_KEY or GEMINI_API_KEY

genai_client: Optional[genai.Client] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    role: str = Field("user", pattern="^(user|employer|admin)$")


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(UserBase):
    id: str
    created_at: datetime


class ResumeRecord(BaseModel):
    id: str
    user_id: str
    file_url: str
    parsed_text: Optional[str] = None
    rewritten_resume_text: Optional[str] = None
    ats_score: Optional[float] = None
    improvement_suggestions: Optional[Dict[str, Any]] = None
    skill_suggestions: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(extra="ignore")


class ResumeImproveRequest(BaseModel):
    resume_text: str


class SkillGapRequest(BaseModel):
    current_skills: str
    target_role_description: str


class JobInsightsRequest(BaseModel):
    profile_summary: str


class ATSScoreRequest(BaseModel):
    resume_text: str
    job_description: str


class RewriteResumeRequest(BaseModel):
    resume_text: str
    tone: str = "professional"


class CoverLetterRequest(BaseModel):
    resume_text: str
    job_id: Optional[str] = None
    job_description: Optional[str] = None
    company_name: Optional[str] = None


class InterviewQuestionsRequest(BaseModel):
    resume_text: str
    job_description: str


class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str
    location: str
    salary: Optional[str] = None


class JobRecord(JobCreate):
    id: str
    employer_id: str
    created_at: datetime

    model_config = ConfigDict(extra="ignore")


class MatchJobsRequest(BaseModel):
    resume_text: Optional[str] = None
    job_ids: Optional[List[str]] = None


class AutoApplyRequest(BaseModel):
    match_id: str


class ActivityRecord(BaseModel):
    id: str
    user_id: str
    type: str
    metadata: Dict[str, Any]
    timestamp: datetime

    model_config = ConfigDict(extra="ignore")


class SubscriptionRecord(BaseModel):
    id: str
    user_id: str
    plan: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(extra="ignore")


class StripeCheckoutRequest(BaseModel):
    plan: str


class EmailLogRecord(BaseModel):
    id: str
    user_id: str
    job_id: Optional[str] = None
    email_subject: str
    email_body: str
    received_at: datetime

    model_config = ConfigDict(extra="ignore")


# FastAPI app and router
app = FastAPI(title="CareerCraft AI", version="0.1.0")
api_router = APIRouter(prefix="/api")


@app.on_event("startup")
async def startup_event() -> None:
    global genai_client
    if GENAI_API_KEY:
        genai_client = genai.Client(api_key=GENAI_API_KEY)
        logger.info("Initialized Gemini client")
    else:
        logger.warning("No GENAI_API_KEY configured; AI endpoints will fail")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    client.close()


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# Utility functions

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)


def create_access_token(user_id: str, role: str) -> str:
    return create_token({"sub": user_id, "role": role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(user_id: str, role: str) -> str:
    return create_token({"sub": user_id, "role": role, "type": "refresh"}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))


async def get_user_by_email(email: str) -> Optional[dict]:
    return await db.users.find_one({"email": email})


async def get_user_by_id(user_id: str) -> Optional[dict]:
    return await db.users.find_one({"id": user_id})


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # TEMPORARY: Return mock user instead of DB lookup
    return {"id": user_id, "email": "mock@example.com", "role": role}


async def require_role(required_roles: List[str], current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in required_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


def ensure_ai_client() -> genai.Client:
    if genai_client is None:
        raise HTTPException(status_code=503, detail="AI service not configured")
    return genai_client


async def log_activity(user_id: str, activity_type: str, metadata: Dict[str, Any]) -> None:
    await db.activities.insert_one(
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": activity_type,
            "metadata": metadata,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


# Basic root


@api_router.get("/")
async def root() -> dict:
    return {"message": "CareerCraft AI backend"}


# Auth endpoints


@api_router.post("/auth/signup", response_model=UserPublic)
async def signup(payload: UserCreate) -> UserPublic:
    # TEMPORARY: Skip database, accept any signup
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    return UserPublic(id=user_id, email=payload.email, role=payload.role, created_at=now)


@api_router.post("/auth/login", response_model=Token)
async def login(payload: UserLogin) -> Token:
    # TEMPORARY: Skip database, accept any login
    user_id = str(uuid.uuid4())
    role = "user"
    access = create_access_token(user_id, role)
    refresh = create_refresh_token(user_id, role)
    return Token(access_token=access, refresh_token=refresh)


class RefreshRequest(BaseModel):
    refresh_token: str


@api_router.post("/auth/refresh", response_model=Token)
async def refresh_token(payload: RefreshRequest) -> Token:
    try:
        decoded = jwt.decode(payload.refresh_token, JWT_SECRET, algorithms=[JWT_ALG])
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = decoded.get("sub")
    role = decoded.get("role")
    if not user_id or not role:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access = create_access_token(user_id, role)
    refresh = create_refresh_token(user_id, role)

    return Token(access_token=access, refresh_token=refresh)


# Resume upload & parsing


UPLOAD_ROOT = ROOT_DIR / "uploads"
UPLOAD_ROOT.mkdir(exist_ok=True)


def _extract_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    texts: List[str] = []
    for page in reader.pages:
        try:
            texts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(texts)


def _extract_text_from_docx(path: Path) -> str:
    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_text_from_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


@api_router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
) -> dict:
    ext = (file.filename or "").lower()
    user_id = current_user["id"]
    user_dir = UPLOAD_ROOT / user_id
    user_dir.mkdir(exist_ok=True)

    dest_path = user_dir / f"{uuid.uuid4()}_{file.filename}"
    with dest_path.open("wb") as f:
        content = await file.read()
        f.write(content)

    # parse text
    parsed_text = ""
    try:
        if ext.endswith(".pdf"):
            parsed_text = _extract_text_from_pdf(dest_path)
        elif ext.endswith(".docx"):
            parsed_text = _extract_text_from_docx(dest_path)
        else:
            parsed_text = _extract_text_from_txt(dest_path)
    except Exception as e:  # noqa: BLE001
        logger.error("Failed to parse resume: %s", e)

    resume_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": resume_id,
        "user_id": user_id,
        "file_url": str(dest_path),
        "parsed_text": parsed_text,
        "created_at": now,
    }
    await db.resumes.insert_one(doc)
    await log_activity(user_id, "resume_upload", {"resume_id": resume_id, "filename": file.filename})

    return {"id": resume_id, "parsed_text": parsed_text}


# AI helpers


def _call_gemini(prompt: str, system_instruction: Optional[str] = None) -> str:
    client_ai = ensure_ai_client()
    config: Dict[str, Any] = {"temperature": 0.4}
    if system_instruction:
        config["system_instruction"] = system_instruction
    resp = client_ai.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=prompt,
        config=config,
    )
    return getattr(resp, "text", "")


@api_router.post("/improveResume")
async def improve_resume(payload: ResumeImproveRequest, current_user: dict = Depends(get_current_user)) -> dict:
    prompt = f"""You are a senior career coach and resume expert.
Analyze this resume and return a JSON with:
- strengths: list
- weaknesses: list
- suggestions: list of concrete improvements
- keyword_recommendations: list of keywords to add

Resume:
{payload.resume_text}

Return ONLY valid JSON.
"""
    raw = _call_gemini(prompt)
    import json

    try:
        data = json.loads(raw)
    except Exception:
        logger.warning("AI response not JSON, wrapping into suggestions")
        data = {
            "strengths": [],
            "weaknesses": [],
            "suggestions": [raw],
            "keyword_recommendations": [],
        }

    await log_activity(current_user["id"], "improve_resume", {})
    return data


@api_router.post("/skillGap")
async def skill_gap(payload: SkillGapRequest, current_user: dict = Depends(get_current_user)) -> dict:
    prompt = f"""You are a career coach.
Compare these current skills to this target role and return JSON with:
- matched_skills: list
- skill_gaps: list
- learning_resources: object where key = skill, value = list of resources
- priority_order: list of skills by priority

Current skills:
{payload.current_skills}

Target role:
{payload.target_role_description}

Return ONLY valid JSON.
"""
    raw = _call_gemini(prompt)
    import json

    try:
        data = json.loads(raw)
    except Exception:
        data = {
            "matched_skills": [],
            "skill_gaps": [],
            "learning_resources": {},
            "priority_order": [],
        }
    await log_activity(current_user["id"], "skill_gap", {})
    return data


@api_router.post("/jobInsights")
async def job_insights(payload: JobInsightsRequest, current_user: dict = Depends(get_current_user)) -> dict:
    prompt = f"""Based on this profile, suggest fitting job titles, industries and locations.
Return JSON with:
- recommended_titles: list
- industries: list
- locations: list
- summary: string

Profile:
{payload.profile_summary}

Return ONLY valid JSON.
"""
    raw = _call_gemini(prompt)
    import json

    try:
        data = json.loads(raw)
    except Exception:
        data = {
            "recommended_titles": [],
            "industries": [],
            "locations": [],
            "summary": raw,
        }
    await log_activity(current_user["id"], "job_insights", {})
    return data


@api_router.post("/rewriteResume")
async def rewrite_resume(payload: RewriteResumeRequest, current_user: dict = Depends(get_current_user)) -> dict:
    prompt = f"""Rewrite this resume in a {payload.tone} tone.
Keep all factual details but improve clarity, impact and ATS friendliness.

Resume:
{payload.resume_text}
"""
    text = _call_gemini(prompt)
    await log_activity(current_user["id"], "rewrite_resume", {})
    return {"rewritten": text}


@api_router.post("/atsScore")
async def ats_score(payload: ATSScoreRequest, current_user: dict = Depends(get_current_user)) -> dict:
    prompt = f"""You are an ATS engine.
Score how well this resume matches the job description.
Return JSON with:
- score: number from 0 to 100
- missing_keywords: list
- strengths: list
- weaknesses: list

Resume:
{payload.resume_text}

Job description:
{payload.job_description}

Return ONLY valid JSON.
"""
    raw = _call_gemini(prompt)
    import json

    try:
        data = json.loads(raw)
    except Exception:
        data = {
            "score": 0,
            "missing_keywords": [],
            "strengths": [],
            "weaknesses": [],
        }
    await log_activity(current_user["id"], "ats_score", {})
    return data


@api_router.post("/matchJobs")
async def match_jobs(payload: MatchJobsRequest, current_user: dict = Depends(get_current_user)) -> dict:
    # Fetch jobs
    query: Dict[str, Any] = {}
    if payload.job_ids:
        query["id"] = {"$in": payload.job_ids}
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(200)

    if not jobs:
        return {"matches": []}

    resume_text = payload.resume_text
    if not resume_text:
        latest_resume = await db.resumes.find_one(
            {"user_id": current_user["id"]}, sort=[("created_at", -1)]
        )
        resume_text = (latest_resume or {}).get("parsed_text", "")

    prompt = f"""For each job below, compute a compatibility score (0-100) with this resume, and list missing keywords.
Return JSON list of objects: {{id, compatibility_score, missing_keywords}}.

Resume:
{resume_text}

Jobs:
{jobs}

Return ONLY valid JSON list.
"""
    raw = _call_gemini(prompt)
    import json

    try:
        results = json.loads(raw)
    except Exception:
        # simple fallback: equal scores
        results = [
            {
                "id": j["id"],
                "compatibility_score": 50,
                "missing_keywords": [],
            }
            for j in jobs
        ]

    # store matches
    now = datetime.now(timezone.utc).isoformat()
    for r in results:
        await db.matches.update_one(
            {"user_id": current_user["id"], "job_id": r["id"]},
            {
                "$set": {
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["id"],
                    "job_id": r["id"],
                    "compatibility_score": r.get("compatibility_score", 0),
                    "missing_keywords": r.get("missing_keywords", []),
                    "status": "saved",
                    "created_at": now,
                }
            },
            upsert=True,
        )

    await log_activity(current_user["id"], "match_jobs", {"jobs_count": len(jobs)})
    return {"matches": results}


@api_router.post("/coverLetter")
async def cover_letter(payload: CoverLetterRequest, current_user: dict = Depends(get_current_user)) -> dict:
    job_desc = payload.job_description
    company = payload.company_name or "the company"

    if payload.job_id and not job_desc:
        job = await db.jobs.find_one({"id": payload.job_id})
        if job:
            job_desc = job.get("description", "")
            company = job.get("title", company)

    prompt = f"""Write a tailored, professional cover letter for {company} based on this resume and job description.

Resume:
{payload.resume_text}

Job description:
{job_desc}
"""
    text = _call_gemini(prompt)
    await log_activity(current_user["id"], "cover_letter", {})
    return {"cover_letter": text}


@api_router.post("/interviewQuestions")
async def interview_questions(payload: InterviewQuestionsRequest, current_user: dict = Depends(get_current_user)) -> dict:
    prompt = f"""Generate structured interview preparation based on this resume and job description.
Return JSON with:
- behavioral_questions: list
- technical_questions: list
- suggested_answers: list (aligned with questions)

Resume:
{payload.resume_text}

Job description:
{payload.job_description}

Return ONLY valid JSON.
"""
    raw = _call_gemini(prompt)
    import json

    try:
        data = json.loads(raw)
    except Exception:
        data = {
            "behavioral_questions": [],
            "technical_questions": [],
            "suggested_answers": [],
        }
    await log_activity(current_user["id"], "interview_questions", {})
    return data


@api_router.post("/autoApply")
async def auto_apply(payload: AutoApplyRequest, current_user: dict = Depends(get_current_user)) -> dict:
    match = await db.matches.find_one({"id": payload.match_id, "user_id": current_user["id"]})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    await db.matches.update_one(
        {"id": payload.match_id}, {"$set": {"status": "applied"}}
    )
    await log_activity(current_user["id"], "auto_apply", {"match_id": payload.match_id})
    return {"status": "applied"}


# Jobs (employer)


@api_router.post("/jobs", response_model=JobRecord)
async def create_job(
    payload: JobCreate, current_user: dict = Depends(lambda: Depends(lambda current=Depends(get_current_user): require_role(["employer", "admin"], current)))
) -> JobRecord:  # type: ignore[valid-type]
    # workaround above because FastAPI doesn't like nested Depends in type hints
    employer = await get_current_user()  # will be overridden by dependency
    if employer.get("role") not in ["employer", "admin"]:
        raise HTTPException(status_code=403, detail="Only employers can post jobs")

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": job_id,
        "employer_id": employer["id"],
        "title": payload.title,
        "description": payload.description,
        "requirements": payload.requirements,
        "location": payload.location,
        "salary": payload.salary,
        "created_at": now,
    }
    await db.jobs.insert_one(doc)
    await log_activity(employer["id"], "job_create", {"job_id": job_id})

    return JobRecord(**{**doc, "created_at": datetime.fromisoformat(now)})


@api_router.get("/jobs", response_model=List[JobRecord])
async def list_jobs() -> List[JobRecord]:
    docs = await db.jobs.find({}, {"_id": 0}).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])  # type: ignore[assignment]
    return [JobRecord(**d) for d in docs]




# User overview


@api_router.get("/user/overview")
async def user_overview(current_user: dict = Depends(get_current_user)) -> dict:
    user_id = current_user["id"]

    resume_count = await db.resumes.count_documents({"user_id": user_id})
    latest_resume = await db.resumes.find_one(
        {"user_id": user_id}, sort=[("created_at", -1)]
    )
    ats_score = (latest_resume or {}).get("ats_score")

    application_count = await db.matches.count_documents(
        {"user_id": user_id, "status": {"$ne": "saved"}}
    )
    interview_count = await db.matches.count_documents(
        {"user_id": user_id, "status": "interview"}
    )

    sub = await db.subscriptions.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    plan = (sub or {}).get("plan", "free")

    activities = (
        await db.activities.find({"user_id": user_id}, {"_id": 0})
        .sort("timestamp", -1)
        .to_list(20)
    )

    return {
        "resume_count": resume_count,
        "latest_ats_score": ats_score,
        "application_count": application_count,
        "interview_count": interview_count,
        "plan": plan,
        "activities": activities,
    }

# Emails (simple log listing)


@api_router.get("/emails", response_model=List[EmailLogRecord])
async def list_emails(current_user: dict = Depends(get_current_user)) -> List[EmailLogRecord]:
    docs = await db.email_logs.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(200)
    for d in docs:
        if isinstance(d.get("received_at"), str):
            d["received_at"] = datetime.fromisoformat(d["received_at"])  # type: ignore[assignment]
    return [EmailLogRecord(**d) for d in docs]


# Stripe demo endpoints


@api_router.post("/stripe/create-checkout-session")
async def create_checkout_session(
    payload: StripeCheckoutRequest, current_user: dict = Depends(get_current_user)
) -> dict:
    sub_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": sub_id,
        "user_id": current_user["id"],
        "plan": payload.plan,
        "stripe_customer_id": None,
        "stripe_subscription_id": None,
        "status": "active",
        "created_at": now,
    }
    await db.subscriptions.insert_one(doc)
    await log_activity(current_user["id"], "subscription_demo", {"plan": payload.plan})

    return {
        "sessionId": f"demo_{sub_id}",
        "url": "https://dashboard.stripe.com/test/payments",  # demo only
    }


@api_router.post("/stripe/webhook")
async def stripe_webhook(payload: dict) -> dict:
    # demo: just log
    logger.info("Received Stripe webhook payload: %s", payload)
    return {"received": True}


# Include router
app.include_router(api_router)
