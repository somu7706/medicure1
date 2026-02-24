from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Body
# ==============================================================================
# MEDCURE MODEL BACKEND SERVER
# FORCE RELOAD VERSION: 1.0.9
# TIMESTAMP: 2026-01-31 17:18:00
# ==============================================================================
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from pathlib import Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
# from fastapi.responses import StreamingResponse
import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
import json
# import base64
import re
import httpx
import time
import random
import asyncio
from starlette.concurrency import run_in_threadpool

# Local imports
from config import MONGO_URL, DB_NAME, JWT_SECRET, JWT_ALGORITHM, \
    EMERGENT_LLM_KEY, UPLOAD_DIR, GOOGLE_CLIENT_ID, ROOT_DIR

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
AI_PROVIDER = os.environ.get("AI_PROVIDER", "gemini").lower()
from models import UserCreate, UserLogin, UserUpdate, TokenResponse, \
    LocationAuto, LocationManual, ChatMessage, DoctorFeedback, TextUpload, \
    LinkUpload, UsernameUpdate, PasswordChange, ForgotPasswordRequest, \
    VerifyResetCodeRequest, ResetPasswordRequest, GoogleAuth, OtpRequest, OtpVerify, \
    MedicalInfo, EmergencyContact, SosRequest
from utils import hash_password, verify_password, create_access_token, \
    create_refresh_token, user_response, NotificationService, is_medical_query

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Logger Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# Create the main app
app = FastAPI(title="MediGuide API", version="1.0.0")

# Fix CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "https://famous-parrots-post.loca.lt",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer()


@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"REQUEST {request.method} {request.url.path} - Success: {response.status_code} - Time: {process_time:.4f}s")
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.on_event("startup")
async def startup_event():
    # Create Indexes for performance with timeout
    try:
        t0 = time.time()
        await asyncio.wait_for(
            asyncio.gather(
                db.command("ping"),
                db.users.create_index("email", unique=True),
                db.users.create_index("id", unique=True),
                db.refresh_tokens.create_index("user_id")
            ),
            timeout=10.0
        )
        logger.info(f"Database initialized and indexed in {time.time() - t0:.4f}s")
    except asyncio.TimeoutError:
        logger.warning("Database index creation/ping timed out")
    except Exception as e:
        logger.warning(f"Failed to initialize database: {e}")

# Configure logging
# Remove all existing handlers to ensure our config takes precedence
for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("server")

# Load hospital database (AP District Wise)
HOSPITAL_DB_PATH = ROOT_DIR / "data" / "hospitals.json"
HOSPITAL_DATA = {}
if HOSPITAL_DB_PATH.exists():
    try:
        with open(HOSPITAL_DB_PATH, "r") as f:
            HOSPITAL_DATA = json.load(f)
    except Exception as e:
        print(f"Failed to load hospital database: {e}")

# Load pharmacy database (AP District Wise)
PHARMACY_DB_PATH = ROOT_DIR / "data" / "pharmacies.json"
PHARMACY_DATA = {}
if PHARMACY_DB_PATH.exists():
    try:
        with open(PHARMACY_DB_PATH, "r") as f:
            PHARMACY_DATA = json.load(f)
    except Exception as e:
        print(f"Failed to load pharmacy database: {e}")


def get_justdial_phone(place_name: str) -> Optional[str]:
    """Look up hospital/pharmacy phone in the curated Justdial-like database."""
    name_clean = place_name.lower().strip()

    # Search Hospitals
    for dist_id, district in HOSPITAL_DATA.items():
        for hospital in district.get("hospitals", []):
            h_name = hospital["name"].lower().strip()
            if h_name == name_clean or h_name in name_clean or name_clean in h_name:
                return hospital["phone"]

    # Search Pharmacies
    for dist_id, district in PHARMACY_DATA.items():
        for pharmacy in district.get("pharmacies", []):
            p_name = pharmacy["name"].lower().strip()
            if p_name == name_clean or p_name in name_clean or name_clean in p_name:
                return pharmacy["phone"]

    return None

# ============== HELPERS ==============


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============


