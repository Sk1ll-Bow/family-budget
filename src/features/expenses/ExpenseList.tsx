import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Wallet, TrendingDown, 
  Search, Bell, Send, ArrowUpRight, Scan, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../core/db';
import { useAuthStore } from '../../core/useAuthStore';
import { deleteExpense } from './expenseService';
import { ExpenseRow } from './ExpenseRow';
import { ExpenseRowSkeleton } from '../../components/Skeleton';
import type { ICategory, IAccount } from '../../core/types';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { useModalStore } from '../../core/useModalStore';

const MODAL_ADD_EXPENSE = 'add-expense';


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
    toast.success('Transaction deleted');
  }, []);

  const isLoading = expenses === undefined;

  // Group by date
  const groupedByDate = (expenses ?? []).reduce<Record<string, typeof expenses>>((groups, expense) => {
    const key = format(new Date(expense.spentAt), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(expense);
    return groups;
  }, {});

  const { profile } = useAuthStore();
  const { openModal } = useModalStore();

  return (
    <div className="space-y-8 pb-10">
      {/* ─── PROFESSIONAL DASHBOARD HEADER ─── */}
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full border-2 border-brand-primary/20 p-0.5"
            style={{ background: profile?.avatarBg }}
          >
            <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center overflow-hidden">
               {/* Minimalist Profile Pic or Icon */}
               <LayoutGrid className="w-6 h-6 text-brand-primary/60" />
            </div>
          </div>
          <div>
            <p className="text-surface-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">
              Welcome back
            </p>
            <h1 className="text-lg font-black text-surface-50 tracking-tight leading-none">
              Hello {profile?.displayName?.split(' ')[0] || 'User'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-surface-400 hover:text-brand-primary transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-surface-400 hover:text-brand-primary transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─── BOLD BALANCE SECTION ─── */}
      <section className="space-y-2">
        <p className="text-surface-500 text-xs font-bold uppercase tracking-[0.2em]">
          Total Balance
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-surface-50 tracking-tighter drop-shadow-glow">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(totalMonth)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-success font-black text-xs">
          <ArrowUpRight className="w-3 h-3" />
          <span>+6.2% vs last month</span>
        </div>
      </section>

      {/* ─── QUICK ACTIONS GRID ─── */}
      <section className="grid grid-cols-4 gap-4">
        {[
          { icon: Send, label: 'Send', color: 'text-surface-300' },
          { icon: ArrowUpRight, label: 'Add', color: 'text-brand-primary', action: () => openModal(MODAL_ADD_EXPENSE) },
          { icon: Scan, label: 'Scan', color: 'text-surface-300' },
          { icon: Wallet, label: 'Cards', color: 'text-surface-300' },
        ].map((btn, i) => (
          <button 
            key={i}
            onClick={btn.action}
            className="flex flex-col items-center gap-2 group outline-none"
          >
            <div className="w-full aspect-square rounded-3xl glass flex items-center justify-center group-active:scale-95 transition-all duration-300 group-hover:bg-brand-primary/10 group-hover:border-brand-primary/20">
              <btn.icon className={cn("w-6 h-6", btn.color)} />
            </div>
            <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{btn.label}</span>
          </button>
        ))}
      </section>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-black text-surface-50 tracking-tight flex items-center gap-2">
          Latest Transaction
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
        </h2>
        <button className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline cursor-pointer">
          View All
        </button>
      </div>


      {/* Expense Groups */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ExpenseRowSkeleton key={i} />
          ))}
        </div>
      ) : expenseCount === 0 ? (
        <div className="glass p-12 text-center rounded-[32px] border border-white/5">
          <Wallet className="w-12 h-12 text-surface-601 mx-auto mb-4 opacity-50" />
          <p className="text-surface-300 font-black uppercase tracking-widest text-[10px]">No transactions this month</p>
          <p className="text-surface-601 text-[10px] mt-2 font-bold max-w-[180px] mx-auto">
            Tap the + button to add your first expense.
          </p>
        </div>
      ) : (
        Object.entries(groupedByDate).map(([dateKey, dayExpenses]) => (
          <div key={dateKey} className="space-y-2">
            <div className="flex items-center justify-between px-2 pt-4 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-brand-primary rounded-full" />
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.15em]">
                  {format(new Date(dateKey), 'd MMMM, EEEE', { locale: enUS })}
                </p>
              </div>
              <p className="text-[10px] font-black text-brand-primary/60 uppercase">
                {new Intl.NumberFormat('en-US', {
                  maximumFractionDigits: 0,
                }).format((dayExpenses ?? []).reduce((s, e) => s + e.amount, 0))}
                <span className="ml-0.5">€</span>
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
