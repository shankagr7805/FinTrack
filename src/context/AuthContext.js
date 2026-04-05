import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase.js';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const isMasterAdmin = user?.email === 'iamshank7805@gmail.com';

  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const allowedEmails = ['iamshank7805@gmail.com'];
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial check and creation if needed
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          const isDefaultAdmin = firebaseUser.email && allowedEmails.includes(firebaseUser.email);
          await setDoc(userDocRef, {
            email: firebaseUser.email || '',
            role: isDefaultAdmin ? 'admin' : 'viewer',
            name: firebaseUser.displayName || 'User',
          });
        }

        // Listen for real-time updates to the user document
        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: docSnap.data().role,
              name: docSnap.data().name || firebaseUser.displayName || 'User',
            });
            setIsAuthenticated(true);
          }
        }, (error) => {
          console.error("Error listening to user doc:", error);
        });
      } else {
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, pass) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signup = async (email, pass, name) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(firebaseUser, { displayName: name });
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
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

  const switchRole = async (role) => {
    if (user) {
      // Only Master Admin can switch their own role via this quick-switch
      if (user.email !== 'iamshank7805@gmail.com') {
        console.error("Only Master Admin can use quick-switch.");
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { role }, { merge: true });
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
