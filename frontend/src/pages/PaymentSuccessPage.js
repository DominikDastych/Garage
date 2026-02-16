import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/home');
    }
  }, [orderId, navigate]);

  return (
    <div 
      data-testid="payment-success-page"
      className="min-h-screen bg-background flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle className="h-16 w-16 text-accent" />
          </div>
        </div>

        <div>
          <h1 
            data-testid="success-title"
            className="font-headings font-black text-4xl uppercase tracking-tighter mb-3"
          >
            Payment Successful!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your tickets have been confirmed
          </p>
        </div>

        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="text-sm text-muted-foreground mb-2">Order ID</div>
          <div 
            data-testid="order-id-display"
            className="font-mono font-semibold"
          >
            #{orderId?.slice(0, 8).toUpperCase()}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            data-testid="view-tickets-button"
            onClick={() => navigate('/tickets')}
            className="w-full h-12 text-lg bg-accent text-accent-foreground hover:bg-accent-hover"
          >
            View My Tickets
          </Button>
          <Button
            data-testid="back-home-button"
            onClick={() => navigate('/home')}
            variant="outline"
            className="w-full h-12 text-lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
