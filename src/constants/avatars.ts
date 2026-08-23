// Avatar choices shared by the Profile page and the Trade Ideas community
// profile. The server (functions/src/trade-ideas.ts) validates against the
// same two lists, so keep them in sync when adding options.

export const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9',
] as const

export const AVATAR_EMOJIS = [
  '🚀', '💎', '🦁', '🐯', '🦅', '🦊',
  '⚡', '🔥', '🏆', '👑', '🎯', '📈',
  '💰', '🌙', '⭐', '🧠', '💪', '🤖',
  '🎲', '🌊',
] as const

export const DEFAULT_AVATAR_COLOR = '#3b82f6'
