'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Department {
  name: string
  employeeCount: number
  evaluatedCount: number
  pendingCount: number
  avgRating?: number
}

interface DepartmentSelectorProps {
  onSelectionChange: (selectedDepartments: string[]) => void
  companyId: string
}

export default function DepartmentSelector({ onSelectionChange, companyId }: DepartmentSelectorProps) {
  const { t } = useLanguage()
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartments()
  }, [companyId])

  useEffect(() => {
    onSelectionChange(selectedDepartments)
  }, [selectedDepartments, onSelectionChange])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/manager/team')
      if (response.ok) {
        const data = await response.json()
        
        // Aggregate department data from team members
        const departmentMap = new Map<string, Department>()
        
        if (data.teamMembers && Array.isArray(data.teamMembers)) {
          data.teamMembers.forEach((member: {
            department: string | null
            hasCompletedEvaluation?: boolean
            averageRating?: number
          }) => {
            const deptName = member.department || 'Unassigned'
            
            if (!departmentMap.has(deptName)) {
              departmentMap.set(deptName, {
                name: deptName,
                employeeCount: 0,
                evaluatedCount: 0,
                pendingCount: 0,
                avgRating: 0
              })
            }
            
            const dept = departmentMap.get(deptName)!
            dept.employeeCount++
            
            if (member.hasCompletedEvaluation) {
              dept.evaluatedCount++
            } else {
              dept.pendingCount++
            }
            
            // Update average rating (simplified calculation)
            if (member.averageRating) {
              dept.avgRating = (dept.avgRating || 0) + member.averageRating
            }
          })
        }
        
        // Calculate final averages and convert to array
        const departmentList = Array.from(departmentMap.values()).map(dept => ({
          ...dept,
          avgRating: dept.evaluatedCount > 0 ? (dept.avgRating || 0) / dept.evaluatedCount : undefined
        }))
        
        // Sort by name
        departmentList.sort((a, b) => a.name.localeCompare(b.name))
        
        setDepartments(departmentList)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'complete' && department.pendingCount === 0) ||
      (statusFilter === 'partial' && department.pendingCount > 0 && department.evaluatedCount > 0) ||
      (statusFilter === 'pending' && department.evaluatedCount === 0)
    
    return matchesSearch && matchesStatus
  })

  const toggleDepartment = (departmentName: string) => {
    setSelectedDepartments(prev => 
      prev.includes(departmentName)
        ? prev.filter(name => name !== departmentName)
        : [...prev, departmentName]
    )
  }

  const toggleAll = () => {
    if (selectedDepartments.length === filteredDepartments.length) {
      setSelectedDepartments([])
    } else {
      setSelectedDepartments(filteredDepartments.map(dept => dept.name))
    }
  }

  const getCompletionBadge = (department: Department) => {
    if (department.pendingCount === 0) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {t.dashboard.complete || "Complete"}
        </span>
      )
    } else if (department.evaluatedCount > 0) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
          {t.dashboard.partial || "Partial"} ({department.evaluatedCount}/{department.employeeCount})
        </span>
      )
    } else {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
          {t.dashboard.pending || "Pending"}
        </span>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">{t.common.loading}...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t.dashboard.searchDepartments || "Search departments..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t.dashboard.allStatus || "All Status"}</option>
            <option value="complete">{t.dashboard.complete || "Complete"}</option>
            <option value="partial">{t.dashboard.partial || "Partial"}</option>
            <option value="pending">{t.dashboard.pending || "Pending"}</option>
          </select>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {filteredDepartments.length} {t.common.departments || "departments"} {t.common.found || "found"}, {selectedDepartments.length} {t.common.selected || "selected"}
        </div>
        <button
          onClick={toggleAll}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {selectedDepartments.length === filteredDepartments.length ? t.common.deselectAll || 'Deselect All' : t.common.selectAll || 'Select All'}
        </button>
      </div>

      {/* Department List */}
      <div className="max-h-40 overflow-y-auto space-y-2">
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h1a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm">{t.common.noDepartmentsFound || "No departments found"}</p>
          </div>
        ) : (
          filteredDepartments.map((department) => (
            <label
              key={department.name}
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedDepartments.includes(department.name)}
                onChange={() => toggleDepartment(department.name)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{department.name}</span>
                    {getCompletionBadge(department)}
                  </div>
                  {department.avgRating && (
                    <div className="text-sm text-gray-600">
                      Avg: {department.avgRating.toFixed(1)}/5
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>{department.employeeCount} {t.common.employees || "employees"}</span>
                  <span className="text-green-600">{department.evaluatedCount} {t.dashboard.evaluated || "evaluated"}</span>
                  {department.pendingCount > 0 && (
                    <span className="text-orange-600">{department.pendingCount} {t.dashboard.pending || "pending"}</span>
                  )}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  )
}