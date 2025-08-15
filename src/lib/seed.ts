import { prisma } from './prisma-client'
import bcrypt from 'bcryptjs'

export async function seedDatabase() {
  // Create a demo company
  const company = await prisma.company.upsert({
    where: { code: 'DEMO_001' },
    update: {},
    create: {
      name: 'Demo Company',
      code: 'DEMO_001',
      active: true,
      aiEnabled: true, // Enable AI for demo
      aiFeatures: {
        textImprovement: true
      }
    }
  })

  // Create HR admin user
  const hrAdmin = await prisma.user.upsert({
    where: { 
      companyId_email: {
        companyId: company.id,
        email: 'hr@demo.com'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      email: 'hr@demo.com',
      name: 'HR Administrator',
      role: 'hr',
      employeeId: 'HR000',
      personID: '10101010',
      passwordHash: await bcrypt.hash('a', 12),
      userType: 'office',
      loginMethod: 'email',
      active: true
    }
  })

  // Create a manager
  const manager = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'manager@demo.com'
      }
    },
    update: {},
    create: {
      companyId: company.id,
      email: 'manager@demo.com',
      name: 'John Manager',
      role: 'manager',
      employeeId: 'MGR001',
      personID: '87654321',
      passwordHash: await bcrypt.hash('a', 12),
      userType: 'office',  
      loginMethod: 'email',
      department: 'Operations',
      active: true
    }
  })

  // Create office employees
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: {
        companyId_email: {
          companyId: company.id,
          email: `employee${i}@demo.com`
        }
      },
      update: {},
      create: {
        companyId: company.id,
        email: `employee${i}@demo.com`,
        name: `Office Employee ${i}`,
        role: 'employee',
        managerId: manager.id,
        employeeId: `EMP00${i}`,
        personID: `1234567${i}`,
        passwordHash: await bcrypt.hash('a', 12),
        userType: 'office',
        loginMethod: 'email',
        department: 'Sales',
        active: true
      }
    })
  }

  // Create operational workers
  for (let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: {
        companyId_username: {
          companyId: company.id,
          username: `worker${i}`
        }
      },
      update: {},
      create: {
        companyId: company.id,
        username: `worker${i}`,
        name: `Operational Worker ${i}`,
        role: 'employee',
        managerId: manager.id,
        employeeId: `WRK00${i}`,
        personID: `9876543${i}`,
        passwordHash: await bcrypt.hash('1234', 12),
        pinCode: '1234',
        userType: 'operational',
        loginMethod: 'username',
        requiresPinOnly: true,
        department: 'Sales',
        shift: i <= 2 ? 'Day' : 'Night',
        active: true
      }
    })
  }

  // Create three HR managers with their own teams
  const hrManagers = []
  
  for (let i = 1; i <= 3; i++) {
    const hrManager = await prisma.user.upsert({
      where: {
        companyId_email: {
          companyId: company.id,
          email: `hr${i}@demo.com`
        }
      },
      update: {},
      create: {
        companyId: company.id,
        email: `hr${i}@demo.com`,
        name: `HR Manager ${i}`,
        role: 'hr',
        employeeId: `HR00${i}`,
        personID: `1111111${i}`,
        passwordHash: await bcrypt.hash('a', 12),
        userType: 'office',
        loginMethod: 'email',
        department: i === 1 ? 'Human Resources' : i === 2 ? 'Talent Acquisition' : 'Learning & Development',
        active: true
      }
    })
    hrManagers.push(hrManager)
  }

  // Create teams for each HR manager
  for (let hrIndex = 0; hrIndex < hrManagers.length; hrIndex++) {
    const hrManager = hrManagers[hrIndex]
    const departments = ['Human Resources', 'Talent Acquisition', 'Learning & Development']
    
    // Create 3-4 employees for each HR manager
    for (let empIndex = 1; empIndex <= 4; empIndex++) {
      await prisma.user.upsert({
        where: {
          companyId_email: {
            companyId: company.id,
            email: `hr${hrIndex + 1}emp${empIndex}@demo.com`
          }
        },
        update: {},
        create: {
          companyId: company.id,
          email: `hr${hrIndex + 1}emp${empIndex}@demo.com`,
          name: `${departments[hrIndex]} Employee ${empIndex}`,
          role: 'employee',
          managerId: hrManager.id,
          employeeId: `H${hrIndex + 1}E0${empIndex}`,
          personID: `222${hrIndex + 1}00${empIndex}`,
          passwordHash: await bcrypt.hash('a', 12),
          userType: 'office',
          loginMethod: 'email',
          department: departments[hrIndex],
          active: true
        }
      })
    }
  }

  // Create three-tier evaluation items structure  
  const evaluationItems: Array<{
    type: string
    level: string  
    title: string
    description: string
    createdBy: string
    assignedTo?: string
    sortOrder: number
  }> = [
    // 2 Company-wide OKRs (set by HR - read-only)
    { 
      type: 'okr', 
      level: 'company',
      title: 'Increase Company Revenue by 25%', 
      description: 'Drive overall company growth through strategic initiatives and market expansion',
      createdBy: hrAdmin.id,
      sortOrder: 1 
    },
    { 
      type: 'okr', 
      level: 'company',
      title: 'Digital Transformation Initiative', 
      description: 'Successfully implement digital tools across all departments to improve efficiency',
      createdBy: hrAdmin.id,
      sortOrder: 2 
    },
    
    // 2 Company-wide Competencies (set by HR - read-only)
    { 
      type: 'competency', 
      level: 'company',
      title: 'Communication Excellence', 
      description: 'Clear, professional communication across all channels and stakeholders',
      createdBy: hrAdmin.id,
      sortOrder: 3 
    },
    { 
      type: 'competency', 
      level: 'company',
      title: 'Adaptability', 
      description: 'Flexibility and resilience in changing business environments',
      createdBy: hrAdmin.id,
      sortOrder: 4 
    },
    
    // 2 Department/Team-wide OKRs (set by Manager - editable)
    { 
      type: 'okr', 
      level: 'department',
      title: 'Improve Department Efficiency by 15%', 
      description: 'Streamline processes and reduce waste in daily operations',
      createdBy: manager.id,
      assignedTo: 'Sales', // Department name
      sortOrder: 5 
    },
    { 
      type: 'okr', 
      level: 'department',
      title: 'Reduce Customer Response Time', 
      description: 'Achieve average response time of under 2 hours for all customer inquiries',
      createdBy: manager.id,
      assignedTo: 'Sales', // Department name
      sortOrder: 6 
    },
    
    // Additional Department-level items for more comprehensive testing
    { 
      type: 'competency', 
      level: 'department',
      title: 'Team Collaboration', 
      description: 'Work effectively with team members and support collective goals',
      createdBy: manager.id,
      assignedTo: 'Sales', // Department name
      sortOrder: 7 
    },
    
    // Another Department-level competency
    { 
      type: 'competency', 
      level: 'department',
      title: 'Problem Solving', 
      description: 'Identify issues proactively and develop creative solutions for the team',
      createdBy: manager.id,
      assignedTo: 'Sales', // Department name
      sortOrder: 8 
    }
  ]

  for (const itemData of evaluationItems) {
    await prisma.evaluationItem.upsert({
      where: { 
        id: `${company.id}-${itemData.sortOrder}`
      },
      update: {},
      create: {
        id: `${company.id}-${itemData.sortOrder}`,
        companyId: company.id,
        title: itemData.title,
        description: itemData.description,
        type: itemData.type,
        level: itemData.level,
        createdBy: itemData.createdBy,
        assignedTo: itemData.assignedTo || null,
        sortOrder: itemData.sortOrder,
        active: true
      }
    })
  }

  // Create default performance cycle for current year
  const currentYear = new Date().getFullYear()
  const defaultCycle = await prisma.performanceCycle.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: `${currentYear} Annual Review`
      }
    },
    update: {},
    create: {
      companyId: company.id,
      name: `${currentYear} Annual Review`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      status: 'active',
      createdBy: hrAdmin.id
    }
  })

  // Update existing evaluation items to belong to this cycle
  await prisma.evaluationItem.updateMany({
    where: {
      companyId: company.id,
      cycleId: null
    },
    data: {
      cycleId: defaultCycle.id
    }
  })

  // Update existing evaluations to belong to this cycle
  await prisma.evaluation.updateMany({
    where: {
      companyId: company.id,
      cycleId: null
    },
    data: {
      cycleId: defaultCycle.id
    }
  })

  // Create test evaluations with various statuses
  console.log('📝 Creating test evaluations with different statuses...')
  
  // Get all employees for evaluation creation
  const allEmployees = await prisma.user.findMany({
    where: {
      companyId: company.id,
      role: 'employee'
    },
    include: {
      manager: true
    }
  })

  // Sample evaluation items data (simplified for seeding)
  const sampleEvaluationItems = [
    {
      id: 'item-1',
      title: 'Increase Company Revenue by 25%',
      description: 'Drive overall company growth through strategic initiatives and market expansion',
      type: 'okr',
      rating: null,
      comment: '',
      level: 'company',
      createdBy: hrAdmin.id
    },
    {
      id: 'item-2', 
      title: 'Digital Transformation Initiative',
      description: 'Successfully implement digital tools across all departments to improve efficiency',
      type: 'okr',
      rating: null,
      comment: '',
      level: 'company',
      createdBy: hrAdmin.id
    },
    {
      id: 'item-3',
      title: 'Communication Excellence',
      description: 'Clear, professional communication across all channels and stakeholders', 
      type: 'competency',
      rating: null,
      comment: '',
      level: 'company',
      createdBy: hrAdmin.id
    },
    {
      id: 'item-4',
      title: 'Adaptability',
      description: 'Flexibility and resilience in changing business environments',
      type: 'competency', 
      rating: null,
      comment: '',
      level: 'company',
      createdBy: hrAdmin.id
    },
    {
      id: 'item-5',
      title: 'Improve Department Efficiency by 15%',
      description: 'Streamline processes and reduce waste in daily operations',
      type: 'okr',
      rating: null,
      comment: '',
      level: 'department',
      createdBy: manager.id
    }
  ]

  // Create evaluations with different statuses for testing
  const evaluationScenarios = [
    // COMPLETED evaluations (employee approved)
    {
      employee: allEmployees[0], // employee1@demo.com
      status: 'completed',
      overallRating: 4,
      managerComments: 'Excellent performance this quarter. Consistently exceeds expectations.',
      items: sampleEvaluationItems.map((item, idx) => ({
        ...item,
        rating: [5, 4, 4, 4, 3][idx],
        comment: [
          'Outstanding work on revenue initiatives, exceeded target by 10%',
          'Led digital transformation in sales department successfully', 
          'Clear and effective communicator with all team members',
          'Adapted quickly to new processes and market changes',
          'Implemented 3 efficiency improvements saving 20% time'
        ][idx]
      })),
      completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    },

    // SUBMITTED evaluation (waiting for employee approval) 
    {
      employee: allEmployees[1], // employee2@demo.com  
      status: 'submitted',
      overallRating: 3,
      managerComments: 'Good performance with room for improvement in some areas.',
      items: sampleEvaluationItems.map((item, idx) => ({
        ...item,
        rating: [3, 3, 4, 2, 3][idx],
        comment: [
          'Met revenue targets, could focus more on proactive initiatives',
          'Participated in digital tools training, needs more practice',
          'Good communication skills, occasionally needs clarification',
          'Sometimes struggles with unexpected changes, improving',
          'Solid contributor to team efficiency efforts'
        ][idx]
      })),
      submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },

    // SUBMITTED evaluation (overdue - >3 days)
    {
      employee: allEmployees[2], // employee3@demo.com
      status: 'submitted', 
      overallRating: 5,
      managerComments: 'Exceptional performance, natural leader and innovator.',
      items: sampleEvaluationItems.map((item, idx) => ({
        ...item,
        rating: [5, 5, 5, 5, 4][idx],
        comment: [
          'Exceeded revenue goals by 15%, developed new client acquisition strategy',
          'Led digital transformation training for entire department',
          'Excellent presentation and stakeholder communication skills',
          'Thrives in changing environments, helps others adapt',
          'Introduced 5 process improvements, mentors other team members'
        ][idx]
      })),
      submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago (overdue)
    },

    // DRAFT evaluation (incomplete - missing comments)
    {
      employee: allEmployees[3], // worker1 (first operational worker)
      status: 'draft',
      overallRating: null,
      managerComments: '',
      items: sampleEvaluationItems.map((item, idx) => ({
        ...item,
        rating: idx < 3 ? [4, 3, 4][idx] : null, // Only first 3 items have ratings
        comment: idx < 3 ? [
          'Good progress on company objectives',
          'Learning new digital tools effectively', 
          'Communicates well with team'
        ][idx] : '' // Missing comments for last 2 items
      })),
      draftDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },

    // DRAFT evaluation (completely empty - overdue)  
    {
      employee: allEmployees[4], // worker2
      status: 'draft',
      overallRating: null,
      managerComments: '',
      items: sampleEvaluationItems.map(item => ({
        ...item,
        rating: null,
        comment: ''
      })),
      draftDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago (very overdue)
    }
  ]

  // Create the actual evaluations
  for (let i = 0; i < evaluationScenarios.length; i++) {
    const scenario = evaluationScenarios[i]
    if (!scenario.employee.manager) continue

    await prisma.evaluation.upsert({
      where: {
        employeeId_periodType_periodDate: {
          employeeId: scenario.employee.id,
          periodType: 'yearly',
          periodDate: currentYear.toString()
        }
      },
      update: {},
      create: {
        employeeId: scenario.employee.id,
        managerId: scenario.employee.manager.id,
        companyId: company.id,
        cycleId: defaultCycle.id,
        periodType: 'yearly',
        periodDate: currentYear.toString(),
        status: scenario.status,
        overallRating: scenario.overallRating,
        managerComments: scenario.managerComments,
        evaluationItemsData: JSON.stringify(scenario.items),
        createdAt: scenario.completedDate || scenario.submittedDate || scenario.draftDate || new Date(),
        updatedAt: scenario.completedDate || scenario.submittedDate || scenario.draftDate || new Date()
      }
    })
  }

  // Create some evaluations for HR managers' teams too
  for (let hrIndex = 0; hrIndex < hrManagers.length; hrIndex++) {
    const hrManager = hrManagers[hrIndex]
    const hrEmployees = await prisma.user.findMany({
      where: {
        companyId: company.id,
        managerId: hrManager.id
      }
    })

    // Create one completed evaluation per HR team
    if (hrEmployees.length > 0) {
      await prisma.evaluation.upsert({
        where: {
          employeeId_periodType_periodDate: {
            employeeId: hrEmployees[0].id,
            periodType: 'yearly',
            periodDate: currentYear.toString()
          }
        },
        update: {},
        create: {
          employeeId: hrEmployees[0].id,
          managerId: hrManager.id,
          companyId: company.id,
          cycleId: defaultCycle.id,
          periodType: 'yearly',
          periodDate: currentYear.toString(),
          status: 'completed',
          overallRating: 4,
          managerComments: `Great performance in ${hrManager.department} department.`,
          evaluationItemsData: JSON.stringify(sampleEvaluationItems.map(item => ({
            ...item,
            rating: 4,
            comment: `Solid performance on ${item.title.toLowerCase()}`
          }))),
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      })
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('🔑 Login Credentials:')
  console.log('📧 HR Admin: hr@demo.com / a')
  console.log('👨‍💼 Manager: manager@demo.com / a')
  console.log('👨‍💻 Employee 1: employee1@demo.com / a')  
  console.log('👨‍💻 Employee 2: employee2@demo.com / a')
  console.log('👨‍💻 Employee 3: employee3@demo.com / a')
  console.log('🔧 Worker 1: worker1 / 1234')
  console.log('🔧 Worker 2: worker2 / 1234')
  console.log('')
  console.log('🧑‍💼 HR Managers with Teams:')
  console.log('   HR1 (Human Resources): hr1@demo.com / a (4 employees)')
  console.log('   HR2 (Talent Acquisition): hr2@demo.com / a (4 employees)')  
  console.log('   HR3 (Learning & Development): hr3@demo.com / a (4 employees)')
  console.log('')
  console.log('📊 Test Evaluation Status Distribution:')
  console.log('   ✅ COMPLETED: employee1@demo.com (approved, good ratings)')
  console.log('   📤 SUBMITTED: employee2@demo.com (2 days ago, needs approval)')
  console.log('   ⏰ SUBMITTED: employee3@demo.com (5 days ago, overdue approval)')
  console.log('   🔄 DRAFT: worker1 (partial ratings, missing comments)')
  console.log('   ❌ DRAFT: worker2 (empty, 10 days overdue)')
  console.log('')
  console.log('🎯 8 evaluation items created per evaluation')
  console.log(`🔄 Performance cycle: "${defaultCycle.name}" (${defaultCycle.status})`)
}