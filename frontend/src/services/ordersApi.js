import { getDB } from '../lib/db';
import { v4 as uuidv4 } from '../lib/uuid';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const ordersApi = {
  async list() {
    await delay(150);
    try {
      const db = await getDB();
      const orders = await db.getAll('orders');
      return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error listing orders:', error);
      throw error;
    }
  },

  async getById(id) {
    await delay(100);
    try {
      const db = await getDB();
      const order = await db.get('orders', id);
      if (!order) throw new Error('Order not found');
      return order;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  },

  async checkout(cartItems, paymentMethod, promoCode = null) {
    await delay(300);
    try {
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
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
};
