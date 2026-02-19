#!/usr/bin/env python3
"""
SportTix Backend API Test Suite
Tests all backend endpoints for the sports ticket selling mobile app
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# API Base URL from frontend/.env
API_BASE_URL = "https://bug-tracker-51.preview.emergentagent.com/api"

class SportTixAPITester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_user_id = "test_user_" + str(uuid.uuid4())[:8]
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
        
    def test_get_sports(self):
        """Test GET /api/sports endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/sports")
            if response.status_code == 200:
                data = response.json()
                if "sports" in data and isinstance(data["sports"], list):
                    sports = data["sports"]
                    expected_sports = ["soccer", "basketball", "ice_hockey", "tennis", "golf"]
                    found_sports = [sport["id"] for sport in sports]
                    
                    if all(sport in found_sports for sport in expected_sports):
                        self.log_test("Get Sports", True, f"Found all expected sports: {found_sports}")
                        return True
                    else:
                        self.log_test("Get Sports", False, f"Missing sports. Found: {found_sports}, Expected: {expected_sports}")
                else:
                    self.log_test("Get Sports", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Get Sports", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Sports", False, f"Exception: {str(e)}")
        return False
        
    def test_get_events(self):
        """Test GET /api/events endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/events")
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list) and len(events) > 0:
                    # Check first event structure
                    event = events[0]
                    required_fields = ["id", "sport", "title", "venue", "date", "priceFrom", "priceTo", "sections"]
                    
                    missing_fields = [field for field in required_fields if field not in event]
                    if not missing_fields:
                        # Check if we have events from different sports
                        sports_found = set(e.get("sport") for e in events)
                        self.log_test("Get Events", True, f"Found {len(events)} events with sports: {list(sports_found)}")
                        return events
                    else:
                        self.log_test("Get Events", False, f"Missing required fields: {missing_fields}")
                else:
                    self.log_test("Get Events", False, f"No events returned or invalid format")
            else:
                self.log_test("Get Events", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Events", False, f"Exception: {str(e)}")
        return None
        
    def test_get_events_by_sport(self):
        """Test GET /api/events?sport=basketball endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/events?sport=basketball")
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list):
                    if len(events) > 0:
                        # Check all events are basketball
                        basketball_events = [e for e in events if e.get("sport") == "basketball"]
                        if len(basketball_events) == len(events):
                            self.log_test("Get Events by Sport", True, f"Found {len(events)} basketball events")
                            return True
                        else:
                            self.log_test("Get Events by Sport", False, f"Found non-basketball events in basketball filter")
                    else:
                        self.log_test("Get Events by Sport", True, "No basketball events found (acceptable)")
                        return True
                else:
                    self.log_test("Get Events by Sport", False, f"Invalid response format")
            else:
                self.log_test("Get Events by Sport", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Events by Sport", False, f"Exception: {str(e)}")
        return False
        
    def test_get_event_by_id(self, events):
        """Test GET /api/events/{event_id} endpoint"""
        if not events or len(events) == 0:
            self.log_test("Get Event by ID", False, "No events available to test")
            return False
            
        try:
            event_id = events[0]["id"]
            response = self.session.get(f"{self.base_url}/events/{event_id}")
            if response.status_code == 200:
                event = response.json()
                if event.get("id") == event_id:
                    self.log_test("Get Event by ID", True, f"Retrieved event: {event.get('title')}")
                    return True
                else:
                    self.log_test("Get Event by ID", False, f"Event ID mismatch")
            else:
                self.log_test("Get Event by ID", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Event by ID", False, f"Exception: {str(e)}")
        return False
        
    def test_cart_operations(self, events):
        """Test cart CRUD operations"""
        if not events or len(events) == 0:
            self.log_test("Cart Operations", False, "No events available for cart testing")
            return False
            
        try:
            # Test adding item to cart
            event = events[0]
            cart_item = {
                "user_id": self.test_user_id,
                "event_id": event["id"],
                "event_title": event["title"],
                "event_date": event["date"],
                "event_venue": event["venue"],
                "event_image": event.get("image", "https://example.com/img.jpg"),
                "section_id": "lower",
                "section_name": "Lower Bowl",
                "price": 100,
                "quantity": 2
            }
            
            # POST /api/cart
            response = self.session.post(f"{self.base_url}/cart", json=cart_item)
            if response.status_code != 200:
                self.log_test("Cart Add Item", False, f"Failed to add item. Status: {response.status_code}")
                return False
                
            added_item = response.json()
            item_id = added_item.get("id")
            
            # GET /api/cart/{user_id}
            response = self.session.get(f"{self.base_url}/cart/{self.test_user_id}")
            if response.status_code == 200:
                cart_items = response.json()
                if len(cart_items) > 0 and cart_items[0].get("id") == item_id:
                    self.log_test("Cart Get Items", True, f"Found {len(cart_items)} items in cart")
                else:
                    self.log_test("Cart Get Items", False, f"Cart item not found or ID mismatch")
                    return False
            else:
                self.log_test("Cart Get Items", False, f"Status code: {response.status_code}")
                return False
                
            # DELETE /api/cart/{item_id}
            response = self.session.delete(f"{self.base_url}/cart/{item_id}")
            if response.status_code == 200:
                self.log_test("Cart Remove Item", True, "Item removed successfully")
                return True
            else:
                self.log_test("Cart Remove Item", False, f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("Cart Operations", False, f"Exception: {str(e)}")
        return False
        
    def test_order_operations(self):
        """Test order creation and retrieval"""
        try:
            # Create order
            order_data = {
                "user_id": self.test_user_id,
                "items": [
                    {
                        "eventTitle": "Test Basketball Game",
                        "quantity": 2,
                        "pricePerTicket": 75
                    }
                ],
                "total": 150
            }
            
            # POST /api/orders
            response = self.session.post(f"{self.base_url}/orders", json=order_data)
            if response.status_code != 200:
                self.log_test("Order Creation", False, f"Failed to create order. Status: {response.status_code}")
                return False
                
            order = response.json()
            order_id = order.get("id")
            
            # GET /api/orders/{user_id}
            response = self.session.get(f"{self.base_url}/orders/{self.test_user_id}")
            if response.status_code == 200:
                orders = response.json()
                if len(orders) > 0 and orders[0].get("id") == order_id:
                    self.log_test("Order Operations", True, f"Created and retrieved order successfully")
                    return True
                else:
                    self.log_test("Order Operations", False, f"Order not found in user orders")
            else:
                self.log_test("Order Operations", False, f"Failed to get orders. Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Order Operations", False, f"Exception: {str(e)}")
        return False
        
    def test_favorites_operations(self, events):
        """Test favorites CRUD operations"""
        if not events or len(events) == 0:
            self.log_test("Favorites Operations", False, "No events available for favorites testing")
            return False
            
        try:
            event_id = events[0]["id"]
            
            # POST /api/favorites
            favorite_data = {
                "user_id": self.test_user_id,
                "event_id": event_id
            }
            
            response = self.session.post(f"{self.base_url}/favorites", json=favorite_data)
            if response.status_code != 200:
                self.log_test("Favorites Add", False, f"Failed to add favorite. Status: {response.status_code}")
                return False
                
            # GET /api/favorites/{user_id}
            response = self.session.get(f"{self.base_url}/favorites/{self.test_user_id}")
            if response.status_code == 200:
                favorites = response.json()
                if len(favorites) > 0 and favorites[0].get("event_id") == event_id:
                    self.log_test("Favorites Operations", True, f"Added and retrieved favorite successfully")
                    return True
                else:
                    self.log_test("Favorites Operations", False, f"Favorite not found")
            else:
                self.log_test("Favorites Operations", False, f"Failed to get favorites. Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Favorites Operations", False, f"Exception: {str(e)}")
        return False
        
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting SportTix API Tests")
        print(f"📍 API Base URL: {self.base_url}")
        print(f"👤 Test User ID: {self.test_user_id}")
        print("=" * 60)
        
        # Test 1: Health Check
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
            
        # Test 2: Get Sports
        self.test_get_sports()
        
        # Test 3: Get Events
        events = self.test_get_events()
        
        # Test 4: Get Events by Sport
        self.test_get_events_by_sport()
        
        # Test 5: Get Event by ID
        if events:
            self.test_get_event_by_id(events)
            
        # Test 6: Cart Operations
        if events:
            self.test_cart_operations(events)
            
        # Test 7: Order Operations
        self.test_order_operations()
        
        # Test 8: Favorites Operations
        if events:
            self.test_favorites_operations(events)
            
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
    tester = SportTixAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()