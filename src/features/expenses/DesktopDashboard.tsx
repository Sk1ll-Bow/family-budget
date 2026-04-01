import { useState, useMemo, Fragment } from 'react';
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
  Trash2,
  ReceiptText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X
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
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../core/db';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { useModalStore } from '../../core/useModalStore';
import { ExpenseRow } from './ExpenseRow';
import { formatCurrency, formatNumber } from '../../core/formatters';
import { deleteExpense, deleteBatchExpenses } from './expenseService';
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
  const [showAll, setShowAll] = useState(false);
  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // ─── DATA FETCHING ───

  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate).toISOString();
  const monthEnd = endOfMonth(currentDate).toISOString();

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

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

  const handleDelete = async (id: string, confirmed = false) => {
    if (!confirmed) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000); // Reset after 3 seconds
      return;
    }
    await deleteExpense(id);
    setDeletingId(null);
    toast.success('Transaction deleted');
  };

  const handleBulkDelete = async (confirmed = false) => {
    if (selectedIds.size === 0) return;
    if (!confirmed) {
      setIsDeletingBulk(true);
      setTimeout(() => setIsDeletingBulk(false), 4000);
      return;
    }
    await deleteBatchExpenses(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsDeletingBulk(false);
    toast.success(`${selectedIds.size} transactions deleted`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allVisibleIds = new Set<string>();
    processedRows.forEach(row => {
      if (row.type === 'single') allVisibleIds.add(row.expense.id);
      else row.visibleExpenses.forEach((e: any) => allVisibleIds.add(e.id));
    });

    if (selectedIds.size === allVisibleIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(allVisibleIds);
    }
  };

  const toggleSelectGroup = (expenses: IExpense[]) => {
    const ids = expenses.map(e => e.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleEdit = (expense: IExpense) => {
    openModal(MODAL_EDIT_EXPENSE, { expense });
  };

  const currentMonthExpenses = useMemo(() => 
    (expenses ?? []).filter(e => e.spentAt >= monthStart && e.spentAt <= monthEnd),
    [expenses, monthStart, monthEnd]
  );

  const lastMonthStart = startOfMonth(subMonths(currentDate, 1)).toISOString();
  const lastMonthEnd = endOfMonth(subMonths(currentDate, 1)).toISOString();
  const lastMonthExpenses = useMemo(() => 
    (expenses ?? []).filter(e => e.spentAt >= lastMonthStart && e.spentAt <= lastMonthEnd),
    [expenses, lastMonthStart, lastMonthEnd]
  );

  const totalCurrent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLast = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentChange = totalLast > 0 ? ((totalCurrent - totalLast) / totalLast) * 100 : 0;

  // Chart Data: Full Month View
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
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
  }, [expenses, currentDate]);

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

  const categoryMap = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a])), [accounts]);
  const storeMap = useMemo(() => new Map((stores ?? []).map((s) => [s.id, s])), [stores]);

  const displayedExpenses = useMemo(() => {
    let filtered = currentMonthExpenses;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.description?.toLowerCase().includes(q) ||
        categoryMap.get(e.categoryId || '')?.name.toLowerCase().includes(q) ||
        storeMap.get(e.storeId || '')?.name.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    const sorted = filtered.sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());
    
    // Slice if not showing all
    return showAll ? sorted : sorted.slice(0, 8);
  }, [showAll, searchQuery, categoryMap, storeMap, currentMonthExpenses]);

  const toggleReceipt = (receiptId: string) => {
    setExpandedReceipts(prev => {
      const next = new Set(prev);
      if (next.has(receiptId)) next.delete(receiptId);
      else next.add(receiptId);
      return next;
    });
  };

  const processedRows = useMemo(() => {
    const result: any[] = [];
    const grouped: Record<string, IExpense[]> = {};
    
    // Pre-calculate full totals and counts for groups from the entire expense list
    const groupFullData: Record<string, { total: number, count: number, expenses: IExpense[] }> = {};
    (expenses ?? []).forEach(e => {
      if (e.receiptId) {
        if (!groupFullData[e.receiptId]) groupFullData[e.receiptId] = { total: 0, count: 0, expenses: [] };
        groupFullData[e.receiptId].total += e.amount;
        groupFullData[e.receiptId].count += 1;
        groupFullData[e.receiptId].expenses.push(e);
      }
    });

    // 1. Group by receiptId based on DISPLAYED expenses
    displayedExpenses.forEach(e => {
      if (e.receiptId) {
        if (!grouped[e.receiptId]) grouped[e.receiptId] = [];
        grouped[e.receiptId].push(e);
      } else {
        result.push({ type: 'single', expense: e });
      }
    });

    // 2. Add groups to result
    Object.entries(grouped).forEach(([receiptId, items]) => {
      const fullData = groupFullData[receiptId];
      // If any item of a group matches the filter, we show the group row
      // We show either the group UI if there are multiple items in the FULL group,
      // or just a single row if the group actually only has one item.
      if (fullData && fullData.count > 1) {
        result.push({ 
          type: 'group', 
          receiptId, 
          visibleExpenses: items, // Items matching the filter
          allExpenses: fullData.expenses, // All items for editing/expanding if needed
          storeId: items[0].storeId,
          accountId: items[0].accountId,
          spentAt: items[0].spentAt,
          totalAmount: fullData.total, // Use the FULL total
          fullCount: fullData.count
        });
      } else {
        // If it's effectively a single item (or fullData missing which shouldn't happen)
        result.push({ type: 'single', expense: items[0] });
      }
    });

    // 3. Sort final rows by date descending
    return result.sort((a, b) => {
      const dateA = a.type === 'single' ? a.expense.spentAt : a.spentAt;
      const dateB = b.type === 'single' ? b.expense.spentAt : b.spentAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [displayedExpenses, expenses]);

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
          {/* Month Selector */}
          <div className="flex items-center gap-1 glass p-1 rounded-2xl">
            <button
              onClick={prevMonth}
              className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors text-surface-400 hover:text-brand-primary"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button 
              onClick={goToToday}
              className="px-4 h-10 flex flex-col items-center justify-center min-w-[120px] hover:bg-white/5 rounded-xl transition-colors group"
            >
              <span className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] leading-none mb-1 group-hover:text-brand-primary transition-colors">
                {format(currentDate, 'yyyy')}
              </span>
              <span className="text-sm font-black text-surface-50 tracking-tight leading-none">
                {format(currentDate, 'MMMM')}
              </span>
            </button>

            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors text-surface-400 hover:text-brand-primary"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="h-8 w-px bg-white/5 mx-2" />
          
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
              <p className="text-sm text-surface-500 font-medium">Daily expenses for {format(currentDate, 'MMMM yyyy')}</p>
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

          <div className="flex-1 w-full -ml-4 min-w-0 min-h-[300px]">
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
          <h2 className="text-xl font-black text-surface-50 tracking-tight">
            Transactions for {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-brand-primary text-xs font-black uppercase tracking-widest hover:underline transition-all"
          >
            {showAll ? 'Show Fewer' : 'See All in Month'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/2">
                <th className="px-6 py-4 w-10">
                   <button 
                    onClick={toggleSelectAll}
                    className={cn(
                      "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                      selectedIds.size > 0 && selectedIds.size === processedRows.reduce((acc, r) => acc + (r.type === 'single' ? 1 : r.visibleExpenses.length), 0)
                        ? "bg-brand-primary border-brand-primary" 
                        : "border-white/20 hover:border-brand-primary"
                    )}
                   >
                     {selectedIds.size > 0 && <Check className="w-3 h-3 text-white" />}
                   </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Account</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-surface-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedRows.map((row) => {
                if (row.type === 'group') {
                  const account = accountMap.get(row.accountId || '');
                  const store = storeMap.get(row.storeId || '');
                  const isExpanded = expandedReceipts.has(row.receiptId);
                  
                  return (
                    <Fragment key={row.receiptId}>
                      <tr 
                        className="hover:bg-white/5 transition-colors cursor-pointer group/grouprow"
                        onClick={() => toggleReceipt(row.receiptId)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                           <button 
                            onClick={() => toggleSelectGroup(row.allExpenses)}
                            className={cn(
                              "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                              row.allExpenses.every((e: any) => selectedIds.has(e.id)) 
                                ? "bg-brand-primary border-brand-primary text-white" 
                                : "border-white/20 hover:border-brand-primary"
                            )}
                           >
                             {row.allExpenses.some((e: any) => selectedIds.has(e.id)) && (
                               <div className={cn("w-1.5 h-1.5 bg-current rounded-full", row.allExpenses.every((e: any) => selectedIds.has(e.id)) ? "hidden" : "block")} />
                             )}
                             {row.allExpenses.every((e: any) => selectedIds.has(e.id)) && <Check className="w-3 h-3" />}
                           </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center font-bold text-brand-primary group-hover/grouprow:scale-110 transition-transform relative">
                               <ReceiptText className="w-4 h-4" />
                               <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[8px] px-1 rounded-full">{row.fullCount}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-surface-50">
                                {`${store?.name || 'Unknown Store'}, ${format(new Date(row.spentAt), 'dd.MM.yyyy')}, ${format(new Date(row.spentAt), 'HH:mm')}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-primary/10 text-brand-primary">
                            {row.visibleExpenses.length === row.fullCount ? 'Full Receipt' : `Showing ${row.visibleExpenses.length} of ${row.fullCount}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{account?.name || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-surface-500">{format(new Date(row.spentAt), 'MMM dd, yyyy')}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-surface-50">-{formatNumber(row.totalAmount)} €</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                             <div className={cn("w-8 h-8 rounded-lg glass flex items-center justify-center text-surface-400 group-hover:text-brand-primary transition-all", isExpanded && "rotate-180")}>
                                <ChevronDown className="w-4 h-4" />
                             </div>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && row.visibleExpenses.map((expense: IExpense) => {
                        const category = categoryMap.get(expense.categoryId || '');
                        return (
                          <tr key={expense.id} className={cn("bg-white/[0.02] border-l-2 border-brand-primary/30 group", selectedIds.has(expense.id) && "bg-brand-primary/5")}>
                            <td className="px-6 py-3 pl-8">
                               <button 
                                onClick={() => toggleSelect(expense.id)}
                                className={cn(
                                  "w-4 h-4 rounded border transition-all flex items-center justify-center",
                                  selectedIds.has(expense.id) 
                                    ? "bg-brand-primary border-brand-primary text-white" 
                                    : "border-white/10 hover:border-brand-primary"
                                )}
                               >
                                 {selectedIds.has(expense.id) && <Check className="w-2.5 h-2.5" />}
                               </button>
                            </td>
                            <td className="px-6 py-3 pl-4">
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-surface-300">{expense.description || 'No Description'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                               <span 
                                className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                                style={{ backgroundColor: `${category?.color || '#334155'}20`, color: category?.color || '#94a3b8' }}
                               >
                                 {category?.name || 'Uncategorized'}
                               </span>
                            </td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3 text-right">
                              <span className="text-[11px] font-black text-surface-200">-{formatNumber(expense.amount)} €</span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleEdit(expense); }}
                                  className="w-6 h-6 rounded-md bg-brand-primary/10 flex items-center justify-center hover:bg-brand-primary hover:text-white text-brand-primary transition-all"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(expense.id, deletingId === expense.id); }}
                                  className={cn(
                                    "px-3 h-6 rounded-md flex items-center justify-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-widest",
                                    deletingId === expense.id 
                                      ? "bg-danger text-white shadow-glow" 
                                      : "bg-danger/10 text-danger hover:bg-danger hover:text-white"
                                  )}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  {deletingId === expense.id && "Confirm?"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                }

                const expense = row.expense;
                const category = categoryMap.get(expense.categoryId || '');
                const account = accountMap.get(expense.accountId || '');
                const store = storeMap.get(expense.storeId || '');
                
                return (
                  <tr key={expense.id} className={cn("hover:bg-white/5 transition-colors group", selectedIds.has(expense.id) && "bg-brand-primary/5")}>
                    <td className="px-6 py-4">
                       <button 
                        onClick={() => toggleSelect(expense.id)}
                        className={cn(
                          "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                          selectedIds.has(expense.id) 
                            ? "bg-brand-primary border-brand-primary text-white" 
                            : "border-white/20 hover:border-brand-primary"
                        )}
                       >
                         {selectedIds.has(expense.id) && <Check className="w-3 h-3" />}
                       </button>
                    </td>
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
                          onClick={() => handleDelete(expense.id, deletingId === expense.id)}
                          className={cn(
                            "px-4 h-8 rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest",
                            deletingId === expense.id 
                              ? "bg-danger text-white shadow-glow" 
                              : "bg-danger/10 text-danger hover:bg-danger hover:text-white"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === expense.id && "Confirm?"}
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
      
      {/* ─── BULK ACTIONS BAR ─── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="glass-card bg-surface-900/80 border-brand-primary/20 p-2 pl-6 flex items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[320px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-xs">
                  {selectedIds.size}
                </div>
                <span className="text-sm font-bold text-surface-200">Selected</span>
              </div>
              
              <div className="h-8 w-px bg-white/5" />
              
              <div className="flex items-center gap-3 pr-2">
                <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-surface-500 hover:text-surface-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleBulkDelete(isDeletingBulk)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    isDeletingBulk 
                      ? "bg-danger text-white shadow-glow animate-pulse" 
                      : "bg-danger/10 text-danger hover:bg-danger hover:text-white"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingBulk ? "Confirm Delete?" : "Delete Selected"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
