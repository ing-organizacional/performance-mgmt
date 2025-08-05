import { prisma } from './prisma-client'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

interface EvaluationData {
  id: string
  employee: {
    name: string
    email: string | null
    username: string | null
    department: string | null
    employeeId: string | null
  }
  manager: {
    name: string
    email: string | null
  }
  company: {
    name: string
    code: string
  }
  periodType: string
  periodDate: string
  okrsData: any
  competenciesData: any
  overallRating: number | null
  managerComments: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export async function getEvaluationData(evaluationId: string): Promise<EvaluationData | null> {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          username: true,
          department: true,
          employeeId: true
        }
      },
      manager: {
        select: {
          name: true,
          email: true
        }
      },
      company: {
        select: {
          name: true,
          code: true
        }
      }
    }
  })

  if (!evaluation) return null

  return {
    ...evaluation,
    okrsData: evaluation.okrsData ? JSON.parse(evaluation.okrsData) : {},
    competenciesData: evaluation.competenciesData ? JSON.parse(evaluation.competenciesData) : {}
  }
}

export async function getCompanyEvaluations(
  companyId: string,
  periodType?: string,
  periodDate?: string
): Promise<EvaluationData[]> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      companyId,
      ...(periodType && { periodType }),
      ...(periodDate && { periodDate }),
      status: 'submitted'
    },
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          username: true,
          department: true,
          employeeId: true
        }
      },
      manager: {
        select: {
          name: true,
          email: true
        }
      },
      company: {
        select: {
          name: true,
          code: true
        }
      }
    },
    orderBy: [
      { employee: { department: 'asc' } },
      { employee: { name: 'asc' } }
    ]
  })

  return evaluations.map(evaluation => ({
    ...evaluation,
    okrsData: evaluation.okrsData ? JSON.parse(evaluation.okrsData) : {},
    competenciesData: evaluation.competenciesData ? JSON.parse(evaluation.competenciesData) : {}
  }))
}

export function generatePDF(evaluation: EvaluationData): Buffer {
  const doc = new jsPDF()
  let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.text('Performance Evaluation Report', 20, yPosition)
  yPosition += 15

  // Company and Period Info
  doc.setFontSize(12)
  doc.text(`Company: ${evaluation.company.name}`, 20, yPosition)
  yPosition += 8
  doc.text(`Period: ${evaluation.periodType} ${evaluation.periodDate}`, 20, yPosition)
  yPosition += 8
  doc.text(`Status: ${evaluation.status.toUpperCase()}`, 20, yPosition)
  yPosition += 15

  // Employee Information
  doc.setFontSize(16)
  doc.text('Employee Information', 20, yPosition)
  yPosition += 10

  doc.setFontSize(12)
  doc.text(`Name: ${evaluation.employee.name}`, 20, yPosition)
  yPosition += 8
  
  if (evaluation.employee.email) {
    doc.text(`Email: ${evaluation.employee.email}`, 20, yPosition)
    yPosition += 8
  }
  
  if (evaluation.employee.username) {
    doc.text(`Username: ${evaluation.employee.username}`, 20, yPosition)
    yPosition += 8
  }
  
  if (evaluation.employee.department) {
    doc.text(`Department: ${evaluation.employee.department}`, 20, yPosition)
    yPosition += 8
  }
  
  if (evaluation.employee.employeeId) {
    doc.text(`Employee ID: ${evaluation.employee.employeeId}`, 20, yPosition)
    yPosition += 8
  }

  doc.text(`Manager: ${evaluation.manager.name}`, 20, yPosition)
  yPosition += 15

  // Overall Rating
  if (evaluation.overallRating) {
    doc.setFontSize(16)
    doc.text('Overall Performance Rating', 20, yPosition)
    yPosition += 10

    doc.setFontSize(14)
    const ratingText = getRatingText(evaluation.overallRating)
    doc.text(`${evaluation.overallRating}/5 - ${ratingText}`, 20, yPosition)
    yPosition += 15
  }

  // OKRs Section
  if (evaluation.okrsData && Object.keys(evaluation.okrsData).length > 0) {
    doc.setFontSize(16)
    doc.text('Objectives and Key Results (OKRs)', 20, yPosition)
    yPosition += 10

    Object.entries(evaluation.okrsData).forEach(([key, okr]: [string, any]) => {
      doc.setFontSize(12)
      doc.text(`${okr.title}`, 20, yPosition)
      yPosition += 6
      
      if (okr.rating) {
        doc.text(`Rating: ${okr.rating}/5 - ${getRatingText(okr.rating)}`, 25, yPosition)
        yPosition += 6
      }
      
      if (okr.comment) {
        const lines = doc.splitTextToSize(`Comment: ${okr.comment}`, 160)
        doc.text(lines, 25, yPosition)
        yPosition += (lines.length * 6)
      }
      yPosition += 8
    })
    yPosition += 10
  }

  // Competencies Section
  if (evaluation.competenciesData && Object.keys(evaluation.competenciesData).length > 0) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.text('Competencies', 20, yPosition)
    yPosition += 10

    Object.entries(evaluation.competenciesData).forEach(([key, competency]: [string, any]) => {
      doc.setFontSize(12)
      doc.text(`${competency.title}`, 20, yPosition)
      yPosition += 6
      
      if (competency.rating) {
        doc.text(`Rating: ${competency.rating}/5 - ${getRatingText(competency.rating)}`, 25, yPosition)
        yPosition += 6
      }
      
      if (competency.comment) {
        const lines = doc.splitTextToSize(`Comment: ${competency.comment}`, 160)
        doc.text(lines, 25, yPosition)
        yPosition += (lines.length * 6)
      }
      yPosition += 8
    })
  }

  // Manager Comments
  if (evaluation.managerComments) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(16)
    doc.text('Manager Comments', 20, yPosition)
    yPosition += 10

    doc.setFontSize(12)
    const lines = doc.splitTextToSize(evaluation.managerComments, 160)
    doc.text(lines, 20, yPosition)
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      20,
      290
    )
  }

  return Buffer.from(doc.output('arraybuffer'))
}

