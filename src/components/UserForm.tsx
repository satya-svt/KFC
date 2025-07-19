import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, getCurrentUserEmail, getUserProfile } from '../lib/supabase'
import { autoSaveFormData, loadAutoSavedData, clearAutoSavedData, saveFormDataImmediately } from '../lib/autoSave'
import { calculateFeedEmission } from '../lib/emissionFactors'
import {
  Send,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Weight,
  Hash,
  Plus,
  Home
} from 'lucide-react'

const feedOptions = [
  'Corn(Maize)', 'Soyameal', 'Cotton', 'Field Bean(Broad Bean, Faba Bean)',
  'Field Pea', 'Fodder Legumes', 'Fodderbeet', 'Groundnut(Peanut)', 'Lentil',
  'Chickpea', 'Millet', 'Oats', 'Oilseed Rape', 'Pigeon pea/cowpea/mungbean',
  'Potato', 'Rice', 'Rye', 'Safflower', 'Sorghum', 'Soybean', 'Spring barley',
  'Sugarbeet', 'Sunflower', 'Sweet Potato',
  'Temperate Grassland: Grass/Legume Swards',
  'Temperate Grassland: Permanent Grass and Sown Grass or Leys',
  'Tropical Grasses', 'Wheat', 'Winter barley'
]

const unitOptions = ['gms', 'kg', 'Quintal', 'Tons']

interface FeedRow {
  feed_type: string
  quantity: string
  unit: string
}

