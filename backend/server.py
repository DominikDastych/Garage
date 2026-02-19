from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'sporttix_db')]

# Create the main app
app = FastAPI(title="SportTix API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class Section(BaseModel):
    id: str
    name: str
    price: float
    available: int

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    sport: str
    title: str
    teams: str
    venue: str
    city: str
    date: str
    priceFrom: float
    priceTo: float
    image: str
    featured: bool = False
    description: str
    sections: List[Section]
    league: Optional[str] = None
    country: Optional[str] = None

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: str
    event_title: str
    event_date: str
    event_venue: str
    event_image: str
    section_id: str
    section_name: str
    price: float
    quantity: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemCreate(BaseModel):
    user_id: str
    event_id: str
    event_title: str
    event_date: str
    event_venue: str
    event_image: str
    section_id: str
    section_name: str
    price: float
    quantity: int

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[dict]
    total: float
    status: str = "confirmed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    user_id: str
    items: List[dict]
    total: float

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FavoriteCreate(BaseModel):
    user_id: str
    event_id: str

# ============== THESPORTSDB API ==============

SPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"

# Sport images mapping
SPORT_IMAGES = {
    "soccer": [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
        "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800",
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
    ],
    "basketball": [
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
        "https://images.unsplash.com/photo-1504450758481-7338bbe7f31?w=800",
        "https://images.unsplash.com/photo-1559692048-79a3f837883d?w=800",
    ],
    "ice_hockey": [
        "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800",
        "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800",
    ],
    "tennis": [
        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
        "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800",
    ],
    "golf": [
        "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800",
        "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800",
    ],
}

def get_sport_image(sport: str, index: int = 0) -> str:
    sport_key = sport.lower().replace(" ", "_")
    images = SPORT_IMAGES.get(sport_key, SPORT_IMAGES["soccer"])
    return images[index % len(images)]

def generate_sections(sport: str, base_price: float) -> List[dict]:
    """Generate ticket sections based on sport type"""
    if sport.lower() in ["soccer", "football"]:
        return [
            {"id": "vip", "name": "VIP Box", "price": round(base_price * 3, 2), "available": 25},
            {"id": "lower", "name": "Lower Tier", "price": round(base_price * 2, 2), "available": 100},
            {"id": "middle", "name": "Middle Tier", "price": round(base_price * 1.5, 2), "available": 200},
            {"id": "upper", "name": "Upper Tier", "price": round(base_price, 2), "available": 350},
        ]
    elif sport.lower() in ["basketball"]:
        return [
            {"id": "courtside", "name": "Courtside", "price": round(base_price * 4, 2), "available": 20},
            {"id": "lower", "name": "Lower Bowl", "price": round(base_price * 2, 2), "available": 80},
            {"id": "club", "name": "Club Level", "price": round(base_price * 1.5, 2), "available": 120},
            {"id": "upper", "name": "Upper Bowl", "price": round(base_price, 2), "available": 200},
        ]
    elif sport.lower() in ["ice hockey", "hockey"]:
        return [
            {"id": "glass", "name": "Glass Seats", "price": round(base_price * 3, 2), "available": 40},
            {"id": "lower", "name": "Lower Bowl", "price": round(base_price * 2, 2), "available": 90},
            {"id": "upper", "name": "Upper Bowl", "price": round(base_price, 2), "available": 160},
        ]
    elif sport.lower() in ["tennis"]:
        return [
            {"id": "court", "name": "Court Level", "price": round(base_price * 4, 2), "available": 30},
            {"id": "box", "name": "Box Seats", "price": round(base_price * 2.5, 2), "available": 60},
            {"id": "grandstand", "name": "Grandstand", "price": round(base_price, 2), "available": 180},
        ]
    elif sport.lower() in ["golf"]:
        return [
            {"id": "clubhouse", "name": "Clubhouse Pass", "price": round(base_price * 3, 2), "available": 50},
            {"id": "grounds", "name": "Grounds Pass", "price": round(base_price, 2), "available": 500},
        ]
    else:
        return [
            {"id": "premium", "name": "Premium", "price": round(base_price * 2, 2), "available": 50},
            {"id": "standard", "name": "Standard", "price": round(base_price, 2), "available": 200},
        ]

async def fetch_events_from_sportsdb(sport: str, league_id: str) -> List[dict]:
    """Fetch upcoming events from TheSportsDB"""
    events = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get next 15 events for the league
            response = await client.get(f"{SPORTSDB_BASE_URL}/eventsnextleague.php?id={league_id}")
            if response.status_code == 200:
                data = response.json()
                if data and data.get("events"):
                    for idx, event in enumerate(data["events"][:10]):
                        # Verify the event matches the sport we requested
                        event_sport = event.get("strSport", "").lower()
                        if sport == "soccer" and event_sport != "soccer":
                            continue
                        if sport == "basketball" and event_sport != "basketball":
                            continue
                        if sport == "ice_hockey" and event_sport not in ["ice hockey", "hockey"]:
                            continue
                        if sport == "tennis" and event_sport != "tennis":
                            continue
                        if sport == "golf" and event_sport != "golf":
                            continue
                            
                        base_price = 50 + (idx * 10)  # Vary prices
                        sections = generate_sections(sport, base_price)
                        
                        events.append({
                            "id": event.get("idEvent", str(uuid.uuid4())),
                            "sport": sport,
                            "title": event.get("strEvent", "Unknown Event"),
                            "teams": f"{event.get('strHomeTeam', 'Home')} vs {event.get('strAwayTeam', 'Away')}",
                            "venue": event.get("strVenue", "TBA"),
                            "city": event.get("strCity", "") or event.get("strCountry", ""),
                            "date": event.get("strTimestamp") or event.get("dateEvent", ""),
                            "priceFrom": min(s["price"] for s in sections),
                            "priceTo": max(s["price"] for s in sections),
                            "image": event.get("strThumb") or event.get("strPoster") or get_sport_image(sport, idx),
                            "featured": idx < 3,
                            "description": event.get("strDescriptionEN") or f"Exciting {sport} match between {event.get('strHomeTeam', 'Home')} and {event.get('strAwayTeam', 'Away')}",
                            "sections": sections,
                            "league": event.get("strLeague", ""),
                            "country": event.get("strCountry", ""),
                        })
    except Exception as e:
        logger.error(f"Error fetching {sport} events: {e}")
    
    # If no events from API, generate realistic fallback events
    if not events:
        events = generate_fallback_events_for_sport(sport)
    
    return events

def generate_fallback_events_for_sport(sport: str) -> List[dict]:
    """Generate realistic fallback events when API doesn't return data"""
    from datetime import timedelta
    
    fallback_data = {
        "basketball": [
            {"home": "LA Lakers", "away": "Golden State Warriors", "venue": "Crypto.com Arena", "city": "Los Angeles", "league": "NBA"},
            {"home": "Boston Celtics", "away": "Miami Heat", "venue": "TD Garden", "city": "Boston", "league": "NBA"},
            {"home": "Chicago Bulls", "away": "New York Knicks", "venue": "United Center", "city": "Chicago", "league": "NBA"},
            {"home": "Brooklyn Nets", "away": "Philadelphia 76ers", "venue": "Barclays Center", "city": "New York", "league": "NBA"},
            {"home": "Phoenix Suns", "away": "Denver Nuggets", "venue": "Footprint Center", "city": "Phoenix", "league": "NBA"},
        ],
        "ice_hockey": [
            {"home": "Toronto Maple Leafs", "away": "Montreal Canadiens", "venue": "Scotiabank Arena", "city": "Toronto", "league": "NHL"},
            {"home": "New York Rangers", "away": "Boston Bruins", "venue": "Madison Square Garden", "city": "New York", "league": "NHL"},
            {"home": "Chicago Blackhawks", "away": "Detroit Red Wings", "venue": "United Center", "city": "Chicago", "league": "NHL"},
            {"home": "Edmonton Oilers", "away": "Calgary Flames", "venue": "Rogers Place", "city": "Edmonton", "league": "NHL"},
            {"home": "Pittsburgh Penguins", "away": "Washington Capitals", "venue": "PPG Paints Arena", "city": "Pittsburgh", "league": "NHL"},
        ],
        "tennis": [
            {"home": "Men's Singles", "away": "Quarterfinals", "venue": "Rod Laver Arena", "city": "Melbourne", "league": "Australian Open"},
            {"home": "Women's Singles", "away": "Semifinals", "venue": "Arthur Ashe Stadium", "city": "New York", "league": "US Open"},
            {"home": "Men's Doubles", "away": "Finals", "venue": "Centre Court", "city": "London", "league": "Wimbledon"},
            {"home": "Mixed Doubles", "away": "Round of 16", "venue": "Philippe-Chatrier", "city": "Paris", "league": "French Open"},
            {"home": "ATP Finals", "away": "Group Stage", "venue": "Pala Alpitour", "city": "Turin", "league": "ATP Tour"},
        ],
        "golf": [
            {"home": "The Masters", "away": "Round 3", "venue": "Augusta National", "city": "Augusta", "league": "PGA Tour"},
            {"home": "US Open", "away": "Final Round", "venue": "Pinehurst No. 2", "city": "Pinehurst", "league": "PGA Tour"},
            {"home": "The Open Championship", "away": "Round 2", "venue": "Royal Troon", "city": "Scotland", "league": "PGA Tour"},
            {"home": "PGA Championship", "away": "Round 1", "venue": "Valhalla Golf Club", "city": "Louisville", "league": "PGA Tour"},
            {"home": "The Players", "away": "Final Round", "venue": "TPC Sawgrass", "city": "Florida", "league": "PGA Tour"},
        ],
        "soccer": [
            {"home": "Manchester United", "away": "Liverpool", "venue": "Old Trafford", "city": "Manchester", "league": "Premier League"},
            {"home": "Real Madrid", "away": "Barcelona", "venue": "Santiago Bernabéu", "city": "Madrid", "league": "La Liga"},
            {"home": "Bayern Munich", "away": "Borussia Dortmund", "venue": "Allianz Arena", "city": "Munich", "league": "Bundesliga"},
        ],
    }
    
    events = []
    sport_events = fallback_data.get(sport, fallback_data.get("soccer", []))
    base_date = datetime.now(timezone.utc)
    
    for idx, match in enumerate(sport_events):
        # Spread events over the next few weeks
        event_date = base_date + timedelta(days=idx * 3 + 1, hours=idx * 2)
        base_price = 50 + (idx * 15)
        sections = generate_sections(sport, base_price)
        
        if sport == "tennis":
            title = f"{match['home']} - {match['away']}"
            teams = f"{match['home']} {match['away']}"
        elif sport == "golf":
            title = f"{match['home']} - {match['away']}"
            teams = match['home']
        else:
            title = f"{match['home']} vs {match['away']}"
            teams = f"{match['home']} vs {match['away']}"
        
        events.append({
            "id": f"{sport}-fallback-{idx+1}",
            "sport": sport,
            "title": title,
            "teams": teams,
            "venue": match["venue"],
            "city": match["city"],
            "date": event_date.isoformat(),
            "priceFrom": min(s["price"] for s in sections),
            "priceTo": max(s["price"] for s in sections),
            "image": get_sport_image(sport, idx),
            "featured": idx < 2,
            "description": f"Don't miss this exciting {sport} event at {match['venue']}!",
            "sections": sections,
            "league": match["league"],
            "country": match["city"],
        })
    
    return events

# League IDs for TheSportsDB
LEAGUES = {
    "soccer": [
        ("4328", "English Premier League"),
        ("4335", "La Liga"),
        ("4331", "Bundesliga"),
        ("4332", "Serie A"),
        ("4334", "Ligue 1"),
    ],
    "basketball": [
        ("4387", "NBA"),
    ],
    "ice_hockey": [
        ("4380", "NHL"),
    ],
    "tennis": [
        ("4464", "ATP Tour"),
    ],
    "golf": [
        ("4494", "PGA Tour"),
    ],
}

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "SportTix API v1.0", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# -------------- EVENTS --------------

@api_router.get("/events", response_model=List[Event])
async def get_events(sport: Optional[str] = None, featured: Optional[bool] = None):
    """Get all upcoming sports events from real data"""
    all_events = []
    
    # Fetch events for each sport
    sports_to_fetch = [sport] if sport else list(LEAGUES.keys())
    
    tasks = []
    for sport_name in sports_to_fetch:
        if sport_name in LEAGUES:
            for league_id, league_name in LEAGUES[sport_name]:
                tasks.append(fetch_events_from_sportsdb(sport_name, league_id))
    
    # Run all fetches concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for result in results:
        if isinstance(result, list):
            all_events.extend(result)
    
    # Deduplicate events by ID
    seen_ids = set()
    unique_events = []
    for event in all_events:
        if event["id"] not in seen_ids:
            seen_ids.add(event["id"])
            unique_events.append(event)
    all_events = unique_events
    
    # Filter by featured if specified
    if featured is not None:
        all_events = [e for e in all_events if e.get("featured") == featured]
    
    # Sort by date
    all_events.sort(key=lambda x: x.get("date", ""))
    
    # If no events from API, return cached/mock events from DB (filtered by sport)
    if not all_events:
        query = {}
        if sport:
            query["sport"] = sport
        cached = await db.cached_events.find(query, {"_id": 0}).to_list(100)
        if cached:
            return cached
        # Return default events if nothing available
        return await get_fallback_events()
    
    # Cache events in DB (only if fetching all sports)
    if all_events and not sport:
        await db.cached_events.delete_many({})
        await db.cached_events.insert_many(all_events)
    
    return all_events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    """Get a specific event by ID"""
    # First try cached events
    event = await db.cached_events.find_one({"id": event_id}, {"_id": 0})
    if event:
        return event
    
    # Try to fetch fresh data
    all_events = await get_events()
    for event in all_events:
        if event.get("id") == event_id or str(event.get("id")) == event_id:
            return event
    
    raise HTTPException(status_code=404, detail="Event not found")

async def get_fallback_events() -> List[dict]:
    """Return fallback events when API is unavailable"""
    return [
        {
            "id": "fallback-001",
            "sport": "soccer",
            "title": "Premier League Match",
            "teams": "Team A vs Team B",
            "venue": "Stadium",
            "city": "London",
            "date": datetime.now(timezone.utc).isoformat(),
            "priceFrom": 50,
            "priceTo": 200,
            "image": get_sport_image("soccer", 0),
            "featured": True,
            "description": "Exciting football match",
            "sections": generate_sections("soccer", 50),
            "league": "Premier League",
            "country": "England",
        }
    ]

# -------------- CART --------------

@api_router.get("/cart/{user_id}", response_model=List[CartItem])
async def get_cart(user_id: str):
    """Get user's cart items"""
    items = await db.cart.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/cart", response_model=CartItem)
async def add_to_cart(item: CartItemCreate):
    """Add item to cart"""
    cart_item = CartItem(**item.model_dump())
    doc = cart_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.cart.insert_one(doc)
    return cart_item

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int):
    """Update cart item quantity"""
    result = await db.cart.update_one(
        {"id": item_id},
        {"$set": {"quantity": quantity}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Cart updated"}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str):
    """Remove item from cart"""
    result = await db.cart.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/user/{user_id}")
async def clear_cart(user_id: str):
    """Clear user's cart"""
    await db.cart.delete_many({"user_id": user_id})
    return {"message": "Cart cleared"}

# -------------- ORDERS --------------

@api_router.get("/orders/{user_id}", response_model=List[Order])
async def get_orders(user_id: str):
    """Get user's orders"""
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    # Sort by created_at descending
    orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    """Create a new order"""
    order_obj = Order(**order.model_dump())
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.orders.insert_one(doc)
    
    # Clear user's cart after order
    await db.cart.delete_many({"user_id": order.user_id})
    
    return order_obj

@api_router.get("/orders/detail/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get specific order by ID"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# -------------- FAVORITES --------------

@api_router.get("/favorites/{user_id}")
async def get_favorites(user_id: str):
    """Get user's favorite events"""
    favorites = await db.favorites.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return favorites

@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(favorite: FavoriteCreate):
    """Add event to favorites"""
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": favorite.user_id,
        "event_id": favorite.event_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Event already in favorites")
    
    fav_obj = Favorite(**favorite.model_dump())
    doc = fav_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.favorites.insert_one(doc)
    return fav_obj

@api_router.delete("/favorites/{user_id}/{event_id}")
async def remove_favorite(user_id: str, event_id: str):
    """Remove event from favorites"""
    result = await db.favorites.delete_one({
        "user_id": user_id,
        "event_id": event_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites"}

@api_router.get("/favorites/{user_id}/check/{event_id}")
async def check_favorite(user_id: str, event_id: str):
    """Check if event is in favorites"""
    existing = await db.favorites.find_one({
        "user_id": user_id,
        "event_id": event_id
    })
    return {"isFavorite": existing is not None}

# -------------- SPORTS INFO --------------

@api_router.get("/sports")
async def get_sports():
    """Get available sports"""
    return {
        "sports": [
            {"id": "soccer", "name": "Football", "icon": "⚽"},
            {"id": "basketball", "name": "Basketball", "icon": "🏀"},
            {"id": "ice_hockey", "name": "Hockey", "icon": "🏒"},
            {"id": "tennis", "name": "Tennis", "icon": "🎾"},
            {"id": "golf", "name": "Golf", "icon": "⛳"},
        ]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
