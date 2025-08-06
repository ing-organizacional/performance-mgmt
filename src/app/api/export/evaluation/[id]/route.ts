import { NextRequest, NextResponse } from 'next/server'
import { getEvaluationData, generatePDF } from '@/lib/export'
import { requireManagerOrHR } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireManagerOrHR()
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const { id } = await params

    // Verify user has access to this evaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        companyId: user.companyId,
        OR: [
          { managerId: user.id }, // User is the manager
          { employeeId: user.id }, // User is the employee
          ...(user.role === 'hr' ? [{}] : []) // HR can access all evaluations in their company
        ]
      }
    })

    if (!evaluation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation not found or access denied' 
      }, { status: 404 })
    }
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

    const evaluationData = await getEvaluationData(id)
    if (!evaluationData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation not found' 
      }, { status: 404 })
    }

    if (format === 'pdf') {
      const pdfBuffer = generatePDF(evaluationData)
      
      const filename = `evaluation_${evaluationData.employee.name.replace(/\s+/g, '_')}_${evaluationData.periodDate}.pdf`
      
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid format. Use ?format=pdf' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error exporting evaluation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to export evaluation' 
    }, { status: 500 })
  }
}