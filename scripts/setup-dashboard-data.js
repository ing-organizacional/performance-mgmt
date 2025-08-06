const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Movie/TV characters for realistic names
const characters = [
  // Main characters (for managers)
  { name: 'Tony Stark', email: 'tony.stark@intercontinental.com', dept: 'Finance' },
  { name: 'Hermione Granger', email: 'hermione.granger@intercontinental.com', dept: 'HR' },
  { name: 'Gordon Ramsay', email: 'gordon.ramsay@intercontinental.com', dept: 'Food&Beverage' },
  { name: 'Tyrion Lannister', email: 'tyrion.lannister@intercontinental.com', dept: 'Rooms' },
  
  // HR Team
  { name: 'Nick Fury', email: 'nick.fury@intercontinental.com', dept: 'HR' }, // HR Manager
  { name: 'Natasha Romanoff', email: 'natasha.romanoff@intercontinental.com', dept: 'HR' },
  { name: 'Steve Rogers', email: 'steve.rogers@intercontinental.com', dept: 'HR' },
  
  // Finance Team (Tony's reports)
  { name: 'Bruce Wayne', email: 'bruce.wayne@intercontinental.com', dept: 'Finance' },
  { name: 'Clark Kent', email: 'clark.kent@intercontinental.com', dept: 'Finance' },
  { name: 'Diana Prince', email: 'diana.prince@intercontinental.com', dept: 'Finance' },
  { name: 'Barry Allen', email: 'barry.allen@intercontinental.com', dept: 'Finance' },
  { name: 'Arthur Curry', email: 'arthur.curry@intercontinental.com', dept: 'Finance' },
  
  // Rooms Team (Tyrion's reports)
  { name: 'Jon Snow', email: 'jon.snow@intercontinental.com', dept: 'Rooms' },
  { name: 'Daenerys Targaryen', email: 'daenerys.targaryen@intercontinental.com', dept: 'Rooms' },
  { name: 'Arya Stark', email: 'arya.stark@intercontinental.com', dept: 'Rooms' },
  { name: 'Sansa Stark', email: 'sansa.stark@intercontinental.com', dept: 'Rooms' },
  { name: 'Cersei Lannister', email: 'cersei.lannister@intercontinental.com', dept: 'Rooms' },
  
  // Food&Beverage Team (Gordon's reports)
  { name: 'Jamie Oliver', email: 'jamie.oliver@intercontinental.com', dept: 'Food&Beverage' },
  { name: 'Julia Child', email: 'julia.child@intercontinental.com', dept: 'Food&Beverage' },
  { name: 'Anthony Bourdain', email: 'anthony.bourdain@intercontinental.com', dept: 'Food&Beverage' },
  { name: 'Martha Stewart', email: 'martha.stewart@intercontinental.com', dept: 'Food&Beverage' },
  { name: 'Bobby Flay', email: 'bobby.flay@intercontinental.com', dept: 'Food&Beverage' },
  
  // HR Team Reports (under Hermione as dept head, but Nick as HR Manager)
  { name: 'Luna Lovegood', email: 'luna.lovegood@intercontinental.com', dept: 'HR' },
  { name: 'Neville Longbottom', email: 'neville.longbottom@intercontinental.com', dept: 'HR' },
  { name: 'Ginny Weasley', email: 'ginny.weasley@intercontinental.com', dept: 'HR' },
  { name: 'Draco Malfoy', email: 'draco.malfoy@intercontinental.com', dept: 'HR' },
  { name: 'Ron Weasley', email: 'ron.weasley@intercontinental.com', dept: 'HR' }
]

