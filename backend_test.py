#!/usr/bin/env python3
"""
My Car Garage Backend API Test Suite
Tests all backend endpoints for the car garage management app
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# API Base URL from frontend/.env
API_BASE_URL = "https://car-garage-debug.preview.emergentagent.com/api"

class CarGarageAPITester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_email = f"test{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "password123"
        self.test_name = "Test User"
        self.auth_token = None
        self.test_car_id = None
        self.test_service_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
        
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
        return False
        
    def test_user_registration(self):
        """Test POST /api/auth/register"""
        try:
            user_data = {
                "email": self.test_email,
                "password": self.test_password,
                "name": self.test_name
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.log_test("User Registration", True, f"User registered successfully: {data['user']['email']}")
                    return True
                else:
                    self.log_test("User Registration", False, f"Missing token or user in response: {data}")
            else:
                self.log_test("User Registration", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
        return False
        
    def test_user_login(self):
        """Test POST /api/auth/login"""
        try:
            login_data = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.log_test("User Login", True, f"User logged in successfully: {data['user']['email']}")
                    return True
                else:
                    self.log_test("User Login", False, f"Missing token or user in response: {data}")
            else:
                self.log_test("User Login", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
        return False
        
    def test_get_car_makes(self):
        """Test GET /api/cars/makes (no auth needed)"""
        try:
            response = self.session.get(f"{self.base_url}/cars/makes")
            if response.status_code == 200:
                data = response.json()
                if "makes" in data and isinstance(data["makes"], list):
                    makes = data["makes"]
                    expected_makes = ["BMW", "Audi", "Mercedes-Benz", "Toyota", "Honda"]
                    found_makes = [make for make in expected_makes if make in makes]
                    
                    if len(found_makes) >= 3:  # At least 3 expected makes should be present
                        self.log_test("Get Car Makes", True, f"Found {len(makes)} car makes including: {found_makes}")
                        return True
                    else:
                        self.log_test("Get Car Makes", False, f"Missing expected makes. Found: {found_makes}")
                else:
                    self.log_test("Get Car Makes", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Get Car Makes", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Car Makes", False, f"Exception: {str(e)}")
        return False
        
    def test_search_car_specs(self):
        """Test GET /api/cars/search (API-Ninjas integration)"""
        try:
            params = {"make": "BMW", "model": "M3"}
            response = self.session.get(f"{self.base_url}/cars/search", params=params)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        car = data[0]
                        required_fields = ["make", "model", "year"]
                        missing_fields = [field for field in required_fields if field not in car]
                        
                        if not missing_fields:
                            self.log_test("Search Car Specs", True, f"Found {len(data)} BMW M3 specifications")
                            return True
                        else:
                            self.log_test("Search Car Specs", False, f"Missing required fields: {missing_fields}")
                    else:
                        # Empty result is acceptable for API-Ninjas (might not have data for BMW M3)
                        self.log_test("Search Car Specs", True, "No results found (acceptable for API-Ninjas)")
                        return True
                else:
                    self.log_test("Search Car Specs", False, f"Invalid response format: {data}")
            else:
                self.log_test("Search Car Specs", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Search Car Specs", False, f"Exception: {str(e)}")
        return False
        
    def test_create_car(self):
        """Test POST /api/cars (with auth)"""
        if not self.auth_token:
            self.log_test("Create Car", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            car_data = {
                "brand": "BMW",
                "model": "M3",
                "year": 2022,
                "power_hp": 480,
                "fuel_type": "Benzín",
                "transmission": "Automatická",
                "color": "Černá",
                "license_plate": "1A2 3456",
                "mileage": 15000
            }
            
            response = self.session.post(f"{self.base_url}/cars", json=car_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("brand") == "BMW":
                    self.test_car_id = data["id"]
                    self.log_test("Create Car", True, f"Car created successfully: {data['brand']} {data['model']}")
                    return True
                else:
                    self.log_test("Create Car", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Create Car", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create Car", False, f"Exception: {str(e)}")
        return False
        
    def test_get_all_cars(self):
        """Test GET /api/cars (with auth)"""
        if not self.auth_token:
            self.log_test("Get All Cars", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/cars", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        car = data[0]
                        required_fields = ["id", "brand", "model", "year"]
                        missing_fields = [field for field in required_fields if field not in car]
                        
                        if not missing_fields:
                            self.log_test("Get All Cars", True, f"Found {len(data)} cars")
                            return True
                        else:
                            self.log_test("Get All Cars", False, f"Missing required fields: {missing_fields}")
                    else:
                        self.log_test("Get All Cars", True, "No cars found (acceptable for new user)")
                        return True
                else:
                    self.log_test("Get All Cars", False, f"Invalid response format: {data}")
            else:
                self.log_test("Get All Cars", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get All Cars", False, f"Exception: {str(e)}")
        return False
        
    def test_create_service_record(self):
        """Test POST /api/cars/{car_id}/services"""
        if not self.auth_token or not self.test_car_id:
            self.log_test("Create Service Record", False, "No auth token or car ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            service_data = {
                "car_id": self.test_car_id,
                "service_type": "oil",
                "date": "2024-01-15",
                "cost": 2500,
                "mileage": 16000,
                "note": "Výměna oleje 5W-30"
            }
            
            response = self.session.post(f"{self.base_url}/cars/{self.test_car_id}/services", 
                                       json=service_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("service_type") == "oil":
                    self.test_service_id = data["id"]
                    self.log_test("Create Service Record", True, f"Service record created: {data['service_type']} - {data['cost']} CZK")
                    return True
                else:
                    self.log_test("Create Service Record", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Create Service Record", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create Service Record", False, f"Exception: {str(e)}")
        return False
        
    def test_get_service_records(self):
        """Test GET /api/cars/{car_id}/services"""
        if not self.auth_token or not self.test_car_id:
            self.log_test("Get Service Records", False, "No auth token or car ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/cars/{self.test_car_id}/services", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        service = data[0]
                        required_fields = ["id", "service_type", "date", "cost"]
                        missing_fields = [field for field in required_fields if field not in service]
                        
                        if not missing_fields:
                            self.log_test("Get Service Records", True, f"Found {len(data)} service records")
                            return True
                        else:
                            self.log_test("Get Service Records", False, f"Missing required fields: {missing_fields}")
                    else:
                        self.log_test("Get Service Records", True, "No service records found (acceptable)")
                        return True
                else:
                    self.log_test("Get Service Records", False, f"Invalid response format: {data}")
            else:
                self.log_test("Get Service Records", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get Service Records", False, f"Exception: {str(e)}")
        return False
        
    def test_get_car_stats(self):
        """Test GET /api/cars/{car_id}/stats"""
        if not self.auth_token or not self.test_car_id:
            self.log_test("Get Car Stats", False, "No auth token or car ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/cars/{self.test_car_id}/stats", headers=headers)
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_services", "total_cost"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get Car Stats", True, f"Car stats: {data['total_services']} services, {data['total_cost']} CZK total")
                    return True
                else:
                    self.log_test("Get Car Stats", False, f"Missing required fields: {missing_fields}")
            else:
                self.log_test("Get Car Stats", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get Car Stats", False, f"Exception: {str(e)}")
        return False
        
    def test_get_overall_stats(self):
        """Test GET /api/stats"""
        if not self.auth_token:
            self.log_test("Get Overall Stats", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/stats", headers=headers)
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_cars", "total_services", "total_cost"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get Overall Stats", True, f"Overall stats: {data['total_cars']} cars, {data['total_cost']} CZK total")
                    return True
                else:
                    self.log_test("Get Overall Stats", False, f"Missing required fields: {missing_fields}")
            else:
                self.log_test("Get Overall Stats", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get Overall Stats", False, f"Exception: {str(e)}")
        return False
        
    def test_update_settings(self):
        """Test PUT /api/auth/settings"""
        if not self.auth_token:
            self.log_test("Update Settings", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            settings_data = {
                "theme": "light",
                "language": "cs"
            }
            
            response = self.session.put(f"{self.base_url}/auth/settings", json=settings_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "settings" in data:
                    self.log_test("Update Settings", True, f"Settings updated: {data['settings']}")
                    return True
                else:
                    self.log_test("Update Settings", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Update Settings", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Update Settings", False, f"Exception: {str(e)}")
        return False
        
    def test_delete_service_record(self):
        """Test DELETE /api/services/{record_id}"""
        if not self.auth_token or not self.test_service_id:
            self.log_test("Delete Service Record", False, "No auth token or service ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.delete(f"{self.base_url}/services/{self.test_service_id}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Delete Service Record", True, f"Service record deleted: {data['message']}")
                    return True
                else:
                    self.log_test("Delete Service Record", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Delete Service Record", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Delete Service Record", False, f"Exception: {str(e)}")
        return False
        
    def test_delete_car(self):
        """Test DELETE /api/cars/{car_id}"""
        if not self.auth_token or not self.test_car_id:
            self.log_test("Delete Car", False, "No auth token or car ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.delete(f"{self.base_url}/cars/{self.test_car_id}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Delete Car", True, f"Car deleted: {data['message']}")
                    return True
                else:
                    self.log_test("Delete Car", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Delete Car", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Delete Car", False, f"Exception: {str(e)}")
        return False
        
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚗 Starting My Car Garage API Tests")
        print(f"📍 API Base URL: {self.base_url}")
        print(f"📧 Test Email: {self.test_email}")
        print("=" * 60)
        
        # Test 1: Health Check
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
            
        # Test 2: User Registration
        self.test_user_registration()
        
        # Test 3: User Login
        self.test_user_login()
        
        # Test 4: Get Car Makes (no auth needed)
        self.test_get_car_makes()
        
        # Test 5: Search Car Specs (API-Ninjas)
        self.test_search_car_specs()
        
        # Test 6: Create Car (with auth)
        self.test_create_car()
        
        # Test 7: Get All Cars
        self.test_get_all_cars()
        
        # Test 8: Create Service Record
        self.test_create_service_record()
        
        # Test 9: Get Service Records
        self.test_get_service_records()
        
        # Test 10: Get Car Stats
        self.test_get_car_stats()
        
        # Test 11: Get Overall Stats
        self.test_get_overall_stats()
        
        # Test 12: Update Settings
        self.test_update_settings()
        
        # Test 13: Delete Service Record
        self.test_delete_service_record()
        
        # Test 14: Delete Car
        self.test_delete_car()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
            
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed")
            return False

def main():
    """Main test runner"""
    tester = CarGarageAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()