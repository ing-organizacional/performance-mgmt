#!/usr/bin/env npx tsx
/**
 * Migration script to update existing audit logs to new schema
 * Run with: npx tsx scripts/migrate-audit-logs.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateAuditLogs() {
  console.log('🔄 Starting audit log migration...')
  
  try {
    // First, get all existing audit logs with their related data
    const oldAuditLogs = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.evaluationId,
        a.userId,
        a.action,
        a.oldData,
        a.newData,
        a.timestamp,
        u.role as userRole,
        u.companyId,
        e.employeeId as targetUserId
      FROM AuditLog a
      JOIN User u ON a.userId = u.id
      JOIN Evaluation e ON a.evaluationId = e.id
    ` as any[]
    
    console.log(`📊 Found ${oldAuditLogs.length} audit logs to migrate`)
    
    if (oldAuditLogs.length === 0) {
      console.log('✅ No audit logs to migrate')
      return
    }
    
    // Create a backup of the current audit logs
    console.log('💾 Creating backup of existing audit logs...')
    const backupData = JSON.stringify(oldAuditLogs, null, 2)
    const fs = await import('fs')
    const path = await import('path')
    const backupPath = path.join(process.cwd(), `audit-logs-backup-${Date.now()}.json`)
    await fs.promises.writeFile(backupPath, backupData)
    console.log(`📁 Backup saved to: ${backupPath}`)
    
    // Drop the old AuditLog table and recreate with new schema
    console.log('🔨 Dropping old AuditLog table...')
    await prisma.$executeRaw`DROP TABLE IF EXISTS AuditLog`
    
    // Create new AuditLog table with enhanced schema
    console.log('🏗️ Creating new AuditLog table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        "userRole" TEXT NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "sessionId" TEXT,
        "action" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT,
        "targetUserId" TEXT,
        "oldData" TEXT,
        "newData" TEXT,
        "metadata" TEXT,
        "reason" TEXT,
        "companyId" TEXT NOT NULL,
        CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `
    
    // Create indexes
    console.log('📇 Creating indexes...')
    await prisma.$executeRaw`CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp")`
    await prisma.$executeRaw`CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId")`
    await prisma.$executeRaw`CREATE INDEX "AuditLog_companyId_timestamp_idx" ON "AuditLog"("companyId", "timestamp")`
    await prisma.$executeRaw`CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp")`
    await prisma.$executeRaw`CREATE INDEX "AuditLog_targetUserId_idx" ON "AuditLog"("targetUserId")`
    
    // Migrate old data to new schema
    console.log('📥 Migrating data to new schema...')
    for (const log of oldAuditLogs) {
      await prisma.$executeRaw`
        INSERT INTO AuditLog (
          id, timestamp, userId, userRole, action, 
          entityType, entityId, targetUserId, 
          oldData, newData, companyId
        ) VALUES (
          ${log.id},
          ${new Date(log.timestamp)},
          ${log.userId},
          ${log.userRole},
          ${log.action},
          'evaluation',
          ${log.evaluationId},
          ${log.targetUserId},
          ${log.oldData},
          ${log.newData},
          ${log.companyId}
        )
      `
    }
    
    console.log('✅ Migration completed successfully!')
    console.log(`📊 Migrated ${oldAuditLogs.length} audit logs`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateAuditLogs().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})