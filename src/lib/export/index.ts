/**
 * Export system main module
 * Public API for the refactored export functionality
 */

// Re-export all public functions and types
export type { EvaluationData, EvaluationItem, AnalyticsData, PDFLabels, RatingColor } from './types'

export { getEvaluationData, getCompanyEvaluations, generateAnalytics } from './data'

export { getRatingText, getRatingColor, getPDFLabels, calculateAverages, addPageBreak } from './pdf-utils'

export { generatePDF } from './pdf-individual'
export { generateDepartmentDetailedPDF } from './pdf-department'
export { generateMultiEvaluationPDF } from './pdf-multi'
export { generateExcel } from './excel'