// ============================================
// CAR FORM PAGE - Formulář pro přidání/úpravu auta
// ============================================
// Obsahuje výběr značky, modelu, paliva, převodovky atd.

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carsApi } from '../services/api';
import { ArrowLeft, Search, Loader2, ChevronDown, Check } from 'lucide-react';

// Možnosti paliva
const FUEL_TYPES = [
  { id: 'benzin', label: 'Benzín', icon: '⛽' },
  { id: 'diesel', label: 'Diesel', icon: '🛢️' },
  { id: 'elektro', label: 'Elektro', icon: '⚡' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔋' },
  { id: 'lpg', label: 'LPG', icon: '💨' },
];

// Možnosti převodovky
const TRANSMISSIONS = [
  { id: 'manual', label: 'Manuální', icon: '🕹️' },
  { id: 'automat', label: 'Automatická', icon: '🅰️' },
];

// Typy karoserie
const BODY_TYPES = [
  { id: 'sedan', label: 'Sedan', icon: '🚗' },
  { id: 'hatchback', label: 'Hatchback', icon: '🚙' },
  { id: 'kombi', label: 'Kombi', icon: '🚐' },
  { id: 'suv', label: 'SUV', icon: '🚜' },
  { id: 'coupe', label: 'Coupé', icon: '🏎️' },
  { id: 'cabrio', label: 'Cabrio', icon: '🛻' },
];

export const CarFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== 'new';  // true = editace, false = nové auto
  
  // Stavy
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [makes, setMakes] = useState([]);       // Seznam značek
  const [models, setModels] = useState([]);     // Seznam modelů
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Stavy pro dropdowny
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  
  // Data formuláře
  const [formData, setFormData] = useState({
    brand: '',           // Značka
    model: '',           // Model
    year: new Date().getFullYear(),  // Rok
    power_kw: '',        // Výkon kW
    power_hp: '',        // Výkon HP
    fuel_type: '',       // Palivo
    transmission: '',    // Převodovka
    body_type: '',       // Karoserie
    color: '',           // Barva
    license_plate: '',   // SPZ
    mileage: ''          // Nájezd
  });

  // Načtení značek při startu
  useEffect(() => {
    loadMakes();
    if (isEdit) {
      loadCar();
    }
  }, [id]);

  useEffect(() => {
    if (formData.brand) {
      loadModels(formData.brand);
    } else {
      setModels([]);
    }
  }, [formData.brand]);

  const loadMakes = async () => {
    try {
      const data = await carsApi.getMakes();
      setMakes(data.makes || []);
    } catch (err) {
      console.error('Error loading makes:', err);
    }
  };

  const loadModels = async (make) => {
    setLoadingModels(true);
    try {
      const data = await carsApi.getModels(make);
      setModels(data.models || []);
    } catch (err) {
      console.error('Error loading models:', err);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadCar = async () => {
    setLoading(true);
    try {
      const car = await carsApi.get(id);
      setFormData({
        brand: car.brand || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        power_kw: car.power_kw || '',
        power_hp: car.power_hp || '',
        fuel_type: car.fuel_type || '',
        transmission: car.transmission || '',
        body_type: car.body_type || '',
        color: car.color || '',
        license_plate: car.license_plate || '',
        mileage: car.mileage || ''
      });
      setMakeSearch(car.brand || '');
      setModelSearch(car.model || '');
    } catch (err) {
      console.error('Error loading car:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const searchCarSpecs = async () => {
    if (!formData.brand || !formData.model) return;
    
    try {
      const specs = await carsApi.getSpecs(formData.brand, formData.model, formData.year);
      if (specs) {
        setFormData(prev => ({
          ...prev,
          fuel_type: specs.fuel_type || prev.fuel_type,
          transmission: specs.transmission || prev.transmission,
        }));
      }
    } catch (err) {
      console.error('Error searching specs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.brand || !formData.model) {
      alert('Vyplňte značku a model vozidla');
      return;
    }
    
    setSaving(true);
    
    try {
      const token = localStorage.getItem('car_garage_token');
      const API_URL = process.env.REACT_APP_BACKEND_URL || '';
      
      if (!token) {
        alert('Nejste přihlášeni. Přihlaste se znovu.');
        window.location.href = '/login';
        return;
      }
      
      const data = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        power_kw: formData.power_kw ? parseInt(formData.power_kw) : null,
        power_hp: formData.power_hp ? parseInt(formData.power_hp) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        fuel_type: formData.fuel_type || null,
        transmission: formData.transmission || null,
        body_type: formData.body_type || null,
        color: formData.color || null,
        license_plate: formData.license_plate || null,
        image: null
      };
      
      const url = isEdit ? `${API_URL}/api/cars/${id}` : `${API_URL}/api/cars`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        window.location.href = '/dashboard';
      } else {
        const error = await response.text();
        console.error('Error saving car:', error);
        alert('Nepodařilo se uložit vozidlo: ' + error);
      }
    } catch (err) {
      console.error('Error saving car:', err);
      alert('Nepodařilo se uložit vozidlo: ' + (err.message || 'Neznámá chyba'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat toto vozidlo?\n\nVšechny servisní záznamy budou také smazány.')) return;
    
    try {
      const token = localStorage.getItem('car_garage_token');
      const API_URL = process.env.REACT_APP_BACKEND_URL || '';
      
      const response = await fetch(`${API_URL}/api/cars/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        window.location.href = '/dashboard';
      } else {
        alert('Nepodařilo se smazat vozidlo');
      }
    } catch (err) {
      console.error('Error deleting car:', err);
      alert('Nepodařilo se smazat vozidlo');
    }
  };

  const selectMake = (make) => {
    setFormData(prev => ({ ...prev, brand: make, model: '' }));
    setMakeSearch(make);
    setModelSearch('');
    setShowMakeDropdown(false);
  };

  const selectModel = (model) => {
    setFormData(prev => ({ ...prev, model }));
    setModelSearch(model);
    setShowModelDropdown(false);
  };

  const filteredMakes = makes.filter(make => 
    make.toLowerCase().includes(makeSearch.toLowerCase())
  );

  const filteredModels = models.filter(model =>
    model.toLowerCase().includes(modelSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[rgb(var(--primary))] to-orange-600 pt-4 pb-6 px-4 sticky top-0 z-20">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {isEdit ? 'Upravit vozidlo' : 'Nové vozidlo'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-6">

        {/* Brand */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
            Značka *
          </label>
          <div className="relative">
            <input
              type="text"
              value={makeSearch}
              onChange={(e) => {
                setMakeSearch(e.target.value);
                setShowMakeDropdown(true);
                if (!e.target.value) {
                  setFormData(prev => ({ ...prev, brand: '', model: '' }));
                }
              }}
              onFocus={() => setShowMakeDropdown(true)}
              onBlur={() => setTimeout(() => setShowMakeDropdown(false), 200)}
              className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] pr-10 focus:border-[rgb(var(--primary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 transition-all"
              placeholder="Vyhledejte značku..."
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
          </div>
          
          {showMakeDropdown && filteredMakes.length > 0 && (
            <div className="absolute z-30 w-full mt-2 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] shadow-xl max-h-60 overflow-y-auto">
              {filteredMakes.map((make) => (
                <button
                  key={make}
                  type="button"
                  onClick={() => selectMake(make)}
                  className="w-full px-4 py-3 text-left hover:bg-[rgb(var(--secondary))] flex items-center justify-between transition-colors"
                >
                  <span>{make}</span>
                  {formData.brand === make && <Check className="w-4 h-4 text-[rgb(var(--primary))]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
            Model *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => {
                  setModelSearch(e.target.value);
                  setFormData(prev => ({ ...prev, model: e.target.value }));
                  if (models.length > 0) setShowModelDropdown(true);
                }}
                onFocus={() => models.length > 0 && setShowModelDropdown(true)}
                onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] pr-10 focus:border-[rgb(var(--primary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 transition-all disabled:opacity-50"
                placeholder={formData.brand ? "Vyberte nebo zadejte model..." : "Nejdřív vyberte značku"}
                disabled={!formData.brand}
              />
              {loadingModels ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-[rgb(var(--muted-foreground))]" />
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
              )}
            </div>
            <button
              type="button"
              onClick={searchCarSpecs}
              disabled={!formData.brand || !formData.model}
              className="px-4 bg-[rgb(var(--primary))] text-white rounded-xl disabled:opacity-50 flex items-center justify-center hover:opacity-90 transition-opacity"
              title="Načíst specifikace"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          {showModelDropdown && filteredModels.length > 0 && (
            <div className="absolute z-30 w-full mt-2 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] shadow-xl max-h-60 overflow-y-auto">
              {filteredModels.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => selectModel(model)}
                  className="w-full px-4 py-3 text-left hover:bg-[rgb(var(--secondary))] flex items-center justify-between transition-colors"
                >
                  <span>{model}</span>
                  {formData.model === model && <Check className="w-4 h-4 text-[rgb(var(--primary))]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
            Rok výroby *
          </label>
          <input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 transition-all"
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>

        {/* Body Type */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[rgb(var(--muted-foreground))]">
            Typ karoserie
          </label>
          <div className="grid grid-cols-3 gap-3">
            {BODY_TYPES.map((body) => (
              <button
                key={body.id}
                type="button"
                onClick={() => setFormData({ ...formData, body_type: body.label })}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                  formData.body_type === body.label
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--muted))]'
                }`}
              >
                <span className="text-2xl mb-1">{body.icon}</span>
                <span className="text-xs font-medium">{body.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transmission */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[rgb(var(--muted-foreground))]">
            Převodovka
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TRANSMISSIONS.map((trans) => (
              <button
                key={trans.id}
                type="button"
                onClick={() => setFormData({ ...formData, transmission: trans.label })}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                  formData.transmission === trans.label
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--muted))]'
                }`}
              >
                <span className="text-2xl mb-1">{trans.icon}</span>
                <span className="text-sm font-medium">{trans.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[rgb(var(--muted-foreground))]">
            Palivo
          </label>
          <div className="grid grid-cols-3 gap-3">
            {FUEL_TYPES.map((fuel) => (
              <button
                key={fuel.id}
                type="button"
                onClick={() => setFormData({ ...formData, fuel_type: fuel.label })}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                  formData.fuel_type === fuel.label
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--muted))]'
                }`}
              >
                <span className="text-xl mb-1">{fuel.icon}</span>
                <span className="text-xs font-medium">{fuel.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Power */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
              Výkon (kW)
            </label>
            <input
              type="number"
              value={formData.power_kw}
              onChange={(e) => setFormData({ ...formData, power_kw: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-all"
              placeholder="např. 150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
              Výkon (HP)
            </label>
            <input
              type="number"
              value={formData.power_hp}
              onChange={(e) => setFormData({ ...formData, power_hp: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-all"
              placeholder="např. 200"
            />
          </div>
        </div>

        {/* Color & License Plate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
              Barva
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-all"
              placeholder="např. Černá"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
              SPZ
            </label>
            <input
              type="text"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-all"
              placeholder="např. 1A2 3456"
            />
          </div>
        </div>

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
            Nájezd (km)
          </label>
          <input
            type="number"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-all"
            placeholder="např. 50000"
          />
        </div>

        {/* Submit Button */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-[rgb(var(--primary))] to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ukládám...
              </>
            ) : (
              isEdit ? 'Uložit změny' : 'Přidat vozidlo'
            )}
          </button>
          
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-4 bg-red-500/10 text-red-500 font-semibold rounded-xl hover:bg-red-500/20 transition-colors"
            >
              Smazat vozidlo
            </button>
          )}
        </div>
      </form>

      {/* Click outside to close dropdowns - removed as it blocks clicks */}
    </div>
  );
};
