import { NextRequest, NextResponse } from 'next/server'
import { getEvaluationData, generatePDF } from '@/lib/export'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

    const evaluation = await getEvaluationData(id)
    if (!evaluation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evaluation not found' 
      }, { status: 404 })
    }

    if (format === 'pdf') {
      const pdfBuffer = generatePDF(evaluation)
      
      const filename = `evaluation_${evaluation.employee.name.replace(/\s+/g, '_')}_${evaluation.periodDate}.pdf`
      
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