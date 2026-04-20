import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { ArrowLeft, Moon, Sun, LogOut, User, Shield, Info } from 'lucide-react';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (window.confirm('Opravdu se chcete odhlásit?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] pb-24">
      {/* Header */}
      <div className="bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[rgb(var(--secondary))] rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Nastavení</h1>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* User Info */}
        <div className="bg-[rgb(var(--card))] rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-[rgb(var(--muted-foreground))]">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="bg-[rgb(var(--card))] rounded-2xl overflow-hidden">
          <button
            onClick={toggleTheme}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[rgb(var(--secondary))] transition-colors"
          >
            <div className="flex items-center gap-4">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-[rgb(var(--primary))]" />
              ) : (
                <Sun className="w-5 h-5 text-orange-500" />
              )}
              <div className="text-left">
                <p className="font-medium">Tmavý režim</p>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  {theme === 'dark' ? 'Zapnuto' : 'Vypnuto'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-[rgb(var(--primary))]' : 'bg-[rgb(var(--muted))]'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="bg-[rgb(var(--card))] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-4 border-b border-[rgb(var(--border))]">
            <Info className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
            <div>
              <p className="font-medium">Verze aplikace</p>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">1.0.0</p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center gap-4">
            <Shield className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
            <div>
              <p className="font-medium">PWA Aplikace</p>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Instalovatelná na mobil</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/20 text-red-500 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 font-medium hover:bg-red-500/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Odhlásit se
        </button>

        {/* Footer */}
        <p className="text-center text-sm text-[rgb(var(--muted-foreground))]">
          My Car Garage © 2026
        </p>
      </div>

      <BottomNav />
    </div>
  );
};
