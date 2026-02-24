import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_test = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.0-flash-lite"]

print("Testing models...")
for model_id in models_to_test:
    print(f"\nTesting {model_id}...")
    try:
        model = genai.GenerativeModel(model_id)
        response = model.generate_content("hello")
        print(f"SUCCESS: {model_id} - Response length: {len(response.text)}")
    except Exception as e:
        print(f"FAILED: {model_id} - Error: {e}")
