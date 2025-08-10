import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowLeft, Users, Flame, Droplets, Zap, Truck } from 'lucide-react';

// Define the actual data structure based on what's stored in form_data
interface FormData {
  feed?: Array<{
    feed_type: string;
    quantity: number;
    unit: string;
  }>;
  manure?: Array<{
    systemType: string;
    daysUsed: number;
  }>;
  energy?: Array<{
    facility: string;
    energyType: string;
    unit: string;
    consumption: number;
  }>;
  waste?: Array<{
    wasteWaterTreated: number;
    oxygenDemand: number;
    etp: string;
    waterTreatmentType: string;
  }>;
  transport?: Array<{
    route: string;
    vehicleType: string;
    distance: number;
  }>;
  general?: Array<{
    poultry_quantity: number;
    poultry_unit: string;
    kfc_share: number;
    bird_count: number;
  }>;
}

interface DataRow {
  id: string;
  name: string;
  description: string;
  category: string;
  user_email: string;
  organization_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export default function ComparisonPage() {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState<string[]>([]);
    const [orgA, setOrgA] = useState<string>('');
    const [orgB, setOrgB] = useState<string>('');
    const [data, setData] = useState<DataRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                // Fetch organizations from data_rows table
                const { data: orgData, error: orgError } = await supabase
                    .from('data_rows')
                    .select('organization_name')
                    .not('organization_name', 'is', null)
                    .order('organization_name');

                if (orgError) {
                    console.error('Error fetching organizations:', orgError.message);
                } else if (orgData) {
                    // Extract unique organization names
                    const uniqueOrgs = [...new Set(orgData.map(o => o.organization_name).filter(Boolean))];
                    setOrganizations(uniqueOrgs);
                }

                // Fetch all data rows with organization names
                const { data: allResponses, error: responsesError } = await supabase
                    .from('data_rows')
                    .select('*')
                    .or('organization_name.not.is.null,user_email.not.is.null');

                if (responsesError) {
                    console.error('Error fetching responses:', responsesError.message);
                } else if (allResponses) {
                    setData(allResponses);
                }

                console.log('orgData sample:', orgData?.slice(0, 10));
                console.log('allResponses sample:', allResponses?.slice(0, 10));
                console.log('organizations (from table):', orgData?.map(o => o.organization_name).filter(Boolean));
                console.log('Total data rows fetched:', allResponses?.length || 0);
                console.log('Data rows with organization names:', allResponses?.filter(row => row.organization_name)?.length || 0);
                console.log('Data rows with autosave category:', allResponses?.filter(row => row.category === 'autosave')?.length || 0);

            } catch (error) {
                console.error('Error in fetchData:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper function to calculate emissions from form data
    const calculateEmissionsFromFormData = (formDataJson: string, category: string): number => {
        try {
            const formData: FormData = JSON.parse(formDataJson);
            console.log('Parsed form data for category', category, ':', formData);
            
            switch (category) {
                case 'feed':
                    if (formData.feed && Array.isArray(formData.feed)) {
                        return formData.feed.reduce((total, item) => {
                            const quantity = parseFloat(String(item.quantity)) || 0;
                            // Convert to kg and apply emission factor (example: 2.5 kg CO2e per kg feed)
                            const kgQuantity = convertToKgs(quantity, item.unit);
                            return total + (kgQuantity * 2.5);
                        }, 0);
                    }
                    break;
                    
                case 'manure':
                    if (formData.manure && Array.isArray(formData.manure)) {
                        return formData.manure.reduce((total, item) => {
                            const daysUsed = parseFloat(String(item.daysUsed)) || 0;
                            // Example emission factor: 0.1 kg CO2e per day
                            return total + (daysUsed * 0.1);
                        }, 0);
                    }
                    break;
                    
                case 'energy_processing':
                    if (formData.energy && Array.isArray(formData.energy)) {
                        return formData.energy.reduce((total, item) => {
                            const consumption = parseFloat(String(item.consumption)) || 0;
                            // Example emission factor: 0.5 kg CO2e per unit
                            return total + (consumption * 0.5);
                        }, 0);
                    }
                    break;
                    
                case 'waste':
                    if (formData.waste && Array.isArray(formData.waste)) {
                        return formData.waste.reduce((total, item) => {
                            const wasteWater = parseFloat(String(item.wasteWaterTreated)) || 0;
                            // Example emission factor: 0.01 kg CO2e per liter
                            return total + (wasteWater * 0.01);
                        }, 0);
                    }
                    break;
                    
                case 'transport':
                    if (formData.transport && Array.isArray(formData.transport)) {
                        return formData.transport.reduce((total, item) => {
                            const distance = parseFloat(String(item.distance)) || 0;
                            // Example emission factor: 0.2 kg CO2e per km
                            return total + (distance * 0.2);
                        }, 0);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error parsing form data:', error);
        }
        return 0;
    };

    // Helper function to get emission value - tries direct column first, then calculates from form data
    const getEmissionValue = (row: any, category: string): number => {
        // First try to get from emission columns if they exist
        switch (category) {
            case 'feed':
                if (row.feed_emission !== undefined) return parseFloat(String(row.feed_emission)) || 0;
                break;
            case 'manure':
                if (row.manure_emission !== undefined) return parseFloat(String(row.manure_emission)) || 0;
                break;
            case 'energy_processing':
                if (row.energy_emission !== undefined) return parseFloat(String(row.energy_emission)) || 0;
                break;
            case 'waste':
                if (row.waste_emission !== undefined) return parseFloat(String(row.waste_emission)) || 0;
                break;
            case 'transport':
                if (row.transport_emission !== undefined) return parseFloat(String(row.transport_emission)) || 0;
                break;
        }
        
        // Fallback: calculate from form data if available
        if (row.description && row.category === 'autosave') {
            return calculateEmissionsFromFormData(row.description, category);
        }
        
        return 0;
    };

    // Helper function to convert units to kg
    const convertToKgs = (quantity: number, unit: string): number => {
        switch (unit?.toLowerCase()) {
            case 'tons':
                return quantity * 1000;
            case 'quintal':
                return quantity * 100;
            case 'kg':
                return quantity;
            case 'gms':
                return quantity / 1000;
            default:
                return quantity;
        }
    };

    const comparisonData = useMemo(() => {
        if (!orgA || !orgB) return [];

        console.log('Calculating comparison data for:', orgA, 'vs', orgB);
        console.log('Available data rows:', data.length);
        console.log('Data rows for orgA:', data.filter(row => row.organization_name === orgA).length);
        console.log('Data rows for orgB:', data.filter(row => row.organization_name === orgB).length);

        const categories = ['feed', 'manure', 'energy_processing', 'waste', 'transport'];

        const calculateTotalEmissions = (orgName: string, category: string) => {
            return data
                .filter(row => row.organization_name === orgName)
                .reduce((sum, row) => {
                    return sum + getEmissionValue(row, category);
                }, 0);
        };

        const calculateOverallEmissions = (orgName: string) => {
            return data
                .filter(row => row.organization_name === orgName)
                .reduce((sum, row) => {
                    const feedEmission = getEmissionValue(row, 'feed');
                    const manureEmission = getEmissionValue(row, 'manure');
                    const energyEmission = getEmissionValue(row, 'energy_processing');
                    const wasteEmission = getEmissionValue(row, 'waste');
                    const transportEmission = getEmissionValue(row, 'transport');
                    return sum + feedEmission + manureEmission + energyEmission + wasteEmission + transportEmission;
                }, 0);
        };

        const categoryData = categories.map((category) => ({
            name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            [orgA]: calculateTotalEmissions(orgA, category),
            [orgB]: calculateTotalEmissions(orgB, category),
        }));

        categoryData.unshift({
            name: 'Overall',
            [orgA]: calculateOverallEmissions(orgA),
            [orgB]: calculateOverallEmissions(orgB),
        });

        return categoryData;
    }, [orgA, orgB, data]);

    const getCategoryData = (categoryName: string) => {
        if (!orgA || !orgB) return [];
        
        const categoryData = comparisonData.find(item => item.name === categoryName);
        if (!categoryData) return [];

        return [
            { name: orgA, value: categoryData[orgA] || 0 },
            { name: orgB, value: categoryData[orgB] || 0 }
        ];
    };

    const getCategoryIcon = (categoryName: string) => {
        switch (categoryName.toLowerCase()) {
            case 'overall': return Users;
            case 'feed': return Flame;
            case 'manure': return Droplets;
            case 'energy processing': return Zap;
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
            case 'energy processing': return 'text-yellow-400';
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
                    {organizations.map(org => <option key={org} value={org}>{org}</option>)}
                </select>
                <select value={orgB} onChange={e => setOrgB(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <option value="">Select Organization B</option>
                    {organizations.filter(o => o !== orgA).map(org => <option key={org} value={org}>{org}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <p className="text-gray-400">Loading data...</p>
                </div>
            ) : orgA && orgB ? (
                <div className="space-y-8">
                    {['Overall', 'Feed', 'Manure', 'Energy Processing', 'Waste', 'Transport'].map((category) => {
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
                                                  category === 'Energy Processing' ? '#EAB308' :
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
                    {data.length === 0 && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-400">No data found. Please ensure:</p>
                            <ul className="text-red-300 text-sm mt-2 text-left max-w-md mx-auto">
                                <li>• Users have submitted survey data</li>
                                <li>• Data has organization names assigned</li>
                                <li>• Database connection is working</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}