import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URI', os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
DB_NAME = os.environ.get('DB_NAME', 'mediguide')

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'vitalwave_secret_2025')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get('REFRESH_TOKEN_EXPIRE_DAYS', 7))

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('GEMINI_API_KEY', os.environ.get('EMERGENT_LLM_KEY', ''))

# Directories
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Google Auth
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

# Email/SMTP
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

# Twilio
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER")
