import { useId, useState, type KeyboardEvent } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { normalizeTag, dedupeTags, isMistakeTag } from '@/lib/tags';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** Every tag the user has used before; the matching ones are offered as one-tap chips. */
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

const MAX_SUGGESTIONS = 8;

/**
 * Chip-style tag editor. Enter or comma adds the typed tag, Backspace on an
 * empty field removes the last chip, and the tags used before that match what
 * is being typed appear as one-tap chips underneath. Suggestions render inline
 * (no floating list) so the control works inside scrolling dialogs and on
 * phones without any focus juggling.
 */
export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add a tag and press Enter',
  className,
  'aria-label': ariaLabel,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const add = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag) return;
    const next = dedupeTags([...value, tag]);
    if (next.length !== value.length) onChange(next);
    setDraft('');
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Only intercept when there is something to add; an empty Enter should
      // still submit the surrounding form.
      if (draft.trim()) {
        e.preventDefault();
        add(draft);
      } else if (e.key === ',') {
        e.preventDefault();
      }
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      e.preventDefault();
      remove(value[value.length - 1]);
    }
  };

  const selected = new Set(value.map((t) => t.toLowerCase()));
  const needle = normalizeTag(draft).toLowerCase();
  const offered = dedupeTags(suggestions)
    .filter((s) => !selected.has(s.toLowerCase()))
    .filter((s) => !needle || s.toLowerCase().includes(needle))
    .slice(0, MAX_SUGGESTIONS);

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-border/50 bg-background/60 px-2 py-1.5 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring"
        onClick={(e) => {
          if (e.target === e.currentTarget) document.getElementById(inputId)?.focus();
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              'inline-flex max-w-full items-center gap-1 rounded-md border border-border/70 bg-muted/60 py-0.5 pl-2 pr-1 text-xs font-medium',
              isMistakeTag(tag) && 'text-destructive',
            )}
            title={isMistakeTag(tag) ? 'Mistake tag' : undefined}
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove tag ${tag}`}
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          aria-label={ariaLabel ?? 'Tags'}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>
      {offered.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Suggested tags">
          {offered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep the input's focus and pending draft
              onClick={() => add(s)}
              className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
