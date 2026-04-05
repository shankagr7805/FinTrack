import React, { useState, useMemo } from 'react';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';
import { useFinance } from '../context/FinanceContext.js';
import { cn, formatCurrency } from '../lib/utils.js';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { format, subDays, subMonths, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export default function Overview() {
  const { transactions, summary, dateRange } = useFinance();
  const [timeRange, setTimeRange] = useState('1m');

  const trendData = useMemo(() => {
    let startDate;
    let endDate = new Date();
    let interval;

    if (dateRange) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
      
      const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      interval = diffDays > 60 ? 'month' : 'day';
    } else {
      const now = new Date();
      endDate = now;
      switch (timeRange) {
        case '7d':
          startDate = subDays(now, 6);
          interval = 'day';
          break;
        case '1m':
          startDate = subDays(now, 30);
          interval = 'day';
          break;
        case '3m':
          startDate = subMonths(now, 3);
          interval = 'month';
          break;
        case '6m':
          startDate = subMonths(now, 6);
          interval = 'month';
          break;
        case '1y':
          startDate = subMonths(now, 12);
          interval = 'month';
          break;
        default:
          startDate = subDays(now, 30);
          interval = 'day';
      }
    }

    if (interval === 'day') {
      const days = [];
      for (let d = startDate; d <= endDate; d = new Date(d.getTime() + 86400000)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        // Calculate cumulative balance up to this day
        // Note: For trend, we should probably use the full history to get the starting balance
        // but for now, let's just use the current transactions list if it's filtered.
        // Actually, it's better to calculate balance from allTransactions if we want a true trend.
        // But for a "Period View", maybe just the period's flow?
        // Let's stick to the current logic which filters transactions by date <= dateStr.
        const balance = transactions
          .filter(t => t.date <= dateStr)
          .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
        
        days.push({
          label: format(d, 'MMM dd'),
          balance,
          fullDate: dateStr
        });
      }
      return days;
    } else {
      // Monthly grouping
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      return months.map(month => {
        const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');
        const balance = transactions
          .filter(t => t.date <= monthEnd)
          .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
        
        return {
          label: format(month, 'MMM'),
          balance,
          fullDate: monthEnd
        };
      });
    }
  }, [transactions, timeRange, dateRange]);

  // Prepare data for spending breakdown
  const categoryData = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.name === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({ name: t.category, value: t.amount });
        }
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const stats = [
    { label: 'Total Balance', value: summary.totalBalance, icon: Wallet, color: 'bg-indigo-600', trend: '+2.5%', trendColor: 'text-emerald-600', trendBg: 'bg-emerald-50' },
    { label: 'Total Income', value: summary.totalIncome, icon: ArrowUpRight, color: 'bg-emerald-600', trend: '+12%', trendColor: 'text-emerald-600', trendBg: 'bg-emerald-50' },
    { label: 'Total Expenses', value: summary.totalExpenses, icon: ArrowDownRight, color: 'bg-rose-600', trend: '-4%', trendColor: 'text-rose-600', trendBg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <div key={i} className={cn(
            "bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group",
            i === 2 && "sm:col-span-2 lg:col-span-1"
          )}>
            <div className="flex items-center justify-between mb-6">
              <div className={cn(stat.color, "p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300")}>
                <stat.icon className="w-7 h-7" />
              </div>
              <span className={cn("text-xs font-bold px-3 py-1 rounded-full", stat.trendBg, stat.trendColor, "dark:bg-slate-800")}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{formatCurrency(stat.value)}</h3>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Trend */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Balance Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cumulative wealth over time</p>
            </div>
            {!dateRange && (
              <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                {['7d', '1m', '3m', '6m', '1y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                      timeRange === range 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  interval={timeRange === '7d' ? 0 : timeRange === '1m' ? 5 : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#6366f1' }}
                  labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 700 }}
                  formatter={(val) => [formatCurrency(val), 'Balance']}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Spending Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Expenses categorized by type</p>
          </div>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ color: 'inherit' }}
                  formatter={(val) => [formatCurrency(val), 'Spent']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="hidden sm:flex flex-col gap-3 ml-4">
              {categoryData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
