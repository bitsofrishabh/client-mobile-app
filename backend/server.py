from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'diettracker')]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'diettracker-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="DietTracker Pro API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    activity_level: Optional[str] = "moderate"  # sedentary, light, moderate, active, very_active

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    activity_level: Optional[str] = "moderate"
    bmi: Optional[float] = None
    daily_calorie_goal: Optional[int] = None
    created_at: datetime
    coach_code: Optional[str] = None
    package_id: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None

class WeightLog(BaseModel):
    weight_kg: float
    notes: Optional[str] = None

class WaterLog(BaseModel):
    glasses: int
    notes: Optional[str] = None

class SleepLog(BaseModel):
    bedtime: str  # HH:MM format
    wake_time: str  # HH:MM format
    quality: Optional[str] = "good"  # poor, fair, good, excellent
    notes: Optional[str] = None

class WorkoutLog(BaseModel):
    workout_type: str  # fullbody, upperbody, lowerbody, cardio, abs
    duration_mins: int
    calories_burned: Optional[int] = None
    exercises: Optional[List[dict]] = []
    notes: Optional[str] = None

class StepsLog(BaseModel):
    steps: int
    distance_km: Optional[float] = None
    calories_burned: Optional[int] = None

class MealLog(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    food_items: List[dict]  # [{name, calories, protein, carbs, fat}]
    total_calories: Optional[int] = None
    notes: Optional[str] = None

class CoachConnect(BaseModel):
    coach_code: str

# ==================== HELPER FUNCTIONS ====================

def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)

def calculate_daily_calories(weight_kg: float, height_cm: float, age: int, gender: str, activity_level: str, goal: str = "maintain") -> int:
    # Mifflin-St Jeor Equation
    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    
    tdee = bmr * activity_multipliers.get(activity_level, 1.55)
    return int(tdee)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    
    # Calculate BMI and calories if data provided
    bmi = None
    daily_calories = None
    if data.height_cm and data.weight_kg:
        bmi = calculate_bmi(data.weight_kg, data.height_cm)
        if data.age and data.gender:
            daily_calories = calculate_daily_calories(
                data.weight_kg, data.height_cm, data.age, 
                data.gender, data.activity_level or "moderate"
            )
    
    user = {
        "id": user_id,
        "email": data.email,
        "name": data.name,
        "password": hash_password(data.password),
        "age": data.age,
        "gender": data.gender,
        "height_cm": data.height_cm,
        "weight_kg": data.weight_kg,
        "goal_weight_kg": data.goal_weight_kg,
        "activity_level": data.activity_level or "moderate",
        "bmi": bmi,
        "daily_calorie_goal": daily_calories,
        "created_at": datetime.utcnow(),
        "coach_code": None,
        "package_id": None
    }
    
    await db.users.insert_one(user)
    
    # Create initial weight log
    if data.weight_kg:
        await db.weight_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "weight_kg": data.weight_kg,
            "date": date.today().isoformat(),
            "created_at": datetime.utcnow()
        })
    
    token = create_token(user_id, data.email)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": data.email,
            "name": data.name,
            "bmi": bmi,
            "daily_calorie_goal": daily_calories
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "bmi": user.get("bmi"),
            "daily_calorie_goal": user.get("daily_calorie_goal")
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return UserProfile(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        age=user.get("age"),
        gender=user.get("gender"),
        height_cm=user.get("height_cm"),
        weight_kg=user.get("weight_kg"),
        goal_weight_kg=user.get("goal_weight_kg"),
        activity_level=user.get("activity_level"),
        bmi=user.get("bmi"),
        daily_calorie_goal=user.get("daily_calorie_goal"),
        created_at=user["created_at"],
        coach_code=user.get("coach_code"),
        package_id=user.get("package_id")
    )

