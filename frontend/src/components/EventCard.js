import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const EventCard = ({ event, isFavorite, onToggleFavorite, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/events/${event.id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(event);
  };

  return (
    <div
      data-testid={`event-card-${event.id}`}
      onClick={handleClick}
      className={cn(
        "relative group cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:shadow-lg transition-all active:scale-[0.98]",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <button
          data-testid={`favorite-button-${event.id}`}
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <Heart 
            className={cn(
              "h-4 w-4",
              isFavorite ? "fill-accent text-accent" : "text-foreground"
            )} 
          />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-accent">
              {event.sport}
            </span>
            {event.featured && (
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                Featured
              </span>
            )}
          </div>
          <h3 
            data-testid={`event-title-${event.id}`}
            className="font-headings font-bold text-lg text-white leading-tight mb-2"
          >
            {event.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(event.date), 'MMM d')}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{event.city}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-border/50">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            From
          </span>
          <span 
            data-testid={`event-price-${event.id}`}
            className="font-headings font-bold text-2xl text-primary"
          >
            ${event.priceFrom}
          </span>
        </div>
      </div>
    </div>
  );
};
