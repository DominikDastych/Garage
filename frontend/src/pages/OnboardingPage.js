import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { settingsApi } from '@/services/settingsApi';
import { cn } from '@/lib/utils';

const sports = [
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'hockey', label: 'Hockey', emoji: '🏒' },
];

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'London', 'Madrid', 
  'Manchester', 'Toronto', 'Melbourne'
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  const slides = [
    {
      title: 'Welcome to SportTix',
      subtitle: 'Your ticket to the best sports events',
      description: 'Buy tickets for football, basketball, tennis, hockey and more. All in one app.',
    },
    {
      title: 'Never Miss a Game',
      subtitle: 'Stay updated with your favorite teams',
      description: 'Get notifications for upcoming matches and exclusive deals.',
    },
    {
      title: 'Fast & Secure',
      subtitle: 'Your tickets, always ready',
      description: 'Digital tickets with QR codes. Access them anytime, anywhere.',
    },
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      setStep(slides.length);
    }
  };

  const toggleSport = (sportId) => {
    setSelectedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(s => s !== sportId)
        : [...prev, sportId]
    );
  };

  const handleComplete = async () => {
    try {
      await settingsApi.update({
        onboardingComplete: true,
        preferredSports: selectedSports,
        preferredCity: selectedCity || 'New York',
      });
      navigate('/home');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (step < slides.length) {
    const slide = slides[step];
    return (
      <div 
        data-testid="onboarding-slide"
        className="min-h-screen bg-background flex flex-col"
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-32 h-32 mb-8 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="text-6xl">
              {step === 0 ? '🎫' : step === 1 ? '🔔' : '⚡'}
            </div>
          </div>
          
          <h1 
            data-testid="onboarding-title"
            className="font-headings font-black text-4xl md:text-5xl uppercase tracking-tighter mb-4"
          >
            {slide.title}
          </h1>
          
          <p className="font-headings font-bold text-xl text-accent mb-4">
            {slide.subtitle}
          </p>
          
          <p className="text-muted-foreground max-w-sm">
            {slide.description}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center gap-2 mb-4">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === step ? "w-8 bg-primary" : "w-2 bg-muted"
                )}
              />
            ))}
          </div>

          <Button
            data-testid="onboarding-next-button"
            onClick={handleNext}
            className="w-full h-12 text-lg"
          >
            {step === slides.length - 1 ? "Let's Get Started" : 'Next'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          {step === 0 && (
            <button
              data-testid="onboarding-skip-button"
              onClick={() => navigate('/home')}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      data-testid="onboarding-preferences"
      className="min-h-screen bg-background pb-20"
    >
      <div className="max-w-md mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="font-headings font-black text-3xl uppercase tracking-tighter mb-2">
            Personalize Your Experience
          </h1>
          <p className="text-muted-foreground">
            Select your favorite sports and city
          </p>
        </div>

        <div>
          <h3 
            data-testid="sports-selection-title"
            className="font-headings font-bold text-xl uppercase mb-4"
          >
            Favorite Sports
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sports.map((sport) => (
              <button
                key={sport.id}
                data-testid={`sport-option-${sport.id}`}
                onClick={() => toggleSport(sport.id)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                  selectedSports.includes(sport.id)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-3xl">{sport.emoji}</span>
                <span className="font-headings font-bold uppercase text-sm">
                  {sport.label}
                </span>
                {selectedSports.includes(sport.id) && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 
            data-testid="city-selection-title"
            className="font-headings font-bold text-xl uppercase mb-4"
          >
            Preferred City
          </h3>
          <div className="space-y-2">
            {cities.map((city) => (
              <button
                key={city}
                data-testid={`city-option-${city.toLowerCase().replace(' ', '-')}`}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between",
                  selectedCity === city
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="font-body font-medium">{city}</span>
                {selectedCity === city && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Button
          data-testid="complete-onboarding-button"
          onClick={handleComplete}
          disabled={selectedSports.length === 0 || !selectedCity}
          className="w-full h-12 text-lg"
        >
          Complete Setup
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