export function generateExcel(evaluations: EvaluationData[]): Buffer {
  const workbook = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = evaluations.map(evaluation => ({
    'Employee Name': evaluation.employee.name,
    'Employee ID': evaluation.employee.employeeId || '',
    'Department': evaluation.employee.department || '',
    'Manager': evaluation.manager.name,
    'Period': `${evaluation.periodType} ${evaluation.periodDate}`,
    'Overall Rating': evaluation.overallRating || '',
    'Status': evaluation.status.toUpperCase(),
    'Completion Date': evaluation.updatedAt.toLocaleDateString()
  }))

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Detailed Sheet
  const detailedData: any[] = []
  
  evaluations.forEach(evaluation => {
    // Add OKRs
    if (evaluation.okrsData) {
      Object.entries(evaluation.okrsData).forEach(([key, okr]: [string, any]) => {
        detailedData.push({
          'Employee Name': evaluation.employee.name,
          'Employee ID': evaluation.employee.employeeId || '',
          'Department': evaluation.employee.department || '',
          'Manager': evaluation.manager.name,
          'Period': `${evaluation.periodType} ${evaluation.periodDate}`,
          'Type': 'OKR',
          'Item': okr.title || '',
          'Rating': okr.rating || '',
          'Comment': okr.comment || ''
        })
      })
    }

    // Add Competencies
    if (evaluation.competenciesData) {
      Object.entries(evaluation.competenciesData).forEach(([key, competency]: [string, any]) => {
        detailedData.push({
          'Employee Name': evaluation.employee.name,
          'Employee ID': evaluation.employee.employeeId || '',
          'Department': evaluation.employee.department || '',
          'Manager': evaluation.manager.name,
          'Period': `${evaluation.periodType} ${evaluation.periodDate}`,
          'Type': 'Competency',
          'Item': competency.title || '',
          'Rating': competency.rating || '',
          'Comment': competency.comment || ''
        })
      })
    }
  })

  const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed')

  // Analytics Sheet
  const analyticsData = generateAnalytics(evaluations)
  const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData)
  XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics')

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

function getRatingText(rating: number): string {
  switch (rating) {
    case 1: return 'Needs Improvement'
    case 2: return 'Below Expectations'
    case 3: return 'Meets Expectations'
    case 4: return 'Exceeds Expectations'
    case 5: return 'Outstanding'
    default: return 'Not Rated'
  }
}

function generateAnalytics(evaluations: EvaluationData[]) {
  const analytics = []

  // Rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  evaluations.forEach(evaluation => {
    if (evaluation.overallRating) {
      ratingCounts[evaluation.overallRating as keyof typeof ratingCounts]++
    }
  })

  Object.entries(ratingCounts).forEach(([rating, count]) => {
    analytics.push({
      'Metric': 'Overall Rating Distribution',
      'Category': `${rating} - ${getRatingText(parseInt(rating))}`,
      'Count': count,
      'Percentage': `${((count / evaluations.length) * 100).toFixed(1)}%`
    })
  })

  // Department breakdown
  const departmentCounts: Record<string, number> = {}
  evaluations.forEach(evaluation => {
    const dept = evaluation.employee.department || 'Unknown'
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1
  })

  Object.entries(departmentCounts).forEach(([department, count]) => {
    analytics.push({
      'Metric': 'Department Distribution',
      'Category': department,
      'Count': count,
      'Percentage': `${((count / evaluations.length) * 100).toFixed(1)}%`
    })
  })

  return analytics
}