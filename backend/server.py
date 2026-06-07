from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
import certifi
mongo_url = os.environ['MONGO_URL']
# Use certifi for MongoDB Atlas connections (when MONGO_URL contains mongodb+srv)
if 'mongodb+srv' in mongo_url:
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
else:
    client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'payperks_gy')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'payperks-gy-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="PayPerks GY API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    preferred_card_type: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    role: str = "user"
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    preferred_card_type: Optional[str] = None
    points_balance: int = 0
    created_at: datetime
    status: str = "active"

class MerchantBase(BaseModel):
    business_name: str
    category: str
    location: str
    contact_info: Optional[str] = None

class MerchantCreate(MerchantBase):
    email: EmailStr
    password: str

class MerchantResponse(BaseModel):
    id: str
    role: str = "merchant"
    business_name: str
    category: str
    location: str
    logo_base64: Optional[str] = None
    contact_info: Optional[str] = None
    email: str
    approved: bool = False
    rejected_reason: Optional[str] = None
    created_at: datetime
    status: str = "active"

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class OfferBase(BaseModel):
    title: str
    description: str
    reward_type: Literal["percent", "fixed", "free_item", "points"]
    reward_value: str
    start_date: datetime
    end_date: datetime
    redemption_rules: Optional[str] = None

class OfferCreate(OfferBase):
    pass

class OfferUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reward_type: Optional[Literal["percent", "fixed", "free_item", "points"]] = None
    reward_value: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    redemption_rules: Optional[str] = None
    active: Optional[bool] = None

class OfferResponse(BaseModel):
    id: str
    merchant_id: str
    merchant_name: Optional[str] = None
    merchant_logo: Optional[str] = None
    title: str
    description: str
    reward_type: str
    reward_value: str
    start_date: datetime
    end_date: datetime
    redemption_rules: Optional[str] = None
    active: bool = True
    created_at: datetime
    category: Optional[str] = None
    location: Optional[str] = None

class RedemptionCreate(BaseModel):
    offer_id: str
    method: Literal["qr", "receipt", "merchant_confirm"]
    proof_base64: Optional[str] = None

class RedemptionResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    offer_id: str
    offer_title: Optional[str] = None
    merchant_id: str
    merchant_name: Optional[str] = None
    method: str
    proof_base64: Optional[str] = None
    status: str = "pending"
    rejection_reason: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    created_at: datetime
    points_awarded: int = 0

class PointsLedgerEntry(BaseModel):
    id: str
    user_id: str
    delta_points: int
    reason: str
    ref_type: str
    ref_id: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class MerchantApproval(BaseModel):
    approved: bool
    rejected_reason: Optional[str] = None

class RedemptionApproval(BaseModel):
    status: Literal["approved", "rejected"]
    rejection_reason: Optional[str] = None

class PlatformMetrics(BaseModel):
    total_users: int
    total_merchants: int
    approved_merchants: int
    active_offers: int
    total_redemptions_30_days: int
    pending_redemptions: int
    total_points_issued: int

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        email = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "role": role, "email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*roles):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register/user", response_model=TokenResponse)
async def register_user(user: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "role": "user",
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "location": user.location,
        "preferred_card_type": user.preferred_card_type,
        "password_hash": hash_password(user.password),
        "points_balance": 0,
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, "user", user.email)
    return TokenResponse(
        access_token=token,
        user={"id": user_id, "role": "user", "name": user.name, "email": user.email, "points_balance": 0}
    )

