import { db } from '../../core/db';
import { supabase } from '../../core/supabase';
import type { ICategory } from '../../core/types';
import { mapCategoryFromRow } from '../../core/types';

/**
 * Category service: manages spending categories with Dexie + Supabase sync.
 */

/** Get all categories for a family from Dexie. */
export async function getCategories(familyId: string): Promise<ICategory[]> {
  return db.categories
    .where('familyId')
    .equals(familyId)
    .sortBy('sortOrder');
}

/** Pull categories from Supabase into Dexie. */
export async function pullCategoriesFromCloud(familyId: string): Promise<void> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('family_id', familyId)
    .order('sort_order');

  if (error || !data) return;

  const categories = data.map(mapCategoryFromRow);
  await db.categories.bulkPut(categories);
}

/** Add a new category. */
export async function addCategory(
  familyId: string,
  name: string,
  icon: string,
  color: string
): Promise<void> {
  const existing = await getCategories(familyId);
  const sortOrder = existing.length;

  const { data, error } = await supabase
    .from('categories')
    .insert({ family_id: familyId, name, icon, color, sort_order: sortOrder })
    .select()
    .single();

  if (!error && data) {
    await db.categories.put(mapCategoryFromRow(data));
  }
}

/** Update a category's name, color and icon. */
export async function updateCategory(
  id: string,
  name: string,
  color: string,
  icon?: string
): Promise<void> {
  const patch: Record<string, unknown> = { name, color };
  if (icon) patch.icon = icon;
  await db.categories.update(id, patch);
  await supabase.from('categories').update(patch).eq('id', id);
}

/** Delete a category. */
export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id);
  await supabase.from('categories').delete().eq('id', id);
}
