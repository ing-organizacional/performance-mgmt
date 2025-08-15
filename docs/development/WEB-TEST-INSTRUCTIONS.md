# 🧪 Web Testing Instructions for Audit System

## Prerequisites
1. Development server is running: `yarn dev`
2. Database has seed data: `yarn db:seed`

## Test Plan

### 1. Access Audit Dashboard
1. Open http://localhost:3000
2. Login with HR credentials: `hr@demo.com` / `password123`
3. Go to Dashboard (you should be redirected automatically)
4. Scroll down to "Administrative Actions" section
5. Click on "Audit Logs" button

**Expected Result:** You should see the Audit Log Dashboard with:
- Header with "Audit Log Dashboard" title
- Filter controls (Action, Entity Type, Date Range)
- Stats showing "Showing X of Y audit logs"
- Pagination controls
- Table with columns: Timestamp, User, Action, Entity, Details

### 2. Test Filtering
1. Try the **Action filter**: Select "submit" - should show only submission audits
2. Try the **Entity Type filter**: Select "evaluation" - should show only evaluation-related audits
3. Try **Date Range**: Set a date range and verify filtering works
4. Click **"Clear Filters"** to reset

### 3. Test Audit Log Details
1. Click **"Show Details"** on any audit log row
2. Modal should open with full audit log details including:
   - ID, Timestamp, User info
   - IP Address (if available)
   - Old Data and New Data (formatted JSON)
   - Metadata (if available)
3. Close modal and try a few more entries

### 4. Test Pagination
1. If you have more than 50 audit logs, test pagination
2. Click "Next" and "Previous" buttons
3. Verify page numbers update correctly

### 5. Generate New Audit Logs
1. Go back to main Dashboard
2. Click "Employee Evaluations" 
3. View some evaluations (creates VIEW audit logs)
4. Submit an evaluation (creates SUBMIT audit logs)
5. Go to "My Evaluations" and approve one (creates APPROVE audit logs)
6. Return to Audit Dashboard and verify new logs appear

### 6. Test Different User Roles
1. Logout and login as Manager: `manager@demo.com` / `password123`
2. Try to access `/dashboard/audit` directly
3. Should be redirected to main dashboard (only HR can view audit logs)

## Expected Audit Log Types
- **LOGIN**: User authentication events
- **SUBMIT**: Evaluation submissions
- **APPROVE**: Evaluation approvals
- **UNLOCK**: HR unlocking evaluations
- **CREATE**: New evaluation creation
- **UPDATE**: Evaluation modifications
- **VIEW**: Evaluation views (when implemented)
- **EXPORT**: Data exports (when used)

## Troubleshooting
- If no audit logs appear, run `npx tsx scripts/test-audit-system.ts` to generate test data
- If dashboard shows errors, check browser console for details
- Verify user role is 'hr' - only HR users can access audit logs

## Success Criteria ✅
- [ ] Audit dashboard loads without errors
- [ ] Filters work correctly
- [ ] Pagination functions properly
- [ ] Audit log details modal displays complete information
- [ ] New actions create corresponding audit logs
- [ ] Non-HR users cannot access audit dashboard
- [ ] All existing audit logs from migration are visible
- [ ] JSON data is properly formatted and readable