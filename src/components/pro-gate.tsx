import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useProStatus } from '@/contexts/pro-context';

interface ProGateProps {
  children: ReactNode;
  featureName: string;
}

export function ProGate({ children, featureName }: ProGateProps) {
  const { isPro, isLoading } = useProStatus();

  // Hide content entirely while loading to prevent flash of unblurred content
  if (isLoading) {
    return null;
  }

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[2px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg">
        <div className="flex flex-col items-center gap-3 text-center p-6">
          <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{featureName}</p>
            <p className="text-xs text-muted-foreground">This feature requires a Pro subscription</p>
          </div>
          <Link
            to="/pricing"
            className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
