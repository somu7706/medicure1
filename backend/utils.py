import bcrypt
import jwt
import re
import smtplib
import logging
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client as TwilioClient
from config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, \
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def user_response(user: dict) -> dict:
    return {k: v for k, v in user.items() if k not in ['password_hash', '_id']}


class NotificationService:
    @staticmethod
    def is_mobile(identifier: str) -> bool:
        return re.match(r'^\+?[1-9]\d{1,14}$', identifier) is not None

    @staticmethod
    def send_sms(to_number: str, body: str):
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER and "your_token" not in TWILIO_AUTH_TOKEN:
            try:
                client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                client.messages.create(body=body, from_=TWILIO_FROM_NUMBER, to=to_number)
                logger.info(f"SMS sent to {to_number}")
                return True
            except Exception as e:
                logger.error(f"Failed to send SMS: {e}")
                return False
        else:
            logger.warning(f"Twilio not configured. SMS simulated for {to_number}: {body}")
            return True

    @staticmethod
    def send_email(to_email: str, subject: str, body: str):
        if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
            try:
                msg = MIMEMultipart()
                msg['From'] = f"VitalWave <{SMTP_USER}>"
                msg['To'] = to_email
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain'))

                with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                    server.starttls()
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.send_message(msg)
                logger.info(f"Email sent successfully to {to_email}")
                return True
            except Exception as e:
                logger.error(f"Failed to send Email to {to_email}: {e}")
                return False
        else:
            logger.warning(f"SMTP not configured. Email simulated for {to_email}: {subject}")
            return True

    @staticmethod
    def send_otp(identifier: str, otp: str):
        is_mobile = NotificationService.is_mobile(identifier)
        if is_mobile:
            body = f"Your VitalWave verification code is: {otp}. Valid for 5 minutes."
            return NotificationService.send_sms(identifier, body)
        else:
            body = f"""
            Hello,

            Your verification code for VitalWave is: {otp}

            This code will expire in 5 minutes.

            If you did not request this code, please ignore this email.
            """
            return NotificationService.send_email(identifier, "VitalWave Verification Code", body)


MEDICAL_KEYWORDS = [
    'hospital', 'medicine', 'disease', 'symptom', 'doctor', 'health', 'medical', 'treatment',
    'diagnosis', 'prescription', 'lab', 'report', 'xray', 'x-ray', 'scan', 'blood', 'test',
    'pain', 'fever', 'cold', 'cough', 'headache', 'injury', 'wound', 'surgery', 'therapy',
    'diabetes', 'cancer', 'heart', 'kidney', 'liver', 'lung', 'brain', 'bone', 'muscle',
    'diet', 'exercise', 'nutrition', 'vitamin', 'supplement', 'allergy', 'infection',
    'pharmacy', 'clinic', 'emergency', 'ambulance', 'nurse', 'patient', 'care', 'wellness',
    'bp', 'sugar', 'cholesterol', 'hemoglobin', 'thyroid', 'vaccine', 'immunity',
    'tablet', 'capsule', 'syrup', 'injection', 'dosage', 'side effect', 'precaution',
    'checkup', 'appointment', 'specialist', 'consultation', 'referral',
    'fat', 'mineral', 'water', 'hydration', 'lifestyle', 'habit', 'routine',
    'ayurveda', 'ayurvedic', 'homeopathy', 'natural', 'remedy', 'cure', 'prevention',
    'morning', 'night', 'daily', 'hair', 'teeth', 'dental', 'vision', 'eyes',
    'precuation', 'ferver', 'sysmptom', 'symptom', 'treatment', 'tablet', 'pill',
    'how to', 'what are', 'tips', 'advice', 'help', 'symptoms', 'medicine', 'medicines',
    'hospital', 'medicine', 'medicines', 'medical', 'health', 'healthcare', 'clinic', 'pharmacy',
    'disease', 'diseases', 'symptom', 'symptoms', 'sign', 'diagnosis', 'treatment', 'therapy', 'cure',
    'doctor', 'physician', 'surgeon', 'specialist', 'consultation', 'appointment', 'referral',
    'nurse', 'patient', 'care', 'wellness', 'emergency', 'ambulance', 'icu', 'ward',
    'lab', 'laboratory', 'test', 'tests', 'blood', 'urine', 'report', 'xray', 'x-ray', 'scan', 'mri', 'ct',
    'ultrasound', 'ecg', 'ekg', 'eeg', 'echo', 'biopsy', 'screening', 'monitoring',
    'prescription', 'drug', 'drugs', 'tablet', 'tablets', 'pill', 'pills', 'capsule', 'capsules',
    'syrup', 'injection', 'dosage', 'insulin', 'antibiotic', 'antiviral', 'antifungal', 'steroid',
    'pain', 'painkiller', 'fever', 'cold', 'cough', 'headache', 'migraine', 'injury', 'wound', 'burn',
    'surgery', 'operation', 'fracture', 'sprain', 'therapy', 'rehab',
    'diabetes', 'cancer', 'heart', 'cardiac', 'bp', 'pressure', 'hypertension', 'cholesterol',
    'kidney', 'renal', 'liver', 'hepatic', 'lung', 'pulmonary', 'brain', 'neuro', 'bone', 'muscle', 'joint',
    'asthma', 'arthritis', 'stroke', 'paralysis', 'epilepsy', 'anemia', 'jaundice', 'tb', 'tuberculosis',
    'pneumonia', 'infection', 'virus', 'bacteria', 'covid', 'corona', 'flu', 'malaria', 'dengue',
    'allergy', 'rash', 'itching', 'swelling', 'inflammation', 'vomit', 'vomiting', 'nausea', 'diarrhea',
    'constipation', 'stomach', 'digestion', 'acid', 'heartburn', 'ulcer',
    'mental', 'mental health', 'stress', 'anxiety', 'depression', 'panic', 'sleep', 'insomnia',
    'diet', 'nutrition', 'food', 'eat', 'calorie', 'protein', 'carb', 'fat', 'vitamin', 'mineral',
    'supplement', 'water', 'hydration', 'exercise', 'workout', 'gym', 'fitness', 'yoga', 'weight',
    'loss', 'gain', 'bmi', 'lifestyle', 'habit', 'routine',
    'pregnancy', 'pregnant', 'delivery', 'menstrual', 'periods', 'fertility', 'child', 'baby', 'vaccine',
    'immunization', 'immunity',
    'first aid', 'cpr', 'rescue', 'trauma', 'accident', 'bleeding', 'bandage', 'shock', 'overdose',
    'ayurveda', 'ayurvedic', 'homeopathy', 'naturopathy', 'herbal', 'natural', 'remedy', 'prevention',
    'checkup', 'followup', 'precaution', 'side effect', 'safety',
    'how to', 'what is', 'tips', 'advice', 'help', 'is it safe', 'can i take',
    'feaver', 'ferver', 'diabetis', 'canser', 'hart', 'kidny', 'docter', 'medison', 'hospitel',
    'hedache', 'stomoch', 'nausia', 'pregnent', 'vaccin', 'injecion', 'sysmptom', 'precuation',
    'how to', 'what are', 'tips', 'advice', 'help', 'symptoms', 'medicine', 'medicines'
]


def is_medical_query(text: str) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in MEDICAL_KEYWORDS)
