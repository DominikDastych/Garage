// ============================================
// AUTH CONTEXT - Správa přihlášení uživatele
// ============================================
// React Context pro sdílení stavu přihlášení napříč aplikací
// Ukládá token a info o uživateli do localStorage

import React, { createContext, useContext, useState, useEffect } from 'react';

// Vytvoření kontextu
const AuthContext = createContext(null);

// Hook pro použití auth kontextu v komponentách
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Provider komponenta - obaluje celou aplikaci
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // Info o uživateli
  const [token, setToken] = useState(null);    // JWT token
  const [loading, setLoading] = useState(true); // Stav načítání

  // Při startu aplikace zkontroluj, zda je uložené přihlášení
  useEffect(() => {
    const savedToken = localStorage.getItem('car_garage_token');
    const savedUser = localStorage.getItem('car_garage_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Funkce pro přihlášení - uloží token a uživatele
  const login = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('car_garage_token', authToken);
    localStorage.setItem('car_garage_user', JSON.stringify(userData));
  };

  // Funkce pro odhlášení - smaže token a přesměruje na login
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('car_garage_token');
    localStorage.removeItem('car_garage_user');
    window.location.href = '/login';
  };

  // Funkce pro aktualizaci údajů uživatele
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('car_garage_user', JSON.stringify(userData));
  };

  // Poskytnutí hodnot všem child komponentám
  return (
    <AuthContext.Provider value={{ 
      user,                          // Data uživatele
      token,                         // JWT token
      loading,                       // Stav načítání
      login,                         // Funkce přihlášení
      logout,                        // Funkce odhlášení
      updateUser,                    // Funkce aktualizace
      isAuthenticated: !!token       // Je přihlášen? (true/false)
    }}>
      {children}
    </AuthContext.Provider>
  );
};
