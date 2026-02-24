import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content("Say hi")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
吐
