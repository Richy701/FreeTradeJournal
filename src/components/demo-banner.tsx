import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { X, Info } from 'lucide-react';
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
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] text-black px-4 py-3 shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5" />
          <p className="text-sm font-medium">
            You're viewing a demo with sample data. Sign up to save your real trades!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/signup">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exitDemoMode()}
              className="font-semibold border-black/30 bg-black/10 text-black hover:bg-black/20 hover:text-black"
            >
              Sign Up Free
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-black/15 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}