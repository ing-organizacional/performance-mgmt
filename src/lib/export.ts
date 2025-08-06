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
      }
    }
  })

  if (!evaluation) return null

  return {
    ...evaluation,
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

    // Header
    doc.setFontSize(20)
    doc.text(labels.title, 20, yPosition)
    yPosition += 15

    // Company and Period Info
    doc.setFontSize(12)
    doc.text(`${labels.company}: ${evaluation.company?.name || 'N/A'}`, 20, yPosition)
    yPosition += 8
    doc.text(`${labels.period}: ${evaluation.periodType || 'N/A'} ${evaluation.periodDate || ''}`, 20, yPosition)
    yPosition += 8
    doc.text(`${labels.status}: ${evaluation.status?.toUpperCase() || 'N/A'}`, 20, yPosition)
    yPosition += 15

    // Employee Information
    doc.setFontSize(16)
    doc.text(labels.employeeInfo, 20, yPosition)
    yPosition += 10

    doc.setFontSize(12)
    doc.text(`${labels.name}: ${evaluation.employee?.name || 'N/A'}`, 20, yPosition)
    yPosition += 8
    
    if (evaluation.employee?.email) {
      doc.text(`${labels.email}: ${evaluation.employee.email}`, 20, yPosition)
      yPosition += 8
    }
    
    if (evaluation.employee?.username) {
      doc.text(`${labels.username}: ${evaluation.employee.username}`, 20, yPosition)
      yPosition += 8
    }
    
    if (evaluation.employee?.department) {
      doc.text(`${labels.department}: ${evaluation.employee.department}`, 20, yPosition)
      yPosition += 8
    }
    
    if (evaluation.employee?.employeeId) {
      doc.text(`${labels.employeeId}: ${evaluation.employee.employeeId}`, 20, yPosition)
      yPosition += 8
    }

    doc.text(`${labels.manager}: ${evaluation.manager?.name || 'N/A'}`, 20, yPosition)
    yPosition += 15

    // Overall Rating
    if (evaluation.overallRating) {
      doc.setFontSize(16)
      doc.text(labels.overallRating, 20, yPosition)
      yPosition += 10

      doc.setFontSize(14)
      const ratingText = getRatingText(evaluation.overallRating, language)
      doc.text(`${evaluation.overallRating}/5 - ${ratingText}`, 20, yPosition)
      yPosition += 15
    }

    // Evaluation Items Section
    if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
      doc.setFontSize(16)
      doc.text(labels.evaluationItems, 20, yPosition)
      yPosition += 10

      evaluation.evaluationItemsData.forEach((item: EvaluationItem, index: number) => {
        console.log(`Processing evaluation item ${index + 1}:`, {
          title: item.title,
          type: item.type,
          rating: item.rating,
          hasComment: !!item.comment
        })
        
        doc.setFontSize(12)
        const itemType = item.type === 'okr' ? labels.okr : labels.competency
        const titleText = `${itemType}: ${item.title || 'N/A'}`
        
        // Check if we need a new page before adding content
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.text(titleText, 20, yPosition)
        yPosition += 6
        
        if (item.rating) {
          const ratingText = `${labels.rating}: ${item.rating}/5 - ${getRatingText(item.rating, language)}`
          doc.text(ratingText, 25, yPosition)
          yPosition += 6
        }
        
        if (item.comment && item.comment.trim()) {
          const commentText = `${labels.comment}: ${item.comment.trim()}`
          const lines = doc.splitTextToSize(commentText, 160)
          doc.text(lines, 25, yPosition)
          yPosition += (lines.length * 6)
        }
        yPosition += 8
      })
      yPosition += 10
    } else {
      // Add a note if no evaluation items
      doc.setFontSize(12)
      doc.text(labels.noItemsAvailable, 20, yPosition)
      yPosition += 10
    }

    // Manager Comments
    if (evaluation.managerComments) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.text(labels.managerComments, 20, yPosition)
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

    // Header
    doc.setFontSize(20)
    const title = language === 'es' 
      ? `Evaluaciones del Departamento: ${departmentName}`
      : `Department Evaluations: ${departmentName}`
    doc.text(title, 20, yPosition)
    yPosition += 15

    // Department Summary Section
    doc.setFontSize(16)
    const summaryLabel = language === 'es' ? 'Resumen del Departamento' : 'Department Summary'
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

    // Team Averages Section
    doc.setFontSize(14)
    const averagesLabel = language === 'es' ? 'Promedios del Equipo' : 'Team Averages'
    doc.text(averagesLabel, 20, yPosition)
    yPosition += 8

    doc.setFontSize(12)
    if (teamOkrCount > 0) {
      const teamOkrAverage = (teamOkrSum / teamOkrCount).toFixed(1)
      doc.text(`${language === 'es' ? 'Promedio OKRs' : 'OKR Average'}: ${teamOkrAverage}/5`, 25, yPosition)
      yPosition += 6
    }
    if (teamCompetencyCount > 0) {
      const teamCompetencyAverage = (teamCompetencySum / teamCompetencyCount).toFixed(1)
      doc.text(`${language === 'es' ? 'Promedio Competencias' : 'Competency Average'}: ${teamCompetencyAverage}/5`, 25, yPosition)
      yPosition += 6
    }
    if (totalRated > 0) {
      const overallTeamAverage = evaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / totalRated
      doc.text(`${language === 'es' ? 'Promedio General' : 'Overall Average'}: ${overallTeamAverage.toFixed(1)}/5`, 25, yPosition)
      yPosition += 10
    }

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

    // Team Composition
    doc.setFontSize(14)
    const teamLabel = language === 'es' ? 'Composición del Equipo' : 'Team Composition'
    doc.text(teamLabel, 20, yPosition)
    yPosition += 8

    doc.setFontSize(12)
    const managers = evaluations.filter(e => e.employee.name === e.manager?.name).length
    const employees = evaluations.length - managers
    
    if (managers > 0) {
      doc.text(`${language === 'es' ? 'Gerentes' : 'Managers'}: ${managers}`, 25, yPosition)
      yPosition += 6
    }
    doc.text(`${language === 'es' ? 'Empleados' : 'Employees'}: ${employees}`, 25, yPosition)
    yPosition += 15

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

      // Employee header - make it prominent
      doc.setFontSize(18)
      doc.text(`${index + 1}. ${evaluation.employee?.name || 'N/A'}`, 20, yPosition)
      yPosition += 12

      // Employee details
      doc.setFontSize(12)
      if (evaluation.employee?.department) {
        doc.text(`${labels.department}: ${evaluation.employee.department}`, 25, yPosition)
        yPosition += 6
      }
      
      if (evaluation.employee?.email) {
        doc.text(`${labels.email}: ${evaluation.employee.email}`, 25, yPosition)
        yPosition += 6
      }
      
      if (evaluation.manager?.name) {
        doc.text(`${labels.manager}: ${evaluation.manager.name}`, 25, yPosition)
        yPosition += 6
      }
      
      doc.text(`${labels.status}: ${evaluation.status?.toUpperCase() || 'N/A'}`, 25, yPosition)
      yPosition += 8

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

      // Individual Averages Section
      doc.setFontSize(14)
      const individualAveragesLabel = language === 'es' ? 'Promedios Individuales' : 'Individual Averages'
      doc.text(individualAveragesLabel, 25, yPosition)
      yPosition += 8

      doc.setFontSize(12)
      if (individualOkrCount > 0) {
        const individualOkrAverage = (individualOkrSum / individualOkrCount).toFixed(1)
        doc.text(`${language === 'es' ? 'Promedio OKRs' : 'OKR Average'}: ${individualOkrAverage}/5`, 30, yPosition)
        yPosition += 6
      }
      if (individualCompetencyCount > 0) {
        const individualCompetencyAverage = (individualCompetencySum / individualCompetencyCount).toFixed(1)
        doc.text(`${language === 'es' ? 'Promedio Competencias' : 'Competency Average'}: ${individualCompetencyAverage}/5`, 30, yPosition)
        yPosition += 6
      }

      // Overall Rating - make it prominent
      if (evaluation.overallRating) {
        doc.setFontSize(14)
        const ratingText = `${labels.overallRating}: ${evaluation.overallRating}/5 - ${getRatingText(evaluation.overallRating, language)}`
        doc.text(ratingText, 25, yPosition)
        yPosition += 10
      }

      // Detailed evaluation items
      if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
        doc.setFontSize(14)
        doc.text(labels.evaluationItems, 25, yPosition)
        yPosition += 8

        evaluation.evaluationItemsData.forEach((item: EvaluationItem) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }

          doc.setFontSize(12)
          const itemType = item.type === 'okr' ? labels.okr : labels.competency
          doc.text(`• ${itemType}: ${item.title || 'N/A'}`, 30, yPosition)
          yPosition += 6
          
          if (item.rating) {
            doc.text(`  ${labels.rating}: ${item.rating}/5 - ${getRatingText(item.rating, language)}`, 32, yPosition)
            yPosition += 6
          }
          
          if (item.comment && item.comment.trim()) {
            const commentLines = doc.splitTextToSize(`  ${labels.comment}: ${item.comment.trim()}`, 150)
            doc.text(commentLines, 32, yPosition)
            yPosition += (commentLines.length * 6)
          }
          yPosition += 4
        })
        yPosition += 8
      }

      // Manager Comments
      if (evaluation.managerComments) {
        doc.setFontSize(14)
        doc.text(labels.managerComments, 25, yPosition)
        yPosition += 8
        
        doc.setFontSize(12)
        const commentLines = doc.splitTextToSize(evaluation.managerComments, 160)
        doc.text(commentLines, 25, yPosition)
        yPosition += (commentLines.length * 6) + 8
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