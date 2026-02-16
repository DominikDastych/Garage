import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { eventsApi } from '@/services/eventsApi';
import { favoritesApi } from '@/services/favoritesApi';
import { settingsApi } from '@/services/settingsApi';
import { cartApi } from '@/services/cartApi';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const categories = [
  { id: 'all', label: 'All', icon: '🎯' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'hockey', label: 'Hockey', icon: '🏒' },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, searchQuery]);

  const loadData = async () => {
    try {
      const [settingsData, favData, cartData] = await Promise.all([
        settingsApi.get(),
        favoritesApi.list(),
        cartApi.get(),
      ]);
      
      setSettings(settingsData);
      setFavorites(favData.map(f => f.eventId));
      setCartCount(cartData.length);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const filters = {
        sport: selectedCategory,
        search: searchQuery,
      };
      
      const allEvents = await eventsApi.list(filters);
      setEvents(allEvents);
      
      const featured = allEvents.filter(e => e.featured);
      setFeaturedEvents(featured);
      
      if (settings?.preferredCity) {
        const nearby = allEvents.filter(e => 
          e.city.toLowerCase().includes(settings.preferredCity.toLowerCase())
        );
        setNearbyEvents(nearby.slice(0, 4));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleToggleFavorite = async (event) => {
    try {
      const isFav = favorites.includes(event.id);
      if (isFav) {
        await favoritesApi.remove(event.id);
        setFavorites(prev => prev.filter(id => id !== event.id));
      } else {
        await favoritesApi.add(event);
        setFavorites(prev => [...prev, event.id]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎫</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="home-page" className="min-h-screen bg-background pb-20">
      <div className="bg-noise min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="p-6 space-y-6">
            <div>
              <h1 
                data-testid="home-welcome-title"
                className="font-headings font-black text-4xl md:text-5xl uppercase tracking-tighter leading-none mb-2"
              >
                SportTix
              </h1>
              <p className="text-muted-foreground">
                Find your next live sports experience
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search teams, tournaments, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-surface-dark border-border"
              />
              <button
                data-testid="filter-button"
                onClick={() => navigate('/events')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-accent/10 rounded-md transition-colors"
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  data-testid={`category-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border-2",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="font-headings font-bold uppercase text-sm">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {featuredEvents.length > 0 && (
            <div className="px-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h2 
                  data-testid="featured-section-title"
                  className="font-headings font-bold text-2xl uppercase"
                >
                  Featured Events
                </h2>
              </div>
              
              <Carousel className="w-full">
                <CarouselContent>
                  {featuredEvents.map((event) => (
                    <CarouselItem key={event.id} className="basis-[85%]">
                      <EventCard
                        event={event}
                        isFavorite={favorites.includes(event.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          )}

          {nearbyEvents.length > 0 && (
            <div className="px-6 mb-8">
              <h2 
                data-testid="nearby-section-title"
                className="font-headings font-bold text-2xl uppercase mb-4"
              >
                Near {settings?.preferredCity}
              </h2>
              <div className="space-y-4">
                {nearbyEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isFavorite={favorites.includes(event.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="px-6 mb-8">
            <h2 
              data-testid="all-events-section-title"
              className="font-headings font-bold text-2xl uppercase mb-4"
            >
              {selectedCategory === 'all' ? 'All Events' : `${categories.find(c => c.id === selectedCategory)?.label} Events`}
            </h2>
            <div className="space-y-4">
              {events.slice(0, 10).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isFavorite={favorites.includes(event.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {events.length > 10 && (
              <button
                data-testid="view-all-button"
                onClick={() => navigate('/events')}
                className="w-full mt-4 py-3 border-2 border-border hover:border-primary rounded-lg font-headings font-bold uppercase transition-colors"
              >
                View All Events
              </button>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
