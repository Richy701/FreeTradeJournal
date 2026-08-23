import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/settings-context';
import { useDemoData } from '@/hooks/use-demo-data';
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Check, Pencil, SignOut, UserCircle } from '@phosphor-icons/react';
import { useThemePresets } from '@/contexts/theme-presets';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { useUserStorage } from '@/utils/user-storage';
import { computeGoalProgress, getGoalTitle } from '@/lib/goal-progress';
import { useLoggingStreak } from '@/hooks/use-logging-streak';
import { toast } from 'sonner';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/constants/avatars';
import { fetchIdeaProfile } from '@/lib/trade-ideas';
import { profileHitRate, type IdeaProfile } from '@/types/trade-ideas';


function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAccountAge(creationTime?: string) {
  if (!creationTime) return 'New member';
  const months = Math.floor((Date.now() - new Date(creationTime).getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return 'New member';
  if (months < 12) return `${months}mo member`;
  const years = Math.floor(months / 12);
  return `${years}yr member`;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { themeColors, alpha } = useThemePresets();
  const { formatCurrency } = useSettings();
  const { getTrades } = useDemoData();
  const demoGuard = useDemoGuard();
  const navigate = useNavigate();
  const userStorage = useUserStorage();
  const { streak } = useLoggingStreak();

  const [avatarUrl, setAvatarUrl] = useState<string>(() => userStorage.getItem('avatar') || '');
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => userStorage.getItem('avatarEmoji') || '');
  const [avatarColor, setAvatarColor] = useState<string>(() => userStorage.getItem('avatarColor') || '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  // Community handle + idea track record (Trade Ideas). Null until claimed.
  const [ideaProfile, setIdeaProfile] = useState<IdeaProfile | null>(null);
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    fetchIdeaProfile(user.uid)
      .then(p => { if (!cancelled) setIdeaProfile(p); })
      .catch(() => { /* profile is optional on this page */ });
    return () => { cancelled = true; };
  }, [user?.uid]);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  // Shown in the heading immediately after a save — the Firebase user object
  // in context doesn't re-render on updateProfile.
  const [savedName, setSavedName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const activeBg = avatarColor || themeColors.primary;
  const initials = getInitials(savedName || user.displayName || user.email || 'U');

  // Account-scoped + demo-aware, matching every other surface — the raw
  // localStorage read mixed all accounts' trades (and currencies) together.
  const scopedTrades = (() => {
    try { return getTrades() as any[]; } catch { return []; }
  })();

  const recentTrades = [...scopedTrades]
    .sort((a: any, b: any) => {
      const ta = a.exitTime ? new Date(a.exitTime).getTime() : 0;
      const tb = b.exitTime ? new Date(b.exitTime).getTime() : 0;
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    })
    .slice(0, 5);

  // PropTracker opens with a stat strip and Goals leads with big figures; this
  // is the same move, built from the trades already loaded above.
  const stats = (() => {
    const closed = scopedTrades.filter((t: any) => typeof t.pnl === 'number');
    const wins = closed.filter((t: any) => t.pnl > 0).length;
    const net = closed.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    return {
      trades: scopedTrades.length,
      winRate: closed.length ? Math.round((wins / closed.length) * 100) : null,
      net,
    };
  })();

  const activeGoals = (() => {
    try {
      // Same store + progress math as the Goals page (`tradingGoals`); the
      // legacy `goals` key is dead and no user flow writes it.
      const goals = JSON.parse(userStorage.getItem('tradingGoals') || '[]') as any[];
      return computeGoalProgress(goals, scopedTrades)
        .filter((g) => !g.achieved)
        .slice(0, 4);
    } catch { return []; }
  })();

  // ── avatar handlers ────────────────────────────────────────────────

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.warning('Please select an image file'); return; }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 256;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      userStorage.setItem('avatar', dataUrl);
      window.dispatchEvent(new Event('profileUpdated'));
      userStorage.removeItem('avatarEmoji');
      setAvatarUrl(dataUrl);
      setAvatarEmoji('');
      setPickerOpen(false);
      toast.success('Photo updated');
    };
    img.src = objectUrl;
    e.target.value = '';
  }, [userStorage]);

  const selectEmoji = useCallback((emoji: string) => {
    userStorage.setItem('avatarEmoji', emoji);
    window.dispatchEvent(new Event('profileUpdated'));
    userStorage.removeItem('avatar');
    setAvatarEmoji(emoji);
    setAvatarUrl('');
    setPickerOpen(false);
    toast.success('Avatar updated');
  }, [userStorage]);

  const selectColor = useCallback((color: string) => {
    userStorage.setItem('avatarColor', color);
    window.dispatchEvent(new Event('profileUpdated'));
    setAvatarColor(color);
    // Keep any emoji / photo as-is, just changes the tint
    toast.success('Color updated');
  }, [userStorage]);

  const handleSaveName = async () => {
    if (demoGuard('update your name')) { setIsEditingName(false); return; }
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase-lazy');
      const { updateProfile } = await import('firebase/auth');
      const auth = await getFirebaseAuth();
      if (auth.currentUser && displayName.trim()) {
        await updateProfile(auth.currentUser, { displayName: displayName.trim() });
        setSavedName(displayName.trim());
        toast.success('Name updated');
      }
    } catch {
      toast.error('Failed to update name');
    }
    setIsEditingName(false);
  };

  // ── info rows ─────────────────────────────────────────────────────

  const emailBadge = user.emailVerified
    ? { text: 'Verified', className: 'text-emerald-600 bg-emerald-500/10' }
    : { text: 'Unverified', className: 'text-red-500 bg-red-500/10' };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg shrink-0" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
              <UserCircle className="h-5 w-5" style={{ color: themeColors.primary }} />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account details and preferences.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-bleed like Settings, Goals and PropTracker — Profile was the only
          page pinned to a narrow centred column. */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Hero identity, same treatment as the Settings account card. */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: alpha(themeColors.primary, '08') }}>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14" style={{ boxShadow: `0 0 0 2px ${alpha(themeColors.primary, '25')}` }}>
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
                <AvatarFallback className="text-lg font-bold text-white" style={{ backgroundColor: activeBg }}>
                  {avatarEmoji || initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setPickerOpen(v => !v)}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted shadow-sm hover:bg-muted/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/60"
                aria-label="Change avatar"
                aria-expanded={pickerOpen}
              >
                <Camera className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex gap-2 max-w-sm">
                  <Input
                    name="displayName"
                    autoComplete="name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    placeholder="Your display name…"
                    className="h-9"
                    autoFocus
                  />
                  <Button size="sm" className="h-9 shrink-0" onClick={handleSaveName}
                    aria-label="Save name"
                    style={{ backgroundColor: themeColors.primary }}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-semibold truncate">
                    {savedName || user.displayName || 'No name set'}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${emailBadge.className}`}>
                    {emailBadge.text}
                  </span>
                </div>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{user.email}</p>
              {ideaProfile && (() => {
                const hit = profileHitRate(ideaProfile);
                return (
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    <Link to="/trade-ideas?scope=mine" className="font-semibold text-foreground hover:underline">@{ideaProfile.handle}</Link>
                    {' · '}{ideaProfile.ideaCount} {ideaProfile.ideaCount === 1 ? 'idea' : 'ideas'} on Trade Ideas
                    {hit && <>{' · '}{ideaProfile.winCount} of {hit.decided} worked</>}
                  </p>
                );
              })()}
              {(user.metadata?.creationTime || user.metadata?.lastSignInTime) && (
                <p className="mt-1 text-xs text-muted-foreground md:hidden">
                  {user.metadata?.creationTime && (
                    <>Member since {new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(user.metadata.creationTime))}</>
                  )}
                  {user.metadata?.creationTime && user.metadata?.lastSignInTime && ' · '}
                  {user.metadata?.lastSignInTime && (
                    <>Last sign in {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(user.metadata.lastSignInTime))}</>
                  )}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground shrink-0 md:hidden"
              onClick={() => setIsEditingName(v => !v)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {isEditingName ? 'Cancel' : 'Edit'}
            </Button>

            <div className="hidden md:flex items-center gap-5 shrink-0 pr-1">
              {user.metadata?.creationTime && (
                <>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Member since</p>
                    <p className="text-sm font-semibold mt-0.5">
                      {new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(user.metadata.creationTime))}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border/70" aria-hidden="true" />
                </>
              )}
              {user.metadata?.lastSignInTime && (
                <>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last sign in</p>
                    <p className="text-sm font-semibold mt-0.5">
                      {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(user.metadata.lastSignInTime))}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border/70" aria-hidden="true" />
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditingName(v => !v)}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {isEditingName ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </div>

          {/* ── Avatar picker ─────────────────────────────────── */}
          {pickerOpen && (
            <div className="mt-4 space-y-5 rounded-xl border border-border/40 bg-muted/30 p-4">
              {/* Reset to initials */}
              {(avatarUrl || avatarEmoji) && (
                <button
                  onClick={() => {
                    userStorage.removeItem('avatar');
                    userStorage.removeItem('avatarEmoji');
                    window.dispatchEvent(new Event('profileUpdated'));
                    setAvatarUrl('');
                    setAvatarEmoji('');
                    toast.success('Reset to initials');
                  }}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-bold" style={{ backgroundColor: avatarColor || themeColors.primary, color: 'white' }}>
                    {initials}
                  </span>
                  Use initials
                </button>
              )}

              {/* Upload */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Upload photo</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors w-full"
                  style={{}}
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Choose image…
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>

              {/* Emoji presets */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Emoji avatar</p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                  {AVATAR_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => selectEmoji(emoji)}
                      className={`flex items-center justify-center rounded-lg text-xl h-9 w-full transition-all ${avatarEmoji === emoji ? 'ring-2 scale-110' : 'hover:bg-muted'}`}
                      style={avatarEmoji === emoji ? { outline: `2px solid ${themeColors.primary}`, backgroundColor: alpha(themeColors.primary, '15') } : {}}
                      aria-label={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color swatches */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Initials colour</p>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => selectColor(color)}
                      className="h-8 w-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{ backgroundColor: color, boxShadow: avatarColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stat strip — the move PropTracker and Goals both make. */}
        <div className="mt-6 grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-border/60">
          <Link to="/trades" className="lg:pr-6 group">
            <p className="text-sm text-muted-foreground">Trades logged</p>
                        <p className="mt-1 text-3xl font-bold tabular-nums group-hover:underline underline-offset-4 decoration-2">{stats.trades}</p>
          </Link>
          <Link to="/dashboard" className="lg:px-6 group">
            <p className="text-sm text-muted-foreground">Win rate</p>
                        <p className="mt-1 text-3xl font-bold tabular-nums group-hover:underline underline-offset-4 decoration-2">
              {stats.winRate === null ? '—' : `${stats.winRate}%`}
            </p>
          </Link>
          <Link to="/trades" className="lg:px-6 group">
            <p className="text-sm text-muted-foreground">Net P&amp;L</p>
            <p
              className="mt-1 text-3xl font-bold tabular-nums group-hover:underline underline-offset-4 decoration-2"
              style={{ color: stats.net === 0 ? undefined : stats.net > 0 ? themeColors.profit : themeColors.loss }}
            >
              {formatCurrency(stats.net, true)}
            </p>
          </Link>
          <Link to="/journal" className="lg:pl-6 group">
            <p className="text-sm text-muted-foreground">Logging streak</p>
                        <p className="mt-1 text-3xl font-bold tabular-nums group-hover:underline underline-offset-4 decoration-2">
              {streak}
              <span className="ml-1 text-base font-medium text-muted-foreground">{streak === 1 ? 'day' : 'days'}</span>
            </p>
          </Link>
        </div>

        {/* Peer cards in a grid, the way Goals and PropTracker lay out. */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent trades</h2>
              <a href="/trades" className="text-xs font-medium hover:underline underline-offset-4" style={{ color: themeColors.primary }}>View all</a>
            </div>
            <div className="rounded-xl border bg-card/50">
              {recentTrades.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No trades yet.</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentTrades.map((t: any) => {
                    const pnl = typeof t.pnl === 'number' ? t.pnl : 0;
                    const isWin = pnl >= 0;
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold truncate">{t.symbol || '—'}</span>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${t.side === 'long' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                              {t.side || '—'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.exitTime ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(t.exitTime)) : '—'}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: isWin ? themeColors.profit : themeColors.loss }}>
                          {formatCurrency(pnl, true)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Active goals</h2>
              <a href="/goals" className="text-xs font-medium hover:underline underline-offset-4" style={{ color: themeColors.primary }}>View all</a>
            </div>
            <div className="rounded-xl border bg-card/50">
              {activeGoals.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No active goals.</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {activeGoals.map((g: any) => {
                    const pct = g.target > 0 ? Math.min(100, Math.round(((g.current || 0) / g.target) * 100)) : 0;
                    const isDone = pct >= 100;
                    return (
                      <div key={g.id} className="px-5 py-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{getGoalTitle(g)}</span>
                          <span className="text-xs tabular-nums text-muted-foreground shrink-0">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: isDone ? '#22c55e' : themeColors.primary }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5">
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="flex items-center gap-2 text-sm font-medium text-destructive hover:underline underline-offset-4"
          >
            <SignOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sign out
          </button>
          <p className="text-xs text-muted-foreground">
            User ID <span className="font-mono">{user.uid}</span>
          </p>
        </div>

      </div>

      <AppFooter />
    </div>
  );
}