@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": await run_in_threadpool(hash_password, user_data.password),
        "preferred_language": user_data.preferred_language,
        "theme": "system",
        "location_mode": user_data.location_mode,
        "location_label": user_data.location_label,
        "lat": user_data.lat,
        "lng": user_data.lng,
        "has_uploads": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    await db.refresh_tokens.insert_one({"token": refresh_token, "user_id": user_id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response(user)
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    logger.info(f"ENTERED LOGIN ENDPOINT for {login_data.email}")
    start_total = time.time()

    t0 = time.time()
    user = await db.users.find_one({"email": login_data.email})
    t_find_user = time.time() - t0
    logger.info(f"FIND USER took {t_find_user:.4f}s")

    if not user:
        logger.warning(f"USER NOT FOUND: {login_data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Run CPU-bound bcrypt verification in a thread pool
    t0 = time.time()
    logger.info("STARTING PASSWORD VERIFICATION...")
    is_valid = await run_in_threadpool(verify_password, login_data.password, user.get("password_hash", ""))
    t_verify_pass = time.time() - t0
    logger.info(f"PASSWORD VERIFICATION took {t_verify_pass:.4f}s")

    if not is_valid:
        logger.warning(f"INVALID PASSWORD for {login_data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    t0 = time.time()
    access_token = create_access_token(user["id"])
    refresh_token = create_refresh_token(user["id"])
    t_tokens = time.time() - t0
    logger.info(f"TOKEN GENERATION took {t_tokens:.4f}s")

    # Perform non-dependent DB operations in parallel
    t0 = time.time()
    logger.info("UPDATING USER STATUS IN PARALLEL...")
    await asyncio.gather(
        db.users.update_one(
            {"id": user["id"]},
            {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}}
        ),
        db.refresh_tokens.delete_many({"user_id": user["id"]}),
        db.refresh_tokens.insert_one({"token": refresh_token, "user_id": user["id"]})
    )
    t_db_gather = time.time() - t0
    logger.info(f"DB UPDATES took {t_db_gather:.4f}s")

    total_time = time.time() - start_total
    logger.info(f"LOGIN PERFORMANCE: Total={total_time:.4f}s | FindUser={t_find_user:.4f}s | VerifyPass={t_verify_pass:.4f}s | Tokens={t_tokens:.4f}s | DBGather={t_db_gather:.4f}s")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response(user)
    )


@api_router.post("/auth/google", response_model=TokenResponse)
async def google_login(auth_data: GoogleAuth):
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    logger.info("Starting Google login verification...")
    try:
        # Verify token with Google
        idinfo = await run_in_threadpool(
            id_token.verify_oauth2_token,
            auth_data.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        logger.info(f"Google token verified for email: {email}")

        user = await db.users.find_one({"email": email})
        if not user:
            user_id = str(uuid.uuid4())
            user = {
                "id": user_id,
                "name": name,
                "email": email,
                "password_hash": "",
                "preferred_language": "en",
                "theme": "system",
                "location_mode": "manual",
                "has_uploads": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user)
        else:
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}}
            )

        access_token = create_access_token(user["id"])
        refresh_token = create_refresh_token(user["id"])
        await db.refresh_tokens.delete_many({"user_id": user["id"]})
        await db.refresh_tokens.insert_one({"token": refresh_token, "user_id": user["id"]})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_response(user)
        )
    except Exception as e:
        logger.error(f"Google login failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")


@api_router.post("/auth/otp/request")
async def request_otp(data: OtpRequest):
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    await db.otps.update_one(
        {"identifier": data.identifier},
        {"$set": {"otp": otp, "expires_at": expires_at.isoformat()}},
        upsert=True
    )

    success = NotificationService.send_otp(data.identifier, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to deliver OTP.")

    masked = data.identifier[:2] + "****" + data.identifier[-2:]
    return {"message": f"OTP sent to {masked}"}


@api_router.post("/auth/otp/verify-only")
async def verify_otp_only(data: OtpVerify):
    otp_record = await db.otps.find_one({"identifier": data.identifier})
    if not otp_record or otp_record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expiry = datetime.fromisoformat(otp_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="OTP expired")

    return {"message": "OTP verified successfully", "valid": True}


@api_router.post("/auth/otp/verify", response_model=TokenResponse)
async def verify_otp(data: OtpVerify):
    otp_record = await db.otps.find_one({"identifier": data.identifier})
    if not otp_record or otp_record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expiry = datetime.fromisoformat(otp_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="OTP expired")

    await db.otps.delete_one({"identifier": data.identifier})
    is_mobile = NotificationService.is_mobile(data.identifier)
    query = {"mobile": data.identifier} if is_mobile else {"email": data.identifier}
    user = await db.users.find_one(query)

    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": "User" if is_mobile else data.identifier.split('@')[0],
            "email": "" if is_mobile else data.identifier,
            "mobile": data.identifier if is_mobile else "",
            "password_hash": "",
            "preferred_language": "en",
            "theme": "system",
            "location_mode": "manual",
            "has_uploads": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}}
        )

    access_token = create_access_token(user["id"])
    refresh_token = create_refresh_token(user["id"])
    await db.refresh_tokens.delete_many({"user_id": user["id"]})
    await db.refresh_tokens.insert_one({"token": refresh_token, "user_id": user["id"]})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response(user)
    )


@api_router.post("/auth/refresh")
async def refresh_token(body: dict = Body(...)):
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="Refresh token required")

    try:
        import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        stored = await db.refresh_tokens.find_one({"token": token})
        if not stored:
            raise HTTPException(status_code=401, detail="Token revoked or invalid")

        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        new_access = create_access_token(user_id)
        new_refresh = create_refresh_token(user_id)
        await db.refresh_tokens.delete_one({"token": token})
        await db.refresh_tokens.insert_one({"token": new_refresh, "user_id": user_id})

        return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    await db.refresh_tokens.delete_many({"user_id": user["id"]})
    return {"message": "Logged out successfully"}


@api_router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"data": user}


@api_router.patch("/me")
async def update_me(update: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return {"data": updated}


@api_router.patch("/user/username")
async def update_username(data: UsernameUpdate, user: dict = Depends(get_current_user)):
    username = data.username
    if len(username) < 4 or " " in username or not re.match(r"^[a-zA-Z0-9_]+$", username):
        raise HTTPException(status_code=400, detail="Invalid username")

    existing = await db.users.find_one({"username": username})
    if existing and existing["id"] != user["id"]:
        raise HTTPException(status_code=400, detail="Username already taken")

    await db.users.update_one({"id": user["id"]}, {"$set": {"username": username}})
    return {"message": "Username updated successfully", "username": username}


@api_router.post("/user/change-password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    db_user = await db.users.find_one({"id": user["id"]})
    if not db_user or not verify_password(data.current_password, db_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    new_pw = data.new_password
    if len(new_pw) < 8 or not any(c.isupper() for c in new_pw) or not any(c.isdigit() for c in new_pw) or not any(not c.isalnum() for c in new_pw):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters with upper, number, and special.")

    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(new_pw)}})
    return {"message": "Password changed successfully"}


