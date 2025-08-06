# User Management Guide

This guide covers all three methods for managing employees in the performance management system.

## 🎯 Quick Start

### Method 1: Prisma Studio (Visual Interface)
```bash
yarn db:studio
```
- Opens browser at http://localhost:5555
- Point-and-click interface
- Perfect for quick edits and data viewing

### Method 2: CSV Import (Bulk Operations)
```bash
yarn db:import example-users.csv
```
- Best for adding many users at once
- Validates data and shows detailed results
- Handles manager relationships automatically

### Method 3: Server Actions (Programmatic Access)
```typescript
// Import from actions
import { createUser, updateUser, deleteUser } from '@/lib/actions/users'

// Create single user
const newUser = await createUser({
  name: "New User",
  email: "new@demo.com", 
  role: "employee",
  companyId: "company-id"
})
```

## 📊 CSV Import Format

Create a CSV file with these columns:

```csv
name,email,username,role,department,userType,password,employeeId,personID,managerPersonID,managerEmployeeId,companyCode
Michael Chen,michael.chen@demo.com,,manager,Engineering,office,password123,MGR001,87654321,,,DEMO_001
John Smith,john@company.com,,employee,Sales,office,password123,EMP001,12345678,87654321,,DEMO_001
Maria Worker,,maria.worker,employee,Manufacturing,operational,1234,EMP002,23456789,,MGR001,DEMO_001
HR Manager,hr1@demo.com,,hr,Human Resources,office,password123,HR001,11111111,,,DEMO_001
```

### Column Definitions:
- **name** (required): Full name
- **email**: For office workers (required if no username)
- **username**: For operational workers (required if no email)
- **role** (required): employee, manager, hr
- **department**: Team/department name
- **userType**: office (default) or operational
- **password** (required): Initial password
- **employeeId**: Company-assigned ID (EMP001, MGR001) for HRIS integration
- **personID**: National ID/Cédula for legal identification (required for API import)
- **managerPersonID**: Manager's National ID for hierarchy matching (preferred)
- **managerEmployeeId**: Alternative manager matching via Employee ID
- **companyCode** (required): Company identifier

### Rules:
- Either email OR username is required
- Operational workers typically use username + PIN
- Office workers typically use email + password
- Manager relationships created via personID matching (managerPersonID)
- Alternative manager matching via employeeId (managerEmployeeId)
- personID and employeeId must be unique per company

## 🔧 Server Actions for User Management

### User Management Actions
```typescript
// Import the actions
import { createUser, updateUser, deleteUser } from '@/lib/actions/users'

// Get all users (via server component)
// In your page.tsx or component:
const users = await prisma.user.findMany({
  where: { companyId: session.user.companyId },
  include: { manager: true, company: true }
})

// Create user
const newUser = await createUser({
  name: "New Employee",
  email: "new@company.com",
  role: "employee",
  companyId: "clr123...",
  managerId: "clr456...",
  userType: "office",
  password: "password123",
  department: "Sales",
  employeeId: "EMP001",
  personID: "12345678"
})

// Update user
const updatedUser = await updateUser("user-id", {
  name: "Updated Name",
  department: "New Department",
  active: true
})

// Deactivate user (soft delete)
await deleteUser("user-id")
```

### Available Admin REST APIs
```bash
# Get Companies (actual REST API)
GET /api/admin/companies
# Lists all companies with user counts

# CSV Import (actual REST API) 
POST /api/admin/import
Content-Type: application/json

{
  "companyId": "clr123...",
  "users": [
    {
      "name": "User 1",
      "email": "user1@demo.com",
      "role": "employee",
      "userType": "office",
      "password": "password123"
    }
  ]
}
```

## 🎯 Common Scenarios

### Scenario 1: New Office Employee
```typescript
import { createUser } from '@/lib/actions/users'

const newUser = await createUser({
  name: "Sarah Johnson",
  email: "sarah@company.com", 
  role: "employee",
  companyId: "clr123...",
  managerId: "clr456...",
  userType: "office",
  password: "password123",
  department: "Marketing"
})
```

### Scenario 2: New Operational Worker
```typescript
import { createUser } from '@/lib/actions/users'

const newWorker = await createUser({
  name: "Mike Rodriguez",
  username: "mike.production",
  role: "employee", 
  companyId: "clr123...",
  managerId: "clr456...",
  userType: "operational",
  password: "1234",
  department: "Manufacturing"
})
```

### Scenario 3: Bulk Import from HR System
1. Export from HR system to CSV
2. Match columns to our format
3. Run: `yarn db:import hr-export.csv`

## 🛠️ Database Commands

```bash
# Open visual database editor
yarn db:studio

# Import users from CSV
yarn db:import path/to/users.csv

# Reset database and add demo data
yarn db:reset

# Generate Prisma client after schema changes
yarn db:generate

# Push schema changes to database
yarn db:push
```

## 🔍 Troubleshooting

### Common Issues:
1. **User already exists**: Check email/username uniqueness per company
2. **Manager not found**: Ensure manager exists before creating employee
3. **Company not found**: Verify company code in CSV
4. **Invalid role**: Must be 'employee', 'manager', or 'hr'

### Debug Tips:
- Use Prisma Studio to verify data
- Check API responses for detailed error messages
- CSV import shows line-by-line results
- All operations are logged with detailed feedback

This system handles all your user management needs from quick edits to bulk operations across 27 companies and 4000+ employees.