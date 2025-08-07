import { prisma } from './prisma-client'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

interface EvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  rating: number | null
  comment: string
  level?: string
  createdBy?: string
}

interface AnalyticsData {
  [key: string]: string | number
}

// Removed unused ExcelRowData interface - using dynamic object keys for multilingual support

interface EvaluationData {
  id: string
  managerId: string
  employeeId: string
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
  cycle: {
    name: string
  } | null
  periodType: string
  periodDate: string
  evaluationItemsData: EvaluationItem[]
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
      },
      cycle: {
        select: {
          name: true
        }
      }
    }
  })

  if (!evaluation) return null

  return {
    ...evaluation,
    cycle: evaluation.cycle || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluationItemsData: (evaluation as any).evaluationItemsData ? JSON.parse((evaluation as any).evaluationItemsData) : []
  } as EvaluationData
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
      status: 'completed' // Only include completed evaluations
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
      },
      cycle: {
        select: {
          name: true
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluationItemsData: (evaluation as any).evaluationItemsData ? JSON.parse((evaluation as any).evaluationItemsData) : []
  }) as EvaluationData)
}

function getRatingText(rating: number, language = 'en'): string {
  const translations = {
    en: {
      5: 'Outstanding',
      4: 'Exceeds Expectations', 
      3: 'Meets Expectations',
      2: 'Below Expectations',
      1: 'Needs Improvement',
      default: 'Not Rated'
    },
    es: {
      5: 'Excepcional',
      4: 'Supera las Expectativas',
      3: 'Cumple las Expectativas', 
      2: 'Por Debajo de las Expectativas',
      1: 'Necesita Mejora',
      default: 'No Calificado'
    }
  }
  
  const lang = language === 'es' ? 'es' : 'en'
  return translations[lang][rating as keyof typeof translations[typeof lang]] || translations[lang].default
}

function getRatingColor(rating: number): {r: number, g: number, b: number} {
  // Color scheme matching the app
  switch(rating) {
    case 5: return {r: 34, g: 197, b: 94}   // Green-500 (#22C55E) - Outstanding
    case 4: return {r: 59, g: 130, b: 246}  // Blue-500 (#3B82F6) - Exceeds Expectations  
    case 3: return {r: 107, g: 114, b: 128} // Gray-500 (#6B7280) - Meets Expectations
    case 2: return {r: 249, g: 115, b: 22}  // Orange-500 (#F97316) - Below Expectations
    case 1: return {r: 239, g: 68, b: 68}   // Red-500 (#EF4444) - Needs Improvement
    default: return {r: 107, g: 114, b: 128} // Gray-500 - Not Rated
  }
}

function getPDFLabels(language = 'en') {
  const labels = {
    en: {
      title: 'Performance Evaluation Report',
      company: 'Company',
      period: 'Period', 
      status: 'Status',
      employeeInfo: 'Employee Information',
      name: 'Name',
      email: 'Email',
      username: 'Username',
      department: 'Department',
      employeeId: 'Employee ID',
      manager: 'Manager',
      overallRating: 'Overall Performance Rating',
      evaluationItems: 'Evaluation Items',
      okr: 'OKR',
      competency: 'Competency',
      rating: 'Rating',
      comment: 'Comment',
      managerComments: 'Manager Comments',
      generatedOn: 'Generated on',
      page: 'Page',
      of: 'of',
      noItemsAvailable: 'No evaluation items available for this evaluation.'
    },
    es: {
      title: 'Reporte de Evaluación de Desempeño',
      company: 'Empresa',
      period: 'Período',
      status: 'Estado', 
      employeeInfo: 'Información del Empleado',
      name: 'Nombre',
      email: 'Correo Electrónico',
      username: 'Usuario',
      department: 'Departamento',
      employeeId: 'ID de Empleado',
      manager: 'Gerente',
      overallRating: 'Calificación General de Desempeño',
      evaluationItems: 'Elementos de Evaluación',
      okr: 'OKR',
      competency: 'Competencia',
      rating: 'Calificación',
      comment: 'Comentario', 
      managerComments: 'Comentarios del Gerente',
      generatedOn: 'Generado el',
      page: 'Página',
      of: 'de',
      noItemsAvailable: 'No hay elementos de evaluación disponibles para esta evaluación.'
    }
  }
  
  return language === 'es' ? labels.es : labels.en
}

