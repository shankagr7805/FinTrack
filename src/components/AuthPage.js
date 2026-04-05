import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LogIn, TrendingUp, Mail, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { login, loginWithEmail, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getErrorMessage = (err) => {
    const code = err.code || '';
    switch (code) {
      case 'auth/popup-closed-by-user':
        return 'The sign-in popup was closed before finishing. Please try again.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password. Please check your details and try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email. Try logging in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for sign-in. Please check your Firebase settings.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled in Firebase. Please enable it in the console.';
      default:
        return err.message || 'Authentication failed. Please try again.';
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'signup') {
        await signup(email, password, name);
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setSuccess('Password reset email sent! Please check your inbox.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderInitial = () => (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold py-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5"
              referrerPolicy="no-referrer"
            />
            Continue with Google
          </>
        )}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Or</span>
        </div>
      </div>

      <button
        onClick={() => setMode('login')}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
      >
        <Mail className="w-5 h-5" />
        Continue with Email
      </button>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      <button 
        type="button"
        onClick={() => setMode('initial')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg border border-emerald-100 dark:border-emerald-800">
          {success}
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
        <input
          type="email"
          required
          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {mode !== 'forgot-password' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot-password');
                  setError('');
                  setSuccess('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          mode === 'login' ? <LogIn className="w-5 h-5" /> : 
          mode === 'signup' ? <UserPlus className="w-5 h-5" /> :
          <Mail className="w-5 h-5" />
        )}
        {mode === 'login' ? 'Sign In' : 
         mode === 'signup' ? 'Create Account' : 
         'Send Reset Link'}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setSuccess('');
          }}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 
           mode === 'signup' ? "Already have an account? Sign in" :
           "Back to sign in"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">
            FinTrack
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
            {mode === 'initial' ? 'Your personal finance tracker.' : 
             mode === 'login' ? 'Welcome Back' : 
             mode === 'signup' ? 'Join FinTrack' :
             'Reset Password'}
          </p>

          {mode === 'initial' ? renderInitial() : renderForm()}
          
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
