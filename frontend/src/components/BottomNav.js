import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Ticket, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/home', testId: 'nav-home' },
    { icon: Ticket, label: 'Tickets', path: '/tickets', testId: 'nav-tickets' },
    { icon: Heart, label: 'Favorites', path: '/favorites', testId: 'nav-favorites' },
    { icon: User, label: 'Profile', path: '/profile', testId: 'nav-profile' },
  ];

  return (
    <nav 
      data-testid="bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-area-inset-bottom"
    >
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path === '/home' && location.pathname === '/');
          
          return (
            <button
              key={item.path}
              data-testid={item.testId}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-xs font-mono uppercase tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
