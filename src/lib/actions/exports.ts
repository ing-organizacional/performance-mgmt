'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { getEvaluationData, getCompanyEvaluations, generatePDF, generateExcel, generateMultiEvaluationPDF, generateDepartmentDetailedPDF } from '@/lib/export'

interface ExportResult {
  success: boolean
  data?: number[] // Changed from Buffer to number array for serialization
  filename?: string
  contentType?: string
  error?: string
}

/**
 * Export individual evaluation - accessible by employee (own), manager (their team), HR (all)
 */
export async function exportEvaluation(evaluationId: string, format: 'pdf' | 'excel' = 'pdf', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    // Verify user has access to this evaluation
    const whereCondition = {
      id: evaluationId,
      companyId: user.companyId,
      ...(user.role === 'hr' 
        ? {} // HR can access all evaluations in their company
        : {
            OR: [
              { managerId: user.id }, // User is the manager
              { employeeId: user.id }, // User is the employee
            ]
          }
      )
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: whereCondition,
      include: {
        employee: { select: { name: true } }
      }
    })

    if (!evaluation) {
      return { success: false, error: 'Evaluation not found or access denied' }
    }

    const evaluationData = await getEvaluationData(evaluationId)
    if (!evaluationData) {
      return { success: false, error: 'Evaluation data not found' }
    }

    // Validation: ensure evaluation has required data

    if (format === 'pdf') {
      try {
        const pdfBuffer = generatePDF(evaluationData, language)
        const filename = `evaluation_${evaluation.employee.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        
        // PDF generation successful
        
        return {
          success: true,
          data: Array.from(pdfBuffer), // Convert Buffer to array for serialization
          filename,
          contentType: 'application/pdf'
        }
      } catch (error) {
        console.error('PDF generation error:', error)
        return { success: false, error: 'PDF generation failed' }
      }
    }

    return { success: false, error: 'Format not supported for individual evaluations' }

  } catch (error) {
    console.error('Error in exportEvaluation:', error)
    return { success: false, error: 'Export failed' }
  }
}

/**
 * Export team evaluations - accessible by manager (their team only) and HR (all)
 */
export async function exportTeamEvaluations(format: 'pdf' | 'excel' = 'excel', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    // Only managers and HR can export team data
    if (user.role !== 'manager' && user.role !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Get team evaluations based on user role
    let evaluations
    if (user.role === 'hr') {
      // HR gets all company evaluations
      evaluations = await getCompanyEvaluations(user.companyId)
    } else {
      // Managers get only their team's evaluations
      evaluations = await getCompanyEvaluations(user.companyId)
      evaluations = evaluations.filter(evaluation => evaluation.managerId === user.id)
    }

    if (evaluations.length === 0) {
      return { success: false, error: 'No team evaluations found' }
    }

    const companyName = evaluations[0].company.name.replace(/\s+/g, '_')
    const teamSuffix = user.role === 'hr' ? 'all_teams' : 'my_team'
    const dateSuffix = new Date().toISOString().split('T')[0]

    if (format === 'excel') {
      const excelBuffer = generateExcel(evaluations, language)
      const filename = `team_evaluations_${companyName}_${teamSuffix}_${dateSuffix}.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)), // Convert to array for serialization
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      // For PDF export of multiple evaluations, create a consolidated summary PDF
      const pdfBuffer = generateMultiEvaluationPDF(evaluations, language, 'Team Evaluations')
      const filename = `team_evaluations_${companyName}_${teamSuffix}_${dateSuffix}.pdf`
      
      return {
        success: true,
        data: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf'
      }
    }

    return { success: false, error: 'Unsupported format for team exports.' }

  } catch (error) {
    console.error('Error in exportTeamEvaluations:', error)
    return { success: false, error: 'Export failed' }
  }
}

/**
 * Export department evaluations - accessible by managers (their department) and HR (any department)
 */
