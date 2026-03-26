/**
 * Core type definitions for the Family Expense Tracker.
 * All interfaces match both Supabase tables (snake_case DB) and Dexie schema (camelCase app).
 */

// ─── Family ─────────────────────────────────────────────
export interface IFamily {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
}

// ─── Family Member (junction) ───────────────────────────
export interface IFamilyMember {
  id: string;
  familyId: string;
  userId: string;
  joinedAt: string;
}

// ─── Category ───────────────────────────────────────────
export interface ICategory {
  id: string;
  familyId: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

// ─── Store ──────────────────────────────────────────────
export interface IStore {
  id: string;
  familyId: string;
  name: string;
}

// ─── Account (spending source) ──────────────────────────
export type AccountType = 'card' | 'cash' | 'bank' | 'savings' | 'credit';

export interface IAccount {
  id: string;
  familyId: string;
  name: string;
  icon: string;
  color: string;
  type: AccountType;
}

// ─── Expense ────────────────────────────────────────────
export type SyncStatus = 'synced' | 'pending' | 'error';

export interface IExpense {
  id: string;
  familyId: string;
  userId: string;
  amount: number;
  categoryId: string | null;
  accountId: string | null;
  storeId: string | null;
  description: string;
  spentAt: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

// ─── User Profile ───────────────────────────────────────
export interface IUserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarIcon: string;
  avatarBg: string;
  currency: string;
  language: 'ru' | 'en' | 'sk';
}

// ─── Supabase ↔ App mappers ─────────────────────────────

/** Raw Supabase row for profiles table */
export interface IProfileRow {
  id: string;
  email: string;
  display_name: string;
  avatar_icon: string;
  avatar_bg: string;
  currency: string;
  language: 'ru' | 'en' | 'sk';
}

/** Raw Supabase row for expenses table */
// ... existing code ...
export interface IExpenseRow {
  id: string;
  family_id: string;
  user_id: string;
  amount: number;
  category_id: string | null;
  account_id: string | null;
  store_id: string | null;
  description: string;
  spent_at: string;
  created_at: string;
}

/** Raw Supabase row for families table */
export interface IFamilyRow {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

/** Raw Supabase row for categories table */
export interface ICategoryRow {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

/** Raw Supabase row for stores table */
export interface IStoreRow {
  id: string;
  family_id: string;
  name: string;
  created_at: string;
}

/** Raw Supabase row for accounts table */
export interface IAccountRow {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  color: string;
  type: AccountType;
}

// ─── Mapper utilities ───────────────────────────────────

export function mapExpenseFromRow(row: IExpenseRow): IExpense {
  return {
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    amount: Number(row.amount),
    categoryId: row.category_id,
    accountId: row.account_id,
    storeId: row.store_id,
    description: row.description ?? '',
    spentAt: row.spent_at,
    createdAt: row.created_at,
    syncStatus: 'synced',
  };
}

export function mapExpenseToRow(expense: IExpense): Omit<IExpenseRow, 'created_at'> {
  return {
    id: expense.id,
    family_id: expense.familyId,
    user_id: expense.userId,
    amount: expense.amount,
    category_id: expense.categoryId,
    account_id: expense.accountId,
    store_id: expense.storeId,
    description: expense.description,
    spent_at: expense.spentAt,
  };
}

export function mapFamilyFromRow(row: IFamilyRow): IFamily {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
  };
}

export function mapCategoryFromRow(row: ICategoryRow): ICategory {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

export function mapStoreFromRow(row: IStoreRow): IStore {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
  };
}

export function mapAccountFromRow(row: IAccountRow): IAccount {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    icon: row.icon,
    color: row.color ?? 'blue',
    type: row.type ?? 'card',
  };
}

export function mapProfileFromRow(row: IProfileRow): IUserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarIcon: row.avatar_icon,
    avatarBg: row.avatar_bg,
    currency: row.currency,
    language: row.language,
  };
}

export function mapProfileToRow(profile: IUserProfile): IProfileRow {
  return {
    id: profile.id,
    email: profile.email,
    display_name: profile.displayName,
    avatar_icon: profile.avatarIcon,
    avatar_bg: profile.avatarBg,
    currency: profile.currency,
    language: profile.language,
  };
}
