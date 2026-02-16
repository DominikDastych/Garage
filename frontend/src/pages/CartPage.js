import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Tag } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cartApi } from '@/services/cartApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const CartPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const items = await cartApi.get();
      setCartItems(items);
      setLoading(false);
    } catch (error) {
      console.error('Error loading cart:', error);
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartApi.removeItem(itemId);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      toast({ title: "Item removed from cart" });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleApplyPromo = async () => {
    try {
      const promo = await cartApi.applyPromoCode(promoCode);
      setAppliedPromo({ ...promo, code: promoCode });
      toast({
        title: "Promo code applied!",
        description: `You saved ${promo.type === 'percentage' ? promo.discount + '%' : '$' + promo.discount}`,
      });
    } catch (error) {
      toast({
        title: "Invalid promo code",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = item.pricePerTicket * item.quantity;
      const addOnsTotal = (item.addOns || []).reduce((s, a) => s + a.price, 0);
      return sum + itemTotal + addOnsTotal;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    const subtotal = calculateSubtotal();
    if (appliedPromo.type === 'percentage') {
      return (subtotal * appliedPromo.discount) / 100;
    }
    return appliedPromo.discount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { appliedPromo } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div data-testid="empty-cart" className="min-h-screen bg-background pb-20">
        <Header title="Cart" showBack />
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-headings font-bold text-2xl uppercase mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
            Add some tickets to get started!
          </p>
          <Button
            data-testid="browse-events-button"
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
    <div data-testid="cart-page" className="min-h-screen bg-background pb-32">
      <Header 
        title={`Cart (${cartItems.length})`} 
        showBack 
      />

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              data-testid={`cart-item-${item.id}`}
              className="p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex gap-4">
                <img
                  src={item.eventImage}
                  alt={item.eventTitle}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 
                    data-testid={`cart-item-title-${item.id}`}
                    className="font-headings font-bold uppercase text-sm truncate"
                  >
                    {item.eventTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.eventDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.section} · {item.quantity}x ${item.pricePerTicket}
                  </p>
                  {item.addOns && item.addOns.length > 0 && (
                    <p className="text-xs text-accent mt-1">
                      + {item.addOns.map(a => a.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    data-testid={`remove-item-${item.id}`}
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                  <div 
                    data-testid={`cart-item-price-${item.id}`}
                    className="font-headings font-bold text-lg"
                  >
                    ${(item.pricePerTicket * item.quantity + (item.addOns || []).reduce((s, a) => s + a.price, 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <Label htmlFor="promo-code" className="text-sm font-semibold mb-2 block">
            Have a promo code?
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="promo-code-input"
                id="promo-code"
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="pl-10"
                disabled={!!appliedPromo}
              />
            </div>
            <Button
              data-testid="apply-promo-button"
              onClick={handleApplyPromo}
              variant="outline"
              disabled={!promoCode || !!appliedPromo}
            >
              Apply
            </Button>
          </div>
          {appliedPromo && (
            <div 
              data-testid="applied-promo-message"
              className="mt-2 text-sm text-accent flex items-center gap-2"
            >
              <span>✓ Code "{appliedPromo.code}" applied</span>
              <button
                data-testid="remove-promo-button"
                onClick={() => {
                  setAppliedPromo(null);
                  setPromoCode('');
                }}
                className="text-xs underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span data-testid="subtotal-display">${calculateSubtotal().toFixed(2)}</span>
          </div>
          {appliedPromo && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span data-testid="discount-display" className="text-accent">
                -${calculateDiscount().toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="font-headings font-bold uppercase">Total</span>
            <span 
              data-testid="total-display"
              className="font-headings font-black text-2xl text-primary"
            >
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 glass-nav border-t border-border p-4">
        <div className="max-w-md mx-auto">
          <Button
            data-testid="proceed-to-checkout-button"
            onClick={handleCheckout}
            className="w-full h-12 text-lg bg-accent text-accent-foreground hover:bg-accent-hover"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