export default function UserForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [feedRows, setFeedRows] = useState<FeedRow[]>([
    { feed_type: '', quantity: '', unit: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [userProfile, setUserProfile] = useState<{ organization_name?: string | null, username?: string | null } | null>(null)
  const [isLoadingAutoSave, setIsLoadingAutoSave] = useState(true)

  const entryId = 'entry_1'

  React.useEffect(() => {
    const loadUserProfileAndAutoSave = async () => {
      const profile = getUserProfile()
      setUserProfile(profile)
      try {
        const savedData = await loadAutoSavedData('feed', entryId)
        if (savedData && Array.isArray(savedData)) {
          setFeedRows(savedData)
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
    const handleBeforeUnload = () => {
      const hasData = feedRows.some(row =>
        (row.feed_type && row.feed_type.trim() !== '') ||
        (row.quantity && row.quantity.trim() !== '') ||
        (row.unit && row.unit.trim() !== '')
      )
      if (hasData) {
        saveFormDataImmediately('feed', feedRows, entryId)
      }
    }

    const unlisten = () => {
      handleBeforeUnload()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      unlisten()
    }
  }, [feedRows, entryId])

  React.useEffect(() => {
    if (!isLoadingAutoSave) {
      const hasData = feedRows.some(row =>
        (row.feed_type && row.feed_type.trim() !== '') ||
        (row.quantity && row.quantity.trim() !== '') ||
        (row.unit && row.unit.trim() !== '')
      )
      if (hasData) {
        autoSaveFormData('feed', feedRows, entryId)
      }
    }
  }, [feedRows, isLoadingAutoSave])

  const updateFeedRow = (index: number, field: keyof FeedRow, value: string) => {
    setFeedRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ))
  }

  const isFirstRowComplete = feedRows[0].feed_type && feedRows[0].quantity && feedRows[0].unit
  const canSubmit = isFirstRowComplete && !isSubmitting

  const handleAddEntry = () => {
    setFeedRows([...feedRows, { feed_type: '', quantity: '', unit: '' }])
  }

  const handleRemoveEntry = (index: number) => {
    setFeedRows(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!isFirstRowComplete) {
      setErrorMessage('Please complete the required feed entry (first row).')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const userEmail = await getCurrentUserEmail()
      if (!userEmail) throw new Error('User email not found. Please ensure you are logged in.')

      const validRows = feedRows.filter(row =>
        row.feed_type && row.quantity && row.unit
      )

      const dataToInsert = validRows.map(row => {
        const quantity = parseFloat(row.quantity.toString()) || 0
        const feedEmission = calculateFeedEmission(quantity, row.feed_type)
        return {
          name: row.feed_type,
          description: `${row.quantity} ${row.unit}`,
          category: 'feed',
          value: quantity,
          status: 'active',
          tags: [row.feed_type, row.unit],
          priority: 'medium',
          user_email: userEmail,
          username: userProfile?.username || null,
          organization_name: userProfile?.organization_name || null,
          feed_emission: feedEmission
        }
      })

      const { error } = await supabase.from('data_rows').insert(dataToInsert)
      if (error) throw error

      await clearAutoSavedData('feed', entryId)
      setSubmitStatus('success')
      setFeedRows([{ feed_type: '', quantity: '', unit: '' }])

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
      <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your saved data...</p>
        </motion.div>
      </motion.div>
    )
  }

  if (submitStatus === 'success') {
    return (
      <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <motion.div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-300 mb-6">Feed data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/manure')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue to Manure Management
              </motion.button>
              <motion.button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 bg-gray-800/50 hover:bg-gray-700/70 border border-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
    <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        className="max-w-full w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-10 shadow-2xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">FEED</h1>
          <p className="text-gray-300">Please enter feed information below</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">How to fill the form:</p>
                <ul className="text-blue-300/80 text-sm space-y-1">
                  <li>• <strong>First row is required</strong> - fill feed type, quantity, and unit</li>
                  <li>• Click "New Entry" to add more feed entries as needed</li>
                  <li>• Remove any extra rows you don't need</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* --- 1. UPDATED Column Headers Order --- */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Feed Type</h3>
              <p className="text-gray-400 text-sm">Select type of feed given to poultry</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Unit</h3>
              <p className="text-gray-400 text-sm">Select weight unit</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Quantity</h3>
              <p className="text-gray-400 text-sm">Enter quantity (numbers only)</p>
            </div>
          </motion.div>

          <div className="space-y-6">
            {feedRows.map((row, index) => (
              <motion.div
                key={index}
                className={`bg-white/5 border rounded-lg p-4 transition-all duration-300 ${index === 0
                  ? (isFirstRowComplete ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5')
                  : (row.feed_type && row.quantity && row.unit ? 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10' : 'border-white/10 hover:bg-white/10')
                  }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (index * 0.05) }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-medium">Feed Entry {index + 1}</h4>
                    {index === 0 ? (
                      isFirstRowComplete && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )
                    ) : (
                      (row.feed_type && row.quantity && row.unit) && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )
                    )}
                  </div>
                  {index === 0 ? (
                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full border border-red-500/30">
                      Required
                    </span>
                  ) : (
                    (feedRows.length > 1) && (
                      <motion.button
                        type="button"
                        onClick={() => handleRemoveEntry(index)}
                        className="text-red-400 hover:text-red-300 text-xs bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/20 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Remove
                      </motion.button>
                    )
                  )}
                </div>
                {/* --- 2. UPDATED Input Rows Order --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Feed Type Select */}
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={row.feed_type}
                      onChange={(e) => updateFeedRow(index, 'feed_type', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer hover:bg-white/10 ${row.feed_type ? 'border-green-500/30' : 'border-white/20'}`}
                      required={index === 0}
                    >
                      <option value="" className="bg-gray-800 text-gray-300">{index === 0 ? "Select feed type" : "Select feed type (optional)"}</option>
                      {feedOptions.map(option => (<option key={option} value={option} className="bg-gray-800 text-white hover:bg-blue-600">{option}</option>))}
                    </select>
                  </div>

                  {/* Unit Select */}
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={row.unit}
                      onChange={(e) => updateFeedRow(index, 'unit', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer ${row.unit ? 'border-green-500/30' : 'border-white/20'}`}
                      required={index === 0}
                    >
                      <option value="" className="bg-gray-800 text-gray-300">{index === 0 ? "Select unit" : "Select unit (optional)"}</option>
                      {unitOptions.map(unit => (<option key={unit} value={unit} className="bg-gray-800 text-white hover:bg-blue-600">{unit}</option>))}
                    </select>
                  </div>

                  {/* Quantity Input */}
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateFeedRow(index, 'quantity', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${row.quantity ? 'border-green-500/30' : 'border-white/20'}`}
                      placeholder={index === 0 ? "0000" : "Enter quantity (optional)"}
                      min="0"
                      step="any"
                      required={index === 0}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="flex justify-left">
              <motion.button
                type="button"
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 p-2 rounded-lg transition-all duration-300"
                onClick={handleAddEntry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + New Entry
              </motion.button>
            </div>
          </div>

          {feedRows.filter(row => row.feed_type && row.quantity && row.unit).length > 0 && (
            <motion.div
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="text-green-200 font-medium">Ready to Submit</h4>
              </div>
              <p className="text-green-300/80 text-sm">
                All required fields are filled.
              </p>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={!canSubmit}
            className={`w-full font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform flex items-center justify-center space-x-2 shadow-lg ${canSubmit
              ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-xl'
              : 'bg-gray-600 cursor-not-allowed text-gray-300'
              }`}
            whileHover={{ scale: canSubmit ? 1.05 : 1 }}
            whileTap={{ scale: canSubmit ? 0.95 : 1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : !isFirstRowComplete ? (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Complete the required entry to submit</span>
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
