import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, getCurrentUserEmail, getUserProfile } from '../lib/supabase'
import { autoSaveFormData, loadAutoSavedData, clearAutoSavedData, saveFormDataImmediately } from '../lib/autoSave'
import {
    Send,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ClipboardList,
    Hash,
    Home,
    ArrowLeft // --- CHANGE: Import the ArrowLeft icon ---
} from 'lucide-react'
import silvergrey from '../assets/silvergrey.jpg'
import containerImage from '../assets/737373.jpg'

// Dropdown options for the new unit field
const poultryUnitOptions = ['Kg', 'Quintal', 'Tons']

// Interface for the new form's data structure
interface GeneralRow {
    poultry_quantity: string;
    poultry_unit: string;
    kfc_share: string;
    bird_count: string;
}

export default function GeneralForm() {
    const navigate = useNavigate()
    const [generalRows, setGeneralRows] = useState<GeneralRow[]>([
        { poultry_quantity: '', poultry_unit: '', kfc_share: '', bird_count: '' }
    ])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const [userProfile, setUserProfile] = useState<{ organization_name?: string | null, username?: string | null } | null>(null)
    const [isLoadingAutoSave, setIsLoadingAutoSave] = useState(true)

    const entryId = 'entry_1'

    React.useEffect(() => {
        const loadUserProfileAndAutoSave = async () => {
            const profile = await getUserProfile(); // Corrected with await
            setUserProfile(profile)
            try {
                const savedData = await loadAutoSavedData('general', entryId)
                if (savedData && Array.isArray(savedData)) {
                    setGeneralRows(savedData)
                }
            } catch (error) {
                console.error('Error loading auto-saved data:', error)
            } finally {
                setIsLoadingAutoSave(false)
            }
        }
        loadUserProfileAndAutoSave()
    }, [])

    React.useEffect(() => {
        // This function saves data immediately
        const saveOnExit = () => {
            const hasData = generalRows.some(row =>
                row.poultry_quantity || row.poultry_unit || row.kfc_share || row.bird_count
            );
            if (hasData) {
                saveFormDataImmediately('general', generalRows, entryId);
            }
        };

        // Add listener for closing the browser tab
        window.addEventListener('beforeunload', saveOnExit);

        // This cleanup function runs when you navigate away to another page
        return () => {
            window.removeEventListener('beforeunload', saveOnExit);
            // Save data when leaving the page via internal navigation
            saveOnExit();
        };
    }, [generalRows, entryId]);

    React.useEffect(() => {
        if (!isLoadingAutoSave) {
            const hasData = generalRows.some(row =>
                row.poultry_quantity || row.poultry_unit || row.kfc_share || row.bird_count
            )
            if (hasData) {
                autoSaveFormData('general', generalRows, entryId)
            }
        }
    }, [generalRows, isLoadingAutoSave])

    const updateGeneralRow = (index: number, field: keyof GeneralRow, value: string) => {
        setGeneralRows(prev => prev.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        ))
    }

    const isFirstRowComplete = generalRows[0].poultry_quantity && generalRows[0].poultry_unit && generalRows[0].kfc_share && generalRows[0].bird_count
    const canSubmit = isFirstRowComplete && !isSubmitting

    const handleAddEntry = () => {
        setGeneralRows([...generalRows, { poultry_quantity: '', poultry_unit: '', kfc_share: '', bird_count: '' }])
    }

    const handleRemoveEntry = (index: number) => {
        setGeneralRows(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting || !isFirstRowComplete) return

        setIsSubmitting(true)
        setSubmitStatus('idle')
        setErrorMessage('')

        try {
            const userEmail = await getCurrentUserEmail()
            if (!userEmail) throw new Error('User email not found. Please ensure you are logged in.')

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error('User not found or not logged in. Please ensure you are logged in.');
            }
            const validRows = generalRows.filter(row =>
                row.poultry_quantity && row.poultry_unit && row.kfc_share && row.bird_count
            )

            const dataToInsert = validRows.map(row => {
                const poultryQuantity = parseFloat(row.poultry_quantity) || 0;
                const kfcShare = parseFloat(row.kfc_share) || 0;
                const birdCount = parseInt(row.bird_count, 10) || 0;

                return {
                    name: 'General Data',
                    description: `Poultry: ${poultryQuantity} ${row.poultry_unit}, Share: ${kfcShare}%, Birds: ${birdCount}`,
                    category: 'general',
                    value: poultryQuantity,
                    user_id: user.id,
                    user_email: user.email,
                    organization_name: userProfile?.organization_name || null,
                    processed_poultry_quantity: poultryQuantity,
                    processed_poultry_unit: row.poultry_unit,
                    kfc_share: kfcShare,
                    bird_count: birdCount
                }
            })

            const { error } = await supabase.from('data_rows').insert(dataToInsert)
            if (error) throw error

            await clearAutoSavedData('general', entryId)
            setSubmitStatus('success')
            setGeneralRows([{ poultry_quantity: '', poultry_unit: '', kfc_share: '', bird_count: '' }])

        } catch (error) {
            console.error('Error submitting form:', error)
            setSubmitStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingAutoSave) {
        return (
            <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </motion.div>
        )
    }

    if (submitStatus === 'success') {
        return (
            <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
                <motion.div className="max-w-md w-full bg-white rounded-2xl border border-gray-300 p-8 shadow-xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-gray-800" />
                        </div>
                        <p className="text-gray-600 mb-6">General data has been submitted</p>
                        <div className="space-y-4">
                            <motion.button
                                onClick={() => navigate('/form')}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg"
                            >
                                Continue to Feed
                            </motion.button>
                            <motion.button
                                onClick={() => navigate('/')}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg"
                            >
                                <Home className="w-5 h-5" />
                                Exit to Home Page
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundImage: `url(${silvergrey})`, backgroundSize: 'cover' }}
        >
            <motion.div
                className="max-w-4xl w-full rounded-2xl border border-gray-300 p-10 shadow-xl"
                style={{ backgroundImage: `url(${containerImage})`, backgroundSize: 'cover' }}
            >
                {/* --- CHANGE START: The header is updated to include the back button --- */}
                <div className="flex items-center justify-between mb-8">
                    <motion.button
                        type="button"
                        onClick={() => navigate('/auth')}
                        className="bg-gray-700/50 hover:bg-gray-600/50 text-white p-2 rounded-lg transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Back to Login"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>

                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-2">
                            <ClipboardList className="w-8 h-8 text-white" />
                            <h1 className="text-3xl font-bold text-white">GENERAL</h1>
                        </div>
                    </div>

                    {/* Placeholder div to keep the title centered */}
                    <div className="w-10 h-10"></div>
                </div>
                {/* --- CHANGE END --- */}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-white mb-2">Processed Poultry Supplied</h3>
                            <p className="text-gray-200 text-sm">(from above considered time)</p>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-white mb-2">Count of birds</h3>
                            <p className="text-gray-200 text-sm">(raised for processing)</p>
                        </div>
                            <div className="text-center">
                            <h3 className="text-lg font-semibold text-white mb-2">KFC share of wallet</h3>
                            <p className="text-gray-200 text-sm">(in %)</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {generalRows.map((row, index) => (
                            <motion.div key={index} className="bg-white border border-gray-300 rounded-lg p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={row.poultry_quantity}
                                            onChange={(e) => updateGeneralRow(index, 'poultry_quantity', e.target.value)}
                                            className="w-2/3 pl-4 pr-2 py-3 bg-gray-50 border border-gray-300 rounded-lg"
                                            placeholder="Amount"
                                            required
                                        />
                                        <div className="relative w-1/3">
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                            <select
                                                value={row.poultry_unit}
                                                onChange={(e) => updateGeneralRow(index, 'poultry_unit', e.target.value)}
                                                className="w-full px-2 py-3 bg-gray-50 border border-gray-300 rounded-lg appearance-none"
                                                required
                                            >
                                                <option value="">Unit</option>
                                                {poultryUnitOptions.map(unit => (<option key={unit} value={unit}>{unit}</option>))}
                                            </select>
                                        </div>
                                    </div>

                                   <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="number"
                                            value={row.bird_count}
                                            onChange={(e) => updateGeneralRow(index, 'bird_count', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg"
                                            placeholder="Enter count"
                                            required
                                        />
                                    </div>

                                     <div className="relative">
                                        <input
                                            type="number"
                                            value={row.kfc_share}
                                            onChange={(e) => updateGeneralRow(index, 'kfc_share', e.target.value)}
                                            className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg"
                                            placeholder="Enter %"
                                            required
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.button
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full font-semibold py-4 px-6 rounded-lg transition-all transform flex items-center justify-center space-x-2 shadow-lg ${canSubmit
                            ? 'bg-gray-300 hover:bg-gray-300 text-gray-800 hover:scale-105 hover:shadow-xl'
                            : 'bg-gray-400 cursor-not-allowed text-gray-800'
                            }`}
                        whileHover={{ scale: canSubmit ? 1.05 : 1 }}
                        whileTap={{ scale: canSubmit ? 0.95 : 1 }}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                            </>
                        ) : !isFirstRowComplete ? (
                            <>
                                <AlertCircle className="w-5 h-5" />
                                <span>Complete the entry to submit</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                <span>Next</span>
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    )
}