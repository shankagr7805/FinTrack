import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, FinanceSummary } from '../types';
import { useAuth } from './AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

interface FinanceContextType {
  allTransactions: Transaction[];
  transactions: Transaction[];
  summary: FinanceSummary;
  dateRange: { start: string; end: string } | null;
  setDateRange: (range: { start: string; end: string } | null) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  editTransaction: (transaction: Transaction) => Promise<void>;
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.id,
        email: user?.email,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    if (!isAuthReady) return;

    if (isAuthenticated && user) {
      setIsLoading(true);
      
      const setupListener = (queryToUse: any) => {
        return onSnapshot(queryToUse, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Transaction[];
          setAllTransactions(data);
          setIsLoading(false);
        }, (error) => {
          // If global list fails, fallback to per-user list if not admin
          if (error.message.includes('insufficient permissions') && user.role !== 'admin') {
            console.warn("Global read failed, falling back to per-user read. Please update Firestore rules.");
            const fallbackQuery = query(
              collection(db, 'transactions'), 
              where('uid', '==', user.id),
              orderBy('date', 'desc')
            );
            setupListener(fallbackQuery);
          } else {
            handleFirestoreError(error, OperationType.LIST, 'transactions');
          }
        });
      };

      // Try global query first
      const q = query(
        collection(db, 'transactions'),
        orderBy('date', 'desc')
      );

      const unsubscribe = setupListener(q);
      return () => unsubscribe();
    } else {
      setAllTransactions([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, user?.role, isAuthReady]);

  const transactions = useMemo(() => {
    if (!dateRange) return allTransactions;
    return allTransactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end);
  }, [allTransactions, dateRange]);

  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      totalBalance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
    };
  }, [transactions]);

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...t,
        uid: user.id,
        userEmail: user.email
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const editTransaction = async (updated: Transaction) => {
    try {
      const { id, ...data } = updated;
      await updateDoc(doc(db, 'transactions', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${updated.id}`);
    }
  };

  return (
    <FinanceContext.Provider
      value={{ 
        allTransactions, 
        transactions, 
        summary, 
        dateRange, 
        setDateRange, 
        addTransaction, 
        deleteTransaction, 
        editTransaction,
        isLoading
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
