import React, { useState, useEffect } from 'react'
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
    headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255], fontSize: 9 },
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
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
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

  const handleDownload = async (format: 'pdf' | 'csv' | 'xlsx') => {
    setDownloading(format)
    setShowDownloadMenu(false)
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
      case 'feed': return data.map((item, index) => ({ entry: index + 1, feedType: item.feed_type || 'N/A', quantity: item.quantity || 'N/A', unit: item.unit || 'N/A' }));
      case 'manure': return data.map((item, index) => ({ entry: index + 1, systemType: item.systemType || 'N/A', daysUsed: item.daysUsed || 'N/A' }));
      case 'energy': return data.map((item, index) => ({ entry: index + 1, facility: item.facility || 'N/A', energyType: item.energyType || 'N/A', unit: item.unit || 'N/A', consumption: item.consumption || 'N/A' }));
      case 'waste': return data.map((item, index) => ({ entry: index + 1, wasteWater: item.wasteWaterTreated || 'N/A', oxygenDemand: item.oxygenDemand || 'N/A', etp: item.etp || 'N/A', treatmentType: item.waterTreatmentType || 'N/A' }));
      case 'transport': return data.map((item, index) => ({ entry: index + 1, route: item.route || 'N/A', vehicleType: item.vehicleType || 'N/A', distance: item.distance || 'N/A' }));
      default: return [];
    }
  }

  const sections = [{ key: 'feed', title: 'FEED Data', icon: Wheat, color: 'text-green-400', data: formatDataForDisplay(allData.feed, 'feed'), headers: ['Entry', 'Feed Type', 'Quantity', 'Unit'] }, { key: 'manure', title: 'Manure Management', icon: Recycle, color: 'text-yellow-400', data: formatDataForDisplay(allData.manure, 'manure'), headers: ['Entry', 'System Type', 'Days Used'] }, { key: 'energy', title: 'Energy & Processing', icon: Zap, color: 'text-blue-400', data: formatDataForDisplay(allData.energy, 'energy'), headers: ['Entry', 'Facility', 'Energy Type', 'Unit', 'Consumption'] }, { key: 'waste', title: 'Waste Management', icon: Droplets, color: 'text-cyan-400', data: formatDataForDisplay(allData.waste, 'waste'), headers: ['Entry', 'Waste Water', 'Oxygen Demand', 'ETP', 'Treatment Type'] }, { key: 'transport', title: 'Transport', icon: Truck, color: 'text-purple-400', data: formatDataForDisplay(allData.transport, 'transport'), headers: ['Entry', 'Route', 'Vehicle Type', 'Distance'] }];
  const completedSections = sections.filter(section => section.data.length > 0);

  if (loading) {
    return (
      <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your submission...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {!showReview ? (
          // Main Review & Download Page
          <>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Review & Download Your Submission</h1>
              <p className="text-gray-300">Your data has been successfully saved. Review or download your submission below.</p>
            </motion.div>

            <motion.div
              className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-col md:flex-row md:justify-center md:gap-16 gap-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Organization</p>
                    <p className="text-white font-medium">{userInfo.profile?.organization_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Generated</p>
                    <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-green-200 font-medium">Submission Complete</h3>
              </div>
              <p className="text-green-300/80 text-sm">
                ({completedSections.length} of 5 sections completed)
              </p>
            </motion.div>

            <div className="space-y-4">
              <motion.button
                onClick={() => setShowReview(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Eye className="w-5 h-5" />
                <span>Review Your Submission</span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Return to Welcome Page
              </motion.button>
            </div>
          </>
        ) : (
          // Review Page
          <>
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.button
                onClick={() => setShowReview(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </motion.button>
              <h2 className="text-2xl font-bold text-white">Submission Review</h2>
              <div></div>
            </motion.div>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {completedSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.key}
                    className="bg-white/5 border border-white/10 rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Icon className={`w-6 h-6 ${section.color}`} />
                      <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                      <span className="text-sm text-gray-400">({section.data.length} entries)</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {section.headers.map(header => (
                              <th key={header} className="text-left py-2 px-3 text-gray-300 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-white/5">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="py-2 px-3 text-white">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })}

              {/* --- THIS IS THE FIX --- */}
              {/* The download options are now in their own styled section */}
              <motion.div
                className="bg-white/5 border border-white/10 rounded-lg p-6 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: completedSections.length * 0.1 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Download className={`w-6 h-6 text-green-400`} />
                  <h3 className="text-xl font-semibold text-white">Download Submission</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="flex-1 px-6 py-3 text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center space-x-3 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-red-400" />
                    <span>Download as PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload('csv')}
                    className="flex-1 px-6 py-3 text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center space-x-3 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-green-400" />
                    <span>Download as CSV</span>
                  </button>
                  <button
                    onClick={() => handleDownload('xlsx')}
                    className="flex-1 px-6 py-3 text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center space-x-3 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>Download as Excel</span>
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