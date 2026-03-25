import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carsApi, servicesApi } from '../services/api';
import { 
  ArrowLeft, Edit, Plus, Wrench, Calendar, 
  Gauge, Fuel, Loader2, Trash2, Car, Settings, TrendingUp
} from 'lucide-react';

const SERVICE_TYPES = {
  oil: { label: 'Výměna oleje', icon: '🛢️', color: 'from-yellow-500 to-amber-600' },
  stk: { label: 'STK / Emise', icon: '📋', color: 'from-blue-500 to-blue-600' },
  tires: { label: 'Pneumatiky', icon: '🔘', color: 'from-gray-500 to-gray-600' },
  brakes: { label: 'Brzdy', icon: '🛑', color: 'from-red-500 to-red-600' },
  other: { label: 'Ostatní', icon: '🔧', color: 'from-purple-500 to-purple-600' }
};

export const CarDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('car_garage_token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('car_garage_token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const [carData, servicesData, statsData] = await Promise.all([
        carsApi.get(id),
        servicesApi.getAll(id),
        carsApi.getStats(id)
      ]);
      setCar(carData);
      setServices(servicesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading car:', err);
      // If car not found (likely belongs to different user), go to dashboard
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Smazat tento servisní záznam?')) return;
    try {
      const token = localStorage.getItem('car_garage_token');
      if (!token) {
        alert('Nejste přihlášeni. Přihlaste se znovu.');
        window.location.href = '/login';
        return;
      }
      
      const API_URL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
        const statsData = await carsApi.getStats(id);
        setStats(statsData);
      } else if (response.status === 401) {
        alert('Vaše přihlášení vypršelo. Přihlaste se znovu.');
        localStorage.removeItem('car_garage_token');
        localStorage.removeItem('car_garage_user');
        window.location.href = '/login';
      } else if (response.status === 404) {
        alert('Záznam nebyl nalezen. Možná byl již smazán.');
        setServices(prev => prev.filter(s => s.id !== serviceId));
      } else {
        alert('Nepodařilo se smazat záznam. Zkuste to znovu.');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Chyba připojení. Zkuste to znovu.');
    }
  };

  const handleDeleteCar = async () => {
    if (!window.confirm('Opravdu chcete smazat toto vozidlo?\n\nVšechny servisní záznamy budou také smazány.')) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('car_garage_token');
      
      if (!token) {
        alert('Nejste přihlášeni. Přihlaste se znovu.');
        window.location.href = '/login';
        return;
      }
      
      const API_URL = process.env.REACT_APP_BACKEND_URL || '';
      
      const response = await fetch(`${API_URL}/api/cars/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('Vozidlo bylo úspěšně smazáno!');
        // Use setTimeout to ensure alert is closed before redirect
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          alert('Vaše přihlášení vypršelo. Přihlaste se znovu.');
          localStorage.removeItem('car_garage_token');
          localStorage.removeItem('car_garage_user');
          setTimeout(() => {
            window.location.replace('/login');
          }, 100);
        } else if (response.status === 404) {
          alert('Vozidlo nebylo nalezeno. Možná bylo již smazáno.');
          setTimeout(() => {
            window.location.replace('/dashboard');
          }, 100);
        } else {
          alert('Nepodařilo se smazat vozidlo. Zkuste to znovu.');
          setDeleting(false);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Chyba připojení. Zkuste to znovu.');
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('cs-CZ');
  };

  const formatMileage = (km) => {
    if (!km) return '-';
    return `${km.toLocaleString('cs-CZ')} km`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[rgb(var(--primary))] mx-auto mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Načítám vozidlo...</p>
        </div>
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[rgb(var(--primary))] to-orange-600 pt-4 pb-32 px-4">
        <div className="max-w-lg mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/car/${id}/edit`)}
                className="p-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-colors"
              >
                <Edit className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleDeleteCar}
                disabled={deleting}
                className="p-2 bg-white/20 backdrop-blur rounded-xl hover:bg-red-500/80 transition-colors"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Car Title */}
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold">{car.brand} {car.model}</h1>
            <p className="text-white/80">{car.year} {car.license_plate && `• ${car.license_plate}`}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 -mt-24">
        {/* Car Card */}
        <div className="bg-[rgb(var(--card))] rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-1 p-4">
            <div className="text-center p-3 bg-[rgb(var(--secondary))] rounded-xl">
              <Gauge className="w-5 h-5 mx-auto mb-1 text-[rgb(var(--primary))]" />
              <p className="text-sm font-bold">{car.power_hp || '-'}</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">HP</p>
            </div>
            <div className="text-center p-3 bg-[rgb(var(--secondary))] rounded-xl">
              <Fuel className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs font-bold">{car.fuel_type || '-'}</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">Palivo</p>
            </div>
            <div className="text-center p-3 bg-[rgb(var(--secondary))] rounded-xl">
              <Settings className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs font-bold">{car.transmission ? car.transmission.substring(0, 5) : '-'}</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">Převod.</p>
            </div>
            <div className="text-center p-3 bg-[rgb(var(--secondary))] rounded-xl">
              <Car className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-xs font-bold">{car.mileage ? `${Math.round(car.mileage/1000)}k` : '-'}</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">km</p>
            </div>
          </div>

          {/* Body Type Badge */}
          {car.body_type && (
            <div className="px-4 pb-4">
              <span className="inline-block px-3 py-1 bg-[rgb(var(--secondary))] rounded-full text-sm">
                {car.body_type}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-[rgb(var(--card))] rounded-2xl p-1 mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'services'
                  ? 'bg-[rgb(var(--primary))] text-white'
                  : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))]'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Servis
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'costs'
                  ? 'bg-[rgb(var(--primary))] text-white'
                  : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Náklady
            </button>
          </div>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Servisní záznamy</h2>
              <button
                onClick={() => navigate(`/car/${id}/service/new`)}
                className="flex items-center gap-1 px-3 py-2 bg-[rgb(var(--primary))] text-white rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Přidat
              </button>
            </div>

            {/* Services List */}
            {services.length === 0 ? (
              <div className="bg-[rgb(var(--card))] rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgb(var(--secondary))] flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-[rgb(var(--muted-foreground))]" />
                </div>
                <h3 className="font-semibold mb-2">Žádné záznamy</h3>
                <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
                  Zatím nemáte žádné servisní záznamy
                </p>
                <button
                  onClick={() => navigate(`/car/${id}/service/new`)}
                  className="px-6 py-2 bg-[rgb(var(--primary))] text-white rounded-xl font-medium"
                >
                  Přidat první záznam
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => {
                  const typeInfo = SERVICE_TYPES[service.service_type] || SERVICE_TYPES.other;
                  return (
                    <div
                      key={service.id}
                      className="bg-[rgb(var(--card))] rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center text-xl flex-shrink-0`}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{typeInfo.label}</p>
                              <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted-foreground))] mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(service.date)}
                                </span>
                                {service.mileage && (
                                  <span>{formatMileage(service.mileage)}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[rgb(var(--primary))]">
                                {formatCurrency(service.cost)}
                              </p>
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="mt-1 p-1 text-[rgb(var(--muted-foreground))] hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {service.note && (
                            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2 bg-[rgb(var(--secondary))] rounded-lg p-2">
                              {service.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && stats && (
          <div className="space-y-4 pb-8">
            {/* Total Cost Card */}
            <div className="bg-gradient-to-br from-[rgb(var(--primary))] to-orange-600 rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm mb-1">Celkové náklady</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.total_cost)}</p>
              <p className="text-white/60 text-sm mt-2">
                {stats.total_services} servisních záznamů
              </p>
            </div>

            {/* Costs by Category */}
            {Object.keys(stats.costs_by_type || {}).length > 0 && (
              <div className="bg-[rgb(var(--card))] rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Náklady podle kategorie</h3>
                <div className="space-y-4">
                  {Object.entries(stats.costs_by_type).map(([type, cost]) => {
                    const typeInfo = SERVICE_TYPES[type] || SERVICE_TYPES.other;
                    const percentage = stats.total_cost > 0 ? (cost / stats.total_cost) * 100 : 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-2 text-sm">
                            <span className="text-lg">{typeInfo.icon}</span>
                            {typeInfo.label}
                          </span>
                          <span className="font-semibold">{formatCurrency(cost)}</span>
                        </div>
                        <div className="h-2 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${typeInfo.color} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Last Service */}
            {stats.last_service && (
              <div className="bg-[rgb(var(--card))] rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--secondary))] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
                  </div>
                  <div>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">Poslední servis</p>
                    <p className="font-semibold">{formatDate(stats.last_service)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
