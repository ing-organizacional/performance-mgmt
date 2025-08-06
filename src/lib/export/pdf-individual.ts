/**
 * Individual PDF generation for single evaluations
 */

import jsPDF from 'jspdf'
import type { EvaluationData } from './types'
import { getRatingText, getRatingColor, getPDFLabels, calculateAverages } from './pdf-utils'

/**
 * Generate PDF for individual evaluation
 */
export function generatePDF(evaluation: EvaluationData, language = 'en'): Buffer {
  const doc = new jsPDF()
  const labels = getPDFLabels(language)
  let yPosition = 20

  // Calculate averages
  const { okrAvg, compAvg } = calculateAverages(evaluation.evaluationItemsData)

  // Header with company branding
  doc.setFillColor(59, 130, 246) // Blue-500
  doc.rect(0, 0, 220, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text(labels.title, 20, 16)
  
  yPosition = 35

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

  // Overall Rating Card (if available)
  if (evaluation.overallRating) {
    doc.setFillColor(16, 185, 129) // Emerald-500 header
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    const overallLabel = language === 'es' ? 'CALIFICACIÓN GENERAL' : 'OVERALL RATING'
    doc.text(overallLabel, 25, yPosition + 12)
    
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

  // Averages Summary Card
  if (okrAvg !== null || compAvg !== null) {
    doc.setFillColor(99, 102, 241) // Indigo-500 header
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    const avgLabel = language === 'es' ? 'PROMEDIOS' : 'AVERAGES'
    doc.text(avgLabel, 25, yPosition + 12)
    
    yPosition += 25
    
    // Create two-column layout for averages
    if (okrAvg !== null) {
      const okrColor = getRatingColor(Math.round(okrAvg))
      doc.setFillColor(okrColor.r, okrColor.g, okrColor.b)
      doc.rect(25, yPosition, 75, 20, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text(labels.avgOkr, 27, yPosition + 8)
      doc.setFontSize(16)
      doc.text(okrAvg.toString(), 27, yPosition + 16)
    }
    
    if (compAvg !== null) {
      const compColor = getRatingColor(Math.round(compAvg))
      doc.setFillColor(compColor.r, compColor.g, compColor.b)
      doc.rect(110, yPosition, 75, 20, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text(labels.avgComp, 112, yPosition + 8)
      doc.setFontSize(16)
      doc.text(compAvg.toString(), 112, yPosition + 16)
    }
    
    yPosition += 30
  }

  // Evaluation Items
  if (evaluation.evaluationItemsData && evaluation.evaluationItemsData.length > 0) {
    const okrs = evaluation.evaluationItemsData.filter(item => item.type === 'okr')
    const competencies = evaluation.evaluationItemsData.filter(item => item.type === 'competency')

    // OKRs Section
    if (okrs.length > 0) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFillColor(168, 85, 247) // Purple-500 header
      doc.rect(20, yPosition, 170, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.text(labels.objectives, 25, yPosition + 12)
      
      yPosition += 25

      okrs.forEach((item, index) => {
        if (yPosition > 250) {
          doc.addPage()
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
          // Show more lines but with proper spacing
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
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFillColor(236, 72, 153) // Pink-500 header
      doc.rect(20, yPosition, 170, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.text(labels.competencies, 25, yPosition + 12)
      
      yPosition += 25

      competencies.forEach((item, index) => {
        if (yPosition > 250) {
          doc.addPage()
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
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFillColor(75, 85, 99) // Gray-600 header
    doc.rect(20, yPosition, 170, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text(labels.overallComment, 25, yPosition + 12)
    
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

  return Buffer.from(doc.output('arraybuffer'))
}