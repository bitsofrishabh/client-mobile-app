"""
Backend tests for Goals endpoints (/api/goals).
Tests against the public preview URL using EXPO_PUBLIC_BACKEND_URL + /api.
"""
import sys
import json
import uuid
import requests
from pathlib import Path

# Read EXPO_PUBLIC_BACKEND_URL from frontend/.env
FRONTEND_ENV = Path("/app/frontend/.env")
BACKEND_URL = None
for line in FRONTEND_ENV.read_text().splitlines():
    if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
        BACKEND_URL = line.split("=", 1)[1].strip().strip('"').strip("'")
        break

assert BACKEND_URL, "EXPO_PUBLIC_BACKEND_URL not found in /app/frontend/.env"
API = f"{BACKEND_URL}/api"
print(f"Using API base: {API}")

results = []


def record(name, ok, detail=""):
    status = "PASS" if ok else "FAIL"
    results.append((name, ok, detail))
    print(f"[{status}] {name} :: {detail}")


def main():
    # ---------- Step 1: Register ----------
    suffix = uuid.uuid4().hex[:8]
    email = f"sarah.morgan+{suffix}@fitmail.test"
    password = "Str0ngPass!2026"
    register_payload = {
        "name": "Sarah Morgan",
        "email": email,
        "password": password,
        "age": 29,
        "gender": "female",
        "height_cm": 168.0,
        "weight_kg": 82.4,
    }

    try:
        r = requests.post(f"{API}/auth/register", json=register_payload, timeout=30)
    except Exception as e:
        record("POST /api/auth/register", False, f"network error: {e}")
        return

    if r.status_code != 200:
        record("POST /api/auth/register", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    body = r.json()
    token = body.get("access_token")
    if not token:
        record("POST /api/auth/register", False, f"no access_token in body: {body}")
        return
    record("POST /api/auth/register", True, f"user_id={body.get('user', {}).get('id')}")
    auth_headers = {"Authorization": f"Bearer {token}"}

    # ---------- Step 2: GET /api/goals (defaults for new user) ----------
    r = requests.get(f"{API}/goals", headers=auth_headers, timeout=30)
    if r.status_code != 200:
        record("GET /api/goals (defaults)", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    g = r.json()
    expected_defaults = {
        "primary_goal": "lose_weight",
        "target_weight_kg": None,
        "weekly_workout_days": 3,
        "daily_steps_goal": 10000,
        "daily_water_goal": 8,
        "target_date": None,
        "is_set": False,
    }
    mismatches = []
    for k, v in expected_defaults.items():
        if g.get(k) != v:
            mismatches.append(f"{k} expected={v!r} got={g.get(k)!r}")
    if mismatches:
        record("GET /api/goals (defaults)", False, "; ".join(mismatches))
    else:
        record("GET /api/goals (defaults)", True, json.dumps(g))

    # ---------- Step 3: POST /api/goals (set goals) ----------
    set_payload = {
        "primary_goal": "build_muscle",
        "target_weight_kg": 75.5,
        "weekly_workout_days": 5,
        "daily_steps_goal": 12000,
        "daily_water_goal": 10,
    }
    r = requests.post(f"{API}/goals", json=set_payload, headers=auth_headers, timeout=30)
    if r.status_code != 200:
        record("POST /api/goals (set)", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    body = r.json()
    if not body.get("message"):
        record("POST /api/goals (set)", False, f"no message in response: {body}")
    else:
        record("POST /api/goals (set)", True, body.get("message"))

    # ---------- Step 4: GET /api/goals returns saved values ----------
    r = requests.get(f"{API}/goals", headers=auth_headers, timeout=30)
    if r.status_code != 200:
        record("GET /api/goals (after set)", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    g = r.json()
    expected_set = {
        "primary_goal": "build_muscle",
        "target_weight_kg": 75.5,
        "weekly_workout_days": 5,
        "daily_steps_goal": 12000,
        "daily_water_goal": 10,
        "is_set": True,
    }
    mismatches = []
    for k, v in expected_set.items():
        if g.get(k) != v:
            mismatches.append(f"{k} expected={v!r} got={g.get(k)!r}")
    if mismatches:
        record("GET /api/goals (after set)", False, "; ".join(mismatches))
    else:
        record("GET /api/goals (after set)", True, json.dumps(g))

    # ---------- Step 5: GET /api/auth/me reflects synced fields ----------
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    if r.status_code != 200:
        record("GET /api/auth/me (synced)", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    me = r.json()
    me_mismatches = []
    if me.get("fitness_goal") != "build_muscle":
        me_mismatches.append(f"fitness_goal expected='build_muscle' got={me.get('fitness_goal')!r}")
    if me.get("goal_weight_kg") != 75.5:
        me_mismatches.append(f"goal_weight_kg expected=75.5 got={me.get('goal_weight_kg')!r}")
    if me_mismatches:
        record("GET /api/auth/me (synced)", False, "; ".join(me_mismatches))
    else:
        record("GET /api/auth/me (synced)", True,
               f"fitness_goal={me.get('fitness_goal')} goal_weight_kg={me.get('goal_weight_kg')}")

    # ---------- Step 6: POST /api/goals partial update ----------
    r = requests.post(f"{API}/goals", json={"primary_goal": "stay_fit"}, headers=auth_headers, timeout=30)
    if r.status_code != 200:
        record("POST /api/goals (partial upsert)", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    record("POST /api/goals (partial upsert)", True, r.json().get("message", ""))

    r = requests.get(f"{API}/goals", headers=auth_headers, timeout=30)
    if r.status_code != 200:
        record("GET /api/goals (after partial)", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    g = r.json()
    expected_partial = {
        "primary_goal": "stay_fit",
        "weekly_workout_days": 3,
        "daily_steps_goal": 10000,
        "daily_water_goal": 8,
        "is_set": True,
    }
    partial_mismatches = []
    for k, v in expected_partial.items():
        if g.get(k) != v:
            partial_mismatches.append(f"{k} expected={v!r} got={g.get(k)!r}")
    if partial_mismatches:
        record("GET /api/goals (after partial)", False, "; ".join(partial_mismatches))
    else:
        record("GET /api/goals (after partial)", True, json.dumps(g))

    # ---------- Step 7: GET /api/goals without auth ----------
    r = requests.get(f"{API}/goals", timeout=30)
    if r.status_code in (401, 403):
        record("GET /api/goals (no auth)", True, f"HTTP {r.status_code}")
    else:
        record("GET /api/goals (no auth)", False, f"expected 401/403, got HTTP {r.status_code}: {r.text[:200]}")

    # Save credentials for handoff
    Path("/app/memory").mkdir(parents=True, exist_ok=True)
    Path("/app/memory/test_credentials.md").write_text(
        f"""# Test Credentials

Last test user used by goals endpoint tests:

- email: `{email}`
- password: `{password}`
- name: Sarah Morgan
- age: 29, gender: female, height: 168cm, weight: 82.4kg
- generated by: /app/backend_test.py
- backend base: {API}
"""
    )

    # ---------- Summary ----------
    failed = [r for r in results if not r[1]]
    print("\n========== SUMMARY ==========")
    for n, ok, d in results:
        print(f"  [{'PASS' if ok else 'FAIL'}] {n}")
    print(f"\nTotal: {len(results)} | Passed: {len(results) - len(failed)} | Failed: {len(failed)}")
    sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()
