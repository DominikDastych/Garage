import { getDB } from '../lib/db';
import { v4 as uuidv4 } from '../lib/uuid';
import { eventsApi } from './eventsApi';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const ordersApi = {
  async list() {
    const userId = eventsApi.getUserId();
    try {
      const response = await fetch(`${API_URL}/api/orders/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const orders = await response.json();
      
      // Transform to match frontend format
      return orders.map(order => ({
        id: order.id,
        items: order.items,
        subtotal: order.total,
        discount: 0,
        total: order.total,
        paymentMethod: 'card',
        status: order.status,
        createdAt: order.created_at,
      }));
    } catch (error) {
      console.error('Error listing orders from API:', error);
      // Fallback to local
      try {
        const db = await getDB();
        const orders = await db.getAll('orders');
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (dbError) {
        console.error('Error getting local orders:', dbError);
        return [];
      }
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/api/orders/detail/${id}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      const order = await response.json();
      return {
        id: order.id,
        items: order.items,
        subtotal: order.total,
        discount: 0,
        total: order.total,
        paymentMethod: 'card',
        status: order.status,
        createdAt: order.created_at,
      };
    } catch (error) {
      console.error('Error getting order from API:', error);
      // Fallback to local
      try {
        const db = await getDB();
        const order = await db.get('orders', id);
        if (!order) throw new Error('Order not found');
        return order;
      } catch (dbError) {
        console.error('Error getting local order:', dbError);
        throw error;
      }
    }
  },

  async checkout(cartItems, paymentMethod, promoCode = null) {
    const userId = eventsApi.getUserId();
    
    const subtotal = cartItems.reduce((sum, item) => {
      const itemTotal = item.pricePerTicket * item.quantity;
      const addOnsTotal = (item.addOns || []).reduce((s, a) => s + a.price, 0);
      return sum + itemTotal + addOnsTotal;
    }, 0);

    let discount = 0;
    if (promoCode) {
      if (promoCode.type === 'percentage') {
        discount = (subtotal * promoCode.discount) / 100;
      } else {
        discount = promoCode.discount;
      }
    }

    const total = subtotal - discount;
    
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          items: cartItems,
          total: total,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      const result = await response.json();
      
      const order = {
        id: result.id,
        items: cartItems,
        subtotal,
        discount,
        total,
        paymentMethod,
        promoCode: promoCode ? promoCode.code : null,
        status: 'confirmed',
        createdAt: result.created_at || new Date().toISOString(),
      };

      // Also store locally
      try {
        const db = await getDB();
        await db.put('orders', order);
        // Clear local cart
        const tx = db.transaction('cart', 'readwrite');
        await tx.store.clear();
        await tx.done;
      } catch (dbError) {
        console.warn('Could not cache order locally:', dbError);
      }

      return order;
    } catch (error) {
      console.error('Error creating order via API:', error);
      
      // Fallback to local
      const order = {
        id: uuidv4(),
        items: cartItems,
        subtotal,
        discount,
        total,
        paymentMethod,
        promoCode: promoCode ? promoCode.code : null,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      const db = await getDB();
      await db.put('orders', order);
      
      // Clear cart
      const tx = db.transaction('cart', 'readwrite');
      await tx.store.clear();
      await tx.done;
      
      return order;
    }
  },
};
