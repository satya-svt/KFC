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
  Calendar,
  Recycle,
  Home
} from 'lucide-react'
import containerImage from '../assets/737373.jpg';
import silvergrey from '../assets/silvergrey.jpg'

const manureSystemOptions = [
  'Aerobic treatment - forced aeration',
  'Aerobic treatment - natural aeration',
  'Anaerobic digester',
  'Anaerobic lagoon',
  'Composting - in vessel',
  'Composting - static pile',
  'Composting - windrow',
  'Daily spread',
  'Deep bedding',
  'Dry lot',
  'Liquid/slurry',
  'Pasture/range/paddock',
  'Pit storage below animal confinement',
  'Pit storage not below animal confinement',
  'Solid storage',
  'Other'
]

interface ManureSystemRow {
  systemType: string
  daysUsed: string
}

export default function ManureManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const [manureSystems, setManureSystems] = useState<ManureSystemRow[]>([
    { systemType: '', daysUsed: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [userProfile, setUserProfile] = useState<{ organization_name?: string | null, username?: string | null } | null>(null)
  const [isLoadingAutoSave, setIsLoadingAutoSave] = useState(true)
  const entryId = 'entry_1'

  React.useEffect(() => {
    const loadUserProfile = async () => {
      const profile = getUserProfile()
      setUserProfile(profile)
      try {
        const savedData = await loadAutoSavedData('manure', entryId)
        if (savedData && Array.isArray(savedData) && savedData.length > 0) {
          setManureSystems(savedData)
        }
      } catch (error) {
        console.error('Error loading auto-saved data:', error)
      } finally {
        setIsLoadingAutoSave(false)
      }
    }
    loadUserProfile()
  }, [])

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const hasData = manureSystems.some(system => system.systemType || system.daysUsed)
      if (hasData) {
        saveFormDataImmediately('manure', manureSystems, entryId)
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
  }, [manureSystems, entryId])

  React.useEffect(() => {
    if (!isLoadingAutoSave && manureSystems.length > 0) {
      const hasData = manureSystems.some(system => system.systemType || system.daysUsed)
      if (hasData) {
        autoSaveFormData('manure', manureSystems, entryId)
      }
    }
  }, [manureSystems, isLoadingAutoSave])

  const updateManureSystemRow = (index: number, field: keyof ManureSystemRow, value: string) => {
    setManureSystems(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ))
  }

  const handleAddEntry = () => {
    setManureSystems([...manureSystems, { systemType: '', daysUsed: '' }])
  }

  const handleRemoveEntry = (index: number) => {
    setManureSystems(prev => prev.filter((_, i) => i !== index))
  }

  const totalDaysUsed = manureSystems.reduce((total, system) => {
    const days = parseInt(system.daysUsed) || 0
    return total + days
  }, 0)

  const validSystems = manureSystems.filter(system =>
    system.systemType && system.daysUsed && parseInt(system.daysUsed) > 0
  )

  const isFormValid = validSystems.length > 0 && totalDaysUsed <= 365

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (validSystems.length === 0) {
      setErrorMessage('Please complete at least one manure system entry.')
      setSubmitStatus('error')
      return
    }

    if (totalDaysUsed > 365) {
      setErrorMessage('Total usage days cannot exceed 365 days per year.')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const userEmail = await getCurrentUserEmail()
      if (!userEmail) throw new Error('User email not found. Please ensure you are logged in.')

      const dataToInsert = validSystems.map(system => ({
        name: system.systemType,
        description: `${system.daysUsed} days per year`,
        category: 'manure_management',
        value: parseInt(system.daysUsed),
        status: 'active',
        tags: [system.systemType, 'manure_management'],
        priority: 'medium',
        user_email: userEmail,
        organization_name: userProfile?.organization_name || null
      }))

      const { error } = await supabase.from('data_rows').insert(dataToInsert)
      if (error) throw error

      await clearAutoSavedData('manure', entryId)
      setSubmitStatus('success')
      setManureSystems([{ systemType: '', daysUsed: '' }])

    } catch (error) {
      console.error('Error submitting manure management data:', error)
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
            <p className="text-gray-600 mb-6">Manure management data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/energy')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Continue to Energy & Processing
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
    <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${silvergrey})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      <motion.div
        className="max-w-4xl w-full bg-white rounded-2xl border border-gray-300 p-10 shadow-xl"
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
              <Recycle className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-white">Manure Management</h1>
            </div>
            <p className="text-gray-200">Record your manure management system(s)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm font-medium mb-2">Instructions:</p>
            <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
              <li>Select the type of manure management system from the dropdown.</li>
              <li>Specify the number of days it is utilized per year (1–365 days).</li>
              <li>You can add multiple systems, but the total days used cannot exceed 365.</li>
            </ul>
          </motion.div>

          <motion.div
            className={`bg-white border rounded-lg p-4 ${totalDaysUsed > 365 ? 'border-red-400 bg-red-50' : totalDaysUsed > 0 ? 'border-gray-400 bg-gray-50' : 'border-gray-300'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-gray-800 font-medium">Total Days Used:</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${totalDaysUsed > 365 ? 'text-red-600' : totalDaysUsed > 0 ? 'text-gray-600' : 'text-gray-500'}`}>
                  {totalDaysUsed}
                </span>
                <span className="text-gray-500">/ 365 days</span>
              </div>
            </div>
            {totalDaysUsed > 365 && (<p className="text-red-600 text-sm mt-2">Total usage days cannot exceed 365 days per year.</p>)}
          </motion.div>

          <div className="space-y-4">
            {manureSystems.map((row, index) => (
              <motion.div
                key={index}
                className="bg-white border border-gray-300 rounded-lg p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-gray-800 font-medium">Manure Entry {index + 1}</h4>
                    {row.systemType && row.daysUsed && (
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  {index > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => handleRemoveEntry(index)}
                      className="text-red-600 hover:text-red-800 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded border border-red-300 transition-all"
                    >
                      Remove
                    </motion.button>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={row.systemType}
                      onChange={(e) => updateManureSystemRow(index, 'systemType', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all appearance-none cursor-pointer hover:bg-gray-100"
                    >
                      <option value="" className="text-gray-500">Select MM system type</option>
                      {manureSystemOptions.map(option => (
                        <option key={option} value={option} className="text-gray-800">{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      value={row.daysUsed}
                      onChange={(e) => updateManureSystemRow(index, 'daysUsed', e.target.value)}
                      className="w-full pl-10 pr-16 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800"
                      placeholder="Enter days"
                      min="1"
                      max="365"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">days</span>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-left">
              <motion.button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold p-2 rounded-lg transition-all"
                onClick={handleAddEntry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + New Entry
              </motion.button>
            </div>
          </div>


          {submitStatus === 'error' && (
            <motion.div className="flex items-center space-x-2 text-red-800 bg-red-100 border border-red-300 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </motion.div>
          )}

          {/* --- THIS IS THE FIX --- */}
          {/* The className has been updated to match the UserForm.tsx button */}
          <motion.button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-semibold py-4 px-6 rounded-lg transition-all transform flex items-center justify-center space-x-2 shadow-lg ${isFormValid && !isSubmitting
              ? 'bg-gray-200 hover:bg-gray-200 text-gray-800 hover:scale-105 hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed text-gray-800'
              }`}
            whileHover={{ scale: isFormValid && !isSubmitting ? 1.05 : 1 }}
            whileTap={{ scale: isFormValid && !isSubmitting ? 0.95 : 1 }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : !isFormValid ? (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>
                  {validSystems.length === 0 ? 'Complete the form to submit' : 'Total days cannot exceed 365'}
                </span>
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