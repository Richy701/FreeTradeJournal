interface ProBadgeProps {
  size?: 'sm' | 'md';
  /** `dev` is the staff tag: same pill, violet, reads DEV. */
  variant?: 'pro' | 'dev';
}

export function ProBadge({ size = 'sm', variant = 'pro' }: ProBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5';
  const toneClasses = variant === 'dev'
    ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30'
    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';

  return (
    <span
      className={`${sizeClasses} ${toneClasses} font-bold uppercase tracking-wider rounded-full border`}
    >
      {variant === 'dev' ? 'DEV' : 'PRO'}
    </span>
  );
}
