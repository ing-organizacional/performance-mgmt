# API Endpoints Audit - Simplification Analysis

This document analyzes all existing API endpoints to determine which can be converted to server components for "ridiculously simple" architecture.

## Current API Endpoints (20 total)

### 🔴 **MUST KEEP - External/Form Submissions/State Changes** 
*These require API endpoints due to their nature*

1. **`/api/auth/[...nextauth]`** - NextAuth handler (REQUIRED)
2. **`/api/auth/update-last-login`** - Authentication state update (REQUIRED)
3. **`/api/admin/import`** - CSV file upload (REQUIRED - handles multipart/form-data)
4. **`/api/admin/reset-database`** - Destructive database operation (REQUIRED)
5. **`/api/evaluations` (POST)** - Evaluation submission (REQUIRED - form submission)
6. **`/api/evaluation-items` (POST)** - Create evaluation items (REQUIRED - form submission)
7. **`/api/evaluation-items/[id]` (PUT/DELETE)** - Update/delete items (REQUIRED - mutations)
8. **`/api/evaluation-items/assign` (POST)** - Assignment operations (REQUIRED - mutations)  
9. **`/api/admin/users` (POST)** - User creation (REQUIRED - form submission)
10. **`/api/admin/users/[id]` (PUT/DELETE)** - User updates/deletion (REQUIRED - mutations)
11. **`/api/admin/cycles` (POST)** - Cycle creation (REQUIRED - form submission)  
12. **`/api/admin/cycles/[id]` (PUT)** - Cycle updates (REQUIRED - mutations)
13. **`/api/partial-assessments` (POST)** - Assessment submission (REQUIRED - form submission)

### 🟡 **CAN CONVERT TO SERVER COMPONENTS - Read-Only Data**
*These are GET endpoints that just fetch and display data*

14. **`/api/evaluations` (GET)** - Fetch user evaluations → **Convert to Server Component**
15. **`/api/evaluations/[id]` (GET)** - Fetch single evaluation → **Convert to Server Component**  
16. **`/api/manager/team` (GET)** - Fetch team data → **Convert to Server Component**
17. **`/api/manager/team-assignments` (GET)** - Fetch assignments → **Convert to Server Component**
18. **`/api/evaluation-items/all` (GET)** - Fetch all items → **Convert to Server Component**
19. **`/api/admin/users` (GET)** - Fetch users list → **Convert to Server Component**
20. **`/api/admin/cycles` (GET)** - Fetch cycles → **Convert to Server Component**

### 🟢 **KEEP AS-IS - Special Functions**
*These serve specific non-page purposes*

- **`/api/export/*`** - File downloads (KEEP - generates files)
- **`/api/health`** - Health check (KEEP - monitoring)

## Conversion Candidates Analysis

### High Priority Conversions (Pages that currently use these APIs)

1. **`/my-evaluations` page** currently uses `/api/evaluations` (GET)
   - Simple data fetch, perfect for server component
   - Currently client-side with loading states
   - Can be simplified to direct database query

2. **`/evaluations` page** currently uses `/api/manager/team` (GET)  
   - Team data display, perfect for server component
   - Remove loading states and API complexity

3. **`/dashboard/deadlines` page** might use `/api/evaluation-items/all` (GET)
   - HR overview data, perfect for server component

4. **User management pages** currently use `/api/admin/users` (GET)
   - Admin data display, perfect for server component

### Medium Priority Conversions  

5. **Individual evaluation pages** using `/api/evaluations/[id]` (GET)
   - Single evaluation display
   - Can be server component with dynamic routes

6. **Assignment pages** using `/api/manager/team-assignments` (GET)
   - Team assignment display
   - Can be server component

## Conversion Benefits

### Before (Current State)
```typescript
// Client component with API call
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/evaluations')
    .then(res => res.json())
    .then(data => {
      setData(data)
      setLoading(false)
    })
}, [])

if (loading) return <div>Loading...</div>
```

### After (Server Component)
```typescript
// Server component with direct DB query
async function MyEvaluationsPage() {
  const session = await auth()
  const evaluations = await prisma.evaluation.findMany({
    where: { employeeId: session.user.id }
  })
  
  return <EvaluationsList evaluations={evaluations} />
}
```

## Conversion Plan

### ✅ Phase 1: High-Impact Conversions (COMPLETED)
1. ✅ `/my-evaluations` page → **CONVERTED** to server component, removed dependency on `/api/evaluations` (GET)
2. ✅ `/evaluations` page → **CONVERTED** to server component, removed dependency on `/api/manager/team` (GET)  
3. 🟡 User management → **PENDING** (complex form interactions, keep for Phase 2)

### Phase 2: Medium-Impact Conversions  
4. Individual evaluation pages → Remove `/api/evaluations/[id]` (GET)
5. Assignment pages → Remove `/api/manager/team-assignments` (GET)
6. HR overview pages → Remove `/api/evaluation-items/all` (GET)
7. User management → Remove `/api/admin/users` (GET)

### Phase 3: Admin Pages
8. Cycle management → Remove `/api/admin/cycles` (GET)

## Progress Update (Phase 1 Results)

### ✅ **Achievements So Far:**
- **Converted 2 major pages** to server components
- **Eliminated 2 API endpoints** (`/api/evaluations` GET, `/api/manager/team` GET)  
- **Removed all loading states** from converted pages
- **Improved page load speed** (server-rendered data)
- **Simplified code architecture** (direct database queries)

### 📊 **Before vs After Comparison:**

**`/my-evaluations` page:**
- ❌ Before: Client component + API call + loading states + error handling
- ✅ After: Server component + direct DB query + instant data

**`/evaluations` page:**  
- ❌ Before: Client component + 2 API calls + loading states + error handling
- ✅ After: Server component + direct DB query + instant data

### 🎯 **Expected Final Outcomes:**
- **Reduce API endpoints from 20 to ~13** (35% reduction)
- **Eliminate loading states** for data display pages  
- **Faster page loads** (no client-side API calls)
- **Simpler code** (direct database queries)  
- **Better SEO** (server-rendered content)
- **Fewer bugs** (no async state management issues)

### 🧹 **APIs That Can Be Removed After Full Conversion:**
- `/api/evaluations` (GET) - ✅ **REMOVED** 
- `/api/manager/team` (GET) - ✅ **REMOVED**
- `/api/evaluations/[id]` (GET) - 🟡 **NEXT**
- `/api/manager/team-assignments` (GET) - 🟡 **NEXT**
- `/api/evaluation-items/all` (GET) - 🟡 **NEXT**
- `/api/admin/users` (GET) - 🟡 **NEXT**
- `/api/admin/cycles` (GET) - 🟡 **NEXT**

This aligns perfectly with the "ridiculously simple" architecture goal while keeping the necessary APIs for forms, mutations, and special functions.