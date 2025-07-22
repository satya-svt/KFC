import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllAutoSavedData } from '../lib/autoSave'
import { getCurrentUserEmail, getUserProfile } from '../lib/supabase'
import {
  CheckCircle,
  Download,
  FileText,
  Eye,
  ChevronDown,
  ArrowLeft,
  Wheat,
  Recycle,
  Zap,
  Droplets,
  Truck,
  User,
  Building2,
  Calendar
} from 'lucide-react'

// Utility functions for download formats
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

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
      return 0;
  }
};

function getFlattenedResponses(allData: Record<string, any>) {
  const result: any[] = []
  const typeMap: Record<string, string> = {
    feed: "Feed",
    manure: "Manure",
    energy: "Energy",
    waste: "Waste",
    transport: "Transport"
  }

  Object.entries(allData).forEach(([section, data]) => {
    if (!Array.isArray(data)) return
    data.forEach((row: any, idx: number) => {
      result.push({
        Section: typeMap[section] || section,
        Entry: idx + 1,
        ...row
      })
    })
  })
  return result
}

function downloadAsPDFFromData(allData: Record<string, any>) {
  const doc = new jsPDF()
  const responseRows = getFlattenedResponses(allData)
  if (responseRows.length === 0) {
    alert("No data to download.")
    return
  }
  doc.setFontSize(20)
  doc.text('Submission Export', 14, 22)
  doc.setFontSize(12)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35)
  doc.text(`Total Entries: ${responseRows.length}`, 14, 45)
  const columns = Object.keys(responseRows[0])
  const tableData = responseRows.map(row => columns.map(col => row[col] ?? ""))
  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: 55,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 15 } }
  })
  doc.save('submission.pdf')
}

