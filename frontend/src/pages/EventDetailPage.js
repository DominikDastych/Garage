import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Users, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { eventsApi } from '@/services/eventsApi';
import { favoritesApi } from '@/services/favoritesApi';
import { cartApi } from '@/services/cartApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const addOns = [
  { id: 'vip', name: 'VIP Experience', price: 50, description: 'Access to VIP lounge and premium amenities' },
  { id: 'fastentry', name: 'Fast Entry', price: 15, description: 'Skip the regular entry lines' },
];

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedSection, setSelectedSection] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [eventData, favs, cart] = await Promise.all([
        eventsApi.getById(id),
        favoritesApi.list(),
        cartApi.get(),
      ]);
      
      setEvent(eventData);
      setIsFavorite(favs.some(f => f.eventId === id));
      setCartCount(cart.length);
      if (eventData.sections && eventData.sections.length > 0) {
        setSelectedSection(eventData.sections[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
      navigate('/home');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesApi.remove(event.id);
        setIsFavorite(false);
        toast({ title: "Removed from favorites" });
      } else {
        await favoritesApi.add(event);
        setIsFavorite(true);
        toast({ title: "Added to favorites" });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      const section = event.sections.find(s => s.id === selectedSection);
      const addOnsData = selectedAddOns.map(id => addOns.find(a => a.id === id));
      
      await cartApi.addItem({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventVenue: event.venue,
        eventImage: event.image,
        section: section.name,
        quantity,
        pricePerTicket: section.price,
        addOns: addOnsData,
      });

      setCartCount(prev => prev + 1);
      toast({
        title: "Added to cart",
        description: `${quantity} ticket(s) for ${event.title}`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const toggleAddOn = (addOnId) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotal = () => {
    const section = event?.sections.find(s => s.id === selectedSection);
    if (!section) return 0;
    
    const ticketTotal = section.price * quantity;
    const addOnsTotal = selectedAddOns.reduce((sum, id) => {
      const addOn = addOns.find(a => a.id === id);
      return sum + (addOn?.price || 0);
    }, 0);
    
    return ticketTotal + addOnsTotal;
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎫</div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  const selectedSectionData = event.sections.find(s => s.id === selectedSection);

  return (
    <div data-testid="event-detail-page" className="min-h-screen bg-background pb-32">
      <Header showBack showCart cartCount={cartCount} />

      <div className="max-w-md mx-auto">
        <div className="relative aspect-[16/10]">
          <img
            data-testid="event-detail-image"
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          <button
            data-testid="event-detail-favorite-button"
            onClick={handleToggleFavorite}
            className="absolute top-4 right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Heart 
              className={cn(
                "h-6 w-6",
                isFavorite ? "fill-accent text-accent" : "text-foreground"
              )} 
            />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-accent">
                {event.sport}
              </span>
              {event.featured && (
                <span className="text-xs font-mono uppercase tracking-wider text-primary">
                  Featured
                </span>
              )}
            </div>
            <h1 
              data-testid="event-detail-title"
              className="font-headings font-black text-3xl uppercase tracking-tight mb-4"
            >
              {event.title}
            </h1>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Date & Time</div>
                <div data-testid="event-detail-date" className="font-semibold">
                  {format(new Date(event.date), 'EEEE, MMMM d, yyyy · h:mm a')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Venue</div>
                <div data-testid="event-detail-venue" className="font-semibold">
                  {event.venue}, {event.city}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="section-select" className="text-base font-headings uppercase">
              Select Section
            </Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger data-testid="section-select" id="section-select" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {event.sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name} - ${section.price} ({section.available} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-headings uppercase">Quantity</Label>
            <div className="flex items-center gap-4 mt-2">
              <Button
                data-testid="decrease-quantity-button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span 
                data-testid="quantity-display"
                className="font-headings text-2xl font-bold min-w-[40px] text-center"
              >
                {quantity}
              </span>
              <Button
                data-testid="increase-quantity-button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(selectedSectionData?.available || 10, quantity + 1))}
                disabled={quantity >= (selectedSectionData?.available || 10)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{selectedSectionData?.available || 0} tickets available</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-headings uppercase mb-3 block">
              Add-Ons (Optional)
            </Label>
            <div className="space-y-3">
              {addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex items-start gap-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
                >
                  <Checkbox
                    data-testid={`addon-${addOn.id}-checkbox`}
                    checked={selectedAddOns.includes(addOn.id)}
                    onCheckedChange={() => toggleAddOn(addOn.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{addOn.name}</span>
                      <span className="font-headings font-bold text-primary">
                        +${addOn.price}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{addOn.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 glass-nav border-t border-border p-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
              Total
            </div>
            <div 
              data-testid="total-price-display"
              className="font-headings font-black text-3xl text-primary"
            >
              ${calculateTotal()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              data-testid="add-to-cart-button"
              variant="outline"
              onClick={handleAddToCart}
              className="h-12"
            >
              Add to Cart
            </Button>
            <Button
              data-testid="buy-now-button"
              onClick={handleBuyNow}
              className="h-12 bg-accent text-accent-foreground hover:bg-accent-hover"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
