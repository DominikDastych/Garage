import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Car, Settings } from 'lucide-react';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tabs = [
    { path: '/dashboard', icon: Home, label: 'Domů' },
    { path: '/car/new', icon: Car, label: 'Přidat' },
    { path: '/settings', icon: Settings, label: 'Nastavení' }
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/car/new') return location.pathname.includes('/car/');
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))] safe-bottom">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center py-2 px-6 rounded-lg transition-colors ${
                active 
                  ? 'text-[rgb(var(--primary))]' 
                  : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
