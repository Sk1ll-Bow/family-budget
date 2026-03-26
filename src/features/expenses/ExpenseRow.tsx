import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { IExpense, ICategory, IAccount } from '../../core/types';
import { cn } from '../../core/cn';
import { LucideIcon } from '../../components/LucideIcon';
import { formatCurrency } from '../../core/formatters';

interface IExpenseRowProps {
  expense: IExpense;
  category: ICategory | undefined;
  account: IAccount | undefined;
  onDelete: (id: string) => void;
}

/**
 * Premium expense row with Framer Motion animations and dynamic Lucide icons.
 */
export const ExpenseRow = memo(function ExpenseRow({
  expense,
  category,
  account,
  onDelete,
}: IExpenseRowProps) {
  const categoryName = category?.name ?? 'Uncategorized';
  const categoryColor = category?.color ?? '#3b82f6';
  const categoryIcon = category?.icon || 'Circle';
  const accountName = account?.name ?? '';
  const isPending = expense.syncStatus === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card p-4 flex items-center gap-4 group relative overflow-hidden"
    >
      {/* Category Icon in Rounded Square */}
      <div 
        className="w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500"
        style={{ backgroundColor: `${categoryColor}15` }}
      >
        <LucideIcon 
          name={categoryIcon} 
          className="w-7 h-7" 
          style={{ color: categoryColor }}
        />
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-black text-surface-50 truncate tracking-tight">
            {categoryName}
          </p>
          {isPending && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          )}
        </div>
        <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest truncate leading-none">
          {expense.description || accountName || 'No description'}
        </p>
      </div>

      {/* Amount + Time */}
      <div className="text-right shrink-0 pr-2">
        <div className="text-lg font-black text-surface-50 tracking-tighter mb-0.5">
          {formatCurrency(expense.amount)}
        </div>
        <p className="text-[10px] font-black text-surface-600 uppercase tracking-widest leading-none">
          {format(new Date(expense.spentAt), 'HH:mm', { locale: ru })}
        </p>
      </div>

      {/* Modern Delete Button */}
      <button
        type="button"
        onClick={() => onDelete(expense.id)}
        className={cn(
          'w-10 h-10 rounded-2xl bg-danger/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 absolute right-4 bg-surface-950/90 backdrop-blur-xl',
          'hover:bg-danger hover:text-white text-danger active:scale-90 border border-white/5'
        )}
        aria-label="Delete"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </motion.div>
  );
});

