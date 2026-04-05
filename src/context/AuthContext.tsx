import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthState } from '../types';
import { auth, googleProvider } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  isAuthReady: boolean;`n  isMasterAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);`n  const isMasterAdmin = user?.email === "iamshank7805@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const allowedEmails = ['iamshank7805@gmail.com'];
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userData: User;
        
        if (userDoc.exists()) {
          userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: userDoc.data().role as UserRole,
            name: userDoc.data().name || firebaseUser.displayName || 'User',
          };
        } else {
          const isDefaultAdmin = firebaseUser.email && allowedEmails.includes(firebaseUser.email);
          userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: isDefaultAdmin ? 'admin' : 'viewer',
            name: firebaseUser.displayName || 'User',
          };
          try { await setDoc(userDocRef, { email: userData.email, role: userData.role, name: userData.name }); } catch (e) { console.error("Firestore user creation failed:", e); }
        }
        
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(firebaseUser, { displayName: name });
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const switchRole = async (role: UserRole) => {
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        try { await setDoc(userDocRef, { email: userData.email, role: userData.role, name: userData.name }); } catch (e) { console.error("Firestore user creation failed:", e); }
        setUser({ ...user, role });
      } catch (error) {
        console.error("Failed to switch role:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAuthReady, isMasterAdmin, login, loginWithEmail, signup, resetPassword, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


