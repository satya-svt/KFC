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

  const [organizationOptions, setOrganizationOptions] = useState<string[]>([]);
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
    organizationName: '',
    state: '',
    country: ''
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase.from('organizations').select('name').order('name');
      if (error) {
        console.error("Error fetching organizations:", error);
      } else if (data) {
        setOrganizationOptions(data.map(o => o.name));
      }
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setAuthMode('signup');
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        const fiveMinutes = 5 * 60 * 1000;

        if (loginTimestamp && (Date.now() - parseInt(loginTimestamp, 10)) > fiveMinutes) {
          supabase.auth.signOut();
          localStorage.removeItem('loginTimestamp');
        } else {
          navigate('/auth');
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('loginTimestamp', Date.now().toString());
        navigate('/general');
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('loginTimestamp');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.search]);

  // --- CHANGE START: The handleAuth function is updated with new, secure logic for 'forgot' mode ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (!formData.organizationName || !formData.state || !formData.country || !formData.emailOrUsername) {
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
        if (!formData.organizationName || !formData.password) {
          throw new Error('Please select an organization and enter your password.');
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('organization_name', formData.organizationName)
          .single();

        if (profileError || !profile) {
          throw new Error('Invalid organization or password.');
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: formData.password
        });
        if (signInError) throw signInError;

        localStorage.setItem('loginTimestamp', Date.now().toString());
        navigate('/general');

      } else if (authMode === 'forgot') {
        // 1. Check if an organization is selected
        if (!formData.organizationName) {
          throw new Error('Please select your organization to reset the password.');
        }

        // 2. Find the email associated with that organization
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('organization_name', formData.organizationName)
          .single();

        if (profileError || !profile) {
          throw new Error('Organization not found.');
        }

        // 3. Send the reset email to the correct, associated email address
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;

        setMessage('Password reset email sent!');
        setMessageType('success');
      }
    } catch (error) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          setAuthMode('login');
          errorMessage = 'This email is already registered. Please sign in.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid organization or password.';
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
  // --- CHANGE END ---

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
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl border border-gray-300 p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex w-full justify-between items-center">
            <div className="w-7"></div>
            <motion.h1
              className="text-3xl font-bold text-gray-800"
              onClick={handleLogoClick}
            >
              {authMode === 'login' ? 'Welcome Back' :
                authMode === 'signup' ? 'Create Account' :
                  'Reset Password'}
            </motion.h1>
            <motion.button
              className="text-gray-500 hover:text-gray-800 transition-colors"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Go to Home Page"
            >
              <Home className="w-7 h-7" />
            </motion.button>
          </div>
          <motion.p
            className="text-gray-600 text-lg font-medium mt-2">
            {authMode === 'login' && 'Sign in to submit your data'}
            {authMode === 'signup' && 'Join our data platform'}
            {/* --- CHANGE START: Updated instruction text for forgot mode --- */}
            {authMode === 'forgot' && 'Select your organization to reset your password'}
            {/* --- CHANGE END --- */}
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
                className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm"
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
              ? 'text-green-800 bg-green-100 border border-green-300'
              : 'text-red-800 bg-red-100 border border-red-300'
              }`}
          >
            {messageType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <div className="text-sm">{message}</div>
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {authMode === 'login' && (
            <>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select Organization</option>
                  {organizationOptions.map(org => (<option key={org} value={org}>{org}</option>))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </>
          )}

          {authMode === 'signup' && (
            <>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select Organization</option>
                  {organizationOptions.map(org => (<option key={org} value={org}>{org}</option>))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.emailOrUsername}
                  onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select State</option>
                  {indianStates.map(state => (<option key={state} value={state}>{state}</option>))}
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                />
              </div>
            </>
          )}

          {/* --- CHANGE START: The UI for 'forgot' mode is now updated to only show the organization dropdown --- */}
          {authMode === 'forgot' && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                required
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Organization</option>
                {organizationOptions.map(org => (<option key={org} value={org}>{org}</option>))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          )}
          {/* --- CHANGE END --- */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-500 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg flex justify-center items-center space-x-2"
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

        <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
          {authMode === 'login' && (
            <>
              {/* --- CHANGE START: The "Forgot Password?" button is now disabled if no organization is selected --- */}
              <button
                onClick={() => setAuthMode('forgot')}
                className="hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formData.organizationName}
              >
                Forgot Password?
              </button>
              {/* --- CHANGE END --- */}
              <div>
                Don't have an account?{' '}
                <button onClick={() => setAuthMode('signup')} className="text-gray-800 font-semibold hover:underline">
                  Register
                </button>
              </div>
            </>
          )}
          {authMode === 'signup' && (
            <div>
              Already have an account?{' '}
              <button onClick={() => setAuthMode('login')} className="text-gray-800 font-semibold hover:underline">
                Sign In
              </button>
            </div>
          )}
          {authMode === 'forgot' && (
            <button onClick={() => setAuthMode('login')} className="text-gray-800 font-semibold hover:underline">
              Back to Sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
