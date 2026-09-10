// Merging rule for the `accounts` sync key.
//
// A device that has an unsynced local edit refuses to pull the cloud copy and
// then flushes its own list over it. When that device's list is stale, every
// account created on another device is deleted and its trades are stranded
// (Abdoul, 2026-08-31 and again 2026-09-10).
//
// What separates a deliberate delete from a stale-device clobber: deleting an
// account in-app removes its trades and journal entries first, so a genuinely
// deleted account has nothing left pointing at it. An account that still has
// records attached was never deleted on purpose, so it must survive the merge.
//
// The server enforces the same rule in the `syncData` accounts guard
// (functions/src/index.ts) so devices on old bundles are covered too. Change
// both together.

export interface MergeableAccount {
  id?: string;
  [key: string]: unknown;
}

/** Collect every accountId referenced by the given record collections. */
export function collectReferencedAccountIds(
  ...collections: Array<string | null | undefined>
): Set<string> {
  const referenced = new Set<string>();
  for (const raw of collections) {
    if (!raw) continue;
    try {
      const records = JSON.parse(raw);
      if (!Array.isArray(records)) continue;
      for (const record of records) {
        const id = (record as { accountId?: unknown })?.accountId;
        if (typeof id === 'string' && id) referenced.add(id);
      }
    } catch {
      // Unparseable payload — nothing to protect from it.
    }
  }
  return referenced;
}

/**
 * Merge the remote account list into the local one, keeping every remote-only
 * account that still has records pointing at it.
 *
 * Returns the merged list as JSON, or null when the local list already covers
 * everything that needs protecting (the common case, so callers can skip the
 * write entirely).
 */
export function mergeAccountsPreservingReferenced(
  localJson: string | null | undefined,
  remoteJson: string | null | undefined,
  referencedIds: Set<string>,
): string | null {
  if (!localJson || !remoteJson) return null;

  let local: unknown;
  let remote: unknown;
  try {
    local = JSON.parse(localJson);
    remote = JSON.parse(remoteJson);
  } catch {
    return null;
  }
  if (!Array.isArray(local) || !Array.isArray(remote)) return null;

  const localIds = new Set(
    (local as MergeableAccount[]).map((a) => a?.id).filter((id): id is string => !!id),
  );
  const rescued = (remote as MergeableAccount[]).filter(
    (a) => a?.id && !localIds.has(a.id) && referencedIds.has(a.id),
  );
  if (rescued.length === 0) return null;

  return JSON.stringify([...(local as MergeableAccount[]), ...rescued]);
}

/**
 * Union two record collections by id, local winning on conflicts.
 *
 * This is the general form of the rule above, used when a key is held as an
 * unsynced local edit. In that state the engine keeps the local copy and
 * pushes it, which for a collection means every record only the cloud has is
 * deleted. Folding the cloud-only records in first means a device that is
 * behind can never delete another device's work, however it ended up behind.
 *
 * Returns null when local already contains everything remote has, so callers
 * can skip the write.
 */
export function mergeCollectionById(
  localJson: string | null | undefined,
  remoteJson: string | null | undefined,
): string | null {
  if (!localJson || !remoteJson) return null;

  let local: unknown;
  let remote: unknown;
  try {
    local = JSON.parse(localJson);
    remote = JSON.parse(remoteJson);
  } catch {
    return null;
  }
  // Object-shaped keys (settings, goals, risk rules) have no ids to merge on.
  if (!Array.isArray(local) || !Array.isArray(remote)) return null;

  const localIds = new Set(
    (local as MergeableAccount[]).map((r) => r?.id).filter((id): id is string => !!id),
  );
  const missing = (remote as MergeableAccount[]).filter((r) => r?.id && !localIds.has(r.id));
  if (missing.length === 0) return null;

  return JSON.stringify([...(local as MergeableAccount[]), ...missing]);
}
