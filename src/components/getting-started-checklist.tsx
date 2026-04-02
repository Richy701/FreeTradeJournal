import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp, BookOpen, Target, TrendingUp, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useUserStorage } from '@/utils/user-storage';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  done: boolean;
  proOnly?: boolean;
}

const DISMISS_KEY_PREFIX = 'getting-started-dismissed-v1-';

export function GettingStartedChecklist() {
  const { user, isDemo } = useAuth();
  const { isPro } = useProStatus();
  const userStorage = useUserStorage();
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (!user || isDemo) return;

    const dismissKey = `${DISMISS_KEY_PREFIX}${user.uid}`;
    if (localStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }

    // Read all the data we need to check completion
    const tradesRaw = userStorage.getItem('trades');
    const journalRaw = userStorage.getItem('journalEntries');
    const goalsRaw = userStorage.getItem('tradingGoals');

    const trades = tradesRaw ? (() => { try { return JSON.parse(tradesRaw); } catch { return []; } })() : [];
    const journal = journalRaw ? (() => { try { return JSON.parse(journalRaw); } catch { return []; } })() : [];
    const goals = goalsRaw ? (() => { try { return JSON.parse(goalsRaw); } catch { return []; } })() : [];

    const hasTrades = Array.isArray(trades) && trades.length > 0;
    const hasJournal = Array.isArray(journal) && journal.length > 0;
    // Default goals are auto-created with IDs '1' and '2' — only count as done if user added their own
    const DEFAULT_GOAL_IDS = new Set(['1', '2']);
    const hasGoals = Array.isArray(goals) && goals.some((g: { id?: string }) => !DEFAULT_GOAL_IDS.has(g.id ?? ''));

    const checklist: ChecklistItem[] = [
      {
        id: 'account',
        label: 'Create your account',
        description: 'You\'re in. Welcome to FreeTradeJournal.',
        icon: Check,
        href: '/dashboard',
        done: true,
      },
      {
        id: 'trade',
        label: 'Log your first trade',
        description: 'Add a trade manually or import a CSV from your broker.',
        icon: TrendingUp,
        href: '/trades',
        done: hasTrades,
      },
      {
        id: 'journal',
        label: 'Write a journal entry',
        description: 'Document your analysis, emotions, and what you learned.',
        icon: BookOpen,
        href: '/journal',
        done: hasJournal,
      },
      {
        id: 'goal',
        label: 'Set a goal or risk rule',
        description: 'Hold yourself accountable with a profit target or loss limit.',
        icon: Target,
        href: '/goals',
        done: hasGoals,
      },
      {
        id: 'ai',
        label: 'Check your AI coach',
        description: isPro ? 'Get personalised coaching based on your trading patterns.' : 'Upgrade to Pro to unlock AI-powered coaching tips.',
        icon: Bot,
        href: isPro ? '/dashboard' : '/pricing',
        done: isPro,
        proOnly: true,
      },
    ];

    setItems(checklist);

    // Auto-dismiss once all non-pro items are done
    const coreItems = checklist.filter(i => !i.proOnly);
    if (coreItems.every(i => i.done)) {
      localStorage.setItem(dismissKey, '1');
      setDismissed(true);
    }
  }, [user, isDemo, isPro, userStorage]);

  function dismiss() {
    if (!user) return;
    localStorage.setItem(`${DISMISS_KEY_PREFIX}${user.uid}`, '1');
    setDismissed(true);
  }

  if (dismissed || isDemo || !user || items.length === 0) return null;

  const doneCount = items.filter(i => i.done).length;
  const totalCount = items.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  return (
    <div className="mx-4 mb-4 rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-sm font-semibold">Get started</p>
            <span className="text-xs text-muted-foreground">
              {doneCount}/{totalCount} done
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={dismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="divide-y divide-border/40">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors group ${
                  item.done ? 'opacity-60' : 'hover:bg-muted/40'
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    item.done
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/40 group-hover:border-primary/60'
                  }`}
                >
                  {item.done && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.done ? 'bg-muted' : 'bg-primary/10'
                }`}>
                  <Icon className={`h-4 w-4 ${item.done ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-none mb-0.5 ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                    {item.label}
                    {item.proOnly && !isPro && (
                      <span className="ml-2 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">PRO</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>

                {/* Arrow for incomplete */}
                {!item.done && (
                  <span className="text-muted-foreground text-xs flex-shrink-0 group-hover:text-foreground transition-colors">→</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
