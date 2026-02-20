import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carsApi } from '../services/api';
import { ArrowLeft, Search, Loader2, Camera, X, ChevronDown, Check } from 'lucide-react';

const FUEL_TYPES = [
  { id: 'benzin', label: 'Benzín', icon: '⛽' },
  { id: 'diesel', label: 'Diesel', icon: '🛢️' },
  { id: 'elektro', label: 'Elektro', icon: '⚡' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔋' },
  { id: 'lpg', label: 'LPG', icon: '💨' },
];

const TRANSMISSIONS = [
  { id: 'manual', label: 'Manuální', icon: '🕹️' },
  { id: 'automat', label: 'Automatická', icon: '🅰️' },
];

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
  const isEdit = id && id !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Dropdown states
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    power_kw: '',
    power_hp: '',
    fuel_type: '',
    transmission: '',
    body_type: '',
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

  // Load models when brand changes
  useEffect(() => {
    if (formData.brand) {
      loadModels(formData.brand);
    } else {
      setModels([]);
    }
  }, [formData.brand]);

  // Auto-load image when brand and model are set
  useEffect(() => {
    if (formData.brand && formData.model && !formData.image) {
      loadCarImage(formData.brand, formData.model);
    }
  }, [formData.brand, formData.model]);

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

  const loadCarImage = async (make, model) => {
    setLoadingImage(true);
    try {
      const data = await carsApi.getImage(make, model);
      if (data?.image_url) {
        setFormData(prev => ({ ...prev, image: data.image_url }));
      }
    } catch (err) {
      console.error('Error loading image:', err);
    } finally {
      setLoadingImage(false);
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
        mileage: car.mileage || '',
        image: car.image || ''
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

  const selectMake = (make) => {
    setFormData(prev => ({ ...prev, brand: make, model: '', image: '' }));
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
      <div className="bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] px-4 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[rgb(var(--secondary))] rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Upravit vozidlo' : 'Nové vozidlo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-6">
        {/* Car Image */}
        <div className="relative">
          <div className="w-full h-48 bg-[rgb(var(--card))] rounded-2xl overflow-hidden flex items-center justify-center">
            {loadingImage ? (
              <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--muted-foreground))]" />
            ) : formData.image ? (
              <img src={formData.image} alt="Car" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto text-[rgb(var(--muted-foreground))]" />
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-2">Obrázek se načte automaticky</p>
              </div>
            )}
          </div>
          {formData.image && (
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Brand Autocomplete */}
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
                  setFormData(prev => ({ ...prev, brand: '', model: '', image: '' }));
                }
              }}
              onFocus={() => setShowMakeDropdown(true)}
              className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))] pr-10"
              placeholder="Vyhledejte značku..."
              required
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
          </div>
          
          {showMakeDropdown && filteredMakes.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] shadow-xl max-h-60 overflow-y-auto">
              {filteredMakes.map((make) => (
                <button
                  key={make}
                  type="button"
                  onClick={() => selectMake(make)}
                  className="w-full px-4 py-3 text-left hover:bg-[rgb(var(--secondary))] flex items-center justify-between"
                >
                  <span>{make}</span>
                  {formData.brand === make && <Check className="w-4 h-4 text-[rgb(var(--primary))]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model with Search */}
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
                  if (models.length > 0) {
                    setShowModelDropdown(true);
                  }
                }}
                onFocus={() => models.length > 0 && setShowModelDropdown(true)}
                className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))] pr-10"
                placeholder={formData.brand ? "Vyberte nebo zadejte model..." : "Nejdřív vyberte značku"}
                disabled={!formData.brand}
                required
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
              className="px-4 bg-[rgb(var(--primary))] text-white rounded-lg disabled:opacity-50 flex items-center justify-center"
              title="Načíst specifikace"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          {showModelDropdown && filteredModels.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] shadow-xl max-h-60 overflow-y-auto">
              {filteredModels.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => selectModel(model)}
                  className="w-full px-4 py-3 text-left hover:bg-[rgb(var(--secondary))] flex items-center justify-between"
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

        {/* Transmission - Visual Selection */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[rgb(var(--muted-foreground))]">Převodovka</label>
          <div className="grid grid-cols-2 gap-3">
            {TRANSMISSIONS.map((trans) => (
              <button
                key={trans.id}
                type="button"
                onClick={() => setFormData({ ...formData, transmission: trans.label })}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                  formData.transmission === trans.label
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]'
                }`}
              >
                <span className="text-2xl mb-1">{trans.icon}</span>
                <span className="text-sm font-medium">{trans.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fuel Type - Visual Selection */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[rgb(var(--muted-foreground))]">Palivo</label>
          <div className="grid grid-cols-3 gap-3">
            {FUEL_TYPES.map((fuel) => (
              <button
                key={fuel.id}
                type="button"
                onClick={() => setFormData({ ...formData, fuel_type: fuel.label })}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                  formData.fuel_type === fuel.label
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]'
                }`}
              >
                <span className="text-xl mb-1">{fuel.icon}</span>
                <span className="text-xs font-medium">{fuel.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body Type - Visual Selection */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[rgb(var(--muted-foreground))]">Karoserie</label>
          <div className="grid grid-cols-3 gap-3">
            {BODY_TYPES.map((body) => (
              <button
                key={body.id}
                type="button"
                onClick={() => setFormData({ ...formData, body_type: body.label })}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                  formData.body_type === body.label
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]'
                }`}
              >
                <span className="text-xl mb-1">{body.icon}</span>
                <span className="text-xs font-medium">{body.label}</span>
              </button>
            ))}
          </div>
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

      {/* Click outside to close dropdowns */}
      {(showMakeDropdown || showModelDropdown) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowMakeDropdown(false);
            setShowModelDropdown(false);
          }}
        />
      )}
    </div>
  );
};
