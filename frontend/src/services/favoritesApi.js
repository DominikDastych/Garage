import { getDB } from '../lib/db';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const favoritesApi = {
  async list() {
    await delay(100);
    try {
      const db = await getDB();
      const favorites = await db.getAll('favorites');
      return favorites;
    } catch (error) {
      console.error('Error listing favorites:', error);
      throw error;
    }
  },

  async add(event) {
    await delay(100);
    try {
      const db = await getDB();
      const favorite = {
        eventId: event.id,
        event: event,
        addedAt: new Date().toISOString(),
      };
      await db.put('favorites', favorite);
      return favorite;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  async remove(eventId) {
    await delay(100);
    try {
      const db = await getDB();
      await db.delete('favorites', eventId);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  },

  async isFavorite(eventId) {
    try {
      const db = await getDB();
      const favorite = await db.get('favorites', eventId);
      return !!favorite;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },
};
