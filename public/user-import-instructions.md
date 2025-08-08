# CSV User Import Instructions

## 📋 Template: `user-import-template.csv`

Download and fill out the CSV template to bulk import users into the Performance Management System.

## 📊 Required Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `name` | ✅ **YES** | Full employee name | `John Doe` |
| `personID` | ✅ **YES** | National ID (Cédula, DNI) | `12345678` |
| `role` | ✅ **YES** | User role: `employee`, `manager`, or `hr` | `employee` |

## 🔐 Authentication Fields

**Office Workers (Computer Access):**
- `email` - Required for office workers
- `password` - Login password (min 8 chars)
- `userType` - Set to `office`

**Operational Workers (Mobile/PIN Access):**
- `username` - Required for operational workers  
- `password` - PIN code (4 digits recommended)
- `userType` - Set to `operational`

## 🏢 Organizational Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `department` | Optional | Employee department | `Human Resources` |
| `employeeId` | Optional | Company employee number | `EMP001` |
| `companyCode` | Optional | Company identifier | `COMPANY_001` |

## 👥 Manager Assignment

Assign managers using **one** of these fields:
- `managerPersonID` - Manager's national ID
- `managerEmployeeId` - Manager's employee ID

## 📝 Example Rows

```csv
name,email,username,role,department,userType,password,employeeId,personID,managerPersonID
John Doe,john.doe@company.com,,employee,HR,office,changeme123,EMP001,12345678,87654321
Jane Worker,,jane_worker,employee,Production,operational,1234,EMP002,87654321,12345678
Mike Manager,mike@company.com,,manager,Sales,office,password123,MGR001,11111111,
```

## ⚠️ Important Notes

### **Required Combinations:**
- **Office users**: Must have `email` 
- **Operational users**: Must have `username`
- **All users**: Must have `name`, `personID`, `role`

### **Security:**
- All PersonIDs must be unique
- Passwords will be hashed automatically
- Manager must exist before assigning employees

### **Data Validation:**
- Duplicate users are rejected
- Invalid roles are rejected  
- Missing required fields cause row to be skipped

## 🚀 Import Process

1. **Download** `user-import-template.csv`
2. **Fill out** user data following this guide
3. **Login** as HR administrator  
4. **Go to** Admin section → Import Users
5. **Upload** your CSV file
6. **Review** import results and error messages

## 🔍 Troubleshooting

**Common Issues:**
- ❌ `Missing personID` - Add national ID for each user
- ❌ `User already exists` - PersonID, email, or username is duplicate
- ❌ `Manager not found` - Create manager before assigning employees
- ❌ `Missing email or username` - Office users need email, operational users need username

**Success Criteria:**
- ✅ Clean import with no errors
- ✅ Users can login with provided credentials
- ✅ Manager relationships established correctly