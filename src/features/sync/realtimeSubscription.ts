import { supabase } from '../../core/supabase';
import { db } from '../../core/db';
import {
  mapExpenseFromRow,
  mapCategoryFromRow,
  mapAccountFromRow,
  type IExpenseRow,
  type ICategoryRow,
  type IAccountRow,
} from '../../core/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Realtime subscription: listens to Supabase Realtime changes
 * on expenses, categories, and accounts tables.
 * Updates Dexie on incoming changes from other family members.
 */

type TablePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

/** Subscribe to all family-relevant tables. Returns unsubscribe function. */
export function subscribeToRealtime(familyId: string): () => void {
  const channel = supabase
    .channel(`family-${familyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'expenses', filter: `family_id=eq.${familyId}` },
      (payload: TablePayload) => handleExpenseChange(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories', filter: `family_id=eq.${familyId}` },
      (payload: TablePayload) => handleCategoryChange(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'accounts', filter: `family_id=eq.${familyId}` },
      (payload: TablePayload) => handleAccountChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

async function handleExpenseChange(payload: TablePayload) {
  if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    const row = payload.new as unknown as IExpenseRow;
    const expense = mapExpenseFromRow(row);
    await db.expenses.put(expense);
  } else if (payload.eventType === 'DELETE') {
    const old = payload.old as { id?: string };
    if (old.id) {
      await db.expenses.delete(old.id);
    }
  }
}

async function handleCategoryChange(payload: TablePayload) {
  if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    const row = payload.new as unknown as ICategoryRow;
    await db.categories.put(mapCategoryFromRow(row));
  } else if (payload.eventType === 'DELETE') {
    const old = payload.old as { id?: string };
    if (old.id) await db.categories.delete(old.id);
  }
}

async function handleAccountChange(payload: TablePayload) {
  if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    const row = payload.new as unknown as IAccountRow;
    await db.accounts.put(mapAccountFromRow(row));
  } else if (payload.eventType === 'DELETE') {
    const old = payload.old as { id?: string };
    if (old.id) await db.accounts.delete(old.id);
  }
}
