'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma-client'
import * as XLSX from 'xlsx'

export async function exportUsersToExcel() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' }
    }

    // Only HR can export users
    if (session.user.role !== 'hr') {
      return { success: false, message: 'Access denied - HR role required' }
    }

    // Get all users with complete information
    const users = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        company: {
          select: {
            name: true,
            code: true
          }
        },
        manager: {
          select: {
            name: true,
            email: true,
            employeeId: true
          }
        },
        _count: {
          select: {
            employees: true,
            evaluationsReceived: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

    // Prepare data for Excel export
    const excelData = users.map(user => ({
      'Name': user.name,
      'Email': user.email || '',
      'Username': user.username || '',
      'Employee ID': user.employeeId || '',
      'Person ID': user.personID || '',
      'Role': user.role.toUpperCase(),
      'Department': user.department || '',
      'User Type': user.userType === 'office' ? 'Office Worker' : 'Operational Worker',
      'Login Method': user.loginMethod,
      'Manager Name': user.manager?.name || '',
      'Manager Email': user.manager?.email || '',
      'Manager Employee ID': user.manager?.employeeId || '',
      'Company Name': user.company.name,
      'Company Code': user.company.code,
      'Active': user.active ? 'Yes' : 'No',
      'Shift': user.shift || '',
      'Direct Reports': user._count.employees,
      'Evaluations Received': user._count.evaluationsReceived,
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '',
      'Created Date': new Date(user.createdAt).toLocaleDateString(),
      'Last Updated': new Date(user.updatedAt).toLocaleDateString()
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...excelData.map(row => String(row[key as keyof typeof row]).length))
    }))
    worksheet['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Convert buffer to base64 for client-side download
    const base64 = Buffer.from(excelBuffer).toString('base64')

    return {
      success: true,
      data: base64,
      filename: `users-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      message: `Successfully exported ${users.length} users`
    }

  } catch (error) {
    console.error('Export users error:', error)
    return { success: false, message: 'Failed to export users' }
  }
}