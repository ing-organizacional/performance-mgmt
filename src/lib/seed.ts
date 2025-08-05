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
      active: true
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
      passwordHash: await bcrypt.hash('password123', 12),
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
      passwordHash: await bcrypt.hash('password123', 12),
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
        passwordHash: await bcrypt.hash('password123', 12),
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
    
    // 1 Individual OKR (set by Manager - editable)
    { 
      type: 'okr', 
      level: 'manager',
      title: 'Personal Skill Development', 
      description: 'Complete assigned training and demonstrate new skills in daily work',
      createdBy: manager.id,
      assignedTo: manager.id, // Manager ID
      sortOrder: 7 
    },
    
    // 1 Individual Competency (set by Manager - editable)
    { 
      type: 'competency', 
      level: 'manager',
      title: 'Problem Solving', 
      description: 'Identify issues proactively and develop creative solutions independently',
      createdBy: manager.id,
      assignedTo: manager.id, // Manager ID
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

  console.log('✅ Database seeded successfully!')
  console.log('📧 HR Login: hr@demo.com / password123')
  console.log('👨‍💼 Manager Login: manager@demo.com / password123')
  console.log('👨‍💻 Employee Login: employee1@demo.com / password123')  
  console.log('🔧 Worker Login: worker1 / 1234')
  console.log('🎯 5 Default evaluation items created (2 OKRs + 3 Competencies)')
}