import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, getCurrentUserEmail, getUserProfile } from '../lib/supabase'
import { autoSaveFormData, loadAutoSavedData, clearAutoSavedData, saveFormDataImmediately } from '../lib/autoSave'
import {
  Send,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Truck,
  Plus,
  Home // Added Home icon
} from 'lucide-react'

const vehicleTypeOptions = [
  'LGV ( < 3.5 tons ) - Diesel',
  'LGV ( < 3.5 tons ) - Petrol',
  'LGV ( < 3.5 tons ) - Electric',
  'HGV ( > 7.5 tons) - Diesel',
  'HGV ( > 7.5 tons) - Petrol',
  'HGV ( > 7.5 tons) - Electric',
  'Medium Truck (3.5-7.5 tons) - Diesel',
  'Medium Truck (3.5-7.5 tons) - Petrol',
  'Medium Truck (3.5-7.5 tons) - Electric',
  'Motorcycle - Petrol',
  'Motorcycle - Electric',
  'Van - Diesel',
  'Van - Petrol',
  'Van - Electric'
]

const routeOptions = [
  'Feed Mill',
  'Hatchery to Farm',
  'Farm to Processing',
  'Processing to Delivery'
]

interface TransportRow {
  route: string
  vehicleType: string
  distance: string
}

export default function Transport() {
  const navigate = useNavigate()
  const location = useLocation()
  const [transportRows, setTransportRows] = useState<TransportRow[]>([
    { route: 'Feed Mill', vehicleType: '', distance: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [userProfile, setUserProfile] = useState<{ organization_name?: string | null, username?: string | null } | null>(null)

  const [isLoadingAutoSave, setIsLoadingAutoSave] = useState(true)

  const entryId = 'entry_1' // For now, using default entry

  // Load user profile on component mount
  React.useEffect(() => {
    const loadUserProfile = async () => {
      const profile = getUserProfile()
      setUserProfile(profile)

      // Load auto-saved data
      try {
        const savedData = await loadAutoSavedData('transport', entryId)
        if (savedData && Array.isArray(savedData)) {
          setTransportRows(savedData)
        }
      } catch (error) {
        console.error('Error loading auto-saved data:', error)
      } finally {
        setIsLoadingAutoSave(false)
      }
    }
    loadUserProfile()
  }, [])

  // Save data when navigating away
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const hasData = transportRows.some(row => row.route || row.vehicleType || row.distance)
      if (hasData) {
        saveFormDataImmediately('transport', transportRows, entryId)
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
  }, [transportRows, entryId])

  // Auto-save functionality
  React.useEffect(() => {
    if (!isLoadingAutoSave && transportRows.length > 0) {
      // Only auto-save if there's meaningful data
      const hasData = transportRows.some(row => row.route || row.vehicleType || row.distance)
      if (hasData) {
        autoSaveFormData('transport', transportRows, entryId)
      }
    }
  }, [transportRows, isLoadingAutoSave])

  const updateTransportRow = (index: number, field: keyof TransportRow, value: string) => {
    setTransportRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ))
  }

  const handleAddEntry = () => {
    setTransportRows(prev => [
      ...prev,
      { route: '', vehicleType: '', distance: '' }
    ])
  }

  const handleRemoveEntry = (index: number) => {
    setTransportRows(prev => prev.filter((_, i) => i !== index))
  }

  const isFormValid = transportRows.every(row =>
    row.route && row.vehicleType && row.distance
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!isFormValid) {
      setErrorMessage('Please complete all transport fields.')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const userEmail = await getCurrentUserEmail()
      if (!userEmail) throw new Error('User email not found. Please ensure you are logged in.')

      const dataToInsert = transportRows.map(row => {
        const distance = parseFloat(row.distance.replace(/,/g, '')) || 0

        return {
          name: `${row.route} - ${row.vehicleType}`,
          description: `${row.distance} km`,
          category: 'transport',
          value: distance,
          status: 'active',
          tags: [row.route.toLowerCase().replace(/\s+/g, '_'), row.vehicleType.toLowerCase().replace(/\s+/g, '_'), 'transport'],
          priority: 'medium',
          user_email: userEmail,
          username: userProfile?.username || null,
          organization_name: userProfile?.organization_name || null
        }
      })

      const { error } = await supabase.from('data_rows').insert(dataToInsert)
      if (error) throw error

      // Clear auto-saved data after successful submission
      await clearAutoSavedData('transport', entryId)

      setSubmitStatus('success')

    } catch (error) {
      console.error('Error submitting transport data:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while loading auto-saved data
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

            <p className="text-gray-300 mb-6">Transport data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/review')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Review & Download Submission
              </motion.button>

              {/* --- UPDATED THIS BUTTON --- */}
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
        className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-10 shadow-2xl"
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
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Truck className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Transport</h1>
          </div>
          <p className="text-gray-300">Record your transportation data</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instructions */}
          <motion.div
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium mb-2">Instructions:</p>
                <ul className="text-blue-300/80 text-sm space-y-1">
                  <li>• Select the transport route, type of vehicle, and distance travelled</li>
                  <li>• Click "+ New Entry" to add more records</li>
                  <li>• Remove extra rows as needed</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Transport Table */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="overflow-x-auto pb-20">
              {transportRows.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {rowIndex > 0 && (
                    <div className="h-0.5 w-full my-2 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 opacity-70 rounded-lg transition-all duration-500" />
                  )}
                  <table className="w-full mb-2">
                    <tbody>
                      <tr className="border-b border-white/10">
                        <td className="px-6 py-4 text-white font-medium bg-white/5 w-1/3">
                          <div className="flex items-center space-x-2">
                            <span>Transport Route</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select
                              value={row.route}
                              onChange={(e) => updateTransportRow(rowIndex, 'route', e.target.value)}
                              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer"
                            >
                              <option value="" className="bg-gray-800 text-gray-300">Select route</option>
                              {routeOptions.map(option => (
                                <option key={option} value={option} className="bg-gray-800 text-white">
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        {rowIndex > 0 && (
                          <td rowSpan={3} className="px-6 py-4 align-top" style={{ verticalAlign: "top" }}>
                            <div className="flex flex-col items-end space-y-2">
                              <motion.button
                                type="button"
                                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 p-2 rounded-lg transition-all duration-300"
                                onClick={() => handleRemoveEntry(rowIndex)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Remove entry"
                              >
                                Remove
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="px-6 py-4 text-white font-medium bg-white/5">
                          <span>Vehicle Type</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select
                              value={row.vehicleType}
                              onChange={(e) => updateTransportRow(rowIndex, 'vehicleType', e.target.value)}
                              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer"
                            >
                              <option value="" className="bg-gray-800 text-gray-300">Select vehicle type</option>
                              {vehicleTypeOptions.map(option => (
                                <option key={option} value={option} className="bg-gray-800 text-white">
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-white font-medium bg-white/5">
                          <span>Distance</span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={row.distance}
                            onChange={(e) => updateTransportRow(rowIndex, 'distance', e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-right"
                            placeholder="Enter distance (in km)"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </React.Fragment>
              ))}
              {/* New Entry Button at bottom-right */}
              <div className="absolute bottom-6 left-6 z-10">
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
          </motion.div>

          {/* Summary */}
          {isFormValid && (
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
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform flex items-center justify-center space-x-2 shadow-lg ${isFormValid && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-xl'
              : 'bg-gray-600 cursor-not-allowed text-gray-300'
              }`}
            whileHover={{ scale: isFormValid && !isSubmitting ? 1.05 : 1 }}
            whileTap={{ scale: isFormValid && !isSubmitting ? 0.95 : 1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : !isFormValid ? (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Complete all fields to submit</span>
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