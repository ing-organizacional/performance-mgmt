const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('📅 Setting evaluation deadlines...')

  // Get all evaluation items
  const evaluationItems = await prisma.evaluationItem.findMany({
    include: {
      creator: true
    }
  })

  console.log(`Found ${evaluationItems.length} evaluation items to update`)

  const now = new Date()
  
  // Set deadlines based on item level and type
  for (const item of evaluationItems) {
    let deadline
    let deadlineSetBy = item.createdBy
    
    if (item.level === 'company') {
      // Company-wide items: 2-3 months from now (annual goals)
      deadline = new Date(now.getTime() + (60 + Math.random() * 30) * 24 * 60 * 60 * 1000) // 60-90 days
    } else if (item.level === 'department') {
      // Department items: 1-2 months from now
      deadline = new Date(now.getTime() + (30 + Math.random() * 30) * 24 * 60 * 60 * 1000) // 30-60 days
    } else {
      // Individual items: 2-6 weeks from now
      deadline = new Date(now.getTime() + (14 + Math.random() * 28) * 24 * 60 * 60 * 1000) // 14-42 days
    }

    await prisma.evaluationItem.update({
      where: { id: item.id },
      data: {
        evaluationDeadline: deadline,
        deadlineSetBy: deadlineSetBy
      }
    })

    console.log(`✅ Set deadline for "${item.title}" (${item.level}): ${deadline.toLocaleDateString()}`)
  }

  // Now find the employee with empty evaluation (Draco Malfoy) and set overdue deadlines for his items
  console.log('⚠️  Setting overdue deadlines for employee with incomplete evaluation...')
  
  // Find Draco Malfoy
  const dracoUser = await prisma.user.findFirst({
    where: { name: 'Draco Malfoy' }
  })

  if (dracoUser) {
    // Get his evaluation item assignments
    const dracoAssignments = await prisma.evaluationItemAssignment.findMany({
      where: { employeeId: dracoUser.id },
      include: { evaluationItem: true }
    })

    // Set all his assigned items to be overdue (3 weeks ago)
    const overdueDate = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000) // 3 weeks ago
    
    for (const assignment of dracoAssignments) {
      await prisma.evaluationItem.update({
        where: { id: assignment.evaluationItem.id },
        data: {
          evaluationDeadline: overdueDate,
          deadlineSetBy: assignment.evaluationItem.createdBy
        }
      })

      console.log(`⏰ Set OVERDUE deadline for "${assignment.evaluationItem.title}": ${overdueDate.toLocaleDateString()} (3 weeks ago)`)
    }

    console.log(`🚨 All ${dracoAssignments.length} items assigned to ${dracoUser.name} are now OVERDUE`)
  }

  // Also set overdue deadlines for Ron Weasley's items (he has no evaluation at all)
  const ronUser = await prisma.user.findFirst({
    where: { name: 'Ron Weasley' }
  })

  if (ronUser) {
    const ronAssignments = await prisma.evaluationItemAssignment.findMany({
      where: { employeeId: ronUser.id },
      include: { evaluationItem: true }
    })

    const veryOverdueDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) // 4 weeks ago
    
    for (const assignment of ronAssignments) {
      await prisma.evaluationItem.update({
        where: { id: assignment.evaluationItem.id },
        data: {
          evaluationDeadline: veryOverdueDate,
          deadlineSetBy: assignment.evaluationItem.createdBy
        }
      })
    }

    console.log(`🚨 All ${ronAssignments.length} items assigned to ${ronUser.name} are now VERY OVERDUE (4 weeks)`)
  }

  console.log('✅ All deadlines set successfully!')
  console.log('📊 Summary:')
  console.log('   - Company items: 60-90 days from now')
  console.log('   - Department items: 30-60 days from now') 
  console.log('   - Individual items: 14-42 days from now')
  console.log('   - Draco Malfoy items: 3 weeks OVERDUE (incomplete evaluation)')
  console.log('   - Ron Weasley items: 4 weeks OVERDUE (no evaluation)')
}

main()
  .catch((e) => {
    console.error('❌ Error setting deadlines:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })