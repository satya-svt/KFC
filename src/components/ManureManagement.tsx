import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, getCurrentUserEmail, getUserProfile } from '../lib/supabase'
import { 
  Send, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  Calendar, 
  ArrowLeft,
  LogOut,
  Recycle
} from 'lucide-react'

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
  const [manureSystems, setManureSystems] = useState<ManureSystemRow[]>([
    { systemType: '', daysUsed: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [userProfile, setUserProfile] = useState<{organization_name?: string | null, username?: string | null} | null>(null)

  React.useEffect(() => {
    const loadUserProfile = () => {
      const profile = getUserProfile()
      setUserProfile(profile)
    }
    loadUserProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const updateManureSystemRow = (index: number, field: keyof ManureSystemRow, value: string) => {
    setManureSystems(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ))
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
      setErrorMessage('Please complete the manure system data.')
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
        username: userProfile?.username || null,
        organization_name: userProfile?.organization_name || null
      }))

      const { error } = await supabase.from('data_rows').insert(dataToInsert)
      if (error) throw error

      setSubmitStatus('success')
      setManureSystems([{ systemType: '', daysUsed: '' }])
      setTimeout(() => setSubmitStatus('idle'), 5000)
    } catch (error) {
      console.error('Error submitting manure management data:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <motion.div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => navigate('/form')}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Back to Feed Form"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </motion.button>
            <div className="w-10"></div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-gray-300 mb-6">Your manure management data has been successfully submitted.</p>
            <div className="space-y-4">
              <motion.button
                onClick={() => navigate('/energy')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Continue to Energy & Processing
              </motion.button>
              <motion.button
                onClick={() => setSubmitStatus('idle')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Submit Another Entry
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
        <div className="flex items-center justify-between mb-8">
          <motion.button
            onClick={() => navigate('/form')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </motion.button>

          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Recycle className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold text-white">Manure Management</h1>
            </div>
            <p className="text-gray-300">Record your manure management system</p>
          </div>

          <motion.button
            onClick={handleLogout}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 p-2 rounded-lg transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div 
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6"
          >
            <p className="text-blue-200 text-sm font-medium mb-2">Instructions:</p>
            <ul className="text-blue-300/80 text-sm space-y-1">
              <li>• Select the type of manure management system from the dropdown</li>
              <li>• Specify the number of days it is utilized per year (1–365 days)</li>
            </ul>
          </motion.div>

          <motion.div 
            className={`bg-white/5 border rounded-lg p-4 ${
              totalDaysUsed > 365 
                ? 'border-red-500/30 bg-red-500/5' 
                : totalDaysUsed > 0
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">Total Days Used:</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${
                  totalDaysUsed > 365 ? 'text-red-400' : 
                  totalDaysUsed > 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {totalDaysUsed}
                </span>
                <span className="text-gray-400">/ 365 days</span>
              </div>
            </div>
            {totalDaysUsed > 365 && (
              <p className="text-red-400 text-sm mt-2">
                Total usage days cannot exceed 365 days per year
              </p>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={manureSystems[0].systemType}
                onChange={(e) => updateManureSystemRow(0, 'systemType', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer hover:bg-white/10"
              >
                <option value="" className="bg-gray-800 text-gray-300">Select MM system type</option>
                {manureSystemOptions.map(option => (
                  <option key={option} value={option} className="bg-gray-800 text-white hover:bg-blue-600">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={manureSystems[0].daysUsed}
                onChange={(e) => updateManureSystemRow(0, 'daysUsed', e.target.value)}
                className="w-full pl-10 pr-16 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter days"
                min="1"
                max="365"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">days</span>
            </div>
          </div>

          {submitStatus === 'error' && (
            <motion.div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform flex items-center justify-center space-x-2 shadow-lg ${
              isFormValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-xl'
                : 'bg-gray-600 cursor-not-allowed text-gray-300'
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
                  {validSystems.length === 0 
                    ? 'Complete the form to submit' 
                    : 'Total days cannot exceed 365'}
                </span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Manure Management Data</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}