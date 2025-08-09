# CSV User Import Instructions

## 📋 Templates Available

### 🔧 **Advanced Template**: `example-users-advanced.csv`
- **Hotel/Hospitality Industry Example** - 28 users across multiple departments
- **Complex Hierarchy** - CEO → GM → Department Managers → Supervisors → Staff
- **Mixed Workforce** - Office workers (email) + Operational workers (PIN)
- **Complete Example** - Demonstrates all fields and relationships

### 📊 **Basic Template**: `example-users.csv` 
- **Simple Company Structure** - 14 users with basic hierarchy
- **Getting Started** - Easy to understand and modify
- **Common Use Case** - Standard office/operational mix

### 📝 **Empty Template**: `user-import-template.csv`
- **Blank Template** - Headers only for your data
- **Custom Import** - Start fresh with your organization

## 🎯 Required CSV Structure

```csv
name,email,username,role,department,userType,password,employeeId,personID,managerPersonID,managerEmployeeId,companyCode,position,shift
```

## 📊 Field Requirements

### ✅ **Always Required**
| Field | Description | Example |
|-------|-------------|---------|
| `name` | Full employee name | `Maria Rodriguez` |
| `personID` | National ID (unique identifier) | `12345678` |
| `role` | `employee`, `manager`, or `hr` | `employee` |

### 🔐 **Authentication Requirements**

**Office Workers (Computer/Email Access):**
- ✅ `email` - Required for office workers
- ✅ `userType` - Set to `office` 
- ✅ `password` - Min 8 characters
- ❌ `username` - Leave empty

**Operational Workers (PIN/Mobile Access):**
- ✅ `username` - Required for operational workers
- ✅ `userType` - Set to `operational`
- ✅ `password` - 4-6 digit PIN (e.g., `1234`)
- ❌ `email` - Leave empty

### 🏢 **Optional Fields**
| Field | Description | Example |
|-------|-------------|---------|
| `department` | Work department | `Housekeeping`, `Front Office` |
| `position` | Job title | `Room Attendant`, `Sales Manager` |
| `shift` | Work shift | `Morning Shift`, `Night Shift` |
| `employeeId` | Company employee number | `EMP001`, `MGR001` |
| `companyCode` | Company identifier | `HOTEL_ABC`, `CORP_001` |

### 👥 **Manager Assignment**

Use **ONE** of these to assign a manager:
- `managerPersonID` - Manager's national ID (personID)
- `managerEmployeeId` - Manager's employee ID

**Important**: Managers must be imported before their employees!

## 📝 **Import Order Strategy**

For successful imports, follow this order:

1. **HR/CEO Level** (no manager)
2. **Top Managers** (report to HR/CEO)
3. **Department Managers** (report to top managers)
4. **Supervisors** (report to department managers)
5. **Employees** (report to supervisors/managers)

## 💡 **Real Examples from Templates**

### HR/CEO (No Manager)
```csv
CEO Executive,ceo@advancedhotel.com,,hr,Executive,office,ceopass2024,CEO001,00000000,,,ADV_HOTEL,Chief Executive Officer,Day Shift
```

### Manager (Reports to CEO)
```csv
GM Hotel,gm@advancedhotel.com,,manager,Management,office,gmpass2024,GM001,10000000,00000000,,ADV_HOTEL,General Manager,Day Shift
```

### Office Employee (Reports to Manager)
```csv
Reception Supervisor,reception.sup@advancedhotel.com,,employee,Front Office,office,reception123,SUP001,21000000,20000000,,ADV_HOTEL,Reception Supervisor,Day Shift
```

### Operational Employee (Reports to Manager)
```csv
Maria Gonzalez,,maria_housekeeping,employee,Housekeeping,operational,1234,HK001,80100001,30000000,,ADV_HOTEL,Room Attendant,Morning Shift
```

## ⚠️ **Critical Rules**

### **Unique Identifiers**
- `personID` must be unique across all users
- `email` must be unique (when provided)
- `username` must be unique (when provided)
- `employeeId` must be unique (when provided)

### **Manager Relationships**
- Managers must exist before assigning employees to them
- Use either `managerPersonID` OR `managerEmployeeId` (not both)
- HR role users typically don't have managers
- Avoid circular manager relationships

### **Password Security**
- Office workers: Minimum 8 characters
- Operational workers: 4-6 digit PIN codes
- Passwords are automatically hashed during import

## 🚀 **Import Process**

1. **Choose Template**
   - Download `example-users-advanced.csv` for comprehensive example
   - Download `example-users.csv` for simpler structure
   - Download `user-import-template.csv` for blank template

2. **Prepare Your Data**
   - Follow import order (HR → Managers → Employees)
   - Ensure all required fields are filled
   - Verify manager relationships are correct

3. **Upload and Import**
   - Login as HR administrator
   - Navigate to `/users/advanced`
   - Select and upload your CSV file
   - Review import results and fix any errors

## 🔍 **Common Issues & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| `Manager not found with PersonID: 12345` | Employee references non-existent manager | Import manager first, verify PersonID matches |
| `User already exists with PersonID: 67890` | Duplicate PersonID in database | Use unique PersonIDs for each user |
| `Office workers require email` | Office user missing email field | Add email address for userType='office' |
| `Operational workers require username` | Operational user missing username | Add username for userType='operational' |
| `Password must be at least 8 characters` | Office user password too short | Use stronger passwords for office workers |
| `Operational user PIN must be 4-6 digits` | Invalid PIN format | Use numeric PIN codes (e.g., 1234, 5678) |

## ✅ **Validation Checklist**

Before importing, verify:
- [ ] All required fields completed
- [ ] PersonIDs are unique and valid
- [ ] Email addresses for office workers
- [ ] Usernames for operational workers  
- [ ] Manager relationships exist
- [ ] Import order follows hierarchy
- [ ] Passwords meet requirements
- [ ] Company codes are consistent

## 🎯 **Success Indicators**

After successful import:
- ✅ Import summary shows users created
- ✅ No error messages in import results
- ✅ Users can login with provided credentials
- ✅ Manager relationships visible in user management
- ✅ Correct departments and positions assigned