@api_router.post("/auth/register/merchant", response_model=TokenResponse)
async def register_merchant(merchant: MerchantCreate):
    existing = await db.merchants.find_one({"email": merchant.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    merchant_id = str(uuid.uuid4())
    merchant_doc = {
        "id": merchant_id,
        "role": "merchant",
        "business_name": merchant.business_name,
        "category": merchant.category,
        "location": merchant.location,
        "logo_base64": None,
        "contact_info": merchant.contact_info,
        "email": merchant.email,
        "password_hash": hash_password(merchant.password),
        "approved": False,
        "rejected_reason": None,
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    await db.merchants.insert_one(merchant_doc)
    
    token = create_token(merchant_id, "merchant", merchant.email)
    return TokenResponse(
        access_token=token,
        user={"id": merchant_id, "role": "merchant", "business_name": merchant.business_name, "email": merchant.email, "approved": False}
    )

@api_router.post("/auth/register/admin", response_model=TokenResponse)
async def register_admin(admin: AdminCreate):
    existing = await db.admins.find_one({"email": admin.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "role": "admin",
        "name": admin.name,
        "email": admin.email,
        "password_hash": hash_password(admin.password),
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    await db.admins.insert_one(admin_doc)
    
    token = create_token(admin_id, "admin", admin.email)
    return TokenResponse(
        access_token=token,
        user={"id": admin_id, "role": "admin", "name": admin.name, "email": admin.email}
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Check users collection
    user = await db.users.find_one({"email": credentials.email})
    if user and verify_password(credentials.password, user["password_hash"]):
        if user.get("status") == "suspended":
            raise HTTPException(status_code=403, detail="Account suspended")
        token = create_token(user["id"], "user", user["email"])
        return TokenResponse(
            access_token=token,
            user={"id": user["id"], "role": "user", "name": user["name"], "email": user["email"], "points_balance": user.get("points_balance", 0)}
        )
    
    # Check merchants collection
    merchant = await db.merchants.find_one({"email": credentials.email})
    if merchant and verify_password(credentials.password, merchant["password_hash"]):
        if merchant.get("status") == "suspended":
            raise HTTPException(status_code=403, detail="Account suspended")
        token = create_token(merchant["id"], "merchant", merchant["email"])
        return TokenResponse(
            access_token=token,
            user={"id": merchant["id"], "role": "merchant", "business_name": merchant["business_name"], "email": merchant["email"], "approved": merchant.get("approved", False)}
        )
    
    # Check admins collection
    admin = await db.admins.find_one({"email": credentials.email})
    if admin and verify_password(credentials.password, admin["password_hash"]):
        token = create_token(admin["id"], "admin", admin["email"])
        return TokenResponse(
            access_token=token,
            user={"id": admin["id"], "role": "admin", "name": admin["name"], "email": admin["email"]}
        )
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "user":
        user = await db.users.find_one({"id": current_user["id"]})
        if user:
            return UserResponse(**{k: v for k, v in user.items() if k != "password_hash" and k != "_id"})
    elif current_user["role"] == "merchant":
        merchant = await db.merchants.find_one({"id": current_user["id"]})
        if merchant:
            return MerchantResponse(**{k: v for k, v in merchant.items() if k != "password_hash" and k != "_id"})
    elif current_user["role"] == "admin":
        admin = await db.admins.find_one({"id": current_user["id"]})
        if admin:
            return {"id": admin["id"], "role": "admin", "name": admin["name"], "email": admin["email"]}
    raise HTTPException(status_code=404, detail="User not found")

# ==================== USER ENDPOINTS ====================

@api_router.put("/users/profile")
async def update_user_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    location: Optional[str] = None,
    preferred_card_type: Optional[str] = None,
    current_user: dict = Depends(require_role("user"))
):
    update_data = {}
    if name: update_data["name"] = name
    if phone: update_data["phone"] = phone
    if location: update_data["location"] = location
    if preferred_card_type: update_data["preferred_card_type"] = preferred_card_type
    
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    user = await db.users.find_one({"id": current_user["id"]})
    return UserResponse(**{k: v for k, v in user.items() if k != "password_hash" and k != "_id"})

@api_router.get("/users/points-history", response_model=List[PointsLedgerEntry])
async def get_points_history(current_user: dict = Depends(require_role("user"))):
    entries = await db.points_ledger.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    return [PointsLedgerEntry(**{k: v for k, v in e.items() if k != "_id"}) for e in entries]

@api_router.get("/users/redemptions", response_model=List[RedemptionResponse])
async def get_user_redemptions(current_user: dict = Depends(require_role("user"))):
    redemptions = await db.redemptions.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    result = []
    for r in redemptions:
        # Get offer and merchant details
        offer = await db.offers.find_one({"id": r["offer_id"]})
        merchant = await db.merchants.find_one({"id": r["merchant_id"]})
        r["offer_title"] = offer["title"] if offer else None
        r["merchant_name"] = merchant["business_name"] if merchant else None
        result.append(RedemptionResponse(**{k: v for k, v in r.items() if k != "_id"}))
    return result

# ==================== MERCHANT ENDPOINTS ====================

@api_router.put("/merchants/profile")
async def update_merchant_profile(
    business_name: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    contact_info: Optional[str] = None,
    logo_base64: Optional[str] = None,
    current_user: dict = Depends(require_role("merchant"))
):
    update_data = {}
    if business_name: update_data["business_name"] = business_name
    if category: update_data["category"] = category
    if location: update_data["location"] = location
    if contact_info: update_data["contact_info"] = contact_info
    if logo_base64: update_data["logo_base64"] = logo_base64
    
    if update_data:
        await db.merchants.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    merchant = await db.merchants.find_one({"id": current_user["id"]})
    return MerchantResponse(**{k: v for k, v in merchant.items() if k != "password_hash" and k != "_id"})

@api_router.post("/merchants/offers", response_model=OfferResponse)
async def create_offer(offer: OfferCreate, current_user: dict = Depends(require_role("merchant"))):
    # Check if merchant is approved
    merchant = await db.merchants.find_one({"id": current_user["id"]})
    if not merchant or not merchant.get("approved"):
        raise HTTPException(status_code=403, detail="Merchant not approved yet")
    
    offer_id = str(uuid.uuid4())
    offer_doc = {
        "id": offer_id,
        "merchant_id": current_user["id"],
        "title": offer.title,
        "description": offer.description,
        "reward_type": offer.reward_type,
        "reward_value": offer.reward_value,
        "start_date": offer.start_date,
        "end_date": offer.end_date,
        "redemption_rules": offer.redemption_rules,
        "active": True,
        "created_at": datetime.utcnow(),
        "category": merchant["category"],
        "location": merchant["location"]
    }
    await db.offers.insert_one(offer_doc)
    
    offer_doc["merchant_name"] = merchant["business_name"]
    offer_doc["merchant_logo"] = merchant.get("logo_base64")
    return OfferResponse(**{k: v for k, v in offer_doc.items() if k != "_id"})

@api_router.get("/merchants/offers", response_model=List[OfferResponse])
async def get_merchant_offers(current_user: dict = Depends(require_role("merchant"))):
    offers = await db.offers.find({"merchant_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    merchant = await db.merchants.find_one({"id": current_user["id"]})
    result = []
    for o in offers:
        o["merchant_name"] = merchant["business_name"]
        o["merchant_logo"] = merchant.get("logo_base64")
        result.append(OfferResponse(**{k: v for k, v in o.items() if k != "_id"}))
    return result

@api_router.put("/merchants/offers/{offer_id}", response_model=OfferResponse)
async def update_offer(offer_id: str, offer: OfferUpdate, current_user: dict = Depends(require_role("merchant"))):
    existing = await db.offers.find_one({"id": offer_id, "merchant_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    update_data = {k: v for k, v in offer.dict().items() if v is not None}
    if update_data:
        await db.offers.update_one({"id": offer_id}, {"$set": update_data})
    
    updated = await db.offers.find_one({"id": offer_id})
    merchant = await db.merchants.find_one({"id": current_user["id"]})
    updated["merchant_name"] = merchant["business_name"]
    updated["merchant_logo"] = merchant.get("logo_base64")
    return OfferResponse(**{k: v for k, v in updated.items() if k != "_id"})

@api_router.get("/merchants/redemptions", response_model=List[RedemptionResponse])
async def get_merchant_redemptions(current_user: dict = Depends(require_role("merchant"))):
    redemptions = await db.redemptions.find({"merchant_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    result = []
    for r in redemptions:
        user = await db.users.find_one({"id": r["user_id"]})
        offer = await db.offers.find_one({"id": r["offer_id"]})
        r["user_name"] = user["name"] if user else None
        r["offer_title"] = offer["title"] if offer else None
        result.append(RedemptionResponse(**{k: v for k, v in r.items() if k != "_id"}))
    return result

@api_router.put("/merchants/redemptions/{redemption_id}/approve")
async def merchant_approve_redemption(redemption_id: str, approval: RedemptionApproval, current_user: dict = Depends(require_role("merchant"))):
    redemption = await db.redemptions.find_one({"id": redemption_id, "merchant_id": current_user["id"]})
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    if redemption["status"] != "pending":
        raise HTTPException(status_code=400, detail="Redemption already processed")
    
    update_data = {"status": approval.status}
    if approval.status == "rejected":
        update_data["rejection_reason"] = approval.rejection_reason
    else:
        update_data["redeemed_at"] = datetime.utcnow()
        # Award points based on reward_type
        offer = await db.offers.find_one({"id": redemption["offer_id"]})
        if offer and offer["reward_type"] == "points":
            try:
                points = int(offer["reward_value"])
            except:
                points = 1  # Fallback
        else:
            points = 1  # Default engagement points for non-points rewards
        
        update_data["points_awarded"] = points
        await db.users.update_one({"id": redemption["user_id"]}, {"$inc": {"points_balance": points}})
        
        # Record in ledger
        ledger_entry = {
            "id": str(uuid.uuid4()),
            "user_id": redemption["user_id"],
            "delta_points": points,
            "reason": f"Redemption approved: {offer['title'] if offer else 'Unknown offer'}",
            "ref_type": "redemption",
            "ref_id": redemption_id,
            "created_at": datetime.utcnow()
        }
        await db.points_ledger.insert_one(ledger_entry)
    
    await db.redemptions.update_one({"id": redemption_id}, {"$set": update_data})
    return {"message": f"Redemption {approval.status}"}

@api_router.get("/merchants/analytics")
async def get_merchant_analytics(current_user: dict = Depends(require_role("merchant"))):
    # Get all offers for this merchant
    offers = await db.offers.find({"merchant_id": current_user["id"]}).to_list(100)
    offer_ids = [o["id"] for o in offers]
    
    # Get redemption stats
    total_redemptions = await db.redemptions.count_documents({"merchant_id": current_user["id"]})
    approved_redemptions = await db.redemptions.count_documents({"merchant_id": current_user["id"], "status": "approved"})
    pending_redemptions = await db.redemptions.count_documents({"merchant_id": current_user["id"], "status": "pending"})
    
    # Redemptions per offer
    redemptions_per_offer = []
    for offer in offers:
        count = await db.redemptions.count_documents({"offer_id": offer["id"]})
        redemptions_per_offer.append({"offer_id": offer["id"], "title": offer["title"], "redemptions": count})
    
    return {
        "total_offers": len(offers),
        "active_offers": len([o for o in offers if o.get("active", True)]),
        "total_redemptions": total_redemptions,
        "approved_redemptions": approved_redemptions,
        "pending_redemptions": pending_redemptions,
        "redemptions_per_offer": redemptions_per_offer
    }

# ==================== PUBLIC OFFERS ENDPOINTS ====================

@api_router.get("/offers", response_model=List[OfferResponse])
async def get_offers(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"active": True, "end_date": {"$gte": datetime.utcnow()}}
    
    # Only show offers from approved merchants
    approved_merchants = await db.merchants.find({"approved": True}).to_list(1000)
    approved_ids = [m["id"] for m in approved_merchants]
    query["merchant_id"] = {"$in": approved_ids}
    
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    offers = await db.offers.find(query).sort("created_at", -1).to_list(100)
    
    # Add merchant info
    result = []
    merchants_cache = {m["id"]: m for m in approved_merchants}
    for o in offers:
        merchant = merchants_cache.get(o["merchant_id"])
        if merchant:
            o["merchant_name"] = merchant["business_name"]
            o["merchant_logo"] = merchant.get("logo_base64")
        result.append(OfferResponse(**{k: v for k, v in o.items() if k != "_id"}))
    return result

@api_router.get("/offers/{offer_id}", response_model=OfferResponse)
async def get_offer(offer_id: str, current_user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    merchant = await db.merchants.find_one({"id": offer["merchant_id"]})
    if merchant:
        offer["merchant_name"] = merchant["business_name"]
        offer["merchant_logo"] = merchant.get("logo_base64")
    
    return OfferResponse(**{k: v for k, v in offer.items() if k != "_id"})

@api_router.get("/offers/{offer_id}/qr-data")
async def get_offer_qr_data(offer_id: str, current_user: dict = Depends(require_role("user"))):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Generate QR data with user and offer info
    qr_data = {
        "type": "payperks_redemption",
        "offer_id": offer_id,
        "user_id": current_user["id"],
        "timestamp": datetime.utcnow().isoformat()
    }
    return qr_data

# ==================== REDEMPTION ENDPOINTS ====================

@api_router.post("/redemptions", response_model=RedemptionResponse)
async def create_redemption(redemption: RedemptionCreate, current_user: dict = Depends(require_role("user"))):
    # Check offer exists and is valid
    offer = await db.offers.find_one({"id": redemption.offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if not offer.get("active", True):
        raise HTTPException(status_code=400, detail="Offer is not active")
    if offer["end_date"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Offer has expired")
    
    # Check for duplicate redemption (once per day)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.redemptions.find_one({
        "user_id": current_user["id"],
        "offer_id": redemption.offer_id,
        "created_at": {"$gte": today_start}
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already redeemed this offer today")
    
    redemption_id = str(uuid.uuid4())
    status = "approved" if redemption.method == "qr" else "pending"
    points_awarded = 0
    
    redemption_doc = {
        "id": redemption_id,
        "user_id": current_user["id"],
        "offer_id": redemption.offer_id,
        "merchant_id": offer["merchant_id"],
        "method": redemption.method,
        "proof_base64": redemption.proof_base64,
        "status": status,
        "rejection_reason": None,
        "redeemed_at": datetime.utcnow() if status == "approved" else None,
        "created_at": datetime.utcnow(),
        "points_awarded": 0
    }
    
    # If QR redemption, instantly approve and award points
    if redemption.method == "qr":
        # Award points based on reward_type
        if offer["reward_type"] == "points":
            try:
                points = int(offer["reward_value"])
            except:
                points = 1  # Fallback
        else:
            points = 1  # Default engagement points for non-points rewards
        
        redemption_doc["points_awarded"] = points
        await db.users.update_one({"id": current_user["id"]}, {"$inc": {"points_balance": points}})
        
        # Record in ledger
        ledger_entry = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "delta_points": points,
            "reason": f"QR Redemption: {offer['title']}",
            "ref_type": "redemption",
            "ref_id": redemption_id,
            "created_at": datetime.utcnow()
        }
        await db.points_ledger.insert_one(ledger_entry)
    
    await db.redemptions.insert_one(redemption_doc)
    
    # Add extra info for response
    merchant = await db.merchants.find_one({"id": offer["merchant_id"]})
    redemption_doc["offer_title"] = offer["title"]
    redemption_doc["merchant_name"] = merchant["business_name"] if merchant else None
    
    return RedemptionResponse(**{k: v for k, v in redemption_doc.items() if k != "_id"})

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/metrics", response_model=PlatformMetrics)
async def get_platform_metrics(current_user: dict = Depends(require_role("admin"))):
    total_users = await db.users.count_documents({})
    total_merchants = await db.merchants.count_documents({})
    approved_merchants = await db.merchants.count_documents({"approved": True})
    active_offers = await db.offers.count_documents({"active": True, "end_date": {"$gte": datetime.utcnow()}})
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    total_redemptions_30_days = await db.redemptions.count_documents({"created_at": {"$gte": thirty_days_ago}})
    pending_redemptions = await db.redemptions.count_documents({"status": "pending"})
    
    # Calculate total points issued
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$delta_points"}}}]
    result = await db.points_ledger.aggregate(pipeline).to_list(1)
    total_points_issued = result[0]["total"] if result else 0
    
    return PlatformMetrics(
        total_users=total_users,
        total_merchants=total_merchants,
        approved_merchants=approved_merchants,
        active_offers=active_offers,
        total_redemptions_30_days=total_redemptions_30_days,
        pending_redemptions=pending_redemptions,
        total_points_issued=total_points_issued
    )

@api_router.get("/admin/merchants", response_model=List[MerchantResponse])
async def get_all_merchants(
    approved: Optional[bool] = None,
    current_user: dict = Depends(require_role("admin"))
):
    query = {}
    if approved is not None:
        query["approved"] = approved
    merchants = await db.merchants.find(query).sort("created_at", -1).to_list(100)
    return [MerchantResponse(**{k: v for k, v in m.items() if k != "password_hash" and k != "_id"}) for m in merchants]

@api_router.put("/admin/merchants/{merchant_id}/approve")
async def approve_merchant(merchant_id: str, approval: MerchantApproval, current_user: dict = Depends(require_role("admin"))):
    merchant = await db.merchants.find_one({"id": merchant_id})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    update_data = {"approved": approval.approved}
    if not approval.approved:
        update_data["rejected_reason"] = approval.rejected_reason
    else:
        update_data["rejected_reason"] = None
    
    await db.merchants.update_one({"id": merchant_id}, {"$set": update_data})
    return {"message": f"Merchant {'approved' if approval.approved else 'rejected'}"}

@api_router.put("/admin/merchants/{merchant_id}/suspend")
async def suspend_merchant(merchant_id: str, current_user: dict = Depends(require_role("admin"))):
    merchant = await db.merchants.find_one({"id": merchant_id})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    new_status = "suspended" if merchant.get("status") != "suspended" else "active"
    await db.merchants.update_one({"id": merchant_id}, {"$set": {"status": new_status}})
    return {"message": f"Merchant status set to {new_status}"}

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: dict = Depends(require_role("admin"))):
    users = await db.users.find().sort("created_at", -1).to_list(100)
    return [UserResponse(**{k: v for k, v in u.items() if k != "password_hash" and k != "_id"}) for u in users]

@api_router.put("/admin/users/{user_id}/suspend")
async def suspend_user(user_id: str, current_user: dict = Depends(require_role("admin"))):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = "suspended" if user.get("status") != "suspended" else "active"
    await db.users.update_one({"id": user_id}, {"$set": {"status": new_status}})
    return {"message": f"User status set to {new_status}"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_role("admin"))):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user and all related data
    await db.users.delete_one({"id": user_id})
    await db.redemptions.delete_many({"user_id": user_id})
    await db.points_ledger.delete_many({"user_id": user_id})
    
    return {"message": "User account deleted"}

@api_router.delete("/admin/merchants/{merchant_id}")
async def delete_merchant(merchant_id: str, current_user: dict = Depends(require_role("admin"))):
    merchant = await db.merchants.find_one({"id": merchant_id})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    # Delete merchant, their offers, and the associated user account
    await db.merchants.delete_one({"id": merchant_id})
    await db.offers.delete_many({"merchant_id": merchant_id})
    
    # Also delete the user account linked to this merchant
    if merchant.get("user_id"):
        await db.users.delete_one({"id": merchant["user_id"]})
    
    return {"message": "Merchant account deleted"}

@api_router.get("/admin/offers", response_model=List[OfferResponse])
async def get_all_offers(current_user: dict = Depends(require_role("admin"))):
    offers = await db.offers.find().sort("created_at", -1).to_list(100)
    result = []
    for o in offers:
        merchant = await db.merchants.find_one({"id": o["merchant_id"]})
        if merchant:
            o["merchant_name"] = merchant["business_name"]
            o["merchant_logo"] = merchant.get("logo_base64")
        result.append(OfferResponse(**{k: v for k, v in o.items() if k != "_id"}))
    return result

@api_router.put("/admin/offers/{offer_id}/toggle")
async def toggle_offer(offer_id: str, current_user: dict = Depends(require_role("admin"))):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    new_status = not offer.get("active", True)
    await db.offers.update_one({"id": offer_id}, {"$set": {"active": new_status}})
    return {"message": f"Offer {'activated' if new_status else 'deactivated'}"}

@api_router.get("/admin/redemptions", response_model=List[RedemptionResponse])
async def get_all_redemptions(
    status: Optional[str] = None,
    current_user: dict = Depends(require_role("admin"))
):
    query = {}
    if status:
        query["status"] = status
    redemptions = await db.redemptions.find(query).sort("created_at", -1).to_list(100)
    result = []
    for r in redemptions:
        user = await db.users.find_one({"id": r["user_id"]})
        offer = await db.offers.find_one({"id": r["offer_id"]})
        merchant = await db.merchants.find_one({"id": r["merchant_id"]})
        r["user_name"] = user["name"] if user else None
        r["offer_title"] = offer["title"] if offer else None
        r["merchant_name"] = merchant["business_name"] if merchant else None
        result.append(RedemptionResponse(**{k: v for k, v in r.items() if k != "_id"}))
    return result

@api_router.put("/admin/redemptions/{redemption_id}/approve")
async def admin_approve_redemption(redemption_id: str, approval: RedemptionApproval, current_user: dict = Depends(require_role("admin"))):
    redemption = await db.redemptions.find_one({"id": redemption_id})
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    if redemption["status"] != "pending":
        raise HTTPException(status_code=400, detail="Redemption already processed")
    
    update_data = {"status": approval.status}
    if approval.status == "rejected":
        update_data["rejection_reason"] = approval.rejection_reason
    else:
        update_data["redeemed_at"] = datetime.utcnow()
        # Award points based on reward_type
        offer = await db.offers.find_one({"id": redemption["offer_id"]})
        if offer and offer["reward_type"] == "points":
            try:
                points = int(offer["reward_value"])
            except:
                points = 1  # Fallback
        else:
            points = 1  # Default engagement points for non-points rewards
        
        update_data["points_awarded"] = points
        await db.users.update_one({"id": redemption["user_id"]}, {"$inc": {"points_balance": points}})
        
        # Record in ledger
        ledger_entry = {
            "id": str(uuid.uuid4()),
            "user_id": redemption["user_id"],
            "delta_points": points,
            "reason": f"Redemption approved by admin: {offer['title'] if offer else 'Unknown offer'}",
            "ref_type": "redemption",
            "ref_id": redemption_id,
            "created_at": datetime.utcnow()
        }
        await db.points_ledger.insert_one(ledger_entry)
    
    await db.redemptions.update_one({"id": redemption_id}, {"$set": update_data})
    return {"message": f"Redemption {approval.status}"}

@api_router.post("/admin/users/{user_id}/adjust-points")
async def adjust_user_points(user_id: str, delta_points: int, reason: str, current_user: dict = Depends(require_role("admin"))):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$inc": {"points_balance": delta_points}})
    
    # Record in ledger
    ledger_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "delta_points": delta_points,
        "reason": f"Admin adjustment: {reason}",
        "ref_type": "admin_adjustment",
        "ref_id": None,
        "created_at": datetime.utcnow()
    }
    await db.points_ledger.insert_one(ledger_entry)
    
    return {"message": f"Points adjusted by {delta_points}"}

# ==================== CATEGORIES ENDPOINT ====================

@api_router.get("/categories")
async def get_categories():
    return {
        "categories": [
            "Restaurants & Dining",
            "Retail & Shopping",
            "Groceries",
            "Entertainment",
            "Travel & Hospitality",
            "Health & Wellness",
            "Services",
            "Fuel & Gas",
            "Electronics",
            "Fashion & Apparel",
            "Other"
        ]
    }

@api_router.get("/locations")
async def get_locations():
    return {
        "locations": [
            "Georgetown",
            "Linden",
            "New Amsterdam",
            "Anna Regina",
            "Bartica",
            "Skeldon",
            "Rose Hall",
            "Corriverton",
            "Mahaica",
            "Parika",
            "Vreed en Hoop",
            "Other"
        ]
    }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Seed endpoint for test data
@api_router.post("/seed")
async def seed_database():
    """Seed the database with test accounts (idempotent)"""
    try:
        # Check if test accounts already exist
        existing_user = await db.users.find_one({"email": "user@test.com"})
        existing_merchant = await db.merchants.find_one({"email": "merchant@test.com"})
        existing_admin = await db.admins.find_one({"email": "admin@test.com"})
        
        created = []
        
        # Create test user if not exists
        if not existing_user:
            user_id = str(uuid.uuid4())
            user_doc = {
                "id": user_id,
                "role": "user",
                "name": "Test User",
                "email": "user@test.com",
                "phone": "+592-555-0001",
                "location": "Georgetown",
                "preferred_card_type": "Visa Debit",
                "password_hash": hash_password("password"),
                "points_balance": 0,
                "created_at": datetime.utcnow(),
                "status": "active"
            }
            await db.users.insert_one(user_doc)
            created.append("user@test.com")
        
        # Create test merchant if not exists
        if not existing_merchant:
            merchant_id = str(uuid.uuid4())
            merchant_doc = {
                "id": merchant_id,
                "role": "merchant",
                "business_name": "Test Merchant",
                "category": "Restaurants & Dining",
                "location": "Georgetown",
                "logo_base64": None,
                "contact_info": "+592-555-0002",
                "email": "merchant@test.com",
                "password_hash": hash_password("password"),
                "approved": True,  # Pre-approve for testing
                "rejected_reason": None,
                "created_at": datetime.utcnow(),
                "status": "active"
            }
            await db.merchants.insert_one(merchant_doc)
            created.append("merchant@test.com")
        
        # Create test admin if not exists
        if not existing_admin:
            admin_id = str(uuid.uuid4())
            admin_doc = {
                "id": admin_id,
                "role": "admin",
                "name": "Test Admin",
                "email": "admin@test.com",
                "password_hash": hash_password("password"),
                "created_at": datetime.utcnow(),
                "status": "active"
            }
            await db.admins.insert_one(admin_doc)
            created.append("admin@test.com")
        
        if created:
            return {"message": "Database seeded successfully", "created": created}
        else:
            return {"message": "Test accounts already exist", "created": []}
    
    except Exception as e:
        logger.error(f"Seed error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")

# Include the router
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
