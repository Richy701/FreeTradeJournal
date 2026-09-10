import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useUserStorage } from '@/utils/user-storage';
import { getChangeVersion, notifyDataChange, onSyncChange } from '@/contexts/sync-context';
import { appendFocusRecord, localDay, readFocusRecords, WEEKLY_FOCUS_KEY, type FocusRecord } from '@/lib/weekly-focus';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';

export function useWeeklyFocus() {
  const storage = useUserStorage();
  const version = useSyncExternalStore(onSyncChange, getChangeVersion, getChangeVersion);
  const [today, setToday] = useState(localDay);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    const refresh = () => { setToday(localDay()); notifyDataChange(); };
    const tick = () => setToday(localDay());
    const timer = window.setInterval(tick, 60_000);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); };
  }, []);
  const { records, error } = useMemo(() => {
    try { return { records: readFocusRecords(storage.getItem(WEEKLY_FOCUS_KEY)), error: null }; }
    catch (error) { return { records: [] as FocusRecord[], error: error instanceof Error ? error.message : 'Your weekly focus could not be loaded.' }; }
  }, [storage, version]);

  async function save(record: FocusRecord): Promise<boolean> {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    let previous: string | null = null;
    let writing = false;
    try {
      previous = storage.getItem(WEEKLY_FOCUS_KEY);
      const latest = readFocusRecords(previous);
      const updated = appendFocusRecord(latest, record, localDay());
      writing = true;
      await storage.setItem(WEEKLY_FOCUS_KEY, JSON.stringify(updated));
      notifyDataChange();
      trackEvent(`weekly_focus_${record.kind === 'plan' ? 'started' : record.kind === 'review' ? 'reviewed' : 'checked_in'}`,
        record.kind === 'checkin' ? { status: record.status } : undefined);
      return true;
    } catch (error) {
      // UserStorage optimistically caches encrypted writes. Restore that cache
      // as well as local storage on failure, without sending a rollback to sync.
      if (writing) {
        try { await storage.setItem(WEEKLY_FOCUS_KEY, previous ?? '[]', true); } catch { /* Original storage failure is reported below. */ }
      }
      toast.error(error instanceof Error ? error.message : 'Could not save. Please try again.');
      return false;
    } finally { busy.current = false; setSaving(false); }
  }
  return { records, error, today, saving, save };
}
