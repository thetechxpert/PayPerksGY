#!/usr/bin/env python3
"""
Comprehensive Final Backend API Testing for PayPerks GY
Tests all critical flows as requested in the review:
1. Authentication Flow
2. Merchant Approval Flow  
3. Offer Management
4. Redemption Flow
5. Points System
6. Admin Analytics
"""

import requests
import json
from datetime import datetime, timedelta
import uuid
import sys
import time

# Configuration
BASE_URL = "https://loyaltyboost-5.preview.emergentagent.com/api"
TIMEOUT = 30

# Test credentials from review request
TEST_CREDENTIALS = {
    "admin": {"email": "admin@test.com", "password": "password"},
    "merchant": {"email": "merchant@test.com", "password": "password"},
    "user": {"email": "user@test.com", "password": "password"}
}

class ComprehensiveAPITester:
    def __init__(self):
        self.tokens = {}
        self.test_data = {}
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with authentication"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        if token:
            headers['Authorization'] = f"Bearer {token}"
            
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, params=params, timeout=TIMEOUT)
            elif method.upper() == 'POST':
                response = self.session.post(url, headers=headers, json=data, timeout=TIMEOUT)
            elif method.upper() == 'PUT':
                response = self.session.put(url, headers=headers, json=data, timeout=TIMEOUT)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=TIMEOUT)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            self.log(f"Request failed: {e}", "ERROR")
            return None
            
    def test_1_authentication_flow(self):
        """Test complete authentication flow for all roles"""
        self.log("=" * 60)
        self.log("1. TESTING AUTHENTICATION FLOW")
        self.log("=" * 60)
        
        success_count = 0
        total_tests = 0
        
        # Test login for all existing accounts
        for role, creds in TEST_CREDENTIALS.items():
            total_tests += 1
            self.log(f"Testing {role} login...")
            response = self.make_request('POST', '/auth/login', creds)
            
            if response and response.status_code == 200:
                data = response.json()
                self.tokens[role] = data['access_token']
                self.log(f"✅ {role.title()} login: SUCCESS")
                success_count += 1
                
                # Test profile retrieval
                total_tests += 1
                profile_response = self.make_request('GET', '/auth/me', token=self.tokens[role])
                if profile_response and profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.log(f"✅ {role.title()} profile retrieval: SUCCESS")
                    success_count += 1
                else:
                    self.log(f"❌ {role.title()} profile retrieval: FAILED")
            else:
                self.log(f"❌ {role.title()} login: FAILED - {response.status_code if response else 'No response'}")
                
        # Test new user registration
        total_tests += 1
        new_user_data = {
            "name": "Test User " + str(int(time.time())),
            "email": f"testuser{int(time.time())}@example.com",
            "password": "testpass123",
            "phone": "+592-123-4567",
            "location": "Georgetown"
        }
        
        response = self.make_request('POST', '/auth/register/user', new_user_data)
        if response and response.status_code == 200:
            self.log("✅ New user registration: SUCCESS")
            success_count += 1
        else:
            self.log(f"❌ New user registration: FAILED - {response.status_code if response else 'No response'}")
            
        # Test suspended user login prevention
        if 'admin' in self.tokens:
            total_tests += 1
            # Get users list to find one to suspend
            users_response = self.make_request('GET', '/admin/users', token=self.tokens['admin'])
            if users_response and users_response.status_code == 200:
                users = users_response.json()
                if users:
                    test_user_id = users[0]['id']
                    # Suspend user
                    suspend_response = self.make_request('PUT', f'/admin/users/{test_user_id}/suspend', 
                                                       token=self.tokens['admin'])
                    if suspend_response and suspend_response.status_code == 200:
                        # Try to login with suspended user (should fail with 403)
                        suspended_creds = {"email": users[0]['email'], "password": "password"}
                        login_response = self.make_request('POST', '/auth/login', suspended_creds)
                        if login_response and login_response.status_code == 403:
                            self.log("✅ Suspended user login prevention: SUCCESS")
                            success_count += 1
                        else:
                            self.log("❌ Suspended user login prevention: FAILED")
                        
                        # Unsuspend the user
                        self.make_request('PUT', f'/admin/users/{test_user_id}/suspend', token=self.tokens['admin'])
                    else:
                        self.log("❌ User suspension test: FAILED")
                else:
                    self.log("❌ No users found for suspension test")
            else:
                self.log("❌ Could not retrieve users for suspension test")
                
        self.log(f"Authentication Flow: {success_count}/{total_tests} tests passed")
        return success_count, total_tests
        
    def test_2_merchant_approval_flow(self):
        """Test merchant approval workflow"""
        self.log("=" * 60)
        self.log("2. TESTING MERCHANT APPROVAL FLOW")
        self.log("=" * 60)
        
        success_count = 0
        total_tests = 0
        
        if 'admin' not in self.tokens:
            self.log("❌ Admin token not available")
            return 0, 1
            
        # Create new merchant for testing
        total_tests += 1
        merchant_data = {
            "business_name": f"Test Restaurant {int(time.time())}",
            "category": "Restaurants & Dining",
            "location": "Georgetown",
            "email": f"testmerchant{int(time.time())}@example.com",
            "password": "testpass123",
            "contact_info": "+592-987-6543"
        }
        
        response = self.make_request('POST', '/auth/register/merchant', merchant_data)
        if response and response.status_code == 200:
            data = response.json()
            test_merchant_id = data['user']['id']
            test_merchant_token = data['access_token']
            self.test_data['test_merchant_id'] = test_merchant_id
            self.test_data['test_merchant_token'] = test_merchant_token
            self.log("✅ Test merchant registration: SUCCESS")
            success_count += 1
        else:
            self.log(f"❌ Test merchant registration: FAILED")
            return success_count, total_tests
            
        # List pending merchants
        total_tests += 1
        response = self.make_request('GET', '/admin/merchants?approved=false', token=self.tokens['admin'])
        if response and response.status_code == 200:
            merchants = response.json()
            pending_count = len([m for m in merchants if not m.get('approved', False)])
            self.log(f"✅ List pending merchants: SUCCESS ({pending_count} pending)")
            success_count += 1
        else:
            self.log("❌ List pending merchants: FAILED")
            
        # Approve the test merchant
        total_tests += 1
        approval_data = {"approved": True}
        response = self.make_request('PUT', f'/admin/merchants/{test_merchant_id}/approve',
                                   approval_data, token=self.tokens['admin'])
        if response and response.status_code == 200:
            self.log("✅ Merchant approval: SUCCESS")
            success_count += 1
        else:
            self.log("❌ Merchant approval: FAILED")
            
        # Create another merchant to test rejection
        total_tests += 1
        merchant_data2 = {
            "business_name": f"Test Shop {int(time.time())}",
            "category": "Retail & Shopping",
            "location": "Linden",
            "email": f"testmerchant2{int(time.time())}@example.com",
            "password": "testpass123"
        }
        
        response = self.make_request('POST', '/auth/register/merchant', merchant_data2)
        if response and response.status_code == 200:
            merchant_id2 = response.json()['user']['id']
            
            # Reject this merchant
            rejection_data = {"approved": False, "rejected_reason": "Incomplete documentation"}
            response = self.make_request('PUT', f'/admin/merchants/{merchant_id2}/approve',
                                       rejection_data, token=self.tokens['admin'])
            if response and response.status_code == 200:
                self.log("✅ Merchant rejection with reason: SUCCESS")
                success_count += 1
            else:
                self.log("❌ Merchant rejection: FAILED")
        else:
            self.log("❌ Second merchant registration for rejection test: FAILED")
            
        self.log(f"Merchant Approval Flow: {success_count}/{total_tests} tests passed")
        return success_count, total_tests
        
    def test_3_offer_management(self):
        """Test offer creation and management"""
        self.log("=" * 60)
        self.log("3. TESTING OFFER MANAGEMENT")
        self.log("=" * 60)
        
        success_count = 0
        total_tests = 0
        
        if 'test_merchant_token' not in self.test_data:
            self.log("❌ No approved merchant available")
            return 0, 1
            
        # Create offer as approved merchant
        total_tests += 1
        offer_data = {
            "title": "20% Off All Meals",
            "description": "Get 20% discount on all food items with debit card payment",
            "reward_type": "percent",
            "reward_value": "20",
            "start_date": datetime.utcnow().isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "redemption_rules": "Valid for dine-in only"
        }
        
        response = self.make_request('POST', '/merchants/offers', offer_data,
                                   token=self.test_data['test_merchant_token'])
        if response and response.status_code == 200:
            data = response.json()
            self.test_data['test_offer_id'] = data['id']
            self.log("✅ Create offer as approved merchant: SUCCESS")
            success_count += 1
        else:
            self.log(f"❌ Create offer: FAILED - {response.status_code if response else 'No response'}")
            
        # Test unapproved merchant cannot create offers
        total_tests += 1
        if 'merchant' in self.tokens:
            response = self.make_request('POST', '/merchants/offers', offer_data, token=self.tokens['merchant'])
            if response and response.status_code == 403:
                self.log("✅ Unapproved merchant offer creation blocked: SUCCESS")
                success_count += 1
            else:
                self.log("❌ Unapproved merchant offer block: FAILED")
        else:
            self.log("❌ No merchant token for unapproved test")
            
        # List all active offers
        total_tests += 1
        if 'user' in self.tokens:
            response = self.make_request('GET', '/offers', token=self.tokens['user'])
            if response and response.status_code == 200:
                offers = response.json()
                self.log(f"✅ List all active offers: SUCCESS ({len(offers)} offers)")
                success_count += 1
            else:
                self.log("❌ List active offers: FAILED")
        else:
            self.log("❌ No user token for offers list")
            
        # Admin toggle offer active status
        total_tests += 1
        if 'admin' in self.tokens and 'test_offer_id' in self.test_data:
            response = self.make_request('PUT', f'/admin/offers/{self.test_data["test_offer_id"]}/toggle',
                                       token=self.tokens['admin'])
            if response and response.status_code == 200:
                self.log("✅ Admin toggle offer status: SUCCESS")
                success_count += 1
            else:
                self.log("❌ Admin toggle offer status: FAILED")
        else:
            self.log("❌ Missing admin token or offer ID for toggle test")
            
        self.log(f"Offer Management: {success_count}/{total_tests} tests passed")
        return success_count, total_tests
        
    def test_4_redemption_flow(self):
        """Test QR and receipt redemption flows"""
        self.log("=" * 60)
        self.log("4. TESTING REDEMPTION FLOW")
        self.log("=" * 60)
        
        success_count = 0
        total_tests = 0
        
        if 'user' not in self.tokens or 'test_merchant_token' not in self.test_data:
            self.log("❌ Missing user token or approved merchant")
            return 0, 1
            
        # Create points-based offer for testing
        points_offer_data = {
            "title": "Earn 50 Points",
            "description": "Earn 50 loyalty points with any purchase",
            "reward_type": "points",
            "reward_value": "50",
            "start_date": datetime.utcnow().isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=30)).isoformat()
        }
        
        response = self.make_request('POST', '/merchants/offers', points_offer_data,
                                   token=self.test_data['test_merchant_token'])
        if response and response.status_code == 200:
            self.test_data['points_offer_id'] = response.json()['id']
            
        # Test QR redemption (should auto-approve and award points)
        total_tests += 1
        if 'points_offer_id' in self.test_data:
            qr_redemption = {
                "offer_id": self.test_data['points_offer_id'],
                "method": "qr"
            }
            
            response = self.make_request('POST', '/redemptions', qr_redemption, token=self.tokens['user'])
            if response and response.status_code == 200:
                data = response.json()
                if data['status'] == 'approved' and data['points_awarded'] > 0:
                    self.test_data['qr_redemption_id'] = data['id']
                    self.log(f"✅ QR redemption (auto-approve, {data['points_awarded']} points): SUCCESS")
                    success_count += 1
                else:
                    self.log("❌ QR redemption: Not auto-approved or no points awarded")
            else:
                self.log("❌ QR redemption: FAILED")
        else:
            self.log("❌ No points offer available for QR test")
            
        # Test receipt redemption (should be pending)
        total_tests += 1
        if 'test_offer_id' in self.test_data:
            receipt_redemption = {
                "offer_id": self.test_data['test_offer_id'],
                "method": "receipt",
                "proof_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            }
            
            response = self.make_request('POST', '/redemptions', receipt_redemption, token=self.tokens['user'])
            if response and response.status_code == 200:
                data = response.json()
                if data['status'] == 'pending':
                    self.test_data['receipt_redemption_id'] = data['id']
                    self.log("✅ Receipt redemption (pending status): SUCCESS")
                    success_count += 1
                else:
                    self.log("❌ Receipt redemption: Should be pending")
            else:
                self.log("❌ Receipt redemption: FAILED")
        else:
            self.log("❌ No offer available for receipt test")
            
        # Test duplicate redemption prevention
        total_tests += 1
        if 'points_offer_id' in self.test_data:
            duplicate_redemption = {
                "offer_id": self.test_data['points_offer_id'],
                "method": "qr"
            }
            
            response = self.make_request('POST', '/redemptions', duplicate_redemption, token=self.tokens['user'])
            if response and response.status_code == 400:
                error_msg = response.json().get('detail', '')
                if 'already redeemed' in error_msg.lower():
                    self.log("✅ Duplicate redemption blocked: SUCCESS")
                    success_count += 1
                else:
                    self.log(f"❌ Duplicate redemption: Wrong error message - {error_msg}")
            else:
                self.log("❌ Duplicate redemption: Should be blocked with 400 error")
        else:
            self.log("❌ No offer for duplicate test")
            
        # Test admin approval of receipt redemption
        total_tests += 1
        if 'admin' in self.tokens and 'receipt_redemption_id' in self.test_data:
            approval_data = {"status": "approved"}
            response = self.make_request('PUT', f'/admin/redemptions/{self.test_data["receipt_redemption_id"]}/approve',
                                       approval_data, token=self.tokens['admin'])
            if response and response.status_code == 200:
                self.log("✅ Admin approve receipt redemption: SUCCESS")
                success_count += 1
            else:
                self.log("❌ Admin approve receipt redemption: FAILED")
        else:
            self.log("❌ Missing admin token or receipt redemption ID")
            
        # Test merchant approval of receipt redemption
        total_tests += 1
        if 'test_merchant_token' in self.test_data:
            # Create another receipt redemption for merchant approval test
            if 'test_offer_id' in self.test_data:
                receipt_redemption2 = {
                    "offer_id": self.test_data['test_offer_id'],
                    "method": "receipt",
                    "proof_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                }
                
                # Create new user for this test to avoid duplicate error
                new_user_data = {
                    "name": f"Receipt Test User {int(time.time())}",
                    "email": f"receiptuser{int(time.time())}@example.com",
                    "password": "testpass123"
                }
                
                user_response = self.make_request('POST', '/auth/register/user', new_user_data)
                if user_response and user_response.status_code == 200:
                    new_user_token = user_response.json()['access_token']
                    
                    receipt_response = self.make_request('POST', '/redemptions', receipt_redemption2, token=new_user_token)
                    if receipt_response and receipt_response.status_code == 200:
                        receipt_id = receipt_response.json()['id']
                        
                        # Merchant approve it
                        approval_data = {"status": "approved"}
                        merchant_approval = self.make_request('PUT', f'/merchants/redemptions/{receipt_id}/approve',
                                                            approval_data, token=self.test_data['test_merchant_token'])
                        if merchant_approval and merchant_approval.status_code == 200:
                            self.log("✅ Merchant approve receipt redemption: SUCCESS")
                            success_count += 1
                        else:
                            self.log("❌ Merchant approve receipt redemption: FAILED")
                    else:
                        self.log("❌ Could not create receipt redemption for merchant test")
                else:
                    self.log("❌ Could not create new user for merchant approval test")
            else:
                self.log("❌ No offer for merchant approval test")
        else:
            self.log("❌ No merchant token for approval test")
            
        self.log(f"Redemption Flow: {success_count}/{total_tests} tests passed")
        return success_count, total_tests
        
    def test_5_points_system(self):
        """Test points balance and history"""
        self.log("=" * 60)
        self.log("5. TESTING POINTS SYSTEM")
        self.log("=" * 60)
        
        success_count = 0
        total_tests = 0
        
        if 'user' not in self.tokens:
            self.log("❌ User token not available")
            return 0, 1
            
        # Check points balance
        total_tests += 1
        response = self.make_request('GET', '/auth/me', token=self.tokens['user'])
        if response and response.status_code == 200:
            data = response.json()
            current_points = data.get('points_balance', 0)
            self.log(f"✅ Check points balance: SUCCESS (Current: {current_points} points)")
            success_count += 1
        else:
            self.log("❌ Check points balance: FAILED")
            
        # Check points history/ledger
        total_tests += 1
        response = self.make_request('GET', '/users/points-history', token=self.tokens['user'])
        if response and response.status_code == 200:
            history = response.json()
            self.log(f"✅ Points history: SUCCESS ({len(history)} entries)")
            success_count += 1
        else:
            self.log("❌ Points history: FAILED")
            
        # Test admin points adjustment
        total_tests += 1
        if 'admin' in self.tokens:
            # Get user ID first
            response = self.make_request('GET', '/admin/users', token=self.tokens['admin'])
            if response and response.status_code == 200:
                users = response.json()
                if users:
                    user_id = users[0]['id']
                    
                    # Adjust points
                    params = {"delta_points": 100, "reason": "Test bonus points"}
                    response = self.make_request('POST', f'/admin/users/{user_id}/adjust-points',
                                               params, token=self.tokens['admin'])
                    if response and response.status_code == 200:
                        self.log("✅ Admin points adjustment: SUCCESS")
                        success_count += 1
                    else:
                        self.log("❌ Admin points adjustment: FAILED")
                else:
                    self.log("❌ No users found for points adjustment")
            else:
                self.log("❌ Could not retrieve users for points adjustment")
        else:
            self.log("❌ No admin token for points adjustment")
            
        self.log(f"Points System: {success_count}/{total_tests} tests passed")
        return success_count, total_tests
        
    def test_6_admin_analytics(self):
        """Test admin dashboard and analytics"""
        self.log("=" * 60)
        self.log("6. TESTING ADMIN ANALYTICS")
        self.log("=" * 60)
        
        success_count = 0
        total_tests = 0
        
        if 'admin' not in self.tokens:
            self.log("❌ Admin token not available")
            return 0, 1
            
        # Get platform metrics
        total_tests += 1
        response = self.make_request('GET', '/admin/metrics', token=self.tokens['admin'])
        if response and response.status_code == 200:
            metrics = response.json()
            self.log("✅ Platform metrics: SUCCESS")
            self.log(f"   - Total Users: {metrics.get('total_users', 0)}")
            self.log(f"   - Total Merchants: {metrics.get('total_merchants', 0)}")
            self.log(f"   - Approved Merchants: {metrics.get('approved_merchants', 0)}")
            self.log(f"   - Active Offers: {metrics.get('active_offers', 0)}")
            self.log(f"   - Pending Redemptions: {metrics.get('pending_redemptions', 0)}")
            self.log(f"   - Total Points Issued: {metrics.get('total_points_issued', 0)}")
            success_count += 1
        else:
            self.log("❌ Platform metrics: FAILED")
            
        # List all users
        total_tests += 1
        response = self.make_request('GET', '/admin/users', token=self.tokens['admin'])
        if response and response.status_code == 200:
            users = response.json()
            self.log(f"✅ List all users: SUCCESS ({len(users)} users)")
            success_count += 1
        else:
            self.log("❌ List all users: FAILED")
            
        # List all merchants
        total_tests += 1
        response = self.make_request('GET', '/admin/merchants', token=self.tokens['admin'])
        if response and response.status_code == 200:
            merchants = response.json()
            approved_count = len([m for m in merchants if m.get('approved', False)])
            self.log(f"✅ List all merchants: SUCCESS ({len(merchants)} total, {approved_count} approved)")
            success_count += 1
        else:
            self.log("❌ List all merchants: FAILED")
            
        # List all redemptions
        total_tests += 1
        response = self.make_request('GET', '/admin/redemptions', token=self.tokens['admin'])
        if response and response.status_code == 200:
            redemptions = response.json()
            pending_count = len([r for r in redemptions if r.get('status') == 'pending'])
            approved_count = len([r for r in redemptions if r.get('status') == 'approved'])
            self.log(f"✅ List all redemptions: SUCCESS ({len(redemptions)} total, {pending_count} pending, {approved_count} approved)")
            success_count += 1
        else:
            self.log("❌ List all redemptions: FAILED")
            
        # Test user suspend/unsuspend
        total_tests += 1
        response = self.make_request('GET', '/admin/users', token=self.tokens['admin'])
        if response and response.status_code == 200:
            users = response.json()
            if users:
                user_id = users[0]['id']
                # Suspend user
                suspend_response = self.make_request('PUT', f'/admin/users/{user_id}/suspend', 
                                                   token=self.tokens['admin'])
                if suspend_response and suspend_response.status_code == 200:
                    # Unsuspend user
                    unsuspend_response = self.make_request('PUT', f'/admin/users/{user_id}/suspend',
                                                         token=self.tokens['admin'])
                    if unsuspend_response and unsuspend_response.status_code == 200:
                        self.log("✅ User suspend/unsuspend: SUCCESS")
                        success_count += 1
                    else:
                        self.log("❌ User unsuspend: FAILED")
                else:
                    self.log("❌ User suspend: FAILED")
            else:
                self.log("❌ No users found for suspend test")
        else:
            self.log("❌ Could not retrieve users for suspend test")
            
        self.log(f"Admin Analytics: {success_count}/{total_tests} tests passed")
        return success_count, total_tests
        
    def run_comprehensive_test(self):
        """Run all test suites"""
        self.log("🚀 STARTING COMPREHENSIVE PAYPERKS GY BACKEND API TESTING")
        self.log(f"Backend URL: {BASE_URL}")
        self.log(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test basic connectivity first
        response = self.make_request('GET', '/health')
        if not response or response.status_code != 200:
            self.log("❌ CRITICAL: API not accessible. Stopping tests.")
            return False
        else:
            self.log("✅ API Health Check: PASSED")
            
        total_success = 0
        total_tests = 0
        
        # Run all test suites
        success, tests = self.test_1_authentication_flow()
        total_success += success
        total_tests += tests
        
        success, tests = self.test_2_merchant_approval_flow()
        total_success += success
        total_tests += tests
        
        success, tests = self.test_3_offer_management()
        total_success += success
        total_tests += tests
        
        success, tests = self.test_4_redemption_flow()
        total_success += success
        total_tests += tests
        
        success, tests = self.test_5_points_system()
        total_success += success
        total_tests += tests
        
        success, tests = self.test_6_admin_analytics()
        total_success += success
        total_tests += tests
        
        # Final summary
        self.log("=" * 60)
        self.log("FINAL TEST SUMMARY")
        self.log("=" * 60)
        
        success_rate = (total_success / total_tests * 100) if total_tests > 0 else 0
        
        self.log(f"Total Tests: {total_tests}")
        self.log(f"Passed: {total_success} ✅")
        self.log(f"Failed: {total_tests - total_success} ❌")
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            self.log("🎉 EXCELLENT: All critical flows working properly!")
        elif success_rate >= 75:
            self.log("✅ GOOD: Most flows working, minor issues detected")
        else:
            self.log("⚠️  WARNING: Significant issues detected")
            
        return success_rate >= 75

if __name__ == "__main__":
    tester = ComprehensiveAPITester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)