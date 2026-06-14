import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { CaretDown, Funnel, X, SortAscending, SortDescending } from '@phosphor-icons/react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type TradeOutcome = 'all' | 'win' | 'loss' | 'breakeven';
export type SortField = 'date' | 'pnl' | 'symbol';
export type SortDir = 'asc' | 'desc';

export interface TradeFilters {
  symbols: string[];
  sides: Array<'long' | 'short'>;
  markets: string[];
  outcome: TradeOutcome;
  strategies: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: SortField;
  sortDir: SortDir;
}

export const EMPTY_FILTERS: TradeFilters = {
  symbols: [],
  sides: [],
  markets: [],
  outcome: 'all',
  strategies: [],
  dateFrom: undefined,
  dateTo: undefined,
  sortBy: 'date',
  sortDir: 'desc',
};

/** Sort is intentionally excluded — it is not a "filter" and never produces a pill. */
export function countActiveFilters(f: TradeFilters): number {
  return (
    f.symbols.length +
    f.sides.length +
    f.markets.length +
    f.strategies.length +
    (f.outcome !== 'all' ? 1 : 0) +
    (f.dateFrom ? 1 : 0) +
    (f.dateTo ? 1 : 0)
  );
}

/** Reset filters while preserving the user's current sort choice. */
function clearedFilters(f: TradeFilters): TradeFilters {
  return { ...EMPTY_FILTERS, sortBy: f.sortBy, sortDir: f.sortDir };
}

interface Option {
  value: string;
  label: string;
}

const OUTCOME_OPTIONS: Array<{ value: TradeOutcome; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'win', label: 'Winners' },
  { value: 'loss', label: 'Losers' },
  { value: 'breakeven', label: 'Breakeven' },
];

const SORT_FIELDS: Array<{ value: SortField; label: string }> = [
  { value: 'date', label: 'Date' },
  { value: 'pnl', label: 'P&L' },
  { value: 'symbol', label: 'Symbol' },
];

/** Small amber count badge shown on a trigger when that facet has selections. */
function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
      {children}
    </span>
  );
}

