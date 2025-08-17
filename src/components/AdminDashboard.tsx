import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, ResponseData } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  Download, Eye, EyeOff, LogOut, Calculator, BarChart3, ArrowLeft, Lock, ChevronDown, Flame, Droplets, Zap, Search, PlusCircle, Users, Trash2, Truck
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useLocation } from 'react-router-dom';

const COLORS = ['#6B7280', '#4B5563', '#9CA3AF', '#D1D5DB', '#374151', '#1F2937', '#F3F4F6']

// Multicolor palette for pie segments (distinct hues)
const PIE_COLORS = [
  '#60A5FA', // blue
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EF4444', // red
  '#A78BFA', // violet
  '#06B6D4', // cyan
  '#F43F5E', // rose
  '#22C55E', // green
  '#EAB308', // yellow
  '#8B5CF6', // purple
  '#14B8A6', // teal
  '#F97316', // orange
];


type DashboardMode = 'Feed' | 'Manure' | 'Energy' | 'Waste' | 'Transport' | 'Overall';

type LocationState = {
  fromAdmin?: boolean;
  fromCompare?: boolean;
};

// MODIFIED: Legend is now a regular block component for flex layout
const PieLegend: React.FC<{
  data: { name: string; value: number; percentage: number }[];
}> = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    // The scrollable container is now the top-level element.
    // Its height is limited to fit neatly next to the chart.
    <div
      className="flex flex-col gap-2 text-xs w-full"
      style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '10px' }}
    >
      {data.map((d, i) => (
        <div key={`${d.name}-${i}`} className="flex items-start gap-2">
          <span
            className="inline-block w-3 h-3 rounded-sm flex-shrink-0 mt-0.5"
            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
          />
          <span className="text-gray-200">{d.name}</span>
        </div>
      ))}
    </div>
  );
};

