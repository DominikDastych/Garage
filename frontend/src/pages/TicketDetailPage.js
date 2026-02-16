import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { TicketCard } from '@/components/TicketCard';
import { ordersApi } from '@/services/ordersApi';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(id);
      setOrder(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading order:', error);
      navigate('/tickets');
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎫</div>
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="ticket-detail-page" className="min-h-screen bg-background pb-20">
      <Header title="Ticket Details" showBack />

      <div className="max-w-md mx-auto p-6">
        <TicketCard ticket={order} showQR={true} />
        
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <span>
              Present this QR code at the venue entrance. Save a screenshot for offline access.
            </span>
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
