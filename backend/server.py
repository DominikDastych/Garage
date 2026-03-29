# ============================================
# MY CAR GARAGE - BACKEND SERVER
# ============================================
# REST API pro správu vozidel a servisních záznamů
# Technologie: FastAPI + MongoDB + JWT autentizace

# === IMPORTY ===
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient  # MongoDB driver
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr  # Validace dat
from typing import List, Optional
import uuid  # Generování unikátních ID
from datetime import datetime, timezone, timedelta
import httpx  # HTTP klient pro externí API
import jwt    # JSON Web Token pro autentizaci
import bcrypt # Hashování hesel
import base64

# === KONFIGURACE ===
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')  # Načtení .env souboru

# Připojení k MongoDB databázi
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'car_garage_db')]

# JWT konfigurace pro přihlašování
JWT_SECRET = os.environ.get('JWT_SECRET', 'super-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # Token platí 7 dní

# Externí API pro data o autech
API_NINJAS_KEY = os.environ.get('API_NINJAS_KEY', '')
API_NINJAS_URL = "https://api.api-ninjas.com/v1/cars"

# === VYTVOŘENÍ APLIKACE ===
app = FastAPI(title="My Car Garage API", version="1.0.0")
api_router = APIRouter(prefix="/api")  # Všechny routy začínají /api
security = HTTPBearer(auto_error=False)

# Logování
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# === DATOVÉ MODELY (Pydantic) ===
# Definují strukturu dat pro validaci

class UserRegister(BaseModel):
    """Data pro registraci"""
    email: EmailStr  # Validovaný email
    password: str
    name: str

class UserLogin(BaseModel):
    """Data pro přihlášení"""
    email: EmailStr
    password: str

class User(BaseModel):
    """Uživatel (bez hesla)"""
    id: str
    email: str
    name: str
    created_at: str

class CarCreate(BaseModel):
    """Data pro vytvoření auta"""
    brand: str           # Značka
    model: str           # Model
    year: int            # Rok výroby
    power_kw: Optional[int] = None
    power_hp: Optional[int] = None
    fuel_type: Optional[str] = None      # Palivo
    transmission: Optional[str] = None   # Převodovka
    body_type: Optional[str] = None      # Karoserie
    image: Optional[str] = None
    color: Optional[str] = None
    license_plate: Optional[str] = None  # SPZ
    mileage: Optional[int] = None        # Nájezd km

class Car(BaseModel):
    """Kompletní data auta"""
    id: str
    user_id: str
    brand: str
    model: str
    year: int
    power_kw: Optional[int] = None
    power_hp: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    body_type: Optional[str] = None
    image: Optional[str] = None
    color: Optional[str] = None
    license_plate: Optional[str] = None
    mileage: Optional[int] = None
    created_at: str
    total_cost: float = 0  # Celkové náklady

class ServiceRecordCreate(BaseModel):
    """Data pro servisní záznam"""
    car_id: str
    service_type: str  # Typ: oil, stk, tires, brakes, other
    date: str
    cost: float
    mileage: Optional[int] = None
    note: Optional[str] = None

class ServiceRecord(BaseModel):
    """Kompletní servisní záznam"""
    id: str
    car_id: str
    user_id: str
    service_type: str
    date: str
    cost: float
    mileage: Optional[int] = None
    note: Optional[str] = None
    created_at: str

class Settings(BaseModel):
    """Nastavení uživatele"""
    theme: str = "dark"
    language: str = "cs"

# === POMOCNÉ FUNKCE PRO AUTENTIZACI ===

def hash_password(password: str) -> str:
    """Zahashuje heslo (jednosměrná funkce)"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Ověří heslo proti hashi"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    """Vytvoří JWT token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Dekóduje a ověří JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Získá přihlášeného uživatele z tokenu (Dependency)"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "My Car Garage API v1.0", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# -------------- AUTH --------------

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "settings": {"theme": "dark", "language": "cs"}
    }
    
    await db.users.insert_one(user)
    
    # Generate token
    token = create_token(user_id, user_data.email)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email.lower(),
            "name": user_data.name
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@api_router.put("/auth/settings")
async def update_settings(settings: Settings, current_user: dict = Depends(get_current_user)):
    """Update user settings"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"settings": settings.model_dump()}}
    )
    return {"message": "Settings updated", "settings": settings}

@api_router.get("/auth/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Get user settings"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return user.get("settings", {"theme": "dark", "language": "cs"})

# -------------- CARS API-NINJAS --------------

@api_router.get("/cars/search")
async def search_cars(make: str, model: Optional[str] = None, year: Optional[int] = None):
    """Search for car specifications using API-Ninjas"""
    try:
        params = {"make": make}
        if model:
            params["model"] = model
        if year:
            params["year"] = year
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                API_NINJAS_URL,
                headers={"X-Api-Key": API_NINJAS_KEY},
                params=params,
                timeout=10.0
            )
            
            if response.status_code == 200:
                cars = response.json()
                # Transform data
                result = []
                for car in cars[:10]:  # Limit to 10 results
                    hp = None
                    if car.get("cylinders") and car.get("displacement"):
                        # Rough HP estimate if not provided
                        hp = int(car.get("displacement", 0) * 0.1 * car.get("cylinders", 4))
                    
                    result.append({
                        "make": car.get("make", ""),
                        "model": car.get("model", ""),
                        "year": car.get("year", 0),
                        "fuel_type": car.get("fuel_type", ""),
                        "transmission": car.get("transmission", ""),
                        "drive": car.get("drive", ""),
                        "cylinders": car.get("cylinders"),
                        "displacement": car.get("displacement"),
                        "city_mpg": car.get("city_mpg"),
                        "highway_mpg": car.get("highway_mpg"),
                        "class": car.get("class", "")
                    })
                return result
            else:
                logger.error(f"API-Ninjas error: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"Error searching cars: {e}")
        return []

@api_router.get("/cars/makes")
async def get_car_makes():
    """Get list of all car makes"""
    return {
        "makes": [
            "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", 
            "Bugatti", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Citroën",
            "Dacia", "Daewoo", "Daihatsu", "Dodge", "Ferrari", "Fiat", "Ford", 
            "Genesis", "GMC", "Honda", "Hummer", "Hyundai", "Infiniti", "Isuzu",
            "Jaguar", "Jeep", "Kia", "Koenigsegg", "Lamborghini", "Lancia", 
            "Land Rover", "Lexus", "Lincoln", "Lotus", "Lucid", "Maserati", 
            "Maybach", "Mazda", "McLaren", "Mercedes-Benz", "Mercury", "Mini", 
            "Mitsubishi", "Nissan", "Opel", "Pagani", "Peugeot", "Plymouth",
            "Polestar", "Pontiac", "Porsche", "Ram", "Renault", "Rivian",
            "Rolls-Royce", "Saab", "Saturn", "Scion", "Seat", "Skoda", "Smart",
            "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"
        ]
    }

@api_router.get("/cars/models/{make}")
async def get_car_models(make: str):
    """Get models for a specific make using API-Ninjas with fallback"""
    
    # Predefined models for popular makes (fallback)
    fallback_models = {
        "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "TT", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "e-tron"],
        "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX", "M2", "M3", "M4", "M5", "M8"],
        "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "AMG GT", "EQC", "EQS"],
        "Volkswagen": ["Polo", "Golf", "Passat", "Arteon", "Tiguan", "Touareg", "T-Cross", "T-Roc", "ID.3", "ID.4", "ID.5", "Jetta", "Beetle"],
        "Skoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Citigo"],
        "Toyota": ["Yaris", "Corolla", "Camry", "RAV4", "C-HR", "Highlander", "Land Cruiser", "Supra", "GR86", "Prius", "bZ4X", "Aygo"],
        "Honda": ["Jazz", "Civic", "Accord", "CR-V", "HR-V", "e", "NSX", "City"],
        "Ford": ["Fiesta", "Focus", "Mondeo", "Mustang", "Puma", "Kuga", "Explorer", "Ranger", "F-150", "Bronco", "Mach-E"],
        "Hyundai": ["i10", "i20", "i30", "Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Ioniq", "Ioniq 5", "Ioniq 6"],
        "Kia": ["Picanto", "Rio", "Ceed", "Forte", "Optima", "Stinger", "Sportage", "Sorento", "EV6", "Niro"],
        "Mazda": ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-9", "MX-5", "MX-30"],
        "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "370Z", "GT-R"],
        "Peugeot": ["208", "308", "508", "2008", "3008", "5008", "e-208", "e-2008"],
        "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Koleos", "Zoe", "Twingo", "Arkana"],
        "Volvo": ["XC40", "XC60", "XC90", "S60", "S90", "V60", "V90", "C40"],
        "Porsche": ["911", "718 Cayman", "718 Boxster", "Panamera", "Cayenne", "Macan", "Taycan"],
        "Ferrari": ["Roma", "Portofino", "F8 Tributo", "SF90 Stradale", "812 Superfast", "296 GTB", "Purosangue"],
        "Lamborghini": ["Huracán", "Aventador", "Urus", "Revuelto"],
        "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Roadster"],
        "Jaguar": ["XE", "XF", "F-Type", "E-Pace", "F-Pace", "I-Pace"],
        "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque"],
        "Jeep": ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator"],
        "Subaru": ["Impreza", "Legacy", "Outback", "Forester", "XV", "BRZ", "WRX"],
        "Lexus": ["IS", "ES", "LS", "NX", "RX", "UX", "LC", "LX"],
        "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Cupra Formentor"],
        "Opel": ["Corsa", "Astra", "Insignia", "Crossland", "Grandland", "Mokka"],
        "Citroën": ["C1", "C3", "C4", "C5 X", "Berlingo", "C3 Aircross", "C5 Aircross"],
        "Fiat": ["500", "Panda", "Tipo", "500X", "500L"],
        "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "Giulietta"],
        "Maserati": ["Ghibli", "Quattroporte", "Levante", "MC20", "Grecale"],
    }
    
    # Try API-Ninjas first
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                API_NINJAS_URL,
                headers={"X-Api-Key": API_NINJAS_KEY},
                params={"make": make, "limit": 50},
                timeout=10.0
            )
            
            if response.status_code == 200:
                cars = response.json()
                if cars:
                    # Extract unique models
                    models = list(set(car.get("model", "") for car in cars if car.get("model")))
                    models.sort()
                    if models:
                        return {"models": models}
    except Exception as e:
        logger.error(f"Error fetching models from API: {e}")
    
    # Fallback to predefined models
    make_normalized = make.strip()
    if make_normalized in fallback_models:
        return {"models": fallback_models[make_normalized]}
    
    # Try case-insensitive match
    for key, models in fallback_models.items():
        if key.lower() == make_normalized.lower():
            return {"models": models}
    
    return {"models": []}

@api_router.get("/cars/specs")
async def get_car_specs(make: str, model: str, year: Optional[int] = None):
    """Get detailed specs for a specific car"""
    try:
        params = {"make": make, "model": model}
        if year:
            params["year"] = year
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                API_NINJAS_URL,
                headers={"X-Api-Key": API_NINJAS_KEY},
                params=params,
                timeout=10.0
            )
            
            if response.status_code == 200:
                cars = response.json()
                if cars:
                    car = cars[0]
                    return {
                        "make": car.get("make", make),
                        "model": car.get("model", model),
                        "year": car.get("year"),
                        "fuel_type": car.get("fuel_type", ""),
                        "transmission": "Automatická" if car.get("transmission") == "a" else "Manuální" if car.get("transmission") == "m" else "",
                        "drive": car.get("drive", ""),
                        "cylinders": car.get("cylinders"),
                        "displacement": car.get("displacement"),
                        "class": car.get("class", "")
                    }
    except Exception as e:
        logger.error(f"Error fetching specs: {e}")
    
    return None

@api_router.get("/cars/image")
async def get_car_image(make: str, model: str, body_type: Optional[str] = None):
    """Get car image URL based on make and model using curated images"""
    
    # Pre-defined high-quality images for popular car brands and models
    # Using Unsplash and Pexels images that actually show the correct cars
    car_images = {
        # Škoda - using elegant sedan images
        "skoda_superb": "https://images.unsplash.com/photo-1762028159329-4d1f3f8e84f6?w=800",
        "skoda_octavia": "https://images.unsplash.com/photo-1762028159058-5e0b9d52c836?w=800",
        "skoda_fabia": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        "skoda": "https://images.unsplash.com/photo-1762028159329-4d1f3f8e84f6?w=800",
        # BMW
        "bmw_m3": "https://images.pexels.com/photos/12359723/pexels-photo-12359723.jpeg?w=800",
        "bmw_m5": "https://images.pexels.com/photos/892522/pexels-photo-892522.jpeg?w=800",
        "bmw": "https://images.pexels.com/photos/892522/pexels-photo-892522.jpeg?w=800",
        # Mercedes
        "mercedes": "https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?w=800",
        # Audi
        "audi_a4": "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?w=800",
        "audi_a6": "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?w=800",
        "audi": "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?w=800",
        # Tesla
        "tesla_model_3": "https://images.pexels.com/photos/35736783/pexels-photo-35736783.jpeg?w=800",
        "tesla_model_s": "https://images.pexels.com/photos/10029878/pexels-photo-10029878.jpeg?w=800",
        "tesla_model_y": "https://images.pexels.com/photos/35736783/pexels-photo-35736783.jpeg?w=800",
        "tesla": "https://images.pexels.com/photos/35736783/pexels-photo-35736783.jpeg?w=800",
        # Porsche
        "porsche_911": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=800",
        "porsche_cayenne": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=800",
        "porsche": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=800",
        # Ferrari
        "ferrari": "https://images.pexels.com/photos/337909/pexels-photo-337909.jpeg?w=800",
        # Lamborghini
        "lamborghini": "https://images.pexels.com/photos/3156482/pexels-photo-3156482.jpeg?w=800",
        # Volkswagen
        "volkswagen_passat": "https://images.unsplash.com/photo-1762028159329-4d1f3f8e84f6?w=800",
        "volkswagen_golf": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        "volkswagen": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        # Toyota
        "toyota_camry": "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?w=800",
        "toyota_corolla": "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?w=800",
        "toyota": "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?w=800",
        # Honda
        "honda_civic": "https://images.pexels.com/photos/3874337/pexels-photo-3874337.jpeg?w=800",
        "honda_accord": "https://images.pexels.com/photos/3874337/pexels-photo-3874337.jpeg?w=800",
        "honda": "https://images.pexels.com/photos/3874337/pexels-photo-3874337.jpeg?w=800",
        # Ford
        "ford_mustang": "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?w=800",
        "ford": "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?w=800",
        # Hyundai
        "hyundai": "https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?w=800",
        # Kia
        "kia": "https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?w=800",
        # Mazda
        "mazda": "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?w=800",
        # Volvo
        "volvo": "https://images.pexels.com/photos/2920064/pexels-photo-2920064.jpeg?w=800",
        # Jeep
        "jeep": "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?w=800",
        # Land Rover / Range Rover
        "land_rover": "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?w=800",
        "range_rover": "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?w=800",
        # Jaguar
        "jaguar": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=800",
        # Renault
        "renault": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        # Peugeot
        "peugeot": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        # Opel
        "opel": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        # Fiat
        "fiat": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        # Seat
        "seat": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        # Subaru
        "subaru": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        # Nissan
        "nissan": "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?w=800",
        # Lexus
        "lexus": "https://images.pexels.com/photos/2920064/pexels-photo-2920064.jpeg?w=800",
        # Alfa Romeo
        "alfa_romeo": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=800",
        # Maserati
        "maserati": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=800",
        # Chevrolet
        "chevrolet": "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?w=800",
        # Dacia
        "dacia": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
    }
    
    # Default images by body type
    body_images = {
        "sedan": "https://images.unsplash.com/photo-1762028159329-4d1f3f8e84f6?w=800",
        "hatchback": "https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?w=800",
        "kombi": "https://images.pexels.com/photos/2920064/pexels-photo-2920064.jpeg?w=800",
        "suv": "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?w=800",
        "coupe": "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=800",
        "cabrio": "https://images.pexels.com/photos/337909/pexels-photo-337909.jpeg?w=800",
    }
    
    # Default image
    default_image = "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=800"
    
    make_lower = make.lower().strip().replace("-", "_").replace(" ", "_")
    model_lower = model.lower().strip().replace("-", "_").replace(" ", "_")
    
    # Try exact match first (brand + model)
    exact_key = f"{make_lower}_{model_lower}"
    if exact_key in car_images:
        return {"image_url": car_images[exact_key]}
    
    # Try brand only
    if make_lower in car_images:
        return {"image_url": car_images[make_lower]}
    
    # Try partial match on brand
    for key, url in car_images.items():
        if make_lower in key or key in make_lower:
            return {"image_url": url}
    
    # Try body type
    if body_type:
        body_lower = body_type.lower().strip()
        for body_key, url in body_images.items():
            if body_key in body_lower or body_lower in body_key:
                return {"image_url": url}
    
    return {"image_url": default_image}

# -------------- CARS CRUD --------------

@api_router.get("/cars", response_model=List[Car])
async def get_cars(current_user: dict = Depends(get_current_user)):
    """Get all cars for current user"""
    cars = await db.cars.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    # Calculate total costs for each car
    for car in cars:
        services = await db.service_records.find({"car_id": car["id"]}).to_list(1000)
        car["total_cost"] = sum(s.get("cost", 0) for s in services)
    
    return cars

@api_router.post("/cars", response_model=Car)
async def create_car(car_data: CarCreate, current_user: dict = Depends(get_current_user)):
    """Create a new car"""
    car_id = str(uuid.uuid4())
    
    car = {
        "id": car_id,
        "user_id": current_user["id"],
        **car_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "total_cost": 0
    }
    
    await db.cars.insert_one(car)
    return car

@api_router.get("/cars/{car_id}", response_model=Car)
async def get_car(car_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific car"""
    car = await db.cars.find_one(
        {"id": car_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    # Calculate total cost
    services = await db.service_records.find({"car_id": car_id}).to_list(1000)
    car["total_cost"] = sum(s.get("cost", 0) for s in services)
    
    return car

@api_router.put("/cars/{car_id}", response_model=Car)
async def update_car(car_id: str, car_data: CarCreate, current_user: dict = Depends(get_current_user)):
    """Update a car"""
    existing = await db.cars.find_one({"id": car_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Car not found")
    
    update_data = car_data.model_dump()
    await db.cars.update_one(
        {"id": car_id},
        {"$set": update_data}
    )
    
    updated = await db.cars.find_one({"id": car_id}, {"_id": 0})
    return updated

@api_router.delete("/cars/{car_id}")
async def delete_car(car_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a car and its service records"""
    existing = await db.cars.find_one({"id": car_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Car not found")
    
    # Delete car and its service records
    await db.cars.delete_one({"id": car_id})
    await db.service_records.delete_many({"car_id": car_id})
    
    return {"message": "Car deleted successfully"}

# -------------- SERVICE RECORDS --------------

@api_router.get("/cars/{car_id}/services", response_model=List[ServiceRecord])
async def get_service_records(car_id: str, current_user: dict = Depends(get_current_user)):
    """Get all service records for a car"""
    # Verify car ownership
    car = await db.cars.find_one({"id": car_id, "user_id": current_user["id"]})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    records = await db.service_records.find(
        {"car_id": car_id},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    return records

@api_router.post("/cars/{car_id}/services", response_model=ServiceRecord)
async def create_service_record(
    car_id: str,
    record_data: ServiceRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new service record"""
    # Verify car ownership
    car = await db.cars.find_one({"id": car_id, "user_id": current_user["id"]})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    record_id = str(uuid.uuid4())
    
    record = {
        "id": record_id,
        "car_id": car_id,
        "user_id": current_user["id"],
        "service_type": record_data.service_type,
        "date": record_data.date,
        "cost": record_data.cost,
        "mileage": record_data.mileage,
        "note": record_data.note,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_records.insert_one(record)
    
    # Update car mileage if provided
    if record_data.mileage:
        await db.cars.update_one(
            {"id": car_id},
            {"$set": {"mileage": record_data.mileage}}
        )
    
    return record

@api_router.put("/services/{record_id}", response_model=ServiceRecord)
async def update_service_record(
    record_id: str,
    record_data: ServiceRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a service record"""
    existing = await db.service_records.find_one({
        "id": record_id,
        "user_id": current_user["id"]
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Service record not found")
    
    update_data = {
        "service_type": record_data.service_type,
        "date": record_data.date,
        "cost": record_data.cost,
        "mileage": record_data.mileage,
        "note": record_data.note
    }
    
    await db.service_records.update_one(
        {"id": record_id},
        {"$set": update_data}
    )
    
    updated = await db.service_records.find_one({"id": record_id}, {"_id": 0})
    return updated

@api_router.delete("/services/{record_id}")
async def delete_service_record(record_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a service record"""
    existing = await db.service_records.find_one({
        "id": record_id,
        "user_id": current_user["id"]
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Service record not found")
    
    await db.service_records.delete_one({"id": record_id})
    return {"message": "Service record deleted"}

# -------------- STATISTICS --------------

@api_router.get("/stats")
async def get_statistics(current_user: dict = Depends(get_current_user)):
    """Get user statistics"""
    cars = await db.cars.find({"user_id": current_user["id"]}).to_list(100)
    services = await db.service_records.find({"user_id": current_user["id"]}).to_list(1000)
    
    total_cost = sum(s.get("cost", 0) for s in services)
    
    # Costs by category
    costs_by_type = {}
    for s in services:
        stype = s.get("service_type", "other")
        costs_by_type[stype] = costs_by_type.get(stype, 0) + s.get("cost", 0)
    
    # Costs by month (last 12 months)
    costs_by_month = {}
    for s in services:
        date_str = s.get("date", "")
        if date_str:
            month = date_str[:7]  # YYYY-MM
            costs_by_month[month] = costs_by_month.get(month, 0) + s.get("cost", 0)
    
    return {
        "total_cars": len(cars),
        "total_services": len(services),
        "total_cost": total_cost,
        "costs_by_type": costs_by_type,
        "costs_by_month": dict(sorted(costs_by_month.items())[-12:])
    }

@api_router.get("/cars/{car_id}/stats")
async def get_car_statistics(car_id: str, current_user: dict = Depends(get_current_user)):
    """Get statistics for a specific car"""
    car = await db.cars.find_one({"id": car_id, "user_id": current_user["id"]})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    services = await db.service_records.find({"car_id": car_id}).to_list(1000)
    
    total_cost = sum(s.get("cost", 0) for s in services)
    
    # Costs by category
    costs_by_type = {}
    for s in services:
        stype = s.get("service_type", "other")
        costs_by_type[stype] = costs_by_type.get(stype, 0) + s.get("cost", 0)
    
    # Last service date
    last_service = None
    if services:
        sorted_services = sorted(services, key=lambda x: x.get("date", ""), reverse=True)
        last_service = sorted_services[0].get("date")
    
    return {
        "total_services": len(services),
        "total_cost": total_cost,
        "costs_by_type": costs_by_type,
        "last_service": last_service
    }

# Include the router in the main app
app.include_router(api_router)

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
