import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Shield, ChartBar, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      necessary: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      necessary: true,
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
        >
          <div className="max-w-2xl mx-auto">
            <Card className="border-border shadow-lg">
              <CardContent className="p-4 sm:p-5">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBanner(false)}
                    className="absolute top-0 right-0 h-6 w-6 p-0"
                    aria-label="Close cookie banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>

                  <div className="flex flex-col items-center text-center mb-3">
                    <Cookie className="w-5 h-5 text-primary mb-2" />
                    <h3 className="text-sm font-semibold mb-1">Cookie Preferences</h3>
                    <p className="text-xs text-muted-foreground">
                      We use cookies to improve your experience and analyze platform usage.
                    </p>
                  </div>

                    {showDetails && (
                      <div className="grid gap-2 mb-3 text-xs justify-items-center">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-green-500" />
                          <span className="font-medium">Necessary</span>
                          <span className="text-muted-foreground">Always active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChartBar className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium">Analytics</span>
                          <span className="text-muted-foreground">Usage insights</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-3.5 h-3.5 text-purple-500" />
                          <span className="font-medium">Functional</span>
                          <span className="text-muted-foreground">Enhanced features</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        onClick={handleAcceptAll}
                        size="sm"
                        className="h-8 px-4 text-xs"
                      >
                        Accept All
                      </Button>
                      <Button
                        onClick={handleAcceptNecessary}
                        variant="secondary"
                        size="sm"
                        className="h-8 px-4 text-xs"
                      >
                        Necessary Only
                      </Button>
                      <Button
                        onClick={handleCustomize}
                        variant="outline"
                        size="sm"
                        className="h-8 px-4 text-xs"
                      >
                        {showDetails ? 'Hide' : 'Details'}
                      </Button>
                    </div>

                  <p className="text-[10px] text-muted-foreground mt-2.5 text-center">
                    By using our site, you agree to our{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};