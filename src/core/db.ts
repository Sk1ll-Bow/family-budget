import Dexie, { type Table } from 'dexie';
import type { IFamily, ICategory, IAccount, IExpense } from './types';

/**
 * Local-first IndexedDB database using Dexie.js.
 * This is the primary source of truth for the app;
 * Supabase acts as the sync target.
 */
export class FamilyBudgetDB extends Dexie {
  families!: Table<IFamily>;
  categories!: Table<ICategory>;
  accounts!: Table<IAccount>;
  expenses!: Table<IExpense>;

  constructor() {
    super('familyBudgetDB');

    this.version(1).stores({
      families: 'id, name',
      categories: 'id, familyId, sortOrder',
      accounts: 'id, familyId',
      expenses: 'id, familyId, userId, categoryId, accountId, spentAt, syncStatus',
    });
  }
}

/** Singleton database instance */
export const db = new FamilyBudgetDB();
