import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

const FinanceContext = createContext(undefined);

export function FinanceProvider({ children }) {
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const [allTransactions, setAllTransactions] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleFirestoreError = (error, operationType, path) => {
    const errInfo = {
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
      
      const setupListener = (queryToUse) => {
        return onSnapshot(queryToUse, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
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

  const addTransaction = async (t) => {
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

  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const editTransaction = async (updated) => {
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
