import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { User, TrendingUp, Lock } from 'lucide-react';

export function DemoCtaCard() {
  const { isDemo, exitDemoMode } = useAuth();

  if (!isDemo) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Ready to Track Your Real Trades?
        </CardTitle>
        <CardDescription>
          You're currently exploring with demo data. Sign up free to start tracking your actual trading performance!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Save Your Trading History</p>
              <p className="text-sm text-muted-foreground">Track all your trades permanently in the cloud</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Private & Secure</p>
              <p className="text-sm text-muted-foreground">Your data is encrypted and only accessible by you</p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link to="/signup" className="block">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => exitDemoMode()}
            >
              Sign Up Free - No Credit Card Required
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}