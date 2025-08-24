/**
 * Comprehensive Database Seed Script
 * Company: DEMO S.A.
 * 40 Employees across 5 departments
 * With realistic evaluation data
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to generate dates
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

// Helper function to hash passwords
const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12)
}

// Department employee distribution (for future use)
// const departmentDistribution = {
//   'HR': 3,           // 1 HR Manager (super user) + 2 employees
//   'Rooms': 10,       // 1 Manager + 9 employees
//   'Food & Beverage': 12, // 1 Manager + 11 employees
//   'Finance': 7,      // 1 Manager + 6 employees  
//   'Maintenance': 8   // 1 Manager + 7 employees
//   // Total: 40
// }

// Popular movie/TV characters organized by department with hospitality positions
const employeeData = {
  'HR': {
    manager: { name: 'Miranda Priestly', email: 'miranda.priestly@demo.com', position: 'HR Director' }, // The Devil Wears Prada
    employees: [
      { name: 'Pam Beesly', email: 'pam.beesly@demo.com', position: 'HR Coordinator' }, // The Office
      { name: 'Toby Flenderson', email: 'toby.flenderson@demo.com', position: 'HR Specialist' } // The Office
    ]
  },
  'Rooms': {
    manager: { name: 'Basil Fawlty', email: 'basil.fawlty@demo.com', position: 'Rooms Division Manager' }, // Fawlty Towers
    employees: [
      { name: 'Polly Sherman', email: 'polly.sherman@demo.com', position: 'Front Desk Supervisor' },
      { name: 'Manuel Garcia', email: 'manuel.garcia@demo.com', position: 'Bellhop' },
      { name: 'Lorelai Gilmore', email: 'lorelai.gilmore@demo.com', position: 'Guest Relations Manager' }, // Gilmore Girls
      { name: 'Michel Gerard', email: 'michel.gerard@demo.com', position: 'Concierge' },
      { name: 'Sookie St. James', email: 'sookie.stjames@demo.com', position: 'Front Desk Agent' },
      { name: 'Lane Kim', email: 'lane.kim@demo.com', position: 'Reservations Agent' },
      { name: 'Kirk Gleason', email: 'kirk.gleason@demo.com', position: 'Night Auditor' },
      { name: 'Caesar Augustus', email: 'caesar.augustus@demo.com', position: 'Housekeeping Supervisor' },
      { name: 'Jackson Belleville', email: 'jackson.belleville@demo.com', position: 'Room Attendant' }
    ]
  },
  'Food & Beverage': {
    manager: { name: 'Gordon Ramsay', email: 'gordon.ramsay@demo.com', position: 'F&B Director' }, // Hell's Kitchen
    employees: [
      { name: 'Monica Geller', email: 'monica.geller@demo.com', position: 'Executive Chef' }, // Friends
      { name: 'Sanji Vinsmoke', email: 'sanji.vinsmoke@demo.com', position: 'Sous Chef' }, // One Piece
      { name: 'Bob Belcher', email: 'bob.belcher@demo.com', position: 'Line Cook' }, // Bob's Burgers
      { name: 'Linda Belcher', email: 'linda.belcher@demo.com', position: 'Restaurant Supervisor' },
      { name: 'Tina Belcher', email: 'tina.belcher@demo.com', position: 'Server' },
      { name: 'SpongeBob SquarePants', email: 'spongebob.squarepants@demo.com', position: 'Prep Cook' }, // SpongeBob
      { name: 'Squidward Tentacles', email: 'squidward.tentacles@demo.com', position: 'Cashier' },
      { name: 'Patrick Star', email: 'patrick.star@demo.com', position: 'Dishwasher' },
      { name: 'Remy Linguini', email: 'remy.linguini@demo.com', position: 'Pastry Chef' }, // Ratatouille
      { name: 'Colette Tatou', email: 'colette.tatou@demo.com', position: 'Bartender' },
      { name: 'Auguste Gusteau', email: 'auguste.gusteau@demo.com', position: 'Sommelier' }
    ]
  },
  'Finance': {
    manager: { name: 'Ben Wyatt', email: 'ben.wyatt@demo.com', position: 'Finance Director' }, // Parks and Recreation
    employees: [
      { name: 'Angela Martin', email: 'angela.martin@demo.com', position: 'Senior Accountant' }, // The Office
      { name: 'Oscar Martinez', email: 'oscar.martinez@demo.com', position: 'Financial Analyst' },
      { name: 'Kevin Malone', email: 'kevin.malone@demo.com', position: 'Accounts Payable Clerk' },
      { name: 'Cyril Figgis', email: 'cyril.figgis@demo.com', position: 'Budget Analyst' }, // Archer
      { name: 'Ted Mosby', email: 'ted.mosby@demo.com', position: 'Cost Accountant' }, // HIMYM
      { name: 'Barney Stinson', email: 'barney.stinson@demo.com', position: 'Revenue Manager' }
    ]
  },
  'Maintenance': {
    manager: { name: 'Mike Ehrmantraut', email: 'mike.ehrmantraut@demo.com', position: 'Facilities Manager' }, // Breaking Bad
    employees: [
      { name: 'Janitor Glenn', email: 'janitor.glenn@demo.com', position: 'Head Janitor' }, // Scrubs
      { name: 'Carl Reed', email: 'carl.reed@demo.com', position: 'HVAC Technician' }, // The Simpsons
      { name: 'Scruffy Scruffington', email: 'scruffy.scruffington@demo.com', position: 'Maintenance Technician' }, // Futurama
      { name: 'Charlie Kelly', email: 'charlie.kelly@demo.com', position: 'General Maintenance' }, // Always Sunny
      { name: 'Frank Reynolds', email: 'frank.reynolds@demo.com', position: 'Plumber' },
      { name: 'Argus Filch', email: 'argus.filch@demo.com', position: 'Security Guard' }, // Harry Potter
      { name: 'Willie MacDougal', email: 'willie.macdougal@demo.com', position: 'Groundskeeper' } // The Simpsons
    ]
  }
}

async function seed() {
  console.log('🌱 Starting comprehensive database seed...')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.partialAssessment.deleteMany()
  await prisma.evaluationItemAssignment.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.evaluationItem.deleteMany()
  await prisma.performanceCycle.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  // Create company
  console.log('🏢 Creating company: DEMO S.A.')
  const company = await prisma.company.create({
    data: {
      code: 'DEMO',
      name: 'DEMO S.A.',
      active: true,
      aiEnabled: true, // Enable AI for demo
      aiFeatures: {
        textImprovement: true
      }
    }
  })

  // Create users
  console.log('👥 Creating 40 employees...')
  const users: Record<string, { id: string; name: string; role: string; department?: string | null }> = {}
  const hashedPassword = await hashPassword('a')

  // Create HR Manager (super user with hr role) FIRST
  const hrManager = await prisma.user.create({
    data: {
      email: employeeData.HR.manager.email,
      name: employeeData.HR.manager.name,
      position: employeeData.HR.manager.position,
      passwordHash: hashedPassword,
      role: 'hr', // HR role - can manage all evaluations
      department: 'HR',
      companyId: company.id,
      userType: 'office',
      loginMethod: 'email'
    }
  })
  users['HR_manager'] = hrManager
  console.log(`  ✅ Created HR Director: ${hrManager.name} (super user)`)

  // Create 2025 Performance Cycle (now that we have HR manager)
  console.log('📅 Creating 2025 Performance Cycle...')
  const cycle = await prisma.performanceCycle.create({
    data: {
      name: '2025 Annual Review',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'active',
      companyId: company.id,
      createdBy: hrManager.id // Use HR manager ID instead of 'system'
    }
  })

  // Create other department managers
  for (const [dept, data] of Object.entries(employeeData)) {
    if (dept === 'HR') continue // Already created HR manager
    
    const manager = await prisma.user.create({
      data: {
        email: data.manager.email,
        name: data.manager.name,
        position: data.manager.position,
        passwordHash: hashedPassword,
        role: 'manager',
        department: dept,
        companyId: company.id,
        userType: 'office',
        loginMethod: 'email'
      }
    })
    users[`${dept}_manager`] = manager
    console.log(`  ✅ Created ${dept} Manager: ${manager.name}`)
  }

  // Create regular employees
  for (const [dept, data] of Object.entries(employeeData)) {
    for (const emp of data.employees) {
      const managerId = dept === 'HR' ? hrManager.id : users[`${dept}_manager`].id
      
      const employee = await prisma.user.create({
        data: {
          email: emp.email,
          name: emp.name,
          position: emp.position,
          passwordHash: hashedPassword,
          role: 'employee',
          department: dept,
          managerId,
          companyId: company.id,
          userType: 'office',
          loginMethod: 'email'
        }
      })
      users[emp.email] = employee
    }
  }
  console.log('  ✅ Created all 40 employees')

  // Create Company-wide Evaluation Items (1 competency + 2 OKRs)
  console.log('📊 Creating company-wide evaluation items...')
  
  const companyCompetency = await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Customer Excellence',
      description: 'Consistently deliver exceptional service and create memorable experiences for all guests',
      type: 'competency',
      level: 'company',
      createdBy: hrManager.id,
      active: true,
      sortOrder: 1,
      evaluationDeadline: daysFromNow(30),
      deadlineSetBy: hrManager.id
    }
  })

  const companyOKR1 = await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Increase Guest Satisfaction to 95%',
      description: 'Achieve 95% or higher guest satisfaction rating across all departments by implementing service excellence standards',
      type: 'okr',
      level: 'company',
      createdBy: hrManager.id,
      active: true,
      sortOrder: 2,
      evaluationDeadline: daysFromNow(-5), // Overdue
      deadlineSetBy: hrManager.id
    }
  })

  const companyOKR2 = await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Revenue Growth 20%',
      description: 'Achieve 20% year-over-year revenue growth through operational excellence and efficiency improvements',
      type: 'okr',
      level: 'company',
      createdBy: hrManager.id,
      active: true,
      sortOrder: 3,
      evaluationDeadline: daysFromNow(45),
      deadlineSetBy: hrManager.id
    }
  })

  console.log('  ✅ Created 3 company-wide items')
  
  // Create automatic assignments for company-wide items to ALL employees
  console.log('🔗 Creating company-wide item assignments...')
  const allUsersForAssignment = await prisma.user.findMany({
    where: {
      companyId: company.id,
      role: { in: ['employee', 'manager'] }
    },
    select: { id: true }
  })

  const companyItems = [companyCompetency, companyOKR1, companyOKR2]
  
  for (const item of companyItems) {
    const assignments = allUsersForAssignment.map(user => ({
      evaluationItemId: item.id,
      employeeId: user.id,
      companyId: company.id,
      assignedBy: hrManager.id
    }))

    await prisma.evaluationItemAssignment.createMany({
      data: assignments
    })
  }
  
  console.log(`  ✅ Created assignments for 3 company-wide items × ${allUsersForAssignment.length} employees = ${3 * allUsersForAssignment.length} assignments`)

  // Create HR additional competency
  await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Strategic HR Leadership',
      description: 'Drive organizational success through strategic talent management, culture development, and employee engagement initiatives',
      type: 'competency',
      level: 'department',
      assignedTo: 'HR',
      createdBy: hrManager.id,
      active: true,
      sortOrder: 4,
      evaluationDeadline: daysFromNow(20),
      deadlineSetBy: hrManager.id
    }
  })
  console.log('  ✅ Created HR department competency')
  
  // Create assignments for HR competency
  const hrUsers = await prisma.user.findMany({
    where: { companyId: company.id, department: 'HR', role: { in: ['employee', 'manager'] } },
    select: { id: true }
  })
  
  const hrCompetency = await prisma.evaluationItem.findFirst({
    where: { title: 'Strategic HR Leadership', companyId: company.id }
  })
  
  if (hrCompetency) {
    const hrAssignments = hrUsers.map(user => ({
      evaluationItemId: hrCompetency.id,
      employeeId: user.id,
      companyId: company.id,
      assignedBy: hrManager.id
    }))
    
    await prisma.evaluationItemAssignment.createMany({
      data: hrAssignments
    })
    console.log(`  ✅ Created HR competency assignments: ${hrAssignments.length}`)
  }

  // Create Finance department OKRs
  const financeOKR1 = await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Reduce Operating Costs by 15%',
      description: 'Implement cost control measures and efficiency improvements to reduce operating expenses by 15%',
      type: 'okr',
      level: 'department',
      assignedTo: 'Finance',
      createdBy: users['Finance_manager'].id,
      active: true,
      sortOrder: 5,
      evaluationDeadline: daysFromNow(-10), // Overdue
      deadlineSetBy: users['Finance_manager'].id
    }
  })

  const financeOKR2 = await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Implement Real-time Financial Reporting',
      description: 'Deploy automated financial reporting system for real-time insights and decision making',
      type: 'okr',
      level: 'department',
      assignedTo: 'Finance',
      createdBy: users['Finance_manager'].id,
      active: true,
      sortOrder: 6,
      evaluationDeadline: daysFromNow(60),
      deadlineSetBy: users['Finance_manager'].id
    }
  })
  console.log('  ✅ Created Finance department OKRs')
  
  // Create assignments for Finance department OKRs
  const financeUsers = await prisma.user.findMany({
    where: { companyId: company.id, department: 'Finance', role: { in: ['employee', 'manager'] } },
    select: { id: true }
  })
  
  const financeItems = [financeOKR1, financeOKR2]
  for (const item of financeItems) {
    const financeAssignments = financeUsers.map(user => ({
      evaluationItemId: item.id,
      employeeId: user.id,
      companyId: company.id,
      assignedBy: users['Finance_manager'].id
    }))
    
    await prisma.evaluationItemAssignment.createMany({
      data: financeAssignments
    })
  }
  console.log(`  ✅ Created Finance OKR assignments: ${financeItems.length} × ${financeUsers.length} = ${financeItems.length * financeUsers.length}`)

  // Create Maintenance department OKRs
  const maintenanceOKR1 = await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Zero Critical Equipment Downtime',
      description: 'Achieve zero unplanned critical equipment downtime through preventive maintenance program',
      type: 'okr',
      level: 'department',
      assignedTo: 'Maintenance',
      createdBy: users['Maintenance_manager'].id,
      active: true,
      sortOrder: 7,
      evaluationDeadline: daysFromNow(-3), // Overdue
      deadlineSetBy: users['Maintenance_manager'].id
    }
  })

  const maintenanceOKR2 = await prisma.evaluationItem.create({
    data: {
      companyId: company.id,
      cycleId: cycle.id,
      title: 'Energy Efficiency Improvement 25%',
      description: 'Reduce energy consumption by 25% through equipment upgrades and optimization',
      type: 'okr',
      level: 'department',
      assignedTo: 'Maintenance',
      createdBy: users['Maintenance_manager'].id,
      active: true,
      sortOrder: 8,
      evaluationDeadline: daysFromNow(15),
      deadlineSetBy: users['Maintenance_manager'].id
    }
  })
  console.log('  ✅ Created Maintenance department OKRs')
  
  // Create assignments for Maintenance department OKRs
  const maintenanceUsers = await prisma.user.findMany({
    where: { companyId: company.id, department: 'Maintenance', role: { in: ['employee', 'manager'] } },
    select: { id: true }
  })
  
  const maintenanceItems = [maintenanceOKR1, maintenanceOKR2]
  for (const item of maintenanceItems) {
    const maintenanceAssignments = maintenanceUsers.map(user => ({
      evaluationItemId: item.id,
      employeeId: user.id,
      companyId: company.id,
      assignedBy: users['Maintenance_manager'].id
    }))
    
    await prisma.evaluationItemAssignment.createMany({
      data: maintenanceAssignments
    })
  }
  console.log(`  ✅ Created Maintenance OKR assignments: ${maintenanceItems.length} × ${maintenanceUsers.length} = ${maintenanceItems.length * maintenanceUsers.length}`)

  // Create individual F&B OKRs (unique for each F&B employee)
  console.log('🍽️  Creating individual F&B OKRs...')
  const fbEmployees = [
    users['Food & Beverage_manager'],
    ...employeeData['Food & Beverage'].employees.map(e => users[e.email])
  ]

  const fbIndividualOKRs = [
    { title: 'Master Wine Pairing Program', desc: 'Complete sommelier certification and implement wine pairing menu' },
    { title: 'Reduce Food Waste 30%', desc: 'Implement portion control and waste tracking system' },
    { title: 'Launch Vegan Menu Line', desc: 'Develop and launch complete vegan menu options' },
    { title: 'Improve Kitchen Efficiency 20%', desc: 'Optimize kitchen workflow and reduce ticket times' },
    { title: 'Social Media Food Photography', desc: 'Create Instagram-worthy presentations for social media marketing' },
    { title: 'Local Sourcing Initiative', desc: 'Establish partnerships with 10 local farms and suppliers' },
    { title: 'Breakfast Service Excellence', desc: 'Achieve 5-star ratings for breakfast service consistently' },
    { title: 'Cocktail Innovation Program', desc: 'Create 20 signature cocktails for the bar menu' },
    { title: 'Staff Training Excellence', desc: 'Train and certify 100% of staff in service standards' },
    { title: 'Special Events Catering', desc: 'Successfully execute 50 special events with zero complaints' },
    { title: 'Health & Safety Compliance', desc: 'Achieve 100% compliance score on all health inspections' },
    { title: 'Customer Allergy Management', desc: 'Implement comprehensive allergy tracking and safety system' }
  ]

  // Create all F&B department items
  const createdFBItems = []
  for (let i = 0; i < fbIndividualOKRs.length; i++) {
    const okr = fbIndividualOKRs[i]
    
    // Create the department-level OKR
    const fbOKR = await prisma.evaluationItem.create({
      data: {
        companyId: company.id,
        cycleId: cycle.id,
        title: okr.title,
        description: okr.desc,
        type: 'okr',
        level: 'department',
        assignedTo: 'Food & Beverage',
        createdBy: users['Food & Beverage_manager'].id,
        active: true,
        sortOrder: 20 + i,
        evaluationDeadline: daysFromNow(Math.floor(Math.random() * 60) - 15), // Random: -15 to +45 days
        deadlineSetBy: users['Food & Beverage_manager'].id
      }
    })
    createdFBItems.push(fbOKR)
  }

  // Create assignments for ALL F&B employees to ALL F&B department items
  for (const item of createdFBItems) {
    const fbAssignments = fbEmployees.map(employee => ({
      evaluationItemId: item.id,
      employeeId: employee.id,
      companyId: company.id,
      assignedBy: users['Food & Beverage_manager'].id
    }))
    
    await prisma.evaluationItemAssignment.createMany({
      data: fbAssignments
    })
  }
  console.log(`  ✅ Created F&B department OKRs: ${createdFBItems.length} × ${fbEmployees.length} = ${createdFBItems.length * fbEmployees.length} assignments`)

  // Create evaluations (except for HR employees)
  console.log('📝 Creating evaluations with varied statuses and ratings...')
  
  const allEmployees = await prisma.user.findMany({
    where: {
      companyId: company.id,
      role: 'employee'
    }
  })

  const nonHREmployees = allEmployees.filter(e => e.department !== 'HR')
  
  // Helper to generate evaluation data
  const generateEvaluationData = (rating: 'poor' | 'normal' | 'good' | 'excellent', isComplete: boolean, isHR: boolean = false) => {
    // HR employees should have empty comments
    if (isHR) {
      return {
        rating: isComplete ? 3 : (Math.random() > 0.5 ? 3 : null),
        comment: ''
      }
    }

    const ratingMap = {
      'poor': { 
        rating: 1, 
        comments: [
          'Necesita mejora significativa en múltiples áreas de desempeño. Durante este período de evaluación ha mostrado dificultades para cumplir con los objetivos establecidos y requiere apoyo adicional para desarrollar las competencias necesarias.',
          'El rendimiento está por debajo de las expectativas establecidas. Se han observado inconsistencias en la calidad del trabajo y es necesario implementar un plan de desarrollo profesional inmediato.',
          'Requiere entrenamiento adicional y supervisión más estrecha. Las metas no se han alcanzado de manera consistente y se necesita mejorar significativamente la comunicación y organización.'
        ]
      },
      'normal': { 
        rating: 3, 
        comments: [
          'Cumple con las expectativas del puesto de manera satisfactoria. Ha demostrado competencia en las tareas asignadas y mantiene un nivel de rendimiento estable y consistente durante todo el período evaluado.',
          'Desempeño satisfactorio que cumple con los estándares requeridos. Muestra capacidad para completar las responsabilidades asignadas dentro de los plazos establecidos y colabora efectivamente.',
          'Resultados adecuados que reflejan un empleado comprometido. Ha logrado los objetivos principales y mantiene una actitud profesional en el desarrollo de todas sus funciones asignadas.'
        ]
      },
      'good': { 
        rating: 4, 
        comments: [
          'Supera las expectativas establecidas y demuestra un rendimiento sólido y consistente. Ha mostrado iniciativa propia y contribuye positivamente al ambiente laboral y productividad del equipo.',
          'Rendimiento fuerte que excede los requisitos mínimos del puesto. Demuestra habilidades técnicas avanzadas y capacidad para resolver problemas de manera independiente y muy eficaz.',
          'Trabajo de calidad consistente que destaca por su atención al detalle. Muestra liderazgo natural y capacidad para mentorizar a otros miembros del equipo cuando la situación lo requiere.'
        ]
      },
      'excellent': { 
        rating: 5, 
        comments: [
          'Rendimiento excepcional que establece el estándar para otros empleados. Ha superado todas las metas establecidas y contribuye significativamente al éxito del departamento y la organización entera.',
          'Resultados extraordinarios que demuestran un compromiso excepcional con la excelencia. Es un modelo a seguir para otros empleados y aporta innovaciones valiosas que benefician al equipo completo.',
          'Modelo ejemplar para otros miembros del equipo por su dedicación y profesionalismo excepcional. Su rendimiento ha tenido un impacto positivo medible en los resultados organizacionales generales.'
        ]
      }
    }

    const data = ratingMap[rating]
    const commentVariation = Math.floor(Math.random() * data.comments.length)
    
    // FIXED: Ensure completed evaluations always have complete data
    if (isComplete) {
      return {
        rating: data.rating,
        comment: data.comments[commentVariation]
      }
    } else {
      // For drafts, randomly assign some data or leave empty
      return {
        rating: Math.random() > 0.5 ? data.rating : null,
        comment: Math.random() > 0.5 ? data.comments[commentVariation] : ''
      }
    }
  }

  // Create evaluations
  let evaluationCount = 0
  for (const employee of nonHREmployees) {
    evaluationCount++
    
    // Determine evaluation type - realistic status distribution
    let wasCompleted = false
    let status: 'draft' | 'submitted' | 'completed'
    
    if (evaluationCount % 4 === 0) {
      // ~25% completed evaluations
      status = 'completed'
      wasCompleted = true
    } else if (evaluationCount % 7 === 0) {
      // ~14% submitted evaluations (waiting for employee approval)
      // Note: Submitted evaluations must have complete data per business rules
      status = 'submitted'
      wasCompleted = true // Submitted means manager completed it, waiting for employee approval
    } else {
      // ~61% draft evaluations (work in progress)
      status = 'draft'
      wasCompleted = false
    }
    
    // Determine rating quality
    let ratingQuality: 'poor' | 'normal' | 'good' | 'excellent'
    if (evaluationCount % 7 === 0) ratingQuality = 'poor'
    else if (evaluationCount % 5 === 0) ratingQuality = 'excellent'
    else if (evaluationCount % 2 === 0) ratingQuality = 'good'
    else ratingQuality = 'normal'

    // Get items for this employee
    const employeeItems = []
    
    // Add company-wide items
    employeeItems.push(
      { id: companyCompetency.id, title: companyCompetency.title, description: companyCompetency.description, type: 'competency' },
      { id: companyOKR1.id, title: companyOKR1.title, description: companyOKR1.description, type: 'okr' },
      { id: companyOKR2.id, title: companyOKR2.title, description: companyOKR2.description, type: 'okr' }
    )

    // Add department-specific items
    if (employee.department === 'Finance') {
      employeeItems.push(
        { id: financeOKR1.id, title: financeOKR1.title, description: financeOKR1.description, type: 'okr' },
        { id: financeOKR2.id, title: financeOKR2.title, description: financeOKR2.description, type: 'okr' }
      )
    } else if (employee.department === 'Maintenance') {
      employeeItems.push(
        { id: maintenanceOKR1.id, title: maintenanceOKR1.title, description: maintenanceOKR1.description, type: 'okr' },
        { id: maintenanceOKR2.id, title: maintenanceOKR2.title, description: maintenanceOKR2.description, type: 'okr' }
      )
    }

    // Check for F&B individual assignments
    if (employee.department === 'Food & Beverage') {
      const individualAssignment = await prisma.evaluationItemAssignment.findFirst({
        where: {
          employeeId: employee.id,
          companyId: company.id
        },
        include: {
          evaluationItem: true
        }
      })
      
      if (individualAssignment) {
        employeeItems.push({
          id: individualAssignment.evaluationItem.id,
          title: individualAssignment.evaluationItem.title,
          description: individualAssignment.evaluationItem.description,
          type: 'okr'
        })
      }
    }

    // Build evaluation items data
    const evaluationItemsData = employeeItems.map(item => {
      // Use wasCompleted to ensure data integrity for reopened evaluations
      const evalData = generateEvaluationData(ratingQuality, wasCompleted, employee.department === 'HR')
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        rating: evalData.rating,
        comment: evalData.comment
      }
    })

    // Create the evaluation with new robust tracking fields
    // Use wasCompleted to ensure data integrity for reopened evaluations
    const overallData = generateEvaluationData(ratingQuality, wasCompleted, employee.department === 'HR')
    
    // Determine completion count and reopened status for completed evaluations
    let completionCount = 0
    let isReopened = false
    let previousStatus = null
    let reopenedAt = null
    let reopenedBy = null
    let reopenedReason = null
    
    if (status === 'completed' || status === 'submitted') {
      if (status === 'completed') {
        completionCount = 1
      }
      
      // 20% chance of being a reopened evaluation (to test the feature), or guarantee at least one
      if (Math.random() < 0.2 || (evaluationCount === 4)) { // Ensure we have at least one for testing
        isReopened = true
        // The previousStatus should be what it was before reopening
        previousStatus = status // Store the original status (completed or submitted)
        reopenedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
        reopenedBy = hrManager.id
        // Use realistic reopening reasons based on actual system usage
        const reopenReasons = [
          'New company-wide item added',
          'New department OKR/Competency added for ' + employee.department,
          'Company-wide item reactivated',
          'Department item reactivated',
          'HR review required',
          'Performance data update needed'
        ]
        reopenedReason = reopenReasons[evaluationCount % reopenReasons.length]
        
        // Reopened evaluations are back to draft status
        status = 'draft'
        
        // Set wasCompleted for data generation purposes
        wasCompleted = (previousStatus === 'completed')
        
        // Keep completion count if it was completed before
        if (previousStatus === 'completed') {
          completionCount = 1
        }
      }
    }
    
    await prisma.evaluation.create({
      data: {
        employeeId: employee.id,
        managerId: employee.managerId!,
        companyId: company.id,
        cycleId: cycle.id,
        periodType: 'yearly',
        periodDate: new Date().getFullYear().toString(),
        evaluationItemsData: JSON.stringify(evaluationItemsData),
        overallRating: overallData.rating,
        managerComments: overallData.comment || undefined,
        status,
        // New robust tracking fields
        isReopened,
        previousStatus,
        reopenedAt,
        reopenedBy,
        reopenedReason,
        completionCount
      }
    })
  }
  
  console.log(`  ✅ Created ${evaluationCount} evaluations (mixed statuses and ratings)`)
  console.log('     - Completed evaluations: ~25%')
  console.log('     - Submitted evaluations: ~14%')
  console.log('     - Draft evaluations: ~61%')
  console.log('     - Reopened evaluations: ~20% of completed/submitted (for testing)')
  console.log('     - No evaluations for HR department')

  // Summary
  console.log('\n✨ Database seeding completed!')
  console.log('\n📊 Summary:')
  console.log('  - Company: DEMO S.A.')
  console.log('  - Total Employees: 40')
  console.log('  - Departments: HR (3), Rooms (10), F&B (12), Finance (7), Maintenance (8)')
  console.log('  - HR Super User: miranda.priestly@demo.com')
  console.log('  - Performance Cycle: 2025 Annual Review (Active)')
  console.log('  - Company-wide items: 3 (1 competency + 2 OKRs)')
  console.log('  - Department items: HR (1), Finance (2), Maintenance (2)')
  console.log('  - Individual F&B OKRs: 12')
  console.log('  - Evaluations created: 37 (HR excluded)')
  console.log('\n🔑 Login Credentials:')
  console.log('  - Password for ALL users: a')
  console.log('  - HR Admin: miranda.priestly@demo.com')
  console.log('  - Sample Manager: gordon.ramsay@demo.com (F&B)')
  console.log('  - Sample Employee: monica.geller@demo.com')
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })