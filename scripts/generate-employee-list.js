const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Generating employee list document...')

  // Get all users with their relationships
  const users = await prisma.user.findMany({
    include: {
      company: true,
      manager: {
        select: { name: true, email: true }
      },
      employees: {
        select: { name: true, email: true }
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
      { department: 'asc' },
      { name: 'asc' }
    ]
  })

  // Get evaluation status for each user
  const evaluations = await prisma.evaluation.findMany({
    select: {
      employeeId: true,
      status: true,
      overallRating: true
    }
  })

  const evaluationMap = {}
  evaluations.forEach(eval => {
    evaluationMap[eval.employeeId] = {
      status: eval.status,
      rating: eval.overallRating
    }
  })

  // Create markdown document
  let markdown = `# InterContinental San José - Employee Directory\n\n`
  markdown += `**Generated on:** ${new Date().toLocaleDateString()}\n`
  markdown += `**Total Employees:** ${users.length}\n`
  markdown += `**Company:** ${users[0]?.company.name}\n\n`

  // Add login credentials section
  markdown += `## 🔐 Key Login Credentials\n\n`
  markdown += `All users have the password: **password123**\n\n`
  markdown += `| Role | Name | Email | Department |\n`
  markdown += `|------|------|-------|------------|\n`
  
  const keyUsers = users.filter(u => u.role === 'hr' || (u.role === 'manager' && ['Finance', 'HR', 'Food&Beverage', 'Rooms'].includes(u.department)))
  keyUsers.forEach(user => {
    const roleDisplay = user.role === 'hr' ? '👑 HR Admin' : '👔 Manager'
    markdown += `| ${roleDisplay} | ${user.name} | \`${user.email}\` | ${user.department} |\n`
  })

  markdown += `\n---\n\n`

  // Group users by role and department
  const groupedUsers = {
    hr: users.filter(u => u.role === 'hr'),
    managers: users.filter(u => u.role === 'manager'),
    employees: users.filter(u => u.role === 'employee')
  }

  // HR Admin Section
  markdown += `## 👑 HR Administration\n\n`
  groupedUsers.hr.forEach(user => {
    const evalStatus = evaluationMap[user.id]
    const statusIcon = evalStatus ? (evalStatus.status === 'completed' ? '✅' : '⏳') : '❌'
    const rating = evalStatus?.rating ? ` (${evalStatus.rating}/5)` : ''
    
    markdown += `### ${user.name}\n`
    markdown += `- **Email:** \`${user.email}\`\n`
    markdown += `- **Employee ID:** ${user.employeeId}\n`
    markdown += `- **Department:** ${user.department}\n`
    markdown += `- **Reports:** ${user._count.employees} direct reports\n`
    markdown += `- **Evaluation Status:** ${statusIcon} ${evalStatus?.status || 'None'}${rating}\n\n`
  })

  // Managers Section
  markdown += `## 👔 Department Managers\n\n`
  const departments = ['Finance', 'HR', 'Food&Beverage', 'Rooms']
  
  departments.forEach(dept => {
    const deptManagers = groupedUsers.managers.filter(u => u.department === dept)
    if (deptManagers.length > 0) {
      markdown += `### ${dept} Department\n\n`
      deptManagers.forEach(manager => {
        const evalStatus = evaluationMap[manager.id]
        const statusIcon = evalStatus ? (evalStatus.status === 'completed' ? '✅' : '⏳') : '❌'
        const rating = evalStatus?.rating ? ` (${evalStatus.rating}/5)` : ''
        
        markdown += `#### ${manager.name} - ${dept} Manager\n`
        markdown += `- **Email:** \`${manager.email}\`\n`
        markdown += `- **Employee ID:** ${manager.employeeId}\n`
        markdown += `- **Reports to:** ${manager.manager?.name || 'No manager'}\n`
        markdown += `- **Direct Reports:** ${manager._count.employees}\n`
        markdown += `- **Evaluation Status:** ${statusIcon} ${evalStatus?.status || 'None'}${rating}\n`
        
        if (manager.employees.length > 0) {
          markdown += `- **Team Members:**\n`
          manager.employees.forEach(emp => {
            markdown += `  - ${emp.name} (${emp.email})\n`
          })
        }
        markdown += `\n`
      })
    }
  })

  // Employees Section
  markdown += `## 👥 Employees by Department\n\n`
  
  departments.forEach(dept => {
    const deptEmployees = groupedUsers.employees.filter(u => u.department === dept)
    if (deptEmployees.length > 0) {
      markdown += `### ${dept} Department (${deptEmployees.length} employees)\n\n`
      markdown += `| Name | Email | Manager | Evaluation Status | Rating |\n`
      markdown += `|------|-------|---------|-------------------|--------|\n`
      
      deptEmployees.forEach(emp => {
        const evalStatus = evaluationMap[emp.id]
        const statusIcon = evalStatus ? (evalStatus.status === 'completed' ? '✅' : '⏳') : '❌'
        const status = evalStatus?.status || 'None'
        const rating = evalStatus?.rating ? `${evalStatus.rating}/5` : 'N/A'
        
        markdown += `| ${emp.name} | \`${emp.email}\` | ${emp.manager?.name || 'No manager'} | ${statusIcon} ${status} | ${rating} |\n`
      })
      markdown += `\n`
    }
  })

  // Statistics Section
  markdown += `## 📊 Statistics\n\n`
  
  const totalEvaluations = Object.keys(evaluationMap).length
  const completedEvaluations = Object.values(evaluationMap).filter(e => e.status === 'completed').length
  const draftEvaluations = Object.values(evaluationMap).filter(e => e.status === 'draft').length
  const noEvaluations = users.length - totalEvaluations
  
  markdown += `### Evaluation Status\n`
  markdown += `- **Total Employees:** ${users.length}\n`
  markdown += `- **Completed Evaluations:** ${completedEvaluations} ✅\n`
  markdown += `- **Draft Evaluations:** ${draftEvaluations} ⏳\n`
  markdown += `- **No Evaluations:** ${noEvaluations} ❌\n`
  markdown += `- **Completion Rate:** ${Math.round((completedEvaluations / users.length) * 100)}%\n\n`

  // Rating distribution
  const ratings = Object.values(evaluationMap).map(e => e.rating).filter(r => r)
  if (ratings.length > 0) {
    const ratingCounts = [1,2,3,4,5].map(rating => ({
      rating,
      count: ratings.filter(r => r === rating).length
    }))
    
    markdown += `### Rating Distribution (${ratings.length} rated evaluations)\n`
    ratingCounts.forEach(({ rating, count }) => {
      const percentage = Math.round((count / ratings.length) * 100)
      const stars = '⭐'.repeat(rating)
      markdown += `- **${rating}/5 ${stars}:** ${count} employees (${percentage}%)\n`
    })
    
    const avgRating = (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
    markdown += `- **Average Rating:** ${avgRating}/5\n\n`
  }

  // Problematic cases for dashboard testing
  markdown += `### 🚨 Dashboard Testing Cases\n`
  markdown += `- **No Evaluation:** Ron Weasley (perfect for testing missing evaluation alerts)\n`
  markdown += `- **Incomplete Evaluation:** Draco Malfoy (draft status, no ratings - testing incomplete evaluation flows)\n`
  markdown += `- **Low Performers:** ${Object.entries(evaluationMap).filter(([_, e]) => e.rating && e.rating <= 2).length} employees with ratings ≤ 2/5\n`
  markdown += `- **High Performers:** ${Object.entries(evaluationMap).filter(([_, e]) => e.rating && e.rating >= 4).length} employees with ratings ≥ 4/5\n\n`

  // Department breakdown
  markdown += `### Department Breakdown\n`
  departments.forEach(dept => {
    const deptUsers = users.filter(u => u.department === dept)
    const managers = deptUsers.filter(u => u.role === 'manager').length
    const employees = deptUsers.filter(u => u.role === 'employee').length
    markdown += `- **${dept}:** ${deptUsers.length} total (${managers} managers, ${employees} employees)\n`
  })

  markdown += `\n---\n\n`
  markdown += `*Document generated automatically from database on ${new Date().toISOString()}*\n`

  // Write to file
  fs.writeFileSync('EMPLOYEE_DIRECTORY.md', markdown)
  
  console.log('✅ Employee directory generated!')
  console.log('📄 File saved as: EMPLOYEE_DIRECTORY.md')
  console.log(`📊 Summary:`)
  console.log(`   - ${users.length} total users documented`)
  console.log(`   - ${completedEvaluations} completed evaluations`)
  console.log(`   - ${draftEvaluations} draft evaluations`) 
  console.log(`   - ${noEvaluations} employees without evaluations`)
}

main()
  .catch((e) => {
    console.error('❌ Error generating employee list:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })