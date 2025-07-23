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
  Droplets,
  Recycle,
  Plus,
  Home,
  Trash2
} from 'lucide-react'

const etpOptions = [
  'Chemical',
  'Biological',
  'Physical',
  'Combined'
]

const waterTreatmentOptions = [
  'None - stagnant sewer',
  'Primary treatment',
  'Secondary treatment',
  'Tertiary treatment',
  'Advanced treatment'
]

interface WasteData {
  wasteWaterTreated: string
  oxygenDemand: string
  etp: string
  waterTreatmentType: string
}

export default function WasteManagement() {
  const navigate = useNavigate()
  const [wasteRows, setWasteRows] = useState<WasteData[]>([
    {
      wasteWaterTreated: '',
      oxygenDemand: '',
      etp: '',
      waterTreatmentType: ''
    }
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
        const savedData = await loadAutoSavedData('waste', entryId)
        if (savedData && Array.isArray(savedData) && savedData.length > 0) {
          setWasteRows(savedData)
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
      const hasData = wasteRows.some(row =>
        row.wasteWaterTreated || row.oxygenDemand || row.etp || row.waterTreatmentType
      )
      if (hasData) {
        saveFormDataImmediately('waste', wasteRows, entryId)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [wasteRows, entryId])

  React.useEffect(() => {
    if (!isLoadingAutoSave && wasteRows.length > 0) {
      const hasData = wasteRows.some(row =>
        row.wasteWaterTreated || row.oxygenDemand || row.etp || row.waterTreatmentType
      )
      if (hasData) {
        autoSaveFormData('waste', wasteRows, entryId)
      }
    }
  }, [wasteRows, isLoadingAutoSave])

  const updateWasteRow = (rowIndex: number, field: keyof WasteData, value: string) => {
    setWasteRows(prev => prev.map((row, i) =>
      i === rowIndex ? { ...row, [field]: value } : row
    ))
  }

  const handleAddEntry = () => {
    setWasteRows(prev => [
      ...prev,
      {
        wasteWaterTreated: '',
        oxygenDemand: '',
        etp: '',
        waterTreatmentType: ''
      }
    ])
  }

  const handleRemoveEntry = (rowIndex: number) => {
    setWasteRows(prev => prev.filter((_, i) => i !== rowIndex))
  }

  const isFormValid = wasteRows.every(row =>
    row.wasteWaterTreated && row.oxygenDemand && row.etp && row.waterTreatmentType
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!isFormValid) {
      setErrorMessage('Please complete all fields for each entry.')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const userEmail = await getCurrentUserEmail()
      if (!userEmail) throw new Error('User email not found. Please ensure you are logged in.')

      const dataToInsert = wasteRows.flatMap(row => ([
        {
          name: 'Waste Water Treated',
          description: `${row.wasteWaterTreated} litres`,
          category: 'waste_management',
          value: parseFloat(row.wasteWaterTreated.replace(/,/g, '')) || 0,
          status: 'active', tags: ['waste_water'], priority: 'medium', user_email: userEmail, organization_name: userProfile?.organization_name || null
        },
        {
          name: 'Oxygen Demand (BOD / COD)',
          description: `${row.oxygenDemand} mg / L`,
          category: 'waste_management',
          value: parseFloat(row.oxygenDemand) || 0,
          status: 'active', tags: ['oxygen_demand'], priority: 'medium', user_email: userEmail, organization_name: userProfile?.organization_name || null
        },
        {
          name: 'ETP',
          description: row.etp,
          category: 'waste_management',
          value: 0, status: 'active', tags: ['etp', row.etp.toLowerCase()], priority: 'medium', user_email: userEmail, organization_name: userProfile?.organization_name || null
        },
        {
          name: 'Water Treatment Type',
          description: row.waterTreatmentType,
          category: 'waste_management',
          value: 0, status: 'active', tags: ['water_treatment', row.waterTreatmentType.toLowerCase().replace(/\s+/g, '_')], priority: 'medium', user_email: userEmail, organization_name: userProfile?.organization_name || null
        }
      ]))

      const { error } = await supabase.from('data_rows').insert(dataToInsert)
      if (error) throw error

      await clearAutoSavedData('waste', entryId)
      setSubmitStatus('success')

    } catch (error) {
      console.error('Error submitting waste management data:', error)
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 mb-6">Waste management data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/transport')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Continue to Transport
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
    <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <motion.div
        className="max-w-4xl w-full bg-white rounded-2xl border border-gray-300 p-10 shadow-xl"
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
            <Recycle className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800">Waste Management</h1>
          </div>
          <p className="text-gray-600">Record your waste management information</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-gray-700 text-sm font-medium mb-2">Instructions:</p>
                <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
                  <li>Enter the amount of waste water treated in litres</li>
                  <li>Specify oxygen demand (BOD/COD) in mg/L</li>
                  <li>Select the type of ETP (Effluent Treatment Plant) used</li>
                  <li>Choose the water treatment method employed</li>
                  <li>Click "+ New Entry" to add more waste management records if needed</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {wasteRows.map((row, rowIndex) => (
              <motion.div
                key={rowIndex}
                className="bg-white border border-gray-300 rounded-lg p-4 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + rowIndex * 0.1 }}
              >
                {wasteRows.length > 1 && (
                  <motion.button
                    type="button"
                    onClick={() => handleRemoveEntry(rowIndex)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Remove entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Waste Water Treated (litres)</label>
                    <input
                      type="text"
                      value={row.wasteWaterTreated}
                      onChange={(e) => updateWasteRow(rowIndex, 'wasteWaterTreated', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                      placeholder="e.g., 100000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Oxygen Demand (mg / L)</label>
                    <input
                      type="number"
                      value={row.oxygenDemand}
                      onChange={(e) => updateWasteRow(rowIndex, 'oxygenDemand', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                      placeholder="e.g., 250"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">ETP</label>
                    <div className="relative">
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      <select
                        value={row.etp}
                        onChange={(e) => updateWasteRow(rowIndex, 'etp', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
                      >
                        <option value="" className="text-gray-500">Select ETP type</option>
                        {etpOptions.map(option => (<option key={option} value={option}>{option}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Water Treatment Type</label>
                    <div className="relative">
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      <select
                        value={row.waterTreatmentType}
                        onChange={(e) => updateWasteRow(rowIndex, 'waterTreatmentType', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
                      >
                        <option value="" className="text-gray-500">Select treatment type</option>
                        {waterTreatmentOptions.map(option => (<option key={option} value={option}>{option}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div>
            <motion.button type="button" className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold p-2 rounded-lg text-sm flex items-center space-x-1" onClick={handleAddEntry}>
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </motion.button>
          </div>

          {isFormValid && (
            <motion.div
              className="bg-green-100 border border-green-300 rounded-lg p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="text-green-800 font-medium">Ready to Submit</h4>
              </div>
              <p className="text-green-700 text-sm">
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

          <motion.button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-semibold py-4 px-6 rounded-lg transition-all transform flex items-center justify-center space-x-2 shadow-lg ${isFormValid && !isSubmitting
              ? 'bg-gray-300 hover:bg-gray-300 text-gray-800 hover:scale-105 hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed text-gray-600'
              }`}
            whileHover={{ scale: isFormValid && !isSubmitting ? 1.05 : 1 }}
            whileTap={{ scale: isFormValid && !isSubmitting ? 0.95 : 1 }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></div>
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