// Place this new component inside AdminDashboard.tsx, before the main component
const CustomBarTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
        <p className="text-sm font-bold text-white">{`${label}`}</p>
        <p className="text-xs text-blue-300">{`Emission: ${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};


export default function AdminDashboard() {
  const navigate = useNavigate()
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loading, setLoading] = useState(true)
  const [showRawData, setShowRawData] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('Overall')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, org: string } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const location = useLocation();
  const fromAdmin = (location.state as LocationState | null)?.fromAdmin;


  const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY // ⚠️ Service role key, only for testing
  );

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
    },
    'Transport': {
      icon: Truck,
      emissionKey: 'transport_emission',
      categoryNames: ['transport'],
      theme: {
        icon: 'text-purple-400',
        statCard: 'bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/20',
        statText: 'text-purple-300',
        statSubText: 'text-purple-200',
        badge: 'px-2 py-1 rounded-full text-xs bg-purple-900/20 text-purple-400 border border-purple-500/20'
      }
    },
    'Overall': {
      icon: BarChart3,
      emissionKey: 'feed_emission', // This will be overridden in the data processing
      categoryNames: ['general', 'feed', 'manure', 'energy_processing', 'waste', 'transport'],
      theme: {
        icon: 'text-blue-400',
        statCard: 'bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/20',
        statText: 'text-blue-300',
        statSubText: 'text-blue-200',
        badge: 'px-2 py-1 rounded-full text-xs bg-blue-900/20 text-blue-400 border border-blue-500/20'
      }
    }
  };
  const CurrentIcon = modeConfig[dashboardMode].icon;
  const currentTheme = modeConfig[dashboardMode].theme;

  const fetchOrganizations = async () => {
    const { data, error } = await supabase.from('organizations').select('name').order('name');
    if (error) {
      console.error("Error fetching organizations:", error);
    } else if (data) {
      setOrganizations(data.map(o => o.name));
    }
  };

  const filteredOrganizations = useMemo(() => {
    if (!orgSearchTerm) return organizations;
    return organizations.filter(org => org.toLowerCase().includes(orgSearchTerm.toLowerCase()));
  }, [organizations, orgSearchTerm]);

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const { error } = await supabase.from('organizations').insert({ name: newOrgName.trim() });
    if (error) {
      alert(`Error adding organization: ${error.message}`);
    } else {
      setNewOrgName('');
      setIsAddModalOpen(false);
      fetchOrganizations();
    }
  };

  const handleDeleteOrganization = async (orgName: string) => { 
    if (window.confirm(`Are you sure you want to delete "${orgName}"? This will delete all data associated with this organization. This action cannot be undone.`)) {
      setContextMenu(null);
  
      try {
        // 🔹 NEW: Get all user IDs in this organization
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_name', orgName);
  
        if (usersError) throw usersError;
  
        // 🔹 NEW: Delete each user from Supabase Auth using service role key
        for (const user of users || []) {
          const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (delError) {
            console.error(`Error deleting user ${user.id}:`, delError.message);
          }
        }
  
        // 🔹 Existing: Call RPC to delete org data
        const { error } = await supabase.rpc('delete_organization', { org_name: orgName });
        if (error) {
          alert(`Error deleting organization: ${error.message}`);
        } else {
          fetchOrganizations();
          fetchResponses();
          alert(`Organization "${orgName}" deleted successfully.`);
        }
      } catch (err) {
        const error = err as Error; // ✅ Typecast for TypeScript safety
        console.error('Error deleting organization:', error);
        alert(`Error deleting organization: ${error.message || error}`);
      }
    }
  };
  

  const handleRightClick = (e: React.MouseEvent, org: string) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, org });
  };

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.fromCompare || state?.fromAdmin) {
      setIsAuthenticated(true);
    }
  }, [location.state]);
  
 

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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
    const totalEmissions = modeFilteredResponses.reduce((sum, response) => {
      let emission = 0;
      switch (dashboardMode) {
        case 'Feed':
          emission = parseFloat(response.feed_emission?.toString() || '0');
          break;
        case 'Manure':
          emission = parseFloat(response.manure_emission?.toString() || '0');
          break;
        case 'Energy':
          emission = parseFloat(response.energy_emission?.toString() || '0');
          break;
        case 'Waste':
          emission = parseFloat(response.waste_emission?.toString() || '0');
          break;
        case 'Transport':
          emission = parseFloat(response.transport_emission?.toString() || '0');
          break;
        case 'Overall':
          // Calculate total emissions from all categories for this response
          const feedEmission = parseFloat(response.feed_emission?.toString() || '0');
          const manureEmission = parseFloat(response.manure_emission?.toString() || '0');
          const energyEmission = parseFloat(response.energy_emission?.toString() || '0');
          const wasteEmission = parseFloat(response.waste_emission?.toString() || '0');
          const transportEmission = parseFloat(response.transport_emission?.toString() || '0');
          emission = feedEmission + manureEmission + energyEmission + wasteEmission + transportEmission;
          break;
      }
      return sum + (isNaN(emission) ? 0 : emission);
    }, 0);

    const averageEmissions = totalEmissions > 0 ? totalEmissions / modeFilteredResponses.length : 0;

    return {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      averageEmissions: Math.round(averageEmissions * 100) / 100
    };
  };
  const currentStats = calculateStats();

  // --- CHANGE START: Removed localStorage.setItem from the handleAuth function ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin123') {
      setIsAuthenticated(true)
      // localStorage.setItem('isAdminAuthenticated', 'true'); // This line has been removed
      setAuthError('')
    } else {
      setAuthError('Invalid password')
    }
  }
  // --- CHANGE END ---

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
        setLoading(false);
        return;
      }

      // Get user IDs from data rows
      const userIds = Array.from(new Set(dataRows.map(row => row.user_id).filter(Boolean))) as string[];
      
      // Fetch profiles to get organization names
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

      // Enrich responses with organization names from profiles
      const enrichedResponses = dataRows.map(row => {
        const profileOrgName = profilesMap.get(row.user_id || '');
        const finalOrgName = profileOrgName || row.organization_name || null;
        return { ...row, organization_name: finalOrgName } as ResponseData;
      });

      setResponses(enrichedResponses);

    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  }

  // --- CHANGE START: The useEffect that checked localStorage has been removed ---
  // The following block has been deleted:
  // useEffect(() => {
  //   const isAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
  //   if(isAdmin) {
  //     setIsAuthenticated(true);
  //   }
  // }, []);
  // --- CHANGE END ---

  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses();
      fetchOrganizations();
    }
  }, [isAuthenticated]);

  const exportData = () => {
    const dataToExport = orgFilteredResponses.map(r => {
      const baseData = {
        Name: r.name,
        Description: r.description || '',
        Category: r.category,
        'Feed Emission': r.feed_emission || 0,
        'Manure Emission': r.manure_emission || 0,
        'Energy Emission': r.energy_emission || 0,
        'Waste Emission': r.waste_emission || 0,
        'Transport Emission': r.transport_emission || 0,
        Username: r.user_email || '',
        Organization: r.organization_name || '',
        Date: r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
      };

      if (dashboardMode === 'Overall') {
        // Add total emission column for Overall mode
        const totalEmission = parseFloat(r.feed_emission?.toString() || '0') + 
                             parseFloat(r.manure_emission?.toString() || '0') + 
                             parseFloat(r.energy_emission?.toString() || '0') + 
                             parseFloat(r.waste_emission?.toString() || '0') + 
                             parseFloat(r.transport_emission?.toString() || '0');
        return {
          ...baseData,
          'Total Emission': totalEmission
        };
      }

      return baseData;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export");
    XLSX.writeFile(workbook, `${dashboardMode}_data_export.xlsx`);
  }

  const summaryStats = useMemo(() => {
    const totalRecords = modeFilteredResponses.length;

    // Group responses by emission values instead of just counting occurrences
    const emissionKey = modeConfig[dashboardMode].emissionKey;
    const responsesByEmission = modeFilteredResponses.reduce((acc, response) => {
      let emission = 0;
      
      if (dashboardMode === 'Overall') {
        // Calculate total emissions from all categories for this response
        const feedEmission = parseFloat(response.feed_emission?.toString() || '0');
        const manureEmission = parseFloat(response.manure_emission?.toString() || '0');
        const energyEmission = parseFloat(response.energy_emission?.toString() || '0');
        const wasteEmission = parseFloat(response.waste_emission?.toString() || '0');
        const transportEmission = parseFloat(response.transport_emission?.toString() || '0');
        emission = feedEmission + manureEmission + energyEmission + wasteEmission + transportEmission;
      } else {
        const emissionValue = response[emissionKey] as (string | number | null | undefined);
        emission = emissionValue !== undefined && emissionValue !== null ? parseFloat(String(emissionValue)) : 0;
      }

      const key = response.name || 'Unknown';
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += emission;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonType = Object.entries(responsesByEmission).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalRecords, mostCommonType, responsesByCategory: responsesByEmission };
  }, [modeFilteredResponses, dashboardMode]);

  const chartData = useMemo(() => {
    const totalEmissions = Object.values(summaryStats.responsesByCategory).reduce((sum, val) => sum + val, 0);
  
    // 1. First, map your data into a new array and store it in a variable called 'data'.
    const data = Object.entries(summaryStats.responsesByCategory).map(([name, value]) => ({
      name,
      value,
      percentage: totalEmissions > 0 ? Math.round((value / totalEmissions) * 100) : 0
    }));
  
    // 2. Now, sort that 'data' array and return the result.
    return data.sort((a, b) => b.value - a.value);
  
  }, [summaryStats]);

  // Helper: build chart data for any single dashboard mode, reusing your existing logic
// Helper: build chart data for any single dashboard mode, reusing your existing logic
const getChartDataFor = (mode: DashboardMode) => {
  const categories = modeConfig[mode].categoryNames;

  // filter the already org-filtered responses by this mode's categories
  const filtered = orgFilteredResponses.filter(r => categories.includes(r.category || ''));

  // sum emissions per response.name
  const sums: Record<string, number> = {};
  for (const r of filtered) {
    let emission = 0;

    // This logic correctly gets the emission value for the specific mode
    const key = modeConfig[mode].emissionKey;
    const raw = r[key] as (string | number | null | undefined);
    emission = raw !== undefined && raw !== null ? parseFloat(String(raw)) : 0;
    
    const label = r.name || 'Unknown';
    sums[label] = (sums[label] || 0) + (isNaN(emission) ? 0 : emission);
  }

  const total = Object.values(sums).reduce((a, b) => a + b, 0);

  // 1. Create the data array
  const data = Object.entries(sums).map(([name, value]) => ({
    name,
    value,
    percentage: total > 0 ? Math.round((value / total) * 100) : 0
  }));

  // 2. Sort the data array and return it
  return data.sort((a, b) => b.value - a.value);
};


  const orgCounts = useMemo(() => {
    // Count complete form cycles per organization
    // A complete cycle means having at least one entry from each form category
    const orgFormCounts = responses.reduce((acc, response) => {
      if (response.organization_name && response.user_email) {
        const orgKey = response.organization_name;
        const userKey = response.user_email;

        if (!acc[orgKey]) {
          acc[orgKey] = {};
        }
        if (!acc[orgKey][userKey]) {
          acc[orgKey][userKey] = new Set();
        }

        // Map categories to form types
        let formType = response.category;
        if (response.category === 'energy_processing') {
          formType = 'energy';
        }

        acc[orgKey][userKey].add(formType);
      }
      return acc;
    }, {} as Record<string, Record<string, Set<string>>>);

    // Count complete cycles (users who have completed all required forms)
    const requiredForms = ['general', 'feed', 'manure', 'energy', 'waste', 'transport'];

    return Object.entries(orgFormCounts).reduce((acc, [orgName, users]) => {
      let completeCycles = 0;

      Object.values(users).forEach(userForms => {
        const hasAllForms = requiredForms.every(form => userForms.has(form));
        if (hasAllForms) {
          completeCycles++;
        }
      });

      acc[orgName] = completeCycles;
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
      <motion.div className="flex justify-between items-center mb-6" >
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
          {/* --- CHANGE START: The logout button no longer needs to remove the localStorage item --- */}
          <motion.button onClick={() => {
            setIsAuthenticated(false);
            // localStorage.removeItem('isAdminAuthenticated'); // This line has been removed
          }} className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all" >
            <LogOut className="w-4 h-4" /> Logout
          </motion.button>
          {/* --- CHANGE END --- */}
        </div>
      </motion.div>

   
      <motion.div className="mb-8" >
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Filter by Organization</h3>
            <div className="flex gap-2">
              <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-sm bg-blue-600/50 hover:bg-blue-600/80 px-3 py-1.5 rounded-lg">
                <PlusCircle size={16} /> Add
              </button>
              <button
  onClick={() => navigate('/compare', { state: { fromAdmin: true } })}
  className="flex items-center gap-2 text-sm bg-gray-600/50 hover:bg-gray-600/80 px-3 py-1.5 rounded-lg"
>

                <Users size={16} /> Compare
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={orgSearchTerm}
              onChange={(e) => setOrgSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-grey-800"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedOrg('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedOrg === 'all' ? 'bg-grey-800 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}> All Organizations ({responses.length}) </button>
            {filteredOrganizations.map(org => (
              <button
                key={org}
                onContextMenu={(e) => handleRightClick(e, org)}
                onClick={() => setSelectedOrg(org)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedOrg === 'all' ? 'bg-gray-800 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20 focus:ring-grey-800'}`}
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
       {/* Find this div in your code and replace it entirely with the block below */}
