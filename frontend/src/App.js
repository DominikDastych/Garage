import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { initDB } from '@/lib/db';
import { settingsApi } from '@/services/settingsApi';

import { OnboardingPage } from '@/pages/OnboardingPage';
import { HomePage } from '@/pages/HomePage';
import { EventsListPage } from '@/pages/EventsListPage';
import { EventDetailPage } from '@/pages/EventDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { ProfilePage } from '@/pages/ProfilePage';

import '@/App.css';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await initDB();
      const settings = await settingsApi.get();
      setOnboardingComplete(settings.onboardingComplete);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsInitialized(true);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎫</div>
          <h1 className="font-headings font-black text-3xl uppercase tracking-tighter">
            SportTix
          </h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="App bg-background min-h-screen">
          <Routes>
            <Route
              path="/"
              element={
                onboardingComplete ? (
                  <Navigate to="/home" replace />
                ) : (
                  <Navigate to="/onboarding" replace />
                )
              }
            />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
