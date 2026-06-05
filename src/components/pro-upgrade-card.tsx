import { Link } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';

interface ProUpgradeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: string;
  dismissKey?: string;
}

export function ProUpgradeCard({ icon: Icon, title, description, cta = 'Start free trial', dismissKey }: ProUpgradeCardProps) {
  const { user, isDemo } = useAuth();
  const { isPro, isLoading } = useProStatus();

  if (!user || isDemo || isPro || isLoading) return null;

  if (dismissKey) {
    const key = `pro-nudge-${dismissKey}-${user.uid}`;
    if (localStorage.getItem(key)) return null;
  }

  return (
    <Link
      to="/pricing"
      className="group block rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-4"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-500/10 p-2 flex-shrink-0">
          <Icon className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          <span className="inline-block text-xs font-semibold text-amber-500 mt-2 group-hover:underline">
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  );
}
