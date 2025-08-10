import { useLanguage } from '@/contexts/LanguageContext'
import { useExport } from '@/hooks/useExport'

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

interface UseDepartmentRatingsProps {
  departments: DepartmentRating[]
}

export function useDepartmentRatings({ departments }: UseDepartmentRatingsProps) {
  const { t } = useLanguage()
  const { isExporting, exportCompany, exportError } = useExport()

  return {
    t,
    isExporting,
    exportCompany,
    exportError,
    departments
  }
}