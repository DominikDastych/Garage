import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { TicketCard } from '@/components/TicketCard';
import { Button } from '@/components/ui/button';
import { ordersApi } from '@/services/ordersApi';

export const TicketsPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.list();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎫</div>
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div data-testid="empty-tickets" className="min-h-screen bg-background pb-20">
        <Header title="My Tickets" />
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h2 className="font-headings font-bold text-2xl uppercase mb-2">
            No tickets yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Purchase tickets to see them here
          </p>
          <Button
            data-testid="browse-events-from-tickets-button"
            onClick={() => navigate('/home')}
            className="h-12"
          >
            Browse Events
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div data-testid="tickets-page" className="min-h-screen bg-background pb-20">
      <Header title="My Tickets" />

      <div className="max-w-md mx-auto p-6">
        <div 
          data-testid="tickets-count"
          className="mb-4 text-sm text-muted-foreground"
        >
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <TicketCard
              key={order.id}
              ticket={order}
              showQR={false}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
