import type { IdeaAvatar } from '@/types/trade-ideas'

/** Round avatar used on idea cards, the record card and the handle preview. */
export function IdeaAvatar({
  avatar,
  handle,
  size = 'sm',
  className = '',
}: {
  avatar: IdeaAvatar
  handle: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dims = size === 'lg' ? 'h-14 w-14 text-2xl' : size === 'md' ? 'h-10 w-10 text-lg' : 'h-8 w-8 text-sm'
  const initialsSize = size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 select-none leading-none ${dims} ${className}`}
      style={{ backgroundColor: avatar.avatarColor, color: '#fff' }}
      aria-hidden="true"
    >
      {avatar.avatarEmoji ?? (
        <span className={`font-semibold ${initialsSize}`}>{handle.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}
