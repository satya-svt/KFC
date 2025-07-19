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
  Home,
  MapPin,
  Globe,
  ChevronDown
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

const organizationOptions = [
  'org1', 'org2', 'org3', 'org4', 'org5', 'org6', 'org7', 'org8', 'org9', 'org10',
  'org11', 'org12', 'org13', 'org14', 'org15', 'org16', 'org17', 'org18', 'org19', 'org20',
  'org21', 'org22', 'org23', 'org24', 'org25', 'org26', 'org27', 'org28', 'org29', 'org30'
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  // --- 1. ADDED state back for the admin button ---
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    state: '',
    country: ''
  });

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
        if (!formData.organizationName || !formData.state || !formData.country) {
          throw new Error('Please fill out all required fields.');
        }

        const { error } = await supabase.auth.signUp({
          email: formData.emailOrUsername,
          password: formData.password,
          options: {
            data: {
              organization_name: formData.organizationName,
              state: formData.state,
              country: formData.country,
            }
          }
        });

        if (error) throw error;

        localStorage.setItem('pendingUserProfile', JSON.stringify({
          organization_name: formData.organizationName,
          state: formData.state,
          country: formData.country,
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

  // --- 2. ADDED the click handler function back ---
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
          <div className="flex w-full justify-between items-center">
            <div className="w-7"></div>
            <motion.h1
              className="text-3xl font-bold text-white"
              onClick={handleLogoClick} // Attached the click handler here
            >
              {authMode === 'login' ? 'Welcome Back' :
                authMode === 'signup' ? 'Create Account' :
                  'Reset Password'}
            </motion.h1>
            <motion.button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Go to Home Page"
            >
              <Home className="w-7 h-7" />
            </motion.button>
          </div>

          <motion.p className="text-gray-300 text-lg font-medium mt-2">
            {authMode === 'login' && 'Sign in to submit your data'}
            {authMode === 'signup' && 'Join our data platform'}
            {authMode === 'forgot' && 'Enter your email to reset password'}
          </motion.p>
        </div>

        {/* --- 3. ADDED the hidden admin button JSX back --- */}
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
          {(authMode === 'login' || authMode === 'signup') && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                required
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="" disabled className="bg-gray-800 text-gray-300">Select Organization</option>
                {organizationOptions.map(org => (
                  <option key={org} value={org} className="bg-gray-800 text-white">
                    {org}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              value={formData.emailOrUsername}
              onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
              placeholder="Enter your email"
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
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="" disabled className="bg-gray-800 text-gray-300">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state} className="bg-gray-800 text-white">
                      {state}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>

              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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