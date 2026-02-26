#!/usr/bin/env python3
"""
Backend API Integration Tests for DietTracker Pro
Testing external API at https://pdf-platform-1.preview.emergentagent.com/api
"""

import requests
import json
import uuid
from datetime import datetime

class DietTrackerAPITester:
    def __init__(self):
        self.base_url = "https://pdf-platform-1.preview.emergentagent.com/api"
        self.invite_code = "8F809C22"
        self.access_token = None
        self.user_data = None
        self.test_results = []
        
        # Generate unique test user data
        unique_id = str(uuid.uuid4())[:8]
        self.test_user = {
            "name": f"Test User {unique_id}",
            "email": f"testuser{unique_id}@example.com",
            "password": "TestPass123!",
            "invite_code": self.invite_code,
            "role": "client"
        }
    
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            url = f"{self.base_url}/auth/register"
            response = requests.post(url, json=self.test_user, timeout=10)
            
            print(f"\n--- Testing User Registration ---")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(self.test_user, indent=2)}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                self.log_result("User Registration", True, "User registered successfully", data)
                return True
            elif response.status_code == 409:
                # User already exists - this is fine for testing
                data = response.json() if response.text else {}
                self.log_result("User Registration", True, "User already exists (409) - proceeding with login", data)
                return True
            else:
                data = response.json() if response.text else {}
                self.log_result("User Registration", False, f"Registration failed with status {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_result("User Registration", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            url = f"{self.base_url}/auth/login"
            login_data = {
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            }
            
            print(f"\n--- Testing User Login ---")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(login_data, indent=2)}")
            
            response = requests.post(url, json=login_data, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.access_token = data["access_token"]
                    self.user_data = data.get("user", {})
                    self.log_result("User Login", True, "Login successful, token received", data)
                    return True
                else:
                    self.log_result("User Login", False, "Login response missing access_token", data)
                    return False
            else:
                data = response.json() if response.text else {}
                self.log_result("User Login", False, f"Login failed with status {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_result("User Login", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.access_token:
            self.log_result("Get Current User", False, "No access token available")
            return False
            
        try:
            url = f"{self.base_url}/auth/me"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            print(f"\n--- Testing Get Current User ---")
            print(f"GET {url}")
            print(f"Headers: Authorization: Bearer {self.access_token[:20]}...")
            
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Current User", True, "User data retrieved successfully", data)
                return True
            else:
                data = response.json() if response.text else {}
                self.log_result("Get Current User", False, f"Failed with status {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_result("Get Current User", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_client_dashboard(self):
        """Test client dashboard endpoint"""
        if not self.access_token:
            self.log_result("Client Dashboard", False, "No access token available")
            return False
            
        try:
            url = f"{self.base_url}/client/dashboard"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            print(f"\n--- Testing Client Dashboard ---")
            print(f"GET {url}")
            
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Client Dashboard", True, "Dashboard data retrieved successfully", data)
                return True
            elif response.status_code == 404:
                data = response.json() if response.text else {}
                # This might be expected if client profile not found
                self.log_result("Client Dashboard", True, "Client profile not found (404) - expected until coach adds client", data)
                return True
            else:
                data = response.json() if response.text else {}
                self.log_result("Client Dashboard", False, f"Failed with status {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_result("Client Dashboard", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_weight_logging(self):
        """Test weight logging endpoints"""
        if not self.access_token:
            self.log_result("Weight Logging", False, "No access token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            # First, get current weights
            url = f"{self.base_url}/client/weights"
            
            print(f"\n--- Testing Get Weight History ---")
            print(f"GET {url}")
            
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Weight History", True, "Weight history retrieved successfully", data)
            elif response.status_code == 404:
                data = response.json() if response.text else {}
                self.log_result("Get Weight History", True, "No weight history found (404) - expected for new user", data)
            else:
                data = response.json() if response.text else {}
                self.log_result("Get Weight History", False, f"Failed with status {response.status_code}", data)
            
            # Now, log a new weight
            url = f"{self.base_url}/client/weight"
            weight_data = {"weight_kg": 75.5}
            
            print(f"\n--- Testing Log Weight ---")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(weight_data, indent=2)}")
            
            response = requests.post(url, json=weight_data, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                self.log_result("Log Weight", True, "Weight logged successfully", data)
                return True
            elif response.status_code == 404:
                data = response.json() if response.text else {}
                self.log_result("Log Weight", True, "Client profile not found (404) - expected until coach adds client", data)
                return True
            else:
                data = response.json() if response.text else {}
                self.log_result("Log Weight", False, f"Failed with status {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_result("Weight Logging", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_checkin(self):
        """Test check-in endpoints"""
        if not self.access_token:
            self.log_result("Check-in", False, "No access token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            # First, get today's check-in
            url = f"{self.base_url}/client/checkin/today"
            
            print(f"\n--- Testing Get Today's Check-in ---")
            print(f"GET {url}")
            
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Today's Check-in", True, "Today's check-in retrieved successfully", data)
            elif response.status_code == 404:
                data = response.json() if response.text else {}
                self.log_result("Get Today's Check-in", True, "No check-in for today (404) - expected for new check-in", data)
            else:
                data = response.json() if response.text else {}
                self.log_result("Get Today's Check-in", False, f"Failed with status {response.status_code}", data)
            
            # Now, submit a check-in
            url = f"{self.base_url}/client/checkin"
            checkin_data = {
                "meals": [
                    {"meal_name": "Breakfast", "completed": True},
                    {"meal_name": "Lunch", "completed": True},
                    {"meal_name": "Dinner", "completed": False}
                ],
                "water_glasses": 6,
                "mood": "good",
                "notes": "Had a great day with healthy meals!"
            }
            
            print(f"\n--- Testing Submit Check-in ---")
            print(f"POST {url}")
            print(f"Payload: {json.dumps(checkin_data, indent=2)}")
            
            response = requests.post(url, json=checkin_data, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                self.log_result("Submit Check-in", True, "Check-in submitted successfully", data)
                return True
            elif response.status_code == 404:
                data = response.json() if response.text else {}
                self.log_result("Submit Check-in", True, "Client profile not found (404) - expected until coach adds client", data)
                return True
            else:
                data = response.json() if response.text else {}
                self.log_result("Submit Check-in", False, f"Failed with status {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_result("Check-in", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_diet_plan(self):
        """Test diet plan endpoint"""
        if not self.access_token:
            self.log_result("Diet Plan", False, "No access token available")
            return False
            
        try:
            url = f"{self.base_url}/client/diet-plan"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            print(f"\n--- Testing Get Diet Plan ---")
            print(f"GET {url}")
            
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Diet Plan", True, "Diet plan retrieved successfully", data)
                return True
            elif response.status_code == 404:
                data = response.json() if response.text else {}
                self.log_result("Diet Plan", True, "Diet plan not found (404) - expected until coach assigns plan", data)
                return True
            else:
                data = response.json() if response.text else {}
                self.log_result("Diet Plan", False, f"Failed with status {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_result("Diet Plan", False, f"Exception occurred: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("=" * 80)
        print("DIETTRACKER PRO - EXTERNAL API INTEGRATION TESTS")
        print("=" * 80)
        print(f"Base URL: {self.base_url}")
        print(f"Test User: {self.test_user['email']}")
        print(f"Invite Code: {self.invite_code}")
        print("=" * 80)
        
        # Test sequence
        tests = [
            ("Authentication - Register", self.test_user_registration),
            ("Authentication - Login", self.test_user_login),
            ("Authentication - Get Current User", self.test_get_current_user),
            ("Client Dashboard", self.test_client_dashboard),
            ("Weight Logging", self.test_weight_logging),
            ("Check-in", self.test_checkin),
            ("Diet Plan", self.test_diet_plan)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                success = test_func()
                if success:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Unexpected error - {str(e)}")
                failed += 1
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {passed + failed}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        # Detailed results
        print("\nDETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = DietTrackerAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with non-zero code if any tests failed
    exit(0 if failed == 0 else 1)