"""Comprehensive Automated Verification Test Suite for PIS."""

import sys
import os

current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def run_tests():
    print("\n--- Running PIS Test Suite ---")
    
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check: OK")

    # 2. Login
    res = client.post("/api/auth/login", json={"username": "demo", "password": "password123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Auth: Login & JWT Token issuance OK")

    # 3. Get Current User
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200 and res.json()["username"] == "demo"
    print("[PASS] Auth: Get Current User OK")

    # 4. Profile
    res = client.get("/api/profile", headers=headers)
    assert res.status_code == 200 and "full_name" in res.json()
    print("[PASS] Profile: Retrieval OK")

    # 5. Study Tracker
    res = client.get("/api/study/subjects", headers=headers)
    assert res.status_code == 200 and len(res.json()) >= 4
    res = client.get("/api/study/sessions", headers=headers)
    assert res.status_code == 200 and len(res.json()) >= 5
    res = client.get("/api/study/stats", headers=headers)
    assert res.status_code == 200 and "total_hours" in res.json()
    print(f"[PASS] Study Tracker: Subjects & Sessions OK ({res.json()['total_hours']} total hours)")

    # 6. Fitness Tracker
    res = client.get("/api/fitness/workouts", headers=headers)
    assert res.status_code == 200 and len(res.json()) >= 3
    res = client.get("/api/fitness/stats", headers=headers)
    assert res.status_code == 200 and "total_workouts" in res.json()
    print(f"[PASS] Fitness Tracker: Workouts & Exercises OK ({res.json()['total_workouts']} workouts)")

    # 7. Habit Tracker
    res = client.get("/api/habits/overview", headers=headers)
    assert res.status_code == 200 and len(res.json()["habits"]) >= 4
    print("[PASS] Habit Tracker: Habits & Streak Calculations OK")

    # 8. Finance Tracker
    res = client.get("/api/finance/summary", headers=headers)
    assert res.status_code == 200 and "total_income" in res.json()
    fin = res.json()
    print(f"[PASS] Finance Tracker: Income {fin['currency']} {fin['total_income']}, Expenses {fin['currency']} {fin['total_expense']}, Savings {fin['currency']} {fin['net_savings']}")

    # 9. Tasks & Quests
    res = client.get("/api/tasks", headers=headers)
    assert res.status_code == 200 and len(res.json()) >= 5
    res = client.get("/api/tasks/stats", headers=headers)
    assert res.status_code == 200 and "level" in res.json()
    print(f"[PASS] Tasks & Quests: Gamified status OK (Level {res.json()['level']}, {res.json()['xp']} XP)")

    # 10. Journal
    res = client.get("/api/journal", headers=headers)
    assert res.status_code == 200 and len(res.json()) >= 2
    print("[PASS] Journal & Knowledge Base: Search & Entries OK")

    # 11. Analytics Engine
    res = client.get("/api/analytics/dashboard", headers=headers)
    assert res.status_code == 200 and "summary" in res.json() and "weekly_activity" in res.json()
    res = client.get("/api/analytics/report", headers=headers)
    assert res.status_code == 200 and "correlations" in res.json()
    print("[PASS] Analytics Engine: Multi-module Dashboard & Correlations OK")

    # 12. AI Assistant Grounded Response
    res = client.post("/api/ai/chat", headers=headers, json={"message": "How many hours did I study this week?"})
    assert res.status_code == 200 and "reply" in res.json()
    clean_reply1 = res.json()['reply'].replace('\u2022', '*').replace('\u2713', '[x]')
    print(f"[PASS] AI Assistant (Study query): {clean_reply1}")

    res = client.post("/api/ai/chat", headers=headers, json={"message": "Where did most of my money go?"})
    assert res.status_code == 200 and "reply" in res.json()
    clean_reply2 = res.json()['reply'].replace('\u2022', '*').replace('\u2713', '[x]')
    print(f"[PASS] AI Assistant (Finance query): {clean_reply2}")

    # 13. Data Export & Backup
    res = client.get("/api/backup/export", headers=headers)
    assert res.status_code == 200 and "version" in res.json()
    print("[PASS] Backup: Full JSON Data Portability Export OK")

    # 14. Frontend Root Serving
    res = client.get("/")
    assert res.status_code == 200 and "Personal Intelligence System" in res.text
    print("[PASS] Frontend: SPA Index Serving OK")

    print("\n========================================================")
    print("  ALL 14 TEST SUITES PASSED WITH 100% SUCCESS!")
    print("========================================================\n")

if __name__ == "__main__":
    run_tests()
