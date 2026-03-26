import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import { 
  Search, 
  Bell, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  Filter,
  Download,
  Trash2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { db } from '../../core/db';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { useModalStore } from '../../core/useModalStore';
import { ExpenseRow } from './ExpenseRow';
import { formatCurrency, formatNumber } from '../../core/formatters';
import { deleteExpense } from './expenseService';
import { MODAL_EDIT_EXPENSE } from './EditExpenseModal';
import { toast } from 'sonner';
import type { IExpense } from '../../core/types';

const MODAL_ADD_EXPENSE = 'add-expense';

/**
 * Premium Desktop Dashboard component.
 * Features a multi-panel grid layout with interactive charts and real-time data.
 */
export function DesktopDashboard() {
  const { familyId, profile } = useAuthStore();
  const { openModal } = useModalStore();
  const [searchQuery, setSearchQuery] = useState('');

  // ─── DATA FETCHING ───

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const expenses = useLiveQuery(
    () => familyId ? db.expenses.where('familyId').equals(familyId).toArray() : [],
    [familyId]
  );

  const categories = useLiveQuery(
    () => familyId ? db.categories.where('familyId').equals(familyId).toArray() : [],
    [familyId]
  );

  const accounts = useLiveQuery(
    () => familyId ? db.accounts.where('familyId').equals(familyId).toArray() : [],
    [familyId]
  );

  const stores = useLiveQuery(
    () => familyId ? db.stores.where('familyId').equals(familyId).toArray() : [],
    [familyId]
  );

  // ─── COMPUTATIONS ───

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    toast.success('Transaction deleted');
  };

  const handleEdit = (expense: IExpense) => {
    openModal(MODAL_EDIT_EXPENSE, { expense });
  };

  const currentMonthExpenses = useMemo(() => 
    (expenses ?? []).filter(e => e.spentAt >= monthStart && e.spentAt <= monthEnd),
    [expenses, monthStart, monthEnd]
  );

  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthExpenses = useMemo(() => 
    (expenses ?? []).filter(e => e.spentAt >= lastMonthStart && e.spentAt <= lastMonthEnd),
    [expenses, lastMonthStart, lastMonthEnd]
  );

  const totalCurrent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLast = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentChange = totalLast > 0 ? ((totalCurrent - totalLast) / totalLast) * 100 : 0;

  // Chart Data: Last 30 days
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subMonths(now, 1),
      end: now
    });

    return days.map(day => {
      const dayTotal = (expenses ?? [])
        .filter(e => isSameDay(new Date(e.spentAt), day))
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        date: format(day, 'MMM dd'),
        amount: dayTotal
      };
    });
  }, [expenses]);

  // Category Breakdown for current month
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      const id = e.categoryId || 'uncategorized';
      stats[id] = (stats[id] || 0) + e.amount;
    });

    return Object.entries(stats)
      .map(([id, amount]) => {
        const cat = (categories ?? []).find(c => c.id === id);
        return {
          name: cat?.name || 'Uncategorized',
          color: cat?.color || '#94a3b8',
          amount,
          percent: totalCurrent > 0 ? (amount / totalCurrent) * 100 : 0
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentMonthExpenses, categories, totalCurrent]);

  const recentExpenses = useMemo(() => 
    (expenses ?? [])
      .sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime())
      .slice(0, 8),
    [expenses]
  );

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));
  const accountMap = new Map((accounts ?? []).map((a) => [a.id, a]));
  const storeMap = new Map((stores ?? []).map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      {/* ─── TOP BAR ─── */}
      <header className="flex items-center justify-between gap-8">
        <div className="flex-1 relative max-w-2xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search transactions, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 glass rounded-2xl border-white/5 focus:border-brand-primary/20 outline-none text-surface-100 placeholder:text-surface-600 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative w-12 h-12 rounded-2xl glass flex items-center justify-center text-surface-400 hover:text-brand-primary transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-brand-primary rounded-full shadow-glow" />
          </button>
          
          <div className="h-8 w-px bg-white/5 mx-2" />

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-surface-50">{profile?.displayName}</p>
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest leading-none mt-1">
                Family Admin
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl border border-white/10 p-0.5 shadow-card"
              style={{ background: profile?.avatarBg }}
            >
              <div className="w-full h-full rounded-2xl bg-surface-900/50 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                 <LayoutGrid className="w-6 h-6 text-brand-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION: BALANCE & CHART ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Spending Chart */}
        <div className="lg:col-span-2 glass-card p-6 min-h-[420px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-surface-50 tracking-tight">Spending Overview</h2>
              <p className="text-sm text-surface-500 font-medium">Daily expenses over the last 30 days</p>
            </div>
            <div className="flex items-center gap-2">
               <button className="btn btn-secondary btn-sm rounded-xl">
                 <Filter className="w-4 h-4 mr-2" /> Filter
               </button>
               <button className="btn btn-secondary btn-sm rounded-xl">
                 <Download className="w-4 h-4 mr-2" /> Export
               </button>
            </div>
          </div>

          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(3, 7, 18, 0.8)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 700 }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balance Card & Stats */}
        <div className="space-y-8">
          <div className="glass-card bg-brand-primary/10 border-brand-primary/20 p-8 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
            
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4">Total Spent (Monthly)</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black text-surface-50 tracking-tighter drop-shadow-glow">
                {formatCurrency(totalCurrent)}
              </span>
            </div>

            <div className={cn(
              "flex items-center gap-2 font-black text-xs px-3 py-1.5 rounded-full w-fit",
              percentChange > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
            )}>
              {percentChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(Math.round(percentChange))}% vs last month</span>
            </div>

            <div className="relative group">
              {/* External Glow */}
              <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <button 
                onClick={() => openModal(MODAL_ADD_EXPENSE)}
                className={cn(
                  "relative mt-12 w-full py-4 rounded-2xl bg-brand-primary overflow-hidden",
                  "shadow-[0_8px_32px_rgba(59,130,246,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)]",
                  "active:scale-95 transition-all outline-none",
                  "hover:-translate-y-1 hover:shadow-[0_12px_44px_rgba(59,130,246,0.6)]"
                )}
              >
                {/* Shimmer Sweep Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                
                <div className="relative z-10 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-white">
                  <Plus className="w-5 h-5 drop-shadow-md" /> 
                  Add Transaction
                </div>
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-black text-surface-50 uppercase tracking-widest mb-6">Top Categories</h3>
            <div className="space-y-4">
              {categoryStats.map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="text-xs font-bold text-surface-300">{stat.name}</span>
                    </div>
                    <span className="text-xs font-black text-surface-50">
                      {formatNumber(stat.amount)} €
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percent}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RECENT TRANSACTIONS TABLE ─── */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <h2 className="text-xl font-black text-surface-50 tracking-tight">Recent Transactions</h2>
          <button className="text-brand-primary text-xs font-black uppercase tracking-widest hover:underline transition-all">
            See All Transactions
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/2">
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Account</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentExpenses.map((expense) => {
                const category = categoryMap.get(expense.categoryId || '');
                const account = accountMap.get(expense.accountId || '');
                const store = storeMap.get(expense.storeId || '');
                
                return (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center font-bold text-surface-400 group-hover:scale-110 transition-transform">
                          {expense.description?.charAt(0) || expense.amount.toString().charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-surface-50 truncate max-w-[140px]">{expense.description || 'No Description'}</span>
                          {store && <span className="text-[10px] font-black text-surface-400 mt-1 uppercase tracking-widest">{store.name}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span 
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                        style={{ backgroundColor: `${category?.color || '#334155'}20`, color: category?.color || '#94a3b8' }}
                       >
                         {category?.name || 'Uncategorized'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{account?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-surface-500">{format(new Date(expense.spentAt), 'MMM dd, yyyy')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-surface-50">-{formatNumber(expense.amount)} €</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                          className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center hover:bg-brand-primary hover:text-white text-brand-primary active:scale-95 transition-all"
                          aria-label="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center hover:bg-danger hover:text-white text-danger active:scale-95 transition-all"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ─── ADD EXPENSE MODAL TRIGGER (Floating for Desktop too if needed, but we have the button) ─── */}
    </div>
  );
}

// Add simple LayoutGrid icon for fallback if needed
function LayoutGrid(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
