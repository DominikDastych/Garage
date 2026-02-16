import { getDB } from '../lib/db';
import { mockEvents } from '../data/mockEvents';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const eventsApi = {
  async list(filters = {}) {
    await delay(200);
    try {
      const db = await getDB();
      let events = await db.getAll('events');
      
      if (events.length === 0) {
        await this.seed();
        events = await db.getAll('events');
      }

      if (filters.sport && filters.sport !== 'all') {
        events = events.filter(e => e.sport === filters.sport);
      }
      if (filters.city) {
        events = events.filter(e => e.city.toLowerCase().includes(filters.city.toLowerCase()));
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
          e.title.toLowerCase().includes(search) ||
          e.venue.toLowerCase().includes(search) ||
          e.teams?.toLowerCase().includes(search)
        );
      }

      if (filters.sort === 'cheapest') {
        events.sort((a, b) => a.priceFrom - b.priceFrom);
      } else if (filters.sort === 'soonest') {
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
      } else if (filters.sort === 'best_seats') {
        events.sort((a, b) => b.featured - a.featured);
      }

      return events;
    } catch (error) {
      console.error('Error listing events:', error);
      throw error;
    }
  },

  async getById(id) {
    await delay(150);
    try {
      const db = await getDB();
      const event = await db.get('events', id);
      if (!event) throw new Error('Event not found');
      return event;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  },

  async seed() {
    try {
      const db = await getDB();
      const tx = db.transaction('events', 'readwrite');
      for (const event of mockEvents) {
        await tx.store.put(event);
      }
      await tx.done;
    } catch (error) {
      console.error('Error seeding events:', error);
      throw error;
    }
  },
};
