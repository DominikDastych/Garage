const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const getToken = () => {
  const token = localStorage.getItem('car_garage_token');
  console.log('Getting token, exists:', !!token);
  return token;
};

const headers = () => {
  const token = getToken();
  if (!token) {
    console.warn('No auth token found in headers()');
  }
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    // Token expired or invalid - clear storage
    console.warn('Authentication failed - token may be expired');
  }
  return res;
};

export const authApi = {
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

  async getMe() {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get user');
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${API_URL}/api/auth/settings`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get settings');
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_URL}/api/auth/settings`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};

export const carsApi = {
  async search(make, model, year) {
    const params = new URLSearchParams({ make });
    if (model) params.append('model', model);
    if (year) params.append('year', year);
    
    const res = await fetch(`${API_URL}/api/cars/search?${params}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getMakes() {
    const res = await fetch(`${API_URL}/api/cars/makes`);
    if (!res.ok) return { makes: [] };
    return res.json();
  },

  async getModels(make) {
    const res = await fetch(`${API_URL}/api/cars/models/${encodeURIComponent(make)}`);
    if (!res.ok) return { models: [] };
    return res.json();
  },

  async getSpecs(make, model, year) {
    const params = new URLSearchParams({ make, model });
    if (year) params.append('year', year);
    
    const res = await fetch(`${API_URL}/api/cars/specs?${params}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getImage(make, model) {
    const params = new URLSearchParams({ make, model });
    const res = await fetch(`${API_URL}/api/cars/image?${params}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getAll() {
    const res = await fetch(`${API_URL}/api/cars`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get cars');
    return res.json();
  },

  async get(id) {
    const res = await fetch(`${API_URL}/api/cars/${id}`, { headers: headers() });
    if (!res.ok) throw new Error('Car not found');
    return res.json();
  },

  async create(carData) {
    const res = await fetch(`${API_URL}/api/cars`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(carData)
    });
    if (!res.ok) throw new Error('Failed to create car');
    return res.json();
  },

  async update(id, carData) {
    const res = await fetch(`${API_URL}/api/cars/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(carData)
    });
    if (!res.ok) throw new Error('Failed to update car');
    return res.json();
  },

  async delete(id) {
    const token = getToken();
    
    if (!token) {
      console.error('API: No auth token found');
      throw new Error('Not authenticated');
    }
    
    console.log('API: Deleting car', id);
    console.log('API: Token exists:', !!token);
    
    const res = await fetch(`${API_URL}/api/cars/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API: Delete response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API: Delete error:', errorText);
      throw new Error(`Failed to delete car: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('API: Delete success:', data);
    return data;
  },

  async getStats(id) {
    const res = await fetch(`${API_URL}/api/cars/${id}/stats`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get stats');
    return res.json();
  }
};

export const servicesApi = {
  async getAll(carId) {
    const res = await fetch(`${API_URL}/api/cars/${carId}/services`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get services');
    return res.json();
  },

  async create(carId, serviceData) {
    const res = await fetch(`${API_URL}/api/cars/${carId}/services`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ car_id: carId, ...serviceData })
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json();
  },

  async update(recordId, serviceData) {
    const res = await fetch(`${API_URL}/api/services/${recordId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(serviceData)
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async delete(recordId) {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const res = await fetch(`${API_URL}/api/services/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error('Delete service error:', error);
      throw new Error('Failed to delete service');
    }
    return res.json();
  }
};

export const statsApi = {
  async getAll() {
    const res = await fetch(`${API_URL}/api/stats`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to get stats');
    return res.json();
  }
};
