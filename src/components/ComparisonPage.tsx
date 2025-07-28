import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, ResponseData } from '../lib/supabase';
// --- CHANGE START: Import LineChart, Line, and CartesianGrid instead of BarChart ---
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// --- CHANGE END ---
import { ArrowLeft, Users } from 'lucide-react';

export default function ComparisonPage() {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<string[]>([]);
    const [orgA, setOrgA] = useState<string>('');
    const [orgB, setOrgB] = useState<string>('');
    const [data, setData] = useState<ResponseData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- FIX: This check now correctly redirects to the auth page if the user is not authenticated ---
        const checkAdminAuth = () => {
            const isAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
            if (!isAdmin) {
                navigate('/auth');
            }
        };
        checkAdminAuth();
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: orgData, error: orgError } = await supabase.from('organizations').select('name').order('name');
            if (orgData) setOrganizations(orgData.map(o => o.name));

            const { data: allResponses, error: responsesError } = await supabase.from('data_rows').select('*');
            if (allResponses) setData(allResponses);

            setLoading(false);
        };
        fetchData();
    }, []);

    const comparisonData = useMemo(() => {
        if (!orgA || !orgB) return [];

        const categories = ['feed', 'manure', 'energy_processing', 'waste'];
        const emissionKeys: (keyof ResponseData)[] = ['feed_emission', 'manure_emission', 'energy_emission', 'waste_emission'];

        const calculateTotalEmissions = (orgName: string, category: string, key: keyof ResponseData) => {
            return data
                .filter(row => row.organization_name === orgName && row.category === category)
                .reduce((sum, row) => sum + (parseFloat(String(row[key])) || 0), 0);
        };

        return categories.map((category, index) => ({
            name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            [orgA]: calculateTotalEmissions(orgA, category, emissionKeys[index]),
            [orgB]: calculateTotalEmissions(orgB, category, emissionKeys[index]),
        }));
    }, [orgA, orgB, data]);

    return (
        <motion.div className="min-h-screen bg-gray-900 p-6 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Users size={28} />
                    <h1 className="text-3xl font-bold">Organization Comparison</h1>
                </div>
                <motion.button onClick={() => navigate('/admin')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg">
                    <ArrowLeft />
                </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <select value={orgA} onChange={e => setOrgA(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <option value="">Select Organization A</option>
                    {organizations.map(org => <option key={org} value={org}>{org}</option>)}
                </select>
                <select value={orgB} onChange={e => setOrgB(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <option value="">Select Organization B</option>
                    {organizations.filter(o => o !== orgA).map(org => <option key={org} value={org}>{org}</option>)}
                </select>
            </div>

            {orgA && orgB ? (
                <div className="bg-white/10 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Total Emissions by Category (in Tons)</h2>

                    {/* --- CHANGE START: Added SVG filter definitions for the glowing line effect --- */}
                    <svg width="0" height="0">
                        <defs>
                            <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" />
                            </filter>
                            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#22c55e" />
                            </filter>
                        </defs>
                    </svg>
                    {/* --- CHANGE END --- */}

                    <ResponsiveContainer width="100%" height={400}>
                        {/* --- CHANGE START: Replaced BarChart with LineChart and styled the lines --- */}
                        <LineChart data={comparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
                                itemStyle={{ color: '#E5E7EB' }}
                                labelStyle={{ color: '#9CA3AF', fontWeight: 'bold' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey={orgA}
                                stroke="#a855f7" // Purple
                                strokeWidth={3}
                                filter="url(#glow-purple)"
                                activeDot={{ r: 8, strokeWidth: 2, fill: '#c084fc' }}
                                dot={{ r: 4, strokeWidth: 2 }}
                            />
                            <Line
                                type="monotone"
                                dataKey={orgB}
                                stroke="#22c55e" // Green
                                strokeWidth={3}
                                filter="url(#glow-green)"
                                activeDot={{ r: 8, strokeWidth: 2, fill: '#4ade80' }}
                                dot={{ r: 4, strokeWidth: 2 }}
                            />
                        </LineChart>
                        {/* --- CHANGE END --- */}
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-400">Please select two organizations to compare.</p>
                </div>
            )}
        </motion.div>
    );
}