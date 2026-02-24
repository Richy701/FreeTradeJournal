import { Menu, X, User, LogOut, UserPlus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useThemePresets } from '@/contexts/theme-presets';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { AccountSwitcher } from '@/components/account-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

export function MobileHeader({ title }: { title?: string }) {
  const { toggleSidebar, openMobile } = useSidebar();
  const { themeColors } = useThemePresets();
  const { user, isDemo, exitDemoMode, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mobile-header sticky top-0 z-50 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between px-3 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden h-10 w-10"
          aria-label="Toggle menu"
        >
          {openMobile ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-1.5 min-w-0">
          <img src="/favicon.svg" alt="FTJ" className="w-5 h-5 rounded flex-shrink-0" />
          <span className="font-semibold text-sm truncate">
            {title || 'FreeTradeJournal'}
          </span>
          {isDemo && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded flex-shrink-0">
              Demo
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
        {isDemo ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label="Demo menu">
                <Avatar className="h-7 w-7 rounded-full ring-1 ring-amber-500/50">
                  <AvatarFallback className="rounded-full text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Eye className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="min-w-40 rounded-lg">
              <DropdownMenuItem asChild>
                <Link to="/signup" onClick={() => exitDemoMode()} className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up Free
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { exitDemoMode(); navigate('/'); }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Exit Demo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label="User menu">
                <Avatar className="h-7 w-7 rounded-full ring-1 ring-border">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                  <AvatarFallback className="rounded-full text-xs">
                    {(user.displayName || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="min-w-40 rounded-lg">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try { await logout(); navigate('/login'); } catch (e) { console.error('Failed to logout:', e); }
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex-shrink-0 w-8" />
        )}
        </div>
      </div>

      {!isDemo && (
        <div className="px-3 pb-2 border-b border-border/30 overflow-hidden min-w-0">
          <AccountSwitcher />
        </div>
      )}
    </div>
  );
}
