// Broker-timezone handling for CSV imports.
//
// Broker CSVs carry naive wall-clock times written in the BROKER's clock (an
// MT5 server is typically EET/EEST; Tradovate exports US Central). The legacy
// import path fed those strings to `new Date(...)`, which interprets them in
// whatever timezone the importing browser happens to be in — so the same file
// produced different stored epochs on different machines (7h spread measured).
// Accounts can now declare their broker's timezone; imports for those accounts
// convert wall-clock → true UTC here. Accounts without one keep the legacy
// behavior untouched.

// Preset choices for the account form. `value: ''` is the "device" sentinel —
// stored as undefined, meaning legacy behavior. Region zones (not fixed
// offsets) so DST is handled: Europe/Athens tracks EET/EEST, which is the
// de-facto MT4/MT5 server clock (UTC+2 winter / UTC+3 summer).
export const BROKER_TIMEZONES: { value: string; label: string }[] = [
  { value: '', label: 'Same as this device' },
  { value: 'Europe/Athens', label: 'MT4/MT5 server time (UTC+2/+3)' },
  { value: 'UTC', label: 'UTC / GMT' },
  { value: 'America/Chicago', label: 'US Central (Tradovate, Topstep, CME)' },
  { value: 'America/New_York', label: 'US Eastern' },
  { value: 'Europe/London', label: 'UK (London)' },
];

// Matches the naive strings the CSV parser emits (formatLocalDateTime output
// and close variants): "YYYY-MM-DD HH:mm[:ss]" with T or space. Anything with
// an explicit offset/Z, or any other shape, is NOT converted.
const NAIVE_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

// What wall-clock does `utcDate` show in `timeZone`, expressed as an offset in
// ms (positive = zone ahead of UTC)? Intl is the only tz database the browser
// exposes; formatToParts is the standard way to read it.
function tzOffsetMs(timeZone: string, utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(utcDate)) p[part.type] = part.value;
  const asUtc = Date.UTC(
    +p.year, +p.month - 1, +p.day,
    // Some engines render midnight as "24" with hour12: false.
    p.hour === '24' ? 0 : +p.hour, +p.minute, +p.second,
  );
  return asUtc - utcDate.getTime();
}

// Interpret a naive "YYYY-MM-DDTHH:mm:ss" wall-clock string as a time in
// `timeZone` and return the true UTC instant. Two-pass so DST transitions
// resolve to the correct offset. Falls back to legacy `new Date(...)` local
// parsing when the string is not naive or the zone id is invalid — a corrupt
// setting must degrade to old behavior, never break an import.
export function zonedTimeToUtc(value: string, timeZone: string): Date {
  const m = NAIVE_RE.exec(value.trim());
  if (!m) return new Date(value);
  try {
    const wallAsUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    let guess = wallAsUtc - tzOffsetMs(timeZone, new Date(wallAsUtc));
    guess = wallAsUtc - tzOffsetMs(timeZone, new Date(guess));
    return new Date(guess);
  } catch {
    return new Date(value);
  }
}
