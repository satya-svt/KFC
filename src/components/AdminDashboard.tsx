import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, ResponseData } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  Download, Eye, EyeOff, LogOut, Calculator, BarChart3, ArrowLeft, Lock, ChevronDown, Flame, Droplets, Zap, Search // --- CHANGE: Import the Search icon ---
} from 'lucide-react'
import * as XLSX from 'xlsx'

const COLORS = ['#6B7280', '#4B5563', '#9CA3AF', '#D1D5DB', '#374151', '#1F2937', '#F3F4F6']

type DashboardMode = 'Feed' | 'Manure' | 'Energy' | 'Waste';

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loading, setLoading] = useState(true)
  const [showRawData, setShowRawData] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('Feed')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- CHANGE START: Add state for the organization search term ---
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  // --- CHANGE END ---

  const modeConfig: Record<DashboardMode, {
    icon: React.ElementType;
    emissionKey: keyof ResponseData;
    categoryNames: string[];
    theme: {
      icon: string;
      statCard: string;
      statText: string;
      statSubText: string;
      badge: string;
    }
  }> = {
    'Feed': {
      icon: Flame,
      emissionKey: 'feed_emission',
      categoryNames: ['feed'],
      theme: {
        icon: 'text-orange-400',
        statCard: 'bg-gradient-to-r from-orange-600/20 to-orange-800/20 border border-orange-500/20',
        statText: 'text-orange-300',
        statSubText: 'text-orange-200',
        badge: 'px-2 py-1 rounded-full text-xs bg-orange-900/20 text-orange-400 border border-orange-500/20'
      }
    },
    'Manure': {
      icon: Droplets,
      emissionKey: 'manure_emission',
      categoryNames: ['manure'],
      theme: {
        icon: 'text-green-400',
        statCard: 'bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/20',
        statText: 'text-green-300',
        statSubText: 'text-green-200',
        badge: 'px-2 py-1 rounded-full text-xs bg-green-900/20 text-green-400 border border-green-500/20'
      }
    },
    'Energy': {
      icon: Zap,
      emissionKey: 'energy_emission',
      categoryNames: ['energy_processing'],
      theme: {
        icon: 'text-yellow-400',
        statCard: 'bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border border-yellow-500/20',
        statText: 'text-yellow-300',
        statSubText: 'text-yellow-200',
        badge: 'px-2 py-1 rounded-full text-xs bg-yellow-900/20 text-yellow-400 border border-yellow-500/20'
      }
    },
    'Waste': {
      icon: Droplets,
      emissionKey: 'waste_emission',
      categoryNames: ['waste'],
      theme: {
        icon: 'text-cyan-400',
        statCard: 'bg-gradient-to-r from-cyan-600/20 to-cyan-800/20 border border-cyan-500/20',
        statText: 'text-cyan-300',
        statSubText: 'text-cyan-200',
        badge: 'px-2 py-1 rounded-full text-xs bg-cyan-900/20 text-cyan-400 border border-cyan-500/20'
      }
    }
  };
  const CurrentIcon = modeConfig[dashboardMode].icon;
  const currentTheme = modeConfig[dashboardMode].theme;

  // --- CHANGE START: Filter the list of unique organizations based on the search term ---
  const uniqueOrgs = useMemo(() => {
    const orgNames = responses
      .map(r => r.organization_name)
      .filter((name): name is string => !!name);

    const uniqueNames = Array.from(new Set(orgNames));

    if (!orgSearchTerm) {
      return uniqueNames;
    }

    return uniqueNames.filter(org =>
      org.toLowerCase().includes(orgSearchTerm.toLowerCase())
    );
  }, [responses, orgSearchTerm]);
  // --- CHANGE END ---

  const orgFilteredResponses = useMemo(() => {
    return selectedOrg === 'all'
      ? responses
      : responses.filter(r => r.organization_name === selectedOrg);
  }, [responses, selectedOrg]);

  const modeFilteredResponses = useMemo(() => {
    const currentCategories = modeConfig[dashboardMode].categoryNames;
    return orgFilteredResponses.filter(r => currentCategories.includes(r.category || ''));
  }, [orgFilteredResponses, dashboardMode, modeConfig]);

  const calculateStats = () => {
    if (modeFilteredResponses.length === 0) {
      return { totalEmissions: 0, averageEmissions: 0 };
    }
    const emissionKey = modeConfig[dashboardMode].emissionKey;
    const totalEmissions = modeFilteredResponses.reduce((sum, response) => {
      const emissionValue = response[emissionKey] as (string | number | null | undefined);
      const emission = parseFloat(String(emissionValue) || '0');
      return sum + (isNaN(emission) ? 0 : emission);
    }, 0);

    const averageEmissions = totalEmissions > 0 ? totalEmissions / modeFilteredResponses.length : 0;
    return {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      averageEmissions: Math.round(averageEmissions * 100) / 100
    };
  };
  const currentStats = calculateStats();

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
    setLoading(true);
    try {
      const { data: dataRows, error: dataRowsError } = await supabase
        .from('data_rows')
        .select('*')
        .order('created_at', { ascending: false });

      if (dataRowsError) throw dataRowsError;

      if (!dataRows || dataRows.length === 0) {
        setResponses([]);
        return;
      }

      const userIds = Array.from(new Set(dataRows.map(row => row.user_id).filter(Boolean))) as string[];

      let profilesMap: Map<string, string> = new Map();
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, organization_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else if (profiles) {
          profiles.forEach(profile => {
            if (profile.id && profile.organization_name) {
              profilesMap.set(profile.id, profile.organization_name);
            }
          });
        }
      }

      const enrichedResponses = dataRows.map(row => {
        const profileOrgName = profilesMap.get(row.user_id || '');
        const finalOrgName = profileOrgName || row.organization_name || null;

        return {
          ...row,
          organization_name: finalOrgName
        } as ResponseData;
      });

      setResponses(enrichedResponses);

    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses()
    }
  }, [isAuthenticated])

  const exportData = () => {
    const dataToExport = orgFilteredResponses.map(r => ({
      Name: r.name,
      Description: r.description || '',
      Category: r.category,
      'Feed Emission': r.feed_emission || 0,
      'Manure Emission': r.manure_emission || 0,
      'Energy Emission': r.energy_emission || 0,
      'Waste Emission': r.waste_emission || 0,
      Username: r.user_email || '',
      Organization: r.organization_name || '',
      Date: r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export");
    XLSX.writeFile(workbook, `${dashboardMode}_data_export.xlsx`);
  }

  const summaryStats = useMemo(() => {
    const totalRecords = modeFilteredResponses.length;
    const responsesByCategory = modeFilteredResponses.reduce((acc, response) => {
      const key = response.name || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);


    const mostCommonType = Object.entries(responsesByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalRecords, mostCommonType, responsesByCategory };
  }, [modeFilteredResponses]);

  const chartData = useMemo(() => {
    return Object.entries(summaryStats.responsesByCategory).map(([name, value]) => ({
      name,
      value,
      percentage: summaryStats.totalRecords > 0 ? Math.round((value / summaryStats.totalRecords) * 100) : 0
    }));
  }, [summaryStats]);

  const orgCounts = useMemo(() => {
    return responses.reduce((acc, response) => {
      if (response.organization_name) {
        acc[response.organization_name] = (acc[response.organization_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [responses]);

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
          <h1 className="text-white text-2xl font-bold mb-4 text-center">Admin Access</h1>
          <p className="text-gray-300 text-center mb-6">Enter the admin password to access the dashboard</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 mb-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
            required
          />
          {authError && <p className="text-red-400 text-sm mb-2">{authError}</p>}
          <motion.button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
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
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
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
    >
      <motion.div className="flex justify-between items-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} >
        <div className="flex items-center space-x-4">
          <motion.button onClick={() => navigate('/')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all" title="Back to Home" >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <span className="text-white">Admin</span>
        </div>
        <div className="flex gap-4">
          <motion.button onClick={exportData} className="bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-all" >
            <Download className="w-4 h-4" /> Export Excel
          </motion.button>
          <motion.button onClick={() => setIsAuthenticated(false)} className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all" >
            <LogOut className="w-4 h-4" /> Logout
          </motion.button>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" >
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
          <p className="text-sm text-gray-300">Total {dashboardMode} Records</p>
          <p className="text-3xl font-bold">{summaryStats.totalRecords}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
          <p className="text-sm text-gray-300">Most Common {dashboardMode} Type</p>
          <p className="text-3xl font-bold">{summaryStats.mostCommonType}</p>
        </div>
      </motion.div>

      <motion.div className="mb-8" >
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Filter by Organization</h3>
          </div>

          {/* --- CHANGE START: Add the search input field --- */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={orgSearchTerm}
              onChange={(e) => setOrgSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* --- CHANGE END --- */}

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedOrg('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedOrg === 'all' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}> All Organizations ({responses.length}) </button>
            {uniqueOrgs.map(org => (
              <button
                key={org}
                onClick={() => setSelectedOrg(org)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedOrg === org ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
              >
                {org} ({orgCounts[org] || 0})
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div className="mb-8" >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Statistics</h2>
          </div>
          <div className="relative">
            <motion.button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 border border-white/20" >
              <CurrentIcon className={`w-5 h-5 ${currentTheme.icon}`} />
              <span className="font-medium">{dashboardMode}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>
            {isDropdownOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/20 rounded-lg shadow-lg z-10" >
                {(Object.keys(modeConfig) as DashboardMode[]).map(mode => {
                  const modeData = modeConfig[mode];
                  return (
                    <button key={mode} onClick={() => { setDashboardMode(mode); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" >
                      <modeData.icon className={`w-5 h-5 ${modeData.theme.icon}`} />
                      {mode}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div className={`p-6 rounded-lg backdrop-blur-lg ${currentTheme.statCard}`} >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className={`w-5 h-5 ${currentTheme.icon}`} />
              <p className={`text-sm font-medium ${currentTheme.statText}`}>Total Emissions</p>
            </div>
            <p className="text-3xl font-bold text-white">{currentStats.totalEmissions.toLocaleString()}</p>
            <p className={`text-sm mt-1 ${currentTheme.statSubText}`}>Total emissions from {dashboardMode} category</p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" >
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg" >
          <h3 className="text-xl font-semibold mb-4">Data Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} labelStyle={{ color: '#D1D5DB' }} />
              <Bar dataKey="value" fill="#6B7280" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg" >
          <h3 className="text-xl font-semibold mb-4">Data Share (Pie)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percentage }) => `${name}: ${percentage}%`} >
                {chartData.map((_, i) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div className="mt-10" >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Raw {dashboardMode} Data</h2>
          <button onClick={() => setShowRawData(!showRawData)} className="bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 transition-all" >
            {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showRawData ? 'Hide' : 'Show'}
          </button>
        </div>

        {showRawData && (
          <motion.div className="overflow-x-auto border border-white/10 rounded-lg backdrop-blur-lg" >
            <table className="min-w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Query</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3">Emission Value (in tons)</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {modeFilteredResponses.map((r) => {
                  const emissionKey = modeConfig[dashboardMode].emissionKey;
                  const emissionValue = r[emissionKey] as (string | number | null | undefined);

                  const value = r.value ?? 'N/A';
                  let unit = '';
                  if (r.description) {
                    const match = r.description.match(/^[\d\.]+\s*(.*)$/);
                    unit = match && match[1] ? match[1] : '';
                  }

                  return (
                    <tr key={r.id} className="border-b border-white/10">
                      <td className="px-6 py-4 text-white font-medium">{r.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-300">{String(value)}</td>
                      <td className="px-6 py-4 text-gray-300">{unit || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={currentTheme.badge}>
                          {emissionValue !== undefined && emissionValue !== null ? parseFloat(String(emissionValue)).toFixed(4) : '0.0000'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{r.organization_name ? (<span className="px-2 py-1 rounded-full text-xs bg-blue-900/20 text-blue-400 border border-blue-500/20"> {r.organization_name} </span>) : (<span className="text-gray-500">-</span>)}</td>
                      <td className="px-6 py-4 text-gray-300">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {modeFilteredResponses.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No {dashboardMode.toLowerCase()} data available for the selected filter.</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
