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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Desktop-First Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation shadow-sm"
                title={t.common?.back || 'Go back'}
                aria-label={t.common?.back || 'Go back'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.dashboard.deadlines || 'Evaluation Deadlines'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {t.dashboard.managersWithEmployeesOverdue || 'Track managers with overdue employee evaluations'}
                </p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              
              {/* View Mode Toggle - Desktop Optimized */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 min-h-[40px] ${
                    viewMode === 'list' 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>{t.dashboard.switchToEmployeeList || 'Employee List'}</span>
                </button>
                <button
                  onClick={() => setViewMode('managers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 min-h-[40px] ${
                    viewMode === 'managers' 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{t.dashboard.switchToManagerGroups || 'Manager Groups'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="max-w-8xl mx-auto px-6 lg:px-8 py-4">
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
        />
      </div>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-6 lg:px-8 pb-8">
        {/* Statistics Overview - Desktop Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{stats.totalManagers}</div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t.dashboard.managersWithIssues || 'Managers with Issues'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t.dashboard.managerEvaluationAccountability || 'Manager accountability tracking'}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">{stats.totalOverdueEmployees}</div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t.dashboard.employeesBehind || 'Employees Behind'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t.dashboard.employeesBehindOnEvaluations || 'Requiring immediate attention'}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-600 mb-2">{stats.totalOverdueItems}</div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t.dashboard.overdueItems || 'Overdue Items'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t.dashboard.overdueItemsCount || 'Total overdue evaluation items'}
              </div>
            </div>
          </div>
        </div>

        {/* Data Views */}
        {viewMode === 'managers' ? (
          /* Manager Groups View - Desktop Optimized */
          <div className="space-y-8">
            {filteredManagerGroups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/60 p-12 shadow-sm text-center">
                <div className="text-gray-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.dashboard.noManagerIssuesFound || 'No Manager Issues Found'}
                </h3>
                <p className="text-gray-600">
                  {t.dashboard.allEmployeesUpToDate || 'All employees are up to date with their evaluations'}
                </p>
              </div>
            ) : (
              filteredManagerGroups.map((manager) => (
                <div key={manager.managerId} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className="px-8 py-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{manager.managerName}</h2>
                          <p className="text-sm text-gray-600">
                            {t.dashboard.manager || 'Manager'} • {manager.department || t.common?.unassigned || 'Unassigned'} 
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {manager.totalOverdueEmployees}
                          </div>
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {t.dashboard.employeesBehind || 'Employees Behind'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {manager.totalOverdueItems}
                          </div>
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {t.dashboard.overdueItems || 'Overdue Items'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {manager.employees.map((employee) => {
                      const isExpanded = isEmployeeExpanded(employee.employeeId)
                      
                      return (
                        <div key={employee.employeeId} className="px-8 py-4">
                          {/* Enhanced clickable employee header */}
                          <button 
                            className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50/80 active:bg-gray-100 -mx-8 px-8 py-4 rounded-xl transition-all duration-200 text-left min-h-[60px]"
                            onClick={() => toggleEmployeeExpansion(employee.employeeId)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                                <ChevronDown 
                                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-gray-900">
                                  {employee.employeeName}
                                </h3>
                                {employee.department && (
                                  <div className="text-sm text-gray-600 mt-0.5">
                                    {employee.department}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-red-600">
                                  {employee.totalOverdueCount}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {t.dashboard.overdue || 'overdue'}
                                </div>
                              </div>
                            </div>
                          </button>
                          
                          {/* Enhanced expandable overdue items */}
                          {isExpanded && (
                            <div className="mt-6 ml-12">
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                  {t.dashboard.overdueItems || 'Overdue Items'} ({employee.overdueItems.length})
                                </h4>
                                {employee.overdueItems.map((item) => (
                                  <div key={item.id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/50 hover:bg-gray-100/80 transition-colors">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                                            item.type === 'okr' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'
                                          }`}>
                                            {item.type === 'okr' ? 
                                              <Target className="h-4 w-4" /> : 
                                              <Star className="h-4 w-4" />
                                            }
                                          </div>
                                          <div className="flex-1">
                                            <span className="text-sm font-bold text-gray-900 line-clamp-2">
                                              {item.title}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                              <span className="capitalize font-semibold">
                                                {item.type === 'okr' ? (t.evaluations?.okr || 'OKR') : (t.evaluations?.competency || 'Competency')}
                                              </span>
                                              <span className="text-gray-400">•</span>
                                              <span className="capitalize">
                                                {item.level === 'company' ? (t.common?.company || 'Company') : 
                                                 item.level === 'department' ? (t.common?.department || 'Department') : 
                                                 (t.common?.manager || 'Manager')} Level
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="ml-4 flex-shrink-0">
                                        <div className={`px-3 py-2 rounded-lg text-sm font-bold ${
                                          item.daysOverdue > 7 ? 'bg-red-100 text-red-800 border border-red-200' :
                                          item.daysOverdue > 3 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                          'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        }`}>
                                          {item.daysOverdue} {item.daysOverdue === 1 ? t.dashboard.dayOverdue : t.dashboard.daysOverdueText || 'days overdue'}
                                        </div>
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
          /* Employee List View - Desktop Optimized */
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="px-8 py-6 border-b border-gray-200/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t.dashboard.allEmployeesWithOverdueEvaluations || 'All Employees with Overdue Evaluations'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedEmployees.length} {t.dashboard.employeesBehindOnEvaluations || 'employees behind on evaluations'}
                  </p>
                </div>
              </div>
            </div>
            
            {filteredAndSortedEmployees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t.dashboard.noOverdueEvaluations || 'No Overdue Evaluations'}
                </h3>
                <p className="text-gray-600">
                  {t.dashboard.allEmployeesUpToDate || 'All employees are up to date with their evaluations'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAndSortedEmployees.map((employee) => {
                  const isExpanded = isEmployeeExpanded(employee.employeeId)
                  
                  return (
                    <div key={employee.employeeId} className="px-8 py-4">
                      {/* Enhanced clickable employee header */}
                      <button 
                        className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50/80 active:bg-gray-100 -mx-8 px-8 py-4 rounded-xl transition-all duration-200 text-left min-h-[60px]"
                        onClick={() => toggleEmployeeExpansion(employee.employeeId)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                            <ChevronDown 
                              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`} 
                            />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900">
                              {employee.employeeName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5">
                              <span>{t.dashboard.manager || 'Manager'}: {employee.managerName}</span>
                              {employee.department && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span>{employee.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {employee.totalOverdueCount}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t.dashboard.overdueItems || 'items'}
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Enhanced expandable overdue items */}
                      {isExpanded && (
                        <div className="mt-6 ml-12">
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              {t.dashboard.overdueItems || 'Overdue Items'} ({employee.overdueItems.length})
                            </h4>
                            {employee.overdueItems.map((item) => (
                              <div key={item.id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/50 hover:bg-gray-100/80 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                                        item.type === 'okr' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'
                                      }`}>
                                        {item.type === 'okr' ? 
                                          <Target className="h-4 w-4" /> : 
                                          <Star className="h-4 w-4" />
                                        }
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-sm font-bold text-gray-900 line-clamp-2">
                                          {item.title}
                                        </span>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                          <span className="capitalize font-semibold">
                                            {item.type === 'okr' ? (t.evaluations?.okr || 'OKR') : (t.evaluations?.competency || 'Competency')}
                                          </span>
                                          <span className="text-gray-400">•</span>
                                          <span className="capitalize">
                                            {item.level === 'company' ? (t.common?.company || 'Company') : 
                                             item.level === 'department' ? (t.common?.department || 'Department') : 
                                             (t.common?.manager || 'Manager')} Level
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ml-4 flex-shrink-0">
                                    <div className={`px-3 py-2 rounded-lg text-sm font-bold ${
                                      item.daysOverdue > 7 ? 'bg-red-100 text-red-800 border border-red-200' :
                                      item.daysOverdue > 3 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    }`}>
                                      {item.daysOverdue} {item.daysOverdue === 1 ? t.dashboard.dayOverdue : t.dashboard.daysOverdueText || 'days overdue'}
                                    </div>
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
      </main>
    </div>
  )
}