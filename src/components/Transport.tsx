import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, getCurrentUserEmail, getUserProfile } from '../lib/supabase'
import { autoSaveFormData, loadAutoSavedData, clearAutoSavedData, saveFormDataImmediately } from '../lib/autoSave'
// --- CHANGE START: Import the new calculation logic and factors ---
import { calculateTransportEmission, TRANSPORT_EMISSION_FACTORS } from '../lib/emissionFactors'
// --- CHANGE END ---
import {
  Send,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Truck,
  Plus,
  Home,
  Trash2
} from 'lucide-react'
import containerImage from '../assets/737373.jpg'
import silvergrey from '../assets/silvergrey.jpg'

// --- CHANGE START: Generate vehicle options from the factors object for consistency ---
const vehicleTypeOptions = Object.keys(TRANSPORT_EMISSION_FACTORS);
// --- CHANGE END ---

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
  const [transportRows, setTransportRows] = useState<TransportRow[]>([
    { route: '', vehicleType: '', distance: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [userProfile, setUserProfile] = useState<{ organization_name?: string | null, username?: string | null } | null>(null)
  const [isLoadingAutoSave, setIsLoadingAutoSave] = useState(true)

  const entryId = 'entry_1'

  React.useEffect(() => {
    const loadUserProfile = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile)

      try {
        const savedData = await loadAutoSavedData('transport', entryId)
        if (savedData && Array.isArray(savedData) && savedData.length > 0) {
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

  React.useEffect(() => {
    const saveOnExit = () => {
      const hasData = transportRows.some(row => row.route || row.vehicleType || row.distance)
      if (hasData) {
        saveFormDataImmediately('transport', transportRows, entryId)
      }
    }
    window.addEventListener('beforeunload', saveOnExit)
    return () => {
      window.removeEventListener('beforeunload', saveOnExit);
      saveOnExit();
    }
  }, [transportRows, entryId])

  React.useEffect(() => {
    if (!isLoadingAutoSave) {
      const hasData = transportRows.some(row => row.route || row.vehicleType || row.distance)
      if (hasData) {
        autoSaveFormData('transport', transportRows, entryId)
      }
    }
  }, [transportRows, isLoadingAutoSave])

  const updateTransportRow = (index: number, field: keyof TransportRow, value: string) => {
    let processedValue = value;
    if (field === 'distance') {
      processedValue = value.replace(/\D/g, '');
    }
    setTransportRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: processedValue } : row
    ));
  };

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

  // --- CHANGE START: Updated handleSubmit to calculate and save the emission value ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || !isFormValid) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found. Please ensure you are logged in.');

      const dataToInsert = transportRows.map(row => {
        const distance = parseFloat(row.distance.replace(/,/g, '')) || 0;

        // Call the new calculation function
        const transportEmission = calculateTransportEmission(distance, row.vehicleType);

        return {
          name: `${row.route} - ${row.vehicleType}`,
          description: `${row.distance} km`,
          category: 'transport',
          value: distance,
          user_id: user.id,
          user_email: user.email,
          organization_name: userProfile?.organization_name || null,
          transport_emission: transportEmission // Add the new emission field
        };
      });

      const { error } = await supabase.from('data_rows').insert(dataToInsert);
      if (error) throw error;

      await clearAutoSavedData('transport', entryId);
      setSubmitStatus('success');
      setTransportRows([{ route: '', vehicleType: '', distance: '' }]);

    } catch (error) {
      console.error('Error submitting transport data:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- CHANGE END ---

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
            <p className="text-gray-600 mb-6">Transport data has been submitted</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/review')}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg"
              >
                Review Submission
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
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Truck className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Transport</h1>
          </div>
          <p className="text-gray-200">Record your transportation data</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            className="bg-white border border-gray-300 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-gray-700 text-sm font-medium mb-2">Instructions:</p>
                <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
                  <li>Select the transport route, type of vehicle, and distance travelled</li>
                  <li>Click "+ New Entry" to add more records</li>
                  <li>Remove extra rows as needed</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white border border-gray-300 rounded-lg overflow-hidden relative"
          >
            <div className="overflow-x-auto pb-20">
              {transportRows.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {rowIndex > 0 && (
                    <div className="h-px w-full my-2 bg-gray-200" />
                  )}
                  <table className="w-full mb-2">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 text-gray-800 font-medium bg-gray-50 w-1/3">
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
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
                            >
                              <option value="" className="text-gray-500">Select route</option>
                              {routeOptions.map(option => (
                                <option key={option} value={option} className="text-gray-800">{option}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        {rowIndex > 0 && (
                          <td rowSpan={3} className="px-6 py-4 align-top" style={{ verticalAlign: "top" }}>
                            <div className="flex flex-col items-end space-y-2">
                              <motion.button
                                type="button"
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg text-sm"
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
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 text-gray-800 font-medium bg-gray-50">
                          <span>Vehicle Type</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select
                              value={row.vehicleType}
                              onChange={(e) => updateTransportRow(rowIndex, 'vehicleType', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none cursor-pointer"
                            >
                              <option value="" className="text-gray-500">Select vehicle type</option>
                              {vehicleTypeOptions.map(option => (
                                <option key={option} value={option} className="text-gray-800">{option}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-gray-800 font-medium bg-gray-50">
                          <span>Distance</span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={row.distance}
                            onChange={(e) => updateTransportRow(rowIndex, 'distance', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-right"
                            placeholder="Enter distance (in km)"
                          />
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
              className="bg-white border border-gray-300 rounded-lg p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-800" />
                <h4 className="text-green-800 font-medium">Ready to Submit</h4>
              </div>
              <p className="text-gray-700 text-sm">
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
  );
}