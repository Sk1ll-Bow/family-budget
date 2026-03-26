import { db } from '../../core/db';
import { supabase } from '../../core/supabase';
import type { IStore } from '../../core/types';
import { mapStoreFromRow } from '../../core/types';

/**
 * Store service: manages spending locations (stores) with Dexie + Supabase sync.
 */

/** Get all stores for a family from Dexie. */
export async function getStores(familyId: string): Promise<IStore[]> {
  return db.stores
    .where('familyId')
    .equals(familyId)
    .toArray();
}

/** Pull stores from Supabase into Dexie. */
export async function pullStoresFromCloud(familyId: string): Promise<void> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('family_id', familyId);

  if (error || !data) return;

  const stores = data.map(mapStoreFromRow);
  await db.stores.bulkPut(stores);
}

/** Add a new store. Returns the created store. */
export async function addStore(
  familyId: string,
  name: string
): Promise<IStore | null> {
  const { data, error } = await supabase
    .from('stores')
    .insert({ family_id: familyId, name })
    .select()
    .single();

  if (!error && data) {
    const store = mapStoreFromRow(data);
    await db.stores.put(store);
    return store;
  }
  return null;
}

/** Delete a store. */
export async function deleteStore(id: string): Promise<void> {
  await db.stores.delete(id);
  await supabase.from('stores').delete().eq('id', id);
}