# ==================== PROFILE ENDPOINTS ====================

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    # Recalculate BMI if height or weight changed
    height = update_data.get("height_cm") or user.get("height_cm")
    weight = update_data.get("weight_kg") or user.get("weight_kg")
    
    if height and weight:
        update_data["bmi"] = calculate_bmi(weight, height)
        
        age = update_data.get("age") or user.get("age")
        gender = update_data.get("gender") or user.get("gender")
        activity = update_data.get("activity_level") or user.get("activity_level")
        
        if age and gender:
            update_data["daily_calorie_goal"] = calculate_daily_calories(
                weight, height, age, gender, activity or "moderate"
            )
    
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user["id"]})
    return {"message": "Profile updated", "bmi": updated_user.get("bmi")}

# ==================== DASHBOARD ENDPOINT ====================

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    # Get today's data
    today_water = await db.water_logs.find_one({"user_id": user["id"], "date": today})
    today_sleep = await db.sleep_logs.find_one({"user_id": user["id"], "date": today})
    today_steps = await db.steps_logs.find_one({"user_id": user["id"], "date": today})
    today_workout = await db.workout_logs.find_one({"user_id": user["id"], "date": today})
    today_meals = await db.meal_logs.find({"user_id": user["id"], "date": today}).to_list(10)
    
    # Calculate today's calories consumed
    calories_consumed = sum(meal.get("total_calories", 0) for meal in today_meals)
    
    # Get recent weights for progress
    recent_weights = await db.weight_logs.find(
        {"user_id": user["id"]}
    ).sort("created_at", -1).limit(7).to_list(7)
    
    # Calculate streak (days with activity)
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    activities = await db.workout_logs.count_documents({
        "user_id": user["id"],
        "date": {"$gte": week_ago}
    })
    
    return {
        "user": {
            "name": user["name"],
            "bmi": user.get("bmi"),
            "current_weight": user.get("weight_kg"),
            "goal_weight": user.get("goal_weight_kg"),
            "daily_calorie_goal": user.get("daily_calorie_goal")
        },
        "today": {
            "date": today,
            "water_glasses": today_water.get("glasses", 0) if today_water else 0,
            "sleep_hours": calculate_sleep_hours(today_sleep) if today_sleep else 0,
            "steps": today_steps.get("steps", 0) if today_steps else 0,
            "workout_done": today_workout is not None,
            "workout_mins": today_workout.get("duration_mins", 0) if today_workout else 0,
            "calories_consumed": calories_consumed,
            "calories_burned": (today_workout.get("calories_burned", 0) if today_workout else 0) + 
                              (today_steps.get("calories_burned", 0) if today_steps else 0)
        },
        "progress": {
            "recent_weights": [{"date": w["date"], "weight": w["weight_kg"]} for w in recent_weights],
            "weekly_workouts": activities,
            "weight_change": calculate_weight_change(recent_weights)
        },
        "has_coach": user.get("coach_code") is not None
    }

def calculate_sleep_hours(sleep_log: dict) -> float:
    if not sleep_log:
        return 0
    try:
        bedtime = datetime.strptime(sleep_log["bedtime"], "%H:%M")
        wake_time = datetime.strptime(sleep_log["wake_time"], "%H:%M")
        if wake_time < bedtime:
            wake_time += timedelta(days=1)
        diff = wake_time - bedtime
        return round(diff.seconds / 3600, 1)
    except:
        return 0

def calculate_weight_change(weights: list) -> float:
    if len(weights) < 2:
        return 0
    return round(weights[0]["weight_kg"] - weights[-1]["weight_kg"], 1)

# ==================== WEIGHT ENDPOINTS ====================

