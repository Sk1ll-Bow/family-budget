import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { IExpense, ICategory, IAccount } from '../../core/types';
import { cn } from '../../core/cn';
import { LucideIcon } from '../../components/LucideIcon';
import { formatCurrency } from '../../core/formatters';
import type { IStore } from '../../core/types';

interface IExpenseRowProps {
  expense: IExpense;
  category: ICategory | undefined;
  account: IAccount | undefined;
  store: IStore | undefined;
  onEdit: (expense: IExpense) => void;
  onDelete: (id: string) => void;
}

/**
 * Premium expense row with Framer Motion animations and dynamic Lucide icons.
 */
export const ExpenseRow = memo(function ExpenseRow({
  expense,
  category,
  account,
  store,
  onEdit,
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
          {store?.name && <span className="text-surface-300 mr-2 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">{store.name}</span>}
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

      {/* Modern Actions Container */}
      <div className="flex flex-col sm:flex-row gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 absolute right-2 sm:right-4 bg-surface-950/90 backdrop-blur-xl p-1 rounded-2xl border border-white/5">
        <button
          type="button"
          onClick={() => onEdit(expense)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center hover:bg-brand-primary hover:text-white text-brand-primary active:scale-90 transition-all"
          aria-label="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(expense.id)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-danger/10 flex items-center justify-center hover:bg-danger hover:text-white text-danger active:scale-90 transition-all"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
});

