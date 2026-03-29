// ============================================
// APP.JS - Hlavní komponenta aplikace
// ============================================
// Definuje strukturu aplikace a routování (navigaci mezi stránkami)

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CarFormPage } from './pages/CarFormPage';
import { CarDetailPage } from './pages/CarDetailPage';
import { ServiceFormPage } from './pages/ServiceFormPage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

// ============================================
// CHRÁNĚNÁ ROUTA
// ============================================
// Komponenta, která kontroluje, zda je uživatel přihlášen
// Pokud ne, přesměruje ho na přihlašovací stránku
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Zobrazí loading spinner během kontroly přihlášení
  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🚗</span>
          </div>
          <p className="text-[rgb(var(--muted-foreground))]">Načítám...</p>
        </div>
      </div>
    );
  }
  
  // Pokud není přihlášen, přesměruj na login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Pokud je přihlášen, zobraz požadovanou stránku
  return children;
};

// ============================================
// DEFINICE ROUT (STRÁNEK)
// ============================================
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      {/* Přihlášení - pokud je už přihlášen, přesměruj na dashboard */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      
      {/* Dashboard - hlavní stránka s přehledem aut */}
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
      />
      
      {/* Přidání nového auta */}
      <Route 
        path="/car/new" 
        element={<ProtectedRoute><CarFormPage /></ProtectedRoute>} 
      />
      
      {/* Detail auta */}
      <Route 
        path="/car/:id" 
        element={<ProtectedRoute><CarDetailPage /></ProtectedRoute>} 
      />
      
      {/* Úprava auta */}
      <Route 
        path="/car/:id/edit" 
        element={<ProtectedRoute><CarFormPage /></ProtectedRoute>} 
      />
      
      {/* Přidání servisního záznamu */}
      <Route 
        path="/car/:carId/service/new" 
        element={<ProtectedRoute><ServiceFormPage /></ProtectedRoute>} 
      />
      
      {/* Nastavení */}
      <Route 
        path="/settings" 
        element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} 
      />
      
      {/* Výchozí přesměrování na dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// ============================================
// HLAVNÍ KOMPONENTA
// ============================================
function App() {
  return (
    // ThemeProvider - poskytuje tmavý/světlý režim
    <ThemeProvider>
      {/* AuthProvider - poskytuje info o přihlášeném uživateli */}
      <AuthProvider>
        {/* BrowserRouter - umožňuje navigaci mezi stránkami */}
        <BrowserRouter>
          <div className="App">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
