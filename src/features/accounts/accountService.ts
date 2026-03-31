import { db } from '../../core/db';
import { supabase } from '../../core/supabase';
import type { IAccount, AccountType } from '../../core/types';
import { mapAccountFromRow } from '../../core/types';

/**
 * Account service: manages spending source accounts (cards, cash, etc.)
 */

/** Get all accounts for a family from Dexie. */
export async function getAccounts(familyId: string): Promise<IAccount[]> {
  return db.accounts.where('familyId').equals(familyId).toArray();
}

/** Pull accounts from Supabase into Dexie. */
export async function pullAccountsFromCloud(familyId: string): Promise<void> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('family_id', familyId);

  if (error || !data) return;

  const accounts = data.map(mapAccountFromRow);
  await db.accounts.bulkPut(accounts);
}

/** Add a new account. */
export async function addAccount(
  familyId: string,
  name: string,
  icon: string,
  color: string,
  type: AccountType
): Promise<void> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({ family_id: familyId, name, icon, color, type })
    .select()
    .single();

  if (error) throw error;
  if (data) {
    await db.accounts.put(mapAccountFromRow(data));
  }
}

/** Get total spent from an account in EUR. */
export async function getAccountSpentAmount(accountId: string): Promise<number> {
  const accountExpenses = await db.expenses
    .where('accountId')
    .equals(accountId)
    .toArray();
  
  return accountExpenses.reduce((sum, exp) => sum + exp.amount, 0);
}

/** Update an account's name, color, type and icon. */
export async function updateAccount(
  id: string,
  name: string,
  color: string,
  type: AccountType,
  icon?: string
): Promise<void> {
  const patch: Record<string, unknown> = { name, color, type };
  if (icon) patch.icon = icon;
  await db.accounts.update(id, patch);
  await supabase.from('accounts').update(patch).eq('id', id);
}

/** Delete an account. */
export async function deleteAccount(id: string): Promise<void> {
  await db.accounts.delete(id);
  await supabase.from('accounts').delete().eq('id', id);
}
