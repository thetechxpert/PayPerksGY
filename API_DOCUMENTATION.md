# PayPerks GY API Documentation

## Overview
PayPerks GY is a rewards platform API for Guyana that supports three user roles: User (Consumer), Merchant (Business Partner), and Admin.

## Base URL
- **Development:** `http://localhost:8001/api`
- **Production:** Your deployed server URL + `/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Database Configuration

### MongoDB Atlas Connection
To connect your external apps to the same database, use this connection string format:
```
mongodb+srv://dmthetechxpert_db_user:AS35qNpi9KLRWvRP@cluster0.3hznwkg.mongodb.net/payperks_gy?retryWrites=true&w=majority
```

### Database: `payperks_gy`

### Collections:
- `users` - All user accounts (consumers)
- `merchants` - Merchant business profiles
- `admins` - Admin accounts
- `offers` - Merchant offers/deals
- `redemptions` - User redemption records
- `points_ledger` - Points transaction history

---

## API Endpoints

### Authentication

#### POST /api/auth/register/user
Register a new consumer user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+592 672 7825",
  "location": "Georgetown"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "points_balance": 0
  }
}
```

#### POST /api/auth/register/merchant
Register a new merchant account.

**Request Body:**
```json
{
  "email": "merchant@example.com",
  "password": "password123",
  "name": "Owner Name",
  "business_name": "My Business",
  "category": "Food & Dining",
  "location": "Georgetown"
}
```

#### POST /api/auth/register/admin
Register a new admin account.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin Name"
}
```

#### POST /api/auth/login
Login for all user types.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user|merchant|admin"
  }
}
```

#### GET /api/auth/me
Get current authenticated user info.

**Headers:** `Authorization: Bearer <token>`

**Response:** User object with role-specific fields

---

### User Endpoints

#### GET /api/offers
Get all active offers (public).

**Query Parameters:**
- `category` (optional): Filter by category
- `location` (optional): Filter by location
- `search` (optional): Search in title/description

**Response:**
```json
[
  {
    "id": "uuid",
    "merchant_id": "uuid",
    "merchant_name": "Business Name",
    "title": "10% Off Your Meal",
    "description": "Get 10% off when you pay with debit card",
    "reward_type": "percent|fixed|points|free_item",
    "reward_value": "10",
    "start_date": "2026-02-01",
    "end_date": "2026-12-31",
    "redemption_rules": "Valid for purchases over $20",
    "active": true,
    "location": "Georgetown"
  }
]
```

#### GET /api/offers/{offer_id}
Get single offer details.

#### POST /api/redemptions
Create a new redemption.

**Headers:** `Authorization: Bearer <token>` (User role required)

**Request Body:**
```json
{
  "offer_id": "uuid",
  "method": "qr|receipt",
  "proof_base64": "data:image/jpeg;base64,..." // Required for receipt method
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "offer_id": "uuid",
  "merchant_id": "uuid",
  "method": "qr",
  "status": "approved|pending",
  "points_awarded": 50,
  "created_at": "2026-02-28T12:00:00Z"
}
```

#### GET /api/users/redemptions
Get user's redemption history.

**Headers:** `Authorization: Bearer <token>`

#### GET /api/users/points-history
Get user's points ledger.

**Headers:** `Authorization: Bearer <token>`

---

### Merchant Endpoints

#### GET /api/merchants/profile
Get merchant's own profile.

**Headers:** `Authorization: Bearer <token>` (Merchant role required)

#### PUT /api/merchants/profile
Update merchant profile.

**Request Body:**
```json
{
  "business_name": "Updated Business Name",
  "category": "Food & Dining",
  "location": "Georgetown",
  "contact_info": "contact@business.com",
  "logo": "data:image/png;base64,..."
}
```

#### GET /api/merchants/offers
Get merchant's own offers.

#### POST /api/merchants/offers
Create a new offer.

**Request Body:**
```json
{
  "title": "Weekend Special",
  "description": "20% off all items",
  "reward_type": "percent",
  "reward_value": "20",
  "start_date": "2026-03-01",
  "end_date": "2026-03-31",
  "redemption_rules": "Valid on weekends only"
}
```

#### PUT /api/merchants/offers/{offer_id}
Update an existing offer.

#### DELETE /api/merchants/offers/{offer_id}
Delete an offer.

#### PUT /api/merchants/offers/{offer_id}/toggle
Toggle offer active status.

#### GET /api/merchants/redemptions
Get redemptions for merchant's offers.

**Query Parameters:**
- `status` (optional): Filter by `pending|approved|rejected`

#### PUT /api/merchants/redemptions/{redemption_id}/approve
Approve or reject a redemption.

