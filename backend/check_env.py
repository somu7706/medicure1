import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

print(f"GEMINI_API_KEY: {os.environ.get('GEMINI_API_KEY')}")
print(f"EMERGENT_LLM_KEY: {os.environ.get('EMERGENT_LLM_KEY')}")
print(f"GEMINI_MODEL: {os.environ.get('GEMINI_MODEL')}")
