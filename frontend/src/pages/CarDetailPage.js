import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carsApi, servicesApi } from '../services/api';
import { 
  ArrowLeft, Edit, Plus, Wrench, Calendar, DollarSign, 
  Gauge, Fuel, Loader2, Trash2, Car 
} from 'lucide-react';

const SERVICE_TYPES = {
  oil: { label: 'Výměna oleje', icon: '🛢️', color: 'bg-yellow-500' },
  stk: { label: 'STK', icon: '📝', color: 'bg-blue-500' },
  tires: { label: 'Pneumatiky', icon: '🛞', color: 'bg-gray-500' },
  brakes: { label: 'Brzdy', icon: '⛔', color: 'bg-red-500' },
  other: { label: 'Ostatní', icon: '🔧', color: 'bg-purple-500' }
};

const CAR_IMAGES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
];

export const CarDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
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
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Smazat tento záznam?')) return;
    try {
      await servicesApi.delete(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      // Reload stats
      const statsData = await carsApi.getStats(id);
      setStats(statsData);
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const handleDeleteCar = async () => {
    if (!window.confirm('Opravdu chcete smazat toto vozidlo? Všechny servisní záznamy budou také smazány. Tato akce je nevratná.')) return;
    try {
      await carsApi.delete(id);
      alert('Vozidlo bylo úspěšně smazáno');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting car:', err);
      alert('Nepodařilo se smazat vozidlo. Zkuste to znovu.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('cs-CZ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] pb-6">
      {/* Hero Image */}
      <div className="relative h-64">
        <img
          src={car.image || CAR_IMAGES[0]}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = CAR_IMAGES[0]; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        
        {/* Edit Button */}
        <button
          onClick={() => navigate(`/car/${id}/edit`)}
          className="absolute top-4 right-14 p-2 bg-black/40 backdrop-blur rounded-full"
        >
          <Edit className="w-5 h-5 text-white" />
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDeleteCar}
          className="absolute top-4 right-4 p-2 bg-red-500/80 backdrop-blur rounded-full"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>

        {/* Car Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-2xl font-bold text-white">{car.brand} {car.model}</h1>
          <p className="text-white/70">{car.year} {car.license_plate && `• ${car.license_plate}`}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-md mx-auto px-6 -mt-6">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[rgb(var(--card))] rounded-xl p-3 text-center shadow-lg">
            <Gauge className="w-5 h-5 mx-auto mb-1 text-[rgb(var(--primary))]" />
            <p className="text-sm font-bold">{car.power_hp || '-'}</p>
            <p className="text-xs text-[rgb(var(--muted-foreground)))]">HP</p>
          </div>
          <div className="bg-[rgb(var(--card))] rounded-xl p-3 text-center shadow-lg">
            <Fuel className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xs font-bold">{car.fuel_type || '-'}</p>
            <p className="text-xs text-[rgb(var(--muted-foreground)))]">Palivo</p>
          </div>
          <div className="bg-[rgb(var(--card))] rounded-xl p-3 text-center shadow-lg">
            <Car className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs font-bold">{car.transmission?.slice(0,4) || '-'}</p>
            <p className="text-xs text-[rgb(var(--muted-foreground)))]">Převod.</p>
          </div>
          <div className="bg-[rgb(var(--card))] rounded-xl p-3 text-center shadow-lg">
            <Gauge className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xs font-bold">{car.mileage ? `${(car.mileage / 1000).toFixed(0)}k` : '-'}</p>
            <p className="text-xs text-[rgb(var(--muted-foreground)))]">km</p>
          </div>
        </div>
        
        {/* Body type badge */}
        {car.body_type && (
          <div className="mt-3 flex justify-center">
            <span className="px-3 py-1 bg-[rgb(var(--secondary))] rounded-full text-sm">
              {car.body_type}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-6 mt-6">
        <div className="flex bg-[rgb(var(--secondary))] rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2 rounded-md font-medium transition-all ${
              activeTab === 'services'
                ? 'bg-[rgb(var(--card))] shadow'
                : 'text-[rgb(var(--muted-foreground))]'
            }`}
          >
            Servis
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`flex-1 py-2 rounded-md font-medium transition-all ${
              activeTab === 'costs'
                ? 'bg-[rgb(var(--card))] shadow'
                : 'text-[rgb(var(--muted-foreground))]'
            }`}
          >
            Náklady
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Servisní záznamy</h2>
              <button
                onClick={() => navigate(`/car/${id}/service/new`)}
                className="flex items-center gap-1 text-sm text-[rgb(var(--primary))] font-medium"
              >
                <Plus className="w-4 h-4" />
                Přidat
              </button>
            </div>

            {services.length === 0 ? (
              <div className="bg-[rgb(var(--card))] rounded-xl p-6 text-center">
                <Wrench className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--muted-foreground))]" />
                <p className="text-[rgb(var(--muted-foreground))]">Zatím žádné záznamy</p>
                <button
                  onClick={() => navigate(`/car/${id}/service/new`)}
                  className="mt-3 px-4 py-2 bg-[rgb(var(--primary))] text-white rounded-lg text-sm font-medium"
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
                      className="bg-[rgb(var(--card))] rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className={`w-12 h-12 ${typeInfo.color} rounded-xl flex items-center justify-center text-xl`}>
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{typeInfo.label}</p>
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
                          <Calendar className="w-3 h-3" />
                          {formatDate(service.date)}
                          {service.mileage && (
                            <span>• {service.mileage.toLocaleString()} km</span>
                          )}
                        </div>
                        {service.note && (
                          <p className="text-xs text-[rgb(var(--muted-foreground))] truncate mt-1">{service.note}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[rgb(var(--primary))]">
                          {formatCurrency(service.cost)}
                        </p>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-[rgb(var(--muted-foreground))] hover:text-red-500 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="space-y-4">
            {/* Total Cost */}
            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-6 text-white">
              <p className="text-white/80 text-sm">Celkové náklady</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.total_cost)}</p>
              <p className="text-white/60 text-sm mt-1">{stats.total_services} servisních záznamů</p>
            </div>

            {/* Costs by Type */}
            <div className="bg-[rgb(var(--card))] rounded-xl p-4">
              <h3 className="font-semibold mb-4">Náklady podle kategorie</h3>
              <div className="space-y-3">
                {Object.entries(stats.costs_by_type || {}).map(([type, cost]) => {
                  const typeInfo = SERVICE_TYPES[type] || SERVICE_TYPES.other;
                  const percentage = stats.total_cost > 0 ? (cost / stats.total_cost) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm flex items-center gap-2">
                          <span>{typeInfo.icon}</span>
                          {typeInfo.label}
                        </span>
                        <span className="font-medium">{formatCurrency(cost)}</span>
                      </div>
                      <div className="h-2 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${typeInfo.color} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Last Service */}
            {stats.last_service && (
              <div className="bg-[rgb(var(--card))] rounded-xl p-4">
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Poslední servis</p>
                <p className="font-medium">{formatDate(stats.last_service)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
