# CSV Import Guide
## Complete Guide to Importing Users into the Performance Management System

---

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [CSV File Requirements](#csv-file-requirements)
4. [Field Descriptions](#field-descriptions)
5. [User Types Explained](#user-types-explained)
6. [Step-by-Step Import Process](#step-by-step-import-process)
7. [Common Examples](#common-examples)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [FAQ](#faq)

---

## Introduction

Welcome to the CSV Import Guide for the Performance Management System! This guide will help you import employee data efficiently and accurately using CSV (Comma-Separated Values) files.

**What you'll learn:**
- How to prepare your employee data for import
- Understanding different user types and authentication methods
- Step-by-step import process
- How to fix common import errors

---

## Getting Started

### Before You Begin

**You'll need:**
- Employee data in Excel or Google Sheets
- Access to the Performance Management System
- HR or Administrator role permissions

### Quick Start Checklist
- [ ] Download the CSV template from the system
- [ ] Prepare your employee data
- [ ] Review field requirements
- [ ] Test with a small batch first
- [ ] Proceed with full import

---

## CSV File Requirements

### File Format
- **File type:** `.csv` (Comma-Separated Values)
- **Encoding:** UTF-8
- **Separator:** Comma (,)
- **Maximum file size:** 10MB
- **Maximum records:** Approximately 10,000 employees

### Required Columns
Your CSV file **must** include these columns in this exact order:

```
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
```

---

## Field Descriptions

### 🟥 Required Fields (Must be filled)

#### **name**
- Employee's full name
- **Example:** "John Smith", "María García"
- **Requirements:** Not empty

#### **role**
- Employee's system role
- **Options:** 
  - `employee` - Regular employee
  - `manager` - Team manager/supervisor
  - `hr` - HR personnel
- **Example:** "employee"

#### **personID**
- National ID number (SSN, Cédula, DNI, etc.)
- **Purpose:** Unique identification for each employee
- **Example:** "123456789", "12345678-9"
- **Requirements:** Must be unique per company

### 🟨 Authentication Fields (Required based on user type)

#### **email**
- Work email address
- **Required for:** Office workers
- **Optional for:** Operational workers
- **Example:** "john.smith@company.com"

#### **username**
- System username
- **Required for:** Operational workers, or as alternative to email
- **Example:** "johnsmith", "jsmith"

#### **password**
- Login password or PIN
- **For office workers:** Strong password (8+ characters, mixed case, numbers, symbols)
- **For operational workers:** Simple PIN (4-6 digits)
- **Examples:** 
  - Office: "MyPassword123!"
  - Operational: "1234"

### 🟦 Optional Fields

#### **department**
- Employee's department/division
- **Example:** "Engineering", "Sales", "Human Resources"

#### **userType**
- Type of worker
- **Options:**
  - `office` - Office workers (computer access, email)
  - `operational` - Field/factory workers (mobile/kiosk access)
- **Default:** "office"

#### **employeeId**
- Company-assigned employee number
- **Example:** "EMP001", "E-12345"
- **Purpose:** Integration with HRIS systems

#### **position**
- Job title/position
- **Example:** "Software Engineer", "Sales Manager", "Line Worker"

#### **shift**
- Work shift
- **Example:** "Day", "Night", "Morning", "Afternoon"

#### **managerPersonID**
- National ID of the employee's manager
- **Example:** "987654321"
- **Purpose:** Establishes reporting hierarchy

#### **managerEmployeeId**
- Employee ID of the employee's manager
- **Example:** "EMP002"
- **Purpose:** Alternative way to set manager relationship

---

## User Types Explained

### 🏢 Office Users (`userType: office`)
**Who they are:** Desk workers, managers, administrators
**Access method:** Web browser, desktop application
**Authentication:** Email + Password OR Username + Password

**Requirements:**
- Must have either `email` OR `username` (or both)
- Must have a strong `password`
- Recommended: Include `email` for better communication

**Example:**
```csv
John Smith,john.smith@company.com,jsmith,employee,IT,office,EMP001,123456789,,,Software Developer,Day,MyPassword123!
```

### 🏭 Operational Users (`userType: operational`)
**Who they are:** Factory workers, field staff, drivers
**Access method:** Mobile devices, kiosks, tablets
**Authentication:** Username + PIN

**Requirements:**
- Must have `username`
- `email` can be empty
- Use simple `password` (PIN: 4-6 digits)
- Usually access via QR codes or simple login

**Example:**
```csv
Bob Worker,,bobworker,employee,Production,operational,EMP003,345678901,987654321,EMP002,Machine Operator,Morning,1234
```

---

## Step-by-Step Import Process

### Step 1: Download Template
1. Go to **Users** → **Advanced** → **Manual Import**
2. Click **"Download Template"** button
3. Save the `csv-import-template.csv` file

### Step 2: Prepare Your Data
1. Open the template in Excel or Google Sheets
2. **Keep the header row** (first row with column names)
3. Replace the example data with your employee information
4. Fill in required fields for each employee

### Step 3: Save as CSV
1. **In Excel:** File → Save As → Choose "CSV (Comma delimited)"
2. **In Google Sheets:** File → Download → Comma-separated values (.csv)
3. **Important:** Keep UTF-8 encoding

### Step 4: Import Process
1. Go to **Manual Import** tab
2. Click **"Choose File"** or drag your CSV file
3. Click **"Preview Import"** to analyze your data
4. Review the preview results:
   - ✅ Valid users (will be imported)
   - ❌ Invalid users (need fixing)
5. Click **"Configure Import"** if preview looks good
6. Choose import options:
   - ✅ Create new users
   - ✅ Update existing users
   - ✅ Skip errors (recommended for first import)
7. Click **"Execute Import"**
8. Review the results and download error report if needed

---

## Common Examples

### Example 1: Complete Office Employee
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Sarah Johnson,sarah.johnson@company.com,sjohnson,employee,Marketing,office,EMP101,111222333,444555666,EMP200,Marketing Specialist,Day,SecurePass2024!
```

### Example 2: Manager (No Manager Above)
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Mike Rodriguez,mike.rodriguez@company.com,mrodriguez,manager,Engineering,office,EMP200,444555666,,,Engineering Manager,Day,ManagerPass123!
```

### Example 3: Operational Worker
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Carlos Martinez,,cmartinez,employee,Production,operational,EMP301,777888999,444555666,EMP200,Assembly Worker,Morning,5678
```

### Example 4: HR User
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Lisa Chen,lisa.chen@company.com,lchen,hr,Human Resources,office,EMP999,555666777,,,HR Manager,Day,HRSecure2024!
```

---

## Troubleshooting

### Common Error Messages

#### ❌ "Missing required field: name"
**Problem:** Name field is empty
**Solution:** Fill in the employee's full name

#### ❌ "Invalid email format"
**Problem:** Email doesn't have proper format
**Solution:** Use format like "user@domain.com"

#### ❌ "Username already exists"
**Problem:** Two employees have the same username
**Solution:** Make usernames unique (add numbers: "jsmith1", "jsmith2")

#### ❌ "PersonID already exists"
**Problem:** Two employees have the same national ID
**Solution:** Check for duplicate entries, ensure each personID is unique

#### ❌ "Manager not found"
**Problem:** managerPersonID doesn't match any existing employee
**Solution:** 
- Make sure manager is imported first
- Double-check the manager's personID
- Leave manager fields empty if no manager

#### ❌ "Password too weak"
**Problem:** Password doesn't meet requirements
**Solution:**
- Office users: Use 8+ characters with mixed case, numbers, symbols
- Operational users: Use 4-6 digit PIN

### Import Process Issues

#### 🔄 "Import partially completed"
**What happened:** Some users imported successfully, others failed
**Action:** 
1. Download the error report
2. Fix the failed records
3. Import only the corrected data

#### 🔄 "No valid users found"
**What happened:** All users in CSV have errors
**Action:**
1. Check CSV format (comma-separated, UTF-8)
2. Verify header row matches template exactly
3. Ensure required fields are filled

---

## Best Practices

### 🎯 Preparation Tips
1. **Start small:** Test with 5-10 employees first
2. **Clean data:** Remove special characters from names/usernames
3. **Consistent formatting:** Use same date/text formats throughout
4. **Backup:** Keep original data files safe

### 🔐 Security Best Practices
1. **Strong passwords:** Office users need complex passwords
2. **Unique IDs:** Ensure personID and employeeId are unique
3. **Data privacy:** Don't share CSV files with sensitive data
4. **Clean up:** Delete CSV files after successful import

### 📊 Organization Tips
1. **Group by department:** Import department by department
2. **Managers first:** Import managers before their employees
3. **Logical order:** Follow organizational hierarchy

### ✅ Quality Control
1. **Double-check spelling:** Names, emails, departments
2. **Verify hierarchy:** Manager relationships make sense
3. **Test logins:** After import, test a few user logins
4. **Review reports:** Always check import results

---

## FAQ

### General Questions

**Q: How many employees can I import at once?**
A: Up to 10,000 employees per CSV file (10MB limit). For larger organizations, split into multiple files.

**Q: Can I update existing employees?**
A: Yes! The system will update existing employees based on personID or employeeId matching.

**Q: What if I make a mistake?**
A: You can use the "Rollback" feature in Import History to undo recent imports.

### Technical Questions

**Q: My CSV has extra columns. Is that OK?**
A: Extra columns will be ignored. Just ensure the required columns are present in the correct order.

**Q: Can I leave some fields empty?**
A: Yes, but required fields (name, role, personID) must be filled. Authentication fields depend on userType.

**Q: How do I handle employees without managers?**
A: Leave managerPersonID and managerEmployeeId empty for top-level employees.

### Authentication Questions

**Q: What's the difference between office and operational users?**
A: Office users have email access and use complex passwords. Operational users use simple PINs and may not have email.

**Q: Can an employee have both email and username?**
A: Yes! Having both provides login flexibility.

**Q: How secure are the passwords in the CSV?**
A: Passwords are automatically hashed when imported and never stored as plain text in the database.

---

## Support

### Need More Help?

**📧 Contact Support:**
- Email: support@company.com
- Internal Help Desk: Extension 1234

**📚 Additional Resources:**
- User Management Documentation
- System Administration Guide
- Video Tutorials (Internal Portal)

**🆘 Emergency Support:**
- For critical import issues during business hours
- Phone: +1-555-0123
- Escalation: IT Manager

---

*Last updated: [Current Date]*
*Version: 1.0*
*For Performance Management System v2024*

---

## Appendix: Template Reference

### Complete Template Header
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
```

### Sample Complete File
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
John Doe,john.doe@company.com,johndoe,employee,Engineering,office,EMP001,PID001,PID002,EMP002,Software Engineer,Day,Password123!
Jane Smith,jane.smith@company.com,janesmith,manager,Engineering,office,EMP002,PID002,,,Engineering Manager,Day,Password123!
Bob Worker,,bobworker,employee,Production,operational,EMP003,PID003,PID002,EMP002,Line Worker,Morning,1234
```

This comprehensive guide covers everything your users need to know for successful CSV imports!