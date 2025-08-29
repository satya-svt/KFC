import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, ClipboardList, Eye, Trash2 } from 'lucide-react'
import { supabase, getUserProfile } from '../lib/supabase'
import { clearAllAutoSavedData } from '../lib/autoSave'; // ✅ NEW: Import the new function

export default function EntryOptions() {
    const navigate = useNavigate()
    const [userProfile, setUserProfile] = useState<{ organization_name?: string | null } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await getUserProfile();
            setUserProfile(profile);
        };
        fetchProfile();
    }, []);

    const handleNewEntry = async () => {
        // ✅ FIX: Clear all auto-saved data from the database before starting a new entry
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await clearAllAutoSavedData();
        }
        navigate('/general');
    };

    const handlePreviousEntry = () => {
        navigate('/review');
    };

    return (
        <motion.div
            className="min-h-screen bg-gray-200 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="max-w-md w-full bg-white rounded-2xl border border-gray-300 p-8 shadow-2xl text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-gray-800" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Hello, {userProfile?.organization_name || 'User'}!</h1>
                    <p className="text-gray-600 mt-2">What would you like to do today?</p>
                </div>

                <div className="space-y-4">
                    <motion.button
                        onClick={handleNewEntry}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-3"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ClipboardList className="w-5 h-5" />
                        <span>Start a New Entry</span>
                    </motion.button>

                    <motion.button
                        onClick={handlePreviousEntry}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-3"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Eye className="w-5 h-5" />
                        <span>Review Previous Entry</span>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
