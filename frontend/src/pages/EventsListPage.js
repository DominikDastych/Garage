import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { eventsApi } from '@/services/eventsApi';
import { favoritesApi } from '@/services/favoritesApi';
import { cartApi } from '@/services/cartApi';

export const EventsListPage = () => {
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [filters, setFilters] = useState({
    sport: 'all',
    city: '',
    priceMin: '',
    priceMax: '',
    sort: 'recommended',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadData = async () => {
    try {
      const [favData, cartData] = await Promise.all([
        favoritesApi.list(),
        cartApi.get(),
      ]);
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
      const filterParams = {
        ...filters,
        priceMin: filters.priceMin ? parseInt(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? parseInt(filters.priceMax) : undefined,
      };
      const data = await eventsApi.list(filterParams);
      setEvents(data);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sport: 'all',
      city: '',
      priceMin: '',
      priceMax: '',
      sort: 'recommended',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎫</div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="events-list-page" className="min-h-screen bg-background pb-20">
      <Header 
        title="Browse Events" 
        showBack 
        showCart 
        cartCount={cartCount}
      />

      <div className="max-w-md mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                data-testid="open-filters-button"
                variant="outline" 
                className="flex-1"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle className="font-headings uppercase">Filters</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect event
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                <div>
                  <Label htmlFor="sport-filter">Sport</Label>
                  <Select 
                    value={filters.sport} 
                    onValueChange={(value) => handleFilterChange('sport', value)}
                  >
                    <SelectTrigger data-testid="sport-filter" id="sport-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sports</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="hockey">Hockey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city-filter">City</Label>
                  <Input
                    data-testid="city-filter"
                    id="city-filter"
                    placeholder="e.g., New York, London"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Price Range</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      data-testid="price-min-filter"
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                    />
                    <Input
                      data-testid="price-max-filter"
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  data-testid="clear-filters-button"
                  onClick={clearFilters} 
                  variant="outline" 
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Select 
            value={filters.sort} 
            onValueChange={(value) => handleFilterChange('sort', value)}
          >
            <SelectTrigger data-testid="sort-select" className="w-[180px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="cheapest">Cheapest First</SelectItem>
              <SelectItem value="soonest">Soonest First</SelectItem>
              <SelectItem value="best_seats">Best Seats</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div 
          data-testid="events-results-count"
          className="mb-4 text-sm text-muted-foreground"
        >
          {events.length} event{events.length !== 1 ? 's' : ''} found
        </div>

        <div className="space-y-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isFavorite={favorites.includes(event.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>

        {events.length === 0 && (
          <div 
            data-testid="no-events-message"
            className="text-center py-12"
          >
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-muted-foreground">
              No events found matching your criteria
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
