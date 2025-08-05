'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import DeadlineDisplay, { CompactDeadlineDisplay } from '@/components/DeadlineDisplay'
import { 
  calculateDeadlineInfo, 
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

export default function DeadlinesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  
  const [loading, setLoading] = useState(true)
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItemWithDeadline[]>([])
  const [deadlineGroups, setDeadlineGroups] = useState<DeadlineGroup[]>([])
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all')
  const [viewMode, setViewMode] = useState<'groups' | 'list'>('groups')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Only HR can access this page
    if (session.user.role !== 'hr') {
      router.push('/dashboard')
      return
    }

    fetchDeadlines()
  }, [session, status, router])

  const fetchDeadlines = async () => {
    try {
      setLoading(true)
      
      // Fetch all evaluation items with deadlines
      const response = await fetch('/api/evaluation-items/all')
      if (!response.ok) throw new Error('Failed to fetch evaluation items')
      
      const data = await response.json()
      const itemsWithDeadlines = data.items.filter((item: EvaluationItemWithDeadline) => 
        item.evaluationDeadline
      )
      
      setEvaluationItems(itemsWithDeadlines)
      groupDeadlines(itemsWithDeadlines)
      
    } catch (error) {
      console.error('Error fetching deadlines:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupDeadlines = (items: EvaluationItemWithDeadline[]) => {
    const groups: Record<string, DeadlineGroup> = {}
    
    items.forEach(item => {
      let groupKey: string
      let groupName: string
      let groupType: 'department' | 'manager'
      
      if (item.level === 'company') {
        // Company-wide items don't get grouped
        return
      } else if (item.level === 'department') {
        groupKey = `dept_${item.assignedTo}`
        groupName = item.assignedTo || 'Unknown Department'
        groupType = 'department'
      } else {
        // Manager level
        groupKey = `mgr_${item.assignedTo}`
        groupName = item.managerName || item.createdBy || 'Unknown Manager'
        groupType = 'manager'
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          name: groupName,
          type: groupType,
          items: [],
          totalEmployees: 0,
          overdue: 0,
          dueThisWeek: 0
        }
      }
      
      groups[groupKey].items.push(item)
      
      // Calculate urgency stats
      const deadlineInfo = calculateDeadlineInfo(item.evaluationDeadline)
      if (deadlineInfo) {
        if (deadlineInfo.isOverdue) {
          groups[groupKey].overdue++
        } else if (deadlineInfo.daysRemaining <= 7) {
          groups[groupKey].dueThisWeek++
        }
      }
    })
    
    setDeadlineGroups(Object.values(groups))
  }

  const filteredItems = filterByUrgency(evaluationItems, urgencyFilter)
  const sortedItems = sortByDeadlineUrgency(filteredItems)

  const getUrgencyStats = () => {
    const stats = {
      total: evaluationItems.length,
      overdue: 0,
      high: 0,
      medium: 0,
      low: 0
    }
    
    evaluationItems.forEach(item => {
      const deadlineInfo = calculateDeadlineInfo(item.evaluationDeadline)
      if (deadlineInfo) {
        stats[deadlineInfo.urgencyLevel]++
      }
    })
    
    return stats
  }

  const stats = getUrgencyStats()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-20">
        <div className="px-4 py-3">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">Evaluation Deadlines</h1>
                <p className="text-xs text-gray-500">
                  {stats.total} items with deadlines across all departments
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4 pt-20">
        {/* Progress Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Deadline Overview</h2>
          
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 via-orange-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.total > 0 ? ((stats.overdue + stats.high + stats.medium + stats.low) / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
              <div className="text-sm text-gray-600">Due Soon</div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-3 mb-6">
          {stats.overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {stats.overdue} Overdue Deadlines
                    </h3>
                    <p className="text-sm text-red-600 mt-1">
                      Immediate attention required
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {stats.high > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      {stats.high} Due Soon (≤3 days)
                    </h3>
                    <p className="text-sm text-orange-600 mt-1">
                      Review and complete evaluations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Filter size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Filter:</span>
              </div>
              
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Deadlines</option>
                <option value="overdue">Overdue</option>
                <option value="high">Due Soon (≤3 days)</option>
                <option value="medium">This Week (≤7 days)</option>
                <option value="low">Future</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('groups')}
                className={`flex items-center justify-center space-x-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 touch-manipulation ${
                  viewMode === 'groups' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users size={12} />
                <span>Groups</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center space-x-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 touch-manipulation ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'groups' ? (
          <div className="space-y-6">
            {deadlineGroups.map(group => {
              const groupFilteredItems = filterByUrgency(group.items, urgencyFilter)
              if (groupFilteredItems.length === 0) return null
              
              return (
                <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.type === 'department' ? 'Department' : 'Manager'} • 
                        {groupFilteredItems.length} items
                        {group.overdue > 0 && (
                          <span className="ml-2 text-red-600 font-medium">
                            {group.overdue} overdue
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {sortByDeadlineUrgency(groupFilteredItems).map(item => (
                      <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <span className="text-2xl">
                          {item.type === 'okr' ? '🎯' : '⭐'}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {item.title}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              {item.type.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.description}
                          </p>
                          
                          <p className="text-xs text-gray-500 mt-1">
                            Created by {item.createdBy}
                            {item.deadlineSetBy && item.deadlineSetBy !== item.createdBy && (
                              <span> • Deadline set by {item.deadlineSetBy}</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <DeadlineDisplay 
                            deadline={item.evaluationDeadline}
                            showIcon={true}
                            showDate={true}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {deadlineGroups.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No deadline groups found
                </h3>
                <p className="text-sm text-gray-600">
                  {urgencyFilter === 'all' 
                    ? 'No evaluation items have deadlines set yet.'
                    : `No items match the ${urgencyFilter} filter.`
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="space-y-1">
              {sortedItems.map((item, index) => (
                <div key={item.id} className={`flex items-start space-x-4 p-4 ${
                  index !== sortedItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}>
                  <span className="text-2xl">
                    {item.type === 'okr' ? '🎯' : '⭐'}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {item.type.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.level === 'company' ? 'bg-purple-100 text-purple-700' :
                        item.level === 'department' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.level === 'company' ? '🏢 Company' :
                         item.level === 'department' ? '🏬 Department' :
                         '👤 Manager'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                      {item.description}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      Created by {item.createdBy}
                      {item.assignedTo && (
                        <span> • Assigned to {item.assignedTo}</span>
                      )}
                      {item.deadlineSetBy && item.deadlineSetBy !== item.createdBy && (
                        <span> • Deadline set by {item.deadlineSetBy}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <CompactDeadlineDisplay deadline={item.evaluationDeadline} />
                  </div>
                </div>
              ))}
              
              {sortedItems.length === 0 && (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No items found
                  </h3>
                  <p className="text-sm text-gray-600">
                    {urgencyFilter === 'all' 
                      ? 'No evaluation items have deadlines set yet.'
                      : `No items match the ${urgencyFilter} filter.`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}