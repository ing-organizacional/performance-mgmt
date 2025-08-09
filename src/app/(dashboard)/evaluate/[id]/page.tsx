import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getEvaluationItems, getTeamData, getEvaluation } from '@/lib/actions/evaluations'
import EvaluateClient from './EvaluateClient'

interface EvaluatePageProps {
  params: Promise<{ id: string }>
}

interface EmployeeEvaluation {
  id: string
  status: 'draft' | 'submitted' | 'completed'
  createdAt: Date
  overallRating: number | null
}

interface EmployeeWithEvaluations {
  id: string
  name: string
  email?: string | null
  role?: string
  position?: string
  evaluationsReceived?: EmployeeEvaluation[]
}

interface SavedEvaluationItem {
  id: string
  rating?: number | null
  comment?: string
  title?: string
  description?: string
  [key: string]: unknown // Allow additional properties from JSON
}

// Use the same interface as EvaluateClient expects
interface ProcessedEvaluationItem {
  id: string
  title: string
  description: string
  type: string
  rating: number | null
  comment: string
  level?: string
  createdBy?: string
  creatorRole?: string
  evaluationDeadline?: string | null
  deadlineSetBy?: string | null
  deadlineSetByRole?: string | null
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

  const latestEval = (employeeData as EmployeeWithEvaluations).evaluationsReceived?.[0]
  if (latestEval && ['submitted', 'draft', 'completed'].includes(latestEval.status)) {
    // Type assertion after runtime validation
    const typedEval = latestEval as EmployeeEvaluation
    evaluationId = typedEval.id
    evaluationStatus = typedEval.status
    
    // Load existing evaluation data
    const evaluationResult = await getEvaluation(typedEval.id)
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
  let processedItems: ProcessedEvaluationItem[] = (itemsResult.items || []).map(item => ({
    ...item,
    rating: null,
    comment: '',
    level: item.level ?? '',
    createdBy: item.createdBy ?? '',
    creatorRole: item.creatorRole ?? '',
    evaluationDeadline: item.evaluationDeadline ?? null,
    deadlineSetBy: item.deadlineSetBy ?? null,
    deadlineSetByRole: item.deadlineSetByRole ?? null
  }))
  let overallRating = null
  let overallComment = ''

  if (existingEvaluationData) {
    // Parse and merge existing evaluation data
    if (existingEvaluationData.evaluationItemsData) {
      try {
        const savedItems = JSON.parse(existingEvaluationData.evaluationItemsData)
        processedItems = processedItems.map((item: ProcessedEvaluationItem): ProcessedEvaluationItem => {
          const savedItem = savedItems.find((saved: SavedEvaluationItem) => saved.id === item.id)
          return {
            ...item,
            rating: savedItem?.rating ?? null,
            comment: savedItem?.comment ?? '',
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