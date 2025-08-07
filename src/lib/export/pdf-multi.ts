/**
 * Multi-evaluation PDF generation for company-wide reports
 */

import jsPDF from 'jspdf'
import type { EvaluationData } from './types'
import { getRatingText, getRatingColor, getPDFLabels, calculateAverages } from './pdf-utils'
import { generateAnalytics } from './data'

/**
 * Generate consolidated PDF for multiple evaluations (company-wide)
 */
export function generateMultiEvaluationPDF(evaluations: EvaluationData[], language = 'en', reportTitle = 'Evaluations Report'): Buffer {
  const doc = new jsPDF()
  const labels = getPDFLabels(language)
  let yPosition = 20

  // Header
  doc.setFillColor(59, 130, 246) // Blue-500
  doc.rect(0, 0, 220, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text(reportTitle, 20, 16)
  
  yPosition = 35

  // Company Information
  if (evaluations.length > 0) {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text(`${labels.company}: ${evaluations[0].company.name}`, 20, yPosition)
    
    if (evaluations[0].cycle?.name) {
      doc.text(`${labels.cycle}: ${evaluations[0].cycle.name}`, 20, yPosition + 10)
      yPosition += 20
    } else {
      yPosition += 15
    }
    
    doc.text(`${language === 'es' ? 'Total de Evaluaciones' : 'Total Evaluations'}: ${evaluations.length}`, 20, yPosition)
    yPosition += 20
  }

  // Overall Statistics
  const totalEvaluations = evaluations.length
  const ratedEvaluations = evaluations.filter(e => e.overallRating).length
  const avgRating = ratedEvaluations > 0 
    ? Math.round((evaluations.reduce((sum, e) => sum + (e.overallRating || 0), 0) / ratedEvaluations) * 100) / 100
    : 0

  // Calculate company-wide OKR and Competency averages
  const totalOkrRatings: number[] = []
  const totalCompRatings: number[] = []

  evaluations.forEach(evaluation => {
    evaluation.evaluationItemsData.forEach(item => {
      if (item.rating !== null) {
        if (item.type === 'okr') {
          totalOkrRatings.push(item.rating)
        } else if (item.type === 'competency') {
          totalCompRatings.push(item.rating)
        }
      }
    })
  })

  const companyOkrAvg = totalOkrRatings.length > 0 
    ? Math.round((totalOkrRatings.reduce((a, b) => a + b, 0) / totalOkrRatings.length) * 100) / 100 
    : null

  const companyCompAvg = totalCompRatings.length > 0
    ? Math.round((totalCompRatings.reduce((a, b) => a + b, 0) / totalCompRatings.length) * 100) / 100
    : null

  // Statistics Card
  doc.setFillColor(248, 250, 252) // Gray-50
  doc.rect(20, yPosition, 170, 60, 'F')
  doc.setDrawColor(226, 232, 240) // Gray-200
  doc.rect(20, yPosition, 170, 60, 'S')
  
  doc.setTextColor(30, 41, 59) // Slate-800
  doc.setFontSize(14)
  const statsLabel = language === 'es' ? 'Estadísticas Generales' : 'Overall Statistics'
  doc.text(statsLabel, 25, yPosition + 15)
  
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105) // Slate-600
  
  let statsY = yPosition + 28
  doc.text(`${language === 'es' ? 'Evaluaciones Completadas' : 'Completed Evaluations'}: ${ratedEvaluations}/${totalEvaluations}`, 25, statsY)
  
  statsY += 10
  if (avgRating > 0) {
    doc.text(`${language === 'es' ? 'Calificación Promedio' : 'Average Rating'}: ${avgRating}/5 (${getRatingText(Math.round(avgRating), language)})`, 25, statsY)
  }
  
  statsY += 10
  if (companyOkrAvg !== null) {
    doc.text(`${labels.avgOkr}: ${companyOkrAvg}`, 25, statsY)
    statsY += 10
  }
  
  if (companyCompAvg !== null) {
    doc.text(`${labels.avgComp}: ${companyCompAvg}`, 25, statsY)
  }
  
  yPosition += 70

  // Rating Distribution
  if (ratedEvaluations > 0) {
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    
    evaluations.forEach(evaluation => {
      if (evaluation.overallRating && evaluation.overallRating >= 1 && evaluation.overallRating <= 5) {
        ratingCounts[evaluation.overallRating as keyof typeof ratingCounts]++
      }
    })

    doc.setFillColor(16, 185, 129) // Emerald-500
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    const distributionLabel = language === 'es' ? 'Distribución de Calificaciones' : 'Rating Distribution'
    doc.text(distributionLabel, 25, yPosition + 12)
    
    yPosition += 25

    Object.entries(ratingCounts).reverse().forEach(([rating, count]) => {
      if (count > 0) {
        const percentage = Math.round((count / ratedEvaluations) * 100)
        const color = getRatingColor(parseInt(rating))
        const text = getRatingText(parseInt(rating), language)
        
        // Color indicator
        doc.setFillColor(color.r, color.g, color.b)
        doc.circle(30, yPosition + 5, 4, 'F')
        
        // Text
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.text(`${text}: ${count} (${percentage}%)`, 40, yPosition + 8)
        
        yPosition += 12
      }
    })
    
    yPosition += 10
  }

  // Department Analytics
  const analytics = generateAnalytics(evaluations, language)
  
  if (analytics.length > 0) {
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFillColor(99, 102, 241) // Indigo-500
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    const deptLabel = language === 'es' ? 'Análisis por Departamento' : 'Department Analysis'
    doc.text(deptLabel, 25, yPosition + 12)
    
    yPosition += 30

    analytics.forEach(dept => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Department card
      doc.setFillColor(252, 252, 252) // Gray-100
      doc.rect(25, yPosition, 165, 25, 'F')
      doc.setDrawColor(229, 231, 235) // Gray-200
      doc.rect(25, yPosition, 165, 25, 'S')
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text(dept.department, 30, yPosition + 10)
      
      doc.setFontSize(10)
      doc.setTextColor(75, 85, 99) // Gray-600
      doc.text(`${language === 'es' ? 'Promedio' : 'Average'}: ${dept.avgRating}`, 30, yPosition + 20)
      doc.text(`${language === 'es' ? 'Completado' : 'Completion'}: ${dept.completionRate}%`, 120, yPosition + 20)
      
      yPosition += 35
    })
  }

  // Individual Evaluations Summary
  if (yPosition > 150) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFillColor(168, 85, 247) // Purple-500
  doc.rect(20, yPosition, 170, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  const individualLabel = language === 'es' ? 'Resumen Individual' : 'Individual Summary'
  doc.text(individualLabel, 25, yPosition + 12)
  
  yPosition += 30

  // Table headers
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.text(language === 'es' ? 'Empleado' : 'Employee', 25, yPosition)
  doc.text(language === 'es' ? 'Depto' : 'Dept', 80, yPosition)
  doc.text(language === 'es' ? 'Calif.' : 'Rating', 120, yPosition)
  doc.text('OKRs', 140, yPosition)
  doc.text(language === 'es' ? 'Comp.' : 'Comp', 160, yPosition)
  
  yPosition += 10

  // List evaluations (limited to fit on pages)
  evaluations.slice(0, 30).forEach((evaluation) => {
    if (yPosition > 280) {
      doc.addPage()
      yPosition = 20
    }

    const { okrAvg, compAvg } = calculateAverages(evaluation.evaluationItemsData)
    
    doc.setFontSize(8)
    doc.text(evaluation.employee.name.substring(0, 20), 25, yPosition)
    doc.text((evaluation.employee.department || 'N/A').substring(0, 15), 80, yPosition)
    
    if (evaluation.overallRating) {
      const color = getRatingColor(evaluation.overallRating)
      doc.setTextColor(color.r, color.g, color.b)
      doc.text(evaluation.overallRating.toString(), 120, yPosition)
    } else {
      doc.setTextColor(128, 128, 128)
      doc.text('N/A', 120, yPosition)
    }
    
    doc.setTextColor(0, 0, 0)
    doc.text(okrAvg ? okrAvg.toString() : 'N/A', 140, yPosition)
    doc.text(compAvg ? compAvg.toString() : 'N/A', 160, yPosition)
    
    yPosition += 8
  })

  if (evaluations.length > 30) {
    yPosition += 10
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(9)
    const moreText = language === 'es' 
      ? `... y ${evaluations.length - 30} evaluaciones más`
      : `... and ${evaluations.length - 30} more evaluations`
    doc.text(moreText, 25, yPosition)
  }

  return Buffer.from(doc.output('arraybuffer'))
}