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

### Method 3: Admin API (Programmatic Access)
```bash
# Get all users
curl http://localhost:3000/api/admin/users

# Create single user
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"name":"New User","email":"new@demo.com","role":"employee","companyId":"company-id"}'
```

## 📊 CSV Import Format

Create a CSV file with these columns:

```csv
name,email,username,role,department,userType,password,managerEmail,companyCode,employeeId
John Smith,john@company.com,,employee,Sales,office,password123,manager@company.com,DEMO_001,EMP001
Maria Worker,,maria.worker,employee,Manufacturing,operational,1234,supervisor@company.com,DEMO_001,EMP002
```

### Column Definitions:
- **name** (required): Full name
- **email**: For office workers
- **username**: For operational workers (no email)
- **role** (required): employee, manager, hr
- **department**: Team/department name
- **userType**: office (default) or operational
- **password** (required): Initial password
- **managerEmail**: Manager's email (optional)
- **companyCode** (required): Company identifier
- **employeeId**: Employee ID number (optional)

### Rules:
- Either email OR username is required
- Operational workers typically use username + PIN
- Office workers typically use email + password
- Manager relationships are created automatically if managerEmail exists

## 🔧 Admin API Endpoints

### Get All Users
```bash
GET /api/admin/users
```
Returns all users with company and manager info.

### Get Single User
```bash
GET /api/admin/users/[id]
```
Returns detailed user info including evaluations.

### Create User
```bash
POST /api/admin/users
Content-Type: application/json

{
  "name": "New Employee",
  "email": "new@company.com",
  "role": "employee",
  "companyId": "clr123...",
  "managerId": "clr456...",
  "userType": "office",
  "password": "password123",
  "department": "Sales",
  "employeeId": "EMP001"
}
```

### Update User
```bash
PUT /api/admin/users/[id]
Content-Type: application/json

{
  "name": "Updated Name",
  "department": "New Department",
  "active": true
}
```

### Deactivate User
```bash
DELETE /api/admin/users/[id]
```
Soft deletes (sets active=false).

### Get Companies
```bash
GET /api/admin/companies
```
Lists all companies with user counts.

### Bulk Import
```bash
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
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah@company.com",
    "role": "employee",
    "companyId": "clr123...",
    "managerId": "clr456...",
    "userType": "office",
    "password": "password123",
    "department": "Marketing"
  }'
```

### Scenario 2: New Operational Worker
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mike Rodriguez",
    "username": "mike.production",
    "role": "employee",
    "companyId": "clr123...",
    "managerId": "clr456...",
    "userType": "operational",
    "password": "1234",
    "department": "Manufacturing"
  }'
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