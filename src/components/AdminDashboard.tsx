import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, ResponseData } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, Download, Eye, EyeOff, LogOut, Calculator, BarChart3, ArrowLeft, Home, Lock
} from 'lucide-react'

const COLORS = ['#6B7280', '#4B5563', '#9CA3AF', '#D1D5DB', '#374151', '#1F2937', '#F3F4F6']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loading, setLoading] = useState(true)
  const [showRawData, setShowRawData] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('all')

  // Calculate feed statistics
  const calculateFeedStats = () => {
    if (responses.length === 0) return {
      totalEmissions: 0,
      averageEmissions: 0
    }

    const totalEmissions = responses.reduce((sum, response) => {
      const emission = parseFloat(response.feed_emission?.toString() || '0') || 0
      return sum + emission
    }, 0)

    const averageEmissions = totalEmissions / responses.length

    return {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      averageEmissions: Math.round(averageEmissions * 100) / 100
    }
  }

  // Get unique users for filtering
  const uniqueUsers = Array.from(new Set(responses.map(r => r.user_email).filter(Boolean)))
  const filteredResponses = selectedUser === 'all'
    ? responses
    : responses.filter(r => r.user_email === selectedUser)

  const feedStats = calculateFeedStats()

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin123') {
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('Invalid password')
    }
  }

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('data_rows')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error('Error fetching responses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses()
    }
  }, [isAuthenticated])

  const exportData = () => {
    const csvContent = [
      ['Name', 'Description', 'Category', 'Feed Emission', 'Username', 'Organization', 'User Email', 'Date'],
      ...filteredResponses.map(r => [
        r.name,
        r.description || '',
        r.category,
        r.feed_emission || 0,
        r.username || '',
        r.organization_name || '',
        r.user_email || 'Anonymous',
        new Date(r.created_at || '').toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data_export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalResponses = filteredResponses.length
  const responsesByCategory = filteredResponses.reduce((acc, response) => {
    const key = response.name || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(responsesByCategory).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / totalResponses) * 100)
  }))

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <motion.form
          onSubmit={handleAuth}
          className="bg-white/10 p-8 rounded-xl backdrop-blur-lg border border-white/20 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              type="button"
              onClick={() => navigate('/auth')}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </motion.button>
          </motion.div>

          <motion.div
            className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gray-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Lock className="w-8 h-8 text-gray-300" />
          </motion.div>

          <motion.h1
            className="text-white text-2xl font-bold mb-4 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Admin Access
          </motion.h1>

          <motion.p
            className="text-gray-300 text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Enter the admin password to access the dashboard
          </motion.p>

          <motion.input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 mb-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
            required
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          />
          {authError && (
            <motion.p
              className="text-red-400 text-sm mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {authError}
            </motion.p>
          )}
          <motion.button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Access Dashboard
          </motion.button>
        </motion.form>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => navigate('/auth')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </motion.button>
          <span className="text-white">Admin</span>
        </div>
        <div className="flex gap-4">
          <motion.button
            onClick={exportData}
            className="bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </motion.button>
          <motion.button
            onClick={() => setIsAuthenticated(false)}
            className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm text-gray-300">Total Records</p>
          <p className="text-3xl font-bold">{totalResponses}</p>
          <p className="text-xs text-gray-400 mt-1">
            {selectedUser === 'all' ? 'All users' : `User: ${selectedUser}`}
          </p>
        </motion.div>
        <motion.div
          className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm text-gray-300">Unique Feed Types</p>
          <p className="text-3xl font-bold">{Object.keys(responsesByCategory).length}</p>
        </motion.div>
        <motion.div
          className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm text-gray-300">Most Common Feed</p>
          <p className="text-3xl font-bold">
            {Object.entries(responsesByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </p>
        </motion.div>
      </motion.div>

      {/* User Filter */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
          <h3 className="text-lg font-semibold mb-4">Filter by User</h3>
          <div className="flex flex-wrap gap-2">
            <motion.button
              onClick={() => setSelectedUser('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedUser === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              All Users ({responses.length})
            </motion.button>
            {uniqueUsers.map(email => (
              <motion.button
                key={email}
                onClick={() => setSelectedUser(email)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedUser === email
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {email} ({responses.filter(r => r.user_email === email).length})
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Feed Stats Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold">Feed Statistics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 p-6 rounded-lg border border-orange-500/20 backdrop-blur-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-orange-300 font-medium">Total Emissions</p>
            </div>
            <p className="text-3xl font-bold text-white">{feedStats.totalEmissions.toLocaleString()}</p>
            <p className="text-sm text-orange-200 mt-1">Total emissions across all feeds</p>
          </motion.div>
          <motion.div
            className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 p-6 rounded-lg border border-purple-500/20 backdrop-blur-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-purple-300 font-medium">Average Emissions</p>
            </div>
            <p className="text-3xl font-bold text-white">{feedStats.averageEmissions.toLocaleString()}</p>
            <p className="text-sm text-purple-200 mt-1">Average emissions per entry</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4">Data Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Bar dataKey="value" fill="#6B7280" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4">Data Share (Pie)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* Raw Data */}
      <motion.div
        className="mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Raw Data</h2>
          <motion.button
            onClick={() => setShowRawData(!showRawData)}
            className="bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showRawData ? 'Hide' : 'Show'}
          </motion.button>
        </div>

        {showRawData && (
          <motion.div
            className="overflow-x-auto border border-white/10 rounded-lg backdrop-blur-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <table className="min-w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Query</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Emission Value</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((r, i) => (
                  <tr key={i} className="border-b border-white/10">
                    <td className="px-6 py-4 text-white">{r.name}</td>
                    <td className="px-6 py-4">{r.description}</td>
                    <td className="px-6 py-4">{r.category}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-900/20 text-orange-400 border border-orange-500/20">
                        {r.feed_emission?.toFixed(4) || '0.0000'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.username ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-900/20 text-purple-400 border border-purple-500/20">
                          {r.username}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {r.organization_name ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-900/20 text-blue-400 border border-blue-500/20">
                          {r.organization_name}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        r.user_email
                          ? 'bg-green-900/20 text-green-400 border border-green-500/20'
                          : 'bg-gray-900/20 text-gray-400 border border-gray-500/20'
                      }`}>
                        {r.user_email || 'Anonymous'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(r.created_at || '').toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}