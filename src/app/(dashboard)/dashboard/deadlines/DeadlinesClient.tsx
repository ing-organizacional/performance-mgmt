'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/layout'
import { DeadlineDisplay, CompactDeadlineDisplay } from '@/components/features/evaluation'
import { 
  sortByDeadlineUrgency, 
  filterByUrgency 
} from '@/lib/deadline-utils'
import { Filter, Calendar, Users, AlertTriangle, Clock } from 'lucide-react'

interface EvaluationItemWithDeadline {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  createdBy: string
  creatorRole: string
  evaluationDeadline: string | null
  deadlineSetBy: string | null
  deadlineSetByRole: string | null
  assignedTo?: string | null
  // For grouping
  department?: string
  managerName?: string
  employeeCount?: number
}

interface DeadlineGroup {
  id: string
  name: string
  type: 'department' | 'manager'
  items: EvaluationItemWithDeadline[]
  totalEmployees: number
  overdue: number
  dueThisWeek: number
}

type UrgencyFilter = 'all' | 'overdue' | 'high' | 'medium' | 'low'

interface DeadlinesClientProps {
  evaluationItems: EvaluationItemWithDeadline[]
  deadlineGroups: DeadlineGroup[]
}

export default function DeadlinesClient({ 
  evaluationItems: initialItems, 
  deadlineGroups: initialGroups 
}: DeadlinesClientProps) {
  const router = useRouter()
  const { } = useLanguage()
  
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all')
  const [viewMode, setViewMode] = useState<'groups' | 'list'>('groups')

  // Filter items by urgency
  const filteredItems = urgencyFilter === 'all' 
    ? initialItems 
    : filterByUrgency(initialItems, urgencyFilter)

  // Filter groups by urgency
  const filteredGroups = initialGroups.map(group => ({
    ...group,
    items: urgencyFilter === 'all' 
      ? group.items 
      : filterByUrgency(group.items, urgencyFilter)
  })).filter(group => group.items.length > 0)

  // Calculate urgency counts for all items
  const urgencyCounts = {
    all: initialItems.length,
    overdue: filterByUrgency(initialItems, 'overdue').length,
    high: filterByUrgency(initialItems, 'high').length,
    medium: filterByUrgency(initialItems, 'medium').length,
    low: filterByUrgency(initialItems, 'low').length
  }

  const getUrgencyColor = (urgency: UrgencyFilter) => {
    switch (urgency) {
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getUrgencyIcon = (urgency: UrgencyFilter) => {
    switch (urgency) {
      case 'overdue': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <Clock className="w-4 h-4" />
      case 'medium': return <Calendar className="w-4 h-4" />
      case 'low': return <Calendar className="w-4 h-4" />
      default: return <Filter className="w-4 h-4" />
    }
  }

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
                <h1 className="text-lg font-semibold text-gray-900 truncate">Evaluation Deadlines</h1>
                <p className="text-xs text-gray-500">HR Deadline Management Overview</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['all', 'overdue', 'high', 'medium', 'low'] as UrgencyFilter[]).map((urgency) => (
                <button
                  key={urgency}
                  onClick={() => setUrgencyFilter(urgency)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    urgencyFilter === urgency 
                      ? getUrgencyColor(urgency)
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {getUrgencyIcon(urgency)}
                  <span className="capitalize">{urgency}</span>
                  <span className="text-xs opacity-75">({urgencyCounts[urgency]})</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setViewMode(viewMode === 'groups' ? 'list' : 'groups')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'groups' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={viewMode === 'groups' ? 'Switch to List View' : 'Switch to Group View'}
              >
                {viewMode === 'groups' ? <Users className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{urgencyCounts.overdue}</div>
            <div className="text-xs text-gray-600">Overdue</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{urgencyCounts.high}</div>
            <div className="text-xs text-gray-600">High Priority</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{urgencyCounts.medium}</div>
            <div className="text-xs text-gray-600">Medium Priority</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{urgencyCounts.low}</div>
            <div className="text-xs text-gray-600">Low Priority</div>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'groups' ? (
          /* Grouped View */
          <div className="space-y-6">
            {filteredGroups.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Deadlines Found</h3>
                <p className="text-gray-600">No evaluation deadlines match the current filter.</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{group.name}</h2>
                        <p className="text-sm text-gray-600">
                          {group.type === 'department' ? 'Department' : 'Manager'} • {group.totalEmployees} employees
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        {group.overdue > 0 && (
                          <span className="text-red-600 font-medium">
                            {group.overdue} overdue
                          </span>
                        )}
                        {group.dueThisWeek > 0 && (
                          <span className="text-orange-600 font-medium">
                            {group.dueThisWeek} due this week
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {group.items.map((item) => (
                      <div key={item.id} className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {item.title}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.type === 'okr' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {item.type.toUpperCase()}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.level === 'company' ? 'bg-green-100 text-green-800' :
                                item.level === 'department' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.level}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Created by {item.createdBy} ({item.creatorRole})</span>
                              {item.deadlineSetBy && (
                                <span>Deadline set by {item.deadlineSetBy}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {item.evaluationDeadline ? (
                              <CompactDeadlineDisplay deadline={item.evaluationDeadline} />
                            ) : (
                              <span className="text-xs text-gray-400">No deadline</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Evaluation Items</h2>
              <p className="text-sm text-gray-600">{filteredItems.length} items with deadlines</p>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
                <p className="text-gray-600">No evaluation items match the current filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortByDeadlineUrgency(filteredItems).map((item) => (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.type === 'okr' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.type.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.level === 'company' ? 'bg-green-100 text-green-800' :
                            item.level === 'department' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.level}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created by {item.createdBy} ({item.creatorRole})</span>
                          {item.deadlineSetBy && (
                            <span>Deadline set by {item.deadlineSetBy}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {item.evaluationDeadline ? (
                          <DeadlineDisplay deadline={item.evaluationDeadline} compact={true} />
                        ) : (
                          <span className="text-xs text-gray-400">No deadline</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}