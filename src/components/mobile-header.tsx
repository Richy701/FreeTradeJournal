import { Menu, X, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useThemePresets } from '@/contexts/theme-presets';
import { useAuth } from '@/contexts/auth-context';
import { AccountSwitcher } from '@/components/account-switcher';
import { cn } from '@/lib/utils';

export function MobileHeader({ title }: { title?: string }) {
  const { toggleSidebar, openMobile } = useSidebar();
  const { themeColors } = useThemePresets();
  const { isDemo } = useAuth();

  return (
    <div className="sticky top-0 z-50 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between px-3 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden h-8 w-8"
          aria-label="Toggle menu"
        >
          {openMobile ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
          >
            <LineChart className="size-3" />
          </div>
          <span className="font-semibold text-sm truncate">
            {title || 'FreeTradeJournal'}
          </span>
        </div>

        <div className="flex-shrink-0 w-8" />
      </div>

      {/* Account switcher row */}
      {!isDemo && (
        <div className="px-3 pb-2 border-b border-border/30">
          <AccountSwitcher />
        </div>
      )}
    </div>
  );
}
