import { supabase } from '../../core/supabase';
import { db } from '../../core/db';
import { mapExpenseToRow } from '../../core/types';
import { getPendingExpenses, markSynced } from '../expenses/expenseService';
import { pullExpensesFromCloud } from '../expenses/expenseService';
import { pullCategoriesFromCloud } from '../categories/categoryService';
import { pullAccountsFromCloud } from '../accounts/accountService';

/**
 * Sync Engine: handles bidirectional sync between Dexie (local) and Supabase (cloud).
 *
 * Strategy:
 * 1. On app start → pull all family data from cloud → populate Dexie.
 * 2. On write → Dexie first, then push to Supabase.
 * 3. On 'online' event → push all pending records.
 * 4. Conflict resolution: last-write-wins via created_at.
 */

let syncListenerAttached = false;

/** Initial full sync: pull all family data from Supabase into Dexie. */
export async function initialSync(familyId: string): Promise<void> {
  if (!navigator.onLine) return;

  try {
    await Promise.all([
      pullCategoriesFromCloud(familyId),
      pullAccountsFromCloud(familyId),
      pullExpensesFromCloud(familyId),
    ]);
  } catch (err) {
    console.warn('[SyncEngine] Initial sync failed, using cached data:', err);
  }
}

/** Push all pending local changes to Supabase. */
export async function pushPendingChanges(): Promise<number> {
  const pending = await getPendingExpenses();
  if (pending.length === 0) return 0;

  const rows = pending.map(mapExpenseToRow);

  const { error } = await supabase
    .from('expenses')
    .upsert(rows, { onConflict: 'id' });

  if (!error) {
    await markSynced(pending.map((e) => e.id));
    return pending.length;
  }

  console.warn('[SyncEngine] Push failed:', error);
  return 0;
}

/** Attach online/offline event listeners for automatic sync. */
export function startSyncListener(familyId: string): () => void {
  if (syncListenerAttached) return () => {};

  const handleOnline = async () => {
    console.log('[SyncEngine] Back online, syncing...');
    const count = await pushPendingChanges();
    if (count > 0) {
      console.log(`[SyncEngine] Synced ${count} pending records`);
    }
    await initialSync(familyId);
  };

  window.addEventListener('online', handleOnline);
  syncListenerAttached = true;

  return () => {
    window.removeEventListener('online', handleOnline);
    syncListenerAttached = false;
  };
}
