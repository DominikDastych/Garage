import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cartApi } from '@/services/cartApi';
import { ordersApi } from '@/services/ordersApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const paymentMethods = [
  { id: 'card', name: 'Credit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', description: 'Pay with your PayPal account' },
  { id: 'applepay', name: 'Apple Pay', icon: '🍎', description: 'Quick and secure payment' },
  { id: 'googlepay', name: 'Google Pay', icon: '🅖', description: 'Pay with Google' },
];

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const appliedPromo = location.state?.appliedPromo;

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const items = await cartApi.get();
      if (items.length === 0) {
        navigate('/cart');
        return;
      }
      setCartItems(items);
      setLoading(false);
    } catch (error) {
      console.error('Error loading cart:', error);
      setLoading(false);
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

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const order = await ordersApi.checkout(
        cartItems,
        selectedMethod,
        appliedPromo
      );

      await cartApi.clear();

      toast({
        title: "Payment successful!",
        description: "Your tickets have been confirmed",
      });

      navigate('/payment-success', { state: { orderId: order.id } });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment failed",
        description: "Please try again",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-page" className="min-h-screen bg-background pb-20">
      <Header title="Checkout" showBack />

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-headings font-bold uppercase mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.eventTitle}
                </span>
                <span>${(item.pricePerTicket * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            {appliedPromo && (
              <div className="flex justify-between text-accent">
                <span>Discount ({appliedPromo.code})</span>
                <span>-${calculateDiscount().toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border font-bold">
              <span>Total</span>
              <span data-testid="checkout-total" className="text-primary text-xl">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-base font-headings uppercase mb-4 block">
            Payment Method
          </Label>
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={cn(
                    "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
                    selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem
                      data-testid={`payment-method-${method.id}`}
                      value={method.id}
                      id={method.id}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{method.icon}</span>
                        <Label htmlFor={method.id} className="font-semibold cursor-pointer">
                          {method.name}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {method.description}
                      </p>
                    </div>
                    {selectedMethod === method.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="text-lg">🔒</span>
            <span>
              This is a mock payment flow. No real transactions will be processed.
              Your order will be confirmed immediately.
            </span>
          </p>
        </div>

        <Button
          data-testid="complete-payment-button"
          onClick={handlePayment}
          disabled={processing}
          className="w-full h-12 text-lg bg-accent text-accent-foreground hover:bg-accent-hover"
        >
          {processing ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay ${calculateTotal().toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
