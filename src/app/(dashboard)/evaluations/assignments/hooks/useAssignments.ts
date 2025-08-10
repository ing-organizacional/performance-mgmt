import { useState, useTransition } from 'react'
import { assignItemsToEmployees, unassignItemsFromEmployees } from '@/lib/actions/evaluations'
import type { Employee } from '../types'

export function useAssignments(employees: Employee[]) {
  const [isPending, startTransition] = useTransition()
  const [confirmingUnassign, setConfirmingUnassign] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Helper function to check if an employee already has a specific item assigned
  const employeeHasItem = (employeeId: string, itemId: string): boolean => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.assignedItems.includes(itemId) : false
  }

  // Helper function to get employees who already have this item
  const getEmployeesWithItem = (itemId: string): Employee[] => {
    return employees.filter(employee => employee.assignedItems.includes(itemId))
  }

  // Helper function to get employees who can be assigned (don't already have the item)
  const getEligibleEmployees = (itemId: string, selectedEmployees: string[]): string[] => {
    return selectedEmployees.filter(employeeId => !employeeHasItem(employeeId, itemId))
  }

  const handleBulkAssignment = async (itemId: string, selectedEmployees: string[], onSuccess?: () => void) => {
    const eligibleEmployees = getEligibleEmployees(itemId, selectedEmployees)
    
    if (eligibleEmployees.length === 0) {
      setError('All selected employees already have this item assigned.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await assignItemsToEmployees(itemId, eligibleEmployees)
      if (!result.success) {
        setError(result.error || 'Failed to assign items')
      } else {
        onSuccess?.()
      }
    })
  }

  const handleUnassignFromEmployee = async (itemId: string, employeeId: string) => {
    const confirmKey = `${itemId}-${employeeId}`
    
    if (confirmingUnassign === confirmKey) {
      // Actually perform the unassignment
      setError(null)
      startTransition(async () => {
        const result = await unassignItemsFromEmployees(itemId, [employeeId])
        if (!result.success) {
          setError(result.error || 'Failed to unassign item')
        }
        setConfirmingUnassign(null)
      })
    } else {
      // Set confirmation state
      setConfirmingUnassign(confirmKey)
      // Auto-reset after 3 seconds
      setTimeout(() => {
        if (confirmingUnassign === confirmKey) {
          setConfirmingUnassign(null)
        }
      }, 3000)
    }
  }

  const handleIndividualAssignment = async (itemId: string, employeeId: string) => {
    if (employeeHasItem(employeeId, itemId)) {
      return // Already assigned
    }

    setError(null)
    startTransition(async () => {
      const result = await assignItemsToEmployees(itemId, [employeeId])
      if (!result.success) {
        setError(result.error || 'Failed to assign item')
      }
    })
  }

  return {
    isPending,
    error,
    setError,
    confirmingUnassign,
    employeeHasItem,
    getEmployeesWithItem,
    getEligibleEmployees,
    handleBulkAssignment,
    handleUnassignFromEmployee,
    handleIndividualAssignment
  }
}