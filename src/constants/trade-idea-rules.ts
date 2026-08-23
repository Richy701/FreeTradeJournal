// Community rules for the Trade Ideas feed. Shown on the page and linked from
// the post form. The ones with teeth are enforced in
// functions/src/trade-ideas.ts: links are rejected, 5 posts a day, three
// reports hide an idea, three hidden ideas stop an account posting.

export const TRADE_IDEA_RULES: ReadonlyArray<{ title: string; detail: string }> = [
  {
    title: 'Post your own setups',
    detail: 'Symbol, direction, entry and why. Ideas copied from someone else come down.',
  },
  {
    title: 'Say where you are wrong',
    detail: 'Every idea needs a stop so people can see where it stops being right.',
  },
  {
    title: 'No selling',
    detail: 'No links, signal groups, paid services, referral codes or invites to other platforms. Links are rejected when you post.',
  },
  {
    title: 'No made-up results',
    detail: 'The only result that counts is a trade linked from your own Trade Log, taken after the idea was posted. Claiming a win in the text does not count.',
  },
  {
    title: 'Be decent',
    detail: 'No abuse, no harassment, no piling on someone whose idea lost.',
  },
  {
    title: 'Not financial advice',
    detail: 'Every idea here is one trader\'s opinion. You take your own trades at your own risk.',
  },
]

export const TRADE_IDEA_LIMITS: ReadonlyArray<string> = [
  '5 ideas a day, up to 1,000 characters each, one chart image.',
  'Three reports from different people hide an idea. Three hidden ideas, or ten reports in total, stop an account posting.',
  'Posting needs a verified email. Handles are permanent. Your name and email are never shown.',
]

/** Same pattern as the server check in functions/src/trade-ideas.ts, so the form can warn before posting. */
export const TRADE_IDEA_LINK_RE = /(https?:\/\/|www\.|\bt\.me\/|discord\.(gg|com)\/|wa\.me\/|bit\.ly\/|linktr\.ee\/|[a-z0-9-]+\.(com|net|io|gg|me|co|app|xyz|link)\b(\/|\s|$))/i
