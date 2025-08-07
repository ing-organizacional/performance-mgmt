# Employee Directory - DEMO S.A.
**Updated:** 2025-08-07  
**Company:** DEMO S.A.  
**Total Employees:** 40  
**Universal Password:** `a`

---

## 🔑 Quick Access Accounts

| Role | Email | Department | Purpose |
|------|-------|------------|---------|
| **HR Admin** | miranda.priestly@demo.com | HR | Super user - full system access |
| **Manager** | gordon.ramsay@demo.com | Food & Beverage | Manager with 11 direct reports |
| **Employee** | monica.geller@demo.com | Food & Beverage | Regular employee |

---

## 📊 Department Overview

### HR Department (3 employees)
**Manager:** Miranda Priestly (HR Director - Super User)
- miranda.priestly@demo.com - **HR Role** (manages entire company)
- pam.beesly@demo.com - Employee
- toby.flenderson@demo.com - Employee

### Rooms Department (10 employees)
**Manager:** Basil Fawlty
- basil.fawlty@demo.com - Manager
- polly.sherman@demo.com - Employee
- manuel.garcia@demo.com - Employee
- lorelai.gilmore@demo.com - Employee
- michel.gerard@demo.com - Employee
- sookie.stjames@demo.com - Employee
- lane.kim@demo.com - Employee
- kirk.gleason@demo.com - Employee
- caesar.augustus@demo.com - Employee
- jackson.belleville@demo.com - Employee

### Food & Beverage Department (12 employees)
**Manager:** Gordon Ramsay
- gordon.ramsay@demo.com - Manager
- monica.geller@demo.com - Employee
- sanji.vinsmoke@demo.com - Employee
- bob.belcher@demo.com - Employee
- linda.belcher@demo.com - Employee
- tina.belcher@demo.com - Employee
- spongebob.squarepants@demo.com - Employee
- squidward.tentacles@demo.com - Employee
- patrick.star@demo.com - Employee
- remy.linguini@demo.com - Employee
- colette.tatou@demo.com - Employee
- auguste.gusteau@demo.com - Employee

### Finance Department (7 employees)
**Manager:** Ben Wyatt
- ben.wyatt@demo.com - Manager
- angela.martin@demo.com - Employee
- oscar.martinez@demo.com - Employee
- kevin.malone@demo.com - Employee
- cyril.figgis@demo.com - Employee
- ted.mosby@demo.com - Employee
- barney.stinson@demo.com - Employee

### Maintenance Department (8 employees)
**Manager:** Mike Ehrmantraut
- mike.ehrmantraut@demo.com - Manager
- janitor.glenn@demo.com - Employee
- carl.reed@demo.com - Employee
- scruffy.scruffington@demo.com - Employee
- charlie.kelly@demo.com - Employee
- frank.reynolds@demo.com - Employee
- argus.filch@demo.com - Employee
- willie.macdougal@demo.com - Employee

---

## 📋 Evaluation Items Structure

### Company-Wide (All Employees)
1. **Customer Excellence** (Competency)
2. **Increase Guest Satisfaction to 95%** (OKR) - *Overdue*
3. **Revenue Growth 20%** (OKR)

### Department-Specific
- **HR:** Strategic HR Leadership (Competency)
- **Finance:** 
  - Reduce Operating Costs by 15% (OKR) - *Overdue*
  - Implement Real-time Financial Reporting (OKR)
- **Maintenance:**
  - Zero Critical Equipment Downtime (OKR) - *Overdue*
  - Energy Efficiency Improvement 25% (OKR)

### Individual (F&B Only)
Each F&B employee has one unique manager-assigned OKR:
- Master Wine Pairing Program
- Reduce Food Waste 30%
- Launch Vegan Menu Line
- Improve Kitchen Efficiency 20%
- Social Media Food Photography
- Local Sourcing Initiative
- Breakfast Service Excellence
- Cocktail Innovation Program
- Staff Training Excellence
- Special Events Catering
- Health & Safety Compliance
- Customer Allergy Management

---

## 🧪 Quick Test Guide

### Test 1: HR Admin Overview
1. **Login:** miranda.priestly@demo.com / a
2. **Navigate to:** Dashboard
3. **Verify:**
   - Can see all 40 employees
   - Can access any evaluation
   - Can unlock submitted evaluations
   - See overdue items in dashboard

### Test 2: Manager Evaluation Flow
1. **Login:** gordon.ramsay@demo.com / a
2. **Navigate to:** Employee Evaluations
3. **Select:** Any F&B employee without evaluation
4. **Test:**
   - Rate items (1-5 stars)
   - Add comments (min 100 characters)
   - Watch auto-save indicator
   - Submit when all complete

### Test 3: Employee Experience
1. **Login:** monica.geller@demo.com / a
2. **Navigate to:** My Evaluations
3. **Verify:**
   - Can view evaluation if exists
   - Can approve if status is "submitted"
   - Cannot edit evaluations

### Test 4: Evaluation Status Flow
- **Draft:** Manager editing (auto-saves every 2 seconds)
- **Submitted:** Awaiting employee approval (locked)
- **Completed:** Employee approved (permanently locked)

### Test 5: Three-Status Workflow
1. **Manager creates evaluation** → Draft (can edit)
2. **Manager submits** → Submitted (locked, awaiting approval)
3. **Employee approves** → Completed (permanent)
4. **Only HR can unlock** submitted evaluations back to draft

---

## 📈 Current Data Status

### Evaluations
- **Total:** 37 (HR department excluded)
- **Completed:** ~33% (12 evaluations)
- **Draft:** ~67% (25 evaluations)
- **Ratings Distribution:** Mix of poor (1-2), normal (3), good (4), excellent (5)

### Deadlines
- **Overdue:** Several items 3-10 days overdue
- **Upcoming:** Items due in next 60 days
- **Mixed:** Company, department, and individual deadlines

---

## ⚡ Quick Commands

```bash
# View data in browser
yarn db:studio

# Reset with comprehensive data
yarn db:reset:comprehensive

# Start development server
yarn dev
```

---

## 🎯 Testing Checklist

### Basic Functionality
- [ ] Login with any account (password: a)
- [ ] Navigate between departments
- [ ] View employee list

### Manager Features
- [ ] Create new evaluation
- [ ] Auto-save works (2-second delay)
- [ ] Progress indicator updates
- [ ] Submit button enables when complete
- [ ] Cannot recall after submission

### Employee Features
- [ ] View submitted evaluations
- [ ] Approve evaluations
- [ ] Cannot edit evaluations

### HR Features
- [ ] Access all evaluations
- [ ] See overdue items
- [ ] Unlock submitted evaluations
- [ ] View completion statistics

### Workflow Rules
- [ ] Draft → Submitted (one-way)
- [ ] Submitted → Completed (employee approval)
- [ ] Submitted → Draft (HR unlock only)
- [ ] No manager recall option

---

## 📝 Notes

- **Performance Cycle:** 2025 Annual Review (Active)
- **All passwords:** Single letter `a`
- **HR employees:** Have no evaluations (as requested)
- **F&B employees:** Each has unique individual OKR
- **Deadlines:** Mix of overdue and future dates
- **Characters:** From popular movies/TV shows for easy recognition

---

*Database seeded with comprehensive test data for three-status workflow testing*