export function generatePDF(evaluation: EvaluationData, language = 'en'): Buffer {
  try {
    console.log('Starting PDF generation with evaluation:', {
      id: evaluation.id,
      employeeName: evaluation.employee?.name,
      hasEvaluationItems: !!evaluation.evaluationItemsData,
      itemsCount: evaluation.evaluationItemsData?.length,
      language
    })

    const doc = new jsPDF()
    const labels = getPDFLabels(language)
    let yPosition = 20

    // Header - styled banner
    doc.setFillColor(59, 130, 246) // Blue background (#3B82F6)
    doc.rect(10, yPosition - 5, 190, 25, 'F')
    doc.setTextColor(255, 255, 255) // White text
    doc.setFontSize(20)
    doc.text(labels.title, 15, yPosition + 12)
    yPosition += 25

    // Company and Period Info card
    doc.setDrawColor(229, 231, 235) // Gray border (#E5E7EB)
    doc.setFillColor(249, 250, 251) // Light gray background (#F9FAFB)
    doc.rect(20, yPosition, 170, 30, 'FD')
    
    doc.setTextColor(75, 85, 99) // Gray-600 (#4B5563) for labels
    doc.setFontSize(12)
    doc.text(`${labels.company}:`, 25, yPosition + 8)
    doc.setTextColor(17, 24, 39) // Gray-900 (#111827) for values
    doc.text(`${evaluation.company?.name || 'N/A'}`, 70, yPosition + 8)
    
    doc.setTextColor(75, 85, 99)
    doc.text(`${labels.period}:`, 25, yPosition + 16)
    doc.setTextColor(17, 24, 39)
    doc.text(`${evaluation.periodType || 'N/A'} ${evaluation.periodDate || ''}`, 70, yPosition + 16)
    
    doc.setTextColor(75, 85, 99)
    doc.text(`${labels.status}:`, 25, yPosition + 24)
    doc.setTextColor(34, 197, 94) // Green for completed status
    doc.text(`${evaluation.status?.toUpperCase() || 'N/A'}`, 70, yPosition + 24)
    
    doc.setTextColor(0, 0, 0) // Reset to black
    yPosition += 40

    // Employee Information - styled card with blue header
    doc.setFillColor(59, 130, 246) // Blue background
    doc.rect(20, yPosition, 170, 15, 'F')
    doc.setTextColor(255, 255, 255) // White text
    doc.setFontSize(16)
    doc.text(labels.employeeInfo, 25, yPosition + 10)
    yPosition += 20

    // Employee details card
    let employeeCardHeight = 30
    if (evaluation.employee?.email) employeeCardHeight += 6
    if (evaluation.employee?.username) employeeCardHeight += 6
    if (evaluation.employee?.department) employeeCardHeight += 6
    if (evaluation.employee?.employeeId) employeeCardHeight += 6
    
    doc.setDrawColor(59, 130, 246) // Blue border
    doc.setFillColor(239, 246, 255) // Light blue background (#EFF6FF)
    doc.rect(20, yPosition, 170, employeeCardHeight, 'FD')
    
    doc.setTextColor(59, 130, 246) // Blue text for employee name
    doc.setFontSize(14)
    doc.text(`${evaluation.employee?.name || 'N/A'}`, 25, yPosition + 10)
    
    let detailY = yPosition + 20
    doc.setFontSize(12)
    
    if (evaluation.employee?.email) {
      doc.setTextColor(75, 85, 99)
      doc.text(`${labels.email}:`, 25, detailY)
      doc.setTextColor(17, 24, 39)
      doc.text(`${evaluation.employee.email}`, 70, detailY)
      detailY += 6
    }
    
    if (evaluation.employee?.username) {
      doc.setTextColor(75, 85, 99)
      doc.text(`${labels.username}:`, 25, detailY)
      doc.setTextColor(17, 24, 39)
      doc.text(`${evaluation.employee.username}`, 70, detailY)
      detailY += 6
    }
    
    if (evaluation.employee?.department) {
      doc.setTextColor(75, 85, 99)
      doc.text(`${labels.department}:`, 25, detailY)
      doc.setTextColor(17, 24, 39)
      doc.text(`${evaluation.employee.department}`, 70, detailY)
      detailY += 6
    }
    
    if (evaluation.employee?.employeeId) {
      doc.setTextColor(75, 85, 99)
      doc.text(`${labels.employeeId}:`, 25, detailY)
      doc.setTextColor(17, 24, 39)
      doc.text(`${evaluation.employee.employeeId}`, 70, detailY)
      detailY += 6
    }

    doc.setTextColor(75, 85, 99)
    doc.text(`${labels.manager}:`, 25, detailY)
    doc.setTextColor(17, 24, 39)
    doc.text(`${evaluation.manager?.name || 'N/A'}`, 70, detailY)
    
    doc.setTextColor(0, 0, 0) // Reset to black
    yPosition += employeeCardHeight + 15

    // Calculate OKR and Competency averages first
    let okrSum = 0
    let competencySum = 0
    let okrCount = 0
    let competencyCount = 0

    if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
      evaluation.evaluationItemsData.forEach(item => {
        if (item.rating) {
          if (item.type === 'okr') {
            okrSum += item.rating
            okrCount++
          } else if (item.type === 'competency') {
            competencySum += item.rating
            competencyCount++
          }
        }
      })
    }

    // Individual Averages Section - styled card
    if (okrCount > 0 || competencyCount > 0) {
      doc.setDrawColor(59, 130, 246) // Blue border
      doc.setFillColor(239, 246, 255) // Light blue background (#EFF6FF)
      doc.rect(20, yPosition, 170, 30, 'FD')
      
      doc.setTextColor(59, 130, 246) // Blue text
      doc.setFontSize(14)
      const averagesLabel = language === 'es' ? 'Promedios Individuales' : 'Individual Averages'
      doc.text(averagesLabel, 25, yPosition + 10)
      
      doc.setFontSize(12)
      let avgY = yPosition + 20
      
      if (okrCount > 0) {
        const okrAverage = (okrSum / okrCount).toFixed(1)
        doc.setTextColor(17, 24, 39)
        doc.text(`${language === 'es' ? 'OKRs' : 'OKR Average'}:`, 25, avgY)
        
        const avgRating = Math.round(okrSum / okrCount)
        const ratingColor = getRatingColor(avgRating)
        doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
        doc.text(`${okrAverage}/5`, 90, avgY)
        avgY += 6
      }
      
      if (competencyCount > 0) {
        const competencyAverage = (competencySum / competencyCount).toFixed(1)
        doc.setTextColor(17, 24, 39)
        doc.text(`${language === 'es' ? 'Competencias' : 'Competencies'}:`, 25, avgY)
        
        const avgRating = Math.round(competencySum / competencyCount)
        const ratingColor = getRatingColor(avgRating)
        doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
        doc.text(`${competencyAverage}/5`, 90, avgY)
      }
      
      doc.setTextColor(0, 0, 0) // Reset to black
      yPosition += 35
    }

    // Overall Rating - prominent card
    if (evaluation.overallRating) {
      const ratingColor = getRatingColor(evaluation.overallRating)
      doc.setDrawColor(ratingColor.r, ratingColor.g, ratingColor.b)
      doc.setFillColor(255, 255, 255) // White background
      doc.rect(20, yPosition, 170, 20, 'FD')
      
      doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
      doc.setFontSize(16)
      const ratingText = `${labels.overallRating}: ${evaluation.overallRating}/5 - ${getRatingText(evaluation.overallRating, language)}`
      doc.text(ratingText, 25, yPosition + 13)
      
      doc.setTextColor(0, 0, 0) // Reset to black
      yPosition += 25
    }

    // Evaluation Items Section - beautifully styled
    if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
      // Section header
      doc.setFillColor(59, 130, 246) // Blue background
      doc.rect(20, yPosition, 170, 15, 'F')
      doc.setTextColor(255, 255, 255) // White text
      doc.setFontSize(16)
      doc.text(labels.evaluationItems, 25, yPosition + 10)
      yPosition += 20
      
      doc.setTextColor(0, 0, 0) // Reset to black

      evaluation.evaluationItemsData.forEach((item: EvaluationItem, index: number) => {
        console.log(`Processing evaluation item ${index + 1}:`, {
          title: item.title,
          type: item.type,
          rating: item.rating,
          hasComment: !!item.comment
        })
        
        // Check if we need a new page before adding content
        if (yPosition > 230) {
          doc.addPage()
          yPosition = 20
        }

        // Item card
        const itemHeight = item.comment ? 45 : 25
        doc.setDrawColor(229, 231, 235) // Gray border
        doc.setFillColor(255, 255, 255) // White background
        doc.rect(20, yPosition, 170, itemHeight, 'FD')
        
        // Item type badge
        const isOkr = item.type === 'okr'
        const badgeColor = isOkr ? {r: 168, g: 85, b: 247} : {r: 16, g: 185, b: 129} // Purple for OKR, Emerald for Competency
        doc.setFillColor(badgeColor.r, badgeColor.g, badgeColor.b)
        doc.rect(22, yPosition + 2, 25, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        const itemType = isOkr ? 'OKR' : 'COMP'
        doc.text(itemType, 24, yPosition + 7)
        
        // Item title
        doc.setTextColor(17, 24, 39) // Dark text
        doc.setFontSize(12)
        const titleLines = doc.splitTextToSize(item.title || 'N/A', 130)
        doc.text(titleLines, 50, yPosition + 8)
        
        // Rating with color coding
        if (item.rating) {
          const ratingColor = getRatingColor(item.rating)
          doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
          doc.setFontSize(11)
          const ratingText = `${item.rating}/5 - ${getRatingText(item.rating, language)}`
          doc.text(ratingText, 25, yPosition + 18)
        }
        
        // Comment section
        if (item.comment && item.comment.trim()) {
          doc.setTextColor(75, 85, 99) // Gray text
          doc.setFontSize(10)
          const commentLines = doc.splitTextToSize(item.comment.trim(), 160)
          doc.text(commentLines, 25, yPosition + 28)
        }
        
        yPosition += itemHeight + 5
      })
      yPosition += 10
    } else {
      // Add a styled note if no evaluation items
      doc.setDrawColor(229, 231, 235)
      doc.setFillColor(249, 250, 251)
      doc.rect(20, yPosition, 170, 15, 'FD')
      doc.setTextColor(107, 114, 128) // Gray text
      doc.setFontSize(12)
      doc.text(labels.noItemsAvailable, 25, yPosition + 10)
      doc.setTextColor(0, 0, 0)
      yPosition += 20
    }

    // Manager Comments - styled section
    if (evaluation.managerComments) {
      // Check if we need a new page
      if (yPosition > 230) {
        doc.addPage()
        yPosition = 20
      }

      // Header
      doc.setFillColor(245, 158, 11) // Amber background (#F59E0B)
      doc.rect(20, yPosition, 170, 15, 'F')
      doc.setTextColor(255, 255, 255) // White text
      doc.setFontSize(16)
      doc.text(labels.managerComments, 25, yPosition + 10)
      yPosition += 20
      
      // Comments card
      const commentLines = doc.splitTextToSize(evaluation.managerComments, 160)
      const commentHeight = Math.max(20, commentLines.length * 6 + 10)
      
      doc.setDrawColor(245, 158, 11) // Amber border
      doc.setFillColor(254, 252, 232) // Amber background light (#FEFCE8)
      doc.rect(20, yPosition, 170, commentHeight, 'FD')
      
      doc.setTextColor(120, 53, 15) // Amber-900 text (#78350F)
      doc.setFontSize(12)
      doc.text(commentLines, 25, yPosition + 8)
      yPosition += commentHeight + 10
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(
        `${labels.generatedOn} ${new Date().toLocaleDateString()} - ${labels.page} ${i} ${labels.of} ${pageCount}`,
        20,
        290
      )
    }

    // Generate PDF as a buffer with enhanced error handling
    console.log('Generating PDF output...')
    const pdfOutput = doc.output('arraybuffer')
    console.log('PDF output generated, size:', pdfOutput.byteLength, 'bytes')
    
    if (pdfOutput.byteLength === 0) {
      throw new Error('Generated PDF is empty (0 bytes)')
    }
    
    const buffer = Buffer.from(pdfOutput)
    console.log('PDF Buffer created, size:', buffer.length, 'bytes')
    
    return buffer
  } catch (error) {
    console.error('Error in PDF generation:', error)
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function generateDepartmentDetailedPDF(evaluations: EvaluationData[], language = 'en', departmentName = 'Department'): Buffer {
  try {
    console.log('Starting department detailed PDF generation:', {
      evaluationCount: evaluations.length,
      language,
      departmentName
    })

    const doc = new jsPDF()
    const labels = getPDFLabels(language)
    let yPosition = 20

    // Executive Dashboard Hero Header - Gradient Banner
    doc.setFillColor(59, 130, 246) // Blue gradient start
    doc.rect(0, yPosition - 10, 210, 40, 'F')
    
    // Add subtle gradient effect with overlays
    doc.setFillColor(79, 70, 229) // Purple overlay (#4F46E5)
    doc.rect(0, yPosition - 10, 210, 20, 'F')
    
    doc.setTextColor(255, 255, 255) // White text
    doc.setFontSize(24)
    const title = language === 'es' 
      ? `${departmentName}`
      : `${departmentName} Department`
    doc.text(title, 20, yPosition + 5)
    
    doc.setFontSize(14)
    const subtitle = language === 'es' 
      ? `Dashboard Ejecutivo de Performance`
      : `Executive Performance Dashboard`
    doc.text(subtitle, 20, yPosition + 18)
    yPosition += 45

    // Key Metrics Cards Grid (3 columns)
    const cardWidth = 50
    const cardHeight = 25
    const cardSpacing = 10
    
    // Card 1: Total Evaluations
    doc.setDrawColor(59, 130, 246)
    doc.setFillColor(239, 246, 255) // Light blue (#EFF6FF)
    doc.rect(20, yPosition, cardWidth, cardHeight, 'FD')
    
    doc.setTextColor(59, 130, 246)
    doc.setFontSize(20)
    doc.text(`${evaluations.length}`, 25, yPosition + 12)
    doc.setFontSize(10)
    doc.text(language === 'es' ? 'EVALUACIONES' : 'EVALUATIONS', 25, yPosition + 20)
    
    // Card 2: Completion Rate
    const completionRate = evaluations.length > 0 ? 100 : 0 // All evaluations are completed (status filter)
    const completionColor = completionRate === 100 ? {r: 34, g: 197, b: 94} : {r: 249, g: 115, b: 22}
    
    doc.setDrawColor(completionColor.r, completionColor.g, completionColor.b)
    doc.setFillColor(240, 253, 244) // Light green (#F0FDF4)
    doc.rect(20 + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight, 'FD')
    
    doc.setTextColor(completionColor.r, completionColor.g, completionColor.b)
    doc.setFontSize(20)
    doc.text(`${completionRate}%`, 25 + cardWidth + cardSpacing, yPosition + 12)
    doc.setFontSize(10)
    doc.text(language === 'es' ? 'COMPLETADO' : 'COMPLETED', 25 + cardWidth + cardSpacing, yPosition + 20)
    
    // Card 3: Team Size
    const teamSize = evaluations.length
    
    doc.setDrawColor(168, 85, 247) // Purple (#A855F7)
    doc.setFillColor(250, 245, 255) // Light purple (#FAF5FF)
    doc.rect(20 + (cardWidth + cardSpacing) * 2, yPosition, cardWidth, cardHeight, 'FD')
    
    doc.setTextColor(168, 85, 247)
    doc.setFontSize(20)
    doc.text(`${teamSize}`, 25 + (cardWidth + cardSpacing) * 2, yPosition + 12)
    doc.setFontSize(10)
    doc.text(language === 'es' ? 'MIEMBROS' : 'TEAM MEMBERS', 25 + (cardWidth + cardSpacing) * 2, yPosition + 20)
    
    doc.setTextColor(0, 0, 0) // Reset to black
    yPosition += 35

    // Performance Distribution and Averages
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRated = 0
    let teamOkrSum = 0
    let teamCompetencySum = 0
    let teamOkrCount = 0
    let teamCompetencyCount = 0

    evaluations.forEach(evaluation => {
      if (evaluation.overallRating) {
        ratingCounts[evaluation.overallRating as keyof typeof ratingCounts]++
        totalRated++
      }

      // Calculate OKR and Competency averages for the team
      if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
        evaluation.evaluationItemsData.forEach(item => {
          if (item.rating) {
            if (item.type === 'okr') {
              teamOkrSum += item.rating
              teamOkrCount++
            } else if (item.type === 'competency') {
              teamCompetencySum += item.rating
              teamCompetencyCount++
            }
          }
        })
      }
    })

    // Performance Analytics Dashboard Section
    doc.setFillColor(59, 130, 246) // Blue header
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    const analyticsLabel = language === 'es' ? 'ANÁLISIS DE PERFORMANCE' : 'PERFORMANCE ANALYTICS'
    doc.text(analyticsLabel, 25, yPosition + 12)
    yPosition += 25

    // Team Averages Cards (Horizontal Layout)
    const avgCardWidth = 52
    const avgCardHeight = 30
    const avgSpacing = 6
    
    doc.setTextColor(0, 0, 0)
    
    // OKR Average Card
    if (teamOkrCount > 0) {
      const teamOkrAverage = (teamOkrSum / teamOkrCount)
      const okrRatingColor = getRatingColor(Math.round(teamOkrAverage))
      
      doc.setDrawColor(okrRatingColor.r, okrRatingColor.g, okrRatingColor.b)
      doc.setFillColor(255, 255, 255)
      doc.rect(20, yPosition, avgCardWidth, avgCardHeight, 'FD')
      
      // Create visual progress bar for OKR
      const progressWidth = (teamOkrAverage / 5) * (avgCardWidth - 10)
      doc.setFillColor(okrRatingColor.r, okrRatingColor.g, okrRatingColor.b)
      doc.rect(23, yPosition + 20, progressWidth, 4, 'F')
      
      doc.setTextColor(okrRatingColor.r, okrRatingColor.g, okrRatingColor.b)
      doc.setFontSize(18)
      doc.text(`${teamOkrAverage.toFixed(1)}`, 25, yPosition + 12)
      doc.setFontSize(8)
      doc.text('/5', 42, yPosition + 12)
      doc.setFontSize(10)
      doc.text(language === 'es' ? 'OKRs' : 'OKR AVG', 25, yPosition + 18)
    }
    
    // Competency Average Card
    if (teamCompetencyCount > 0) {
      const teamCompetencyAverage = (teamCompetencySum / teamCompetencyCount)
      const compRatingColor = getRatingColor(Math.round(teamCompetencyAverage))
      
      const compCardX = 20 + avgCardWidth + avgSpacing
      doc.setDrawColor(compRatingColor.r, compRatingColor.g, compRatingColor.b)
      doc.setFillColor(255, 255, 255)
      doc.rect(compCardX, yPosition, avgCardWidth, avgCardHeight, 'FD')
      
      // Create visual progress bar for Competency
      const progressWidth = (teamCompetencyAverage / 5) * (avgCardWidth - 10)
      doc.setFillColor(compRatingColor.r, compRatingColor.g, compRatingColor.b)
      doc.rect(compCardX + 3, yPosition + 20, progressWidth, 4, 'F')
      
      doc.setTextColor(compRatingColor.r, compRatingColor.g, compRatingColor.b)
      doc.setFontSize(18)
      doc.text(`${teamCompetencyAverage.toFixed(1)}`, compCardX + 5, yPosition + 12)
      doc.setFontSize(8)
      doc.text('/5', compCardX + 22, yPosition + 12)
      doc.setFontSize(10)
      doc.text(language === 'es' ? 'COMPETENCIAS' : 'COMPETENCIES', compCardX + 5, yPosition + 18)
    }
    
    // Overall Average Card
    if (totalRated > 0) {
      const overallTeamAverage = evaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / totalRated
      const overallRatingColor = getRatingColor(Math.round(overallTeamAverage))
      
      const overallCardX = 20 + (avgCardWidth + avgSpacing) * 2
      doc.setDrawColor(overallRatingColor.r, overallRatingColor.g, overallRatingColor.b)
      doc.setFillColor(255, 255, 255)
      doc.rect(overallCardX, yPosition, avgCardWidth, avgCardHeight, 'FD')
      
      // Create visual progress bar for Overall
      const progressWidth = (overallTeamAverage / 5) * (avgCardWidth - 10)
      doc.setFillColor(overallRatingColor.r, overallRatingColor.g, overallRatingColor.b)
      doc.rect(overallCardX + 3, yPosition + 20, progressWidth, 4, 'F')
      
      doc.setTextColor(overallRatingColor.r, overallRatingColor.g, overallRatingColor.b)
      doc.setFontSize(18)
      doc.text(`${overallTeamAverage.toFixed(1)}`, overallCardX + 5, yPosition + 12)
      doc.setFontSize(8)
      doc.text('/5', overallCardX + 22, yPosition + 12)
      doc.setFontSize(10)
      doc.text(language === 'es' ? 'GENERAL' : 'OVERALL', overallCardX + 5, yPosition + 18)
    }
    
    yPosition += 40

    if (totalRated > 0) {
      // Rating Distribution Visual Section
      doc.setFillColor(16, 185, 129) // Emerald header
      doc.rect(20, yPosition, 170, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      const distributionLabel = language === 'es' ? 'DISTRIBUCIÓN DE CALIFICACIONES' : 'RATING DISTRIBUTION'
      doc.text(distributionLabel, 25, yPosition + 12)
      yPosition += 25

      // Create visual bar chart for rating distribution
      const maxBarWidth = 140
      const barHeight = 12
      const barSpacing = 3
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      
      const ratings = [5, 4, 3, 2, 1]
      ratings.forEach((rating: number) => {
        const count = ratingCounts[rating as keyof typeof ratingCounts]
        if (count > 0) {
          const percentage = (count / totalRated) * 100
          const barWidth = (percentage / 100) * maxBarWidth
          const ratingColor = getRatingColor(rating)
          const ratingText = getRatingText(rating, language)
          
          // Rating label
          doc.setTextColor(75, 85, 99)
          doc.text(`${rating}/5 ${ratingText}`, 25, yPosition + 8)
          
          // Visual bar
          doc.setFillColor(ratingColor.r, ratingColor.g, ratingColor.b)
          doc.rect(25, yPosition + 10, barWidth, barHeight, 'F')
          
          // Bar outline
          doc.setDrawColor(229, 231, 235)
          doc.rect(25, yPosition + 10, maxBarWidth, barHeight, 'S')
          
          // Count and percentage
          doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
          doc.setFontSize(9)
          doc.text(`${count} (${percentage.toFixed(1)}%)`, 25 + maxBarWidth + 5, yPosition + 18)
          
          yPosition += barHeight + barSpacing + 8
        }
      })
      yPosition += 10
    }

    // Team Composition Section
    doc.setFillColor(245, 158, 11) // Amber header
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    const teamLabel = language === 'es' ? 'COMPOSICIÓN DEL EQUIPO' : 'TEAM COMPOSITION'
    doc.text(teamLabel, 25, yPosition + 12)
    yPosition += 25

    const teamManagers = evaluations.filter(e => e.employee.name === e.manager?.name).length
    const teamMembers = evaluations.length - teamManagers
    
    // Team composition cards
    const compCardWidth = 70
    const compCardHeight = 25
    
    // Managers card
    if (teamManagers > 0) {
      doc.setDrawColor(168, 85, 247) // Purple
      doc.setFillColor(250, 245, 255) // Light purple
      doc.rect(25, yPosition, compCardWidth, compCardHeight, 'FD')
      
      doc.setTextColor(168, 85, 247)
      doc.setFontSize(16)
      doc.text(`${teamManagers}`, 30, yPosition + 12)
      doc.setFontSize(10)
      doc.text(language === 'es' ? 'GERENTES' : 'MANAGERS', 30, yPosition + 20)
    }
    
    // Team members card
    const membersCardX = 25 + compCardWidth + 10
    doc.setDrawColor(16, 185, 129) // Emerald
    doc.setFillColor(236, 253, 245) // Light emerald
    doc.rect(membersCardX, yPosition, compCardWidth, compCardHeight, 'FD')
    
    doc.setTextColor(16, 185, 129)
    doc.setFontSize(16)
    doc.text(`${teamMembers}`, membersCardX + 5, yPosition + 12)
    doc.setFontSize(10)
    doc.text(language === 'es' ? 'EMPLEADOS' : 'EMPLOYEES', membersCardX + 5, yPosition + 20)
    
    doc.setTextColor(0, 0, 0) // Reset to black
    yPosition += 35
    
    // Key Insights Panel
    doc.setFillColor(99, 102, 241) // Indigo header
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    const insightsLabel = language === 'es' ? 'INSIGHTS CLAVE' : 'KEY INSIGHTS'
    doc.text(insightsLabel, 25, yPosition + 12)
    yPosition += 25
    
    // Generate insights based on data
    const insights = []
    const topPerformers = evaluations.filter(e => e.overallRating && e.overallRating >= 4).length
    const needsAttention = evaluations.filter(e => e.overallRating && e.overallRating <= 2).length
    
    if (topPerformers > 0) {
      insights.push({
        type: 'success',
        text: language === 'es' 
          ? `${topPerformers} empleados con alto rendimiento (4+ estrellas)`
          : `${topPerformers} high performers (4+ stars)`
      })
    }
    
    if (needsAttention > 0) {
      insights.push({
        type: 'warning',
        text: language === 'es'
          ? `${needsAttention} empleados necesitan atención (≤2 estrellas)`
          : `${needsAttention} employees need attention (≤2 stars)`
      })
    } else {
      insights.push({
        type: 'success',
        text: language === 'es'
          ? `Excelente: No hay empleados con calificaciones críticas`
          : `Excellent: No employees with critical ratings`
      })
    }
    
    // Display insights
    insights.forEach(insight => {
      const insightColor = insight.type === 'success' 
        ? {r: 34, g: 197, b: 94, bg: {r: 240, g: 253, b: 244}} // Green
        : {r: 249, g: 115, b: 22, bg: {r: 255, g: 247, b: 237}} // Orange
      
      doc.setDrawColor(insightColor.r, insightColor.g, insightColor.b)
      doc.setFillColor(insightColor.bg.r, insightColor.bg.g, insightColor.bg.b)
      doc.rect(25, yPosition, 160, 15, 'FD')
      
      doc.setTextColor(insightColor.r, insightColor.g, insightColor.b)
      doc.setFontSize(11)
      doc.text(insight.text, 30, yPosition + 10)
      yPosition += 20
    })
    
    doc.setTextColor(0, 0, 0) // Reset to black

    // Always add page break after department summary
    doc.addPage()
    yPosition = 20

    // Individual Evaluations Section Header
    doc.setFontSize(16)
    const individualLabel = language === 'es' ? 'Evaluaciones Individuales' : 'Individual Evaluations'
    doc.text(individualLabel, 20, yPosition)
    yPosition += 15

    // Process each evaluation with FULL details
    evaluations.forEach((evaluation, index) => {
      // Start each employee on a new page (except the first one)
      if (index > 0) {
        doc.addPage()
        yPosition = 20
      }

      // Employee header card - matching app design
      doc.setFillColor(59, 130, 246) // Blue header (#3B82F6)
      doc.rect(20, yPosition, 170, 25, 'F')
      
      doc.setTextColor(255, 255, 255) // White text
      doc.setFontSize(18)
      doc.text(`${evaluation.employee?.name || 'N/A'}`, 25, yPosition + 17)
      
      doc.setTextColor(0, 0, 0) // Reset to black text
      yPosition += 30

      // Employee details card
      doc.setDrawColor(229, 231, 235) // Gray border (#E5E7EB)
      doc.setFillColor(249, 250, 251) // Light gray background (#F9FAFB)
      doc.rect(20, yPosition, 170, 35, 'FD')
      
      doc.setFontSize(12)
      let detailY = yPosition + 8
      
      if (evaluation.employee?.department) {
        doc.setTextColor(75, 85, 99) // Gray-600 (#4B5563)
        doc.text(`${labels.department}:`, 25, detailY)
        doc.setTextColor(17, 24, 39) // Gray-900 (#111827)
        doc.text(`${evaluation.employee.department}`, 70, detailY)
        detailY += 6
      }
      
      if (evaluation.employee?.email) {
        doc.setTextColor(75, 85, 99)
        doc.text(`${labels.email}:`, 25, detailY)
        doc.setTextColor(17, 24, 39)
        doc.text(`${evaluation.employee.email}`, 70, detailY)
        detailY += 6
      }
      
      if (evaluation.manager?.name) {
        doc.setTextColor(75, 85, 99)
        doc.text(`${labels.manager}:`, 25, detailY)
        doc.setTextColor(17, 24, 39)
        doc.text(`${evaluation.manager.name}`, 70, detailY)
        detailY += 6
      }
      
      // Status with color coding
      doc.setTextColor(75, 85, 99)
      doc.text(`${labels.status}:`, 25, detailY)
      doc.setTextColor(34, 197, 94) // Green for completed (#22C55E)
      doc.text(`${evaluation.status?.toUpperCase() || 'N/A'}`, 70, detailY)
      
      doc.setTextColor(0, 0, 0) // Reset to black
      yPosition += 40

      // Calculate individual OKR and Competency averages
      let individualOkrSum = 0
      let individualCompetencySum = 0
      let individualOkrCount = 0
      let individualCompetencyCount = 0

      if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
        evaluation.evaluationItemsData.forEach(item => {
          if (item.rating) {
            if (item.type === 'okr') {
              individualOkrSum += item.rating
              individualOkrCount++
            } else if (item.type === 'competency') {
              individualCompetencySum += item.rating
              individualCompetencyCount++
            }
          }
        })
      }

      // Individual Averages Section - styled card
      doc.setDrawColor(59, 130, 246) // Blue border
      doc.setFillColor(239, 246, 255) // Light blue background (#EFF6FF)
      doc.rect(20, yPosition, 170, 30, 'FD')
      
      doc.setTextColor(59, 130, 246) // Blue text
      doc.setFontSize(14)
      const individualAveragesLabel = language === 'es' ? 'Promedios Individuales' : 'Individual Averages'
      doc.text(individualAveragesLabel, 25, yPosition + 10)
      
      doc.setFontSize(12)
      let avgY = yPosition + 20
      
      if (individualOkrCount > 0) {
        const individualOkrAverage = (individualOkrSum / individualOkrCount).toFixed(1)
        doc.setTextColor(17, 24, 39) // Dark text for label
        doc.text(`${language === 'es' ? 'OKRs' : 'OKR Average'}:`, 25, avgY)
        
        // Color-coded rating
        const avgRating = Math.round(individualOkrSum / individualOkrCount)
        const ratingColor = getRatingColor(avgRating)
        doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
        doc.text(`${individualOkrAverage}/5`, 90, avgY)
        avgY += 6
      }
      
      if (individualCompetencyCount > 0) {
        const individualCompetencyAverage = (individualCompetencySum / individualCompetencyCount).toFixed(1)
        doc.setTextColor(17, 24, 39)
        doc.text(`${language === 'es' ? 'Competencias' : 'Competencies'}:`, 25, avgY)
        
        // Color-coded rating
        const avgRating = Math.round(individualCompetencySum / individualCompetencyCount)
        const ratingColor = getRatingColor(avgRating)
        doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
        doc.text(`${individualCompetencyAverage}/5`, 90, avgY)
      }
      
      doc.setTextColor(0, 0, 0) // Reset to black
      yPosition += 35

      // Overall Rating - prominent card
      if (evaluation.overallRating) {
        const ratingColor = getRatingColor(evaluation.overallRating)
        doc.setDrawColor(ratingColor.r, ratingColor.g, ratingColor.b)
        doc.setFillColor(255, 255, 255) // White background
        doc.rect(20, yPosition, 170, 20, 'FD')
        
        doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
        doc.setFontSize(16)
        const ratingText = `${labels.overallRating}: ${evaluation.overallRating}/5 - ${getRatingText(evaluation.overallRating, language)}`
        doc.text(ratingText, 25, yPosition + 13)
        
        doc.setTextColor(0, 0, 0) // Reset to black
        yPosition += 25
      }

      // Detailed evaluation items
      if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
        // Section header
        doc.setFillColor(59, 130, 246) // Blue background
        doc.rect(20, yPosition, 170, 15, 'F')
        doc.setTextColor(255, 255, 255) // White text
        doc.setFontSize(14)
        doc.text(labels.evaluationItems, 25, yPosition + 10)
        yPosition += 20
        
        doc.setTextColor(0, 0, 0) // Reset to black

        evaluation.evaluationItemsData.forEach((item: EvaluationItem) => {
          // Check if we need a new page
          if (yPosition > 230) {
            doc.addPage()
            yPosition = 20
          }

          // Item card
          const itemHeight = item.comment ? 45 : 25
          doc.setDrawColor(229, 231, 235) // Gray border
          doc.setFillColor(255, 255, 255) // White background
          doc.rect(20, yPosition, 170, itemHeight, 'FD')
          
          // Item type badge
          const isOkr = item.type === 'okr'
          const badgeColor = isOkr ? {r: 168, g: 85, b: 247} : {r: 16, g: 185, b: 129} // Purple for OKR, Emerald for Competency
          doc.setFillColor(badgeColor.r, badgeColor.g, badgeColor.b)
          doc.rect(22, yPosition + 2, 25, 8, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(8)
          const itemType = isOkr ? 'OKR' : 'COMP'
          doc.text(itemType, 24, yPosition + 7)
          
          // Item title
          doc.setTextColor(17, 24, 39) // Dark text
          doc.setFontSize(12)
          const titleLines = doc.splitTextToSize(item.title || 'N/A', 130)
          doc.text(titleLines, 50, yPosition + 8)
          
          // Rating with color coding
          if (item.rating) {
            const ratingColor = getRatingColor(item.rating)
            doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b)
            doc.setFontSize(11)
            const ratingText = `${item.rating}/5 - ${getRatingText(item.rating, language)}`
            doc.text(ratingText, 25, yPosition + 18)
          }
          
          // Comment section
          if (item.comment && item.comment.trim()) {
            doc.setTextColor(75, 85, 99) // Gray text
            doc.setFontSize(10)
            const commentLines = doc.splitTextToSize(item.comment.trim(), 160)
            doc.text(commentLines, 25, yPosition + 28)
          }
          
          yPosition += itemHeight + 5
        })
        yPosition += 10
      }

      // Manager Comments - styled section
      if (evaluation.managerComments) {
        // Check if we need a new page
        if (yPosition > 230) {
          doc.addPage()
          yPosition = 20
        }

        // Header
        doc.setFillColor(245, 158, 11) // Amber background (#F59E0B)
        doc.rect(20, yPosition, 170, 15, 'F')
        doc.setTextColor(255, 255, 255) // White text
        doc.setFontSize(14)
        doc.text(labels.managerComments, 25, yPosition + 10)
        yPosition += 20
        
        // Comments card
        const commentLines = doc.splitTextToSize(evaluation.managerComments, 160)
        const commentHeight = Math.max(20, commentLines.length * 6 + 10)
        
        doc.setDrawColor(245, 158, 11) // Amber border
        doc.setFillColor(254, 252, 232) // Amber background light (#FEFCE8)
        doc.rect(20, yPosition, 170, commentHeight, 'FD')
        
        doc.setTextColor(120, 53, 15) // Amber-900 text (#78350F)
        doc.setFontSize(12)
        doc.text(commentLines, 25, yPosition + 8)
        yPosition += commentHeight + 10
      }

      yPosition += 15 // Extra space between evaluations
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(
        `${labels.generatedOn} ${new Date().toLocaleDateString()} - ${labels.page} ${i} ${labels.of} ${pageCount}`,
        20,
        290
      )
    }

    // Generate PDF as a buffer
    console.log('Generating department detailed PDF output...')
    const pdfOutput = doc.output('arraybuffer')
    console.log('Department detailed PDF output generated, size:', pdfOutput.byteLength, 'bytes')
    
    if (pdfOutput.byteLength === 0) {
      throw new Error('Generated PDF is empty (0 bytes)')
    }
    
    const buffer = Buffer.from(pdfOutput)
    console.log('Department detailed PDF Buffer created, size:', buffer.length, 'bytes')
    
    return buffer
  } catch (error) {
    console.error('Error in department detailed PDF generation:', error)
    throw new Error(`Department detailed PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function generateMultiEvaluationPDF(evaluations: EvaluationData[], language = 'en', reportTitle = 'Evaluations Report'): Buffer {
  try {
    console.log('Starting multi-evaluation PDF generation:', {
      evaluationCount: evaluations.length,
      language,
      reportTitle
    })

    const doc = new jsPDF()
    const labels = getPDFLabels(language)
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    const title = language === 'es' ? 'Reporte de Evaluaciones' : reportTitle
    doc.text(title, 20, yPosition)
    yPosition += 15

    // Company Summary Section
    doc.setFontSize(16)
    const summaryLabel = language === 'es' ? 'Resumen de la Empresa' : 'Company Summary'
    doc.text(summaryLabel, 20, yPosition)
    yPosition += 12

    // Basic stats
    doc.setFontSize(12)
    doc.text(`${language === 'es' ? 'Total de evaluaciones' : 'Total evaluations'}: ${evaluations.length}`, 20, yPosition)
    yPosition += 6
    doc.text(`${labels.generatedOn} ${new Date().toLocaleDateString()}`, 20, yPosition)
    yPosition += 10

    // Performance Distribution and Averages
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRated = 0
    let companyOkrSum = 0
    let companyCompetencySum = 0
    let companyOkrCount = 0
    let companyCompetencyCount = 0

    evaluations.forEach(evaluation => {
      if (evaluation.overallRating) {
        ratingCounts[evaluation.overallRating as keyof typeof ratingCounts]++
        totalRated++
      }

      // Calculate OKR and Competency averages for the company
      if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
        evaluation.evaluationItemsData.forEach(item => {
          if (item.rating) {
            if (item.type === 'okr') {
              companyOkrSum += item.rating
              companyOkrCount++
            } else if (item.type === 'competency') {
              companyCompetencySum += item.rating
              companyCompetencyCount++
            }
          }
        })
      }
    })

    // Company Averages Section
    doc.setFontSize(14)
    const averagesLabel = language === 'es' ? 'Promedios de la Empresa' : 'Company Averages'
    doc.text(averagesLabel, 20, yPosition)
    yPosition += 8

    doc.setFontSize(12)
    if (companyOkrCount > 0) {
      const companyOkrAverage = (companyOkrSum / companyOkrCount).toFixed(1)
      doc.text(`${language === 'es' ? 'Promedio OKRs' : 'OKR Average'}: ${companyOkrAverage}/5`, 25, yPosition)
      yPosition += 6
    }
    if (companyCompetencyCount > 0) {
      const companyCompetencyAverage = (companyCompetencySum / companyCompetencyCount).toFixed(1)
      doc.text(`${language === 'es' ? 'Promedio Competencias' : 'Competency Average'}: ${companyCompetencyAverage}/5`, 25, yPosition)
      yPosition += 6
    }
    if (totalRated > 0) {
      const overallCompanyAverage = evaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / totalRated
      doc.text(`${language === 'es' ? 'Promedio General' : 'Overall Average'}: ${overallCompanyAverage.toFixed(1)}/5`, 25, yPosition)
      yPosition += 10
    }

    // Performance Distribution
    if (totalRated > 0) {
      doc.setFontSize(14)
      const distributionLabel = language === 'es' ? 'Distribución de Calificaciones' : 'Rating Distribution'
      doc.text(distributionLabel, 20, yPosition)
      yPosition += 8

      doc.setFontSize(12)
      Object.entries(ratingCounts).forEach(([rating, count]) => {
        if (count > 0) {
          const percentage = ((count / totalRated) * 100).toFixed(1)
          const ratingText = getRatingText(parseInt(rating), language)
          doc.text(`${rating}/5 - ${ratingText}: ${count} (${percentage}%)`, 25, yPosition)
          yPosition += 6
        }
      })
      yPosition += 8
    }

    // Departments Overview
    const departmentCounts: Record<string, number> = {}
    evaluations.forEach(evaluation => {
      const dept = evaluation.employee.department || (language === 'es' ? 'Sin Departamento' : 'No Department')
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1
    })

    if (Object.keys(departmentCounts).length > 1) {
      doc.setFontSize(14)
      const deptLabel = language === 'es' ? 'Distribución por Departamento' : 'Department Distribution'
      doc.text(deptLabel, 20, yPosition)
      yPosition += 8

      doc.setFontSize(12)
      Object.entries(departmentCounts).forEach(([department, count]) => {
        const percentage = ((count / evaluations.length) * 100).toFixed(1)
        doc.text(`${department}: ${count} (${percentage}%)`, 25, yPosition)
        yPosition += 6
      })
      yPosition += 10
    }

    // Add page break before individual evaluations if needed
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    // Individual Evaluations Section Header
    doc.setFontSize(16)
    const individualLabel = language === 'es' ? 'Evaluaciones por Empleado' : 'Employee Evaluations'
    doc.text(individualLabel, 20, yPosition)
    yPosition += 15

    // Process each evaluation
    evaluations.forEach((evaluation, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Employee header
      doc.setFontSize(16)
      doc.text(`${index + 1}. ${evaluation.employee?.name || 'N/A'}`, 20, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      if (evaluation.employee?.department) {
        doc.text(`${labels.department}: ${evaluation.employee.department}`, 25, yPosition)
        yPosition += 6
      }

      // Calculate individual OKR and Competency averages
      let individualOkrSum = 0
      let individualCompetencySum = 0
      let individualOkrCount = 0
      let individualCompetencyCount = 0

      if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
        evaluation.evaluationItemsData.forEach(item => {
          if (item.rating) {
            if (item.type === 'okr') {
              individualOkrSum += item.rating
              individualOkrCount++
            } else if (item.type === 'competency') {
              individualCompetencySum += item.rating
              individualCompetencyCount++
            }
          }
        })
      }

      // Display individual averages
      if (individualOkrCount > 0) {
        const individualOkrAverage = (individualOkrSum / individualOkrCount).toFixed(1)
        doc.text(`${language === 'es' ? 'OKRs' : 'OKR Average'}: ${individualOkrAverage}/5`, 25, yPosition)
        yPosition += 6
      }
      if (individualCompetencyCount > 0) {
        const individualCompetencyAverage = (individualCompetencySum / individualCompetencyCount).toFixed(1)
        doc.text(`${language === 'es' ? 'Competencias' : 'Competency Average'}: ${individualCompetencyAverage}/5`, 25, yPosition)
        yPosition += 6
      }
      
      if (evaluation.overallRating) {
        const ratingText = `${labels.rating}: ${evaluation.overallRating}/5 - ${getRatingText(evaluation.overallRating, language)}`
        doc.text(ratingText, 25, yPosition)
        yPosition += 6
      }

      doc.text(`${labels.status}: ${evaluation.status?.toUpperCase() || 'N/A'}`, 25, yPosition)
      yPosition += 8

      yPosition += 10
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(
        `${labels.generatedOn} ${new Date().toLocaleDateString()} - ${labels.page} ${i} ${labels.of} ${pageCount}`,
        20,
        290
      )
    }

    // Generate PDF as a buffer
    console.log('Generating multi-evaluation PDF output...')
    const pdfOutput = doc.output('arraybuffer')
    console.log('Multi-evaluation PDF output generated, size:', pdfOutput.byteLength, 'bytes')
    
    if (pdfOutput.byteLength === 0) {
      throw new Error('Generated PDF is empty (0 bytes)')
    }
    
    const buffer = Buffer.from(pdfOutput)
    console.log('Multi-evaluation PDF Buffer created, size:', buffer.length, 'bytes')
    
    return buffer
  } catch (error) {
    console.error('Error in multi-evaluation PDF generation:', error)
    throw new Error(`Multi-evaluation PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function generateExcel(evaluations: EvaluationData[], language = 'en'): Buffer {
  const workbook = XLSX.utils.book_new()
  
  const getExcelLabels = (lang: string) => {
    const labels = {
      en: {
        employeeName: 'Employee Name',
        employeeId: 'Employee ID',
        department: 'Department',
        manager: 'Manager',
        period: 'Period',
        overallRating: 'Overall Rating',
        status: 'Status',
        completionDate: 'Completion Date',
        type: 'Type',
        item: 'Item',
        rating: 'Rating',
        comment: 'Comment',
        summary: 'Summary',
        detailed: 'Detailed',
        analytics: 'Analytics'
      },
      es: {
        employeeName: 'Nombre del Empleado',
        employeeId: 'ID del Empleado',
        department: 'Departamento',
        manager: 'Gerente',
        period: 'Período',
        overallRating: 'Calificación General',
        status: 'Estado',
        completionDate: 'Fecha de Finalización',
        type: 'Tipo',
        item: 'Elemento',
        rating: 'Calificación',
        comment: 'Comentario',
        summary: 'Resumen',
        detailed: 'Detallado',
        analytics: 'Análisis'
      }
    }
    return lang === 'es' ? labels.es : labels.en
  }
  
  const labels = getExcelLabels(language)

  // Summary Sheet
  const summaryData = evaluations.map(evaluation => ({
    [labels.employeeName]: evaluation.employee.name,
    [labels.employeeId]: evaluation.employee.employeeId || '',
    [labels.department]: evaluation.employee.department || '',
    [labels.manager]: evaluation.manager.name,
    [labels.period]: `${evaluation.periodType} ${evaluation.periodDate}`,
    [labels.overallRating]: evaluation.overallRating || '',
    [labels.status]: evaluation.status.toUpperCase(),
    [labels.completionDate]: evaluation.updatedAt.toLocaleDateString()
  }))

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, labels.summary)

  // Detailed Sheet
  const detailedData: Record<string, string | number>[] = []
  
  evaluations.forEach(evaluation => {
    // Add Evaluation Items
    if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
      evaluation.evaluationItemsData.forEach((item: EvaluationItem) => {
        detailedData.push({
          [labels.employeeName]: evaluation.employee.name,
          [labels.employeeId]: evaluation.employee.employeeId || '',
          [labels.department]: evaluation.employee.department || '',
          [labels.manager]: evaluation.manager.name,
          [labels.period]: `${evaluation.periodType} ${evaluation.periodDate}`,
          [labels.type]: item.type === 'okr' ? 'OKR' : (language === 'es' ? 'Competencia' : 'Competency'),
          [labels.item]: item.title || '',
          [labels.rating]: item.rating || '',
          [labels.comment]: item.comment || ''
        })
      })
    }
  })

  const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
  XLSX.utils.book_append_sheet(workbook, detailedSheet, labels.detailed)

  // Analytics Sheet
  const analyticsData = generateAnalytics(evaluations, language)
  const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData)
  XLSX.utils.book_append_sheet(workbook, analyticsSheet, labels.analytics)

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

// Removed duplicate getRatingText function - using the one at line 149

function generateAnalytics(evaluations: EvaluationData[], language = 'en'): AnalyticsData[] {
  const analytics: AnalyticsData[] = []
  
  const analyticsLabels = {
    en: {
      overallRatingDistribution: 'Overall Rating Distribution',
      departmentDistribution: 'Department Distribution',
      unknown: 'Unknown',
      metric: 'Metric',
      category: 'Category',
      count: 'Count',
      percentage: 'Percentage'
    },
    es: {
      overallRatingDistribution: 'Distribución de Calificación General',
      departmentDistribution: 'Distribución por Departamento',
      unknown: 'Desconocido',
      metric: 'Métrica',
      category: 'Categoría',
      count: 'Cantidad',
      percentage: 'Porcentaje'
    }
  }
  
  const labels = language === 'es' ? analyticsLabels.es : analyticsLabels.en

  // Rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  evaluations.forEach(evaluation => {
    if (evaluation.overallRating) {
      ratingCounts[evaluation.overallRating as keyof typeof ratingCounts]++
    }
  })

  Object.entries(ratingCounts).forEach(([rating, count]) => {
    analytics.push({
      [labels.metric]: labels.overallRatingDistribution,
      [labels.category]: `${rating} - ${getRatingText(parseInt(rating), language)}`,
      [labels.count]: count,
      [labels.percentage]: `${((count / evaluations.length) * 100).toFixed(1)}%`
    })
  })

  // Department breakdown
  const departmentCounts: Record<string, number> = {}
  evaluations.forEach(evaluation => {
    const dept = evaluation.employee.department || labels.unknown
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1
  })

  Object.entries(departmentCounts).forEach(([department, count]) => {
    analytics.push({
      [labels.metric]: labels.departmentDistribution,
      [labels.category]: department,
      [labels.count]: count,
      [labels.percentage]: `${((count / evaluations.length) * 100).toFixed(1)}%`
    })
  })

  return analytics
}