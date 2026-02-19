import { getDB } from '../lib/db';
import { eventsApi } from './eventsApi';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const cartApi = {
  async get() {
    const userId = eventsApi.getUserId();
    try {
      const response = await fetch(`${API_URL}/api/cart/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      const items = await response.json();
      
      // Transform to match frontend format
      return items.map(item => ({
        id: item.id,
        eventId: item.event_id,
        eventTitle: item.event_title,
        eventDate: item.event_date,
        eventVenue: item.event_venue,
        eventImage: item.event_image,
        section: item.section_name,
        sectionId: item.section_id,
        quantity: item.quantity,
        pricePerTicket: item.price,
        addOns: [],
        addedAt: item.created_at,
      }));
    } catch (error) {
      console.error('Error getting cart from API:', error);
      // Fallback to local storage
      try {
        const db = await getDB();
        const items = await db.getAll('cart');
        return items;
      } catch (dbError) {
        console.error('Error getting local cart:', dbError);
        return [];
      }
    }
  },

  async addItem(item) {
    const userId = eventsApi.getUserId();
    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          event_id: item.eventId,
          event_title: item.eventTitle,
          event_date: item.eventDate,
          event_venue: item.eventVenue,
          event_image: item.eventImage,
          section_id: item.sectionId || item.section,
          section_name: item.section,
          price: item.pricePerTicket,
          quantity: item.quantity,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
      
      const result = await response.json();
      
      // Also store locally for offline support
      try {
        const db = await getDB();
        const cartItem = {
          id: result.id,
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
      } catch (dbError) {
        console.warn('Could not cache cart item:', dbError);
      }
      
      return result;
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Fallback to local
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
    }
  },

  async removeItem(id) {
    try {
      const response = await fetch(`${API_URL}/api/cart/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from cart');
      }
      
      // Also remove locally
      try {
        const db = await getDB();
        await db.delete('cart', id);
      } catch (dbError) {
        console.warn('Could not remove from local cart:', dbError);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Fallback to local
      const db = await getDB();
      await db.delete('cart', id);
    }
  },

  async updateQuantity(id, quantity) {
    try {
      const response = await fetch(`${API_URL}/api/cart/${id}?quantity=${quantity}`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update cart');
      }
      
      // Also update locally
      try {
        const db = await getDB();
        const item = await db.get('cart', id);
        if (item) {
          item.quantity = quantity;
          await db.put('cart', item);
        }
      } catch (dbError) {
        console.warn('Could not update local cart:', dbError);
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      // Fallback to local
      const db = await getDB();
      const item = await db.get('cart', id);
      if (item) {
        item.quantity = quantity;
        await db.put('cart', item);
      }
    }
  },

  async clear() {
    const userId = eventsApi.getUserId();
    try {
      await fetch(`${API_URL}/api/cart/user/${userId}`, {
        method: 'DELETE',
      });
      
      // Also clear locally
      try {
        const db = await getDB();
        const tx = db.transaction('cart', 'readwrite');
        await tx.store.clear();
        await tx.done;
      } catch (dbError) {
        console.warn('Could not clear local cart:', dbError);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Fallback to local
      const db = await getDB();
      const tx = db.transaction('cart', 'readwrite');
      await tx.store.clear();
      await tx.done;
    }
  },

  async applyPromoCode(code) {
    // Keep promo codes client-side for simplicity
    const validCodes = {
      'FIRST10': { discount: 10, type: 'percentage', code: 'FIRST10' },
      'SAVE20': { discount: 20, type: 'fixed', code: 'SAVE20' },
      'SPORT25': { discount: 25, type: 'percentage', code: 'SPORT25' },
    };

    const promo = validCodes[code.toUpperCase()];
    if (!promo) {
      throw new Error('Invalid promo code');
    }
    return promo;
  },
};
