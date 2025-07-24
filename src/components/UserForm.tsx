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
import silvergrey from '../assets/silvergrey.jpg'
import containerImage from '../assets/737373.jpg'

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
  const isFormValid = feedRows.every(row =>
    row.feed_type && row.quantity && row.unit
  )
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
          user_email: userEmail,
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
      <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center"
        style={{
          backgroundImage: `url(${silvergrey})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
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
            <p className="text-gray-600 mb-6">Feed data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/manure')}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg"
              >
                Continue to Manure Management
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
      style={{
        backgroundImage: `url(${silvergrey})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <motion.div
        className="max-w-4xl w-full rounded-2xl border border-gray-300 p-10 shadow-xl"
        style={{
          backgroundImage: `url(${containerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Weight className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">FEED</h1>
            </div>
            <p className="text-white">Please enter feed information below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm font-medium mb-2">How to fill the form:</p>
            <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
              <li><strong>First row is required</strong> - fill feed type, quantity, and unit</li>
              <li>Click "New Entry" to add more feed entries as needed</li>
              <li>Remove any extra rows you don't need</li>
            </ul>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Feed Type</h3>
              <p className="text-gray-200 text-sm">Select type of feed given to poultry</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Unit</h3>
              <p className="text-gray-200 text-sm">Select weight unit</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Quantity</h3>
              <p className="text-gray-200 text-sm">Enter quantity (numbers only)</p>
            </div>
          </motion.div>

          <div className="space-y-4">
            {feedRows.map((row, index) => (
              <motion.div
                key={index}
                className={`bg-white border border-gray-300 rounded-lg p-4 ${index === 0 && !isFirstRowComplete ? 'border-gray-400 bg-red-50' :
                  (row.feed_type && row.quantity && row.unit ? 'border-gray-400 bg-gray-50' : 'border-gray-300')
                  }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-gray-800 font-medium">Feed Entry {index + 1}</h4>
                    {row.feed_type && row.quantity && row.unit && (
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  {index === 0 ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-300">Required</span>
                  ) : (
                    (feedRows.length > 1) && (
                      <motion.button
                        type="button"
                        onClick={() => handleRemoveEntry(index)}
                        className="text-red-600 hover:text-red-800 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded border border-red-300 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Remove
                      </motion.button>
                    )
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={row.feed_type}
                      onChange={(e) => updateFeedRow(index, 'feed_type', e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-50 border ${row.feed_type ? 'border-gray-400' : 'border-gray-300'
                        } rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all appearance-none cursor-pointer hover:bg-gray-100`}
                      required={index === 0}
                    >
                      <option value="" className="text-gray-500">{index === 0 ? "Select feed type" : "Select feed type (optional)"}</option>
                      {feedOptions.map(option => (
                        <option key={option} value={option} className="text-gray-800">{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={row.unit}
                      onChange={(e) => updateFeedRow(index, 'unit', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${row.unit ? 'border-gray-400' : 'border-gray-300'
                        } rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all appearance-none cursor-pointer hover:bg-gray-100`}
                      required={index === 0}
                    >
                      <option value="" className="text-gray-500">{index === 0 ? "Select unit" : "Select unit (optional)"}</option>
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit} className="text-gray-800">{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateFeedRow(index, 'quantity', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${row.quantity ? 'border-gray-400' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all hover:bg-gray-100`}
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
                className="bg-white hover:bg-gray-200 text-gray-800 font-semibold p-2 rounded-lg transition-all"
                onClick={handleAddEntry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + New Entry
              </motion.button>
            </div>
          </div>


          {isFormValid && (
            <motion.div
              className="bg-white border border-gray-300 rounded-lg p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-800" />
                <h4 className="text-green-800 font-medium">Ready to Submit</h4>
              </div>
              <p className="text-gray-800 text-sm">
                All required fields are filled.
              </p>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div className="flex items-center space-x-2 text-red-800 bg-red-100 border border-red-300 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div className="flex items-center space-x-2 text-red-800 bg-red-100 border border-red-300 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </motion.div>
          )}

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