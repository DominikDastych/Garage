import { getDB } from '../lib/db';
import { eventsApi } from './eventsApi';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const favoritesApi = {
  async list() {
    const userId = eventsApi.getUserId();
    try {
      const response = await fetch(`${API_URL}/api/favorites/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const favorites = await response.json();
      
      // Get full event data for each favorite
      const eventsWithDetails = await Promise.all(
        favorites.map(async (fav) => {
          try {
            const event = await eventsApi.getById(fav.event_id);
            return {
              eventId: fav.event_id,
              event: event,
              addedAt: fav.created_at,
            };
          } catch (e) {
            return null;
          }
        })
      );
      
      return eventsWithDetails.filter(e => e !== null);
    } catch (error) {
      console.error('Error listing favorites from API:', error);
      // Fallback to local
      try {
        const db = await getDB();
        const favorites = await db.getAll('favorites');
        return favorites;
      } catch (dbError) {
        console.error('Error getting local favorites:', dbError);
        return [];
      }
    }
  },

  async add(event) {
    const userId = eventsApi.getUserId();
    try {
      const response = await fetch(`${API_URL}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          event_id: event.id,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add favorite');
      }
      
      const result = await response.json();
      
      // Also store locally
      try {
        const db = await getDB();
        const favorite = {
          eventId: event.id,
          event: event,
          addedAt: result.created_at || new Date().toISOString(),
        };
        await db.put('favorites', favorite);
      } catch (dbError) {
        console.warn('Could not cache favorite locally:', dbError);
      }
      
      return result;
    } catch (error) {
      console.error('Error adding favorite:', error);
      // Fallback to local
      const db = await getDB();
      const favorite = {
        eventId: event.id,
        event: event,
        addedAt: new Date().toISOString(),
      };
      await db.put('favorites', favorite);
      return favorite;
    }
  },

  async remove(eventId) {
    const userId = eventsApi.getUserId();
    try {
      const response = await fetch(`${API_URL}/api/favorites/${userId}/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }
      
      // Also remove locally
      try {
        const db = await getDB();
        await db.delete('favorites', eventId);
      } catch (dbError) {
        console.warn('Could not remove from local favorites:', dbError);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      // Fallback to local
      const db = await getDB();
      await db.delete('favorites', eventId);
    }
  },

  async isFavorite(eventId) {
    const userId = eventsApi.getUserId();
    try {
      const response = await fetch(`${API_URL}/api/favorites/${userId}/check/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to check favorite');
      }
      const result = await response.json();
      return result.isFavorite;
    } catch (error) {
      console.error('Error checking favorite:', error);
      // Fallback to local
      try {
        const db = await getDB();
        const favorite = await db.get('favorites', eventId);
        return !!favorite;
      } catch (dbError) {
        console.error('Error checking local favorite:', dbError);
        return false;
      }
    }
  },
};
