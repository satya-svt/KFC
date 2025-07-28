// src/components/ResetPasswordPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Supabase sends an access_token in the URL hash when the user clicks the email link.
        // We listen for it here.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // This event fires when the user is ready to reset their password.
                // You can add logic here if needed, but the main logic is in handleSubmit.
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            setMessageType('error');
            return;
        }
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters long.');
            setMessageType('error');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                throw error;
            }

            setMessage('Your password has been reset successfully! You can now log in.');
            setMessageType('success');

            // After a short delay, redirect to the login page
            setTimeout(() => {
                navigate('/auth');
            }, 3000);

        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-white rounded-2xl border border-gray-300 p-8 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Set a New Password</h1>
                </div>

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

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
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
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || messageType === 'success'}
                        className="w-full bg-gray-500 hover:bg-gray-400 text-white font-semibold py-3 rounded-lg flex justify-center items-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : null}
                        <span>Update Password</span>
                    </button>
                </form>
            </motion.div>
        </div>
    );
}