function downloadAsCSVFromData(allData: Record<string, any>) {
  const responseRows = getFlattenedResponses(allData)
  if (responseRows.length === 0) {
    alert("No data to download.")
    return
  }
  const columns = Object.keys(responseRows[0])
  const csvRows = [
    columns.join(','),
    ...responseRows.map(row =>
      columns.map(col => `"${(row[col] ?? "").toString().replace(/"/g, '""')}"`).join(',')
    )
  ]
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'submission.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}

function downloadAsExcelFromData(allData: Record<string, any>) {
  const responseRows = getFlattenedResponses(allData)
  if (responseRows.length === 0) {
    alert("No data to download.")
    return
  }
  const worksheet = XLSX.utils.json_to_sheet(responseRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Submission')
  XLSX.writeFile(workbook, 'submission.xlsx')
}

export default function ReviewDownload() {
  const navigate = useNavigate()
  const [allData, setAllData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email: string | null, profile: any }>({
    email: null,
    profile: null
  })
  const [downloading, setDownloading] = useState<string | null>(null)
  const entryId = 'entry_1'

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllAutoSavedData(entryId)
        const email = await getCurrentUserEmail()
        const profile = getUserProfile()
        setAllData(data)
        setUserInfo({ email, profile })
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [entryId])

  const totalFeedInKgs = useMemo(() => {
    if (!allData.feed || !Array.isArray(allData.feed)) {
      return 0;
    }
    return allData.feed.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      return total + convertToKgs(quantity, item.unit);
    }, 0);
  }, [allData.feed]);

  const totalTransportInKms = useMemo(() => {
    if (!allData.transport || !Array.isArray(allData.transport)) {
      return 0;
    }
    return allData.transport.reduce((total, item) => {
      const distance = parseFloat(item.distance) || 0;
      return total + distance;
    }, 0);
  }, [allData.transport]);

  const handleDownload = async (format: 'pdf' | 'csv' | 'xlsx') => {
    setDownloading(format)
    try {
      switch (format) {
        case 'pdf':
          downloadAsPDFFromData(allData)
          break
        case 'csv':
          downloadAsCSVFromData(allData)
          break
        case 'xlsx':
          downloadAsExcelFromData(allData)
          break
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Error downloading file. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const formatDataForDisplay = (data: any[], type: string) => {
    if (!data || !Array.isArray(data)) return []
    switch (type) {
      case 'feed': return data.map((item, index) => ({ 'S.no': index + 1, feedType: item.feed_type || 'N/A', quantity: item.quantity || 'N/A', unit: item.unit || 'N/A' }));
      case 'manure': return data.map((item, index) => ({ 'S.no': index + 1, systemType: item.systemType || 'N/A', daysUsed: item.daysUsed || 'N/A' }));
      case 'energy': return data.sort((a, b) => (a.energyType || '').localeCompare(b.energyType || '')).map((item, index) => ({ 'S.no': index + 1, facility: item.facility || 'N/A', energyType: item.energyType || 'N/A', unit: item.unit || 'N/A', consumption: item.consumption || 'N/A' }));
      case 'waste': return data.map((item, index) => ({ 'S.no': index + 1, wasteWater: item.wasteWaterTreated || 'N/A', oxygenDemand: item.oxygenDemand || 'N/A', etp: item.etp || 'N/A', treatmentType: item.waterTreatmentType || 'N/A' }));
      case 'transport': return data.map((item, index) => ({ 'S.no': index + 1, route: item.route || 'N/A', vehicleType: item.vehicleType || 'N/A', distance: item.distance || 'N/A' }));
      default: return [];
    }
  }

  const sections = [{ key: 'feed', title: 'FEED Data', icon: Wheat, color: 'text-green-600', data: formatDataForDisplay(allData.feed, 'feed'), headers: ['S.no', 'Feed Type', 'Quantity', 'Unit'] }, { key: 'manure', title: 'Manure Management', icon: Recycle, color: 'text-yellow-600', data: formatDataForDisplay(allData.manure, 'manure'), headers: ['S.no', 'System Type', 'Days Used'] }, { key: 'energy', title: 'Energy & Processing', icon: Zap, color: 'text-blue-600', data: formatDataForDisplay(allData.energy, 'energy'), headers: ['S.no', 'Facility', 'Energy Type', 'Unit', 'Consumption'] }, { key: 'waste', title: 'Waste Management', icon: Droplets, color: 'text-cyan-600', data: formatDataForDisplay(allData.waste, 'waste'), headers: ['S.no', 'Waste Water', 'Oxygen Demand', 'ETP', 'Treatment Type'] }, { key: 'transport', title: 'Transport', icon: Truck, color: 'text-purple-600', data: formatDataForDisplay(allData.transport, 'transport'), headers: ['S.no', 'Route', 'Vehicle Type', 'Distance'] }];
  const completedSections = sections.filter(section => section.data.length > 0);

  if (loading) {
    return (
      <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </motion.div>
    );
  }

  return (
    // --- THEME CHANGE: Main container background ---
    <motion.div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      {/* --- THEME CHANGE: Content container styling --- */}
      <motion.div
        className="max-w-4xl w-full bg-white rounded-2xl border border-gray-400 p-8 shadow-xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {!showReview ? (
          <>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* --- THEME CHANGE: Header --- */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Review & Download Your Submission</h1>
              <p className="text-gray-600">Your data has been successfully saved. Review or download your submission below.</p>
            </motion.div>
            {/* --- THEME CHANGE: Info box --- */}
            <motion.div
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-col md:flex-row md:justify-center md:gap-16 gap-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-gray-500 text-sm">Organization</p>
                    <p className="text-gray-800 font-medium">{userInfo.profile?.organization_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-gray-500 text-sm">Generated</p>
                    <p className="text-gray-800 font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* --- THEME CHANGE: Completion status box --- */}
            <motion.div
              className="bg-green-100 border border-green-300 rounded-lg p-4 mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-green-800 font-medium">Submission Complete</h3>
              </div>
              <p className="text-green-700 text-sm">
                ({completedSections.length} of 5 sections completed)
              </p>
            </motion.div>
            <div className="space-y-4">
              {/* --- THEME CHANGE: Buttons --- */}
              <motion.button
                onClick={() => setShowReview(true)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye className="w-5 h-5" />
                <span>Review Your Submission</span>
              </motion.button>
              <motion.button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Return to Welcome Page
              </motion.button>
            </div>
          </>
        ) : (
          <>
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.button
                onClick={() => setShowReview(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-lg flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </motion.button>
              <h2 className="text-2xl font-bold text-gray-800">Submission Review</h2>
              <div></div>
            </motion.div>
            {/* --- THEME CHANGE: Scrollable area and data containers --- */}
            <div className="space-y-6 max-h-96 overflow-y-auto pr-4">
              {completedSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.key}
                    className="bg-gray-200 border border-gray-200 rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Icon className={`w-6 h-6 ${section.color}`} />
                      <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            {section.headers.map(header => (
                              <th key={header} className="text-left py-2 px-3 text-gray-500 font-medium">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-gray-800">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="py-2 px-3 text-gray-700">{String(value)}</td>
                              ))}
                            </tr>
                          ))}
                          {section.key === 'feed' && section.data.length > 0 && (
                            <tr className="border-t-2 border-gray-500">
                              <td className="py-3 px-3 text-gray-800 font-bold" colSpan={2}>Total</td>
                              <td className="py-3 px-3 text-gray-800 font-bold">{totalFeedInKgs.toFixed(2)}</td>
                              <td className="py-3 px-3 text-gray-800 font-bold">KGs</td>
                            </tr>
                          )}
                          {section.key === 'transport' && section.data.length > 0 && (
                            <tr className="border-t-2 border-gray-500">
                              <td className="py-3 px-3 text-gray-800 font-bold" colSpan={3}>Total Distance</td>
                              <td className="py-3 px-3 text-gray-800 font-bold">{totalTransportInKms.toFixed(2)} KMs</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })}
              {/* --- THEME CHANGE: Download section --- */}
              <motion.div
                className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: completedSections.length * 0.1 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Download className={`w-6 h-6 text-green-600`} />
                  <h3 className="text-xl font-semibold text-gray-800">Download Submission</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => handleDownload('pdf')} className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors flex items-center justify-center space-x-3 rounded-lg">
                    <FileText className="w-5 h-5 text-red-500" />
                    <span>Download as PDF</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}