import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

print(f"Testing Groq עם model: {model}...")
try:
    client = Groq(api_key=api_key)
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": "Hello, are you working?"}
        ]
    )
    print("SUCCESS!")
    print(f"Response: {completion.choices[0].message.content}")
except Exception as e:
    print(f"FAILED: {e}")