export async function exportDepartmentEvaluations(department?: string, format: 'pdf' | 'excel' = 'excel', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    // Only managers and HR can export department data
    if (user.role !== 'manager' && user.role !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    // Determine which department to export
    const targetDepartment = department || user.department
    if (!targetDepartment) {
      return { success: false, error: 'Department not specified' }
    }

    // Managers can only export their own department
    if (user.role === 'manager' && targetDepartment !== user.department) {
      return { success: false, error: 'Access denied - Cannot export other departments' }
    }

    // Get department evaluations
    const evaluations = await getCompanyEvaluations(user.companyId)
    
    // Export department evaluations
    
    const departmentEvaluations = evaluations.filter(evaluation => evaluation.employee.department === targetDepartment)
    
    // Filter evaluations for the target department

    if (departmentEvaluations.length === 0) {
      return { success: false, error: `No evaluations found for department: ${targetDepartment}. Available departments: ${[...new Set(evaluations.map(e => e.employee.department))].join(', ')}` }
    }

    const departmentName = targetDepartment.replace(/\s+/g, '_')
    const cycleName = departmentEvaluations[0].cycle?.name?.replace(/\s+/g, '_') || 'No_Cycle'

    if (format === 'excel') {
      const excelBuffer = generateExcel(departmentEvaluations, language)
      const filename = `${departmentName}_${cycleName}_Report.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)), // Convert to array for serialization
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      // For PDF export of department evaluations with full individual details
      const pdfBuffer = generateDepartmentDetailedPDF(departmentEvaluations, language, targetDepartment)
      const filename = `${departmentName}_${cycleName}_Report.pdf`
      
      return {
        success: true,
        data: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf'
      }
    }

    return { success: false, error: 'Unsupported format for department exports.' }

  } catch (error) {
    console.error('Error in exportDepartmentEvaluations:', error)
    return { success: false, error: 'Export failed' }
  }
}

/**
 * Export company-wide evaluations - accessible by HR only
 */
export async function exportCompanyEvaluations(format: 'pdf' | 'excel' = 'excel', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    // Only HR can export company-wide data
    if (user.role !== 'hr') {
      return { success: false, error: 'Access denied - HR role required' }
    }

    const evaluations = await getCompanyEvaluations(user.companyId)

    if (evaluations.length === 0) {
      return { success: false, error: 'No company evaluations found' }
    }

    const companyName = evaluations[0].company.name.replace(/\s+/g, '_')
    const dateSuffix = new Date().toISOString().split('T')[0]

    if (format === 'excel') {
      const excelBuffer = generateExcel(evaluations, language)
      const filename = `company_evaluations_${companyName}_${dateSuffix}.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)), // Convert to array for serialization
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      // For PDF export of company evaluations
      const pdfBuffer = generateMultiEvaluationPDF(evaluations, language, 'Company Evaluations')
      const filename = `company_evaluations_${companyName}_${dateSuffix}.pdf`
      
      return {
        success: true,
        data: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf'
      }
    }

    return { success: false, error: 'Unsupported format for company exports.' }

  } catch (error) {
    console.error('Error in exportCompanyEvaluations:', error)
    return { success: false, error: 'Export failed' }
  }
}

/**
 * Export selected employees' evaluations - accessible by HR and managers (with permission checks)
 */
export async function exportSelectedEmployees(employeeIds: string[], format: 'pdf' | 'excel' = 'excel', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    // Only managers and HR can export employee data
    if (user.role !== 'manager' && user.role !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    if (employeeIds.length === 0) {
      return { success: false, error: 'No employees selected' }
    }

    // Get all company evaluations
    const allEvaluations = await getCompanyEvaluations(user.companyId)
    
    // Filter to selected employees
    let selectedEvaluations = allEvaluations.filter(evaluation => 
      employeeIds.includes(evaluation.employeeId)
    )

    // Apply role-based filtering for managers
    if (user.role === 'manager') {
      // Managers can only export evaluations they manage
      selectedEvaluations = selectedEvaluations.filter(evaluation => 
        evaluation.managerId === user.id
      )
    }

    if (selectedEvaluations.length === 0) {
      return { success: false, error: 'No accessible evaluations found for selected employees' }
    }

    const companyName = selectedEvaluations[0].company.name.replace(/\s+/g, '_')
    const dateSuffix = new Date().toISOString().split('T')[0]
    const countSuffix = `${selectedEvaluations.length}_employees`

    if (format === 'excel') {
      const excelBuffer = generateExcel(selectedEvaluations, language)
      const filename = `selected_evaluations_${companyName}_${countSuffix}_${dateSuffix}.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)),
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      const pdfBuffer = generateMultiEvaluationPDF(selectedEvaluations, language, 'Selected Employees')
      const filename = `selected_evaluations_${companyName}_${countSuffix}_${dateSuffix}.pdf`
      
      return {
        success: true,
        data: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf'
      }
    }

    return { success: false, error: 'Unsupported format for selected employee exports.' }

  } catch (error) {
    console.error('Error in exportSelectedEmployees:', error)
    return { success: false, error: 'Export failed' }
  }
}

/**
 * Export top performers (ratings 4-5) - accessible by HR and managers
 */
export async function exportTopPerformers(format: 'pdf' | 'excel' = 'excel', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    if (user.role !== 'manager' && user.role !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    let evaluations = await getCompanyEvaluations(user.companyId)
    
    // Apply role-based filtering for managers
    if (user.role === 'manager') {
      evaluations = evaluations.filter(evaluation => evaluation.managerId === user.id)
    }

    // Filter for top performers (ratings 4-5)
    const topPerformers = evaluations.filter(evaluation => 
      evaluation.overallRating && evaluation.overallRating >= 4
    )

    if (topPerformers.length === 0) {
      return { success: false, error: 'No top performers found (ratings 4-5)' }
    }

    const companyName = topPerformers[0].company.name.replace(/\s+/g, '_')
    const dateSuffix = new Date().toISOString().split('T')[0]
    const countSuffix = `${topPerformers.length}_top_performers`

    if (format === 'excel') {
      const excelBuffer = generateExcel(topPerformers, language)
      const filename = `top_performers_${companyName}_${countSuffix}_${dateSuffix}.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)),
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      const pdfBuffer = generateMultiEvaluationPDF(topPerformers, language, 'Top Performers (Ratings 4-5)')
      const filename = `top_performers_${companyName}_${countSuffix}_${dateSuffix}.pdf`
      
      return {
        success: true,
        data: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf'
      }
    }

    return { success: false, error: 'Unsupported format for top performers export.' }

  } catch (error) {
    console.error('Error in exportTopPerformers:', error)
    return { success: false, error: 'Export failed' }
  }
}

