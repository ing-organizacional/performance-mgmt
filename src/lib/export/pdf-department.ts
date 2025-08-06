/**
 * Department PDF generation with executive dashboard
 */

import jsPDF from 'jspdf'
import type { EvaluationData } from './types'
import { getRatingText, getRatingColor, getPDFLabels, calculateAverages, addPageBreak } from './pdf-utils'

/**
 * Generate comprehensive department PDF with executive summary and individual evaluations
 */
export function generateDepartmentDetailedPDF(evaluations: EvaluationData[], language = 'en', departmentName = 'Department'): Buffer {
  const doc = new jsPDF()
  const labels = getPDFLabels(language)
  let yPosition = 20

  // ===== EXECUTIVE DASHBOARD SUMMARY PAGE =====
  
  // Elegant Header - Much more subtle
  doc.setFillColor(248, 250, 252) // Very light gray
  doc.rect(0, 0, 220, 35, 'F')
  doc.setDrawColor(226, 232, 240) // Light gray border
  doc.rect(0, 0, 220, 35, 'S')
  doc.setTextColor(30, 41, 59) // Dark slate
  doc.setFontSize(20)
  doc.text(departmentName, 20, 22)
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105) // Medium slate
  const cycleName = evaluations[0]?.cycle?.name || (language === 'es' ? 'Sin Ciclo' : 'No Cycle')
  doc.text(`${cycleName} - ${language === 'es' ? 'Reporte Ejecutivo' : 'Executive Report'}`, 20, 30)
  
  yPosition = 50

  // Key Metrics Cards
  const totalEmployees = evaluations.length
  const avgRating = evaluations.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0) / totalEmployees
  
  // Calculate rating distribution
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let totalRated = 0
  
  evaluations.forEach(evaluation => {
    if (evaluation.overallRating && evaluation.overallRating >= 1 && evaluation.overallRating <= 5) {
      ratingCounts[evaluation.overallRating as keyof typeof ratingCounts]++
      totalRated++
    }
  })

  // Calculate OKR and Competency averages across all evaluations
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

  const teamOkrAvg = totalOkrRatings.length > 0 
    ? Math.round((totalOkrRatings.reduce((a, b) => a + b, 0) / totalOkrRatings.length) * 100) / 100 
    : null

  const teamCompAvg = totalCompRatings.length > 0
    ? Math.round((totalCompRatings.reduce((a, b) => a + b, 0) / totalCompRatings.length) * 100) / 100
    : null

  // Elegant Metrics Grid - Much more subtle
  const metrics = [
    { 
      label: language === 'es' ? 'Empleados' : 'Employees', 
      value: totalEmployees.toString()
    },
    { 
      label: language === 'es' ? 'Calificación Promedio' : 'Average Rating', 
      value: totalRated > 0 ? (Math.round(avgRating * 100) / 100).toString() : 'N/A'
    },
    { 
      label: language === 'es' ? 'Promedio OKRs' : 'OKRs Average', 
      value: teamOkrAvg ? teamOkrAvg.toString() : 'N/A'
    },
    { 
      label: language === 'es' ? 'Promedio Competencias' : 'Competencies Average', 
      value: teamCompAvg ? teamCompAvg.toString() : 'N/A'
    }
  ]

  metrics.forEach((metric, index) => {
    const x = 20 + (index % 2) * 85
    const y = yPosition + Math.floor(index / 2) * 28
    
    // Subtle metric card with light background and borders
    doc.setFillColor(255, 255, 255) // White background
    doc.rect(x, y, 80, 25, 'F')
    doc.setDrawColor(226, 232, 240) // Light gray border
    doc.rect(x, y, 80, 25, 'S')
    doc.setTextColor(30, 41, 59) // Dark slate for value
    doc.setFontSize(16)
    doc.text(metric.value, x + 5, y + 14)
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105) // Medium slate for label
    doc.text(metric.label, x + 5, y + 21)
  })

  yPosition += 66

  // Performance Analysis Section - More subtle
  doc.setTextColor(30, 41, 59) // Dark slate
  doc.setFontSize(14)
  const analysisLabel = language === 'es' ? 'Análisis de Performance' : 'Performance Analysis'
  doc.text(analysisLabel, 20, yPosition)
  doc.setDrawColor(226, 232, 240) // Light line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2)
  yPosition += 15

  if (totalRated > 0) {
    // Rating Distribution Visual Section - More subtle
    doc.setTextColor(30, 41, 59) // Dark slate
    doc.setFontSize(12)
    const distributionLabel = language === 'es' ? 'Distribución de Calificaciones' : 'Rating Distribution'
    doc.text(distributionLabel, 25, yPosition)
    yPosition += 15

    // Create subtle visual bar chart for rating distribution
    const maxBarWidth = 120
    const barHeight = 8
    
    doc.setTextColor(71, 85, 105) // Medium slate
    doc.setFontSize(9)
    
    const ratings = [5, 4, 3, 2, 1]
    ratings.forEach((rating: number) => {
      const count = ratingCounts[rating as keyof typeof ratingCounts]
      if (count > 0) {
        const percentage = (count / totalRated) * 100
        const barWidth = (percentage / 100) * maxBarWidth
        const ratingColor = getRatingColor(rating)
        const ratingText = getRatingText(rating, language)
        
        // Subtle bar background
        doc.setFillColor(248, 250, 252) // Very light gray
        doc.rect(65, yPosition, maxBarWidth, barHeight, 'F')
        doc.setDrawColor(226, 232, 240) // Light border
        doc.rect(65, yPosition, maxBarWidth, barHeight, 'S')
        
        // Actual bar with muted colors
        const mutedColor = {
          r: Math.min(255, ratingColor.r + 50),
          g: Math.min(255, ratingColor.g + 50), 
          b: Math.min(255, ratingColor.b + 50)
        }
        doc.setFillColor(mutedColor.r, mutedColor.g, mutedColor.b)
        doc.rect(65, yPosition, barWidth, barHeight, 'F')
        
        // Clean labels
        doc.setTextColor(30, 41, 59) // Dark slate
        doc.text(`${rating}`, 30, yPosition + 6)
        doc.text(`${count} (${Math.round(percentage)}%)`, 190, yPosition + 6)
        doc.setTextColor(71, 85, 105) // Medium slate
        doc.setFontSize(8)
        doc.text(ratingText, 30, yPosition + 15)
        doc.setFontSize(9)
        
        yPosition += 20
      }
    })
  }

  yPosition += 10

  // Team Composition Section - More subtle
  doc.setTextColor(30, 41, 59) // Dark slate
  doc.setFontSize(12)
  const compositionLabel = language === 'es' ? 'Composición del Equipo' : 'Team Composition'
  doc.text(compositionLabel, 20, yPosition)
  doc.setDrawColor(226, 232, 240) // Light line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2)
  yPosition += 15

  // Team members list (compact)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  evaluations.slice(0, 12).forEach((evaluation, index) => { // Limit to 12 for space
    const x = 25 + (index % 3) * 55
    const y = yPosition + Math.floor(index / 3) * 12
    
    doc.text(`• ${evaluation.employee.name}`, x, y)
    if (evaluation.overallRating) {
      const color = getRatingColor(evaluation.overallRating)
      doc.setFillColor(color.r, color.g, color.b)
      doc.circle(x + 45, y - 2, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      // Perfect centering for small circles
      const ratingText = evaluation.overallRating.toString()
      const textWidth = doc.getTextWidth(ratingText)
      doc.text(ratingText, (x + 45) - (textWidth / 2), y + 1)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
    }
  })

  if (evaluations.length > 12) {
    yPosition += Math.ceil(12 / 3) * 12 + 5
    doc.setTextColor(107, 114, 128) // Gray-500
    doc.text(`... ${language === 'es' ? 'y' : 'and'} ${evaluations.length - 12} ${language === 'es' ? 'más' : 'more'}`, 25, yPosition)
  } else {
    yPosition += Math.ceil(evaluations.length / 3) * 12
  }

  yPosition += 20

  // Key Insights Section - More subtle
  doc.setTextColor(30, 41, 59) // Dark slate
  doc.setFontSize(12)
  const insightsLabel = language === 'es' ? 'Insights Clave' : 'Key Insights'
  doc.text(insightsLabel, 20, yPosition)
  doc.setDrawColor(226, 232, 240) // Light line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2)
  yPosition += 15

  // Generate insights based on data
  const insights = []
  const highPerformers = evaluations.filter(e => e.overallRating && e.overallRating >= 4).length
  const needsImprovement = evaluations.filter(e => e.overallRating && e.overallRating <= 2).length

  if (highPerformers > 0) {
    insights.push(language === 'es' 
      ? `${highPerformers} empleados demuestran alto rendimiento (4+ estrellas)`
      : `${highPerformers} employees demonstrate high performance (4+ stars)`)
  }

  if (needsImprovement > 0) {
    insights.push(language === 'es'
      ? `${needsImprovement} empleados requieren plan de desarrollo`
      : `${needsImprovement} employees require development planning`)
  }

  if (teamOkrAvg && teamCompAvg) {
    const stronger = teamOkrAvg > teamCompAvg ? 'OKRs' : (language === 'es' ? 'Competencias' : 'Competencies')
    insights.push(language === 'es'
      ? `El equipo es más fuerte en: ${stronger}`
      : `Team strength area: ${stronger}`)
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  insights.forEach((insight, index) => {
    doc.text(`• ${insight}`, 25, yPosition + (index * 10))
  })

  // ===== PAGE BREAK - START INDIVIDUAL EVALUATIONS =====
  addPageBreak(doc)

  // Individual Evaluations Section Header - More subtle
  doc.setFillColor(248, 250, 252) // Very light gray
  doc.rect(0, 0, 220, 30, 'F')
  doc.setDrawColor(226, 232, 240) // Light gray border
  doc.rect(0, 0, 220, 30, 'S')
  doc.setTextColor(30, 41, 59) // Dark slate
  doc.setFontSize(16)
  const individualsLabel = language === 'es' ? 'Evaluaciones Individuales' : 'Individual Evaluations'
  doc.text(`${individualsLabel} - ${departmentName}`, 20, 20)

  // Generate complete individual evaluation pages (as they were before)
  evaluations.forEach((evaluation) => {
    addPageBreak(doc) // Each employee gets their own page
    
    // Generate full individual evaluation content
    yPosition = 20
    const { okrAvg, compAvg } = calculateAverages(evaluation.evaluationItemsData)

    // Employee Information Card
    doc.setFillColor(248, 250, 252) // Gray-50
    doc.rect(20, yPosition, 170, 45, 'F')
    doc.setDrawColor(226, 232, 240) // Gray-200
    doc.rect(20, yPosition, 170, 45, 'S')
    
    doc.setTextColor(30, 41, 59) // Slate-800
    doc.setFontSize(14)
    doc.text(evaluation.employee.name, 25, yPosition + 12)
    
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105) // Slate-600
    
    let infoY = yPosition + 22
    doc.text(`${labels.employee}: ${evaluation.employee.name}`, 25, infoY)
    doc.text(`${labels.manager}: ${evaluation.manager.name}`, 105, infoY)
    
    infoY += 8
    if (evaluation.employee.department) {
      doc.text(`${labels.department}: ${evaluation.employee.department}`, 25, infoY)
    }
    doc.text(`${labels.company}: ${evaluation.company.name}`, 105, infoY)
    
    infoY += 8
    if (evaluation.cycle?.name) {
      doc.text(`${labels.cycle}: ${evaluation.cycle.name}`, 25, infoY)
    }
    
    yPosition += 55

    // Overall Rating Card (if available) - More subtle
    if (evaluation.overallRating) {
      doc.setTextColor(30, 41, 59) // Dark slate
      doc.setFontSize(12)
      const overallLabel = language === 'es' ? 'Calificación General' : 'Overall Rating'
      doc.text(overallLabel, 20, yPosition)
      
      yPosition += 25
      
      // Rating with visual indicator - properly centered
      const overallColor = getRatingColor(evaluation.overallRating)
      doc.setFillColor(overallColor.r, overallColor.g, overallColor.b)
      doc.circle(35, yPosition + 8, 6, 'F') // Radius 6
      
      doc.setTextColor(255, 255, 255) // White text on colored circle
      doc.setFontSize(12)
      // Perfect centering using text alignment
      const ratingText = evaluation.overallRating.toString()
      const textWidth = doc.getTextWidth(ratingText)
      doc.text(ratingText, 35 - (textWidth / 2), yPosition + 12)
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text(getRatingText(evaluation.overallRating, language), 50, yPosition + 12)
      
      yPosition += 25
    }

    // Averages Summary Card - More subtle
    if (okrAvg !== null || compAvg !== null) {
      doc.setTextColor(30, 41, 59) // Dark slate
      doc.setFontSize(12)
      const avgLabel = language === 'es' ? 'Promedios' : 'Averages'
      doc.text(avgLabel, 20, yPosition)
      
      yPosition += 25
      
      // Create subtle two-column layout for averages
      if (okrAvg !== null) {
        doc.setFillColor(248, 250, 252) // Very light background
        doc.rect(25, yPosition, 75, 18, 'F')
        doc.setDrawColor(226, 232, 240) // Light border
        doc.rect(25, yPosition, 75, 18, 'S')
        doc.setTextColor(71, 85, 105) // Medium slate for label
        doc.setFontSize(8)
        doc.text(labels.avgOkr, 27, yPosition + 8)
        doc.setTextColor(30, 41, 59) // Dark slate for value
        doc.setFontSize(14)
        doc.text(okrAvg.toString(), 27, yPosition + 15)
      }
      
      if (compAvg !== null) {
        doc.setFillColor(248, 250, 252) // Very light background
        doc.rect(110, yPosition, 75, 18, 'F')
        doc.setDrawColor(226, 232, 240) // Light border
        doc.rect(110, yPosition, 75, 18, 'S')
        doc.setTextColor(71, 85, 105) // Medium slate for label
        doc.setFontSize(8)
        doc.text(labels.avgComp, 112, yPosition + 8)
        doc.setTextColor(30, 41, 59) // Dark slate for value
        doc.setFontSize(14)
        doc.text(compAvg.toString(), 112, yPosition + 15)
      }
      
      yPosition += 30
    }

    // Evaluation Items - Full Detail
    if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
      const okrs = evaluation.evaluationItemsData.filter(item => item.type === 'okr')
      const competencies = evaluation.evaluationItemsData.filter(item => item.type === 'competency')

      // OKRs Section
      if (okrs.length > 0) {
        if (yPosition > 250) {
          addPageBreak(doc)
          yPosition = 20
        }
        
        doc.setTextColor(30, 41, 59) // Dark slate
        doc.setFontSize(12)
        doc.text(labels.objectives, 20, yPosition)
        doc.setDrawColor(226, 232, 240) // Light line under header
        doc.line(20, yPosition + 2, 190, yPosition + 2)
        
        yPosition += 25

        okrs.forEach((item, index) => {
          if (yPosition > 250) {
            addPageBreak(doc)
            yPosition = 20
          }

          // Item card - taller to accommodate comments
          const cardHeight = item.comment ? 45 : 35 // Bigger if there's a comment
          doc.setFillColor(252, 252, 252) // Gray-100
          doc.rect(25, yPosition, 165, cardHeight, 'F')
          doc.setDrawColor(229, 231, 235) // Gray-200
          doc.rect(25, yPosition, 165, cardHeight, 'S')
          
          // Rating circle - perfectly centered
          if (item.rating !== null) {
            const color = getRatingColor(item.rating)
            doc.setFillColor(color.r, color.g, color.b)
            doc.circle(35, yPosition + 10, 5, 'F') // Radius 5
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(10)
            // Perfect centering using text width
            const ratingText = item.rating.toString()
            const textWidth = doc.getTextWidth(ratingText)
            doc.text(ratingText, 35 - (textWidth / 2), yPosition + 13)
          }
          
          // Content
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(11)
          const titleText = `${index + 1}. ${item.title}`
          doc.text(titleText, 45, yPosition + 8)
          
          doc.setFontSize(9)
          doc.setTextColor(75, 85, 99) // Gray-600
          const maxWidth = 140
          const descLines = doc.splitTextToSize(item.description, maxWidth)
          doc.text(descLines.slice(0, 2), 45, yPosition + 16) // Limit to 2 lines
          
          if (item.comment) {
            doc.setTextColor(71, 85, 105) // Medium slate for comments
            doc.setFontSize(8)
            const commentText = `Comment: ${item.comment}` // No emoji, just clean text
            const commentLines = doc.splitTextToSize(commentText, maxWidth)
            // Show more lines but with proper spacing - expand card height
            const commentHeight = Math.min(commentLines.length * 3, 12) // Max 4 lines
            doc.text(commentLines.slice(0, 4), 45, yPosition + 28) // Show up to 4 lines
            doc.setFontSize(9) // Reset font size
            yPosition += commentHeight // Add extra space for longer comments
          }
          
          yPosition += 40
        })
      }

      // Competencies Section  
      if (competencies.length > 0) {
        if (yPosition > 250) {
          addPageBreak(doc)
          yPosition = 20
        }
        
        doc.setTextColor(30, 41, 59) // Dark slate
        doc.setFontSize(12)
        doc.text(labels.competencies, 20, yPosition)
        doc.setDrawColor(226, 232, 240) // Light line under header
        doc.line(20, yPosition + 2, 190, yPosition + 2)
        
        yPosition += 25

        competencies.forEach((item, index) => {
          if (yPosition > 250) {
            addPageBreak(doc)
            yPosition = 20
          }

          // Item card (same format as OKRs)
          doc.setFillColor(252, 252, 252) // Gray-100
          doc.rect(25, yPosition, 165, 35, 'F')
          doc.setDrawColor(229, 231, 235) // Gray-200
          doc.rect(25, yPosition, 165, 35, 'S')
          
          // Rating circle - perfectly centered
          if (item.rating !== null) {
            const color = getRatingColor(item.rating)
            doc.setFillColor(color.r, color.g, color.b)
            doc.circle(35, yPosition + 10, 5, 'F') // Radius 5
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(10)
            // Perfect centering using text width
            const ratingText = item.rating.toString()
            const textWidth = doc.getTextWidth(ratingText)
            doc.text(ratingText, 35 - (textWidth / 2), yPosition + 13)
          }
          
          // Content
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(11)
          const titleText = `${index + 1}. ${item.title}`
          doc.text(titleText, 45, yPosition + 8)
          
          doc.setFontSize(9)
          doc.setTextColor(75, 85, 99) // Gray-600
          const maxWidth = 140
          const descLines = doc.splitTextToSize(item.description, maxWidth)
          doc.text(descLines.slice(0, 2), 45, yPosition + 16)
          
          if (item.comment) {
            doc.setTextColor(71, 85, 105) // Medium slate for comments
            doc.setFontSize(8)
            const commentText = `Comment: ${item.comment}` // No emoji, just clean text
            const commentLines = doc.splitTextToSize(commentText, maxWidth)
            // Show more lines but with proper spacing
            const commentHeight = Math.min(commentLines.length * 3, 12) // Max 4 lines
            doc.text(commentLines.slice(0, 4), 45, yPosition + 28) // Show up to 4 lines
            doc.setFontSize(9) // Reset font size
            yPosition += commentHeight // Add extra space for longer comments
          }
          
          yPosition += 40
        })
      }
    }

    // Overall Comment (if provided)
    if (evaluation.overallComment) {
      if (yPosition > 220) {
        addPageBreak(doc)
        yPosition = 20
      }
      
      doc.setTextColor(30, 41, 59) // Dark slate
      doc.setFontSize(12)
      doc.text(labels.overallComment, 20, yPosition)
      doc.setDrawColor(226, 232, 240) // Light line under header
      doc.line(20, yPosition + 2, 190, yPosition + 2)
      
      yPosition += 25
      
      doc.setFillColor(249, 250, 251) // Gray-50
      doc.rect(25, yPosition, 165, 30, 'F')
      doc.setDrawColor(229, 231, 235) // Gray-200
      doc.rect(25, yPosition, 165, 30, 'S')
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      const commentLines = doc.splitTextToSize(evaluation.overallComment, 150)
      doc.text(commentLines.slice(0, 3), 30, yPosition + 8) // Limit to 3 lines
    }
  })

  return Buffer.from(doc.output('arraybuffer'))
}