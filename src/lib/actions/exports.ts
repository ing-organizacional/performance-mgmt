'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import { getEvaluationData, getCompanyEvaluations, generatePDF, generateExcel, generateMultiEvaluationPDF } from '@/lib/export'

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

    console.log('Evaluation data for PDF:', {
      hasEvaluationItems: !!evaluationData.evaluationItemsData,
      itemsCount: evaluationData.evaluationItemsData?.length || 0,
      hasOverallRating: !!evaluationData.overallRating,
      employeeName: evaluationData.employee.name
    })

    if (format === 'pdf') {
      try {
        const pdfBuffer = generatePDF(evaluationData, language)
        const filename = `evaluation_${evaluation.employee.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        
        console.log('PDF generated successfully, buffer size:', pdfBuffer.length)
        
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
    const departmentEvaluations = evaluations.filter(evaluation => evaluation.employee.department === targetDepartment)

    if (departmentEvaluations.length === 0) {
      return { success: false, error: `No evaluations found for department: ${targetDepartment}` }
    }

    const companyName = departmentEvaluations[0].company.name.replace(/\s+/g, '_')
    const departmentName = targetDepartment.replace(/\s+/g, '_')
    const dateSuffix = new Date().toISOString().split('T')[0]

    if (format === 'excel') {
      const excelBuffer = generateExcel(departmentEvaluations, language)
      const filename = `department_evaluations_${companyName}_${departmentName}_${dateSuffix}.xlsx`
      
      return {
        success: true,
        data: Array.from(Buffer.from(excelBuffer)), // Convert to array for serialization
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }

    if (format === 'pdf') {
      // For PDF export of department evaluations
      const pdfBuffer = generateMultiEvaluationPDF(departmentEvaluations, language, `Department: ${targetDepartment}`)
      const filename = `department_evaluations_${companyName}_${departmentName}_${dateSuffix}.pdf`
      
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