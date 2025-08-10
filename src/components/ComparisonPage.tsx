import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Users, Flame, Droplets, Zap, Truck } from 'lucide-react';

// Updated interface to match the expected data structure from the database
interface DataRow {
  id: string;
  name: string;
  description: string;
  category: string;
  user_id?: string; // Foreign key to profiles table
  user_email: string;
  organization_name: string | null;
  username: string;
  created_at: string;
  updated_at: string;
  feed_emission?: number | null;
  manure_emission?: number | null;
  energy_emission?: number | null;
  waste_emission?: number | null;
  transport_emission?: number | null;
}

export default function ComparisonPage() {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<string[]>([]);
    const [orgA, setOrgA] = useState<string>('');
    const [orgB, setOrgB] = useState<string>('');
    const [data, setData] = useState<DataRow[]>([]);
    const [loading, setLoading] = useState(true);

    // New useEffect implementing the robust data fetching and enrichment logic
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch the master list of organizations for the dropdowns
                const { data: orgList, error: orgError } = await supabase
                    .from('organizations')
                    .select('name')
                    .order('name');
                
                if (orgError) {
                    console.error("Error fetching organizations:", orgError);
                } else if (orgList) {
                    setOrganizations(orgList.map(o => o.name));
                }

                // 2. Fetch all raw data rows
                const { data: dataRows, error: dataRowsError } = await supabase
                    .from('data_rows')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (dataRowsError) throw dataRowsError;
                if (!dataRows || dataRows.length === 0) {
                    setData([]);
                    setLoading(false);
                    return;
                }

                // 3. Get unique user IDs from the data to look up profiles
                const userIds = Array.from(new Set(dataRows.map(row => row.user_id).filter(Boolean))) as string[];
                
                // 4. Fetch the corresponding profiles to get the correct organization name
                let profilesMap = new Map<string, string>();
                if (userIds.length > 0) {
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, organization_name')
                        .in('id', userIds);
                    
                    if (profilesError) throw profilesError;

                    if (profiles) {
                        profiles.forEach(profile => {
                            if (profile.id && profile.organization_name) {
                                profilesMap.set(profile.id, profile.organization_name);
                            }
                        });
                    }
                }

                // 5. Enrich the data with the correct organization name from profiles
                const enrichedData = dataRows.map(row => {
                    const profileOrgName = profilesMap.get(row.user_id || '');
                    // Prioritize the name from the profile, but fall back to the one on the row if it exists
                    const finalOrgName = profileOrgName || row.organization_name || null;
                    return { ...row, organization_name: finalOrgName };
                });

                setData(enrichedData as DataRow[]);

            } catch (error) {
                console.error('Error in fetchData:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Simplified helper function to get emission value directly from the data row
    const getEmissionValue = (row: DataRow, category: string): number => {
        switch (category) {
            case 'feed': return row.feed_emission || 0;
            case 'manure': return row.manure_emission || 0;
            case 'energy': return row.energy_emission || 0;
            case 'waste': return row.waste_emission || 0;
            case 'transport': return row.transport_emission || 0;
            default: return 0;
        }
    };
    
    // Updated useMemo hook to work with the enriched data and simplified calculation
    const comparisonData = useMemo(() => {
        if (!orgA || !orgB) return [];

        const categories = ['feed', 'manure', 'energy', 'waste', 'transport'];

        const calculateTotalForOrg = (orgName: string) => {
            const orgData = data.filter(row => row.organization_name === orgName);
            const totals = {
                Overall: 0,
                Feed: 0,
                Manure: 0,
                Energy: 0,
                Waste: 0,
                Transport: 0,
            };

            orgData.forEach(row => {
                const feed = getEmissionValue(row, 'feed');
                const manure = getEmissionValue(row, 'manure');
                const energy = getEmissionValue(row, 'energy');
                const waste = getEmissionValue(row, 'waste');
                const transport = getEmissionValue(row, 'transport');

                totals.Feed += feed;
                totals.Manure += manure;
                totals.Energy += energy;
                totals.Waste += waste;
                totals.Transport += transport;
                totals.Overall += feed + manure + energy + waste + transport;
            });

            return totals;
        };
        
        const totalsA = calculateTotalForOrg(orgA);
        const totalsB = calculateTotalForOrg(orgB);

        const finalData = [
            { name: 'Overall', [orgA]: totalsA.Overall, [orgB]: totalsB.Overall },
            { name: 'Feed', [orgA]: totalsA.Feed, [orgB]: totalsB.Feed },
            { name: 'Manure', [orgA]: totalsA.Manure, [orgB]: totalsB.Manure },
            { name: 'Energy', [orgA]: totalsA.Energy, [orgB]: totalsB.Energy },
            { name: 'Waste', [orgA]: totalsA.Waste, [orgB]: totalsB.Waste },
            { name: 'Transport', [orgA]: totalsA.Transport, [orgB]: totalsB.Transport },
        ];
        
        return finalData;
    }, [orgA, orgB, data]);

    const getCategoryData = (categoryName: string) => {
        if (!orgA || !orgB) return [];
        
        const categoryDetails = comparisonData.find(item => item.name === categoryName);
        if (!categoryDetails) return [];

        return [
            { name: orgA, value: categoryDetails[orgA] || 0 },
            { name: orgB, value: categoryDetails[orgB] || 0 }
        ];
    };

    const getCategoryIcon = (categoryName: string) => {
        switch (categoryName.toLowerCase()) {
            case 'overall': return Users;
            case 'feed': return Flame;
            case 'manure': return Droplets;
            case 'energy': return Zap;
            case 'waste': return Droplets;
            case 'transport': return Truck;
            default: return Users;
        }
    };

    const getCategoryColor = (categoryName: string) => {
        switch (categoryName.toLowerCase()) {
            case 'overall': return 'text-blue-400';
            case 'feed': return 'text-orange-400';
            case 'manure': return 'text-green-400';
            case 'energy': return 'text-yellow-400';
            case 'waste': return 'text-cyan-400';
            case 'transport': return 'text-purple-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                    {organizations.map(org => <option key={`orgA-${org}`} value={org}>{org}</option>)}
                </select>
                <select value={orgB} onChange={e => setOrgB(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <option value="">Select Organization B</option>
                    {organizations.filter(o => o !== orgA).map(org => <option key={`orgB-${org}`} value={org}>{org}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <p className="text-gray-400">Loading data...</p>
                </div>
            ) : orgA && orgB ? (
                <div className="space-y-8">
                    {['Overall', 'Feed', 'Manure', 'Energy', 'Waste', 'Transport'].map((category) => {
                        const IconComponent = getCategoryIcon(category);
                        const categoryColor = getCategoryColor(category);
                        const chartData = getCategoryData(category);
                        
                        return (
                            <motion.div 
                                key={category} 
                                className="bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-lg"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <IconComponent className={`w-6 h-6 ${categoryColor}`} />
                                    <h2 className="text-xl font-semibold">{category} Emissions Comparison</h2>
                                </div>
                                
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                        <XAxis dataKey="name" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1F2937', 
                                                border: '1px solid #4B5563',
                                                borderRadius: '0.5rem'
                                            }}
                                            labelStyle={{ color: '#9CA3AF' }}
                                        />
                                        <Bar 
                                            dataKey="value" 
                                            fill={category === 'Overall' ? '#3B82F6' : 
                                                  category === 'Feed' ? '#F97316' :
                                                  category === 'Manure' ? '#22C55E' :
                                                  category === 'Energy' ? '#EAB308' :
                                                  category === 'Waste' ? '#06B6D4' :
                                                  '#A855F7'}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                                
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">{orgA}</p>
                                        <p className="text-2xl font-bold">{chartData[0]?.value.toFixed(4) || '0.0000'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">{orgB}</p>
                                        <p className="text-2xl font-bold">{chartData[1]?.value.toFixed(4) || '0.0000'}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-400">Please select two organizations to compare.</p>
                    {organizations.length === 0 && !loading && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-400">No organizations found.</p>
                            <p className="text-red-300 text-sm mt-2">
                                Please ensure organizations are added in the admin dashboard.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}