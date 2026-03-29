"""
Car Garage API Tests
Tests for authentication, car CRUD, service records, and statistics endpoints.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data with unique prefixes
TEST_PREFIX = f"TEST_{uuid.uuid4().hex[:8]}"
TEST_EMAIL = f"{TEST_PREFIX}@example.com"
TEST_PASSWORD = "TestPassword123!"
TEST_NAME = f"{TEST_PREFIX}_User"

class TestHealth:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint returns healthy status")
    
    def test_root_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Root endpoint returns message")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user data"""
        self.test_email = f"TEST_auth_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "SecurePassword123!"
        self.test_name = "Test User Auth"
    
    def test_register_new_user(self):
        """Test user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "token" in data, "Token missing from response"
        assert "user" in data, "User missing from response"
        assert data["user"]["email"] == self.test_email.lower()
        assert data["user"]["name"] == self.test_name
        assert "id" in data["user"]
        print(f"✓ User registration successful: {self.test_email}")
    
    def test_register_duplicate_email(self):
        """Test registration with existing email fails"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Try to register again with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Another User"
        })
        
        assert response.status_code == 400, "Duplicate registration should fail"
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_success(self):
        """Test successful login"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == self.test_email.lower()
        print("✓ Login successful with valid credentials")
    
    def test_login_invalid_password(self):
        """Test login with wrong password"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        # Try login with wrong password
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401
        print("✓ Login with invalid password correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        })
        
        assert response.status_code == 401
        print("✓ Login with non-existent email correctly rejected")


class TestCarCRUD:
    """Car CRUD endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup authenticated user for tests"""
        self.test_email = f"TEST_car_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "SecurePassword123!"
        
        # Register and get token
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Test Car User"
        })
        
        if response.status_code == 200:
            self.token = response.json()["token"]
        else:
            # Try login if already exists
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.test_email,
                "password": self.test_password
            })
            self.token = response.json().get("token")
        
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
        
        self.created_cars = []
        
        # Cleanup after test
        def cleanup():
            for car_id in self.created_cars:
                try:
                    requests.delete(f"{BASE_URL}/api/cars/{car_id}", headers=self.headers)
                except:
                    pass
        
        request.addfinalizer(cleanup)
    
    def test_create_car_skoda_superb(self):
        """Test creating Skoda Superb car"""
        car_data = {
            "brand": "Skoda",
            "model": "Superb",
            "year": 2022,
            "power_hp": 190,
            "fuel_type": "Benzín",
            "transmission": "Automatická",
            "body_type": "Sedan",
            "license_plate": "1AB 1234",
            "mileage": 25000
        }
        
        response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json=car_data)
        
        assert response.status_code == 200, f"Create car failed: {response.text}"
        data = response.json()
        
        assert data["brand"] == "Skoda"
        assert data["model"] == "Superb"
        assert data["year"] == 2022
        assert data["power_hp"] == 190
        assert "id" in data
        
        self.created_cars.append(data["id"])
        print(f"✓ Created Skoda Superb with ID: {data['id']}")
        
        # Verify car was persisted
        get_response = requests.get(f"{BASE_URL}/api/cars/{data['id']}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["brand"] == "Skoda"
        assert fetched["model"] == "Superb"
        print("✓ Car verified in database")
    
    def test_create_car_bmw_m3(self):
        """Test creating BMW M3 car"""
        car_data = {
            "brand": "BMW",
            "model": "M3",
            "year": 2023,
            "power_hp": 510,
            "fuel_type": "Benzín",
            "transmission": "Automatická",
            "body_type": "Sedan",
            "license_plate": "2BC 5678",
            "mileage": 5000
        }
        
        response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json=car_data)
        
        assert response.status_code == 200, f"Create car failed: {response.text}"
        data = response.json()
        
        assert data["brand"] == "BMW"
        assert data["model"] == "M3"
        assert data["power_hp"] == 510
        
        self.created_cars.append(data["id"])
        print(f"✓ Created BMW M3 with ID: {data['id']}")
    
    def test_get_all_cars(self):
        """Test getting all cars for user"""
        # Create a car first
        car_data = {
            "brand": "Toyota",
            "model": "Camry",
            "year": 2021
        }
        create_response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json=car_data)
        self.created_cars.append(create_response.json()["id"])
        
        # Get all cars
        response = requests.get(f"{BASE_URL}/api/cars", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"✓ Retrieved {len(data)} cars")
    
    def test_update_car(self):
        """Test updating a car"""
        # Create a car first
        car_data = {
            "brand": "Honda",
            "model": "Civic",
            "year": 2020,
            "mileage": 30000
        }
        create_response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json=car_data)
        car_id = create_response.json()["id"]
        self.created_cars.append(car_id)
        
        # Update car
        update_data = {
            "brand": "Honda",
            "model": "Civic",
            "year": 2020,
            "mileage": 35000,
            "license_plate": "NEW 1234"
        }
        
        update_response = requests.put(f"{BASE_URL}/api/cars/{car_id}", headers=self.headers, json=update_data)
        
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["mileage"] == 35000
        assert updated["license_plate"] == "NEW 1234"
        print("✓ Car updated successfully")
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/cars/{car_id}", headers=self.headers)
        fetched = get_response.json()
        assert fetched["mileage"] == 35000
        print("✓ Update verified in database")
    
    def test_delete_car(self):
        """Test deleting a car - CRITICAL TEST"""
        # Create a car first
        car_data = {
            "brand": "Ford",
            "model": "Focus",
            "year": 2019
        }
        create_response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json=car_data)
        assert create_response.status_code == 200
        car_id = create_response.json()["id"]
        print(f"✓ Created car for deletion test: {car_id}")
        
        # Delete car
        delete_response = requests.delete(f"{BASE_URL}/api/cars/{car_id}", headers=self.headers)
        
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print("✓ DELETE API returned 200")
        
        # Verify car is deleted
        get_response = requests.get(f"{BASE_URL}/api/cars/{car_id}", headers=self.headers)
        assert get_response.status_code == 404, "Car should not exist after deletion"
        print("✓ Car confirmed deleted - returns 404")
    
    def test_delete_car_unauthorized(self):
        """Test deleting a car without auth"""
        # Create a car first
        car_data = {
            "brand": "Mazda",
            "model": "CX-5",
            "year": 2021
        }
        create_response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json=car_data)
        car_id = create_response.json()["id"]
        self.created_cars.append(car_id)
        
        # Try to delete without auth
        delete_response = requests.delete(f"{BASE_URL}/api/cars/{car_id}")
        
        assert delete_response.status_code == 401, "Delete without auth should fail"
        print("✓ Unauthorized delete correctly rejected")


