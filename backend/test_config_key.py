from config import EMERGENT_LLM_KEY
import os
import google.generativeai as genai

print(f"Key from config: {EMERGENT_LLM_KEY}")
genai.configure(api_key=EMERGENT_LLM_KEY)

try:
    model = genai.GenerativeModel("gemini-2.0-flash-lite")
    response = model.generate_content("Say hello")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
