'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { Target, Star, Users, Building2, User, Search, Filter, X } from 'lucide-react'

interface AssignedEmployee {
  id: string
  name: string
  department: string
}

interface Creator {
  id: string
  name: string
  department: string
  role: string
}

interface OversightItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'department' | 'manager'
  createdBy: Creator
  assignedTo: string | null
  assignedEmployees: AssignedEmployee[]
  createdAt: string
  active: boolean
}

interface OversightClientProps {
  items: OversightItem[]
  departments: string[]
  managers: { id: string; name: string }[]
}

export default function OversightClient({ items, departments, managers }: OversightClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'okr' | 'competency' | ''>('')

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = !selectedDepartment || 
        item.createdBy.department === selectedDepartment
      
      const matchesManager = !selectedManager || 
        item.createdBy.id === selectedManager
      
      const matchesType = !selectedType || 
        item.type === selectedType

      return matchesSearch && matchesDepartment && matchesManager && matchesType
    })
  }, [items, searchTerm, selectedDepartment, selectedManager, selectedType])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDepartment('')
    setSelectedManager('')
    setSelectedType('')
  }

  const getBadgeStyles = (level: string) => {
    switch (level) {
      case 'department':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'department':
        return <Building2 className="w-3 h-3" />
      case 'manager':
        return <User className="w-3 h-3" />
      default:
        return null
    }
  }

  const totalAssignments = items.reduce((sum, item) => sum + item.assignedEmployees.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Desktop-First Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center gap-3 md:gap-6">
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
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {t.oversight.title}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                  {t.oversight.subtitle}
                </p>
              </div>
            </div>

            {/* Right Section - Language Switcher */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">{t.oversight.totalItems}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">{t.oversight.totalAssignments}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{totalAssignments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">{t.common.departments}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t.oversight.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
              >
                <option value="">{t.oversight.allDepartments}</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Manager Filter */}
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
              >
                <option value="">{t.oversight.allManagers}</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'okr' | 'competency' | '')}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                <option value="">{t.oversight.allTypes}</option>
                <option value="okr">{t.oversight.okrType}</option>
                <option value="competency">{t.oversight.competencyType}</option>
              </select>

              {/* Clear Filters Button */}
              {(searchTerm || selectedDepartment || selectedManager || selectedType) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.common.clear}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 shadow-sm p-8 md:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t.oversight.noItemsFound}</h3>
            <p className="text-gray-600 text-sm">{t.oversight.noItemsDescription}</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl md:rounded-2xl border border-gray-200/60 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'okr' ? 'bg-primary/10' : 'bg-amber-50'
                    }`}>
                      {item.type === 'okr' ? <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" /> : <Star className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-1">
                        <span className="text-xs md:text-sm font-bold text-blue-700 uppercase tracking-wide">
                          {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${getBadgeStyles(item.level)}`}>
                          {getBadgeIcon(item.level)}
                          <span>{item.level === 'department' ? t.common.department : t.common.manager}</span>
                        </span>
                      </div>
                      <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-tight mb-1">{item.title}</h3>
                      <p className="text-xs md:text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>

                {/* Creator and Assignment Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{t.oversight.createdBy}:</span>
                    <span className="text-gray-900 font-medium">{item.createdBy.name}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-700">{item.createdBy.department}</span>
                  </div>
                  
                  {item.assignedEmployees.length > 0 && (
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{t.oversight.assignedEmployees}:</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        {item.assignedEmployees.length} {t.oversight.employees}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Assigned Employees (if any) */}
                {item.assignedEmployees.length > 0 && (
                  <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs md:text-sm font-medium text-gray-800 mb-2">
                      {t.oversight.assignedTo} ({item.assignedEmployees.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {item.assignedEmployees.slice(0, 6).map((employee) => (
                        <div key={employee.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-xs">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-900 font-medium">{employee.name}</span>
                          {employee.department && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-700">{employee.department}</span>
                            </>
                          )}
                        </div>
                      ))}
                      {item.assignedEmployees.length > 6 && (
                        <div className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-xs font-medium">
                          +{item.assignedEmployees.length - 6} {t.common.more}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}