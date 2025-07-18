import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  User,
  Building2,
  Home
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    confirmPassword: '',
    username: '',
    organizationName: ''
  });

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validateOrganizationName = (orgName: string): boolean => {
    if (!orgName) return true;
    return orgName.trim().length >= 2 && orgName.trim().length <= 100;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');

    if (mode === 'signup') {
      setAuthMode('signup');
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/form');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/form');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.search]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (!validateUsername(formData.username)) {
          throw new Error('Username must be 3-20 alphanumeric characters only');
        }
        if (!validateOrganizationName(formData.organizationName)) {
          throw new Error('Organization name must be 2-100 characters');
        }
        const { error } = await supabase.auth.signUp({
          email: formData.emailOrUsername,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              organization_name: formData.organizationName || null
            }
          }
        });
        if (error) throw error;
        localStorage.setItem('pendingUserProfile', JSON.stringify({
          username: formData.username,
          organization_name: formData.organizationName || null,
          email: formData.emailOrUsername
        }));
        setMessage('Check your email for verification link!');
        setMessageType('success');
      } else if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.emailOrUsername,
          password: formData.password
        });
        if (error) throw error;
        navigate('/form');
      } else if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.emailOrUsername, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        setMessage('Password reset email sent!');
        setMessageType('success');
      }
    } catch (error) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        if (error.message.includes('User already registered') || error.message.includes('user_already_exists')) {
          setAuthMode('login');
          errorMessage = 'This email is already registered. Please sign in with your existing account.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait.';
        } else {
          errorMessage = error.message;
        }
      }
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount >= 4) {
      setShowAdminAccess(true);
      setTimeout(() => {
        setShowAdminAccess(false);
        setClickCount(0);
      }, 10000);
    }
    setTimeout(() => setClickCount(0), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          {(authMode === 'signup' || authMode === 'forgot') && (
            <motion.button
              onClick={() => setAuthMode('login')}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg mb-6 flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to Welcome</span>
            </motion.button>
          )}

          <motion.div
            // --- THIS IS THE ONLY CHANGE ---
            className="cursor-pointer inline-flex items-center justify-center gap-4" // Changed gap-3 to gap-4
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.h1 className="text-3xl font-bold text-white">
              {authMode === 'login' ? 'Welcome Back' :
                authMode === 'signup' ? 'Create Account' :
                  'Reset Password'}
            </motion.h1>
            <Home className="w-7 h-7 text-gray-400" />
          </motion.div>

          <motion.p className="text-gray-300 text-lg font-medium mt-2">
            {authMode === 'login' && 'Sign in to submit your data'}
            {authMode === 'signup' && 'Join our data platform'}
            {authMode === 'forgot' && 'Enter your email to reset password'}
          </motion.p>
        </div>

        <AnimatePresence>
          {showAdminAccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="mb-6"
            >
              <Link
                to="/admin"
                className="w-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-300 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex items-center space-x-2 p-4 rounded-lg mb-6 ${messageType === 'success'
              ? 'text-green-300 bg-green-900/30 border border-green-500/30'
              : 'text-red-300 bg-red-900/30 border border-red-500/30'
              }`}
          >
            {messageType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <div className="text-sm">{message}</div>
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              value={formData.emailOrUsername}
              onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
              placeholder="Enter your email or username"
              required
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
            />
          </div>

          {authMode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                required
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          )}

          {authMode === 'signup' && (
            <>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
              />
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Organization Name"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg flex justify-center items-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            <span>
              {authMode === 'login' ? 'Sign In' :
                authMode === 'signup' ? 'Create Account' :
                  'Send Reset Email'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-300 space-y-1">
          {authMode === 'login' && (
            <>
              <button onClick={() => setAuthMode('forgot')} className="hover:underline">
                Forgot Password?
              </button>
              <div>
                Don't have an account?{' '}
                <button onClick={() => setAuthMode('signup')} className="text-white hover:underline">
                  Sign up
                </button>
              </div>
            </>
          )}

          {authMode === 'signup' && (
            <div>
              Already have an account?{' '}
              <button onClick={() => setAuthMode('login')} className="text-white hover:underline">
                Sign in
              </button>
            </div>
          )}

          {authMode === 'forgot' && (
            <button onClick={() => setAuthMode('login')} className="text-white hover:underline">
              Back to Sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}