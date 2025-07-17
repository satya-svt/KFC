import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { getAllAutoSavedData } from './autoSave'
import { getCurrentUserEmail, getUserProfile } from './supabase'

export interface SubmissionData {
  feed?: any[]
  manure?: any[]
  energy?: any[]
  waste?: any[]
  transport?: any[]
}

// Format data for display and export
const formatDataForExport = (data: Record<string, any>): SubmissionData => {
  const formatted: SubmissionData = {}

  // Format FEED data
  if (data.feed && Array.isArray(data.feed)) {
    formatted.feed = data.feed.map((item, index) => ({
      'Entry': index + 1,
      'Feed Type': item.feed_type || '',
      'Quantity': item.quantity || '',
      'Unit': item.unit || ''
    }))
  }

  // Format Manure data
  if (data.manure && Array.isArray(data.manure)) {
    formatted.manure = data.manure.map((item, index) => ({
      'Entry': index + 1,
      'System Type': item.systemType || '',
      'Days Used': item.daysUsed || ''
    }))
  }

  // Format Energy data
  if (data.energy && Array.isArray(data.energy)) {
    formatted.energy = data.energy.map((item, index) => ({
      'Entry': index + 1,
      'Facility': item.facility || '',
      'Energy Type': item.energyType || '',
      'Unit': item.unit || '',
      'Consumption': item.consumption || ''
    }))
  }

  // Format Waste data
  if (data.waste && Array.isArray(data.waste)) {
    formatted.waste = data.waste.map((item, index) => ({
      'Entry': index + 1,
      'Waste Water Treated': item.wasteWaterTreated || '',
      'Oxygen Demand': item.oxygenDemand || '',
      'ETP': item.etp || '',
      'Water Treatment Type': item.waterTreatmentType || ''
    }))
  }

  // Format Transport data
  if (data.transport && Array.isArray(data.transport)) {
    formatted.transport = data.transport.map((item, index) => ({
      'Entry': index + 1,
      'Route': item.route || '',
      'Vehicle Type': item.vehicleType || '',
      'Distance': item.distance || ''
    }))
  }

  return formatted
}

// Download as PDF
export const downloadAsPDF = async (entryId: string = 'entry_1') => {
  try {
    const data = await getAllAutoSavedData(entryId)
    const userEmail = await getCurrentUserEmail()
    const userProfile = getUserProfile()
    const formatted = formatDataForExport(data)

    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(20)
    doc.text('Submission Report', 20, 20)
    
    // Add user info
    doc.setFontSize(12)
    doc.text(`User: ${userEmail || 'N/A'}`, 20, 35)
    doc.text(`Organization: ${userProfile.organization_name || 'N/A'}`, 20, 45)
    doc.text(`Entry ID: ${entryId}`, 20, 55)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65)

    let yPosition = 80

    // Add each section
    const sections = [
      { title: 'FEED Data', data: formatted.feed },
      { title: 'Manure Management Data', data: formatted.manure },
      { title: 'Energy & Processing Data', data: formatted.energy },
      { title: 'Waste Management Data', data: formatted.waste },
      { title: 'Transport Data', data: formatted.transport }
    ]

    sections.forEach(section => {
      if (section.data && section.data.length > 0) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        // Add section title
        doc.setFontSize(14)
        doc.text(section.title, 20, yPosition)
        yPosition += 10

        // Add table
        const columns = Object.keys(section.data[0])
        const rows = section.data.map(item => columns.map(col => item[col] || ''))

        autoTable(doc, {
          head: [columns],
          body: rows,
          startY: yPosition,
          margin: { left: 20, right: 20 },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 66, 66] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 20
      }
    })

    doc.save(`submission_${entryId}_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error generating PDF. Please try again.')
  }
}

// Download as CSV
export const downloadAsCSV = async (entryId: string = 'entry_1') => {
  try {
    const data = await getAllAutoSavedData(entryId)
    const userEmail = await getCurrentUserEmail()
    const userProfile = getUserProfile()
    const formatted = formatDataForExport(data)

    let csvContent = `Submission Report\n`
    csvContent += `User: ${userEmail || 'N/A'}\n`
    csvContent += `Organization: ${userProfile.organization_name || 'N/A'}\n`
    csvContent += `Entry ID: ${entryId}\n`
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`

    // Add each section
    const sections = [
      { title: 'FEED Data', data: formatted.feed },
      { title: 'Manure Management Data', data: formatted.manure },
      { title: 'Energy & Processing Data', data: formatted.energy },
      { title: 'Waste Management Data', data: formatted.waste },
      { title: 'Transport Data', data: formatted.transport }
    ]

    sections.forEach(section => {
      if (section.data && section.data.length > 0) {
        csvContent += `${section.title}\n`
        
        // Add headers
        const headers = Object.keys(section.data[0])
        csvContent += headers.join(',') + '\n'
        
        // Add data rows
        section.data.forEach(item => {
          const row = headers.map(header => `"${item[header] || ''}"`)
          csvContent += row.join(',') + '\n'
        })
        
        csvContent += '\n'
      }
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `submission_${entryId}_${new Date().toISOString().split('T')[0]}.csv`)
  } catch (error) {
    console.error('Error generating CSV:', error)
    alert('Error generating CSV. Please try again.')
  }
}

// Download as Excel
export const downloadAsExcel = async (entryId: string = 'entry_1') => {
  try {
    const data = await getAllAutoSavedData(entryId)
    const userEmail = await getCurrentUserEmail()
    const userProfile = getUserProfile()
    const formatted = formatDataForExport(data)

    const workbook = XLSX.utils.book_new()

    // Create info sheet
    const infoData = [
      ['Submission Report'],
      ['User:', userEmail || 'N/A'],
      ['Organization:', userProfile.organization_name || 'N/A'],
      ['Entry ID:', entryId],
      ['Generated:', new Date().toLocaleDateString()]
    ]
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Info')

    // Add each section as a separate sheet
    const sections = [
      { title: 'FEED', data: formatted.feed },
      { title: 'Manure', data: formatted.manure },
      { title: 'Energy', data: formatted.energy },
      { title: 'Waste', data: formatted.waste },
      { title: 'Transport', data: formatted.transport }
    ]

    sections.forEach(section => {
      if (section.data && section.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(section.data)
        XLSX.utils.book_append_sheet(workbook, worksheet, section.title)
      }
    })

    XLSX.writeFile(workbook, `submission_${entryId}_${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('Error generating Excel:', error)
    alert('Error generating Excel. Please try again.')
  }
}