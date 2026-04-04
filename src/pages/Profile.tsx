import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Check, Mail, Calendar, Shield, Pencil, LogOut } from 'lucide-react';
import { useThemePresets } from '@/contexts/theme-presets';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { useUserStorage } from '@/utils/user-storage';
import { toast } from 'sonner';

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9',
];

const AVATAR_EMOJIS = [
  '🚀', '💎', '🦁', '🐯', '🦅', '🦊',
  '⚡', '🔥', '🏆', '👑', '🎯', '📈',
  '💰', '🌙', '⭐', '🧠', '💪', '🤖',
  '🎲', '🌊',
];

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
  const navigate = useNavigate();
  const userStorage = useUserStorage();

  const [avatarUrl, setAvatarUrl] = useState<string>(() => userStorage.getItem('avatar') || '');
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => userStorage.getItem('avatarEmoji') || '');
  const [avatarColor, setAvatarColor] = useState<string>(() => userStorage.getItem('avatarColor') || '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const activeBg = avatarColor || themeColors.primary;
  const initials = getInitials(user.displayName || user.email || 'U');

  const recentTrades = (() => {
    try {
      const all = JSON.parse(userStorage.getItem('trades') || '[]');
      return [...all]
        .sort((a: any, b: any) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime())
        .slice(0, 5);
    } catch { return []; }
  })();

  const activeGoals = (() => {
    try {
      return (JSON.parse(userStorage.getItem('goals') || '[]') as any[])
        .filter((g: any) => g.status !== 'achieved' && g.status !== 'failed')
        .slice(0, 4);
    } catch { return []; }
  })();

  // ── avatar handlers ────────────────────────────────────────────────

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }

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
    userStorage.removeItem('avatar');
    setAvatarEmoji(emoji);
    setAvatarUrl('');
    setPickerOpen(false);
    toast.success('Avatar updated');
  }, [userStorage]);

  const selectColor = useCallback((color: string) => {
    userStorage.setItem('avatarColor', color);
    setAvatarColor(color);
    // Keep any emoji / photo as-is, just changes the tint
    toast.success('Color updated');
  }, [userStorage]);

  const handleSaveName = async () => {
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase-lazy');
      const { updateProfile } = await import('firebase/auth');
      const auth = await getFirebaseAuth();
      if (auth.currentUser && displayName.trim()) {
        await updateProfile(auth.currentUser, { displayName: displayName.trim() });
        toast.success('Name updated');
      }
    } catch {
      toast.error('Failed to update name');
    }
    setIsEditingName(false);
  };

  // ── info rows ─────────────────────────────────────────────────────

  const infoRows = [
    {
      icon: Mail,
      label: 'Email',
      value: user.email || '—',
      badge: user.emailVerified ? { text: 'Verified', className: 'text-emerald-600 bg-emerald-500/10' } : { text: 'Unverified', className: 'text-red-500 bg-red-500/10' },
    },
    {
      icon: Calendar,
      label: 'Member since',
      value: user.metadata?.creationTime ? new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(user.metadata.creationTime)) : '—',
    },
    {
      icon: Calendar,
      label: 'Last sign in',
      value: user.metadata?.lastSignInTime ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(user.metadata.lastSignInTime)) : '—',
    },
    {
      icon: Shield,
      label: 'User ID',
      value: user.uid,
      mono: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4">

<div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 items-start">

          {/* ── Hero card ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            {/* Gradient banner */}
            <div
              className="h-24 sm:h-32"
              style={{ background: `linear-gradient(135deg, ${alpha(themeColors.primary, '70')} 0%, ${alpha(themeColors.primary, '25')} 100%)` }}
            />

            {/* Avatar row */}
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-12 mb-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                    {avatarUrl
                      ? <AvatarImage src={avatarUrl} alt="Avatar" />
                      : null
                    }
                    <AvatarFallback
                      className="text-2xl font-bold text-white"
                      style={{ backgroundColor: activeBg }}
                    >
                      {avatarEmoji || initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setPickerOpen(v => !v)}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted shadow-sm hover:bg-muted/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/60"
                    aria-label="Change avatar"
                    aria-expanded={pickerOpen}
                  >
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Edit name button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 gap-1.5"
                  onClick={() => setIsEditingName(v => !v)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {isEditingName ? 'Cancel' : 'Edit name'}
                </Button>
              </div>

              {/* Name + meta */}
              {isEditingName ? (
                <div className="flex gap-2 mb-3">
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
                <h2 className="text-xl font-bold mb-1">{user.displayName || 'No name set'}</h2>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{user.email}</span>
                <span className="text-border">·</span>
                <span>{getAccountAge(user.metadata?.creationTime)}</span>
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
                    <div className="grid grid-cols-10 gap-1.5">
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
          </div>

          {/* ── Right column ──────────────────────────────────────── */}
          <div className="space-y-4">

          {/* ── Account details ───────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 divide-y divide-border/50 overflow-hidden">
            {infoRows.map(({ icon: Icon, label, value, badge, mono }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                  <Icon className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className={`text-sm font-medium truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                </div>
                {badge && (
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                    {badge.text}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Recent Trades ─────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 rounded-full" style={{ backgroundColor: themeColors.primary }} />
                <h3 className="text-sm font-semibold">Recent Trades</h3>
              </div>
              <a href="/trades" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</a>
            </div>
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
                      <span className={`text-sm font-semibold tabular-nums ${isWin ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isWin ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Active Goals ───────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 rounded-full" style={{ backgroundColor: themeColors.primary }} />
                <h3 className="text-sm font-semibold">Active Goals</h3>
              </div>
              <a href="/goals" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</a>
            </div>
            {activeGoals.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No active goals.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {activeGoals.map((g: any) => {
                  const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
                  const isDone = pct >= 100;
                  return (
                    <div key={g.id} className="px-5 py-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{g.title}</span>
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

          </div> {/* end right column */}
          </div> {/* end grid */}

          {/* ── Sign out ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-destructive/5 transition-colors group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" aria-hidden="true" />
              </div>
              <span className="flex-1 text-sm font-medium text-destructive">Sign out</span>
            </button>
          </div>

        </div>
      </div>

      <AppFooter />
    </div>
  );
}