/** A single multi-select facet rendered as a Popover with a searchable checkbox list. */
function FacetPopover({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 sm:h-8 gap-1.5 text-xs">
          {label}
          {selected.length > 0 && <CountBadge>{selected.length}</CountBadge>}
          <CaretDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          {options.length > 8 && <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />}
          <CommandList className="max-h-60">
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <CommandItem key={opt.value} value={opt.label} onSelect={() => onToggle(opt.value)} className="gap-2">
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Inline filter + sort bar: a single row of compact facet controls with the
 * active selections surfaced as removable pills underneath.
 */
export function TradeLogFilters({
  filters,
  onChange,
  symbolOptions,
  marketOptions,
  strategyOptions,
}: {
  filters: TradeFilters;
  onChange: (next: TradeFilters) => void;
  symbolOptions: string[];
  marketOptions: string[];
  strategyOptions: string[];
}) {
  const toggle = (key: 'symbols' | 'markets' | 'strategies', value: string) => {
    const arr = filters[key];
    onChange({
      ...filters,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    });
  };

  const toggleSide = (value: 'long' | 'short') => {
    onChange({
      ...filters,
      sides: filters.sides.includes(value)
        ? filters.sides.filter((v) => v !== value)
        : [...filters.sides, value],
    });
  };

  const activeCount = countActiveFilters(filters);
  const hasDate = Boolean(filters.dateFrom || filters.dateTo);
  const sortLabel = SORT_FIELDS.find((f) => f.value === filters.sortBy)?.label ?? 'Date';

  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Funnel className="h-3.5 w-3.5" />
          Filter
        </span>

        <FacetPopover
          label="Symbol"
          options={symbolOptions.map((s) => ({ value: s, label: s }))}
          selected={filters.symbols}
          onToggle={(v) => toggle('symbols', v)}
        />

        <FacetPopover
          label="Side"
          options={[
            { value: 'long', label: 'Long' },
            { value: 'short', label: 'Short' },
          ]}
          selected={filters.sides}
          onToggle={(v) => toggleSide(v as 'long' | 'short')}
        />

        <FacetPopover
          label="Market"
          options={marketOptions.map((m) => ({ value: m, label: m.toUpperCase() }))}
          selected={filters.markets}
          onToggle={(v) => toggle('markets', v)}
        />

        <FacetPopover
          label="Strategy"
          options={strategyOptions.map((s) => ({ value: s, label: s }))}
          selected={filters.strategies}
          onToggle={(v) => toggle('strategies', v)}
        />

        {/* Outcome */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 sm:h-8 gap-1.5 text-xs">
              Outcome
              {filters.outcome !== 'all' && (
                <CountBadge>{OUTCOME_OPTIONS.find((o) => o.value === filters.outcome)?.label}</CountBadge>
              )}
              <CaretDown className="h-3 w-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-40 p-1"
            align="end"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {OUTCOME_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => onChange({ ...filters, outcome: o.value })}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                  filters.outcome === o.value ? 'font-semibold text-primary' : 'text-foreground',
                )}
              >
                {o.label}
                {filters.outcome === o.value && <span className="text-xs">•</span>}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Date range — a single inline range calendar (no nested pickers) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 sm:h-8 gap-1.5 text-xs">
              Date range
              {hasDate && <CountBadge>1</CountBadge>}
              <CaretDown className="h-3 w-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-2 space-y-2"
            align="end"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={hasDate ? ({ from: filters.dateFrom, to: filters.dateTo } as DateRange) : undefined}
              onSelect={(range: DateRange | undefined) =>
                onChange({ ...filters, dateFrom: range?.from, dateTo: range?.to })
              }
            />
            {hasDate && (
              <div className="flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                <span>
                  {filters.dateFrom ? format(filters.dateFrom, 'MMM d') : '…'} –{' '}
                  {filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : '…'}
                </span>
                <button
                  onClick={() => onChange({ ...filters, dateFrom: undefined, dateTo: undefined })}
                  className="transition-colors hover:text-foreground"
                >
                  Reset
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 sm:h-8 gap-1.5 text-xs">
              {filters.sortDir === 'asc' ? (
                <SortAscending className="h-3.5 w-3.5" />
              ) : (
                <SortDescending className="h-3.5 w-3.5" />
              )}
              {sortLabel}
              <CaretDown className="h-3 w-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2 space-y-2"
            align="end"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <span className="px-1 text-xs font-medium text-muted-foreground">Sort by</span>
            <div className="flex flex-wrap gap-1.5">
              {SORT_FIELDS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onChange({ ...filters, sortBy: f.value })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    filters.sortBy === f.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-md border p-0.5">
              {(
                [
                  { dir: 'asc' as SortDir, label: 'Asc', Icon: SortAscending },
                  { dir: 'desc' as SortDir, label: 'Desc', Icon: SortDescending },
                ]
              ).map(({ dir, label, Icon }) => (
                <button
                  key={dir}
                  onClick={() => onChange({ ...filters, sortDir: dir })}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    filters.sortDir === dir ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange(clearedFilters(filters))}
          >
            Clear all
          </Button>
        )}
    </div>
  );
}

/** Removable pills for every active selection — shown on their own row below the title. */
export function TradeLogFilterPills({
  filters,
  onChange,
}: {
  filters: TradeFilters;
  onChange: (next: TradeFilters) => void;
}) {
  const removeFrom = (key: 'symbols' | 'markets' | 'strategies', value: string) =>
    onChange({ ...filters, [key]: filters[key].filter((v) => v !== value) });

  const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];
  filters.symbols.forEach((s) =>
    pills.push({ key: `sym-${s}`, label: s, onRemove: () => removeFrom('symbols', s) }),
  );
  filters.sides.forEach((s) =>
    pills.push({
      key: `side-${s}`,
      label: s === 'long' ? 'Long' : 'Short',
      onRemove: () => onChange({ ...filters, sides: filters.sides.filter((v) => v !== s) }),
    }),
  );
  filters.markets.forEach((m) =>
    pills.push({ key: `mkt-${m}`, label: m.toUpperCase(), onRemove: () => removeFrom('markets', m) }),
  );
  filters.strategies.forEach((s) =>
    pills.push({ key: `strat-${s}`, label: s, onRemove: () => removeFrom('strategies', s) }),
  );
  if (filters.outcome !== 'all') {
    const lbl = OUTCOME_OPTIONS.find((o) => o.value === filters.outcome)?.label ?? filters.outcome;
    pills.push({ key: 'outcome', label: lbl, onRemove: () => onChange({ ...filters, outcome: 'all' }) });
  }
  if (filters.dateFrom) {
    pills.push({
      key: 'from',
      label: `From ${format(filters.dateFrom, 'MMM d, yyyy')}`,
      onRemove: () => onChange({ ...filters, dateFrom: undefined }),
    });
  }
  if (filters.dateTo) {
    pills.push({
      key: 'to',
      label: `To ${format(filters.dateTo, 'MMM d, yyyy')}`,
      onRemove: () => onChange({ ...filters, dateTo: undefined }),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pills.map((p) => (
        <Badge key={p.key} variant="outline" className="gap-1 bg-muted/50 pl-2 pr-1 py-0.5 font-medium">
          {p.label}
          <button
            onClick={p.onRemove}
            className="rounded-sm p-0.5 transition-colors hover:bg-muted-foreground/20"
            aria-label={`Remove ${p.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
