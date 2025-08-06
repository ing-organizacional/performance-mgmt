/**
 * PDF utilities and helper functions
 */

import type { PDFLabels, RatingColor } from './types'

/**
 * Get rating text based on rating value and language
 */
export function getRatingText(rating: number, language = 'en'): string {
  const ratings = {
    en: {
      5: 'Outstanding',
      4: 'Exceeds Expectations', 
      3: 'Meets Expectations',
      2: 'Below Expectations',
      1: 'Needs Improvement',
      0: 'Not Rated'
    },
    es: {
      5: 'Sobresaliente',
      4: 'Supera Expectativas',
      3: 'Cumple Expectativas', 
      2: 'Por Debajo de Expectativas',
      1: 'Necesita Mejorar',
      0: 'Sin Calificar'
    }
  }
  
  return ratings[language as keyof typeof ratings]?.[rating as keyof typeof ratings.en] || 'Not Rated'
}

/**
 * Get color for rating visualization
 */
export function getRatingColor(rating: number): RatingColor {
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

/**
 * Get PDF labels for different languages
 */
export function getPDFLabels(language = 'en'): PDFLabels {
  const labels = {
    en: {
      title: 'Performance Evaluation Report',
      employee: 'Employee',
      manager: 'Manager', 
      department: 'Department',
      company: 'Company',
      cycle: 'Performance Cycle',
      period: 'Period',
      overallRating: 'Overall Rating',
      overallComment: 'Overall Comment',
      objectives: 'Objectives (OKRs)',
      competencies: 'Competencies',
      rating: 'Rating',
      comment: 'Comment',
      noComment: 'No comment provided',
      outstanding: 'Outstanding (5)',
      exceeds: 'Exceeds Expectations (4)',
      meets: 'Meets Expectations (3)', 
      below: 'Below Expectations (2)',
      needs: 'Needs Improvement (1)',
      notRated: 'Not Rated',
      avgOkr: 'Average OKR Rating',
      avgComp: 'Average Competency Rating'
    },
    es: {
      title: 'Reporte de Evaluación de Desempeño',
      employee: 'Empleado',
      manager: 'Gerente',
      department: 'Departamento', 
      company: 'Empresa',
      cycle: 'Ciclo de Desempeño',
      period: 'Período',
      overallRating: 'Calificación General',
      overallComment: 'Comentario General',
      objectives: 'Objetivos (OKRs)',
      competencies: 'Competencias',
      rating: 'Calificación',
      comment: 'Comentario',
      noComment: 'Sin comentario',
      outstanding: 'Sobresaliente (5)',
      exceeds: 'Supera Expectativas (4)',
      meets: 'Cumple Expectativas (3)',
      below: 'Por Debajo de Expectativas (2)', 
      needs: 'Necesita Mejorar (1)',
      notRated: 'Sin Calificar',
      avgOkr: 'Calificación Promedio OKR',
      avgComp: 'Calificación Promedio Competencias'
    }
  }

  return labels[language as keyof typeof labels] || labels.en
}

/**
 * Calculate averages for evaluation items
 */
export function calculateAverages(items: Array<{ type: string, rating: number | null }>) {
  const okrs = items.filter(item => item.type === 'okr' && item.rating !== null)
  const competencies = items.filter(item => item.type === 'competency' && item.rating !== null)

  const okrAvg = okrs.length > 0 
    ? Math.round((okrs.reduce((sum, item) => sum + (item.rating || 0), 0) / okrs.length) * 100) / 100
    : null

  const compAvg = competencies.length > 0
    ? Math.round((competencies.reduce((sum, item) => sum + (item.rating || 0), 0) / competencies.length) * 100) / 100  
    : null

  return { okrAvg, compAvg }
}

/**
 * Add page break to PDF
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addPageBreak(doc: any) {
  doc.addPage()
  return 20 // Reset Y position
}