import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { carsApi, statsApi } from '../services/api';
import { BottomNav } from '../components/BottomNav';
import { Car, Plus, Fuel, Gauge, Loader2, ChevronRight, Settings, Wallet } from 'lucide-react';

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cars, setCars] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [carsData, statsData] = await Promise.all([
        carsApi.getAll(),
        statsApi.getAll()
      ]);
      setCars(carsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[rgb(var(--primary))] mx-auto mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Načítám garáž...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[rgb(var(--primary))] to-orange-600 pt-12 pb-24 px-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white/70 text-sm">Vítej zpět,</p>
              <h1 className="text-2xl font-bold text-white">{user?.name || 'Řidiči'} 👋</h1>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-lg mx-auto px-6 -mt-16">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[rgb(var(--card))] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-orange-500 flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.total_cars || 0}</p>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Vozidel</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--card))] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(stats?.total_cost)}</p>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Náklady</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Moje vozidla</h2>
          <button
            onClick={() => navigate('/car/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--primary))] text-white rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Přidat
          </button>
        </div>

        {/* Cars List */}
        {cars.length === 0 ? (
          <div className="bg-[rgb(var(--card))] rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))]/20 to-orange-500/20 flex items-center justify-center">
              <Car className="w-10 h-10 text-[rgb(var(--primary))]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Zatím žádná vozidla</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-6">
              Přidejte své první auto do garáže a začněte sledovat náklady
            </p>
            <button
              onClick={() => navigate('/car/new')}
              className="px-6 py-3 bg-gradient-to-r from-[rgb(var(--primary))] to-orange-500 text-white rounded-xl font-semibold"
            >
              Přidat první auto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cars.map((car) => (
              <div
                key={car.id}
                onClick={() => navigate(`/car/${car.id}`)}
                className="bg-[rgb(var(--card))] rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              >
                {/* Car Image */}
                <div className="relative h-44">
                  <img
                    src={car.image || DEFAULT_CAR_IMAGE}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = DEFAULT_CAR_IMAGE; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  {/* Car Title on Image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {car.year} {car.license_plate && `• ${car.license_plate}`}
                    </p>
                  </div>

                  {/* Body Type Badge */}
                  {car.body_type && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-black/50 backdrop-blur rounded-lg text-white text-xs">
                        {car.body_type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Car Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      {car.power_hp && (
                        <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted-foreground))]">
                          <Gauge className="w-4 h-4 text-[rgb(var(--primary))]" />
                          <span className="font-medium">{car.power_hp} HP</span>
                        </div>
                      )}
                      {car.fuel_type && (
                        <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted-foreground))]">
                          <Fuel className="w-4 h-4 text-orange-500" />
                          <span>{car.fuel_type}</span>
                        </div>
                      )}
                      {car.transmission && (
                        <div className="text-sm text-[rgb(var(--muted-foreground))]">
                          {car.transmission.substring(0, 5)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[rgb(var(--primary))]">
                        {formatCurrency(car.total_cost)}
                      </span>
                      <ChevronRight className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
