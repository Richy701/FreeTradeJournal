import { Coffee } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface BuyMeCoffeeProps {
  username?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function BuyMeCoffee({ 
  username = 'richy701',
  variant = 'outline',
  size = 'default',
  className = ''
}: BuyMeCoffeeProps) {
  return (
    <a
      href={`https://www.buymeacoffee.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`gap-2 ${buttonVariants({ variant, size })} ${className}`}
      aria-label="Buy me a coffee"
    >
      <Coffee className="h-4 w-4" />
      <span className="hidden sm:inline">Buy me a coffee</span>
      <span className="sm:hidden">Support</span>
    </a>
  );
}