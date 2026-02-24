from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    preferred_language: str = "en"
    location_mode: str = "manual"
    location_label: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    mobile: Optional[str] = None
    otp: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None
    theme: Optional[str] = None
    location_mode: Optional[str] = None
    location_label: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class LocationAuto(BaseModel):
    lat: float
    lng: float


class LocationManual(BaseModel):
    query: str


class ChatMessage(BaseModel):
    message: str
    context_upload_id: Optional[str] = None


class DoctorFeedback(BaseModel):
    stars: int = Field(ge=1, le=5)
    was_helpful: bool
    accuracy: int = Field(ge=1, le=10)
    comment: Optional[str] = None
    condition_tag: Optional[str] = None


class TextUpload(BaseModel):
    text: str


class LinkUpload(BaseModel):
    url: str


class TTSRequest(BaseModel):
    text: str
    lang: str = "en"


class UsernameUpdate(BaseModel):
    username: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class GoogleAuth(BaseModel):
    id_token: str


class OtpRequest(BaseModel):
    identifier: str


class OtpVerify(BaseModel):
    identifier: str
    otp: str


class MedicalInfo(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None


class EmergencyContact(BaseModel):
    id: Optional[str] = None
    name: str
    relationship: str
    phone: str


class SosRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    message: Optional[str] = None
