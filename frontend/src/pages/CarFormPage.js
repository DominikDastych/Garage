import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carsApi } from '../services/api';
import { ArrowLeft, Search, Loader2, Camera, X } from 'lucide-react';

const FUEL_TYPES = ['Benzín', 'Diesel', 'Elektro', 'Hybrid', 'LPG', 'CNG'];
const TRANSMISSIONS = ['Manuální', 'Automatická', 'DSG', 'CVT'];

export const CarFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [makes, setMakes] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    power_kw: '',
    power_hp: '',
    fuel_type: '',
    transmission: '',
    color: '',
    license_plate: '',
    mileage: '',
    image: ''
  });

  useEffect(() => {
    loadMakes();
    if (isEdit) {
      loadCar();
    }
  }, [id]);

  const loadMakes = async () => {
    try {
      const data = await carsApi.getMakes();
      setMakes(data.makes || []);
    } catch (err) {
      console.error('Error loading makes:', err);
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
        color: car.color || '',
        license_plate: car.license_plate || '',
        mileage: car.mileage || '',
        image: car.image || ''
      });
    } catch (err) {
      console.error('Error loading car:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const searchCarSpecs = async () => {
    if (!formData.brand) return;
    
    setSearching(true);
    try {
      const results = await carsApi.search(formData.brand, formData.model, formData.year);
      setSearchResults(results);
      setShowResults(true);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setSearching(false);
    }
  };

  const applySearchResult = (result) => {
    setFormData(prev => ({
      ...prev,
      brand: result.make || prev.brand,
      model: result.model || prev.model,
      year: result.year || prev.year,
      fuel_type: result.fuel_type || prev.fuel_type,
      transmission: result.transmission === 'a' ? 'Automatická' : result.transmission === 'm' ? 'Manuální' : prev.transmission
    }));
    setShowResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = {
        ...formData,
        year: parseInt(formData.year),
        power_kw: formData.power_kw ? parseInt(formData.power_kw) : null,
        power_hp: formData.power_hp ? parseInt(formData.power_hp) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null
      };
      
      if (isEdit) {
        await carsApi.update(id, data);
      } else {
        await carsApi.create(data);
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving car:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat toto vozidlo?')) return;
    
    try {
      await carsApi.delete(id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header */}
      <div className="bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[rgb(var(--secondary))] rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Upravit vozidlo' : 'Nové vozidlo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-6">
        {/* Image */}
        <div className="relative">
          <div className="w-full h-48 bg-[rgb(var(--card))] rounded-2xl overflow-hidden flex items-center justify-center">
            {formData.image ? (
              <img src={formData.image} alt="Car" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-12 h-12 text-[rgb(var(--muted-foreground))]" />
            )}
          </div>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="URL obrázku (volitelné)"
            className="mt-2 w-full px-4 py-2 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))] text-sm"
          />
        </div>

        {/* Brand & Model with Search */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Značka *</label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
              required
            >
              <option value="">Vyberte značku</option>
              {makes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Model *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="flex-1 px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
                placeholder="např. M3, Golf GTI"
                required
              />
              <button
                type="button"
                onClick={searchCarSpecs}
                disabled={!formData.brand || searching}
                className="px-4 bg-[rgb(var(--primary))] text-white rounded-lg disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search Results Modal */}
          {showResults && searchResults.length > 0 && (
            <div className="bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Nalezené specifikace</p>
                <button type="button" onClick={() => setShowResults(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySearchResult(result)}
                    className="w-full text-left p-3 bg-[rgb(var(--secondary))] rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
                  >
                    <p className="font-medium">{result.make} {result.model} ({result.year})</p>
                    <p className="text-xs text-[rgb(var(--muted-foreground))]">
                      {result.fuel_type} • {result.transmission === 'a' ? 'Auto' : 'Manual'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Rok výroby *</label>
          <input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>

        {/* Power */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Výkon (kW)</label>
            <input
              type="number"
              value={formData.power_kw}
              onChange={(e) => setFormData({ ...formData, power_kw: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
              placeholder="např. 150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Výkon (HP)</label>
            <input
              type="number"
              value={formData.power_hp}
              onChange={(e) => setFormData({ ...formData, power_hp: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
              placeholder="např. 200"
            />
          </div>
        </div>

        {/* Fuel & Transmission */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Palivo</label>
            <select
              value={formData.fuel_type}
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
            >
              <option value="">Vyberte</option>
              {FUEL_TYPES.map(fuel => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Převodovka</label>
            <select
              value={formData.transmission}
              onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
            >
              <option value="">Vyberte</option>
              {TRANSMISSIONS.map(trans => (
                <option key={trans} value={trans}>{trans}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Color & License Plate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Barva</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
              placeholder="např. Černá"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">SPZ</label>
            <input
              type="text"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
              placeholder="např. 1A2 3456"
            />
          </div>
        </div>

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Nájezd (km)</label>
          <input
            type="number"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
            placeholder="např. 50000"
          />
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
              className="w-full py-3 bg-red-500/20 text-red-500 font-semibold rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Smazat vozidlo
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
