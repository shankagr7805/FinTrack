import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  LogOut, 
  User, 
  Shield, 
  Eye,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar as CalendarIcon,
  Moon,
  Sun
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import Overview from './Overview';
import Transactions from './Transactions';
import Insights from './Insights';
import UserManagement from './UserManagement';

type Tab = 'overview' | 'transactions' | 'insights' | 'users';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('fin_theme');
    // Default to dark mode if no preference is saved
    return saved === 'dark' || !saved;
  });

  const { user, logout, switchRole } = useAuth();
  const { transactions, summary, dateRange, setDateRange } = useFinance();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fin_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newRange = {
      start: type === 'start' ? value : (dateRange?.start || ''),
      end: type === 'end' ? value : (dateRange?.end || ''),
    };
    
    if (newRange.start && newRange.end) {
      setDateRange(newRange);
    } else if (!newRange.start && !newRange.end) {
      setDateRange(null);
    } else {
      // Partial range, just update state but maybe don't filter yet? 
      // Actually FinanceContext expects a full range or null.
      // Let's just update the state.
      setDateRange(newRange);
    }
  };

  const clearDateRange = () => {
    setDateRange(null);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'insights', label: 'Insights', icon: PieChart },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'Users', icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">FinTrack</span>
              </div>
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    activeTab === item.id 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => switchRole('admin')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold transition-all",
                    user?.role === 'admin' ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <Shield className="w-3 h-3" />
                  Admin
                </button>
                <button
                  onClick={() => switchRole('viewer')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold transition-all",
                    user?.role === 'viewer' ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <Eye className="w-3 h-3" />
                  Viewer
                </button>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
              <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">From</span>
                <input
                  type="date"
                  value={dateRange?.start || ''}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">To</span>
                <input
                  type="date"
                  value={dateRange?.end || ''}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              {dateRange && (
                <button 
                  onClick={clearDateRange}
                  className="ml-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
                  title="Clear Filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {!dateRange ? 'Total Balance' : 'Period Balance'}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(summary.totalBalance)}</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-bold">{formatCurrency(summary.totalIncome)}</span>
              </div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-bold">{formatCurrency(summary.totalExpenses)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && <Overview />}
                {activeTab === 'transactions' && <Transactions />}
                {activeTab === 'insights' && <Insights />}
                {activeTab === 'users' && user?.role === 'admin' && <UserManagement />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
