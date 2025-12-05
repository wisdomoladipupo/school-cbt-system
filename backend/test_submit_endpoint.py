#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://127.0.0.1:8000"
LOGIN = ("admin@example.com", "adminpass")

print("=" * 60)
print("TESTING EXAM SUBMISSION ENDPOINT")
print("=" * 60)

# 1. Login
print("\n1. Testing login...")
resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": LOGIN[0], "password": LOGIN[1]})
print(f"   Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    token = data.get("access_token")
    print(f"   Token: {token[:20]}...")
    headers = {"Authorization": f"Bearer {token}"}
else:
    print(f"   Error: {resp.text}")
    exit(1)

# 2. Get exams
print("\n2. Fetching exams...")
resp = requests.get(f"{BASE_URL}/api/exams/", headers=headers)
print(f"   Status: {resp.status_code}")
exams = resp.json()
print(f"   Found {len(exams)} exams")

# Find an exam with questions
exam_with_questions = None
for exam in exams[:5]:  # Check first 5
    resp = requests.get(f"{BASE_URL}/api/exams/{exam['id']}/questions", headers=headers)
    if resp.status_code == 200 and len(resp.json()) > 0:
        exam_with_questions = exam
        break

if exam_with_questions:
    print(f"\n3. Found exam with questions: {exam_with_questions['id']}")
else:
    print(f"\n3. No exam with questions found, using exam 1")
    exam_with_questions = {"id": 1}

# 4. Test submission
exam_id = exam_with_questions["id"]
print(f"\n4. Submitting exam {exam_id}...")
payload = {"exam_id": exam_id, "answers": []}
resp = requests.post(f"{BASE_URL}/api/results/submit", headers=headers, json=payload)
print(f"   Status: {resp.status_code}")
if resp.status_code == 200:
    print(f"   ✓ Submission successful!")
    data = resp.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
else:
    print(f"   ✗ Submission failed!")
    print(f"   Response: {resp.text}")

print("\n" + "=" * 60)
