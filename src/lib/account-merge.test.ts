import { describe, it, expect } from 'vitest';
import {
  collectReferencedAccountIds,
  mergeAccountsPreservingReferenced,
  mergeCollectionById,
} from './account-merge';

const accounts = (...ids: string[]) => JSON.stringify(ids.map((id) => ({ id, name: id })));
const records = (...accountIds: string[]) =>
  JSON.stringify(accountIds.map((accountId, i) => ({ id: `r${i}`, accountId })));

describe('collectReferencedAccountIds', () => {
  it('gathers accountIds across several collections', () => {
    const ids = collectReferencedAccountIds(records('a', 'b'), records('c'));
    expect([...ids].sort()).toEqual(['a', 'b', 'c']);
  });

  it('ignores missing, unparseable and non-array payloads', () => {
    const ids = collectReferencedAccountIds(null, undefined, 'not json', '{"a":1}');
    expect([...ids]).toEqual([]);
  });

  it('ignores records with no accountId', () => {
    const ids = collectReferencedAccountIds(JSON.stringify([{ id: 'r1' }, { id: 'r2', accountId: '' }]));
    expect([...ids]).toEqual([]);
  });
});

describe('mergeAccountsPreservingReferenced', () => {
  it('rescues a remote account the local list dropped while records still point at it', () => {
    const merged = mergeAccountsPreservingReferenced(
      accounts('a'),
      accounts('a', 'b'),
      collectReferencedAccountIds(records('b')),
    );
    expect(merged).not.toBeNull();
    expect(JSON.parse(merged!).map((x: { id: string }) => x.id)).toEqual(['a', 'b']);
  });

  // The case that keeps a deliberate delete deleted: deleting an account
  // in-app removes its trades and journal entries first, so nothing references
  // it and it must NOT come back from the other device's copy.
  it('lets a deliberately deleted account stay deleted', () => {
    const merged = mergeAccountsPreservingReferenced(
      accounts('a'),
      accounts('a', 'b'),
      collectReferencedAccountIds(records('a')),
    );
    expect(merged).toBeNull();
  });

  it('returns null when the local list already covers every referenced account', () => {
    const merged = mergeAccountsPreservingReferenced(
      accounts('a', 'b'),
      accounts('a', 'b'),
      collectReferencedAccountIds(records('a', 'b')),
    );
    expect(merged).toBeNull();
  });

  it('rescues several dropped accounts at once and keeps local order first', () => {
    const merged = mergeAccountsPreservingReferenced(
      accounts('a'),
      accounts('b', 'a', 'c'),
      collectReferencedAccountIds(records('b', 'c')),
    );
    expect(JSON.parse(merged!).map((x: { id: string }) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('is inert on missing or malformed input', () => {
    const referenced = collectReferencedAccountIds(records('b'));
    expect(mergeAccountsPreservingReferenced(null, accounts('b'), referenced)).toBeNull();
    expect(mergeAccountsPreservingReferenced(accounts('a'), null, referenced)).toBeNull();
    expect(mergeAccountsPreservingReferenced('not json', accounts('b'), referenced)).toBeNull();
    expect(mergeAccountsPreservingReferenced(accounts('a'), '{"nope":1}', referenced)).toBeNull();
  });
});

describe('mergeCollectionById', () => {
  const recs = (...ids: string[]) => JSON.stringify(ids.map((id) => ({ id })));

  it('folds in records only the remote has', () => {
    const merged = mergeCollectionById(recs('a'), recs('a', 'b'));
    expect(JSON.parse(merged!).map((r: { id: string }) => r.id)).toEqual(['a', 'b']);
  });

  it('keeps the local version of a record both sides have', () => {
    const local = JSON.stringify([{ id: 'a', note: 'mine' }]);
    const remote = JSON.stringify([{ id: 'a', note: 'theirs' }, { id: 'b' }]);
    const merged = JSON.parse(mergeCollectionById(local, remote)!);
    expect(merged[0]).toEqual({ id: 'a', note: 'mine' });
    expect(merged.map((r: { id: string }) => r.id)).toEqual(['a', 'b']);
  });

  it('returns null when local already has everything', () => {
    expect(mergeCollectionById(recs('a', 'b'), recs('a'))).toBeNull();
    expect(mergeCollectionById(recs('a'), recs('a'))).toBeNull();
  });

  it('is inert on object-shaped and malformed payloads', () => {
    expect(mergeCollectionById('{"theme":"dark"}', '{"theme":"light"}')).toBeNull();
    expect(mergeCollectionById(recs('a'), 'not json')).toBeNull();
    expect(mergeCollectionById(null, recs('a'))).toBeNull();
  });
});
