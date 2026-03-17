import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Wallet, TrendingDown } from 'lucide-react';
import { db } from '../../core/db';
import { useAuthStore } from '../../core/useAuthStore';
import { deleteExpense } from './expenseService';
import { ExpenseRow } from './ExpenseRow';
import { ExpenseRowSkeleton } from '../../components/Skeleton';
import type { ICategory, IAccount } from '../../core/types';
import { cn } from '../../core/cn';
import { toast } from 'sonner';

/**
 * Expense List page — shows expenses grouped by month with live Dexie queries.
 * Includes month navigation and summary header.
 */
export function ExpenseList() {
  const { familyId } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate).toISOString();
  const monthEnd = endOfMonth(currentDate).toISOString();

  // Live queries — auto-update when Dexie data changes
  const expenses = useLiveQuery(
    () =>
      familyId
        ? db.expenses
            .where('familyId')
            .equals(familyId)
            .filter((e) => e.spentAt >= monthStart && e.spentAt <= monthEnd)
            .reverse()
            .sortBy('spentAt')
        : [],
    [familyId, monthStart, monthEnd]
  );

  const categories = useLiveQuery(
    () => (familyId ? db.categories.where('familyId').equals(familyId).toArray() : []),
    [familyId]
  );

  const accounts = useLiveQuery(
    () => (familyId ? db.accounts.where('familyId').equals(familyId).toArray() : []),
    [familyId]
  );

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));
  const accountMap = new Map((accounts ?? []).map((a) => [a.id, a]));

  const totalMonth = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = (expenses ?? []).length;

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleDelete = useCallback(async (id: string) => {
    await deleteExpense(id);
    toast.success('Расход удалён');
  }, []);

  const isLoading = expenses === undefined;

  // Group by date
  const groupedByDate = (expenses ?? []).reduce<Record<string, typeof expenses>>((groups, expense) => {
    const key = format(new Date(expense.spentAt), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(expense);
    return groups;
  }, {});

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prevMonth} className="btn btn-ghost btn-icon rounded-full" aria-label="Предыдущий месяц">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-surface-100 capitalize">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>
          <button type="button" onClick={nextMonth} className="btn btn-ghost btn-icon rounded-full" aria-label="Следующий месяц">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-danger" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-400">Расходы</p>
              <p className="text-base font-bold text-surface-100 truncate">
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(totalMonth)}
              </p>
            </div>
          </div>

          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-400">Записей</p>
              <p className="text-base font-bold text-surface-100">{expenseCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Groups */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ExpenseRowSkeleton key={i} />
          ))}
        </div>
      ) : expenseCount === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wallet className="w-12 h-12 text-surface-500 mx-auto mb-3" />
          <p className="text-surface-300 font-medium">Нет расходов за этот месяц</p>
          <p className="text-surface-500 text-sm mt-1">
            Нажмите + чтобы добавить первый расход
          </p>
        </div>
      ) : (
        Object.entries(groupedByDate).map(([dateKey, dayExpenses]) => (
          <div key={dateKey} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                {format(new Date(dateKey), 'd MMMM, EEEE', { locale: ru })}
              </p>
              <p className="text-xs text-surface-500">
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format((dayExpenses ?? []).reduce((s, e) => s + e.amount, 0))}
              </p>
            </div>
            <div className="space-y-2">
              {(dayExpenses ?? []).map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  category={categoryMap.get(expense.categoryId ?? '')}
                  account={accountMap.get(expense.accountId ?? '')}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
