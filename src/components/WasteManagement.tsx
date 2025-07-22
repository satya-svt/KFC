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
  Zap,
  Plus,
  Trash2,
  Home
} from 'lucide-react'

const energyTypeOptions = [
  'Electricity (grid)',
  'Natural Gas',
  'Diesel',
  'Solar',
  'Wind',
  'Biomass',
  'Coal',
  'LPG',
  'Fuel Oil',
  'Other'
]

const unitOptions = ['kWh', 'MWh', 'GWh', 'BTU', 'therms', 'gallons', 'liters', 'kg', 'tons']

interface EnergyRow {
  facility: string
  energyType: string
  unit: string
  consumption: string
}

const facilityTypes = ['Farm', 'Processing Plant', 'Hatchery Plant']

export default function EnergyProcessing() {
  const navigate = useNavigate()
  const location = useLocation()
  const [energyRows, setEnergyRows] = useState<EnergyRow[]>([
    { facility: 'Farm', energyType: '', unit: '', consumption: '' },
    { facility: 'Processing Plant', energyType: '', unit: '', consumption: '' },
    { facility: 'Hatchery Plant', energyType: '', unit: '', consumption: '' }
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
        const savedData = await loadAutoSavedData('energy', entryId)
        if (savedData && Array.isArray(savedData)) {
          setEnergyRows(savedData)
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
      const hasData = energyRows.some(row => row.energyType || row.unit || row.consumption)
      if (hasData) {
        saveFormDataImmediately('energy', energyRows, entryId)
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
  }, [energyRows, entryId])

  React.useEffect(() => {
    if (!isLoadingAutoSave && energyRows.length > 0) {
      const hasData = energyRows.some(row => row.energyType || row.unit || row.consumption)
      if (hasData) {
        autoSaveFormData('energy', energyRows, entryId)
      }
    }
  }, [energyRows, isLoadingAutoSave])

  const updateEnergyRow = (index: number, field: keyof EnergyRow, value: string) => {
    setEnergyRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ))
  }

  const handleAddEntry = (facility: string) => {
    setEnergyRows(prev => [
      ...prev,
      { facility, energyType: '', unit: '', consumption: '' }
    ])
  }

  const handleRemoveEntry = (index: number) => {
    setEnergyRows(prev => prev.filter((_, i) => i !== index))
  }

  const hasValidRowForFacility = (facility: string) =>
    energyRows.some(row =>
      row.facility === facility &&
      row.energyType && row.unit && row.consumption
    )

  const isFormValid =
    hasValidRowForFacility('Hatchery Plant') &&
    hasValidRowForFacility('Processing Plant') &&
    hasValidRowForFacility('Farm')

  const validRows = energyRows.filter(row =>
    row.energyType && row.unit && row.consumption
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    let missingFacilities: string[] = []
    if (!hasValidRowForFacility('Hatchery Plant')) missingFacilities.push('Hatchery Plant')
    if (!hasValidRowForFacility('Processing Plant')) missingFacilities.push('Processing Plant')
    if (!hasValidRowForFacility('Farm')) missingFacilities.push('Farm')

    if (missingFacilities.length > 0) {
      setErrorMessage(
        `Please complete at least one energy entry for: ${missingFacilities.join(', ')}.`
      )
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const userEmail = await getCurrentUserEmail()
      if (!userEmail) throw new Error('User email not found. Please ensure you are logged in.')

      const dataToInsert = validRows.map(row => {
        const consumption = parseFloat(row.consumption.replace(/,/g, '')) || 0

        return {
          name: `${row.facility} - ${row.energyType}`,
          description: `${row.consumption} ${row.unit}`,
          category: 'energy_processing',
          value: consumption,
          status: 'active',
          tags: [row.facility.toLowerCase().replace(/\s+/g, '_'), row.energyType.toLowerCase().replace(/\s+/g, '_'), row.unit],
          priority: 'medium',
          user_email: userEmail,
          organization_name: userProfile?.organization_name || null
        }
      })

      const { error } = await supabase.from('data_rows').insert(dataToInsert)
      if (error) throw error

      await clearAutoSavedData('energy', entryId)

      setSubmitStatus('success')

    } catch (error) {
      console.error('Error submitting energy processing data:', error)
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
            <p className="text-gray-600 mb-6">Energy & processing data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/waste')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Continue to Waste Management
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

  const farmRows = energyRows.map((r, i) => ({ ...r, index: i })).filter(row => row.facility === 'Farm')
  const processingRows = energyRows.map((r, i) => ({ ...r, index: i })).filter(row => row.facility === 'Processing Plant')
  const hatcheryRows = energyRows.map((r, i) => ({ ...r, index: i })).filter(row => row.facility === 'Hatchery Plant')

  const sectionBgClasses = [
    { row: "bg-gray-50 hover:bg-gray-100", text: "text-gray-800", block: "bg-gray-100 text-gray-700 border-r border-gray-200" },
    { row: "bg-white hover:bg-gray-50", text: "text-gray-800", block: "bg-gray-100 text-gray-700 border-r border-gray-200" },
    { row: "bg-gray-50 hover:bg-gray-100", text: "text-gray-800", block: "bg-gray-100 text-gray-700 border-r border-gray-200" }
  ]

  return (
    <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <motion.div
        className="max-w-6xl w-full bg-white rounded-2xl border border-gray-300 p-10 shadow-xl"
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
            <Zap className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800">Energy & Processing</h1>
          </div>
          <p className="text-gray-600">Record your energy consumption data</p>
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
                  <li>Select the type of energy from the dropdown for each facility.</li>
                  <li>Choose the appropriate unit (kWh, MWh, etc.).</li>
                  <li>Enter the consumption amount for each energy type.</li>
                  <li>Click "+ New Entry" to add more rows for a facility if needed.</li>
                  <li>Remove extra rows as needed.</li>
                  <li className="text-gray-800 font-semibold mt-1">All three facilities are mandatory.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white border border-gray-300 rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-gray-600 font-medium w-1/6">Facility</th>
                    <th className="px-6 py-4 text-center text-gray-600 font-medium w-2/6">Select Type of Energy</th>
                    <th className="px-6 py-4 text-center text-gray-600 font-medium w-1/6">Select unit</th>
                    <th className="px-6 py-4 text-center text-gray-600 font-medium w-2/6">Input Amount of Consumption</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {hatcheryRows.map((row, rindex) => {
                    const sectionClass = sectionBgClasses[2].row;
                    const blockClass = sectionBgClasses[2].block;
                    return (
                      <tr key={`hatchery-${row.index}`} className={sectionClass}>
                        {rindex === 0 && (
                          <td rowSpan={hatcheryRows.length} className={`px-6 py-4 font-medium text-center align-middle ${blockClass}`}>
                            Hatchery Plant
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select value={row.energyType} onChange={(e) => updateEnergyRow(row.index, 'energyType', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer">
                              <option value="" className="text-gray-500">Select energy type</option>
                              {energyTypeOptions.map(option => (<option key={option} value={option} className="text-gray-800">{option}</option>))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select value={row.unit} onChange={(e) => updateEnergyRow(row.index, 'unit', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer">
                              <option value="" className="text-gray-500">Select unit</option>
                              {unitOptions.map(unit => (<option key={unit} value={unit} className="text-gray-800">{unit}</option>))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={row.consumption} onChange={(e) => updateEnergyRow(row.index, 'consumption', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-right" placeholder="Enter amount" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {hatcheryRows.length > 1 && (
                            <motion.button type="button" onClick={() => handleRemoveEntry(row.index)} className="text-red-500 hover:text-red-700 p-1 rounded" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Remove row">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={5} className="px-6 py-2">
                      <div className="flex justify-left">
                        <motion.button type="button" className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold p-2 rounded-lg text-sm" onClick={() => handleAddEntry('Hatchery Plant')}>+ New Entry</motion.button>
                      </div>
                    </td>
                  </tr>

                  {farmRows.map((row, rindex) => {
                    const sectionClass = sectionBgClasses[0].row;
                    const blockClass = sectionBgClasses[0].block;
                    return (
                      <tr key={`farm-${row.index}`} className={sectionClass}>
                        {rindex === 0 && (<td rowSpan={farmRows.length} className={`px-6 py-4 font-medium text-center align-middle ${blockClass}`}>Farm</td>)}
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select value={row.energyType} onChange={(e) => updateEnergyRow(row.index, 'energyType', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer">
                              <option value="" className="text-gray-500">Select energy type</option>
                              {energyTypeOptions.map(option => (<option key={option} value={option} className="text-gray-800">{option}</option>))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select value={row.unit} onChange={(e) => updateEnergyRow(row.index, 'unit', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer">
                              <option value="" className="text-gray-500">Select unit</option>
                              {unitOptions.map(unit => (<option key={unit} value={unit} className="text-gray-800">{unit}</option>))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={row.consumption} onChange={(e) => updateEnergyRow(row.index, 'consumption', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-right" placeholder="Enter amount" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {farmRows.length > 1 && (
                            <motion.button type="button" onClick={() => handleRemoveEntry(row.index)} className="text-red-500 hover:text-red-700 p-1 rounded" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Remove row">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={5} className="px-6 py-2">
                      <div className="flex justify-left">
                        <motion.button type="button" className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold p-2 rounded-lg text-sm" onClick={() => handleAddEntry('Farm')}>+ New Entry</motion.button>
                      </div>
                    </td>
                  </tr>

                  {processingRows.map((row, rindex) => {
                    const sectionClass = sectionBgClasses[1].row;
                    const blockClass = sectionBgClasses[1].block;
                    return (
                      <tr key={`processing-${row.index}`} className={sectionClass}>
                        {rindex === 0 && (<td rowSpan={processingRows.length} className={`px-6 py-4 font-medium text-center align-middle ${blockClass}`}>Processing Plant</td>)}
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select value={row.energyType} onChange={(e) => updateEnergyRow(row.index, 'energyType', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer">
                              <option value="" className="text-gray-500">Select energy type</option>
                              {energyTypeOptions.map(option => (<option key={option} value={option} className="text-gray-800">{option}</option>))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select value={row.unit} onChange={(e) => updateEnergyRow(row.index, 'unit', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer">
                              <option value="" className="text-gray-500">Select unit</option>
                              {unitOptions.map(unit => (<option key={unit} value={unit} className="text-gray-800">{unit}</option>))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={row.consumption} onChange={(e) => updateEnergyRow(row.index, 'consumption', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-right" placeholder="Enter amount" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {processingRows.length > 1 && (
                            <motion.button type="button" onClick={() => handleRemoveEntry(row.index)} className="text-red-500 hover:text-red-700 p-1 rounded" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Remove row">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={5} className="px-6 py-2">
                      <div className="flex justify-left">
                        <motion.button type="button" className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold p-2 rounded-lg text-sm" onClick={() => handleAddEntry('Processing Plant')}>+ New Entry</motion.button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

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
                All required facility entries configured and ready for submission.
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
            // --- THEME CHANGE: Submit button ---
            className={`w-full font-semibold py-4 px-6 rounded-lg transition-all transform flex items-center justify-center space-x-2 shadow-lg ${isFormValid && !isSubmitting ? 'bg-gray-200 hover:bg-gray-200 text-gray-800 hover:scale-105 hover:shadow-xl' : 'bg-gray-400 cursor-not-allowed text-gray-800'}`}
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
                <span>Complete all required facility entries to submit</span>
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