import { AuthProvider, useAuth } from './context/AuthContext.js';
import { FinanceProvider } from './context/FinanceContext.js';
import AuthPage from './components/AuthPage.js';
import Dashboard from './components/Dashboard.js';

function AppContent() {
  const { isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <FinanceProvider>
      <Dashboard />
    </FinanceProvider>
  ) : (
    <AuthPage />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
