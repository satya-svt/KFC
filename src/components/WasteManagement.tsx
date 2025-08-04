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
  Droplets,
  Recycle,
  Plus,
  Home
} from 'lucide-react'
import silvergrey from '../assets/silvergrey.jpg'
import containerImage from '../assets/737373.jpg'
import { calculateWasteWaterEmission, WASTE_WATER_EMISSION_FACTORS } from '../lib/emissionFactors';

const etpOptions = [
  'Chemical',
  'Biochemical',
]

const waterTreatmentOptions = Object.keys(WASTE_WATER_EMISSION_FACTORS);

interface WasteData {
  wasteWaterTreated: string
  oxygenDemand: string
  etp: string
  waterTreatmentType: string
}

export default function WasteManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const [wasteRows, setWasteRows] = useState<WasteData[]>([
    {
      wasteWaterTreated: '1,00,00,000',
      oxygenDemand: '250',
      etp: 'Chemical',
      waterTreatmentType: 'None - stagnant sewer'
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
        if (savedData && Array.isArray(savedData)) {
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

    const unlisten = () => {
      handleBeforeUnload()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      unlisten()
    }
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
        etp: etpOptions[0],
        waterTreatmentType: waterTreatmentOptions[0]
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
    e.preventDefault();
    if (isSubmitting || !isFormValid) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) throw new Error('User email not found.');

      const userProfile = getUserProfile();

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { // Check for both error and null user
        throw new Error('User not found or not logged in. Please ensure you are logged in.');
      }

      // Map each form entry to a SINGLE row in the database
      const dataToInsert = wasteRows.map(row => {
        const wasteWaterTreated = parseFloat(row.wasteWaterTreated.replace(/,/g, '')) || 0;
        const oxygenDemand = parseFloat(row.oxygenDemand) || 0;

        // Call the new calculation function
        const wasteEmission = calculateWasteWaterEmission(
          oxygenDemand,
          wasteWaterTreated,
          row.waterTreatmentType,
          row.etp
        );

        return {
          name: row.waterTreatmentType,
          description: `ETP: ${row.etp}, Water Treated: ${row.wasteWaterTreated} L, Oxygen Demand: ${row.oxygenDemand} mg/L`,
          category: 'waste',
          value: wasteWaterTreated,
          user_id: user.id,
          user_email: user.email,
          organization_name: userProfile?.organization_name || null,
          // New columns for specific data
          waste_water_treated: wasteWaterTreated,
          oxygen_demand: oxygenDemand,
          etp_type: row.etp,
          water_treatment_type: row.waterTreatmentType,
          waste_emission: wasteEmission, // The calculated emission value
        };
      });

      const { error } = await supabase.from('data_rows').insert(dataToInsert);
      if (error) throw error;

      await clearAutoSavedData('waste', entryId);
      setSubmitStatus('success');

    } catch (error) {
      console.error('Error submitting waste management data:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="text-gray-600 mb-6">Waste management data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/transport')}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg"
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
              <Recycle className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl font-bold text-white">Waste Management</h1>
            </div>
            <p className="text-gray-200">Record your waste management information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm font-medium mb-2">Instructions:</p>
            <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
              <li>Enter the amount of waste water treated in litres</li>
              <li>Specify oxygen demand (BOD/COD) in mg/L</li>
              <li>Select the type of ETP (Effluent Treatment Plant) used</li>
              <li>Choose the water treatment method employed</li>
              <li>Click "+ New Entry" to add more waste management records if needed</li>
            </ul>
          </motion.div>

          <motion.div
            className="bg-white border border-gray-300 rounded-lg overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="overflow-x-auto pb-20">
              {wasteRows.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {rowIndex > 0 && (
                    <div className="h-1 w-full my-2 bg-gray-300 rounded-lg" />
                  )}
                  <table className="w-full mb-2">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="px-6 py-4 text-gray-800 font-medium bg-gray-100 w-1/3">
                          <div className="flex items-center space-x-2">
                            <Droplets className="w-5 h-5 text-gray-600" />
                            <span>Waste Water Treated</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={row.wasteWaterTreated}
                            onChange={(e) => updateWasteRow(rowIndex, 'wasteWaterTreated', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all text-right"
                            placeholder="Enter amount"
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          litres
                        </td>
                        {rowIndex > 0 && (
                          <td rowSpan={4} className="px-6 py-4 align-top">
                            <div className="flex flex-col items-end space-y-2">
                              <motion.button
                                type="button"
                                className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800 p-2 rounded-lg transition-all border border-red-300"
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
                      <tr className="border-b border-gray-300">
                        <td className="px-6 py-4 text-gray-800 font-medium bg-gray-100">
                          <span>Oxygen Demand (BOD / COD)</span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={row.oxygenDemand}
                            onChange={(e) => updateWasteRow(rowIndex, 'oxygenDemand', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all text-right"
                            placeholder="Enter value"
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          mg / L
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="px-6 py-4 text-gray-800 font-medium bg-gray-100">
                          <span>ETP</span>
                        </td>
                        <td className="px-6 py-4" colSpan={2}>
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select
                              value={row.etp}
                              onChange={(e) => updateWasteRow(rowIndex, 'etp', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all appearance-none cursor-pointer"
                            >
                              {etpOptions.map(option => (
                                <option key={option} value={option} className="text-gray-800">
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-gray-800 font-medium bg-gray-100">
                          <span>Water Treatment type</span>
                        </td>
                        <td className="px-6 py-4" colSpan={2}>
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select
                              value={row.waterTreatmentType}
                              onChange={(e) => updateWasteRow(rowIndex, 'waterTreatmentType', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all appearance-none cursor-pointer"
                            >
                              {waterTreatmentOptions.map(option => (
                                <option key={option} value={option} className="text-gray-800">
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </React.Fragment>
              ))}
              <div className="absolute bottom-6 left-6 z-10">
                <motion.button
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold p-2 rounded-lg transition-all"
                  onClick={handleAddEntry}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + New Entry
                </motion.button>
              </div>
            </div>
          </motion.div>

          {isFormValid && (
            <motion.div
              className="bg-white border border-gray-200 rounded-lg p-4"
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

          <motion.button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-semibold py-4 px-6 rounded-lg transition-all transform flex items-center justify-center space-x-2 shadow-lg ${isFormValid && !isSubmitting
              ? 'bg-gray-200 hover:bg-gray-200 text-gray-800 hover:scale-105 hover:shadow-xl'
              : 'bg-gray-200 cursor-not-allowed text-gray-800'
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