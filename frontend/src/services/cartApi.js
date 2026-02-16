import { getDB } from '../lib/db';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const cartApi = {
  async get() {
    await delay(100);
    try {
      const db = await getDB();
      const items = await db.getAll('cart');
      return items;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  async addItem(item) {
    await delay(150);
    try {
      const db = await getDB();
      const cartItem = {
        id: `${item.eventId}-${item.section}-${Date.now()}`,
        eventId: item.eventId,
        eventTitle: item.eventTitle,
        eventDate: item.eventDate,
        eventVenue: item.eventVenue,
        eventImage: item.eventImage,
        section: item.section,
        quantity: item.quantity,
        pricePerTicket: item.pricePerTicket,
        addOns: item.addOns || [],
        addedAt: new Date().toISOString(),
      };
      await db.put('cart', cartItem);
      return cartItem;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  async removeItem(id) {
    await delay(100);
    try {
      const db = await getDB();
      await db.delete('cart', id);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  async updateQuantity(id, quantity) {
    await delay(100);
    try {
      const db = await getDB();
      const item = await db.get('cart', id);
      if (item) {
        item.quantity = quantity;
        await db.put('cart', item);
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
  },

  async clear() {
    await delay(100);
    try {
      const db = await getDB();
      const tx = db.transaction('cart', 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  async applyPromoCode(code) {
    await delay(200);
    const validCodes = {
      'FIRST10': { discount: 10, type: 'percentage' },
      'SAVE20': { discount: 20, type: 'fixed' },
      'SPORT25': { discount: 25, type: 'percentage' },
    };

    const promo = validCodes[code.toUpperCase()];
    if (!promo) {
      throw new Error('Invalid promo code');
    }
    return promo;
  },
};
