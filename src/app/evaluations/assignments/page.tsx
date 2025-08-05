'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useSwipe } from '@/hooks/useSwipe'

interface EvaluationItem {
  id: string
  title: string
  description: string
  type: 'okr' | 'competency'
  level: 'company' | 'department' | 'manager'
  createdBy: string
  creatorRole: string
  assignedEmployees?: string[] // For individual assignments
}

interface Employee {
  id: string
  name: string
  email?: string
  username?: string
  department?: string
  assignedItems: string[] // Array of evaluation item IDs
}

interface EditingItem {
  id: string
  title: string
  description: string
}

type ActiveTab = 'company' | 'department' | 'individual'

export default function AssignmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('company')
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newItemType, setNewItemType] = useState<'okr' | 'competency'>('okr')

  // Tab navigation with swipe support
  const tabs: ActiveTab[] = ['company', 'department', 'individual']
  
  const handleSwipeLeft = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const handleSwipeRight = () => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const { elementRef } = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  }, {
    threshold: 50,
    preventDefaultTouchmoveEvent: true
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Only managers can access this page
    if ((session.user as any).role !== 'manager') {
      router.push('/dashboard')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      // Fetch all evaluation items
      const itemsResponse = await fetch('/api/evaluation-items/all')
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setEvaluationItems(itemsData.items || [])
      }

      // Fetch team members with their current assignments
      const teamResponse = await fetch('/api/manager/team-assignments')
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setEmployees(teamData.employees || [])
      }
    } catch (error) {
      console.error('Error fetching assignment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleBulkAssignment = async (itemId: string) => {
    if (selectedEmployees.length === 0) return

    try {
      const response = await fetch('/api/evaluation-items/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          employeeIds: selectedEmployees
        })
      })

      if (response.ok) {
        await fetchData() // Refresh data
        setSelectedEmployees([]) // Clear selection
      }
    } catch (error) {
      console.error('Error assigning items:', error)
    }
  }

  const handleEditItem = (item: EvaluationItem) => {
    setEditingItem({
      id: item.id,
      title: item.title,
      description: item.description
    })
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      const response = await fetch(`/api/evaluation-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          description: editingItem.description
        })
      })

      if (response.ok) {
        await fetchData() // Refresh data
        setEditingItem(null) // Close editing mode
      } else {
        console.error('Failed to save item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const handleCreateNew = (type: 'okr' | 'competency') => {
    setNewItemType(type)
    setCreatingNew(true)
    setEditingItem({
      id: 'new',
      title: '',
      description: ''
    })
  }

  const handleSaveNew = async () => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.description.trim()) return

    try {
      const response = await fetch('/api/evaluation-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          description: editingItem.description,
          type: newItemType,
          level: 'department'
        })
      })

      if (response.ok) {
        await fetchData() // Refresh data
        setEditingItem(null)
        setCreatingNew(false)
      } else {
        console.error('Failed to create item')
      }
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleCancelNew = () => {
    setEditingItem(null)
    setCreatingNew(false)
  }

  const filteredItems = evaluationItems.filter(item => item.level === activeTab)

  const getBadgeStyles = (level: string) => {
    switch (level) {
      case 'company':
        return 'bg-purple-100 text-purple-700'
      case 'department':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'company':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9zm-6 4h2v2H7v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" />
          </svg>
        )
      case 'department':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getBadgeLabel = (level: string) => {
    switch (level) {
      case 'company':
        return t.common.company
      case 'department':
        return t.common.department
      default:
        return t.common.manager
    }
  }

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
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {t.assignments.assignmentManager}
              </h1>
              <p className="text-sm text-gray-600">
                {t.assignments.manageOKRsCompetencies}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4">
          <div className="flex space-x-1 relative">
            {/* Swipe indicator */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 opacity-50 animate-pulse">
              ← Swipe to navigate →
            </div>
            
            {/* Tab position indicator */}
            <div 
              className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 ease-out"
              style={{
                width: '33.333%',
                left: `${tabs.indexOf(activeTab) * 33.333}%`
              }}
            />
            
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-2 min-h-[44px] text-xs font-medium rounded-t-lg transition-all duration-300 active:scale-95 touch-manipulation ${
                  activeTab === tab
                    ? 'bg-blue-50 text-blue-700 shadow-sm transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  {getBadgeIcon(tab)}
                  <span className="capitalize text-center leading-tight">{getBadgeLabel(tab)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={elementRef} className="px-4 py-6 min-h-[400px] touch-pan-y">
        {/* Company Tab - Read Only */}
        {activeTab === 'company' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">ℹ️</span>
                <h3 className="font-semibold text-blue-900">{t.assignments.companyWideItems}</h3>
              </div>
              <p className="text-sm text-blue-700">
                {t.assignments.companyWideDescription}
              </p>
            </div>

            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {item.type === 'okr' ? '🎯' : '⭐'}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                          {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                        </span>
                        <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                          {getBadgeIcon(item.level)}
                          <span>{getBadgeLabel(item.level)}</span>
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>Created by {item.createdBy}</div>
                    <div className="text-green-600 font-medium mt-1">{t.assignments.appliedToAllEmployees}</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm ml-11">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Department Tab - Batch Assignment */}
        {activeTab === 'department' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Create New Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t.assignments.createNewDepartmentItems}</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleCreateNew('okr')}
                  className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 active:bg-blue-800 transition-all duration-150 touch-manipulation"
                >
                  <span>🎯</span>
                  <span>{t.assignments.newOKR}</span>
                </button>
                <button
                  onClick={() => handleCreateNew('competency')}
                  className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 active:scale-95 active:bg-purple-800 transition-all duration-150 touch-manipulation"
                >
                  <span>⭐</span>
                  <span>{t.assignments.newCompetency}</span>
                </button>
              </div>
            </div>
            
            {/* Create New Form */}
            {creatingNew && editingItem && editingItem.id === 'new' && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">
                      {newItemType === 'okr' ? '🎯' : '⭐'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                        {newItemType === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                        🏬 {t.common.department}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newItemType === 'okr' ? t.okrs.objective : t.evaluations.competency}
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        title: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Enter title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newItemType === 'okr' ? t.okrs.keyResults : 'Description'}
                    </label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        description: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      rows={3}
                      placeholder="Enter description..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveNew}
                      disabled={!editingItem.title.trim() || !editingItem.description.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>✓</span>
                      <span>{t.assignments.create}</span>
                    </button>
                    <button
                      onClick={handleCancelNew}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <span>✕</span>
                      <span>{t.common.cancelButton}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Employee Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t.assignments.selectEmployeesForBatch}</h3>
              <div className="space-y-2">
                {employees.map((employee) => (
                  <label key={employee.id} className="flex items-center space-x-4 p-4 min-h-[60px] rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150 touch-manipulation">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleEmployeeSelection(employee.id)}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-150"
                      />
                      {selectedEmployees.includes(employee.id) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">
                        {employee.email || employee.username} • {employee.department}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.assignedItems.length} {t.assignments.itemsAssigned}
                    </div>
                  </label>
                ))}
              </div>
              {selectedEmployees.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    {selectedEmployees.length} {t.assignments.employeesSelected}
                  </p>
                </div>
              )}
            </div>

            {/* Department Items */}
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  {editingItem && editingItem.id === item.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-2xl">
                          {item.type === 'okr' ? '🎯' : '⭐'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                            {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                            <span className="flex items-center space-x-1">
                              {getBadgeIcon(item.level)}
                              <span>{getBadgeLabel(item.level)}</span>
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {item.type === 'okr' ? t.okrs.objective : t.evaluations.competency}
                        </label>
                        <input
                          type="text"
                          value={editingItem.title}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            title: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          placeholder="Title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {item.type === 'okr' ? t.okrs.keyResults : 'Description'}
                        </label>
                        <textarea
                          value={editingItem.description}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            description: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          rows={3}
                          placeholder="Description"
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={creatingNew ? handleSaveNew : handleSaveEdit}
                          disabled={creatingNew && (!editingItem.title.trim() || !editingItem.description.trim())}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <span>✓</span>
                          <span>{creatingNew ? t.assignments.create : t.common.saveButton}</span>
                        </button>
                        <button
                          onClick={creatingNew ? handleCancelNew : handleCancelEdit}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <span>✕</span>
                          <span>{t.common.cancelButton}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode - Cleaner Layout
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-2xl">
                            {item.type === 'okr' ? '🎯' : '⭐'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                                {item.type === 'okr' ? t.evaluations.okr : t.evaluations.competency}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyles(item.level)}`}>
                                <span className="flex items-center space-x-1">
                              {getBadgeIcon(item.level)}
                              <span>{getBadgeLabel(item.level)}</span>
                            </span>
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{item.title}</h3>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="flex items-center space-x-1 px-4 py-3 min-h-[44px] bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-95 active:bg-gray-300 transition-all duration-150 flex-shrink-0 touch-manipulation"
                        >
                          <span>✏️</span>
                          <span>{t.common.editButton}</span>
                        </button>
                      </div>
                      
                      <p className="text-gray-600 text-sm ml-11 leading-relaxed">{item.description}</p>
                      
                      <div className="ml-11">
                        <button
                          onClick={() => handleBulkAssignment(item.id)}
                          disabled={selectedEmployees.length === 0}
                          className="flex items-center space-x-2 px-6 py-3 min-h-[44px] bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 touch-manipulation"
                        >
                          <span>➕</span>
                          <span>{t.assignments.assignToSelected}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Tab - Employee-Specific Assignment */}
        {activeTab === 'individual' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">👤</span>
                <h3 className="font-semibold text-yellow-900">{t.assignments.individualAssignments}</h3>
              </div>
              <p className="text-sm text-yellow-700">
                {t.assignments.individualDescription}
              </p>
            </div>

            {/* Individual assignment interface will be implemented next */}
            <div className="text-center py-8 text-gray-500">
              {t.assignments.comingSoon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}