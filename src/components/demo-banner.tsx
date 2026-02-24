import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { X, Info } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

const DISMISS_KEY = 'demo-banner-dismissed';

export function DemoBanner() {
  const { isDemo, exitDemoMode } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem(DISMISS_KEY) === 'true';
  });
  const bannerRef = useRef<HTMLDivElement>(null);

  const updateBannerHeight = useCallback(() => {
    const height = bannerRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--demo-banner-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (isDemo && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      document.documentElement.style.setProperty('--demo-banner-height', '0px');
    }
  }, [isDemo, isDismissed]);

  useEffect(() => {
    if (!isVisible) return;
    updateBannerHeight();
    window.addEventListener('resize', updateBannerHeight);
    return () => window.removeEventListener('resize', updateBannerHeight);
  }, [isVisible, updateBannerHeight]);

  if (!isDemo || isDismissed) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--demo-banner-height', '0px');
    setTimeout(() => {
      setIsDismissed(true);
      sessionStorage.setItem(DISMISS_KEY, 'true');
    }, 300);
  };

  return (
    <div
      ref={bannerRef}
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] text-black px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 0.625rem)` }}
    >
      <div className="container mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            <span className="sm:hidden">Demo mode — sample data</span>
            <span className="hidden sm:inline">You're viewing a demo with sample data. Sign up to save your real trades!</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Link to="/signup">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exitDemoMode()}
              className="font-semibold border-black/30 bg-black/10 text-black hover:bg-black/20 hover:text-black text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3"
            >
              Sign Up
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-black/15 rounded-md transition-colors touch-manipulation"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}