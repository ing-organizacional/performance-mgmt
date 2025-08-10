'use client'

import { DepartmentRatingCard } from './components/DepartmentRatingCard'
import { RatingsHeader } from './components/RatingsHeader'
import { OverviewSection } from './components/OverviewSection'
import { ExportErrorDisplay } from './components/ExportErrorDisplay'
import { EmptyDepartmentsState } from './components/EmptyDepartmentsState'
import { useDepartmentRatings } from './hooks/useDepartmentRatings'

interface DepartmentRating {
  department: string
  manager: {
    name: string
    email: string | null
  } | null
  ratings: {
    outstanding: number
    exceeds: number
    meets: number
    below: number
    needs: number
    total: number
  }
  employees: {
    total: number
    evaluated: number
    pending: number
  }
  allEmployees: {
    id: string
    name: string
    rating: number
    status: string
    evaluationId: string
    isManager: boolean
  }[]
  criticalEmployees: {
    id: string
    name: string
    rating: number
    status: string
    evaluationId: string
    isManager: boolean
  }[]
}

interface DepartmentRatingsClientProps {
  departments: DepartmentRating[]
}


export default function DepartmentRatingsClient({ departments }: DepartmentRatingsClientProps) {
  const { exportError } = useDepartmentRatings({ departments })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <RatingsHeader departmentCount={departments.length} />

      <main className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        {exportError && <ExportErrorDisplay exportError={exportError} />}
        
        <OverviewSection departments={departments} />

        {/* Department Cards */}
        <div className="space-y-6">
          {departments.map((department) => (
            <DepartmentRatingCard key={department.department} department={department} />
          ))}
        </div>

        {departments.length === 0 && <EmptyDepartmentsState />}
      </main>
    </div>
  )
}