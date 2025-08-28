import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useThemePresets } from '@/contexts/theme-presets';
import { cn } from '@/lib/utils';

export function MobileHeader({ title }: { title?: string }) {
  const { toggleSidebar, openMobile } = useSidebar();
  const { themeColors } = useThemePresets();

  return (
    <div className="sticky top-0 z-50 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          {openMobile ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded flex items-center justify-center text-white"
            style={{ backgroundColor: themeColors.primary }}
          >
            <span className="text-xs font-bold">T</span>
          </div>
          <span className="font-semibold text-sm">
            {title || 'TradeVault'}
          </span>
        </div>
        
        <div className="w-10" /> {/* Spacer for balance */}
      </div>
    </div>
  );
}