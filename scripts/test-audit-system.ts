#!/usr/bin/env npx tsx
/**
 * Test script for comprehensive audit system
 * Run with: npx tsx scripts/test-audit-system.ts
 */

import { PrismaClient } from '@prisma/client'
import { 
  createAuditLog, 
  queryAuditLogs, 
  getEntityAuditTrail,
  getUserActivityLog,
  generateAuditReport 
} from '../src/lib/services/audit-service'

const prisma = new PrismaClient()

async function testAuditSystem() {
  console.log('🧪 Testing Comprehensive Audit System\n')
  
  try {
    // 1. Get test data
    console.log('1️⃣ Getting test data...')
    const testCompany = await prisma.company.findFirst()
    const testUser = await prisma.user.findFirst({ where: { role: 'hr' } })
    const testEvaluation = await prisma.evaluation.findFirst()
    
    if (!testCompany || !testUser) {
      console.error('❌ No test data found. Please run yarn db:seed first')
      return
    }
    
    console.log(`   ✓ Company: ${testCompany.name}`)
    console.log(`   ✓ User: ${testUser.name} (${testUser.role})`)
    
    // 2. Create test audit logs
    console.log('\n2️⃣ Creating test audit logs...')
    
    // Test login audit
    await createAuditLog({
      userId: testUser.id,
      userRole: testUser.role,
      companyId: testCompany.id,
      action: 'login' as any,
      entityType: 'user' as any,
      entityId: testUser.id,
      metadata: { loginMethod: 'email', timestamp: new Date() }
    })
    console.log('   ✓ Created login audit')
    
    // Test evaluation view audit
    if (testEvaluation) {
      await createAuditLog({
        userId: testUser.id,
        userRole: testUser.role,
        companyId: testCompany.id,
        action: 'view' as any,
        entityType: 'evaluation' as any,
        entityId: testEvaluation.id,
        targetUserId: testEvaluation.employeeId
      })
      console.log('   ✓ Created evaluation view audit')
    }
    
    // Test export audit
    await createAuditLog({
      userId: testUser.id,
      userRole: testUser.role,
      companyId: testCompany.id,
      action: 'export' as any,
      entityType: 'report' as any,
      metadata: {
        exportType: 'pdf',
        filters: { department: 'Engineering' },
        recordCount: 25
      }
    })
    console.log('   ✓ Created export audit')
    
    // 3. Query audit logs
    console.log('\n3️⃣ Querying audit logs...')
    const { logs, total } = await queryAuditLogs(testCompany.id, {}, { page: 1, limit: 10 })
    console.log(`   ✓ Found ${total} total audit logs`)
    console.log(`   ✓ Retrieved ${logs.length} logs in current page`)
    
    // 4. Test filtered queries
    console.log('\n4️⃣ Testing filtered queries...')
    
    // Filter by action
    const loginLogs = await queryAuditLogs(testCompany.id, { action: 'login' as any })
    console.log(`   ✓ Login actions: ${loginLogs.total}`)
    
    // Filter by entity type
    const evaluationLogs = await queryAuditLogs(testCompany.id, { entityType: 'evaluation' as any })
    console.log(`   ✓ Evaluation logs: ${evaluationLogs.total}`)
    
    // 5. Test entity audit trail
    if (testEvaluation) {
      console.log('\n5️⃣ Testing entity audit trail...')
      const trail = await getEntityAuditTrail(testCompany.id, 'evaluation', testEvaluation.id)
      console.log(`   ✓ Audit trail for evaluation ${testEvaluation.id}: ${trail.length} entries`)
    }
    
    // 6. Test user activity log
    console.log('\n6️⃣ Testing user activity log...')
    const activityLog = await getUserActivityLog(testCompany.id, testUser.id, 30)
    console.log(`   ✓ User activity for ${testUser.name} (last 30 days): ${activityLog.length} entries`)
    
    // 7. Generate audit report
    console.log('\n7️⃣ Generating audit report...')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const endDate = new Date()
    
    const report = await generateAuditReport(testCompany.id, startDate, endDate)
    console.log(`   ✓ Report generated for ${report.period.start.toLocaleDateString()} to ${report.period.end.toLocaleDateString()}`)
    console.log(`   ✓ Actions summary: ${report.summary.length} different action types`)
    console.log(`   ✓ Top users: ${report.topUsers.length} users`)
    
    // 8. Display sample audit logs
    console.log('\n8️⃣ Sample audit logs:')
    logs.slice(0, 3).forEach(log => {
      console.log(`\n   📝 ${log.action.toUpperCase()} - ${log.entityType}`)
      console.log(`      User: ${log.user.name} (${log.user.role})`)
      console.log(`      Time: ${new Date(log.timestamp).toLocaleString()}`)
      if (log.metadata) {
        console.log(`      Metadata: ${JSON.stringify(log.metadata)}`)
      }
    })
    
    console.log('\n✅ Audit system test completed successfully!')
    
    // 9. Test web access
    console.log('\n9️⃣ Web Access Instructions:')
    console.log('   1. Open http://localhost:3000')
    console.log('   2. Login as HR: hr@demo.com / password123')
    console.log('   3. Go to Dashboard')
    console.log('   4. Click on "Audit Logs" in Administrative Actions')
    console.log('   5. You should see the audit dashboard with:')
    console.log('      - Filter options (Action, Entity Type, Date Range)')
    console.log('      - Paginated audit log table')
    console.log('      - Click "Show Details" to see full audit log details')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run test
testAuditSystem().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})