import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getEvaluationItems, getTeamData, getEvaluation } from '@/lib/actions/evaluations'
import EvaluateClient from './EvaluateClient'

interface EvaluatePageProps {
  params: Promise<{ id: string }>
}

export default async function EvaluatePage({ params }: EvaluatePageProps) {
  // Get session
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Only managers and HR can access this page
  if (session.user.role !== 'manager' && session.user.role !== 'hr') {
    redirect('/dashboard')
  }

  // Await params
  const { id: employeeId } = await params

  // Fetch data using Server Actions (with caching)
  const [itemsResult, teamResult] = await Promise.all([
    getEvaluationItems(employeeId),
    getTeamData()
  ])

  // Handle errors
  if (!itemsResult.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            Error Loading Evaluation
          </h2>
          <p className="text-gray-600 mb-4">
            {itemsResult.error || 'Failed to load evaluation items'}
          </p>
          <a 
            href="/evaluations"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Evaluations
          </a>
        </div>
      </div>
    )
  }

  if (!teamResult.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            Error Loading Team Data
          </h2>
          <p className="text-gray-600 mb-4">
            {teamResult.error || 'Failed to load team information'}
          </p>
          <a 
            href="/evaluations"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Evaluations
          </a>
        </div>
      </div>
    )
  }

  // Find the specific employee
  const employeeData = teamResult.employees?.find((emp: { id: string }) => emp.id === employeeId)
  
  if (!employeeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            Employee Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested employee could not be found or you do not have permission to evaluate them.
          </p>
          <a 
            href="/evaluations"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Evaluations
          </a>
        </div>
      </div>
    )
  }

  // Check if employee has existing evaluation
  let existingEvaluationData = null
  let evaluationStatus: 'draft' | 'submitted' | 'completed' = 'draft'
  let evaluationId = null

  const latestEval = (employeeData as any).evaluationsReceived?.[0]
  if (latestEval && (latestEval.status === 'submitted' || latestEval.status === 'draft' || latestEval.status === 'completed')) {
    evaluationId = latestEval.id
    evaluationStatus = latestEval.status
    
    // Load existing evaluation data
    const evaluationResult = await getEvaluation(latestEval.id)
    if (evaluationResult.success && evaluationResult.data) {
      existingEvaluationData = evaluationResult.data
    }
  }

  // Create employee object with required fields
  const employee = {
    id: employeeData.id,
    name: employeeData.name,
    role: 'employee', // Default role since it's not in the query
    position: 'Employee' // Default position since it's not in the query
  }

  // Process evaluation items with existing data if available
  let processedItems = itemsResult.items || []
  let overallRating = null
  let overallComment = ''

  if (existingEvaluationData) {
    // Parse and merge existing evaluation data
    if (existingEvaluationData.evaluationItemsData) {
      try {
        const savedItems = JSON.parse(existingEvaluationData.evaluationItemsData)
        processedItems = processedItems.map((item: any) => {
          const savedItem = savedItems.find((saved: any) => saved.id === item.id)
          return {
            ...item,
            rating: savedItem?.rating || null,
            comment: savedItem?.comment || '',
          }
        })
      } catch (error) {
        console.error('Error parsing evaluation data:', error)
      }
    }
    
    // Load overall rating and comments
    if (existingEvaluationData.overallRating) {
      overallRating = existingEvaluationData.overallRating
    }
    if (existingEvaluationData.managerComments) {
      overallComment = existingEvaluationData.managerComments
    }
  }

  // Pass data to client component
  return (
    <EvaluateClient 
      employeeId={employeeId}
      employee={employee}
      initialItems={processedItems}
      userRole={session.user.role}
      companyId={session.user.companyId}
      evaluationId={evaluationId}
      evaluationStatus={evaluationStatus}
      initialOverallRating={overallRating}
      initialOverallComment={overallComment}
    />
  )
}