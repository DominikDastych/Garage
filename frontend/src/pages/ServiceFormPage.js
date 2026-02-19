import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesApi } from '../services/api';
import { ArrowLeft, Loader2 } from 'lucide-react';

const SERVICE_TYPES = [
  { id: 'oil', label: 'Výměna oleje', icon: '🛢️' },
  { id: 'stk', label: 'STK / Emise', icon: '📝' },
  { id: 'tires', label: 'Pneumatiky', icon: '🛞' },
  { id: 'brakes', label: 'Brzdy', icon: '⛔' },
  { id: 'other', label: 'Ostatní', icon: '🔧' }
];

export const ServiceFormPage = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    service_type: 'oil',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    mileage: '',
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await servicesApi.create(carId, {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        mileage: formData.mileage ? parseInt(formData.mileage) : null
      });
      navigate(`/car/${carId}`);
    } catch (err) {
      console.error('Error saving service:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header */}
      <div className="bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[rgb(var(--secondary))] rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Nový servisní záznam</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-6">
        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[rgb(var(--muted-foreground))]">Typ servisu</label>
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, service_type: type.id })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.service_type === type.id
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]'
                }`}
              >
                <span className="text-2xl block mb-1">{type.icon}</span>
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Datum *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
            required
          />
        </div>

        {/* Cost */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Cena (Kč) *</label>
          <input
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
            placeholder="např. 2500"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Stav tachometru (km)</label>
          <input
            type="number"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))]"
            placeholder="např. 75000"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">Poznámka</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full px-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))] resize-none"
            rows={3}
            placeholder="Doplňující informace..."
          />
        </div>

        {/* Submit */}
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
            'Uložit záznam'
          )}
        </button>
      </form>
    </div>
  );
};
