import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { favoritesApi } from '@/services/favoritesApi';

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoritesApi.list();
      setFavorites(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (event) => {
    try {
      await favoritesApi.remove(event.id);
      setFavorites(prev => prev.filter(f => f.eventId !== event.id));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❤️</div>
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div data-testid="empty-favorites" className="min-h-screen bg-background pb-20">
        <Header title="Favorites" />
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-accent" />
          </div>
          <h2 className="font-headings font-bold text-2xl uppercase mb-2">
            No favorites yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Save events you're interested in for quick access
          </p>
          <Button
            data-testid="browse-events-from-favorites-button"
            onClick={() => navigate('/home')}
            className="h-12"
          >
            Browse Events
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div data-testid="favorites-page" className="min-h-screen bg-background pb-20">
      <Header title="Favorites" />

      <div className="max-w-md mx-auto p-6">
        <div 
          data-testid="favorites-count"
          className="mb-4 text-sm text-muted-foreground"
        >
          {favorites.length} favorite event{favorites.length !== 1 ? 's' : ''}
        </div>

        <div className="space-y-4">
          {favorites.map((fav) => (
            <EventCard
              key={fav.eventId}
              event={fav.event}
              isFavorite={true}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
