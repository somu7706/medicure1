import httpx
import time
import uuid

BASE_URL = "http://127.0.0.1:8001/api"

def diagnose():
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    password = "Password123!"
    
    print(f"--- DIAGNOSING API at {BASE_URL} ---")
    
    with httpx.Client(timeout=30.0) as client:
        # 1. Test TTS (No Auth)
        print("\n1. Testing TTS...")
        start = time.time()
        try:
            resp = client.post(f"{BASE_URL}/voice/tts", json={"text": "Hello, testing TTS.", "lang": "en"})
            print(f"TTS Status: {resp.status_code}, Time: {time.time() - start:.4f}s, Bytes: {len(resp.content)}")
        except Exception as e:
            print(f"TTS Error: {e}")

        # 2. Register (Needs OTP - skip if complex, try login instead)
        # We'll skip registration as it needs OTP. Let's try a direct chat call with a dummy token to see if it reaches the logic.
        
        # 3. Test Chat (Needs Auth - let's try to find a user or mock)
        print("\n2. Testing Chat (Attempting with mock auth bypass if possible, or just checking latency of auth check)...")
        start = time.time()
        try:
            # We don't have a token, but we can see how fast the 401/403 comes back
            resp = client.post(f"{BASE_URL}/chat", json={"message": "What is fever?"})
            print(f"Chat (No Auth) Status: {resp.status_code}, Time: {time.time() - start:.4f}s")
        except Exception as e:
            print(f"Chat Error: {e}")

if __name__ == "__main__":
    diagnose()
