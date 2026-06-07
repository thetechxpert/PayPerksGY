#!/usr/bin/env python3
"""
PayPerks GY Backend API Testing Suite
Tests all backend APIs for the PayPerks GY mobile app
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Optional

# Configuration
BASE_URL = "https://payperks-portal-hub.preview.emergentagent.com/api"
TIMEOUT = 30

# Test accounts (as mentioned in review request)
TEST_ACCOUNTS = {
    "user": {"email": "user@test.com", "password": "password"},
    "merchant": {"email": "merchant@test.com", "password": "password"},
    "admin": {"email": "admin@test.com", "password": "password"}
}

class PayPerksAPITester:
    def __init__(self):
        self.tokens = {}
        self.test_data = {}
        self.results = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: dict = None, 
                    token: str = None, params: dict = None) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=TIMEOUT)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=TIMEOUT)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=TIMEOUT)
            else:
                return False, f"Unsupported method: {method}"
            
            return True, response
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"
    
    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.make_request("GET", "/health")
        if not success:
            self.log_result("Health Check", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                self.log_result("Health Check", True, "API is healthy")
                return True
            else:
                self.log_result("Health Check", False, "Unexpected response format", str(data))
                return False
        else:
            self.log_result("Health Check", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_utility_endpoints(self):
        """Test categories and locations endpoints"""
        # Test categories
        success, response = self.make_request("GET", "/categories")
        if success and response.status_code == 200:
            data = response.json()
            if "categories" in data and isinstance(data["categories"], list):
                self.log_result("Get Categories", True, f"Retrieved {len(data['categories'])} categories")
            else:
                self.log_result("Get Categories", False, "Invalid response format", str(data))
        else:
            self.log_result("Get Categories", False, "Request failed", 
                          response.text if success else response)
        
        # Test locations
        success, response = self.make_request("GET", "/locations")
        if success and response.status_code == 200:
            data = response.json()
            if "locations" in data and isinstance(data["locations"], list):
                self.log_result("Get Locations", True, f"Retrieved {len(data['locations'])} locations")
            else:
                self.log_result("Get Locations", False, "Invalid response format", str(data))
        else:
            self.log_result("Get Locations", False, "Request failed", 
                          response.text if success else response)
    
    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@example.com",
            "password": "securepass123",
            "phone": "+592-555-0123",
            "location": "Georgetown",
            "preferred_card_type": "Visa Debit"
        }
        
        success, response = self.make_request("POST", "/auth/register/user", user_data)
        if not success:
            self.log_result("User Registration", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.test_data["new_user"] = data
                self.log_result("User Registration", True, "User registered successfully")
                return True
            else:
                self.log_result("User Registration", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("User Registration", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_merchant_registration(self):
        """Test merchant registration"""
        merchant_data = {
            "business_name": "Golden Spoon Restaurant",
            "category": "Restaurants & Dining",
            "location": "Georgetown",
            "contact_info": "+592-555-0456",
            "email": "goldspoon@example.com",
            "password": "merchantpass123"
        }
        
        success, response = self.make_request("POST", "/auth/register/merchant", merchant_data)
        if not success:
            self.log_result("Merchant Registration", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.test_data["new_merchant"] = data
                self.log_result("Merchant Registration", True, "Merchant registered successfully")
                return True
            else:
                self.log_result("Merchant Registration", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Merchant Registration", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_registration(self):
        """Test admin registration"""
        admin_data = {
            "name": "System Administrator",
            "email": "sysadmin@payperks.gy",
            "password": "adminpass123"
        }
        
        success, response = self.make_request("POST", "/auth/register/admin", admin_data)
        if not success:
            self.log_result("Admin Registration", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.test_data["new_admin"] = data
                self.log_result("Admin Registration", True, "Admin registered successfully")
                return True
            else:
                self.log_result("Admin Registration", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Admin Registration", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_login(self, role: str):
        """Test login for specific role"""
        if role not in TEST_ACCOUNTS:
            self.log_result(f"{role.title()} Login", False, f"Unknown role: {role}")
            return False
        
        login_data = TEST_ACCOUNTS[role]
        success, response = self.make_request("POST", "/auth/login", login_data)
        
        if not success:
            self.log_result(f"{role.title()} Login", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.tokens[role] = data["access_token"]
                self.test_data[f"{role}_profile"] = data["user"]
                self.log_result(f"{role.title()} Login", True, "Login successful")
                return True
            else:
                self.log_result(f"{role.title()} Login", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result(f"{role.title()} Login", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_get_profile(self, role: str):
        """Test get current user profile"""
        if role not in self.tokens:
            self.log_result(f"Get {role.title()} Profile", False, f"No token for {role}")
            return False
        
        success, response = self.make_request("GET", "/auth/me", token=self.tokens[role])
        
        if not success:
            self.log_result(f"Get {role.title()} Profile", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "role" in data:
                self.log_result(f"Get {role.title()} Profile", True, "Profile retrieved successfully")
                return True
            else:
                self.log_result(f"Get {role.title()} Profile", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result(f"Get {role.title()} Profile", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_user_profile_update(self):
        """Test user profile update"""
        if "user" not in self.tokens:
            self.log_result("User Profile Update", False, "No user token")
            return False
        
        update_params = {
            "name": "Sarah Johnson Updated",
            "phone": "+592-555-9999",
            "location": "Linden"
        }
        
        # User profile update uses query parameters, not JSON body
        url = f"{BASE_URL}/users/profile"
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        try:
            response = requests.put(url, headers=headers, params=update_params, timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("name") == update_params["name"]:
                    self.log_result("User Profile Update", True, "Profile updated successfully")
                    return True
                else:
                    self.log_result("User Profile Update", False, "Profile not updated properly", str(data))
                    return False
            else:
                self.log_result("User Profile Update", False, f"HTTP {response.status_code}", response.text)
                return False
        except requests.exceptions.RequestException as e:
            self.log_result("User Profile Update", False, "Request failed", str(e))
            return False
    
    def test_merchant_profile_update(self):
        """Test merchant profile update"""
        if "merchant" not in self.tokens:
            self.log_result("Merchant Profile Update", False, "No merchant token")
            return False
        
        update_data = {
            "business_name": "Updated Restaurant Name",
            "contact_info": "+592-555-8888"
        }
        
        success, response = self.make_request("PUT", "/merchants/profile", update_data, self.tokens["merchant"])
        
        if not success:
            self.log_result("Merchant Profile Update", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "business_name" in data:
                self.log_result("Merchant Profile Update", True, "Merchant profile updated successfully")
                return True
            else:
                self.log_result("Merchant Profile Update", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Merchant Profile Update", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_approve_merchant(self):
        """Test admin approving a merchant"""
        if "admin" not in self.tokens:
            self.log_result("Admin Approve Merchant", False, "No admin token")
            return False
        
        # First get merchant ID from test data
        if "new_merchant" not in self.test_data:
            self.log_result("Admin Approve Merchant", False, "No new merchant to approve")
            return False
        
        merchant_id = self.test_data["new_merchant"]["user"]["id"]
        approval_data = {"approved": True}
        
        success, response = self.make_request("PUT", f"/admin/merchants/{merchant_id}/approve", 
                                            approval_data, self.tokens["admin"])
        
        if not success:
            self.log_result("Admin Approve Merchant", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            self.log_result("Admin Approve Merchant", True, "Merchant approved successfully")
            return True
        else:
            self.log_result("Admin Approve Merchant", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_create_offer(self):
        """Test creating an offer (requires approved merchant)"""
        if "merchant" not in self.tokens:
            self.log_result("Create Offer", False, "No merchant token")
            return False
        
        offer_data = {
            "title": "20% Off All Meals",
            "description": "Get 20% discount on all meals when you pay with your debit card",
            "reward_type": "percent",
            "reward_value": "20",
            "start_date": datetime.utcnow().isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "redemption_rules": "Valid for dine-in only. Cannot be combined with other offers."
        }
        
        success, response = self.make_request("POST", "/merchants/offers", offer_data, self.tokens["merchant"])
        
        if not success:
            self.log_result("Create Offer", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "title" in data:
                self.test_data["offer"] = data
                self.log_result("Create Offer", True, "Offer created successfully")
                return True
            else:
                self.log_result("Create Offer", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Create Offer", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_get_offers(self):
        """Test getting all offers"""
        if "user" not in self.tokens:
            self.log_result("Get Offers", False, "No user token")
            return False
        
        success, response = self.make_request("GET", "/offers", token=self.tokens["user"])
        
        if not success:
            self.log_result("Get Offers", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("Get Offers", True, f"Retrieved {len(data)} offers")
                return True
            else:
                self.log_result("Get Offers", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Get Offers", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_qr_redemption(self):
        """Test QR code redemption (should be instantly approved)"""
        if "user" not in self.tokens or "offer" not in self.test_data:
            self.log_result("QR Redemption", False, "Missing user token or offer data")
            return False
        
        redemption_data = {
            "offer_id": self.test_data["offer"]["id"],
            "method": "qr",
            "proof_base64": None
        }
        
        success, response = self.make_request("POST", "/redemptions", redemption_data, self.tokens["user"])
        
        if not success:
            self.log_result("QR Redemption", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "approved" and data.get("points_awarded", 0) > 0:
                self.test_data["qr_redemption"] = data
                self.log_result("QR Redemption", True, f"QR redemption approved, {data['points_awarded']} points awarded")
                return True
            else:
                self.log_result("QR Redemption", False, "QR redemption not auto-approved", str(data))
                return False
        else:
            self.log_result("QR Redemption", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_receipt_redemption(self):
        """Test receipt redemption (should be pending)"""
        if "user" not in self.tokens or "offer" not in self.test_data:
            self.log_result("Receipt Redemption", False, "Missing user token or offer data")
            return False
        
        # Create a different offer for receipt redemption to avoid duplicate error
        offer_data = {
            "title": "Free Coffee with Purchase",
            "description": "Get a free coffee when you spend $10 or more",
            "reward_type": "points",
            "reward_value": "50",
            "start_date": datetime.utcnow().isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "redemption_rules": "Minimum purchase $10. Show receipt."
        }
        
        success, response = self.make_request("POST", "/merchants/offers", offer_data, self.tokens["merchant"])
        if not success or response.status_code != 200:
            self.log_result("Receipt Redemption", False, "Failed to create second offer for testing")
            return False
        
        second_offer = response.json()
        
        redemption_data = {
            "offer_id": second_offer["id"],
            "method": "receipt",
            "proof_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
        }
        
        success, response = self.make_request("POST", "/redemptions", redemption_data, self.tokens["user"])
        
        if not success:
            self.log_result("Receipt Redemption", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "pending":
                self.test_data["receipt_redemption"] = data
                self.log_result("Receipt Redemption", True, "Receipt redemption created as pending")
                return True
            else:
                self.log_result("Receipt Redemption", False, "Receipt redemption not pending", str(data))
                return False
        else:
            self.log_result("Receipt Redemption", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_points_history(self):
        """Test getting user points history"""
        if "user" not in self.tokens:
            self.log_result("Points History", False, "No user token")
            return False
        
        success, response = self.make_request("GET", "/users/points-history", token=self.tokens["user"])
        
        if not success:
            self.log_result("Points History", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("Points History", True, f"Retrieved {len(data)} points history entries")
                return True
            else:
                self.log_result("Points History", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Points History", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_user_redemptions(self):
        """Test getting user redemptions"""
        if "user" not in self.tokens:
            self.log_result("User Redemptions", False, "No user token")
            return False
        
        success, response = self.make_request("GET", "/users/redemptions", token=self.tokens["user"])
        
        if not success:
            self.log_result("User Redemptions", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("User Redemptions", True, f"Retrieved {len(data)} user redemptions")
                return True
            else:
                self.log_result("User Redemptions", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("User Redemptions", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_merchant_redemptions(self):
        """Test getting merchant redemptions"""
        if "merchant" not in self.tokens:
            self.log_result("Merchant Redemptions", False, "No merchant token")
            return False
        
        success, response = self.make_request("GET", "/merchants/redemptions", token=self.tokens["merchant"])
        
        if not success:
            self.log_result("Merchant Redemptions", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("Merchant Redemptions", True, f"Retrieved {len(data)} merchant redemptions")
                return True
            else:
                self.log_result("Merchant Redemptions", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Merchant Redemptions", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_merchant_analytics(self):
        """Test merchant analytics"""
        if "merchant" not in self.tokens:
            self.log_result("Merchant Analytics", False, "No merchant token")
            return False
        
        success, response = self.make_request("GET", "/merchants/analytics", token=self.tokens["merchant"])
        
        if not success:
            self.log_result("Merchant Analytics", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            expected_keys = ["total_offers", "active_offers", "total_redemptions", "approved_redemptions", "pending_redemptions"]
            if all(key in data for key in expected_keys):
                self.log_result("Merchant Analytics", True, "Analytics retrieved successfully")
                return True
            else:
                self.log_result("Merchant Analytics", False, "Missing analytics data", str(data))
                return False
        else:
            self.log_result("Merchant Analytics", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_metrics(self):
        """Test admin platform metrics"""
        if "admin" not in self.tokens:
            self.log_result("Admin Metrics", False, "No admin token")
            return False
        
        success, response = self.make_request("GET", "/admin/metrics", token=self.tokens["admin"])
        
        if not success:
            self.log_result("Admin Metrics", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            expected_keys = ["total_users", "total_merchants", "approved_merchants", "active_offers", "total_redemptions_30_days", "pending_redemptions", "total_points_issued"]
            if all(key in data for key in expected_keys):
                self.log_result("Admin Metrics", True, "Platform metrics retrieved successfully")
                return True
            else:
                self.log_result("Admin Metrics", False, "Missing metrics data", str(data))
                return False
        else:
            self.log_result("Admin Metrics", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_get_merchants(self):
        """Test admin getting all merchants"""
        if "admin" not in self.tokens:
            self.log_result("Admin Get Merchants", False, "No admin token")
            return False
        
        success, response = self.make_request("GET", "/admin/merchants", token=self.tokens["admin"])
        
        if not success:
            self.log_result("Admin Get Merchants", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("Admin Get Merchants", True, f"Retrieved {len(data)} merchants")
                return True
            else:
                self.log_result("Admin Get Merchants", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Admin Get Merchants", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_get_users(self):
        """Test admin getting all users"""
        if "admin" not in self.tokens:
            self.log_result("Admin Get Users", False, "No admin token")
            return False
        
        success, response = self.make_request("GET", "/admin/users", token=self.tokens["admin"])
        
        if not success:
            self.log_result("Admin Get Users", False, "Request failed", response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("Admin Get Users", True, f"Retrieved {len(data)} users")
                return True
            else:
                self.log_result("Admin Get Users", False, "Invalid response format", str(data))
                return False
        else:
            self.log_result("Admin Get Users", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_duplicate_redemption_prevention(self):
        """Test that duplicate redemptions are prevented"""
        if "user" not in self.tokens or "offer" not in self.test_data:
            self.log_result("Duplicate Redemption Prevention", False, "Missing user token or offer data")
            return False
        
        # Try to redeem the same offer again (should fail)
        redemption_data = {
            "offer_id": self.test_data["offer"]["id"],
            "method": "qr",
            "proof_base64": None
        }
        
        success, response = self.make_request("POST", "/redemptions", redemption_data, self.tokens["user"])
        
        if not success:
            self.log_result("Duplicate Redemption Prevention", False, "Request failed", response)
            return False
        
        if response.status_code == 400:
            error_msg = response.json().get("detail", "")
            if "already redeemed" in error_msg.lower():
                self.log_result("Duplicate Redemption Prevention", True, "Duplicate redemption correctly prevented")
                return True
            else:
                self.log_result("Duplicate Redemption Prevention", False, "Wrong error message", error_msg)
                return False
        else:
            self.log_result("Duplicate Redemption Prevention", False, f"Expected 400 error, got {response.status_code}", response.text)
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("PayPerks GY Backend API Testing Suite")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n🔍 Basic Connectivity Tests")
        self.test_health_check()
        self.test_utility_endpoints()
        
        # Authentication tests
        print("\n🔐 Authentication Tests")
        self.test_user_registration()
        self.test_merchant_registration() 
        self.test_admin_registration()
        
        # Login with existing test accounts
        print("\n🚪 Login Tests")
        self.test_login("user")
        self.test_login("merchant")
        self.test_login("admin")
        
        # Profile tests
        print("\n👤 Profile Tests")
        self.test_get_profile("user")
        self.test_get_profile("merchant")
        self.test_get_profile("admin")
        self.test_user_profile_update()
        self.test_merchant_profile_update()
        
        # Admin operations
        print("\n👑 Admin Operations")
        self.test_admin_approve_merchant()
        self.test_admin_metrics()
        self.test_admin_get_merchants()
        self.test_admin_get_users()
        
        # Offer management
        print("\n🎯 Offer Management")
        self.test_create_offer()
        self.test_get_offers()
        
        # Redemption system
        print("\n🎫 Redemption System")
        self.test_qr_redemption()
        self.test_receipt_redemption()
        self.test_duplicate_redemption_prevention()
        
        # User data retrieval
        print("\n📊 User Data")
        self.test_points_history()
        self.test_user_redemptions()
        
        # Merchant data
        print("\n🏪 Merchant Data")
        self.test_merchant_redemptions()
        self.test_merchant_analytics()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
                    if result["details"]:
                        print(f"    Details: {result['details']}")
        
        return failed == 0

def main():
    """Main function"""
    tester = PayPerksAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend APIs are working correctly.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Please check the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()