**Request Body:**
```json
{
  "status": "approved|rejected",
  "rejection_reason": "Optional reason if rejected"
}
```

#### GET /api/merchants/analytics
Get merchant analytics.

**Response:**
```json
{
  "total_offers": 5,
  "active_offers": 3,
  "total_redemptions": 100,
  "pending_redemptions": 5,
  "approved_redemptions": 90,
  "rejected_redemptions": 5
}
```

---

### Admin Endpoints

#### GET /api/admin/metrics
Get platform-wide metrics.

**Headers:** `Authorization: Bearer <token>` (Admin role required)

**Response:**
```json
{
  "total_users": 100,
  "total_merchants": 20,
  "approved_merchants": 15,
  "active_offers": 30,
  "total_redemptions_30d": 500,
  "pending_redemptions": 10,
  "total_points_issued": 50000
}
```

#### GET /api/admin/users
Get all users.

**Query Parameters:**
- `status` (optional): Filter by `active|suspended`

#### PUT /api/admin/users/{user_id}/suspend
Toggle user suspension status.

#### DELETE /api/admin/users/{user_id}
Permanently delete a user account.

#### GET /api/admin/merchants
Get all merchants.

**Query Parameters:**
- `status` (optional): Filter by `pending|approved|rejected|suspended`

#### PUT /api/admin/merchants/{merchant_id}/approve
Approve a merchant.

**Request Body:**
```json
{
  "approved": true
}
```

#### PUT /api/admin/merchants/{merchant_id}/reject
Reject a merchant.

**Request Body:**
```json
{
  "reason": "Incomplete business information"
}
```

#### PUT /api/admin/merchants/{merchant_id}/suspend
Toggle merchant suspension status.

#### DELETE /api/admin/merchants/{merchant_id}
Permanently delete a merchant account.

#### GET /api/admin/offers
Get all offers.

**Query Parameters:**
- `active` (optional): Filter by active status

#### PUT /api/admin/offers/{offer_id}/toggle
Toggle offer active status.

#### GET /api/admin/redemptions
Get all redemptions.

**Query Parameters:**
- `status` (optional): Filter by `pending|approved|rejected`

#### PUT /api/admin/redemptions/{redemption_id}/approve
Approve or reject a redemption.

**Request Body:**
```json
{
  "status": "approved|rejected",
  "rejection_reason": "Optional reason if rejected"
}
```

#### POST /api/admin/users/{user_id}/adjust-points
Manually adjust user points.

**Query Parameters:**
- `delta_points`: Points to add (positive) or subtract (negative)
- `reason`: Reason for adjustment

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "phone": "string",
  "location": "string",
  "role": "user",
  "points_balance": 0,
  "status": "active|suspended",
  "created_at": "datetime"
}
```

### Merchant
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "business_name": "string",
  "category": "string",
  "location": "string",
  "logo": "base64 string",
  "contact_info": "string",
  "approved": true|false,
  "rejected_reason": "string|null",
  "status": "active|suspended",
  "created_at": "datetime"
}
```

### Offer
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "title": "string",
  "description": "string",
  "reward_type": "percent|fixed|points|free_item",
  "reward_value": "string",
  "start_date": "date",
  "end_date": "date",
  "redemption_rules": "string",
  "active": true|false,
  "created_at": "datetime"
}
```

### Redemption
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "offer_id": "uuid",
  "merchant_id": "uuid",
  "method": "qr|receipt",
  "proof_url": "base64 string|null",
  "status": "pending|approved|rejected",
  "rejection_reason": "string|null",
  "points_awarded": 0,
  "redeemed_at": "datetime|null",
  "created_at": "datetime"
}
```

### PointsLedger
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "delta_points": 50,
  "reason": "QR Redemption: Offer Title",
  "ref_type": "redemption|admin_adjustment",
  "ref_id": "uuid",
  "created_at": "datetime"
}
```

---

## Categories
Available business categories:
- Food & Dining
- Retail & Shopping
- Health & Wellness
- Entertainment
- Services
- Grocery
- Automotive
- Travel & Tourism
- Other

## Locations
Available locations in Guyana:
- Georgetown
- Linden
- New Amsterdam
- Anna Regina
- Bartica
- Lethem
- Other

---

## Error Responses

All errors return JSON with a `detail` field:
```json
{
  "detail": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

---

## CORS Configuration

The API allows requests from all origins (`*`). For production, you may want to restrict this to specific domains in `server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://admin.payperksgy.com",
        "https://merchant.payperksgy.com",
        "https://app.payperksgy.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password |
| Merchant | merchant@test.com | password |
| User | user@test.com | password |
