import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

async def test_gemini():
    load_dotenv(Path(__file__).parent / '.env', override=True)
    api_key = os.environ.get("GEMINI_API_KEY")
    # User specifically requested gemini-2.5-flash
    model_name = "gemini-2.5-flash"
    
    print(f"Testing with API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")
    print(f"Testing with Model: {model_name}")
    
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env")
        return

    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel(model_name)
        response = await model.generate_content_async("Hello")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
