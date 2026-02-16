import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Calendar, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

export const TicketCard = ({ ticket, showQR = false, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!showQR) {
      navigate(`/tickets/${ticket.id}`);
    }
  };

  return (
    <div
      data-testid={`ticket-card-${ticket.id}`}
      onClick={handleClick}
      className={cn(
        "relative ticket-stub overflow-hidden bg-card border border-border cursor-pointer hover:shadow-lg transition-all",
        !showQR && "active:scale-[0.98]",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-noise opacity-100" />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {ticket.items?.[0]?.eventTitle || ticket.eventTitle}
              </span>
              <h3 
                data-testid={`ticket-title-${ticket.id}`}
                className="font-headings font-bold text-xl uppercase mt-1"
              >
                Ticket
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-muted-foreground">Order</div>
              <div className="font-mono text-sm">#{ticket.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(ticket.items?.[0]?.eventDate || ticket.createdAt), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.items?.[0]?.eventVenue || 'Venue'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {ticket.items?.reduce((sum, item) => sum + item.quantity, 0) || 1} ticket(s)
              </span>
            </div>
          </div>

          {showQR && (
            <div 
              data-testid="ticket-qr-code"
              className="flex justify-center py-4 bg-white rounded-lg"
            >
              <QRCodeSVG 
                value={`SPORTTIX-${ticket.id}`} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
          )}

          {!showQR && (
            <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
              <div>
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Total Paid
                </div>
                <div 
                  data-testid={`ticket-total-${ticket.id}`}
                  className="font-headings font-bold text-2xl text-primary"
                >
                  ${ticket.total.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-sm bg-accent/10 text-accent text-xs font-mono uppercase tracking-wider">
                  {ticket.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