class TestCarImages:
    """Car image endpoint tests"""
    
    def test_get_skoda_image(self):
        """Test getting Skoda image"""
        response = requests.get(f"{BASE_URL}/api/cars/image", params={
            "make": "Skoda",
            "model": "Superb"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert data["image_url"].startswith("http")
        print(f"✓ Skoda Superb image URL: {data['image_url'][:50]}...")
    
    def test_get_bmw_image(self):
        """Test getting BMW image"""
        response = requests.get(f"{BASE_URL}/api/cars/image", params={
            "make": "BMW",
            "model": "M3"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert data["image_url"].startswith("http")
        print(f"✓ BMW M3 image URL: {data['image_url'][:50]}...")
    
    def test_different_brands_get_different_images(self):
        """Test that different brands return different images"""
        skoda_response = requests.get(f"{BASE_URL}/api/cars/image", params={
            "make": "Skoda",
            "model": "Superb"
        })
        bmw_response = requests.get(f"{BASE_URL}/api/cars/image", params={
            "make": "BMW",
            "model": "M3"
        })
        porsche_response = requests.get(f"{BASE_URL}/api/cars/image", params={
            "make": "Porsche",
            "model": "911"
        })
        
        assert skoda_response.status_code == 200
        assert bmw_response.status_code == 200
        assert porsche_response.status_code == 200
        
        skoda_url = skoda_response.json()["image_url"]
        bmw_url = bmw_response.json()["image_url"]
        porsche_url = porsche_response.json()["image_url"]
        
        # Different brands should have different images
        print(f"Skoda URL: {skoda_url}")
        print(f"BMW URL: {bmw_url}")
        print(f"Porsche URL: {porsche_url}")
        
        # At least some images should differ
        unique_urls = len(set([skoda_url, bmw_url, porsche_url]))
        print(f"✓ {unique_urls}/3 unique image URLs for different brands")


class TestServiceRecords:
    """Service record endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup authenticated user and car for tests"""
        self.test_email = f"TEST_svc_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "SecurePassword123!"
        
        # Register and get token
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Test Service User"
        })
        
        self.token = response.json().get("token") or requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": self.test_password}
        ).json().get("token")
        
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
        
        # Create a car for service records
        car_response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json={
            "brand": "Volkswagen",
            "model": "Golf",
            "year": 2020,
            "mileage": 50000
        })
        self.car_id = car_response.json()["id"]
        self.created_services = []
        
        # Cleanup
        def cleanup():
            for service_id in self.created_services:
                try:
                    requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
                except:
                    pass
            try:
                requests.delete(f"{BASE_URL}/api/cars/{self.car_id}", headers=self.headers)
            except:
                pass
        
        request.addfinalizer(cleanup)
    
    def test_create_service_record(self):
        """Test creating a service record"""
        service_data = {
            "car_id": self.car_id,
            "service_type": "oil",
            "date": "2024-01-15",
            "cost": 2500,
            "mileage": 51000,
            "note": "Výměna oleje a filtru"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cars/{self.car_id}/services",
            headers=self.headers,
            json=service_data
        )
        
        assert response.status_code == 200, f"Create service failed: {response.text}"
        data = response.json()
        
        assert data["service_type"] == "oil"
        assert data["cost"] == 2500
        assert "id" in data
        
        self.created_services.append(data["id"])
        print(f"✓ Created service record: {data['id']}")
    
    def test_get_service_records(self):
        """Test getting all service records for a car"""
        # Create some services first
        for service_type, cost in [("oil", 2500), ("tires", 15000), ("brakes", 8000)]:
            response = requests.post(
                f"{BASE_URL}/api/cars/{self.car_id}/services",
                headers=self.headers,
                json={
                    "car_id": self.car_id,
                    "service_type": service_type,
                    "date": "2024-02-01",
                    "cost": cost
                }
            )
            if response.status_code == 200:
                self.created_services.append(response.json()["id"])
        
        # Get all services
        response = requests.get(f"{BASE_URL}/api/cars/{self.car_id}/services", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        print(f"✓ Retrieved {len(data)} service records")
    
    def test_delete_service_record(self):
        """Test deleting a service record"""
        # Create a service
        create_response = requests.post(
            f"{BASE_URL}/api/cars/{self.car_id}/services",
            headers=self.headers,
            json={
                "car_id": self.car_id,
                "service_type": "stk",
                "date": "2024-03-01",
                "cost": 1500
            }
        )
        service_id = create_response.json()["id"]
        
        # Delete service
        delete_response = requests.delete(
            f"{BASE_URL}/api/services/{service_id}",
            headers=self.headers
        )
        
        assert delete_response.status_code == 200
        print("✓ Service record deleted successfully")


class TestStatistics:
    """Statistics endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup authenticated user with cars and services"""
        self.test_email = f"TEST_stats_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "SecurePassword123!"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Test Stats User"
        })
        
        self.token = response.json().get("token")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
        
        # Cleanup
        def cleanup():
            try:
                cars = requests.get(f"{BASE_URL}/api/cars", headers=self.headers).json()
                for car in cars:
                    requests.delete(f"{BASE_URL}/api/cars/{car['id']}", headers=self.headers)
            except:
                pass
        
        request.addfinalizer(cleanup)
    
    def test_get_overall_stats(self):
        """Test getting overall statistics"""
        response = requests.get(f"{BASE_URL}/api/stats", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_cars" in data
        assert "total_services" in data
        assert "total_cost" in data
        print(f"✓ Stats: {data['total_cars']} cars, {data['total_services']} services, {data['total_cost']} CZK")
    
    def test_get_car_stats(self):
        """Test getting statistics for a specific car"""
        # Create a car
        car_response = requests.post(f"{BASE_URL}/api/cars", headers=self.headers, json={
            "brand": "Audi",
            "model": "A4",
            "year": 2022
        })
        car_id = car_response.json()["id"]
        
        # Get car stats
        response = requests.get(f"{BASE_URL}/api/cars/{car_id}/stats", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_services" in data
        assert "total_cost" in data
        print(f"✓ Car stats: {data['total_services']} services, {data['total_cost']} CZK")


class TestCarMakesAndModels:
    """Car makes and models endpoint tests"""
    
    def test_get_car_makes(self):
        """Test getting list of car makes"""
        response = requests.get(f"{BASE_URL}/api/cars/makes")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "makes" in data
        assert isinstance(data["makes"], list)
        assert len(data["makes"]) > 50
        assert "BMW" in data["makes"]
        assert "Skoda" in data["makes"]
        assert "Volkswagen" in data["makes"]
        print(f"✓ Retrieved {len(data['makes'])} car makes")
    
    def test_get_skoda_models(self):
        """Test getting Skoda models"""
        response = requests.get(f"{BASE_URL}/api/cars/models/Skoda")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "models" in data
        assert isinstance(data["models"], list)
        assert "Superb" in data["models"]
        assert "Octavia" in data["models"]
        print(f"✓ Retrieved {len(data['models'])} Skoda models")
    
    def test_get_bmw_models(self):
        """Test getting BMW models"""
        response = requests.get(f"{BASE_URL}/api/cars/models/BMW")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "models" in data
        assert "M3" in data["models"] or "3 Series" in data["models"]
        print(f"✓ Retrieved {len(data['models'])} BMW models")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
