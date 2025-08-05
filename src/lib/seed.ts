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
        department: 'Operations',
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
        department: 'Manufacturing',
        shift: i <= 2 ? 'Day' : 'Night',
        active: true
      }
    })
  }

  // Create default evaluation items (mix of OKRs and Competencies)
  const defaultItems = [
    // Company OKRs (set by HR)
    { type: 'okr', title: 'Increase Sales by 20%', description: 'Drive revenue growth through new client acquisition', sortOrder: 1 },
    { type: 'okr', title: 'Launch New Product Line', description: 'Successfully launch and market new product offering', sortOrder: 2 },
    
    // Company Competencies (set by HR)  
    { type: 'competency', title: 'Communication', description: 'Clear and effective verbal and written communication', sortOrder: 3 },
    { type: 'competency', title: 'Leadership', description: 'Ability to guide and motivate team members', sortOrder: 4 },
    { type: 'competency', title: 'Problem Solving', description: 'Analytical thinking and creative solutions', sortOrder: 5 }
  ]

  for (const itemData of defaultItems) {
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
        level: 'company',
        createdBy: hrAdmin.id,
        assignedTo: null,
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