async function main() {
  console.log('🚀 Starting database setup for dashboard development...')

  // Step 1: Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.auditLog.deleteMany({})
  await prisma.partialAssessment.deleteMany({})
  await prisma.evaluationItemAssignment.deleteMany({})
  await prisma.evaluationItem.deleteMany({})
  await prisma.evaluation.deleteMany({})
  await prisma.performanceCycle.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.company.deleteMany({})

  // Step 2: Create company
  console.log('🏢 Creating InterContinental San José company...')
  const company = await prisma.company.create({
    data: {
      name: 'InterContinental San José',
      code: 'ICSJ',
      active: true
    }
  })

  // Step 3: Create performance cycle
  console.log('📅 Creating active performance cycle...')
  const cycle = await prisma.performanceCycle.create({
    data: {
      name: '2025 Annual Performance Review',
      companyId: company.id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active'
    }
  })

  // Step 4: Create users with proper hierarchy
  console.log('👥 Creating users with proper hierarchy...')
  
  // Create HR admin first (no direct reports)
  const hrAdmin = await prisma.user.create({
    data: {
      name: 'Professor Dumbledore',
      email: 'dumbledore@intercontinental.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'hr',
      userType: 'office',
      department: 'Administration',
      companyId: company.id,
      employeeId: 'HR001',
      personID: '001-001-001',
      active: true
    }
  })

  // Create department managers
  const managers = []
  
  // Finance Manager
  const financeManager = await prisma.user.create({
    data: {
      name: characters[0].name,
      email: characters[0].email,
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'manager',
      userType: 'office',
      department: characters[0].dept,
      companyId: company.id,
      employeeId: 'FIN001',
      personID: '002-001-001',
      active: true
    }
  })
  managers.push(financeManager)

  // HR Department Manager (Hermione)
  const hrDeptManager = await prisma.user.create({
    data: {
      name: characters[1].name,
      email: characters[1].email,
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'manager',
      userType: 'office',
      department: characters[1].dept,
      companyId: company.id,
      employeeId: 'HR002',
      personID: '003-001-001',
      active: true
    }
  })
  managers.push(hrDeptManager)

  // Food&Beverage Manager
  const fbManager = await prisma.user.create({
    data: {
      name: characters[2].name,
      email: characters[2].email,
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'manager',
      userType: 'office',
      department: characters[2].dept,
      companyId: company.id,
      employeeId: 'FB001',
      personID: '004-001-001',
      active: true
    }
  })
  managers.push(fbManager)

  // Rooms Manager
  const roomsManager = await prisma.user.create({
    data: {
      name: characters[3].name,
      email: characters[3].email,
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'manager',
      userType: 'office',
      department: characters[3].dept,
      companyId: company.id,
      employeeId: 'RM001',
      personID: '005-001-001',
      active: true
    }
  })
  managers.push(roomsManager)

  // HR Team Manager (Nick Fury)
  const hrTeamManager = await prisma.user.create({
    data: {
      name: characters[4].name,
      email: characters[4].email,
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'manager',
      userType: 'office',
      department: characters[4].dept,
      companyId: company.id,
      managerId: hrDeptManager.id,
      employeeId: 'HR003',
      personID: '006-001-001',
      active: true
    }
  })
  managers.push(hrTeamManager)

  // Create employees for each department
  console.log('👨‍💼 Creating employees for each department...')
  
  const employees = []
  let empCounter = 1
  
  // Finance employees (5 under Tony)
  for (let i = 7; i < 12; i++) {
    const employee = await prisma.user.create({
      data: {
        name: characters[i].name,
        email: characters[i].email,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee',
        userType: 'office',
        department: characters[i].dept,
        companyId: company.id,
        managerId: financeManager.id,
        employeeId: `EMP${String(empCounter).padStart(3, '0')}`,
        personID: `007-${String(i).padStart(3, '0')}-001`,
        active: true
      }
    })
    employees.push(employee)
    empCounter++
  }

  // Rooms employees (5 under Tyrion)
  for (let i = 12; i < 17; i++) {
    const employee = await prisma.user.create({
      data: {
        name: characters[i].name,
        email: characters[i].email,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee',
        userType: 'office',
        department: characters[i].dept,
        companyId: company.id,
        managerId: roomsManager.id,
        employeeId: `EMP${String(empCounter).padStart(3, '0')}`,
        personID: `008-${String(i).padStart(3, '0')}-001`,
        active: true
      }
    })
    employees.push(employee)
    empCounter++
  }

  // Food&Beverage employees (5 under Gordon)
  for (let i = 17; i < 22; i++) {
    const employee = await prisma.user.create({
      data: {
        name: characters[i].name,
        email: characters[i].email,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee',
        userType: 'office',
        department: characters[i].dept,
        companyId: company.id,
        managerId: fbManager.id,
        employeeId: `EMP${String(empCounter).padStart(3, '0')}`,
        personID: `009-${String(i).padStart(3, '0')}-001`,
        active: true
      }
    })
    employees.push(employee)
    empCounter++
  }

  // HR Team employees (2 under Nick Fury)
  for (let i = 5; i < 7; i++) {
    const employee = await prisma.user.create({
      data: {
        name: characters[i].name,
        email: characters[i].email,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee',
        userType: 'office',
        department: characters[i].dept,
        companyId: company.id,
        managerId: hrTeamManager.id,
        employeeId: `EMP${String(empCounter).padStart(3, '0')}`,
        personID: `010-${String(i).padStart(3, '0')}-001`,
        active: true
      }
    })
    employees.push(employee)
    empCounter++
  }

  // HR Department employees (5 under Hermione)
  for (let i = 22; i < 27; i++) {
    const employee = await prisma.user.create({
      data: {
        name: characters[i].name,
        email: characters[i].email,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee',
        userType: 'office',
        department: characters[i].dept,
        companyId: company.id,
        managerId: hrDeptManager.id,
        employeeId: `EMP${String(empCounter).padStart(3, '0')}`,
        personID: `011-${String(i).padStart(3, '0')}-001`,
        active: true
      }
    })
    employees.push(employee)
    empCounter++
  }

  // Step 5: Create company-wide evaluation items
  console.log('📋 Creating company-wide evaluation items...')
  
  // Company-wide OKR
  const companyOKR = await prisma.evaluationItem.create({
    data: {
      title: 'Achieve Excellence in Guest Satisfaction',
      description: 'Maintain guest satisfaction scores above 95% while increasing repeat guest percentage by 15%. Focus on personalized service, prompt issue resolution, and memorable experiences that exceed expectations.',
      type: 'okr',
      level: 'company',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: hrAdmin.id,
      active: true,
      sortOrder: 1
    }
  })

  // Company-wide Competencies
  const companyComp1 = await prisma.evaluationItem.create({
    data: {
      title: 'Customer Service Excellence',
      description: 'Demonstrate exceptional customer service skills through active listening, empathy, problem-solving, and going above and beyond to meet guest needs. Maintain professional demeanor in all interactions.',
      type: 'competency',
      level: 'company',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: hrAdmin.id,
      active: true,
      sortOrder: 2
    }
  })

  const companyComp2 = await prisma.evaluationItem.create({
    data: {
      title: 'Teamwork and Collaboration',
      description: 'Work effectively with colleagues across departments, share knowledge, support team goals, and contribute to positive workplace culture. Communicate clearly and respectfully with all team members.',
      type: 'competency',
      level: 'company',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: hrAdmin.id,
      active: true,
      sortOrder: 3
    }
  })

  // Step 6: Create department-specific items for variety
  console.log('🏗️ Creating department-specific evaluation items...')
  
  const departmentItems = []
  
  // Finance Department Items
  const financeOKR = await prisma.evaluationItem.create({
    data: {
      title: 'Optimize Financial Operations Efficiency',
      description: 'Reduce month-end closing time by 25% while maintaining 100% accuracy in financial reporting. Implement automated processes and improve budget variance analysis.',
      type: 'okr',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: financeManager.id,
      active: true,
      sortOrder: 4
    }
  })
  departmentItems.push(financeOKR)

  const financeComp = await prisma.evaluationItem.create({
    data: {
      title: 'Financial Analysis and Reporting',
      description: 'Demonstrate proficiency in financial analysis, budget preparation, variance analysis, and clear reporting. Ensure accuracy and timeliness in all financial documentation.',
      type: 'competency',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: financeManager.id,
      active: true,
      sortOrder: 5
    }
  })
  departmentItems.push(financeComp)

  // Rooms Department Items
  const roomsOKR = await prisma.evaluationItem.create({
    data: {
      title: 'Enhance Room Operations Excellence',
      description: 'Achieve 98% room cleanliness scores and reduce guest maintenance requests by 30%. Optimize housekeeping efficiency and guest room turnover times.',
      type: 'okr',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: roomsManager.id,
      active: true,
      sortOrder: 6
    }
  })
  departmentItems.push(roomsOKR)

  const roomsComp = await prisma.evaluationItem.create({
    data: {
      title: 'Attention to Detail',
      description: 'Consistently maintain high standards in room preparation, cleanliness, and guest amenities. Identify and address potential issues before they impact guest experience.',
      type: 'competency',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: roomsManager.id,
      active: true,
      sortOrder: 7
    }
  })
  departmentItems.push(roomsComp)

  // Food & Beverage Items
  const fbOKR = await prisma.evaluationItem.create({
    data: {
      title: 'Elevate Culinary Experience Standards',
      description: 'Increase restaurant revenue by 20% while maintaining food quality scores above 4.7/5. Reduce food waste by 15% and introduce 3 new signature dishes.',
      type: 'okr',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: fbManager.id,
      active: true,
      sortOrder: 8
    }
  })
  departmentItems.push(fbOKR)

  const fbComp = await prisma.evaluationItem.create({
    data: {
      title: 'Culinary Skills and Food Safety',
      description: 'Maintain exceptional food preparation standards, follow all safety protocols, and demonstrate creativity in menu development. Ensure consistent quality and presentation.',
      type: 'competency',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: fbManager.id,
      active: true,
      sortOrder: 9
    }
  })
  departmentItems.push(fbComp)

  // HR Department Items
  const hrOKR = await prisma.evaluationItem.create({
    data: {
      title: 'Strengthen Employee Engagement',
      description: 'Increase employee satisfaction scores to 85% and reduce turnover by 20%. Launch 2 new professional development programs and improve onboarding experience.',
      type: 'okr',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: hrDeptManager.id,
      active: true,
      sortOrder: 10
    }
  })
  departmentItems.push(hrOKR)

  const hrComp = await prisma.evaluationItem.create({
    data: {
      title: 'Communication and Interpersonal Skills',
      description: 'Demonstrate excellent verbal and written communication, active listening, conflict resolution, and ability to build rapport with employees at all levels.',
      type: 'competency',
      level: 'department',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: hrDeptManager.id,
      active: true,
      sortOrder: 11
    }
  })
  departmentItems.push(hrComp)

  // Step 7: Create individual manager items for variety
  console.log('👔 Creating manager-specific evaluation items...')
  
  const managerItems = []
  
  // Add some individual items from each manager
  const individualItem1 = await prisma.evaluationItem.create({
    data: {
      title: 'Innovation and Process Improvement',
      description: 'Identify and implement innovative solutions to improve operational efficiency. Lead change initiatives and mentor team members in adopting new technologies.',
      type: 'competency',
      level: 'manager',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: financeManager.id,
      active: true,
      sortOrder: 12
    }
  })
  managerItems.push(individualItem1)

  const individualItem2 = await prisma.evaluationItem.create({
    data: {
      title: 'Leadership and Development',
      description: 'Demonstrate strong leadership skills by coaching team members, providing constructive feedback, and supporting professional growth opportunities.',
      type: 'competency',
      level: 'manager',
      companyId: company.id,
      cycleId: cycle.id,
      createdBy: roomsManager.id,
      active: true,
      sortOrder: 13
    }
  })
  managerItems.push(individualItem2)

  // Step 8: Create assignments for all evaluation items
  console.log('🎯 Creating evaluation item assignments...')
  
  const allUsers = [...managers, ...employees]
  const allItems = [companyOKR, companyComp1, companyComp2, ...departmentItems, ...managerItems]
  
  // Assign company-wide items to everyone
  for (const user of allUsers) {
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: companyOKR.id,
        employeeId: user.id,
        assignedBy: hrAdmin.id,
        companyId: company.id
      }
    })
    
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: companyComp1.id,
        employeeId: user.id,
        assignedBy: hrAdmin.id,
        companyId: company.id
      }
    })
    
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: companyComp2.id,
        employeeId: user.id,
        assignedBy: hrAdmin.id,
        companyId: company.id
      }
    })
  }
  
  // Assign department-specific items
  const financeUsers = allUsers.filter(u => u.department === 'Finance')
  const roomsUsers = allUsers.filter(u => u.department === 'Rooms')
  const fbUsers = allUsers.filter(u => u.department === 'Food&Beverage')
  const hrUsers = allUsers.filter(u => u.department === 'HR')
  
  // Finance department assignments
  for (const user of financeUsers) {
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: financeOKR.id,
        employeeId: user.id,
        assignedBy: financeManager.id,
        companyId: company.id
      }
    })
    
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: financeComp.id,
        employeeId: user.id,
        assignedBy: financeManager.id,
        companyId: company.id
      }
    })
  }
  
  // Similar assignments for other departments
  for (const user of roomsUsers) {
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: roomsOKR.id,
        employeeId: user.id,
        assignedBy: roomsManager.id,
        companyId: company.id
      }
    })
    
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: roomsComp.id,
        employeeId: user.id,
        assignedBy: roomsManager.id,
        companyId: company.id
      }
    })
  }
  
  for (const user of fbUsers) {
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: fbOKR.id,
        employeeId: user.id,
        assignedBy: fbManager.id,
        companyId: company.id
      }
    })
    
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: fbComp.id,
        employeeId: user.id,
        assignedBy: fbManager.id,
        companyId: company.id
      }
    })
  }
  
  for (const user of hrUsers) {
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: hrOKR.id,
        employeeId: user.id,
        assignedBy: hrDeptManager.id,
        companyId: company.id
      }
    })
    
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: hrComp.id,
        employeeId: user.id,
        assignedBy: hrDeptManager.id,
        companyId: company.id
      }
    })
  }
  
  // Assign some individual items to reach 8+ items per employee
  for (const user of allUsers.slice(0, 10)) {
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: individualItem1.id,
        employeeId: user.id,
        assignedBy: financeManager.id,
        companyId: company.id
      }
    })
  }
  
  for (const user of allUsers.slice(10, 20)) {
    await prisma.evaluationItemAssignment.create({
      data: {
        evaluationItemId: individualItem2.id,
        employeeId: user.id,
        assignedBy: roomsManager.id,
        companyId: company.id
      }
    })
  }

  // Step 9: Create evaluations for all users except one
  console.log('📝 Creating evaluations for all users except one...')
  
  const usersToEvaluate = allUsers.slice(0, -1) // Leave last user without evaluation
  
  for (const user of usersToEvaluate) {
    // Get all assigned items for this user
    const assignments = await prisma.evaluationItemAssignment.findMany({
      where: { employeeId: user.id },
      include: { evaluationItem: true }
    })
    
    // Create evaluation items data
    const evaluationItemsData = assignments.map(assignment => ({
      id: assignment.evaluationItem.id,
      title: assignment.evaluationItem.title,
      description: assignment.evaluationItem.description,
      type: assignment.evaluationItem.type,
      rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5
      comment: getRandomComment(assignment.evaluationItem.type, assignment.evaluationItem.title),
      level: assignment.evaluationItem.level
    }))
    
    const overallRating = Math.floor(Math.random() * 5) + 1
    
    await prisma.evaluation.create({
      data: {
        employeeId: user.id,
        managerId: user.managerId || hrAdmin.id,
        companyId: company.id,
        cycleId: cycle.id,
        periodType: 'yearly',
        periodDate: '2025',
        evaluationItemsData: JSON.stringify(evaluationItemsData),
        overallRating,
        managerComments: getRandomOverallComment(overallRating),
        status: 'completed'
      }
    })
  }

  console.log('✅ Database setup complete!')
  console.log(`📊 Created:`)
  console.log(`   - 1 Company: InterContinental San José`)
  console.log(`   - 1 Performance Cycle: 2025 Annual Performance Review`)
  console.log(`   - 1 HR Admin: ${hrAdmin.name}`)
  console.log(`   - 5 Managers: ${managers.map(m => m.name).join(', ')}`)
  console.log(`   - ${employees.length} Employees`)
  console.log(`   - 13 Evaluation Items (3 company-wide, 8 department-specific, 2 individual)`)
  console.log(`   - ${usersToEvaluate.length} Completed Evaluations`)
  console.log(`   - 1 Employee without evaluation: ${allUsers[allUsers.length - 1].name}`)
  console.log(`\n🔐 Login Credentials:`)
  console.log(`   HR Admin: dumbledore@intercontinental.com / password123`)
  console.log(`   Finance Manager: ${financeManager.email} / password123`)
  console.log(`   HR Manager: ${hrDeptManager.email} / password123`)
  console.log(`   Any Employee: [check database] / password123`)
}

