// ============================================
// API.JS - Komunikace s backendem
// ============================================
// Tento soubor obsahuje všechny funkce pro volání REST API

// URL backendu (z .env souboru)
const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Získá JWT token z localStorage
const getToken = () => {
  return localStorage.getItem('car_garage_token');
};

// Vytvoří hlavičky pro HTTP požadavky (včetně autorizace)
const headers = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ============================================
// AUTENTIZACE
// ============================================
export const authApi = {
  // Registrace nového uživatele
  async register(email, password, name) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Registration failed');
    }
    return res.json();
  },

  // Přihlášení uživatele
  async login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Login failed');
    }
    return res.json();
  },

  // Získá info o přihlášeném uživateli
  async getMe() {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get user');
    return res.json();
  }
};

// ============================================
// VOZIDLA (CRUD operace)
// ============================================
export const carsApi = {
  // Získá seznam značek aut
  async getMakes() {
    const res = await fetch(`${API_URL}/api/cars/makes`);
    if (!res.ok) return { makes: [] };
    return res.json();
  },

  // Získá modely pro danou značku
  async getModels(make) {
    const res = await fetch(`${API_URL}/api/cars/models/${encodeURIComponent(make)}`);
    if (!res.ok) return { models: [] };
    return res.json();
  },

  // Získá všechna auta uživatele
  async getAll() {
    const res = await fetch(`${API_URL}/api/cars`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get cars');
    return res.json();
  },

  // Získá detail jednoho auta
  async get(id) {
    const res = await fetch(`${API_URL}/api/cars/${id}`, { headers: headers() });
    if (!res.ok) throw new Error('Car not found');
    return res.json();
  },

  // Vytvoří nové auto
  async create(carData) {
    const res = await fetch(`${API_URL}/api/cars`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(carData)
    });
    if (!res.ok) throw new Error('Failed to create car');
    return res.json();
  },

  // Aktualizuje auto
  async update(id, carData) {
    const res = await fetch(`${API_URL}/api/cars/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(carData)
    });
    if (!res.ok) throw new Error('Failed to update car');
    return res.json();
  },

  // Smaže auto
  async delete(id) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_URL}/api/cars/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('Failed to delete car');
    return res.json();
  },

  // Získá statistiky pro auto
  async getStats(id) {
    const res = await fetch(`${API_URL}/api/cars/${id}/stats`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get stats');
    return res.json();
  }
};

// ============================================
// SERVISNÍ ZÁZNAMY
// ============================================
export const servicesApi = {
  // Získá všechny servisy pro auto
  async getAll(carId) {
    const res = await fetch(`${API_URL}/api/cars/${carId}/services`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get services');
    return res.json();
  },

  // Vytvoří nový servisní záznam
  async create(carId, serviceData) {
    const res = await fetch(`${API_URL}/api/cars/${carId}/services`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ car_id: carId, ...serviceData })
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json();
  },

  // Smaže servisní záznam
  async delete(recordId) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_URL}/api/services/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('Failed to delete service');
    return res.json();
  }
};

// ============================================
// STATISTIKY
// ============================================
export const statsApi = {
  // Získá celkové statistiky uživatele
  async getAll() {
    const res = await fetch(`${API_URL}/api/stats`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get stats');
    return res.json();
  }
};