/**
 * Export employees needing attention (ratings 1-2) - accessible by HR and managers
 */
export async function exportNeedsAttention(format: 'pdf' | 'excel' = 'excel', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    if (user.role !== 'manager' && user.role !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    let evaluations = await getCompanyEvaluations(user.companyId)
    
    // Apply role-based filtering for managers
    if (user.role === 'manager') {
      evaluations = evaluations.filter(evaluation => evaluation.managerId === user.id)
    }

    // Filter for employees needing attention (ratings 1-2)
    const needsAttention = evaluations.filter(evaluation => 
      evaluation.overallRating && evaluation.overallRating <= 2
    )

    if (needsAttention.length === 0) {
      return { success: false, error: 'No employees needing attention found (ratings 1-2)' }
    }

    const companyName = needsAttention[0].company.name.replace(/\s+/g, '_')
    const dateSuffix = new Date().toISOString().split('T')[0]
    const countSuffix = `${needsAttention.length}_needs_attention`

    if (format === 'excel') {
      const excelBuffer = generateExcel(needsAttention, language)
      const filename = `needs_attention_${companyName}_${countSuffix}_${dateSuffix}.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)),
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      const pdfBuffer = generateMultiEvaluationPDF(needsAttention, language, 'Needs Attention (Ratings 1-2)')
      const filename = `needs_attention_${companyName}_${countSuffix}_${dateSuffix}.pdf`
      
      return {
        success: true,
        data: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf'
      }
    }

    return { success: false, error: 'Unsupported format for needs attention export.' }

  } catch (error) {
    console.error('Error in exportNeedsAttention:', error)
    return { success: false, error: 'Export failed' }
  }
}

/**
 * Export selected departments - accessible by HR and managers (with permission checks)
 */
export async function exportSelectedDepartments(departmentNames: string[], format: 'pdf' | 'excel' = 'excel', language = 'en'): Promise<ExportResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const user = session.user
    
    // Only managers and HR can export department data
    if (user.role !== 'manager' && user.role !== 'hr') {
      return { success: false, error: 'Access denied - Manager or HR role required' }
    }

    if (departmentNames.length === 0) {
      return { success: false, error: 'No departments selected' }
    }

    // Get all company evaluations
    const allEvaluations = await getCompanyEvaluations(user.companyId)
    
    // Filter to selected departments
    let selectedEvaluations = allEvaluations.filter(evaluation => 
      departmentNames.includes(evaluation.employee.department || 'Unassigned')
    )

    // Apply role-based filtering for managers
    if (user.role === 'manager') {
      // Managers can only export evaluations they manage
      selectedEvaluations = selectedEvaluations.filter(evaluation => 
        evaluation.managerId === user.id
      )
    }

    if (selectedEvaluations.length === 0) {
      return { success: false, error: 'No accessible evaluations found for selected departments' }
    }

    const companyName = selectedEvaluations[0].company.name.replace(/\s+/g, '_')
    const dateSuffix = new Date().toISOString().split('T')[0]
    const deptSuffix = departmentNames.length === 1 
      ? departmentNames[0].replace(/\s+/g, '_')
      : `${departmentNames.length}_departments`

    if (format === 'excel') {
      const excelBuffer = generateExcel(selectedEvaluations, language)
      const filename = `department_summary_${companyName}_${deptSuffix}_${dateSuffix}.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)),
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      const pdfBuffer = generateMultiEvaluationPDF(selectedEvaluations, language, 'Department Summary - Selected Departments')
      const filename = `department_summary_${companyName}_${deptSuffix}_${dateSuffix}.pdf`
      
      return {
        success: true,
        data: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf'
      }
    }

    return { success: false, error: 'Unsupported format for department summary export.' }

  } catch (error) {
    console.error('Error in exportSelectedDepartments:', error)
    return { success: false, error: 'Export failed' }
  }
}