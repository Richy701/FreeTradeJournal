export function loginDestination(from?: { pathname?: string; search?: string; hash?: string }): string {
  const pathname = from?.pathname;
  if (!pathname?.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')) return '/dashboard';
  return `${pathname}${from?.search || ''}${from?.hash || ''}`;
}
