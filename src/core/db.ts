import Dexie, { type Table } from 'dexie';
import type { IFamily, ICategory, IAccount, IExpense, IUserProfile } from './types';

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
  profiles!: Table<IUserProfile>;

  constructor() {
    super('familyBudgetDB');

    this.version(2).stores({
      families: 'id, name',
      categories: 'id, familyId, sortOrder',
      accounts: 'id, familyId, type',
      expenses: 'id, familyId, userId, categoryId, accountId, spentAt, syncStatus',
      profiles: 'id, email',
    });
  }
}

/** Singleton database instance */
export const db = new FamilyBudgetDB();
