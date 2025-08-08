#!/usr/bin/env npx tsx
/**
 * Test evaluation audit logging
 * Run with: npx tsx scripts/test-evaluation-audit.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testEvaluationAudit() {
  console.log('🧪 Testing Evaluation Audit Logging\n')
  
  try {
    // Get the count before
    const beforeCount = await prisma.auditLog.count()
    console.log(`📊 Audit logs before: ${beforeCount}`)
    
    // Simulate an evaluation submission by directly using the audit service
    const { auditEvaluation } = await import('../src/lib/services/audit-service')
    
    const testUser = await prisma.user.findFirst({ where: { role: 'manager' } })
    const testEmployee = await prisma.user.findFirst({ where: { role: 'employee' } })
    const testCompany = await prisma.company.findFirst()
    
    if (!testUser || !testEmployee || !testCompany) {
      console.error('❌ Missing test data')
      return
    }
    
    // Create test evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        employeeId: testEmployee.id,
        managerId: testUser.id,
        companyId: testCompany.id,
        periodType: 'quarterly',
        periodDate: '2025-Q1',
        status: 'draft',
        evaluationItemsData: JSON.stringify([
          { id: '1', rating: 4, comment: 'Good performance' }
        ])
      }
    })
    
    console.log(`✅ Created test evaluation: ${evaluation.id}`)
    
    // Test audit logging for submission
    await auditEvaluation(
      testUser.id,
      testUser.role,
      testCompany.id,
      'submit',
      evaluation.id,
      testEmployee.id,
      { status: 'draft' },
      { status: 'submitted' }
    )
    
    console.log('✅ Created submission audit log')
    
    // Test audit logging for approval
    await auditEvaluation(
      testEmployee.id,
      testEmployee.role,
      testCompany.id,
      'approve',
      evaluation.id,
      testEmployee.id,
      { status: 'submitted' },
      { status: 'completed' }
    )
    
    console.log('✅ Created approval audit log')
    
    // Check the count after
    const afterCount = await prisma.auditLog.count()
    console.log(`📊 Audit logs after: ${afterCount}`)
    console.log(`📈 New audit logs created: ${afterCount - beforeCount}`)
    
    // Show recent audit logs for this evaluation
    const evaluationAudits = await prisma.auditLog.findMany({
      where: {
        entityType: 'evaluation',
        entityId: evaluation.id
      },
      include: {
        user: {
          select: { name: true, role: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    })
    
    console.log(`\n📋 Audit logs for evaluation ${evaluation.id}:`)
    evaluationAudits.forEach(audit => {
      console.log(`   • ${audit.action.toUpperCase()} by ${audit.user.name} (${audit.user.role})`)
      console.log(`     Time: ${new Date(audit.timestamp).toLocaleString()}`)
      if (audit.oldData) {
        console.log(`     From: ${JSON.stringify(audit.oldData)}`)
      }
      if (audit.newData) {
        console.log(`     To: ${JSON.stringify(audit.newData)}`)
      }
      console.log()
    })
    
    // Clean up test data
    await prisma.evaluation.delete({ where: { id: evaluation.id } })
    console.log('🧹 Cleaned up test evaluation')
    
    console.log('✅ Evaluation audit logging test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEvaluationAudit().catch(console.error)