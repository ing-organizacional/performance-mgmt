import { NextRequest, NextResponse } from 'next/server'
import { getCompanyEvaluations, generateExcel, generatePDF } from '@/lib/export'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const periodType = searchParams.get('periodType') || undefined
    const periodDate = searchParams.get('periodDate') || undefined

    const evaluations = await getCompanyEvaluations(companyId, periodType, periodDate)
    
    if (evaluations.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No evaluations found for the specified criteria' 
      }, { status: 404 })
    }

    const companyName = evaluations[0].company.name.replace(/\s+/g, '_')
    const periodSuffix = periodDate ? `_${periodDate}` : `_${periodType || 'all'}`

    if (format === 'excel') {
      const excelBuffer = generateExcel(evaluations)
      const filename = `evaluations_${companyName}${periodSuffix}.xlsx`
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': excelBuffer.length.toString()
        }
      })
    }

    if (format === 'pdf') {
      // For PDF export of multiple evaluations, we'll create a summary PDF
      // In a real implementation, you might want to create individual PDFs and zip them
      return NextResponse.json({ 
        success: false, 
        error: 'PDF export for multiple evaluations not implemented. Use ?format=excel or export individual evaluations.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid format. Use ?format=excel' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error exporting company evaluations:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to export evaluations' 
    }, { status: 500 })
  }
}