@api_router.post("/weight")
async def log_weight(data: WeightLog, user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    # Update or create today's log
    existing = await db.weight_logs.find_one({"user_id": user["id"], "date": today})
    
    log_data = {
        "user_id": user["id"],
        "weight_kg": data.weight_kg,
        "date": today,
        "notes": data.notes,
        "created_at": datetime.utcnow()
    }
    
    if existing:
        await db.weight_logs.update_one({"_id": existing["_id"]}, {"$set": log_data})
    else:
        log_data["id"] = str(uuid.uuid4())
        await db.weight_logs.insert_one(log_data)
    
    # Update user's current weight
    bmi = calculate_bmi(data.weight_kg, user.get("height_cm", 170))
    await db.users.update_one(
        {"id": user["id"]}, 
        {"$set": {"weight_kg": data.weight_kg, "bmi": bmi}}
    )
    
    return {"message": "Weight logged", "weight_kg": data.weight_kg, "bmi": bmi}

@api_router.get("/weight/history")
async def get_weight_history(user: dict = Depends(get_current_user)):
    weights = await db.weight_logs.find(
        {"user_id": user["id"]}
    ).sort("date", -1).limit(30).to_list(30)
    
    return {
        "weights": [{"date": w["date"], "weight_kg": w["weight_kg"], "notes": w.get("notes")} for w in weights],
        "current_weight": user.get("weight_kg"),
        "goal_weight": user.get("goal_weight_kg"),
        "initial_weight": weights[-1]["weight_kg"] if weights else user.get("weight_kg")
    }

# ==================== WATER ENDPOINTS ====================

@api_router.post("/water")
async def log_water(data: WaterLog, user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    existing = await db.water_logs.find_one({"user_id": user["id"], "date": today})
    
    if existing:
        new_glasses = existing["glasses"] + data.glasses
        await db.water_logs.update_one(
            {"_id": existing["_id"]}, 
            {"$set": {"glasses": new_glasses, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Water updated", "total_glasses": new_glasses}
    else:
        await db.water_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "glasses": data.glasses,
            "date": today,
            "created_at": datetime.utcnow()
        })
        return {"message": "Water logged", "total_glasses": data.glasses}

@api_router.get("/water/today")
async def get_today_water(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    log = await db.water_logs.find_one({"user_id": user["id"], "date": today})
    return {"glasses": log["glasses"] if log else 0, "goal": 8}

# ==================== SLEEP ENDPOINTS ====================

@api_router.post("/sleep")
async def log_sleep(data: SleepLog, user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    log_data = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "bedtime": data.bedtime,
        "wake_time": data.wake_time,
        "quality": data.quality,
        "notes": data.notes,
        "date": today,
        "created_at": datetime.utcnow()
    }
    
    existing = await db.sleep_logs.find_one({"user_id": user["id"], "date": today})
    if existing:
        await db.sleep_logs.update_one({"_id": existing["_id"]}, {"$set": log_data})
    else:
        await db.sleep_logs.insert_one(log_data)
    
    hours = calculate_sleep_hours(log_data)
    return {"message": "Sleep logged", "hours": hours}

@api_router.get("/sleep/history")
async def get_sleep_history(user: dict = Depends(get_current_user)):
    logs = await db.sleep_logs.find(
        {"user_id": user["id"]}
    ).sort("date", -1).limit(7).to_list(7)
    
    return {
        "logs": [{
            "date": l["date"],
            "bedtime": l["bedtime"],
            "wake_time": l["wake_time"],
            "hours": calculate_sleep_hours(l),
            "quality": l.get("quality")
        } for l in logs]
    }

# ==================== WORKOUT ENDPOINTS ====================

@api_router.post("/workout")
async def log_workout(data: WorkoutLog, user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    # Estimate calories if not provided
    calories = data.calories_burned
    if not calories:
        # Rough estimate: 5-10 cal per minute depending on workout type
        multiplier = {"cardio": 10, "fullbody": 8, "upperbody": 6, "lowerbody": 7, "abs": 5}.get(data.workout_type, 7)
        calories = data.duration_mins * multiplier
    
    log_data = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "workout_type": data.workout_type,
        "duration_mins": data.duration_mins,
        "calories_burned": calories,
        "exercises": data.exercises,
        "notes": data.notes,
        "date": today,
        "created_at": datetime.utcnow()
    }
    
    await db.workout_logs.insert_one(log_data)
    return {"message": "Workout logged", "calories_burned": calories}

@api_router.get("/workout/history")
async def get_workout_history(user: dict = Depends(get_current_user)):
    logs = await db.workout_logs.find(
        {"user_id": user["id"]}
    ).sort("date", -1).limit(14).to_list(14)
    
    return {
        "workouts": [{
            "date": w["date"],
            "type": w["workout_type"],
            "duration_mins": w["duration_mins"],
            "calories_burned": w.get("calories_burned", 0)
        } for w in logs]
    }

# ==================== STEPS ENDPOINTS ====================

@api_router.post("/steps")
async def log_steps(data: StepsLog, user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    # Estimate calories: ~0.04 cal per step
    calories = data.calories_burned or int(data.steps * 0.04)
    # Estimate distance: ~0.0008 km per step
    distance = data.distance_km or round(data.steps * 0.0008, 2)
    
    existing = await db.steps_logs.find_one({"user_id": user["id"], "date": today})
    
    log_data = {
        "user_id": user["id"],
        "steps": data.steps,
        "distance_km": distance,
        "calories_burned": calories,
        "date": today,
        "updated_at": datetime.utcnow()
    }
    
    if existing:
        await db.steps_logs.update_one({"_id": existing["_id"]}, {"$set": log_data})
    else:
        log_data["id"] = str(uuid.uuid4())
        log_data["created_at"] = datetime.utcnow()
        await db.steps_logs.insert_one(log_data)
    
    return {"message": "Steps logged", "steps": data.steps, "calories_burned": calories}

@api_router.get("/steps/today")
async def get_today_steps(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    log = await db.steps_logs.find_one({"user_id": user["id"], "date": today})
    return {
        "steps": log["steps"] if log else 0,
        "distance_km": log.get("distance_km", 0) if log else 0,
        "goal": 10000
    }

# ==================== MEALS ENDPOINTS ====================

@api_router.post("/meal")
async def log_meal(data: MealLog, user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    
    # Calculate total calories if not provided
    total_cal = data.total_calories
    if not total_cal:
        total_cal = sum(item.get("calories", 0) for item in data.food_items)
    
    log_data = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "meal_type": data.meal_type,
        "food_items": data.food_items,
        "total_calories": total_cal,
        "notes": data.notes,
        "date": today,
        "created_at": datetime.utcnow()
    }
    
    await db.meal_logs.insert_one(log_data)
    return {"message": "Meal logged", "calories": total_cal}

@api_router.get("/meals/today")
async def get_today_meals(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    meals = await db.meal_logs.find({"user_id": user["id"], "date": today}).to_list(10)
    
    total_calories = sum(m.get("total_calories", 0) for m in meals)
    
    return {
        "meals": [{
            "type": m["meal_type"],
            "food_items": m["food_items"],
            "calories": m.get("total_calories", 0)
        } for m in meals],
        "total_calories": total_calories,
        "goal": user.get("daily_calorie_goal", 2000)
    }

# ==================== SAMPLE DIET PLAN ====================

@api_router.get("/diet-plan/sample")
async def get_sample_diet_plan(user: dict = Depends(get_current_user)):
    """Get a sample diet plan based on user's BMI and calorie goal"""
    bmi = user.get("bmi", 25)
    calorie_goal = user.get("daily_calorie_goal", 2000)
    
    # Adjust based on BMI category
    if bmi < 18.5:
        plan_type = "weight_gain"
        calorie_goal = int(calorie_goal * 1.15)
    elif bmi >= 25:
        plan_type = "weight_loss"
        calorie_goal = int(calorie_goal * 0.85)
    else:
        plan_type = "maintain"
    
    # Sample meal plans
    breakfast_cal = int(calorie_goal * 0.25)
    lunch_cal = int(calorie_goal * 0.35)
    dinner_cal = int(calorie_goal * 0.30)
    snack_cal = int(calorie_goal * 0.10)
    
    return {
        "plan_type": plan_type,
        "daily_calories": calorie_goal,
        "meals": [
            {
                "type": "breakfast",
                "time": "08:00",
                "target_calories": breakfast_cal,
                "suggestions": [
                    {"name": "Oatmeal with Berries", "calories": 300, "protein": 10, "carbs": 45, "fat": 8},
                    {"name": "Greek Yogurt Parfait", "calories": 280, "protein": 15, "carbs": 35, "fat": 6},
                    {"name": "Egg White Omelette", "calories": 250, "protein": 20, "carbs": 5, "fat": 12}
                ]
            },
            {
                "type": "lunch",
                "time": "12:30",
                "target_calories": lunch_cal,
                "suggestions": [
                    {"name": "Grilled Chicken Salad", "calories": 450, "protein": 35, "carbs": 20, "fat": 18},
                    {"name": "Quinoa Buddha Bowl", "calories": 480, "protein": 18, "carbs": 55, "fat": 15},
                    {"name": "Turkey Wrap", "calories": 420, "protein": 28, "carbs": 40, "fat": 14}
                ]
            },
            {
                "type": "dinner",
                "time": "19:00",
                "target_calories": dinner_cal,
                "suggestions": [
                    {"name": "Grilled Salmon with Veggies", "calories": 400, "protein": 35, "carbs": 15, "fat": 20},
                    {"name": "Chicken Stir-Fry", "calories": 380, "protein": 30, "carbs": 30, "fat": 12},
                    {"name": "Lean Beef with Sweet Potato", "calories": 420, "protein": 32, "carbs": 35, "fat": 14}
                ]
            },
            {
                "type": "snack",
                "time": "16:00",
                "target_calories": snack_cal,
                "suggestions": [
                    {"name": "Apple with Almond Butter", "calories": 180, "protein": 4, "carbs": 20, "fat": 10},
                    {"name": "Protein Shake", "calories": 150, "protein": 25, "carbs": 5, "fat": 3},
                    {"name": "Mixed Nuts", "calories": 170, "protein": 5, "carbs": 8, "fat": 15}
                ]
            }
        ],
        "tips": [
            "Drink at least 8 glasses of water daily",
            "Eat slowly and mindfully",
            "Include protein in every meal",
            "Limit processed foods and added sugars"
        ]
    }

# ==================== PACKAGES ENDPOINTS ====================

@api_router.get("/packages")
async def get_packages():
    """Get available subscription packages"""
    return {
        "packages": [
            {
                "id": "basic_1month",
                "name": "Basic Plan",
                "duration_months": 1,
                "price": 29.99,
                "features": [
                    "Personalized diet plan",
                    "Weekly check-ins",
                    "Basic workout plans",
                    "Email support"
                ],
                "popular": False
            },
            {
                "id": "premium_3month",
                "name": "Premium Plan",
                "duration_months": 3,
                "price": 79.99,
                "features": [
                    "Customized diet plan",
                    "Daily coach access",
                    "Advanced workout plans",
                    "Progress tracking",
                    "Priority support"
                ],
                "popular": True
            },
            {
                "id": "elite_6month",
                "name": "Elite Plan",
                "duration_months": 6,
                "price": 149.99,
                "features": [
                    "Fully customized plans",
                    "1-on-1 video calls",
                    "Unlimited coach access",
                    "Meal prep guides",
                    "24/7 support",
                    "Money back guarantee"
                ],
                "popular": False
            }
        ]
    }

@api_router.post("/packages/subscribe/{package_id}")
async def subscribe_package(package_id: str, user: dict = Depends(get_current_user)):
    """Subscribe to a package (placeholder - no real payment)"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"package_id": package_id, "subscribed_at": datetime.utcnow()}}
    )
    return {"message": "Subscribed successfully (Demo)", "package_id": package_id}

# ==================== COACH CONNECT ====================

@api_router.post("/coach/connect")
async def connect_coach(data: CoachConnect, user: dict = Depends(get_current_user)):
    """Connect with a coach using their code"""
    # In a real app, validate the coach code
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"coach_code": data.coach_code, "connected_at": datetime.utcnow()}}
    )
    return {"message": "Connected to coach", "coach_code": data.coach_code}

@api_router.delete("/coach/disconnect")
async def disconnect_coach(user: dict = Depends(get_current_user)):
    """Disconnect from coach"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"coach_code": None}}
    )
    return {"message": "Disconnected from coach"}

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "DietTracker Pro API", "version": "2.0.0", "status": "healthy"}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
