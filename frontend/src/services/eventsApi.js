import { getDB } from '../lib/db';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// User ID for this session (in real app would come from auth)
const getUserId = () => {
  let userId = localStorage.getItem('sporttix_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sporttix_user_id', userId);
  }
  return userId;
};

export const eventsApi = {
  async list(filters = {}) {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.sport && filters.sport !== 'all') {
        params.append('sport', filters.sport);
      }
      if (filters.featured !== undefined) {
        params.append('featured', filters.featured);
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/events${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      let events = await response.json();
      
      // Apply client-side filters
      if (filters.city) {
        events = events.filter(e => e.city?.toLowerCase().includes(filters.city.toLowerCase()));
      }
      if (filters.dateFrom) {
        events = events.filter(e => new Date(e.date) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        events = events.filter(e => new Date(e.date) <= new Date(filters.dateTo));
      }
      if (filters.priceMin !== undefined) {
        events = events.filter(e => e.priceFrom >= filters.priceMin);
      }
      if (filters.priceMax !== undefined) {
        events = events.filter(e => e.priceFrom <= filters.priceMax);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        events = events.filter(e => 
          e.title?.toLowerCase().includes(search) ||
          e.venue?.toLowerCase().includes(search) ||
          e.teams?.toLowerCase().includes(search) ||
          e.league?.toLowerCase().includes(search)
        );
      }

      // Apply sorting
      if (filters.sort === 'cheapest') {
        events.sort((a, b) => a.priceFrom - b.priceFrom);
      } else if (filters.sort === 'soonest') {
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
      } else if (filters.sort === 'best_seats') {
        events.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }

      // Cache events locally for offline support
      try {
        const db = await getDB();
        const tx = db.transaction('events', 'readwrite');
        await tx.store.clear();
        for (const event of events) {
          await tx.store.put(event);
        }
        await tx.done;
      } catch (cacheError) {
        console.warn('Could not cache events:', cacheError);
      }

      return events;
    } catch (error) {
      console.error('Error listing events:', error);
      // Fallback to cached data
      try {
        const db = await getDB();
        const events = await db.getAll('events');
        if (events.length > 0) {
          return events;
        }
      } catch (dbError) {
        console.error('Error getting cached events:', dbError);
      }
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/api/events/${id}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting event:', error);
      // Try cache
      try {
        const db = await getDB();
        const event = await db.get('events', id);
        if (event) return event;
      } catch (dbError) {
        console.error('Error getting cached event:', dbError);
      }
      throw error;
    }
  },

  async getSports() {
    try {
      const response = await fetch(`${API_URL}/api/sports`);
      if (!response.ok) {
        throw new Error('Failed to fetch sports');
      }
      const data = await response.json();
      return data.sports;
    } catch (error) {
      console.error('Error getting sports:', error);
      // Fallback
      return [
        { id: 'soccer', name: 'Football', icon: '⚽' },
        { id: 'basketball', name: 'Basketball', icon: '🏀' },
        { id: 'ice_hockey', name: 'Hockey', icon: '🏒' },
        { id: 'tennis', name: 'Tennis', icon: '🎾' },
        { id: 'golf', name: 'Golf', icon: '⛳' },
      ];
    }
  },

  getUserId,
};
