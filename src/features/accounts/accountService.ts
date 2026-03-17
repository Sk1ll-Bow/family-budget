import { db } from '../../core/db';
import { supabase } from '../../core/supabase';
import type { IAccount } from '../../core/types';
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
  icon: string
): Promise<void> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({ family_id: familyId, name, icon })
    .select()
    .single();

  if (!error && data) {
    await db.accounts.put(mapAccountFromRow(data));
  }
}

/** Delete an account. */
export async function deleteAccount(id: string): Promise<void> {
  await db.accounts.delete(id);
  await supabase.from('accounts').delete().eq('id', id);
}
