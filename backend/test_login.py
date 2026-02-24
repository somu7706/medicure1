import httpx
import time
import json

def test_login():
    url = "http://localhost:8000/api/auth/login"
    data = {"email": "test@example.com", "password": "password123"}
    
    print(f"Testing login at {url}...")
    start = time.time()
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=data)
            duration = time.time() - start
            print(f"Status: {resp.status_code}")
            print(f"Duration: {duration:.4f}s")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