function getRandomComment(type, title) {
  const okrComments = [
    'Excellent progress towards achieving this objective. Consistently meeting milestones.',
    'Good work on this OKR. Some areas for improvement in execution speed.',
    'Outstanding performance. Exceeded expectations on most key results.',
    'Solid effort shown. Recommend focusing on data-driven improvements.',
    'Strong performance overall. Continue building on current momentum.'
  ]
  
  const competencyComments = [
    'Demonstrates strong competency in this area. Reliable and consistent performance.',
    'Good skills demonstrated. Room for growth in more complex scenarios.',
    'Exceptional competency level. Sets example for other team members.',
    'Competent performance with some areas for development identified.',
    'Very strong in this competency. Regularly helps mentor others.'
  ]
  
  return type === 'okr' 
    ? okrComments[Math.floor(Math.random() * okrComments.length)]
    : competencyComments[Math.floor(Math.random() * competencyComments.length)]
}

function getRandomOverallComment(rating) {
  const comments = {
    5: 'Outstanding performance throughout the evaluation period. Consistently exceeds expectations and demonstrates leadership qualities.',
    4: 'Strong performance with excellent results in most areas. Shows initiative and reliable execution.',
    3: 'Good solid performance. Meets expectations consistently with some standout achievements.',
    2: 'Acceptable performance with room for improvement. Shows potential for growth.',
    1: 'Performance below expectations. Requires focused development and support.'
  }
  
  return comments[rating] || comments[3]
}

main()
  .catch((e) => {
    console.error('❌ Error during database setup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })