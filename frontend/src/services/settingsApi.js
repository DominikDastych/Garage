import { getDB } from '../lib/db';

const SETTINGS_KEY = 'userSettings';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const settingsApi = {
  async get() {
    await delay(100);
    try {
      const db = await getDB();
      const settings = await db.get('settings', SETTINGS_KEY);
      return settings || {
        id: SETTINGS_KEY,
        onboardingComplete: false,
        username: 'Guest',
        preferredCity: 'New York',
        preferredSports: [],
        darkMode: true,
        notifications: true,
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  },

  async update(updates) {
    await delay(100);
    try {
      const db = await getDB();
      const current = await this.get();
      const updated = { ...current, ...updates };
      await db.put('settings', updated);
      return updated;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  async clear() {
    await delay(100);
    try {
      const db = await getDB();
      await db.delete('settings', SETTINGS_KEY);
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw error;
    }
  },
};
