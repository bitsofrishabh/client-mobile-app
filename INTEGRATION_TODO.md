# Web Portal Integration TODO

This file documents the **3 changes required on the web-portal side** so the mobile client app can fully integrate with the dietician portal.

Repo: https://github.com/bitsofrishabh/coaching-app-web (branch: `dev`)

The mobile app (this repo) already calls `https://pdf-platform-1.preview.emergentagent.com/api` for:
- `POST /client/auth/register` — already exists ✅
- `POST /client/auth/login` — already exists ✅
- `GET /client/me` — already exists ✅
- `GET /client/diet-plan` — already exists ✅

What's missing for end-to-end push notifications when a diet plan is assigned:

## 1. New endpoint: `POST /api/client/push-token`

Receives an Expo push token from the mobile app and stores it on the client's user record. Mobile app calls this on every login + after successful coach connection.

```python
# in backend/server.py — add inside the @api_router section

class PushTokenPayload(BaseModel):
    expo_push_token: str
    platform: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None

@api_router.post("/client/push-token")
async def register_push_token(
    data: PushTokenPayload,
    user: dict = Depends(get_current_client),  # uses existing client auth
):
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "expo_push_token": data.expo_push_token,
                "push_platform": data.platform,
                "push_device_info": data.device_info,
                "push_token_updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )
    return {"ok": True}
```

## 2. Send push when dietician assigns a diet plan

Find the existing assign-diet-plan handler (look for the route that sets `client.diet_plan_id` or creates a diet_plan document). Right after the assignment is persisted, add the following:

```python
import httpx  # already in requirements.txt

async def send_expo_push(to_token: str, title: str, body: str, data: dict = None):
    if not to_token or not to_token.startswith("ExponentPushToken"):
        return
    payload = {
        "to": to_token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "data": data or {},
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post("https://exp.host/--/api/v2/push/send", json=payload)
    except Exception as e:
        print(f"Push send error: {e}")

# Inside assign_diet_plan(...) handler, after the upsert:
client_user = await db.users.find_one({"id": client_id})
if client_user and client_user.get("expo_push_token"):
    await send_expo_push(
        client_user["expo_push_token"],
        title="\U0001F37D\uFE0F Your diet plan is ready!",
        body="Your dietician has assigned a personalized plan. Tap to view it.",
        data={"type": "diet_plan_assigned", "plan_id": plan_id},
    )
```

## 3. Web frontend: confirmation toast on assignment

In the React/Next.js dietician dashboard, after a successful `POST /api/diet-plans/.../assign` (or equivalent), show a success toast:

```jsx
toast.success('Diet plan has been successfully assigned to the client.');
```

If you're using sonner / react-hot-toast / chakra, the API is similar.

---

## Mobile-side wiring (already done in this repo)

- `src/services/portalApi.ts` — axios instance pointing at `EXPO_PUBLIC_PORTAL_URL`, automatic Bearer token injection.
- `src/services/pushToken.ts` — `getExpoPushToken()` + `registerPushTokenWithPortal()`. Gracefully no-ops on 404 until the portal endpoint above is deployed.
- `src/context/AuthContext.tsx` — adds `isCoachConnected`, `connectCoach(inviteCode, password)`, `disconnectCoach()`.
- `app/coach-connect.tsx` — UI for entering invite code + password.
- `app/(tabs)/diet-plan.tsx` — fetches portal plan when connected, falls back to local sample, shows banner + CTA.
- `app/_layout.tsx` — root notification listener that auto-refreshes diet plan when push payload `type === 'diet_plan_assigned'`.

---

## Testing the full loop

1. Mobile: register a client, go to Diet Plan tab → tap "Get a personalized plan" → enter invite code + password → connect.
2. Web: log in as the dietician with that invite code, find the new client, create a diet plan, assign it.
3. Mobile: should receive push notification within seconds and Diet Plan tab auto-refreshes to show the assigned plan.
