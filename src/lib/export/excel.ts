/**
 * Excel generation for evaluation exports
 */

import * as XLSX from 'xlsx'
import type { EvaluationData } from './types'
import { getRatingText, calculateAverages } from './pdf-utils'

/**
 * Generate Excel file for evaluations
 */
export function generateExcel(evaluations: EvaluationData[], language = 'en'): Buffer {
  const workbook = XLSX.utils.book_new()
  
  // Create summary data
  const summaryData = evaluations.map(evaluation => {
    const { okrAvg, compAvg } = calculateAverages(evaluation.evaluationItemsData)
    
    return {
      [language === 'es' ? 'Empleado' : 'Employee']: evaluation.employee.name,
      [language === 'es' ? 'Email' : 'Email']: evaluation.employee.email || evaluation.employee.username || '',
      [language === 'es' ? 'Departamento' : 'Department']: evaluation.employee.department || '',
      [language === 'es' ? 'Gerente' : 'Manager']: evaluation.manager.name,
      [language === 'es' ? 'Empresa' : 'Company']: evaluation.company.name,
      [language === 'es' ? 'Ciclo' : 'Cycle']: evaluation.cycle?.name || '',
      [language === 'es' ? 'Calificación General' : 'Overall Rating']: evaluation.overallRating || '',
      [language === 'es' ? 'Texto de Calificación' : 'Rating Text']: evaluation.overallRating ? getRatingText(evaluation.overallRating, language) : '',
      [language === 'es' ? 'Promedio OKRs' : 'OKRs Average']: okrAvg || '',
      [language === 'es' ? 'Promedio Competencias' : 'Competencies Average']: compAvg || '',
      [language === 'es' ? 'Estado' : 'Status']: evaluation.status,
      [language === 'es' ? 'Fecha Creación' : 'Created Date']: evaluation.createdAt.toISOString().split('T')[0],
      [language === 'es' ? 'Última Actualización' : 'Last Updated']: evaluation.updatedAt.toISOString().split('T')[0],
      [language === 'es' ? 'Comentario General' : 'Overall Comment']: evaluation.overallComment || ''
    }
  })
  
  // Create summary worksheet
  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summaryWs, language === 'es' ? 'Resumen' : 'Summary')
  
  // Create detailed worksheet with individual items
  const detailedData: Record<string, string | number>[] = []
  
  evaluations.forEach(evaluation => {
    evaluation.evaluationItemsData.forEach((item) => {
      detailedData.push({
        [language === 'es' ? 'Empleado' : 'Employee']: evaluation.employee.name,
        [language === 'es' ? 'Departamento' : 'Department']: evaluation.employee.department || '',
        [language === 'es' ? 'Tipo' : 'Type']: item.type === 'okr' ? 'OKR' : (language === 'es' ? 'Competencia' : 'Competency'),
        [language === 'es' ? 'Título' : 'Title']: item.title,
        [language === 'es' ? 'Descripción' : 'Description']: item.description,
        [language === 'es' ? 'Nivel' : 'Level']: item.level || '',
        [language === 'es' ? 'Calificación' : 'Rating']: item.rating || '',
        [language === 'es' ? 'Texto de Calificación' : 'Rating Text']: item.rating ? getRatingText(item.rating, language) : '',
        [language === 'es' ? 'Comentario' : 'Comment']: item.comment || '',
        [language === 'es' ? 'Fecha Límite' : 'Deadline']: item.evaluationDeadline || '',
        [language === 'es' ? 'Establecido Por' : 'Deadline Set By']: item.deadlineSetBy || '',
        [language === 'es' ? 'Rol que Estableció' : 'Deadline Set By Role']: item.deadlineSetByRole || ''
      })
    })
  })
  
  if (detailedData.length > 0) {
    const detailedWs = XLSX.utils.json_to_sheet(detailedData)
    XLSX.utils.book_append_sheet(workbook, detailedWs, language === 'es' ? 'Detallado' : 'Detailed')
  }
  
  // Create department analysis worksheet
  const departmentMap = new Map<string, {
    employees: number
    totalRating: number
    ratedEmployees: number
    okrRatings: number[]
    compRatings: number[]
  }>()
  
  evaluations.forEach(evaluation => {
    const dept = evaluation.employee.department || (language === 'es' ? 'Sin Departamento' : 'No Department')
    
    if (!departmentMap.has(dept)) {
      departmentMap.set(dept, {
        employees: 0,
        totalRating: 0,
        ratedEmployees: 0,
        okrRatings: [],
        compRatings: []
      })
    }
    
    const deptData = departmentMap.get(dept)!
    deptData.employees++
    
    if (evaluation.overallRating) {
      deptData.totalRating += evaluation.overallRating
      deptData.ratedEmployees++
    }
    
    // Collect item ratings by type
    evaluation.evaluationItemsData.forEach(item => {
      if (item.rating !== null) {
        if (item.type === 'okr') {
          deptData.okrRatings.push(item.rating)
        } else if (item.type === 'competency') {
          deptData.compRatings.push(item.rating)
        }
      }
    })
  })
  
  const departmentData = Array.from(departmentMap.entries()).map(([department, data]) => {
    const avgRating = data.ratedEmployees > 0 ? Math.round((data.totalRating / data.ratedEmployees) * 100) / 100 : 0
    const completionRate = Math.round((data.ratedEmployees / data.employees) * 100)
    const avgOkr = data.okrRatings.length > 0 ? Math.round((data.okrRatings.reduce((a, b) => a + b, 0) / data.okrRatings.length) * 100) / 100 : 0
    const avgComp = data.compRatings.length > 0 ? Math.round((data.compRatings.reduce((a, b) => a + b, 0) / data.compRatings.length) * 100) / 100 : 0
    
    return {
      [language === 'es' ? 'Departamento' : 'Department']: department,
      [language === 'es' ? 'Total Empleados' : 'Total Employees']: data.employees,
      [language === 'es' ? 'Empleados Evaluados' : 'Evaluated Employees']: data.ratedEmployees,
      [language === 'es' ? 'Porcentaje Completado' : 'Completion Rate']: `${completionRate}%`,
      [language === 'es' ? 'Calificación Promedio' : 'Average Rating']: avgRating,
      [language === 'es' ? 'Promedio OKRs' : 'Average OKRs']: avgOkr || '',
      [language === 'es' ? 'Promedio Competencias' : 'Average Competencies']: avgComp || ''
    }
  })
  
  if (departmentData.length > 0) {
    const departmentWs = XLSX.utils.json_to_sheet(departmentData)
    XLSX.utils.book_append_sheet(workbook, departmentWs, language === 'es' ? 'Departamentos' : 'Departments')
  }
  
  // Create statistics worksheet
  const totalEvaluations = evaluations.length
  const ratedEvaluations = evaluations.filter(e => e.overallRating).length
  const completionRate = totalEvaluations > 0 ? Math.round((ratedEvaluations / totalEvaluations) * 100) : 0
  const avgRating = ratedEvaluations > 0 
    ? Math.round((evaluations.reduce((sum, e) => sum + (e.overallRating || 0), 0) / ratedEvaluations) * 100) / 100
    : 0

  // Calculate company-wide averages
  const allOkrRatings: number[] = []
  const allCompRatings: number[] = []
  
  evaluations.forEach(evaluation => {
    evaluation.evaluationItemsData.forEach(item => {
      if (item.rating !== null) {
        if (item.type === 'okr') {
          allOkrRatings.push(item.rating)
        } else if (item.type === 'competency') {
          allCompRatings.push(item.rating)
        }
      }
    })
  })

  const companyOkrAvg = allOkrRatings.length > 0 
    ? Math.round((allOkrRatings.reduce((a, b) => a + b, 0) / allOkrRatings.length) * 100) / 100 
    : 0

  const companyCompAvg = allCompRatings.length > 0
    ? Math.round((allCompRatings.reduce((a, b) => a + b, 0) / allCompRatings.length) * 100) / 100
    : 0

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  evaluations.forEach(evaluation => {
    if (evaluation.overallRating && evaluation.overallRating >= 1 && evaluation.overallRating <= 5) {
      ratingDistribution[evaluation.overallRating as keyof typeof ratingDistribution]++
    }
  })
  
  const statsData = [
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Total de Evaluaciones' : 'Total Evaluations', [language === 'es' ? 'Valor' : 'Value']: totalEvaluations },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Evaluaciones Completadas' : 'Completed Evaluations', [language === 'es' ? 'Valor' : 'Value']: ratedEvaluations },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Porcentaje de Completado' : 'Completion Rate', [language === 'es' ? 'Valor' : 'Value']: `${completionRate}%` },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Calificación Promedio' : 'Average Rating', [language === 'es' ? 'Valor' : 'Value']: avgRating },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Promedio OKRs Empresa' : 'Company OKRs Average', [language === 'es' ? 'Valor' : 'Value']: companyOkrAvg || '' },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Promedio Competencias Empresa' : 'Company Competencies Average', [language === 'es' ? 'Valor' : 'Value']: companyCompAvg || '' },
    { [language === 'es' ? 'Métrica' : 'Metric']: '', [language === 'es' ? 'Valor' : 'Value']: '' }, // Empty row
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Distribución de Calificaciones:' : 'Rating Distribution:', [language === 'es' ? 'Valor' : 'Value']: '' },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Sobresaliente (5)' : 'Outstanding (5)', [language === 'es' ? 'Valor' : 'Value']: ratingDistribution[5] },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Supera Expectativas (4)' : 'Exceeds Expectations (4)', [language === 'es' ? 'Valor' : 'Value']: ratingDistribution[4] },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Cumple Expectativas (3)' : 'Meets Expectations (3)', [language === 'es' ? 'Valor' : 'Value']: ratingDistribution[3] },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Por Debajo Expectativas (2)' : 'Below Expectations (2)', [language === 'es' ? 'Valor' : 'Value']: ratingDistribution[2] },
    { [language === 'es' ? 'Métrica' : 'Metric']: language === 'es' ? 'Necesita Mejorar (1)' : 'Needs Improvement (1)', [language === 'es' ? 'Valor' : 'Value']: ratingDistribution[1] }
  ]
  
  const statsWs = XLSX.utils.json_to_sheet(statsData)
  XLSX.utils.book_append_sheet(workbook, statsWs, language === 'es' ? 'Estadísticas' : 'Statistics')
  
  // Generate the buffer
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  return buffer
}