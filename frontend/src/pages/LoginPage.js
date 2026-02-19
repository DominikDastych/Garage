import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { Car, Mail, Lock, User, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await authApi.login(formData.email, formData.password);
      } else {
        result = await authApi.register(formData.email, formData.password, formData.name);
      }
      
      login(result.token, result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
          <Car className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">My Car Garage</h1>
        <p className="text-[rgb(var(--muted-foreground))] mt-2">Správa vašich vozidel</p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-[rgb(var(--card))] rounded-2xl p-6 shadow-xl">
        {/* Tabs */}
        <div className="flex mb-6 bg-[rgb(var(--secondary))] rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md font-medium transition-all ${
              isLogin 
                ? 'bg-[rgb(var(--primary))] text-white' 
                : 'text-[rgb(var(--muted-foreground))]'
            }`}
          >
            Přihlášení
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-md font-medium transition-all ${
              !isLogin 
                ? 'bg-[rgb(var(--primary))] text-white' 
                : 'text-[rgb(var(--muted-foreground))]'
            }`}
          >
            Registrace
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
                Jméno
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-colors"
                  placeholder="Jan Novák"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-colors"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--muted-foreground))]">
              Heslo
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[rgb(var(--input))] rounded-lg border border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Načítám...
              </>
            ) : (
              isLogin ? 'Přihlásit se' : 'Zaregistrovat se'
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-[rgb(var(--muted-foreground))]">
        PWA aplikace pro správu vozidel
      </p>
    </div>
  );
};
