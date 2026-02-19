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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
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
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/car/new" 
        element={
          <ProtectedRoute>
            <CarFormPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/car/:id" 
        element={
          <ProtectedRoute>
            <CarDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/car/:id/edit" 
        element={
          <ProtectedRoute>
            <CarFormPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/car/:carId/service/new" 
        element={
          <ProtectedRoute>
            <ServiceFormPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
