import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DatePicker } from '@/components/ui/date-picker';
import { CaretDown, Funnel, X } from '@phosphor-icons/react';
import { format } from 'date-fns';

export type TradeOutcome = 'all' | 'win' | 'loss' | 'breakeven';

export interface TradeFilters {
  symbols: string[];
  sides: Array<'long' | 'short'>;
  markets: string[];
  outcome: TradeOutcome;
  strategies: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export const EMPTY_FILTERS: TradeFilters = {
  symbols: [],
  sides: [],
  markets: [],
  outcome: 'all',
  strategies: [],
  dateFrom: undefined,
  dateTo: undefined,
};

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

interface Option {
  value: string;
  label: string;
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
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          {label}
          {selected.length > 0 && (
            <span className="ml-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {selected.length}
            </span>
          )}
          <CaretDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          {options.length > 8 && <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />}
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => onToggle(opt.value)}
                    className="gap-2"
                  >
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

const OUTCOME_OPTIONS: Array<{ value: TradeOutcome; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'win', label: 'Winners' },
  { value: 'loss', label: 'Losers' },
  { value: 'breakeven', label: 'Breakeven' },
];

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

  // Build removable pills for every active selection.
  const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];
  filters.symbols.forEach((s) =>
    pills.push({ key: `sym-${s}`, label: s, onRemove: () => toggle('symbols', s) }),
  );
  filters.sides.forEach((s) =>
    pills.push({ key: `side-${s}`, label: s === 'long' ? 'Long' : 'Short', onRemove: () => toggleSide(s) }),
  );
  filters.markets.forEach((m) =>
    pills.push({ key: `mkt-${m}`, label: m.toUpperCase(), onRemove: () => toggle('markets', m) }),
  );
  filters.strategies.forEach((s) =>
    pills.push({ key: `strat-${s}`, label: s, onRemove: () => toggle('strategies', s) }),
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
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
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Outcome
              {filters.outcome !== 'all' && (
                <span className="ml-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {OUTCOME_OPTIONS.find((o) => o.value === filters.outcome)?.label}
                </span>
              )}
              <CaretDown className="h-3 w-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start">
            {OUTCOME_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => onChange({ ...filters, outcome: o.value })}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
                  filters.outcome === o.value ? 'font-semibold text-primary' : 'text-foreground'
                }`}
              >
                {o.label}
                {filters.outcome === o.value && <span className="text-xs">•</span>}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Date range
              {(filters.dateFrom || filters.dateTo) && (
                <span className="ml-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  1
                </span>
              )}
              <CaretDown className="h-3 w-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 space-y-3" align="start">
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-muted-foreground">From</span>
              <DatePicker
                date={filters.dateFrom}
                onDateChange={(d) => onChange({ ...filters, dateFrom: d })}
                placeholder="Start date"
                className="w-full h-9"
              />
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-muted-foreground">To</span>
              <DatePicker
                date={filters.dateTo}
                onDateChange={(d) => onChange({ ...filters, dateTo: d })}
                placeholder="End date"
                className="w-full h-9"
              />
            </div>
          </PopoverContent>
        </Popover>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            Clear all
          </Button>
        )}
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {pills.map((p) => (
            <Badge
              key={p.key}
              variant="outline"
              className="gap-1 bg-muted/50 pl-2 pr-1 py-0.5 font-medium"
            >
              {p.label}
              <button
                onClick={p.onRemove}
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
                aria-label={`Remove ${p.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
