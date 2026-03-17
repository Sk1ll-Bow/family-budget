import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
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

type TabKey = 'categories' | 'periods' | 'accounts';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'categories', label: 'Категории' },
  { key: 'periods', label: 'Периоды' },
  { key: 'accounts', label: 'Счета' },
];

/**
 * Analytics Dashboard with three tabs: Category Pie, Period Bars, Account Breakdown.
 * All data computed client-side from Dexie.
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
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-card">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              tab === t.key
                ? 'bg-brand-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'text-surface-400 hover:text-surface-200'
            )}
          >
            {t.label}
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
                  <div className="relative" style={{ height: 240 }}>
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
                              <div className="glass-card p-3 text-sm">
                                <p className="font-medium text-surface-100">{d.categoryName}</p>
                                <p className="text-surface-400">
                                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(d.amount)}
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
                        <p className="text-xs text-surface-400">Итого</p>
                        <p className="text-lg font-bold text-surface-100">
                          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(catData.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-2">
                    {catData.items.map((item) => (
                      <div key={item.categoryId} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-surface-300 flex-1 min-w-0 truncate">{item.categoryName}</span>
                        <span className="text-sm font-medium text-surface-100 shrink-0">
                          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(item.amount)}
                        </span>
                        <span className="text-xs text-surface-500 w-10 text-right shrink-0">{item.percentage}%</span>
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
                <div style={{ height: 280 }}>
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
                        tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}к` : String(v)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as IMonthlyTotal;
                          return (
                            <div className="glass-card p-3 text-sm">
                              <p className="font-medium text-surface-100">{d.monthLabel}</p>
                              <p className="text-surface-400">
                                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(d.total)}
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
            <div className="glass-card p-5 space-y-4">
              {accData.items.length === 0 ? (
                <EmptyChart />
              ) : (
                accData.items.map((item) => (
                  <div key={item.accountId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-300">{item.accountName}</span>
                      <span className="font-medium text-surface-100">
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(item.amount)}
                      </span>
                    </div>
                    <div className="h-3 bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-surface-500 text-right">{item.percentage}%</p>
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
      <p className="text-surface-300 font-medium">Нет данных</p>
      <p className="text-surface-500 text-sm mt-1">Добавьте расходы для аналитики</p>
    </div>
  );
}
