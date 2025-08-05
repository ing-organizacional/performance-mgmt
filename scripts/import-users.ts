import { prisma } from '../src/lib/prisma-client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

interface CSVUser {
  name: string
  email?: string
  username?: string
  role: 'employee' | 'manager' | 'hr'
  department?: string
  userType: 'office' | 'operational'
  password: string
  managerEmail?: string
  companyCode: string
  employeeId?: string
}

// Simple CSV parser function
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const result: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    result.push(row)
  }
  
  return result
}

export async function importUsersFromCSV(csvPath: string) {
  try {
    console.log(`📁 Reading CSV file: ${csvPath}`)
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`)
      return
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const users = parseCSV(csvContent)
    
    console.log(`📊 Found ${users.length} users to import`)
    
    let successCount = 0
    let failCount = 0
    
    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.name || !userData.role) {
          console.log(`⚠️  Skipping row - missing name or role: ${JSON.stringify(userData)}`)
          failCount++
          continue
        }

        if (!userData.email && !userData.username) {
          console.log(`⚠️  Skipping ${userData.name} - missing email or username`)
          failCount++
          continue
        }
        
        // Find company
        const company = await prisma.company.findFirst({
          where: { code: userData.companyCode }
        })
        
        if (!company) {
          console.log(`⚠️  Company ${userData.companyCode} not found, skipping user ${userData.name}`)
          failCount++
          continue
        }
        
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { companyId: company.id },
              {
                OR: [
                  userData.email ? { email: userData.email } : {},
                  userData.username ? { username: userData.username } : {}
                ]
              }
            ]
          }
        })

        if (existingUser) {
          console.log(`⚠️  User already exists: ${userData.email || userData.username}`)
          failCount++
          continue
        }
        
        // Find manager if specified
        let managerId = null
        if (userData.managerEmail) {
          const manager = await prisma.user.findFirst({
            where: { 
              email: userData.managerEmail,
              companyId: company.id 
            }
          })
          if (manager) {
            managerId = manager.id
          } else {
            console.log(`⚠️  Manager not found: ${userData.managerEmail} for user ${userData.name}`)
          }
        }
        
        // Create user
        const newUser = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email || null,
            username: userData.username || null,
            role: userData.role,
            companyId: company.id,
            managerId,
            department: userData.department || null,
            employeeId: userData.employeeId || null,
            userType: userData.userType || 'office',
            passwordHash: await bcrypt.hash(userData.password || 'changeme123', 12),
            pinCode: (userData.userType === 'operational') ? (userData.password || '1234') : null,
            requiresPinOnly: userData.userType === 'operational',
            loginMethod: userData.email ? 'email' : 'username',
            active: true
          }
        })
        
        console.log(`✅ Created user: ${userData.name} (${userData.email || userData.username})`)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.name}:`, error)
        failCount++
      }
    }
    
    console.log(`\n📈 Import Summary:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)
    console.log(`   📊 Total: ${successCount + failCount}`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// CLI execution
if (require.main === module) {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.log('Usage: yarn tsx scripts/import-users.ts <path-to-csv-file>')
    console.log('\nExample CSV format:')
    console.log('name,email,username,role,department,userType,password,managerEmail,companyCode,employeeId')
    console.log('John Smith,john.smith@company.com,,employee,Sales,office,password123,manager@company.com,DEMO_001,EMP001')
    console.log('Maria Garcia,,maria.worker,employee,Manufacturing,operational,1234,supervisor@company.com,DEMO_001,EMP002')
    process.exit(1)
  }
  
  importUsersFromCSV(csvPath)
}