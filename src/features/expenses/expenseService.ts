import { db } from '../../core/db';
import { supabase } from '../../core/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { IExpense, SyncStatus } from '../../core/types';
import { mapExpenseFromRow, mapExpenseToRow } from '../../core/types';

/**
 * Expense service: Dexie-first with Supabase sync.
 * All reads come from IndexedDB; writes go to Dexie first, then sync.
 */

/** Add a new expense to Dexie, then attempt Supabase sync. */
export async function addExpense(params: {
  familyId: string;
  userId: string;
  amount: number;
  categoryId: string | null;
  accountId: string | null;
  description: string;
  spentAt: string;
}): Promise<IExpense> {
  const expense: IExpense = {
    id: uuidv4(),
    familyId: params.familyId,
    userId: params.userId,
    amount: params.amount,
    categoryId: params.categoryId,
    accountId: params.accountId,
    description: params.description,
    spentAt: params.spentAt,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };

  // Write to Dexie immediately (offline-first)
  await db.expenses.put(expense);

  // Attempt cloud sync
  if (navigator.onLine) {
    try {
      const row = mapExpenseToRow(expense);
      const { error } = await supabase.from('expenses').insert(row);
      if (!error) {
        expense.syncStatus = 'synced';
        await db.expenses.update(expense.id, { syncStatus: 'synced' });
      }
    } catch {
      // Will be synced later by syncEngine
    }
  }

  return expense;
}

/** Get all expenses for a family from Dexie, ordered by spent_at desc. */
export async function getExpenses(familyId: string): Promise<IExpense[]> {
  return db.expenses
    .where('familyId')
    .equals(familyId)
    .reverse()
    .sortBy('spentAt');
}

/** Get expenses for a specific month. */
export async function getExpensesForMonth(
  familyId: string,
  year: number,
  month: number
): Promise<IExpense[]> {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  return db.expenses
    .where('familyId')
    .equals(familyId)
    .filter((e) => e.spentAt >= start && e.spentAt <= end)
    .reverse()
    .sortBy('spentAt');
}

/** Delete an expense from Dexie and Supabase. */
export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id);

  if (navigator.onLine) {
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch {
      // Orphaned cloud record will be handled by sync reconciliation
    }
  }
}

/** Update sync status for a batch of expenses. */
export async function markSynced(ids: string[]): Promise<void> {
  await db.expenses
    .where('id')
    .anyOf(ids)
    .modify({ syncStatus: 'synced' as SyncStatus });
}

/** Get all pending (unsynced) expenses. */
export async function getPendingExpenses(): Promise<IExpense[]> {
  return db.expenses.where('syncStatus').equals('pending').toArray();
}

/** Pull all family expenses from Supabase into Dexie (initial sync). */
export async function pullExpensesFromCloud(familyId: string): Promise<void> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('family_id', familyId)
    .order('spent_at', { ascending: false });

  if (error || !data) return;

  const expenses = data.map(mapExpenseFromRow);
  await db.expenses.bulkPut(expenses);
}
