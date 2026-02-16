import React, { useState, useEffect } from 'react';
import { User, Moon, Sun, Bell, Trash2, LogOut } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { settingsApi } from '@/services/settingsApi';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/db';

const sports = ['football', 'basketball', 'tennis', 'hockey'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'London', 'Madrid', 'Manchester', 'Toronto', 'Melbourne'];

export const ProfilePage = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      const updated = await settingsApi.update({ [key]: value });
      setSettings(updated);
      toast({ title: "Settings updated" });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleClearData = async () => {
    try {
      const db = await getDB();
      const stores = ['settings', 'favorites', 'cart', 'orders', 'recentlyViewed'];
      
      for (const store of stores) {
        const tx = db.transaction(store, 'readwrite');
        await tx.store.clear();
        await tx.done;
      }

      toast({
        title: "All data cleared",
        description: "The app has been reset",
      });

      window.location.href = '/';
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive",
      });
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="profile-page" className="min-h-screen bg-background pb-20">
      <Header title="Profile" />

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 p-6 rounded-lg border border-border bg-card">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-1">Username</div>
            <div 
              data-testid="username-display"
              className="font-headings font-bold text-xl uppercase"
            >
              {settings.username}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="username-input">Username</Label>
            <Input
              data-testid="username-input"
              id="username-input"
              value={settings.username}
              onChange={(e) => handleUpdateSetting('username', e.target.value)}
              placeholder="Enter username"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="city-select">Preferred City</Label>
            <Select
              value={settings.preferredCity}
              onValueChange={(value) => handleUpdateSetting('preferredCity', value)}
            >
              <SelectTrigger data-testid="city-select" id="city-select" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Preferred Sports</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {sports.map((sport) => {
                const isSelected = settings.preferredSports?.includes(sport);
                return (
                  <button
                    key={sport}
                    data-testid={`sport-toggle-${sport}`}
                    onClick={() => {
                      const updated = isSelected
                        ? settings.preferredSports.filter(s => s !== sport)
                        : [...(settings.preferredSports || []), sport];
                      handleUpdateSetting('preferredSports', updated);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all capitalize ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {sport}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <div>
                <div className="font-semibold">Dark Mode</div>
                <div className="text-xs text-muted-foreground">
                  Toggle appearance
                </div>
              </div>
            </div>
            <Switch
              data-testid="dark-mode-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <div>
                <div className="font-semibold">Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Event reminders
                </div>
              </div>
            </div>
            <Switch
              data-testid="notifications-toggle"
              checked={settings.notifications}
              onCheckedChange={(checked) => handleUpdateSetting('notifications', checked)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                data-testid="clear-data-button"
                variant="outline"
                className="w-full h-12 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Clear All Local Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your data including favorites, cart, and order history.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="cancel-clear-data">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  data-testid="confirm-clear-data"
                  onClick={handleClearData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="pt-6 text-center text-sm text-muted-foreground">
          <p>SportTix v1.0.0</p>
          <p className="mt-1">Progressive Web App</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
