'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from '@/components/ui'

interface Employee {
  id: string
  name: string
  department: string | null
  role: string
  hasEvaluation: boolean
}

interface EmployeeSelectorProps {
  onSelectionChange: (selectedIds: string[]) => void
  companyId: string
}

export default function EmployeeSelector({ onSelectionChange, companyId }: EmployeeSelectorProps) {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [companyId])

  useEffect(() => {
    onSelectionChange(selectedEmployees)
  }, [selectedEmployees, onSelectionChange])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/manager/team')
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our Employee interface
        const employeeList: Employee[] = []
        
        // Add employees from team members
        if (data.teamMembers && Array.isArray(data.teamMembers)) {
          data.teamMembers.forEach((member: {
            id: string
            name: string
            department: string | null
            role: string
            hasCompletedEvaluation?: boolean
          }) => {
            employeeList.push({
              id: member.id,
              name: member.name,
              department: member.department,
              role: member.role,
              hasEvaluation: member.hasCompletedEvaluation || false
            })
          })
        }

        // Add current user if they have evaluations
        if (data.currentUser && data.currentUser.id) {
          employeeList.push({
            id: data.currentUser.id,
            name: data.currentUser.name,
            department: data.currentUser.department,
            role: data.currentUser.role,
            hasEvaluation: true // Assume current user has access to their own evaluation
          })
        }

        setEmployees(employeeList)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)))

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'evaluated' && employee.hasEvaluation) ||
      (statusFilter === 'pending' && !employee.hasEvaluation)
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const toggleAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" color="blue" />
        <span className="ml-3 text-sm text-gray-600">{t.common.loading}...</span>
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
            placeholder={t.dashboard.searchEmployees || "Search employees..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t.dashboard.allDepartments || "All Departments"}</option>
            {departments.map(dept => (
              <option key={dept} value={dept || 'Unassigned'}>{dept || t.common.unassigned || 'Unassigned'}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t.dashboard.allStatus || "All Status"}</option>
            <option value="evaluated">{t.dashboard.hasEvaluation || "Has Evaluation"}</option>
            <option value="pending">{t.dashboard.noEvaluation || "No Evaluation"}</option>
          </select>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {filteredEmployees.length} {t.common.employees || "employees"} {t.common.found || "found"}, {selectedEmployees.length} {t.common.selected || "selected"}
        </div>
        <button
          onClick={toggleAll}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {selectedEmployees.length === filteredEmployees.length ? t.common.deselectAll || 'Deselect All' : t.common.selectAll || 'Select All'}
        </button>
      </div>

      {/* Employee List */}
      <div className="max-h-40 overflow-y-auto space-y-2">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-sm">{t.common.noEmployeesFound || "No employees found"}</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <label
              key={employee.id}
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedEmployees.includes(employee.id)}
                onChange={() => toggleEmployee(employee.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{employee.name}</span>
                  {employee.role === 'manager' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {t.common.manager}
                    </span>
                  )}
                  {employee.hasEvaluation ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t.dashboard.evaluated || "Evaluated"}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {t.dashboard.pending || "Pending"}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {employee.department || t.common.unassigned || 'Unassigned'}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  )
}