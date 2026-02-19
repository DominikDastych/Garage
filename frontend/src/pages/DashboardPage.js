import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { carsApi, statsApi } from '../services/api';
import { BottomNav } from '../components/BottomNav';
import { Car, Plus, Fuel, Gauge, Calendar, DollarSign, Loader2, ChevronRight } from 'lucide-react';

const CAR_IMAGES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400',
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400',
  'https://images.unsplash.com/photo-1493238792000-8113da705763?w=400',
];

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

  const getCarImage = (car, index) => {
    if (car.image) return car.image;
    return CAR_IMAGES[index % CAR_IMAGES.length];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0
    }).format(amount);
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
      <div className="bg-gradient-to-br from-red-600 to-orange-500 pt-12 pb-20 px-6">
        <div className="max-w-md mx-auto">
          <p className="text-white/80 text-sm">Vítej zpět,</p>
          <h1 className="text-2xl font-bold text-white">{user?.name || 'Řidiči'}</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-md mx-auto px-6 -mt-12">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[rgb(var(--card))] rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_cars || 0}</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">Vozidel</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--card))] rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(stats?.total_cost || 0)}</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">Celkem náklady</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Moje vozidla</h2>
          <button
            onClick={() => navigate('/car/new')}
            className="flex items-center gap-1 text-sm text-[rgb(var(--primary))] font-medium"
          >
            <Plus className="w-4 h-4" />
            Přidat
          </button>
        </div>

        {/* Cars List */}
        {cars.length === 0 ? (
          <div className="bg-[rgb(var(--card))] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--secondary))] flex items-center justify-center">
              <Car className="w-8 h-8 text-[rgb(var(--muted-foreground))]" />
            </div>
            <h3 className="font-semibold mb-2">Žádná vozidla</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
              Přidejte své první auto do garáže
            </p>
            <button
              onClick={() => navigate('/car/new')}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium"
            >
              Přidat auto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cars.map((car, index) => (
              <div
                key={car.id}
                onClick={() => navigate(`/car/${car.id}`)}
                className="bg-[rgb(var(--card))] rounded-2xl overflow-hidden shadow-lg card-hover cursor-pointer"
              >
                <div className="relative h-40">
                  <img
                    src={getCarImage(car, index)}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = CAR_IMAGES[0]; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-white/70 text-sm">{car.year}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      {car.power_hp && (
                        <div className="flex items-center gap-1 text-sm text-[rgb(var(--muted-foreground))]">
                          <Gauge className="w-4 h-4" />
                          {car.power_hp} HP
                        </div>
                      )}
                      {car.fuel_type && (
                        <div className="flex items-center gap-1 text-sm text-[rgb(var(--muted-foreground))]">
                          <Fuel className="w-4 h-4" />
                          {car.fuel_type}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[rgb(var(--primary))] font-semibold">
                      {formatCurrency(car.total_cost || 0)}
                      <ChevronRight className="w-4 h-4" />
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
