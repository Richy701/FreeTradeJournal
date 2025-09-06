import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DemoBanner() {
  const { isDemo, exitDemoMode } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDemo && !isDismissed) {
      // Delay showing banner for smooth transition
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, isDismissed]);

  if (!isDemo || isDismissed) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300);
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground px-4 py-3 shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <p className="text-sm font-medium">
            You're viewing a demo with sample data. Sign up to save your real trades!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/signup">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => exitDemoMode()}
              className="font-semibold"
            >
              Sign Up Free
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}