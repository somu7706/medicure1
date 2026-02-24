import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_test = [
    "gemini-1.5-pro-latest",
    "gemini-pro-latest",
    "gemini-1.0-pro",
    "gemini-pro",
    "gemma-2b-it"
]

print("Testing more models...")
for model_id in models_to_test:
    print(f"\nTesting {model_id}...")
    try:
        model = genai.GenerativeModel(model_id)
        response = model.generate_content("hello")
        print(f"SUCCESS: {model_id} - Response: {response.text[:50]}")
    except Exception as e:
        print(f"FAILED: {model_id} - Error: {e}")