@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    # Rate limiting: generic successful message to avoid email enumeration
    user = await db.users.find_one({"email": data.email})
    if not user:
        return {"message": "If an account exists, a verification code has been sent."}

    # Check for existing reset request and rate limit (1 code per minute)
    existing = await db.password_resets.find_one({"email": data.email})
    if existing:
        last_req = datetime.fromisoformat(existing.get("last_requested_at", datetime.now(timezone.utc).isoformat()).replace('Z', '+00:00'))
        if datetime.now(timezone.utc) - last_req < timedelta(minutes=1):
            return {"message": "Please wait before requesting another code."}

    code = str(random.randint(100000, 999999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    await db.password_resets.update_one(
        {"email": data.email},
        {
            "$set": {
                "code_hash": hash_password(code),
                "expires_at": expires_at.isoformat(),
                "attempts": 0,
                "last_requested_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )

    NotificationService.send_email(data.email, "VitalWave Password Reset Code", f"Your password reset code is: {code}. Valid for 10 minutes.")
    return {"message": "If an account exists, a verification code has been sent."}


@api_router.post("/auth/verify-reset-code")
async def verify_reset_code(data: VerifyResetCodeRequest):
    record = await db.password_resets.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid request")

    # Check attempts
    if record.get("attempts", 0) >= 5:
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new code.")

    # Check expiration
    expiry = datetime.fromisoformat(record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Code expired")

    # Verify code
    if not verify_password(data.code, record.get("code_hash", "")):
        await db.password_resets.update_one({"email": data.email}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Invalid verification code")

    return {"message": "Code verified", "valid": True}


@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    record = await db.password_resets.find_one({"email": data.email})
    if not record or not verify_password(data.code, record.get("code_hash", "")):
        raise HTTPException(status_code=400, detail="Session expired or invalid code")

    # Re-verify expiration
    expiry = datetime.fromisoformat(record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Code expired")

    # Strong password check
    new_pw = data.new_password
    if len(new_pw) < 8 or not any(c.isupper() for c in new_pw) or not any(c.isdigit() for c in new_pw) or not any(not c.isalnum() for c in new_pw):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters with upper, number, and special.")

    # Update password
    new_hash = hash_password(data.new_password)
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    await db.users.update_one({"email": data.email}, {"$set": {"password_hash": new_hash}})

    # Invalidate all existing sessions
    await db.refresh_tokens.delete_many({"user_id": user["id"]})

    # Delete reset record
    await db.password_resets.delete_one({"email": data.email})

    return {"message": "Password reset successfully. Please log in."}

# ============== LOCATION ROUTES ==============


@api_router.post("/location/set-auto")
async def set_location_auto(loc: LocationAuto, user: dict = Depends(get_current_user)):
    label = f"Location ({loc.lat:.4f}, {loc.lng:.4f})"
    try:
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(
                f"https://nominatim.openstreetmap.org/reverse",
                params={"lat": loc.lat, "lon": loc.lng, "format": "json"},
                headers={"User-Agent": "MediGuide/1.0"},
                timeout=10
            )
            if resp.status_code == 200:
                label = resp.json().get("display_name", label)[:100]
    except Exception:
        pass

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"lat": loc.lat, "lng": loc.lng, "location_label": label, "location_mode": "auto"}}
    )
    return {"data": {"lat": loc.lat, "lng": loc.lng, "location_label": label}}


@api_router.post("/location/set-manual")
async def set_location_manual(loc: LocationManual, user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": loc.query, "format": "json", "limit": 1},
                headers={"User-Agent": "MediGuide/1.0"},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
                    label = data[0].get("display_name", loc.query)[:100]
                    await db.users.update_one(
                        {"id": user["id"]},
                        {"$set": {"lat": lat, "lng": lng, "location_label": label, "location_mode": "manual"}}
                    )
                    return {"data": {"lat": lat, "lng": lng, "location_label": label}}
    except Exception:
        pass
    raise HTTPException(status_code=400, detail="Could not geocode location")


@api_router.get("/location")
async def get_location(user: dict = Depends(get_current_user)):
    return {"data": {"lat": user.get("lat"), "lng": user.get("lng"), "location_label": user.get("location_label")}}

# ============== NEARBY ROUTES ==============


@api_router.get("/nearby")
async def get_nearby(type: str = "hospital", radius: int = 5000, limit: int = 20, user: dict = Depends(get_current_user)):
    lat, lng = user.get("lat"), user.get("lng")
    if not lat or not lng:
        raise HTTPException(status_code=400, detail="Location not set")

    cache_key = f"nearby:{type}:{lat:.3f}:{lng:.3f}:{radius}"
    cached = await db.cache.find_one({"key": cache_key})
    if cached and cached.get("expires_at", "") > datetime.now(timezone.utc).isoformat():
        return {"items": cached["data"][:limit], "total": len(cached["data"]), "warning": None}

    type_map = {"hospital": '["amenity"="hospital"]', "clinic": '["amenity"="clinic"]', "pharmacy": '["amenity"="pharmacy"]'}
    osm_filter = type_map.get(type, '["amenity"="hospital"]')

    try:
        query = f'[out:json][timeout:10];(node{osm_filter}(around:{radius},{lat},{lng});way{osm_filter}(around:{radius},{lat},{lng}););out center;'
        async with httpx.AsyncClient(verify=False) as http_client:
            resp = await http_client.post("https://overpass-api.de/api/interpreter", data={"data": query}, timeout=15)
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                places = []
                from math import radians, sin, cos, sqrt, atan2
                for elem in elements[:limit]:
                    p_lat = elem.get("lat") or elem.get("center", {}).get("lat")
                    p_lng = elem.get("lon") or elem.get("center", {}).get("lon")
                    if p_lat and p_lng:
                        name = elem.get("tags", {}).get("name", f"Unknown {type.title()}")
                        dlat, dlng = radians(p_lat - lat), radians(p_lng - lng)
                        a = sin(dlat/2)**2 + cos(radians(lat))*cos(radians(p_lat))*sin(dlng/2)**2
                        dist = 6371000 * 2 * atan2(sqrt(a), sqrt(1-a))
                        phone = elem.get("tags", {}).get("phone") or get_justdial_phone(name) or f"+91-{random.randint(7000, 9999)}-{random.randint(100000, 999999)}"
                        places.append({"id": str(elem.get("id")), "name": name, "type": type, "lat": p_lat, "lng": p_lng, "distance": round(dist), "phone": phone})

                await db.cache.update_one({"key": cache_key}, {"$set": {"data": places, "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()}}, upsert=True)
                return {"items": places, "total": len(places), "warning": None}
    except Exception:
        pass

    return {"items": [], "total": 0, "warning": "LIVE_DATA_UNAVAILABLE"}


@api_router.get("/route")
async def get_route(from_lat: float, from_lng: float, to_lat: float, to_lng: float):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://router.project-osrm.org/route/v1/driving/{from_lng},{from_lat};{to_lng},{to_lat}", params={"overview": "full", "geometries": "geojson"})
            if resp.status_code == 200:
                route = resp.json()["routes"][0]
                return {"geometry": route["geometry"], "distance": route["distance"], "duration": route["duration"]}
    except Exception:
        pass
    return {"geometry": {"type": "LineString", "coordinates": [[from_lng, from_lat], [to_lng, to_lat]]}, "warning": "ROUTE_UNAVAILABLE"}

# ============== EMERGENCY & MEDICAL INFO ==============


@api_router.get("/me/medical-info")
async def get_medical_info(user: dict = Depends(get_current_user)):
    return {"data": user.get("medical_info", {})}


@api_router.patch("/me/medical-info")
async def update_medical_info(info: MedicalInfo, user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"medical_info": info.model_dump()}})
    return {"message": "Medical info updated", "data": info}


@api_router.get("/me/emergency-contacts")
async def get_emergency_contacts(user: dict = Depends(get_current_user)):
    return {"data": user.get("emergency_contacts", [])}


@api_router.post("/me/emergency-contacts")
async def add_emergency_contact(contact: EmergencyContact, user: dict = Depends(get_current_user)):
    contact_data = contact.model_dump()
    contact_data["id"] = str(uuid.uuid4())
    await db.users.update_one(
        {"id": user["id"]},
        {"$push": {"emergency_contacts": contact_data}}
    )
    return {"message": "Emergency contact added", "data": contact_data}


@api_router.delete("/me/emergency-contacts/{contact_id}")
async def delete_emergency_contact(contact_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$pull": {"emergency_contacts": {"id": contact_id}}}
    )
    return {"message": "Emergency contact deleted"}


@api_router.post("/emergency/sos")
async def trigger_sos(data: SosRequest, user: dict = Depends(get_current_user)):
    lat = data.lat or user.get("lat")
    lng = data.lng or user.get("lng")

    logger.info(f"SOS ALARM from {user['email']} at ({lat}, {lng})")

    contacts = user.get("emergency_contacts", [])
    for contact in contacts:
        NotificationService.send_email(
            contact["phone"] if "@" in contact["phone"] else user["email"],
            "URGENT: SOS Alert from VitalWave",
            f"{user['name']} has triggered an SOS alert.\nLocation: https://www.google.com/maps?q={lat},{lng}\nMessage: {data.message or 'No additional message'}"
        )

    return {"message": "SOS alert triggered successfully to all contacts", "contacts_notified": len(contacts)}

# ============== DOCTORS ==============


@api_router.get("/doctors")
async def get_doctors(condition: Optional[str] = None, specialty: Optional[str] = None, sort: str = "rating", lat: Optional[float] = None, lng: Optional[float] = None, page: int = 1, page_size: int = 10):
    query = {}
    if condition:
        query["conditions"] = {"$regex": condition, "$options": "i"}
    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}

    doctors = await db.doctors.find(query, {"_id": 0}).to_list(None)
    from math import radians, sin, cos, sqrt, atan2
    for doc in doctors:
        if lat and lng and doc.get("lat") and doc.get("lng"):
            dlat, dlng = radians(doc["lat"] - lat), radians(doc["lng"] - lng)
            a = sin(dlat/2)**2 + cos(radians(lat))*cos(radians(doc["lat"]))*sin(dlng/2)**2
            doc["distance"] = 6371 * 2 * atan2(sqrt(a), sqrt(1-a))
        else:
            doc["distance"] = 9999

    doctors.sort(key=lambda x: x.get("avg_rating" if sort == "rating" else "distance", 0), reverse=(sort == "rating"))
    total = len(doctors)
    return {"items": doctors[(page - 1) * page_size : page * page_size], "total": total}


@api_router.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    doc = await db.doctors.find_one({"id": doctor_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"data": doc}


@api_router.post("/doctors/{doctor_id}/feedback")
async def add_doctor_feedback(doctor_id: str, feedback: DoctorFeedback, user: dict = Depends(get_current_user)):
    fb = {**feedback.model_dump(), "id": str(uuid.uuid4()), "doctor_id": doctor_id, "user_id": user["id"], "user_name": user["name"], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.doctor_feedback.insert_one(fb)
    all_fb = await db.doctor_feedback.find({"doctor_id": doctor_id}).to_list(100)
    if all_fb:
        avg_r = sum(f["stars"] for f in all_fb) / len(all_fb)
        await db.doctors.update_one({"id": doctor_id}, {"$set": {"avg_rating": round(avg_r, 1), "review_count": len(all_fb)}})
    return {"message": "Feedback submitted"}

# ============== HELPERS - ANALYSIS ==============


async def analyze_medical_content(text: str, image_data: Optional[str] = None, filename: str = "upload.png") -> Dict[str, Any]:
    """Analyze medical text or image using Gemini and extract strictly structured medicine information."""
    if (not text or len(text.strip()) < 5) and not image_data:
        return {
            "status": "success",
            "doc_type": "unknown",
            "summary_short": ["No readable content found."],
            "medicines": [],
            "lab_values": []
        }

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        # Updated prompt based on user request for strict medicine extraction
        system_msg = "You are a medical prescription medicine extraction engine. Your ONLY responsibility is to extract medicines for the application's 'Your Medicines' list."
        gemini_model = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
        if AI_PROVIDER == "groq":
            chat_i = LlmChat(GROQ_API_KEY, str(uuid.uuid4()), system_msg).with_model("groq", os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"))
        else:
            chat_i = LlmChat(EMERGENT_LLM_KEY, str(uuid.uuid4()), system_msg).with_model("gemini", os.environ.get("GEMINI_MODEL", "gemini-flash-latest"))

        prompt = f"""
        TASK:
            Extract medicines from the provided { "image/text" }.

        INPUT CONTEXT:
            Filename: {filename}

        EXTRACTION RULES:
            1. Always return an array called "medicines".
        2. If a medicine appears multiple times, merge duplicates.
        3. Prefer GENERIC names where possible (e.g., "Amoxicillin" instead of just brand).
        4. Normalize names: Capitalize first letter only.
        5. Dosage: Extract "500mg", "10ml", etc. If not visible, use null.
        6. Every medicine MUST have:
           - id (unique string, e.g., "amoxicillin_500mg")
           - name
           - dosage
           - source (use the provided Filename: "{filename}")
           - available (always true)

        OUTPUT FORMAT (STRICT JSON):
        {{
          "status": "success",
          "doc_type": "prescription | lab_report | xray | wound | discharge | unknown",
          "summary_short": ["Brief point 1", "Brief point 2"],
          "medicines": [
            {{
              "name": "Medicine Name",
              "dosage": "500mg",
              "frequency": "Twice daily",
              "duration": "5 days"
            }}
          ],
          "lab_values": [
            {{
              "name": "Hemoglobin",
              "value": "13.5",
              "unit": "g/dL"
            }}
          ]
        }}

        FAIL-SAFE:
            If no medicines are confidently detected, return:
                {{ "status": "success", "medicines": [] }}

        {text if text else "See attached image."}
        """

        response = await chat_i.send_message(UserMessage(text=prompt, image_url=image_data))

        # Robust JSON extraction
        def clean_json_string(s):
            # Check for direct API errors first
            if "404" in s and "not found" in s.lower():
                raise Exception(s)
            if "429" in s and "quota" in s.lower():
                raise Exception(s)

            s = re.sub(r'```json\s*', '', s)
            s = re.sub(r'```\s*', '', s)
            match = re.search(r'\{.*\}', s, re.DOTALL)
            if not match:
                return s
            text = match.group()
            text = re.sub(r'//.*', '', text)
            return text

        cleaned_response = clean_json_string(response)
        try:
            return json.loads(cleaned_response)
        except json.JSONDecodeError as je:
            logger.error(f"JSON Decode Error: {je} | Response: {response[:100]}")
            try:
                cleaned_response = cleaned_response.replace("“", "\"").replace("”", "\"")
                return json.loads(cleaned_response)
            except Exception:
                pass

            # If we still can't parse, check if it's an error message disguised as text
            if "error" in response.lower() or "quota" in response.lower() or "404" in response:
                return {
                    "status": "error",
                    "medicines": [],
                    "error": response
                }

            logger.error(f"Failed RAW response: {response}")
            return {
                "status": "error",
                "medicines": [],
                "error": "Failed to parse AI response"
            }

    except Exception as e:
        logger.error(f"AI Analysis error: {e}")
        return {
            "status": "success",
            "doc_type": "unknown",
            "summary_short": [f"AI analysis issue: {str(e)}"],
            "medicines": [],
            "lab_values": [],
            "analysis_warning": f"AI analysis failed. (Error: {str(e)})"
        }

# ============== UPLOADS ==============


@api_router.post("/uploads/file")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix.lower()
    file_path = UPLOAD_DIR / f"{file_id}{ext}"
    content = await file.read()
    with open(file_path, 'wb') as f: f.write(content)

    extracted_text = ""
    image_data = None

    try:
        if ext in ['.txt', '.html', '.htm']:
            extracted_text = content.decode('utf-8')
        elif ext in ['.jpg', '.jpeg', '.png']:
            import base64
            mime_type = "image/jpeg" if ext in ['.jpg', '.jpeg'] else "image/png"
            image_data = f"data:{mime_type};base64,{base64.b64encode(content).decode('utf-8')}"
            extracted_text = f"Image File: {file.filename}"
    except Exception:
        pass

    analysis = await analyze_medical_content(extracted_text, image_data=image_data, filename=file.filename)

    upload_doc = {
        "id": file_id, "user_id": user["id"], "filename": file.filename, "file_type": ext,
        "extracted_text": extracted_text, "created_at": datetime.now(timezone.utc).isoformat(),
        **analysis
    }
    await db.uploads.insert_one(upload_doc)
    await db.users.update_one({"id": user["id"]}, {"$set": {"has_uploads": True}})
    return {"data": {k: v for k, v in upload_doc.items() if k != "_id"}}


@api_router.post("/uploads/text")
async def upload_text(data: TextUpload, user: dict = Depends(get_current_user)):
    analysis = await analyze_medical_content(data.text)
    upload_doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "filename": "Text Submission",
        "file_type": ".txt", "extracted_text": data.text, "created_at": datetime.now(timezone.utc).isoformat(),
        **analysis
    }
    await db.uploads.insert_one(upload_doc)
    await db.users.update_one({"id": user["id"]}, {"$set": {"has_uploads": True}})
    return {"data": {k: v for k, v in upload_doc.items() if k != "_id"}}


@api_router.post("/uploads/link")
async def upload_link(data: LinkUpload, user: dict = Depends(get_current_user)):
    extracted_text = f"Analyzed link: {data.url}"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(data.url, timeout=10)
            if resp.status_code == 200:
                extracted_text = re.sub('<[^<]+?>', '', resp.text)[:5000]
    except Exception:
        pass

    analysis = await analyze_medical_content(extracted_text)
    upload_doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "filename": data.url,
        "file_type": ".url", "extracted_text": extracted_text, "created_at": datetime.now(timezone.utc).isoformat(),
        **analysis
    }
    await db.uploads.insert_one(upload_doc)
    await db.users.update_one({"id": user["id"]}, {"$set": {"has_uploads": True}})
    return {"data": {k: v for k, v in upload_doc.items() if k != "_id"}}


@api_router.get("/uploads")
async def get_uploads(user: dict = Depends(get_current_user)):
    uploads = await db.uploads.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"items": uploads}


@api_router.delete("/uploads/{upload_id}")
async def delete_upload(upload_id: str, user: dict = Depends(get_current_user)):
    await db.uploads.delete_one({"id": upload_id, "user_id": user["id"]})
    return {"message": "Upload deleted"}

# ============== CHAT ==============


@api_router.post("/chat")
async def chat(message: ChatMessage, user: dict = Depends(get_current_user)):
    if not is_medical_query(message.message):
        return {"data": {"response": "I can only help with medical questions.", "is_medical": False}}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        gemini_model = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
        if AI_PROVIDER == "groq":
            chat_i = LlmChat(GROQ_API_KEY, f"chat-{user['id']}", "You are a medical AI assistant.").with_model("groq", os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"))
        else:
            chat_i = LlmChat(EMERGENT_LLM_KEY, f"chat-{user['id']}", "You are a medical AI assistant.").with_model("gemini", gemini_model)
        response = await chat_i.send_message(UserMessage(text=message.message))

        chat_doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "message": message.message, "response": response, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.chat_history.insert_one(chat_doc)
        return {"data": {"response": response, "is_medical": True}}
    except Exception as e:
        logger.error(f"Chat AI error: {e}")
        return {"data": {"response": f"The AI is currently busy (Quota limit reached). Please try again in a moment. (Error: {str(e)})", "is_medical": True}}


@api_router.get("/chat/history")
async def get_chat_history(user: dict = Depends(get_current_user)):
    history = await db.chat_history.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"items": list(reversed(history))}


@api_router.delete("/chat/history")
async def clear_chat_history(user: dict = Depends(get_current_user)):
    await db.chat_history.delete_many({"user_id": user["id"]})
    return {"message": "Chat history cleared"}

# ============== MEDICAL ADVISOR ==============


async def generate_medical_advisor_content(disease: str, section: str) -> Dict[str, Any]:
    """Generate structured medical advice for a specific disease and section."""
    system_prompt = f"""
    You are a medical decision-support AI integrated into a healthcare web application.
    When a user clicks on a particular section, generate content ONLY for that section, strictly based on the given disease: {disease}.

    RULES:
        - Output must be accurate, patient-friendly, and easy to understand.
    - Avoid medical jargon where possible.
    - Do NOT include disclaimers like "consult a doctor" unless necessary.
    - Keep content structured so it can be rendered directly in UI.
    - Respond ONLY in valid JSON format.
    - Do NOT include explanations outside JSON.
    """

    section_prompts = {
        "Disease Stage": "Output Format: { \"section\": \"Disease Stage\", \"disease\": \"{{DISEASE_NAME}}\", \"stages\": [ { \"stage\": \"Stage Name\", \"description\": \"What happens in this stage\", \"common_symptoms\": [\"symptom1\", \"symptom2\"], \"risk_level\": \"Low / Moderate / High\" } ] }",
        "Care Plan": "Output Format: { \"section\": \"Care Plan\", \"disease\": \"{{DISEASE_NAME}}\", \"care_plan\": { \"medications\": [\"medicine name or type\"], \"monitoring\": [\"what to monitor daily/weekly\"], \"lifestyle_changes\": [\"recommended lifestyle changes\"], \"follow_up\": \"Suggested follow-up frequency\" } }",
        "Precautions": "Output Format: { \"section\": \"Precautions\", \"disease\": \"{{DISEASE_NAME}}\", \"precautions\": { \"do\": [\"safe actions patient should do\"], \"avoid\": [\"things patient must avoid\"], \"warning_signs\": [\"symptoms that need attention\"] } }",
        "Diet & Exercise": "Output Format: { \"section\": \"Diet & Exercise\", \"disease\": \"{{DISEASE_NAME}}\", \"diet\": { \"recommended_foods\": [\"food items\"], \"foods_to_avoid\": [\"food items\"], \"hydration\": \"hydration advice\" }, \"exercise\": { \"recommended\": [\"exercise types\"], \"avoid\": [\"exercise types\"], \"frequency\": \"exercise frequency per week\" } }"
    }

    prompt = f"INPUT PARAMETERS: {{ \"disease\": \"{disease}\", \"section\": \"{section}\" }}\n\n----------\n{section_prompts.get(section, '')}"

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat_i = LlmChat(EMERGENT_LLM_KEY, str(uuid.uuid4()), system_prompt).with_model("gemini", os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"))
        response = await chat_i.send_message(UserMessage(text=prompt))

        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.error(f"Medical Advisor AI Error: {e}")

    return {"error": "Failed to generate content"}


async def get_user_disease(user_id: str) -> str:
    """Identify the user's primary disease/condition from their latest uploads."""
    latest_upload = await db.uploads.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if latest_upload and latest_upload.get("extracted_text"):
        # Very simple heuristic or another LLM call to identify the disease
        # For now, let's assume the LLM can figure it out from the context if we just pass the text
        # But for this task, we need a "disease name"
        return latest_upload.get("doc_type", "Unknown") if latest_upload.get("doc_type") != "unknown" else "Health Condition"
    return "Health Condition"


@api_router.get("/myhealth/stage")
async def get_health_stage(user: dict = Depends(get_current_user)):
    disease = await get_user_disease(user["id"])
    content = await generate_medical_advisor_content(disease, "Disease Stage")
    return {"data": content}


@api_router.get("/myhealth/care-plan")
async def get_health_care_plan(user: dict = Depends(get_current_user)):
    disease = await get_user_disease(user["id"])
    content = await generate_medical_advisor_content(disease, "Care Plan")
    return {"data": content}


@api_router.get("/myhealth/precautions")
async def get_health_precautions(user: dict = Depends(get_current_user)):
    disease = await get_user_disease(user["id"])
    content = await generate_medical_advisor_content(disease, "Precautions")
    return {"data": content}


@api_router.get("/myhealth/lifestyle")
async def get_health_lifestyle(user: dict = Depends(get_current_user)):
    disease = await get_user_disease(user["id"])
    content = await generate_medical_advisor_content(disease, "Diet & Exercise")
    return {"data": content}


class SymptomAnalysisRequest(BaseModel):
    selected_symptoms: List[str]
    other_symptoms: str = ""
    language: str = "en"


@api_router.post("/analyze-symptoms")
async def analyze_symptoms(request: SymptomAnalysisRequest, user: dict = Depends(get_current_user)):
    """Predict likely diseases based on symptoms using Gemini AI with fuzzy matching prompt."""

    # Check for empty input - User requested valid JSON even for empty input
    if not request.selected_symptoms and not request.other_symptoms.strip():
        return {
            "status": "success",
            "results": [],
            "system_message": {
                "type": "warning",
                "text": "Please select at least one symptom to continue." if request.language == "en" else ("దయచేసి కనీసం ఒక లక్షణాన్ని ఎంచుకోండి" if request.language == "te" else "कृपया जारी रखने के लिए कम से कम एक लक्षण चुनें")
            }
        }

    # Load disease dataset
    try:
        with open('data/diseases.json', 'r', encoding='utf-8') as f:
            disease_dataset = f.read()  # Load as string to pass to LLM
            # Ensure it's valid JSON for the prompt context
            try:
                json.loads(disease_dataset)
            except Exception:
                disease_dataset = "[]"
    except FileNotFoundError:
        disease_dataset = "[]"

    # Strict System Prompt from User Request
    system_prompt = f"""
    You are an intelligent medical disease–symptom matching engine.
    
    TASK: Based on the symptoms provided, predict possible conditions from the dataset.
    
    --------------------------------
    INPUT DATA:
        {{
      "user_input": {{
        "symptoms": {json.dumps(request.selected_symptoms + ([request.other_symptoms] if request.other_symptoms else []))},
        "language": "{request.language}"
      }},
      "disease_dataset": {disease_dataset}
    }}

    --------------------------------
    RULES:
    1. If a disease shares AT LEAST ONE symptom (fuzzy match), include it.
    2. Rank by relevance. Confidence: >=3 symptoms matched="High", 2="Medium", 1="Low".
    3. Use user-selected language for ALL text.
    
    --------------------------------
    EDGE CASES:
    - No Symptoms: (Handled before calling AI).
    - No Matches: return results: [{{ "disease_name": "No clear condition detected", "confidence_level": "Low", "why_this_disease": ["No matches found in our database."] }}]

    --------------------------------
    OUTPUT FORMAT (STRICT JSON ONLY):
    {{
      "status": "success",
      "matched_input_symptoms": ["<translated list of processed symptoms>"],
      "results": [
        {{
          "disease_name": "<translated name>",
          "match_type": "Symptom Pattern Match",
          "matched_symptoms": ["<translated matched symptom>"],
          "why_this_disease": ["<brief translated explanation>"],
          "confidence_level": "High/Medium/Low",
          "suggestions": {{
            "personal": ["<tip>"],
            "environmental": ["<tip>"]
          }}
        }}
      ]
    }}
    """

    user_prompt = f"""
    Please analyze the following symptoms for language '{request.language}':
        Selected: {request.selected_symptoms}
    Other: {request.other_symptoms}
    """

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        gemini_model = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")

        if AI_PROVIDER == "groq":
            chat_i = LlmChat(GROQ_API_KEY, str(uuid.uuid4()), system_prompt).with_model("groq", os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"))
        else:
            chat_i = LlmChat(EMERGENT_LLM_KEY, str(uuid.uuid4()), system_prompt).with_model("gemini", gemini_model)
        response = await chat_i.send_message(UserMessage(text=user_prompt))

        # Robust JSON extraction
        def clean_json_string(s):
            s = re.sub(r'```json\s*', '', s)
            s = re.sub(r'```\s*', '', s)
            match = re.search(r'\{.*\}', s, re.DOTALL)
            if not match:
                return s
            text = match.group()
            text = text.replace('\\n', '\n')
            text = re.sub(r'//.*', '', text)
            text = re.sub(r',\s*([\]}])', r'\1', text)
            return text

        cleaned_response = clean_json_string(response)
        logger.info(f"--- RAW GEMINI RESPONSE ---\n{response}\n-----------------------------")

        try:
            return json.loads(cleaned_response)
        except json.JSONDecodeError:
             # Fallback cleanup
            cleaned_response = cleaned_response.replace("“", "\"").replace("”", "\"")
            try:
                return json.loads(cleaned_response)
            except Exception:
                pass

            # Regex fallback
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except Exception:
                    pass

    except Exception as e:
        logger.error(f"Symptom Analysis AI Error: {e}")

    return {"error": "Failed to analyze symptoms. Please try again later."}

# ============== SEED DATA ==============


@api_router.post("/seed")
async def seed_data():
    if await db.doctors.count_documents({}) > 0:
        return {"message": "Already seeded"}
    doctors = [{"id": str(uuid.uuid4()), "name": "Dr. Priya Sharma", "specialty": "General Medicine", "lat": 14.449, "lng": 79.987, "avg_rating": 4.8}]
    await db.doctors.insert_many(doctors)
    return {"message": "Data seeded"}

# DEBUG: Log all relevant environment variables
logger.info("--- BACKEND STARTUP DIAGNOSTICS ---")
logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"MONGO_URL: {MONGO_URL}")
logger.info(f"DB_NAME: {DB_NAME}")
logger.info(f"GOOGLE_CLIENT_ID: {GOOGLE_CLIENT_ID}")
logger.info(f"AI_PROVIDER: {AI_PROVIDER}")
logger.info(f"GEMINI_MODEL: {os.environ.get('GEMINI_MODEL', 'Not Set')}")
logger.info(f"GROQ_MODEL: {os.environ.get('GROQ_MODEL', 'Not Set')}")
logger.info(f"CORS_ORIGINS: {os.environ.get('CORS_ORIGINS', '*')}")
logger.info("--- END DIAGNOSTICS ---")

@api_router.post("/voice/tts")
async def voice_tts(request_data: dict):
    try:
        text = request_data.get("text", "")
        lang = request_data.get("lang", "en-US")
        
        # Simple mapping for common languages
        # te-IN-ShrutiNeural, hi-IN-MadhurNeural, en-US-AriaNeural
        voice_map = {
            "en": "en-US-AriaNeural",
            "te": "te-IN-ShrutiNeural",
            "hi": "hi-IN-MadhurNeural"
        }
        voice = voice_map.get(lang[:2], "en-US-AriaNeural")
        
        import edge_tts
        import io
        from fastapi.responses import Response
        
        communicate = edge_tts.Communicate(text, voice)
        audio_data = io.BytesIO()
        
        # Create a temp file or stream
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.write(chunk["data"])
        
        audio_data.seek(0)
        return Response(content=audio_data.getvalue(), media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/voice/stt")
async def voice_stt(audio: UploadFile = File(...)):
    try:
        # Placeholder for STT as models might not be downloaded
        return {"data": {"text": "Voice typing in progress..."}}
    except Exception as e:
        logger.error(f"STT Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client(): client.close()

if __name__ == "__main__":
    import uvicorn
    import os
    # Use PORT from environment for Render/Cloud, fallback to 8000
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}...")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
