import { db } from '../../core/db';
import type { IExpense, ICategory, IAccount } from '../../core/types';

/**
 * Analytics service: all computations happen on client via JS reduce over Dexie data.
 * No server calls needed.
 */

export interface ICategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface IMonthlyTotal {
  month: string;       // "2026-01" format
  monthLabel: string;  // "Jan 2026"
  total: number;
}

export interface IAccountBreakdown {
  accountId: string;
  accountName: string;
  icon: string;
  amount: number;
  percentage: number;
}

const MONTH_SHORT: Record<number, string> = {
  0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun',
  6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec',
};

/** Get expense breakdown by category for a given month. */
export async function getCategoryBreakdown(
  familyId: string,
  year: number,
  month: number
): Promise<{ items: ICategoryBreakdown[]; total: number }> {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const [expenses, categories] = await Promise.all([
    db.expenses
      .where('familyId')
      .equals(familyId)
      .filter((e) => e.spentAt >= start && e.spentAt <= end)
      .toArray(),
    db.categories.where('familyId').equals(familyId).toArray(),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Sum by category
  const sums = expenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.categoryId ?? 'uncategorized';
    acc[key] = (acc[key] ?? 0) + e.amount;
    return acc;
  }, {});

  const total = Object.values(sums).reduce((a, b) => a + b, 0);

  const items: ICategoryBreakdown[] = Object.entries(sums)
    .map(([catId, amount]) => {
      const cat = catMap.get(catId);
      return {
        categoryId: catId,
        categoryName: cat?.name ?? 'No Category',
        color: cat?.color ?? '#6b7280',
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return { items, total };
}

/** Get monthly totals for past N months. */
export async function getMonthlyComparison(
  familyId: string,
  monthsBack: number = 6
): Promise<IMonthlyTotal[]> {
  const now = new Date();
  const results: IMonthlyTotal[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const expenses = await db.expenses
      .where('familyId')
      .equals(familyId)
      .filter((e) => e.spentAt >= start && e.spentAt <= end)
      .toArray();

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    results.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      monthLabel: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
      total,
    });
  }

  return results;
}

/** Get spending breakdown by account for a given month. */
export async function getAccountBreakdown(
  familyId: string,
  year: number,
  month: number
): Promise<{ items: IAccountBreakdown[]; total: number }> {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const [expenses, accounts] = await Promise.all([
    db.expenses
      .where('familyId')
      .equals(familyId)
      .filter((e) => e.spentAt >= start && e.spentAt <= end)
      .toArray(),
    db.accounts.where('familyId').equals(familyId).toArray(),
  ]);

  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const sums = expenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.accountId ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + e.amount;
    return acc;
  }, {});

  const total = Object.values(sums).reduce((a, b) => a + b, 0);

  const items: IAccountBreakdown[] = Object.entries(sums)
    .map(([accId, amount]) => {
      const acc = accMap.get(accId);
      return {
        accountId: accId,
        accountName: acc?.name ?? 'Unknown',
        icon: acc?.icon ?? 'credit-card',
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return { items, total };
}