<div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
  <h3 className="text-xl font-semibold mb-4">Data Distribution</h3>

  {/* CHANGE 1: Added a wrapper div for horizontal scrolling */}
  <div className="w-full overflow-x-auto pb-4">
    <ResponsiveContainer 
      width={chartData.length > 10 ? chartData.length * 60 : '100%'} // Dynamically set width
      height={300}
    >
      <BarChart 
        data={chartData}
        // CHANGE 2: Added mouse events to track hovered bar for highlighting
        onMouseMove={(state) => {
          if (state.isTooltipActive) {
            setHoveredBar(state.activePayload?.[0]?.payload.name || null);
          }
        }}
        onMouseLeave={() => setHoveredBar(null)}
        margin={{ top: 20, right: 20, left: -10, bottom: 5 }} // Adjust margin for labels
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
        
        {/* CHANGE 3: Set scale="band" to place bars between grid lines */}
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF" 
          angle={-45} 
          textAnchor="end" 
          height={70} // Increased height for better label visibility
          interval={0} // Ensure all labels are shown
          scale="band" // This is the key to placing bars between lines
        />
        
        <YAxis stroke="#9CA3AF" />
        
        {/* CHANGE 4: Use our new CustomBarTooltip */}
        <Tooltip 
          cursor={{ fill: 'rgba(75, 85, 99, 0.3)' }} // This dims the background block on hover
          content={<CustomBarTooltip />} 
          animationDuration={200}
        />
        
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {/* CHANGE 5: Render each bar as a Cell for individual styling (opacity) */}
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={hoveredBar === null || hoveredBar === entry.name ? '#60A5FA' : '#4B5563'} // Highlight active bar
              style={{ transition: 'fill 0.2s' }} // Smooth transition for color change
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
        <h3 className="text-xl font-semibold mb-4">Data Share (Pie)</h3>
        <div className="flex flex-row items-center w-full" style={{ height: '300px' }}>
          {/* Pie Chart Container (Left Side) */}
          <div className="w-3/5 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={false}
                >
                  {chartData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                  itemStyle={{ color: '#D1D5DB' }}
                  labelStyle={{ color: '#FFFFFF' }} 
                  formatter={(val: any, _name: any, { payload }: any) => {
                    const pct = payload?.percentage ?? 0;
                    const label = payload?.name ?? '';
                    return [`${pct}% (${val})`, label];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Container (Right Side) */}
          <div className="w-2/5 h-full pl-4 flex items-center">
            <PieLegend data={chartData} />
          </div>
        </div>
      </div>

      </motion.div>

      {dashboardMode === 'Overall' && (
  <motion.div className="mt-12 flex flex-col gap-12">
    {(['Feed', 'Manure', 'Energy', 'Waste', 'Transport'] as DashboardMode[]).map((mode) => {
      const dataForMode = getChartDataFor(mode);
      console.log("Data for Mode:", dataForMode);
      return (
        <div key={mode} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mode-specific Data Distribution */}
          <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
            <h3 className="text-xl font-semibold mb-4">{mode} — Data Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataForMode}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                  labelStyle={{ color: '#D1D5DB' }}
                />
                <Bar dataKey="value" fill="#6B7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mode-specific Data Share (Pie) */}
       {/* Mode-specific Data Share (Pie) */}
       <div className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg">
            <h3 className="text-xl font-semibold mb-4">{mode} — Data Share (Pie)</h3>
            <div className="flex flex-row items-center w-full" style={{ height: '300px' }}>
            {/* Pie Chart Container (Left Side) */}
            <div className="w-3/5 h-full">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={dataForMode}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={false}
                    >
                    {dataForMode.map((_, i) => (
                        <Cell key={`cell-${mode}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                    itemStyle={{ color: '#D1D5DB' }}  
                    labelStyle={{ color: '#FFFFFF' }} 
                    formatter={(val: any, _name: any, { payload }: any) => {
                        const pct = payload?.percentage ?? 0;
                        const label = payload?.name ?? '';
                        return [`${pct}% (${val})`, label];
                    }}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Legend Container (Right Side) */}
            <div className="w-2/5 h-full pl-4 flex items-center">
                <PieLegend data={dataForMode} />
            </div>
            </div>
        </div>

        </div>
      );
    })}
  </motion.div>
)}


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
                  let emissionValue: number;
                  
                  if (dashboardMode === 'Overall') {
                    // Calculate total emissions from all categories for this response
                    const feedEmission = parseFloat(r.feed_emission?.toString() || '0');
                    const manureEmission = parseFloat(r.manure_emission?.toString() || '0');
                    const energyEmission = parseFloat(r.energy_emission?.toString() || '0');
                    const wasteEmission = parseFloat(r.waste_emission?.toString() || '0');
                    const transportEmission = parseFloat(r.transport_emission?.toString() || '0');
                    emissionValue = feedEmission + manureEmission + energyEmission + wasteEmission + transportEmission;
                  } else {
                    const emissionKey = modeConfig[dashboardMode].emissionKey;
                    const emissionValueRaw = r[emissionKey] as (string | number | null | undefined);
                    emissionValue = emissionValueRaw !== undefined && emissionValueRaw !== null ? parseFloat(String(emissionValueRaw)) : 0;
                  }

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
                          {emissionValue.toFixed(4)}
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
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="bg-gray-800 p-6 rounded-lg w-full max-w-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4">Add New Organization</h2>
              <form onSubmit={handleAddOrganization}>
                <input type="text" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="Enter organization name" className="w-full p-2 bg-gray-700 rounded-md mb-4 text-white" required />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-600 rounded-md">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {contextMenu && (
          <div style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
            <button onClick={() => handleDeleteOrganization(contextMenu.org)} className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/20 flex items-center gap-2">
              <Trash2 size={16} /> Delete "{contextMenu.org}"
            </button>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}