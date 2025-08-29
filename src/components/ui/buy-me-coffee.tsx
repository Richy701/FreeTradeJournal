import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const handleClick = () => {
    window.open(`https://www.buymeacoffee.com/${username}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`gap-2 ${className}`}
    >
      <Coffee className="h-4 w-4" />
      <span className="hidden sm:inline">Buy me a coffee</span>
      <span className="sm:hidden">Support</span>
    </Button>
  );
}