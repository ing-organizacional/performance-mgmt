'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { SearchFilterBar } from '@/components/ui'
import { Filter, Users, ChevronDown, Target, Star } from 'lucide-react'

interface EmployeeEvaluationStatus {
  employeeId: string
  employeeName: string
  department: string | null
  overdueItems: OverdueItem[]
  totalOverdueCount: number
}

interface OverdueItem {
  id: string
  title: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  evaluationDeadline: string | null
  daysOverdue: number
}

interface ManagerGroup {
  managerId: string
  managerName: string
  department: string | null
  employees: EmployeeEvaluationStatus[]
  totalOverdueEmployees: number
  totalOverdueItems: number
}

interface DeadlinesClientProps {
  managerGroups: ManagerGroup[]
  totalOverdueEmployees: number
  totalOverdueItems: number
}

export default function DeadlinesClient({ 
  managerGroups,
  totalOverdueEmployees,
  totalOverdueItems
}: DeadlinesClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  
  const [viewMode, setViewMode] = useState<'managers' | 'list'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())

  // Get all unique departments
  const departments = Array.from(
    new Set(managerGroups
      .flatMap(group => group.employees.map(emp => emp.department))
      .filter(Boolean))
  ).sort()

  // For list view, flatten all employees from all managers
  const allOverdueEmployees = managerGroups.flatMap(group => 
    group.employees.map(emp => ({
      ...emp,
      managerName: group.managerName,
      managerId: group.managerId
    }))
  )

  // Filter and sort employees
  const filteredAndSortedEmployees = allOverdueEmployees
    .filter(emp => {
      const matchesSearch = emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.managerName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment
      
      return matchesSearch && matchesDepartment
    })
    .sort((a, b) => b.totalOverdueCount - a.totalOverdueCount)

  // Filter manager groups for manager view
  const filteredManagerGroups = managerGroups
    .map(group => ({
      ...group,
      employees: group.employees.filter(emp => {
        const matchesSearch = emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.managerName.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment
        
        return matchesSearch && matchesDepartment
      })
    }))
    .filter(group => group.employees.length > 0)

  // Calculate summary statistics
  const stats = {
    totalManagers: managerGroups.length,
    totalOverdueEmployees,
    totalOverdueItems
  }

  const getOverdueColor = (daysOverdue: number) => {
    if (daysOverdue > 7) return 'text-red-600 bg-red-100'
    if (daysOverdue > 3) return 'text-orange-600 bg-orange-100'
    if (daysOverdue > 1) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

  const isEmployeeExpanded = (employeeId: string) => expandedEmployees.has(employeeId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{t.dashboard.managerEvaluationAccountability}</h1>
                <p className="text-xs text-gray-500">{t.dashboard.managersWithEmployeesOverdue}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
          
        </div>
      </div>

      <SearchFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder={t.dashboard.searchEmployeesManagers || "Search employees, managers..."}
        filterValue={filterDepartment}
        setFilterValue={setFilterDepartment}
        filterOptions={[
          { value: 'all', label: t.common.allDepartments || `All ${t.common.departments}` },
          ...departments.map(dept => ({
            value: dept || 'Unassigned',
            label: dept || t.common.unassigned
          }))
        ]}
      >
        <button
          onClick={() => setViewMode(viewMode === 'managers' ? 'list' : 'managers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'managers' 
              ? 'bg-primary/10 text-primary hover:bg-primary/20' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {viewMode === 'managers' ? <Users className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {viewMode === 'managers' ? t.dashboard.switchToEmployeeList : t.dashboard.switchToManagerGroups}
          </span>
        </button>
      </SearchFilterBar>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalManagers}</div>
            <div className="text-xs text-gray-600">{t.dashboard.managersWithIssues}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.totalOverdueEmployees}</div>
            <div className="text-xs text-gray-600">{t.dashboard.employeesBehind}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.totalOverdueItems}</div>
            <div className="text-xs text-gray-600">{t.dashboard.overdueItems}</div>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'managers' ? (
          /* Manager Groups View */
          <div className="space-y-6">
            {filteredManagerGroups.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.dashboard.noManagerIssuesFound}</h3>
                <p className="text-gray-600">{t.dashboard.allEmployeesUpToDate}</p>
              </div>
            ) : (
              filteredManagerGroups.map((manager) => (
                <div key={manager.managerId} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{manager.managerName}</h2>
                        <p className="text-sm text-gray-600">
                          {t.dashboard.manager} • {manager.department || t.dashboard.department} 
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-red-500 font-medium">
                          {manager.totalOverdueEmployees} {t.dashboard.employeesBehindEvaluations}
                        </span>
                        <span className="text-amber-500 font-medium">
                          {manager.totalOverdueItems} {t.dashboard.overdueItemsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {manager.employees.map((employee) => {
                      const isExpanded = isEmployeeExpanded(employee.employeeId)
                      
                      return (
                        <div key={employee.employeeId} className="px-4 py-3">
                          {/* Clickable employee header */}
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                            onClick={() => toggleEmployeeExpansion(employee.employeeId)}
                          >
                            <div className="flex items-center gap-2">
                              <ChevronDown 
                                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`} 
                              />
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {employee.employeeName}
                                </h3>
                                {employee.department && (
                                  <div className="text-xs text-gray-600">
                                    {employee.department}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {employee.totalOverdueCount} {t.dashboard.overdue.toLowerCase()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Expandable overdue items */}
                          {isExpanded && (
                            <div className="mt-3 pl-5">
                              <div className="space-y-2">
                                {employee.overdueItems.map((item) => (
                                  <div key={item.id} className="bg-gray-50 rounded-lg p-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          {item.type === 'okr' ? 
                                            <Target className="h-4 w-4 text-primary" /> : 
                                            <Star className="h-4 w-4 text-amber-500" />
                                          }
                                          <span className="text-xs font-medium text-gray-900 truncate">
                                            {item.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <span className="capitalize">{item.type}</span>
                                          <span>•</span>
                                          <span className="capitalize">{item.level}</span>
                                        </div>
                                      </div>
                                      <div className="ml-2 flex-shrink-0">
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getOverdueColor(item.daysOverdue)}`}>
                                          {item.daysOverdue}d
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Employee List View */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.allEmployeesWithOverdueEvaluations}</h2>
              <p className="text-sm text-gray-600">{filteredAndSortedEmployees.length} {t.dashboard.employeesBehindOnEvaluations}</p>
            </div>
            
            {filteredAndSortedEmployees.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.dashboard.noOverdueEvaluations}</h3>
                <p className="text-gray-600">{t.dashboard.allEmployeesUpToDate}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredAndSortedEmployees.map((employee) => {
                  const isExpanded = isEmployeeExpanded(employee.employeeId)
                  
                  return (
                    <div key={employee.employeeId} className="px-4 py-3">
                      {/* Clickable employee header */}
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                        onClick={() => toggleEmployeeExpansion(employee.employeeId)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown 
                            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`} 
                          />
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {employee.employeeName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span>{t.dashboard.manager}: {employee.managerName}</span>
                              {employee.department && (
                                <>
                                  <span>•</span>
                                  <span>{employee.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {employee.totalOverdueCount} items
                          </span>
                        </div>
                      </div>
                      
                      {/* Expandable overdue items */}
                      {isExpanded && (
                        <div className="mt-3 pl-5">
                          <div className="space-y-2">
                            {employee.overdueItems.map((item) => (
                              <div key={item.id} className="bg-gray-50 rounded-lg p-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      {item.type === 'okr' ? 
                                        <Target className="h-4 w-4 text-primary" /> : 
                                        <Star className="h-4 w-4 text-amber-500" />
                                      }
                                      <span className="text-xs font-medium text-gray-900 truncate">
                                        {item.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <span className="capitalize">{item.type}</span>
                                      <span>•</span>
                                      <span className="capitalize">{item.level}</span>
                                    </div>
                                  </div>
                                  <div className="ml-2 flex-shrink-0">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getOverdueColor(item.daysOverdue)}`}>
                                      {item.daysOverdue}d
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}