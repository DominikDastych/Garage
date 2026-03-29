import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header = ({ 
  title, 
  showBack = false, 
  showCart = false, 
  cartCount = 0,
  className = '' 
}) => {
  const navigate = useNavigate();

  return (
    <header 
      data-testid="header"
      className={cn("sticky top-0 z-40 glass-header", className)}
    >
      <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <button
              data-testid="header-back-button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-accent/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 
            data-testid="header-title"
            className="font-headings font-bold text-xl uppercase tracking-tight truncate"
          >
            {title}
          </h1>
        </div>
        
        {showCart && (
          <button
            data-testid="header-cart-button"
            onClick={() => navigate('/cart')}
            className="relative p-2 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span 
                data-testid="cart-count-badge"
                className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
