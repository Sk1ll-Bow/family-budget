import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { IExpense, ICategory, IAccount } from '../../core/types';
import { cn } from '../../core/cn';

interface IExpenseRowProps {
  expense: IExpense;
  category: ICategory | undefined;
  account: IAccount | undefined;
  onDelete: (id: string) => void;
}

/**
 * Single expense row — memoized for list performance.
 * Shows category icon, amount, description, account, date, and sync status.
 */
export const ExpenseRow = memo(function ExpenseRow({
  expense,
  category,
  account,
  onDelete,
}: IExpenseRowProps) {
  const categoryName = category?.name ?? 'Без категории';
  const categoryColor = category?.color ?? '#6b7280';
  const accountName = account?.name ?? '';
  const isPending = expense.syncStatus === 'pending';

  return (
    <div className="glass-card p-4 flex items-center gap-3 group animate-fade-in">
      {/* Category Badge */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
        style={{ backgroundColor: `${categoryColor}18`, color: categoryColor }}
      >
        {categoryName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-surface-100 truncate">
            {categoryName}
          </p>
          {isPending && (
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" title="Ожидает синхронизации" />
          )}
        </div>
        <p className="text-xs text-surface-400 truncate">
          {expense.description || accountName || format(new Date(expense.spentAt), 'HH:mm', { locale: ru })}
        </p>
      </div>

      {/* Amount + Date */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-surface-100">
          {new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
          }).format(expense.amount)}
        </p>
        <p className="text-[10px] text-surface-500">
          {format(new Date(expense.spentAt), 'd MMM', { locale: ru })}
        </p>
      </div>

      {/* Delete button (visible on hover/touch) */}
      <button
        type="button"
        onClick={() => onDelete(expense.id)}
        className={cn(
          'btn btn-ghost btn-icon rounded-full opacity-0 group-hover:opacity-100',
          'transition-opacity duration-150 shrink-0'
        )}
        aria-label="Удалить расход"
      >
        <Trash2 className="w-4 h-4 text-danger" />
      </button>
    </div>
  );
});
