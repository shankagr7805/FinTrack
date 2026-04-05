import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { cn, formatCurrency } from '../lib/utils';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Zap
} from 'lucide-react';

export default function Insights() {
  const { transactions, summary, allTransactions } = useFinance();

  // Calculate insights
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const incomeTransactions = transactions.filter(t => t.type === 'income');

  // 1. Highest Category
  const categorySpending = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const highestCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

  // 2. Savings Rate
  const savingsRate = summary.totalIncome > 0 ? ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100 : 0;

  // 3. Monthly Comparison (Current vs Previous)
  const latestTransaction = transactions.length > 0 
    ? [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;
  
  const referenceDate = latestTransaction ? new Date(latestTransaction.date) : new Date();
  const currentMonth = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();
  
  const currentMonthExpenses = expenseTransactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();

  const allExpenses = allTransactions.filter(t => t.type === 'expense');

  const prevMonthExpenses = allExpenses
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  let monthlyComparisonText = 'Not enough data for monthly comparison.';
  let comparisonStatus = 'info';
  
  if (prevMonthExpenses > 0) {
    const diff = ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    const absDiff = Math.abs(diff).toFixed(1);
    if (diff > 0) {
      monthlyComparisonText = `Your expenses this month are ${absDiff}% higher than last month.`;
      comparisonStatus = 'warning';
    } else {
      monthlyComparisonText = `Your expenses this month are ${absDiff}% lower than last month.`;
      comparisonStatus = 'success';
    }
  }

  // 4. Budget Alert (Dynamic based on highest spending or specific threshold)
  const budgetThreshold = summary.totalIncome * 0.15 || 500; // 15% of income or $500
  const overBudgetCategory = Object.entries(categorySpending).find(([_, val]) => val > budgetThreshold);

  const insights = [
    {
      title: 'Highest Spending',
      description: highestCategory 
        ? `Your highest spending category is ${highestCategory[0]} with ${formatCurrency(highestCategory[1])}.`
        : 'No expense data available yet.',
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      status: highestCategory ? 'warning' : 'info'
    },
    {
      title: 'Savings Rate',
      description: summary.totalIncome > 0 
        ? `Your current savings rate is ${savingsRate.toFixed(1)}%. ${savingsRate > 20 ? 'Great job!' : 'Try to aim for at least 20%.'}`
        : 'Add some income to see your savings rate.',
      icon: Zap,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      status: savingsRate > 20 ? 'success' : 'info'
    },
    {
      title: 'Monthly Comparison',
      description: monthlyComparisonText,
      icon: Calendar,
      color: comparisonStatus === 'success' ? 'text-emerald-600' : comparisonStatus === 'warning' ? 'text-rose-600' : 'text-indigo-600',
      bg: comparisonStatus === 'success' ? 'bg-emerald-50' : comparisonStatus === 'warning' ? 'bg-rose-50' : 'bg-indigo-50',
      status: comparisonStatus
    },
    {
      title: 'Budget Alert',
      description: overBudgetCategory 
        ? `Warning: You've spent ${formatCurrency(overBudgetCategory[1])} on ${overBudgetCategory[0]}, which exceeds your recommended budget.`
        : `You're staying within your recommended category budgets. Keep it up!`,
      icon: AlertCircle,
      color: overBudgetCategory ? 'text-amber-600' : 'text-emerald-600',
      bg: overBudgetCategory ? 'bg-amber-50' : 'bg-emerald-50',
      status: overBudgetCategory ? 'alert' : 'success'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-700 dark:to-violet-800 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Lightbulb className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Financial Insights</h2>
            <p className="text-indigo-100">Smart observations based on your spending patterns</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {insights.map((insight, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xs:flex-row gap-4 hover:shadow-md transition-shadow">
            <div className={cn(insight.bg, insight.color, "p-4 rounded-2xl h-fit dark:bg-slate-800 shrink-0 w-fit")}>
              <insight.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{insight.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{insight.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status:</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  insight.status === 'success' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                  insight.status === 'warning' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                  insight.status === 'alert' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                  "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                )}>
                  {insight.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tip of the day */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tip of the Day</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          "The rule of 50/30/20: Spend 50% on needs, 30% on wants, and save 20% of your income."
        </p>
      </div>
    </div>
  );
}
