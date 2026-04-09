const TYPO_DOMAINS = new Set([
  'gamil.com', 'gmal.com', 'gmali.com', 'gmaill.com', 'gmial.com',
  'yahooo.com', 'yaho.com', 'yahho.com', 'yhoo.com',
  'hotmai.com', 'hotmial.com', 'hotmali.com',
  'outlok.com', 'outloo.com',
])

const DISPOSABLE_DOMAINS = new Set([
  'mogash.com', 'passinbox.com', 'mailinator.com', 'guerrillamail.com',
  'tempmail.com', 'throwam.com', 'trashmail.com', 'sharklasers.com',
  'spam4.me', 'yopmail.com', 'maildrop.cc', 'dispostable.com',
  'fakeinbox.com', 'getairmail.com',
])

const BAD_TLDS = new Set(['con', 'cds', 'cpm', 'ocm', 'comd', 'vom', 'cmo'])

export function isBadEmail(email: string): boolean {
  if (!email.includes('@')) return true
  const parts = email.split('@')
  if (parts.length !== 2) return true
  const [local, domain] = parts
  if (!local || !domain || !domain.includes('.')) return true
  const tld = domain.split('.').pop()!.toLowerCase()
  if (BAD_TLDS.has(tld)) return true
  if (TYPO_DOMAINS.has(domain.toLowerCase())) return true
  if (DISPOSABLE_DOMAINS.has(domain.toLowerCase())) return true
  return false
}
