import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, BarChart3, Wallet } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../core/useAuthStore';
import {
  getCategoryBreakdown,
  getMonthlyComparison,
  getAccountBreakdown,
  type ICategoryBreakdown,
  type IMonthlyTotal,
  type IAccountBreakdown,
} from './analyticsService';
import { cn } from '../../core/cn';
import { ChartSkeleton } from '../../components/Skeleton';
import { LucideIcon } from '../../components/LucideIcon';
import { formatCurrency, formatNumber } from '../../core/formatters';

type TabKey = 'categories' | 'periods' | 'accounts';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'categories', label: 'By Category' },
  { key: 'periods', label: 'History' },
  { key: 'accounts', label: 'Accounts' },
];

/**
 * Premium Analytics Dashboard with smooth tab transitions and high-end charts.
 */
export function AnalyticsDashboard() {
  const { familyId } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('categories');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Data states
  const [catData, setCatData] = useState<{ items: ICategoryBreakdown[]; total: number }>({ items: [], total: 0 });
  const [monthData, setMonthData] = useState<IMonthlyTotal[]>([]);
  const [accData, setAccData] = useState<{ items: IAccountBreakdown[]; total: number }>({ items: [], total: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (!familyId) return;
    setLoading(true);

    const load = async () => {
      const [cat, mon, acc] = await Promise.all([
        getCategoryBreakdown(familyId, year, month),
        getMonthlyComparison(familyId, 6),
        getAccountBreakdown(familyId, year, month),
      ]);
      setCatData(cat);
      setMonthData(mon);
      setAccData(acc);
      setLoading(false);
    };
    load();
  }, [familyId, year, month]);

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="space-y-6 pb-10">
      {/* Month Picker Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-surface-50 tracking-tight">
          Statistics
        </h1>
        <div className="flex items-center gap-1 glass p-1 rounded-2xl">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-surface-400" />
          </button>
          <span className="text-[10px] font-black text-surface-200 uppercase tracking-widest px-2">
            {format(currentDate, 'MMM yyyy', { locale: ru })}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </button>
        </div>
      </header>

      {/* Modern Pill Tabs */}
      <div className="flex p-1.5 glass rounded-[24px]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative flex-1 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-colors outline-none',
              tab === t.key ? 'text-white' : 'text-surface-500'
            )}
          >
            {tab === t.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-brand-primary rounded-2xl shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>



      {/* Content */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <>
          {/* CATEGORIES TAB — Donut Chart */}
          {tab === 'categories' && (
            <div className="glass-card p-5 space-y-4">
              {catData.items.length === 0 ? (
                <EmptyChart />
              ) : (
                <>
                  <div className="relative min-w-0 w-full" style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={catData.items}
                          dataKey="amount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {catData.items.map((item) => (
                            <Cell key={item.categoryId} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload as ICategoryBreakdown;
                            return (
                              <div className="glass-card p-3 text-sm border-white/10">
                                <p className="font-black text-surface-50 uppercase tracking-widest text-[10px] mb-1">{d.categoryName}</p>
                                <p className="text-surface-400 font-bold">
                                  {formatCurrency(d.amount)}
                                  {' · '}{d.percentage}%
                                </p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1">Total</p>
                        <div className="flex items-baseline justify-center gap-0.5">
                          <span className="text-2xl font-black text-surface-50 -tracking-tight">
                            {formatNumber(catData.total)}
                          </span>
                          <span className="text-sm font-bold text-brand-primary/60">€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {catData.items.map((item) => (
                      <div key={item.categoryId} className="flex items-center gap-4 bg-white/5 rounded-2xl p-3 border border-white/5 transition-all hover:bg-white/10 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                          {/* Use category initial since we don't have easy access to whole category object here without more props */}
                          <span className="uppercase">{item.categoryName.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest leading-none mb-1">{item.categoryName}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-surface-100">{formatNumber(item.amount)}</span>
                            <span className="text-[10px] font-bold text-surface-500">€</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-brand-primary">{item.percentage}%</p>
                          <div className="w-12 h-1 bg-surface-800 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* PERIODS TAB — Bar Chart */}
          {tab === 'periods' && (
            <div className="glass-card p-5">
              {monthData.every((m) => m.total === 0) ? (
                <EmptyChart />
              ) : (
                <div className="min-w-0 w-full" style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: '#9999bb', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#9999bb', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as IMonthlyTotal;
                          return (
                            <div className="glass-card p-3 text-sm border-white/10">
                              <p className="font-black text-surface-50 uppercase tracking-widest text-[10px] mb-1">{d.monthLabel}</p>
                              <p className="text-surface-400 font-bold">
                                {formatCurrency(d.total)}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

           {/* ACCOUNTS TAB — Horizontal bars */}
           {tab === 'accounts' && (
             <div className="glass-card p-5 space-y-3">
               {accData.items.length === 0 ? (
                 <EmptyChart />
               ) : (
                 accData.items.map((item) => (
                   <div key={item.accountId} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 transition-all hover:bg-white/10">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-brand-secondary/10 flex items-center justify-center">
                           <Wallet className="w-4 h-4 text-brand-secondary" />
                         </div>
                         <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{item.accountName}</p>
                       </div>
                       <div className="flex items-baseline gap-1">
                         <span className="text-sm font-black text-surface-100">
                           {formatNumber(item.amount)}
                         </span>
                         <span className="text-[10px] font-bold text-surface-500">€</span>
                       </div>
                     </div>
                     <div className="space-y-1">
                       <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                         <div
                           className="h-full rounded-full bg-gradient-to-r from-brand-secondary to-brand-secondary/40 transition-all duration-700 ease-out"
                           style={{ width: `${item.percentage}%` }}
                         />
                       </div>
                       <p className="text-[10px] font-black text-brand-secondary text-right tracking-widest">{item.percentage}%</p>
                     </div>
                   </div>
                 ))
               )}
             </div>
           )}
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="py-12 text-center">
      <BarChart3 className="w-12 h-12 text-surface-500 mx-auto mb-3" />
      <p className="text-surface-300 font-medium">No Data Available</p>
      <p className="text-surface-500 text-sm mt-1">Add expenses to see your analytics</p>
    </div>
  );
}
