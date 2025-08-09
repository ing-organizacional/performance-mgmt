export type Language = 'en' | 'es'

export interface Translations {
  // Shared Status Terms
  status: {
    active: string
    inactive: string
    completed: string
    pending: string
    draft: string
    draftReopened: string
    submitted: string
    approved: string
    inProgress: string
    notStarted: string
    overdue: string
    archived: string
    closed: string
  }

  // Shared Performance Ratings
  ratings: {
    outstanding: string
    exceedsExpectations: string
    meetsExpectations: string
    belowExpectations: string
    needsImprovement: string
    notRated: string
  }

  // Common
  common: {
    loading: string
    save: string
    cancel: string
    edit: string
    delete: string
    submit: string
    next: string
    previous: string
    signOut: string
    dashboard: string
    back: string
    yes: string
    no: string
    standardized: string
    company: string
    department: string
    manager: string
    createdBy: string
    saving: string
    approving: string
    of: string
    employees: string
    departments: string
    found: string
    selected: string
    unassigned: string
    selectAll: string
    deselectAll: string
    noEmployeesFound: string
    noDepartmentsFound: string
    allDepartments: string
    hide: string
    show: string
    view: string
    approve: string
    recall: string
    unlock: string
    you: string
    remove: string
    never: string
    created: string
    lastUsed: string
    name: string
  }
  
  // Auth
  auth: {
    signIn: string
    signOut: string
    emailOrUsername: string
    password: string
    signingIn: string
    invalidCredentials: string
    loginFailed: string
    signInToAccount: string
    demoCredentials: string
    hr: string
    manager: string
    employee: string
    worker: string
    name: string
    email: string
    role: string
  }
  
  // Navigation
  nav: {
    performanceManagement: string
    employeeEvaluations: string
    myEvaluations: string
    selectEmployee: string
    employees: string
    assignments: string
    welcomeBack: string
    performanceHistory: string
    currentPeriod: string
    settings: string
    evaluationComplete: string
    latestPerformanceEvaluation: string
    reviewedBy: string
    evaluatedOn: string
    evaluatedBy: string
    noEvaluationsYet: string
    noPerformanceEvaluations: string
    evaluationHistory: string
    viewDetails: string
    performanceSummary: string
    awaitingYourApproval: string
    evaluationInProgress: string
    managerPreparingEvaluation: string
    managerSubmittedEvaluation: string
    averageRating: string
    completedReviews: string
    consistentlyExceeding: string
    performanceOutstanding: string
    performanceExceeding: string
    performanceMeeting: string
    performanceImproving: string
    performanceNeedsWork: string
  }
  
  // Evaluations
  evaluations: {
    evaluation: string
    evaluateEmployee: string
    employeeEvaluation: string
    selectEmployeeToEvaluate: string
    overallPerformance: string
    overallRating: string
    overallComments: string
    submitEvaluation: string
    submitForApproval: string
    submitting: string
    evaluationSubmittedSuccess: string
    evaluationApprovedSuccess: string
    awaitingEmployeeApproval: string
    evaluationCompleted: string
    unlocking: string
    unlock: string
    evaluationUnlocked: string
    progress: string
    of: string
    itemsCompleted: string
    okr: string
    competency: string
    ratePerformance: string
    optionalComment: string
    provideFeedback: string
    addSpecificFeedback: string
    teamSummary: string
    pendingReviews: string
    teamAverage: string
    evaluationSubmitted: string
    evaluationSubmittedDesc: string
    redirecting: string
    newCompanyItemsAdded: string
    employeeNeedReEvaluation: string
    employeesNeedReEvaluation: string
    evaluationsAwaitingApproval: string
    evaluationAwaitingApproval: string
    comments: string
    minimumCharacters: string
    tapToRate: string
    commentPlaceholder: string
    commentGuidance: string
  }

  // Speech-to-Text
  speech: {
    startRecording: string
    stopRecording: string
    tapToSpeak: string
    microphoneAccess: string
    networkError: string
    noSpeechDetected: string
    audioNotSupported: string
    speakNow: string
    speechNotSupported: string
    transcriptionError: string
    lengthExceeded: string
  }

  // Biometric Authentication
  biometric: {
    setup: string
    use: string
    setupSuccess: string
    loginSuccess: string
    notSupported: string
    cancelled: string
    failed: string
    httpsRequired: string
    credentialExists: string
    noCredentials: string
    tapToSetup: string
    tapToAuth: string
    settingUp: string
    authenticating: string
    faceIdTouchId: string
    touchId: string
    fingerprint: string
    biometric: string
    userInfoRequired: string
    authentication: string
    settingsDescription: string
    addNew: string
    existingCredentials: string
    confirmRemove: string
    removeSuccess: string
    faceId: string
  }

  // Settings
  settings: {
    profile: string
    editProfile: string
    changePassword: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
    passwordsMatch: string
    passwordUpdated: string
    passwordSecurityNote: string
  }
  
  // Assignments
  assignments: {
    assignmentManager: string
    manageOKRsCompetencies: string
    companyWideItems: string
    companyWideDescription: string
    appliedToAllEmployees: string
    selectEmployeesForBatch: string
    selectEmployees: string
    itemsAssigned: string
    employeesSelected: string
    assignToSelected: string
    individualAssignments: string
    individualDescription: string
    comingSoon: string
    createNewDepartmentItems: string
    newOKR: string
    newCompetency: string
    create: string
    evaluationDeadline: string
    departmentLevelAssignments: string
    departmentDescription: string
    currentlyAssignedTo: string
  }

  // Company Items
  companyItems: {
    title: string
    subtitle: string
    infoTitle: string
    infoDescription: string
    createNewTitle: string
    newCompanyOKR: string
    newCompanyCompetency: string
    existingItemsTitle: string
    itemsAppliedToAll: string
    objective: string
    competencyName: string
    keyResults: string
    description: string
    activate: string
    deactivate: string
    active: string
    inactive: string
    createdBy: string
    appliedToAllEmployees: string
    noItemsTitle: string
    noItemsDescription: string
    companyOKR: string
    companyCompetency: string
    companyWide: string
    confirmDeactivate: string
    confirmActivate: string
    deactivateWarning: string
    activateWarning: string
  }
  
  // OKRs (only commonly used keys)
  okrs: {
    objective: string
    keyResults: string
  }
  
  // Dashboard
  dashboard: {
    hrDashboard: string
    q1Reviews: string
    newEvaluation: string
    completionStatus: string
    complete: string
    completed: string
    remaining: string
    overdueEvaluations: string
    pastDueDate: string
    sendReminders: string
    dueSoon: string
    dueWithinDays: string
    viewList: string
    ratingDistribution: string
    generalResults: string
    outstanding: string
    exceeds: string
    meets: string
    below: string
    needsImprovement: string
    quickActions: string
    administrativeActions: string
    generateReports: string
    exportPDF: string
    pdfExportCenter: string
    exportCenter: string
    selectReportsToExport: string
    selectReportsAndFormats: string
    companyOverview: string
    allEmployeesAllDepartments: string
    departmentSummary: string
    departmentBreakdown: string
    topPerformers: string
    highestRatedEmployees: string
    needsAttention: string
    employeesNeedingSupport: string
    managerReports: string
    reportsGroupedByManager: string
    customSelection: string
    selectSpecificEmployees: string
    reportsSelected: string
    exporting: string
    exportSelected: string
    exportError: string
    evaluationNotFound: string
    accessDenied: string
    exportFailed: string
    noEvaluationsFound: string
    hrRoleRequired: string
    managerOrHrRequired: string
    allPeriods: string
    manageUsers: string
    startEvaluating: string
    lastUpdated: string
    newCycle: string
    cycleName: string
    startDate: string
    endDate: string
    createCycle: string
    creating: string
    overdueDrafts: string
    pendingApprovals: string
    daysPending: string
    submittedBy: string
    overdue3Days: string
    viewAll: string
    companyWideItems: string
    auditLogs: string
    auditDashboard: string
    auditDescription: string
    auditFilters: string
    allActions: string
    allTypes: string
    clearFilters: string
    showDetails: string
    hideDetails: string
    auditDetails: string
    exportExcel: string
    showingOf: string
    noAuditLogs: string
    timestamp: string
    user: string
    action: string
    entity: string
    details: string
    ipAddress: string
    reason: string
    oldData: string
    newData: string
    metadata: string
    cycles: string
    performanceCycles: string
    cycleManagement: string
    activeCycle: string
    closedCycle: string
    archivedCycle: string
    active: string
    closed: string
    archived: string
    evaluationsText: string
    itemsText: string
    assessmentsText: string
    manageCycles: string
    cycleStatus: string
    cycleClosedBy: string
    cycleClosedAt: string
    reopenCycle: string
    closeCycle: string
    archiveCycle: string
    deleteCycle: string
    confirmClose: string
    confirmReopen: string
    confirmArchive: string
    confirmDelete: string
    closeWarning: string
    reopenWarning: string
    deleteWarning: string
    onlyOneActive: string
    cannotDeleteData: string
    dateRange: string
    exportAllPDF: string
    exportAllExcel: string
    clearAll: string
    // Department ratings page
    departmentRatings: string
    performanceInsights: string
    totalEvaluations: string
    completeDepartments: string
    departmentsNeedAttention: string
    swipeForDetails: string
    noManager: string
    notAssigned: string
    employees: string
    evaluated: string
    pending: string
    performanceDistribution: string
    evaluations: string
    outstandingShort: string
    exceedsShort: string
    meetsShort: string
    belowShort: string
    needsImprovementShort: string
    needAttention: string
    noCompletedEvaluations: string
    evaluationsWillAppear: string
    noDepartmentsFound: string
    addEmployeesWithDepartments: string
    employeesNeedReview: string
    allEmployees: string
    viewAllEmployees: string
    pendingEvaluations: string
    managePendingEvaluations: string
    employeesWithoutEvaluations: string
    startEvaluation: string
    searchEmployees: string
    searchEmployeesManagers: string
    allEvaluationsCompleted: string
    excellentWork: string
    noManagerAssigned: string
    viewResults: string
    scheduleOneOnOnes: string
    viewCompletedEvaluations: string
    // Evaluation summary page
    okrAverage: string
    competencyAverage: string
    totalAverage: string
    objectives: string
    skills: string
    items: string
    managerComments: string
    feedback: string
    companyLevel: string
    departmentLevel: string
    managerLevel: string
    searchDepartments: string
    allDepartments: string
    allStatus: string
    hasEvaluation: string
    noEvaluation: string
    partial: string
    closedOn: string
    performanceCycleClosedHR: string
    performanceCycleClosedManager: string
    performanceCycleArchived: string
    performanceCycleRestricted: string
    // Deadlines page
    all: string
    overdue: string
    high: string
    medium: string
    low: string
    highPriority: string
    mediumPriority: string
    lowPriority: string
    department: string
    manager: string
    dueThisWeek: string
    createdBy: string
    deadlineSetBy: string
    noDeadline: string
    allEvaluationItems: string
    itemsWithDeadlines: string
    daysRemaining: string
    dayRemaining: string
    dayOverdue: string
    dueToday: string
    managersWithIssues: string
    employeesBehind: string
    overdueItems: string
    managerEvaluationAccountability: string
    managersWithEmployeesOverdue: string
    allEmployeesWithOverdueEvaluations: string
    employeesBehindOnEvaluations: string
    noManagerIssuesFound: string
    allEmployeesUpToDate: string
    noOverdueEvaluations: string
    employeesBehindEvaluations: string
    overdueItemsCount: string
    daysOverdue: string
    switchToEmployeeList: string
    switchToManagerGroups: string
  }
  
  // User Management
  users: {
    userManagement: string
    totalUsers: string
    importUsersCSV: string
    uploadCSVFile: string
    csvFormat: string
    downloadExample: string
    databaseManagement: string
    advancedOperations: string
    openPrismaStudio: string
    searchUsers: string
    allRoles: string
    active: string
    inactive: string
    department: string
    manager: string
    manages: string
    evaluationsReceived: string
    noUsersFound: string
    uploadingProcessing: string
    successfullyImported: string
    importFailed: string
    uploadFailed: string
    basicExampleCSV: string
    advancedExampleCSV: string
    usesPersonIdMatching: string
    showsBothIdOptions: string
    fieldExplanations: string
    employeeIdExplanation: string
    personIdExplanation: string
    managerPersonIdExplanation: string
    managerEmployeeIdExplanation: string
    advanced: string
    advancedAdmin: string
    dangerZone: string
    resetDatabase: string
    resetDatabaseTitle: string
    resetDatabaseDescription: string
    resetDatabaseWarning: string
    resetDatabaseConfirm: string
    resetDatabaseButton: string
    resetSuccess: string
    resetFailed: string
    addUser: string
    editUser: string
    deleteUser: string
    exportUsers: string
    exportUsersDescription: string
    exportExcel: string
    exporting: string
    exportSuccess: string
    exportFailed: string
    // Form labels
    name: string
    email: string
    username: string
    role: string
    company: string
    employeeId: string
    position: string
    personID: string
    userType: string
    loginMethod: string
    shift: string
    activeUser: string
    password: string
    newPassword: string
    pinCode: string
    requiresPinOnly: string
    officeWorker: string
    operationalWorker: string
    selectRole: string
    selectCompany: string
    noManager: string
    createUser: string
    updateUser: string
    leaveEmptyToKeep: string
    fourDigitPin: string
    // Delete confirmation
    deleteConfirmMessage: string
    actionCannotBeUndone: string
    deleting: string
    // Interface text
    manageUsersDescription: string
    clearSearch: string
    usersCount: string
    reportsTo: string
    reports: string
    evaluations: string
    editUserTitle: string
    deleteUserTitle: string
    // Form placeholders
    enterPassword: string
    namePlaceholder: string
    emailPlaceholder: string
    usernamePlaceholder: string
    departmentPlaceholder: string
    employeeIdPlaceholder: string
    positionPlaceholder: string
    personIdPlaceholder: string
    shiftPlaceholder: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    status: {
      active: 'Active',
      inactive: 'Inactive',
      completed: 'Completed',
      pending: 'Pending',
      draft: 'Draft',
      draftReopened: 'Draft (Reopened)',
      submitted: 'Submitted',
      approved: 'Approved',
      inProgress: 'In Progress',
      notStarted: 'Not Started',
      overdue: 'Overdue',
      archived: 'Archived',
      closed: 'Closed'
    },
    ratings: {
      outstanding: 'Outstanding',
      exceedsExpectations: 'Exceeds Expectations',
      meetsExpectations: 'Meets Expectations',
      belowExpectations: 'Below Expectations',
      needsImprovement: 'Needs Improvement',
      notRated: 'Not rated'
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      submit: 'Submit',
      next: 'Next',
      previous: 'Previous',
      signOut: 'Sign Out',
      dashboard: 'Dashboard',
      back: 'Back',
      yes: 'Yes',
      no: 'No',
      standardized: 'Standardized',
      company: 'Company',
      department: 'Department',
      manager: 'Manager',
      createdBy: 'Created by',
      saving: 'Saving...',
      approving: 'Approving...',
      of: 'of',
      employees: 'employees',
      departments: 'departments',
      found: 'found',
      selected: 'selected',
      unassigned: 'Unassigned',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      noEmployeesFound: 'No employees found',
      noDepartmentsFound: 'No departments found',
      allDepartments: 'All Departments',
      hide: 'Hide',
      show: 'Show',
      view: 'View',
      approve: 'Approve',
      recall: 'Recall',
      unlock: 'Unlock',
      you: 'You have',
      remove: 'Remove',
      never: 'Never',
      created: 'Created',
      lastUsed: 'Last used',
      name: 'Name'
    },
    auth: {
      signIn: 'Sign in',
      signOut: 'Sign Out',
      emailOrUsername: 'Email or Username',
      password: 'Password',
      signingIn: 'Signing in...',
      invalidCredentials: 'Invalid credentials',
      loginFailed: 'Login failed',
      signInToAccount: 'Sign in to your account',
      demoCredentials: 'Demo Credentials',
      hr: 'HR',
      manager: 'Manager',
      employee: 'Employee',
      worker: 'Worker',
      name: 'Name',
      email: 'Email',
      role: 'Role'
    },
    nav: {
      performanceManagement: 'Performance Management',
      employeeEvaluations: 'Employee Evaluations',
      myEvaluations: 'My Evaluations',
      selectEmployee: 'Select an employee to evaluate',
      employees: 'employees',
      assignments: 'Assignments',
      welcomeBack: 'Welcome back',
      performanceHistory: 'Performance History',
      currentPeriod: 'Current Period',
      settings: 'Settings',
      evaluationComplete: 'Evaluation Complete!',
      latestPerformanceEvaluation: 'Your latest performance evaluation has been submitted and approved.',
      reviewedBy: 'Reviewed by',
      evaluatedOn: 'Evaluated on',
      evaluatedBy: 'Evaluated by {manager} on {date}',
      noEvaluationsYet: 'No Evaluations Yet',
      noPerformanceEvaluations: 'You don\'t have any performance evaluations yet. Check back later.',
      evaluationHistory: 'Evaluation History',
      viewDetails: 'View Details',
      performanceSummary: 'Performance Summary',
      awaitingYourApproval: 'Awaiting Your Approval',
      evaluationInProgress: 'Evaluation In Progress',
      managerPreparingEvaluation: 'Your performance evaluation is currently being prepared by your manager.',
      managerSubmittedEvaluation: 'Your manager has submitted your evaluation. Please review and approve it.',
      averageRating: 'Average Rating',
      completedReviews: 'Completed Reviews',
      consistentlyExceeding: '🏆 Consistently exceeding expectations in performance reviews',
      performanceOutstanding: 'Outstanding performance across all evaluations',
      performanceExceeding: 'Consistently exceeding expectations in performance reviews',
      performanceMeeting: 'Solid performance meeting expectations consistently',
      performanceImproving: 'Showing improvement in recent performance reviews',
      performanceNeedsWork: 'Focus areas identified for performance improvement'
    },
    evaluations: {
      evaluation: 'Evaluation',
      evaluateEmployee: 'Evaluate Employee',
      employeeEvaluation: 'Employee Evaluation',
      selectEmployeeToEvaluate: 'Select an employee to evaluate',
      overallPerformance: 'Overall Performance',
      overallRating: 'Overall Rating',
      overallComments: 'Overall Comments',
      submitEvaluation: 'Submit Evaluation',
      submitForApproval: 'Submit for Employee Approval',
      submitting: 'Submitting...',
      evaluationSubmittedSuccess: 'Evaluation submitted for employee approval',
      evaluationApprovedSuccess: 'Evaluation approved successfully!',
      awaitingEmployeeApproval: 'Awaiting Employee Approval',
      evaluationCompleted: 'Evaluation Completed',
      unlocking: 'Unlocking...',
      unlock: 'Unlock',
      evaluationUnlocked: 'Evaluation unlocked and returned to draft',
      progress: 'Progress',
      of: 'of',
      itemsCompleted: 'items completed',
      okr: 'OKR',
      competency: 'Competency',
      ratePerformance: 'Rate Performance',
      optionalComment: 'Optional Comment',
      provideFeedback: 'Provide an overall assessment of the employee\'s performance',
      addSpecificFeedback: 'Add specific feedback or examples...',
      teamSummary: 'Team Summary',
      pendingReviews: 'Pending Reviews',
      teamAverage: 'Team Average',
      evaluationSubmitted: 'Evaluation Submitted Successfully!',
      evaluationSubmittedDesc: 'The performance evaluation for {name} has been saved and submitted. You\'ll be redirected back to the team overview.',
      redirecting: 'Redirecting...',
      newCompanyItemsAdded: 'New company items added',
      employeeNeedReEvaluation: 'employee needs re-evaluation',
      employeesNeedReEvaluation: 'employees need re-evaluation',
      evaluationsAwaitingApproval: 'evaluations awaiting your approval',
      evaluationAwaitingApproval: 'evaluation awaiting your approval',
      comments: 'Comments',
      minimumCharacters: 'Minimum {count} characters',
      tapToRate: 'Tap a star to rate this item',
      commentPlaceholder: 'Provide specific feedback and examples...',
      commentGuidance: 'Include specific examples and actionable suggestions.'
    },
    speech: {
      startRecording: 'Start voice recording',
      stopRecording: 'Stop recording',
      tapToSpeak: 'Tap microphone to dictate',
      microphoneAccess: 'Microphone access denied. Please allow microphone access.',
      networkError: 'Network error. Please check your internet connection.',
      noSpeechDetected: 'No speech detected. Please try again.',
      audioNotSupported: 'No microphone found. Please check your audio settings.',
      speakNow: 'Speak now...',
      speechNotSupported: 'Speech recognition is not supported in this browser',
      transcriptionError: 'Speech recognition error. Please try again.',
      lengthExceeded: 'Text exceeds the maximum length limit'
    },
    biometric: {
      setup: 'Set up',
      use: 'Use',
      setupSuccess: 'Biometric authentication set up successfully',
      loginSuccess: 'Biometric authentication successful',
      notSupported: 'Biometric authentication is not supported on this device',
      cancelled: 'Biometric authentication was cancelled',
      failed: 'Biometric authentication failed',
      httpsRequired: 'HTTPS required for biometric authentication',
      credentialExists: 'Biometric credential already exists for this account',
      noCredentials: 'No biometric credentials found for this account',
      tapToSetup: 'Tap to set up biometric authentication',
      tapToAuth: 'Tap to authenticate with biometrics',
      settingUp: 'Setting up...',
      authenticating: 'Authenticating...',
      faceIdTouchId: 'Face ID / Touch ID',
      touchId: 'Touch ID',
      fingerprint: 'Fingerprint',
      biometric: 'Biometric Authentication',
      userInfoRequired: 'User information required for biometric setup',
      authentication: 'Biometric Authentication',
      settingsDescription: 'Manage your biometric authentication methods for secure login',
      addNew: 'Add New Biometric Authentication',
      existingCredentials: 'Your Biometric Credentials',
      confirmRemove: 'Are you sure you want to remove this biometric credential?',
      removeSuccess: 'Biometric credential removed successfully',
      faceId: 'Face ID'
    },
    settings: {
      profile: 'Profile',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      passwordsMatch: 'Passwords must match',
      passwordUpdated: 'Password updated successfully',
      passwordSecurityNote: 'Security Note: Your new password should be at least 8 characters long and contain a mix of letters, numbers, and symbols.'
    },
    assignments: {
      assignmentManager: 'Assignment Manager',
      manageOKRsCompetencies: 'Manage OKRs & Competencies',
      companyWideItems: 'Company-Wide Items',
      companyWideDescription: 'These items are set by HR and automatically applied to all employees. You cannot modify these assignments.',
      appliedToAllEmployees: 'Applied to: All Employees',
      selectEmployeesForBatch: 'Select Employees for Batch Assignment',
      selectEmployees: 'Select employees',
      itemsAssigned: 'items assigned',
      employeesSelected: 'employee(s) selected for batch assignment',
      assignToSelected: 'Assign to Selected',
      individualAssignments: 'Individual Assignments',
      individualDescription: 'Create and assign specific OKRs/competencies to individual employees based on their role and development needs.',
      comingSoon: 'Individual assignment interface coming soon...',
      createNewDepartmentItems: 'Create New Department Items',
      newOKR: 'New OKR',
      newCompetency: 'New Competency',
      create: 'Create',
      evaluationDeadline: 'Evaluation Deadline (Optional)',
      departmentLevelAssignments: 'Department-Level Assignments',
      departmentDescription: 'These items are created by managers and applied to employees within specific departments.',
      currentlyAssignedTo: 'Currently assigned to'
    },
    companyItems: {
      title: 'Company-Wide Items',
      subtitle: 'items applied to all employees',
      infoTitle: 'Company-Wide Items',
      infoDescription: 'Items created here are automatically applied to all employees across all departments. Only HR can create and manage these items.',
      createNewTitle: 'Create New Company-Wide Items',
      newCompanyOKR: 'New Company OKR',
      newCompanyCompetency: 'New Company Competency',
      existingItemsTitle: 'Existing Company Items',
      itemsAppliedToAll: 'items applied to all employees',
      objective: 'Objective',
      competencyName: 'Competency Name',
      keyResults: 'Key Results',
      description: 'Description',
      activate: 'Activate',
      deactivate: 'Deactivate',
      active: 'Active',
      inactive: 'Inactive',
      createdBy: 'Created by',
      appliedToAllEmployees: 'Applied to all employees',
      noItemsTitle: 'No company-wide items yet',
      noItemsDescription: 'Create your first company-wide OKR or competency to get started.',
      companyOKR: 'Company OKR',
      companyCompetency: 'Company Competency',
      companyWide: 'Company-Wide',
      confirmDeactivate: 'Deactivate Company-Wide',
      confirmActivate: 'Activate Company-Wide', 
      deactivateWarning: 'This will remove the item from ALL employee evaluations company-wide.',
      activateWarning: 'This will make the item available for ALL employees company-wide.'
    },
    okrs: {
      objective: 'Objective',
      keyResults: 'Key Results'
    },
    dashboard: {
      hrDashboard: 'HR Dashboard',
      q1Reviews: 'Q1 2024 Performance Reviews',
      newEvaluation: 'New Evaluation',
      completionStatus: 'Completion Status',
      complete: 'Complete',
      completed: 'Completed',
      remaining: 'Remaining',
      overdueEvaluations: 'Overdue Evaluations',
      pastDueDate: 'These evaluations are past their due date',
      sendReminders: 'Send Reminders',
      dueSoon: 'Due Soon',
      dueWithinDays: 'Due within the next 3 days',
      viewList: 'View List',
      ratingDistribution: 'Rating Distribution',
      generalResults: 'General Results',
      outstanding: 'Outstanding (5)',
      exceeds: 'Exceeds (4)',
      meets: 'Meets (3)',
      below: 'Below (2)',
      needsImprovement: 'Needs Improvement (1)',
      quickActions: 'Quick Actions',
      administrativeActions: 'Administrative Actions',
      generateReports: 'Generate Reports',
      exportPDF: 'Export PDF',
      pdfExportCenter: 'Report Downloads',
      exportCenter: 'Export Center',
      selectReportsToExport: 'Select the reports you want to export',
      selectReportsAndFormats: 'Choose reports and formats to export',
      companyOverview: 'Company Overview',
      allEmployeesAllDepartments: 'All employees across all departments',
      departmentSummary: 'Department Summary',
      departmentBreakdown: 'Performance breakdown by department',
      topPerformers: 'Top Performers',
      highestRatedEmployees: 'Employees with ratings 4-5',
      needsAttention: 'Needs Attention',
      employeesNeedingSupport: 'Employees with ratings 1-2',
      managerReports: 'Manager Reports',
      reportsGroupedByManager: 'Performance reports grouped by manager',
      customSelection: 'Custom Selection',
      selectSpecificEmployees: 'Choose specific employees or departments',
      reportsSelected: 'reports selected',
      exporting: 'Exporting...',
      exportSelected: 'Export Selected',
      exportError: 'Export Error',
      evaluationNotFound: 'Evaluation not found or access denied',
      accessDenied: 'Access denied',
      exportFailed: 'Export failed',
      noEvaluationsFound: 'No evaluations found',
      hrRoleRequired: 'Access denied - HR role required',
      managerOrHrRequired: 'Access denied - Manager or HR role required',
      allPeriods: 'All Periods',
      manageUsers: 'Manage Users',
      startEvaluating: 'Start Evaluating',
      lastUpdated: 'Last updated',
      newCycle: 'New Cycle',
      cycleName: 'Cycle Name',
      startDate: 'Start Date',
      endDate: 'End Date',
      createCycle: 'Create Cycle',
      // Department ratings page
      departmentRatings: 'Department Ratings',
      performanceInsights: 'Performance Insights',
      totalEvaluations: 'Total Evaluations',
      completeDepartments: 'Complete Departments',
      departmentsNeedAttention: 'departments need attention',
      swipeForDetails: 'Swipe down for details →',
      noManager: 'No Manager',
      notAssigned: 'Not assigned',
      employees: 'Employees',
      evaluated: 'Evaluated',
      pending: 'Pending',
      performanceDistribution: 'Performance Distribution',
      evaluations: 'evaluations',
      outstandingShort: 'Outstanding',
      exceedsShort: 'Exceeds',
      meetsShort: 'Meets',
      belowShort: 'Below',
      needsImprovementShort: 'Need Attention',
      needAttention: 'need attention',
      noCompletedEvaluations: 'No completed evaluations yet',
      evaluationsWillAppear: 'Evaluations will appear here once submitted',
      noDepartmentsFound: 'No Departments Found',
      addEmployeesWithDepartments: 'Add employees with departments to see rating distributions',
      employeesNeedReview: 'employees need review',
      allEmployees: 'all employees',
      viewAllEmployees: 'View all employees in this department',
      pendingEvaluations: 'Pending Evaluations',
      managePendingEvaluations: 'Manage Pending Evaluations',
      employeesWithoutEvaluations: 'employees without evaluations',
      startEvaluation: 'Start Evaluation',
      searchEmployees: 'Search employees...',
      searchEmployeesManagers: 'Search employees, managers...',
      allEvaluationsCompleted: 'All evaluations completed!',
      excellentWork: 'Excellent work! All employees have been evaluated.',
      noManagerAssigned: 'No manager assigned',
      viewResults: 'View Results',
      scheduleOneOnOnes: 'Consider scheduling 1:1 meetings with these employees',
      viewCompletedEvaluations: 'View the {count} completed evaluations',
      // Evaluation summary page
      okrAverage: 'OKR Average',
      competencyAverage: 'Competency Average',
      totalAverage: 'Total Average',
      objectives: 'objectives',
      skills: 'skills',
      items: 'items',
      managerComments: 'Manager Comments',
      feedback: 'Feedback',
      companyLevel: 'Company',
      departmentLevel: 'Department',
      managerLevel: 'Manager',
      searchDepartments: 'Search departments...',
      allDepartments: 'All Departments',
      allStatus: 'All Status',
      hasEvaluation: 'Has Evaluation',
      noEvaluation: 'No Evaluation',
      partial: 'Partial',
      closedOn: 'Closed on',
      performanceCycleClosedHR: 'is closed. You can still make partial assessments, but managers cannot edit evaluations.',
      performanceCycleClosedManager: 'is closed. All evaluations are now read-only.',
      performanceCycleArchived: 'is archived. All data is read-only for historical reference.',
      performanceCycleRestricted: 'has restricted access.',
      // Deadlines page
      all: 'All',
      overdue: 'Overdue',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority',
      department: 'Department',
      manager: 'Manager',
      dueThisWeek: 'due this week',
      createdBy: 'Created by',
      deadlineSetBy: 'Deadline set by',
      noDeadline: 'No deadline',
      allEvaluationItems: 'All Evaluation Items',
      itemsWithDeadlines: 'items with deadlines',
      daysRemaining: 'days remaining',
      dayRemaining: 'day remaining',
      dayOverdue: 'day overdue',
      dueToday: 'Due today',
      companyWideItems: 'Add/Remove Company OKRs and Competencies',
      auditLogs: 'Audit Logs',
      auditDashboard: 'Audit Dashboard',
      auditDescription: 'Security and compliance tracking',
      auditFilters: 'Filters',
      allActions: 'All Actions',
      allTypes: 'All Types',
      clearFilters: 'Clear Filters',
      showDetails: 'Show Details',
      hideDetails: 'Hide Details',
      auditDetails: 'Audit Log Details',
      exportExcel: 'Export Excel',
      showingOf: 'Showing',
      noAuditLogs: 'No audit logs found matching your filters',
      timestamp: 'Timestamp',
      user: 'User',
      action: 'Action',
      entity: 'Entity',
      details: 'Details',
      ipAddress: 'IP Address',
      reason: 'Reason',
      oldData: 'Old Data',
      newData: 'New Data',
      metadata: 'Metadata',
      managersWithIssues: 'Managers with Issues',
      employeesBehind: 'Employees Behind',
      overdueItems: 'Overdue Items', 
      managerEvaluationAccountability: 'Employees with Overdue OKRs or Competencies',
      managersWithEmployeesOverdue: 'Employees with overdue OKRs or competencies',
      allEmployeesWithOverdueEvaluations: 'All Employees with Overdue OKRs or Competencies',
      employeesBehindOnEvaluations: 'employees with overdue OKRs or competencies',
      noManagerIssuesFound: 'No Manager Issues Found',
      allEmployeesUpToDate: 'All employees are up to date with their evaluations.',
      noOverdueEvaluations: 'No Overdue Evaluations',
      employeesBehindEvaluations: 'employees behind',
      overdueItemsCount: 'overdue items',
      daysOverdue: 'days overdue',
      switchToEmployeeList: 'Complete List',
      switchToManagerGroups: 'Group by Manager',
      creating: 'Creating...',
      overdueDrafts: 'Overdue Draft Evaluations',
      pendingApprovals: 'Pending Employee Approvals',
      daysPending: 'days ago',
      submittedBy: 'Submitted by',
      overdue3Days: '>3 days',
      viewAll: 'View all',
      cycles: 'Cycles',
      performanceCycles: 'Performance Cycles',
      cycleManagement: 'Manage performance review cycles',
      activeCycle: 'Active',
      closedCycle: 'Closed',
      archivedCycle: 'Archived',
      active: 'ACTIVE',
      closed: 'CLOSED',
      archived: 'ARCHIVED',
      evaluationsText: 'evaluations',
      itemsText: 'items',
      assessmentsText: 'assessments',
      manageCycles: 'Manage Cycles',
      cycleStatus: 'Status',
      cycleClosedBy: 'Closed by',
      cycleClosedAt: 'on',
      reopenCycle: 'Reopen cycle',
      closeCycle: 'Close cycle',
      archiveCycle: 'Archive cycle',
      deleteCycle: 'Delete cycle',
      confirmClose: 'Are you sure you want to close this cycle? This will make all evaluations read-only for managers.',
      confirmReopen: 'Are you sure you want to reopen this cycle? This will allow managers to edit evaluations again.',
      confirmArchive: 'Are you sure you want to archive this cycle?',
      confirmDelete: 'Are you sure you want to delete',
      closeWarning: 'This will make all evaluations read-only for managers.',
      reopenWarning: 'This will allow managers to edit evaluations again.',
      deleteWarning: 'Cycles with data cannot be deleted. Consider archiving instead.',
      onlyOneActive: 'Only one active cycle is allowed at a time. Please close the current active cycle first.',
      cannotDeleteData: 'This cycle contains data and cannot be deleted.',
      dateRange: 'Date Range',
      exportAllPDF: 'Export All as PDF',
      exportAllExcel: 'Export All as Excel',
      clearAll: 'Clear All'
    },
    users: {
      userManagement: 'User Management',
      totalUsers: 'total users',
      importUsersCSV: 'Import Users from CSV',
      uploadCSVFile: 'Upload CSV File',
      csvFormat: 'CSV Format:',
      downloadExample: 'Download example CSV file',
      databaseManagement: 'Database Management',
      advancedOperations: 'Use Prisma Studio for advanced database operations and direct editing',
      openPrismaStudio: 'Open Prisma Studio',
      searchUsers: 'Search users...',
      allRoles: 'All Roles',
      active: 'Active',
      inactive: 'Inactive',
      department: 'Department',
      manager: 'Manager',
      manages: 'Manages',
      evaluationsReceived: 'evaluations received',
      noUsersFound: 'No users found matching your criteria',
      uploadingProcessing: 'Uploading and processing...',
      successfullyImported: 'Successfully imported',
      importFailed: 'Import failed',
      uploadFailed: 'Upload failed',
      basicExampleCSV: 'Basic Example CSV',
      advancedExampleCSV: 'Advanced Example CSV',
      usesPersonIdMatching: 'Uses PersonID for manager matching',
      showsBothIdOptions: 'Shows both PersonID and EmployeeID options',
      fieldExplanations: 'Field Explanations:',
      employeeIdExplanation: 'Company-assigned ID (EMP001, MGR001) - Required for HRIS integration',
      personIdExplanation: 'National ID/Cédula - Legally unique identifier',
      managerPersonIdExplanation: 'Manager\'s National ID for hierarchy',
      managerEmployeeIdExplanation: 'Alternative: Manager\'s Employee ID',
      advanced: 'Advanced',
      advancedAdmin: 'Advanced Administration',
      dangerZone: 'Danger Zone',
      resetDatabase: 'Reset Database',
      resetDatabaseTitle: 'Complete Database Reset',
      resetDatabaseDescription: 'This will permanently delete ALL data including users, evaluations, companies, and performance cycles. This action cannot be undone.',
      resetDatabaseWarning: 'WARNING: This action will destroy all data and cannot be reversed!',
      resetDatabaseConfirm: 'Type "RESET" to confirm this destructive action',
      resetDatabaseButton: 'Reset Everything',
      resetSuccess: 'Database reset successfully',
      resetFailed: 'Database reset failed',
      addUser: 'Add User',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      exportUsers: 'Export All Users',
      exportUsersDescription: 'Download complete user information as Excel file',
      exportExcel: 'Export Excel',
      exporting: 'Exporting...',
      exportSuccess: 'Users exported successfully',
      exportFailed: 'Export failed',
      // Form labels
      name: 'Name',
      email: 'Email',
      username: 'Username',
      role: 'Role',
      company: 'Company',
      employeeId: 'Employee ID',
      position: 'Position',
      personID: 'National ID (Person ID)',
      userType: 'User Type',
      loginMethod: 'Login Method',
      shift: 'Shift',
      activeUser: 'Active User',
      password: 'Password',
      newPassword: 'New Password (leave empty to keep current)',
      pinCode: 'PIN Code (4 digits)',
      requiresPinOnly: 'Requires PIN Only (no password)',
      officeWorker: 'Office Worker',
      operationalWorker: 'Operational Worker',
      selectRole: 'Select Role',
      selectCompany: 'Select Company',
      noManager: 'No Manager',
      createUser: 'Create User',
      updateUser: 'Update User',
      leaveEmptyToKeep: 'leave empty to keep current',
      fourDigitPin: '4-digit PIN',
      // Delete confirmation
      deleteConfirmMessage: 'Are you sure you want to delete',
      actionCannotBeUndone: 'This action cannot be undone.',
      deleting: 'Deleting...',
      // Interface text
      manageUsersDescription: 'Manage company users and permissions',
      clearSearch: 'Clear search',
      usersCount: 'Users',
      reportsTo: 'Reports to:',
      reports: 'reports',
      evaluations: 'evaluations',
      editUserTitle: 'Edit user',
      deleteUserTitle: 'Delete user',
      // Form placeholders
      enterPassword: 'Enter password',
      namePlaceholder: 'John Smith',
      emailPlaceholder: 'john@company.com',
      usernamePlaceholder: 'john.smith',
      departmentPlaceholder: 'Operations, Sales, HR...',
      employeeIdPlaceholder: 'EMP001, MGR002...',
      positionPlaceholder: 'Executive Chef, Front Desk Agent, Manager...',
      personIdPlaceholder: 'Cédula, DNI, National ID...',
      shiftPlaceholder: 'Morning, Night, Rotating...'
    }
  },
  es: {
    status: {
      active: 'Activo',
      inactive: 'Inactivo',
      completed: 'Completado',
      pending: 'Pendiente',
      draft: 'Borrador',
      draftReopened: 'Borrador (Reabierto)',
      submitted: 'Enviado',
      approved: 'Aprobado',
      inProgress: 'En Progreso',
      notStarted: 'Sin Iniciar',
      overdue: 'Vencido',
      archived: 'Archivado',
      closed: 'Cerrado'
    },
    ratings: {
      outstanding: 'Excepcional',
      exceedsExpectations: 'Supera las Expectativas',
      meetsExpectations: 'Cumple las Expectativas',
      belowExpectations: 'Por Debajo de las Expectativas',
      needsImprovement: 'Necesita Mejorar',
      notRated: 'Sin calificar'
    },
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      submit: 'Enviar',
      next: 'Siguiente',
      previous: 'Anterior',
      signOut: 'Cerrar Sesión',
      dashboard: 'Panel de Control',
      back: 'Atrás',
      yes: 'Sí',
      no: 'No',
      standardized: 'Estandarizado',
      company: 'Empresa',
      department: 'Departamento',
      manager: 'Jefatura',
      createdBy: 'Creado por',
      saving: 'Guardando...',
      approving: 'Aprobando...',
      of: 'de',
      employees: 'empleados',
      departments: 'departamentos',
      found: 'encontrados',
      selected: 'seleccionados',
      unassigned: 'Sin Asignar',
      selectAll: 'Seleccionar Todo',
      deselectAll: 'Deseleccionar Todo',
      noEmployeesFound: 'No se encontraron empleados',
      noDepartmentsFound: 'No se encontraron departamentos',
      allDepartments: 'Todos los Departamentos',
      hide: 'Ocultar',
      show: 'Mostrar',
      view: 'Ver',
      approve: 'Aprobar',
      recall: 'Recuperar',
      unlock: 'Desbloquear',
      you: 'Tienes',
      remove: 'Eliminar',
      never: 'Nunca',
      created: 'Creado',
      lastUsed: 'Último uso',
      name: 'Nombre'
    },
    auth: {
      signIn: 'Iniciar sesión',
      signOut: 'Cerrar Sesión',
      emailOrUsername: 'Email o Usuario',
      password: 'Contraseña',
      signingIn: 'Iniciando sesión...',
      invalidCredentials: 'Credenciales inválidas',
      loginFailed: 'Error de inicio de sesión',
      signInToAccount: 'Inicia sesión en tu cuenta',
      demoCredentials: 'Credenciales de Demo',
      hr: 'RRHH',
      manager: 'Jefatura',
      employee: 'Colaborador',
      worker: 'Trabajador',
      name: 'Nombre',
      email: 'Email',
      role: 'Rol'
    },
    nav: {
      performanceManagement: 'Gestión de Desempeño',
      employeeEvaluations: 'Evaluaciones de Colaboradores',
      myEvaluations: 'Mis Evaluaciones',
      selectEmployee: 'Selecciona un empleado para evaluar',
      employees: 'empleados',
      assignments: 'Asignaciones',
      welcomeBack: 'Bienvenido de vuelta',
      performanceHistory: 'Historial de Desempeño',
      currentPeriod: 'Período Actual',
      settings: 'Configuración',
      evaluationComplete: '¡Evaluación Completada!',
      latestPerformanceEvaluation: 'Tu última evaluación de desempeño ha sido enviada y aprobada.',
      reviewedBy: 'Revisado por',
      evaluatedOn: 'Evaluado el',
      evaluatedBy: 'Evaluado por {manager} el {date}',
      noEvaluationsYet: 'Aún No Hay Evaluaciones',
      noPerformanceEvaluations: 'Aún no tienes ninguna evaluación de desempeño. Vuelve a revisar más tarde.',
      evaluationHistory: 'Historial de Evaluaciones',
      viewDetails: 'Ver Detalles',
      performanceSummary: 'Resumen de Desempeño',
      awaitingYourApproval: 'Esperando Tu Aprobación',
      evaluationInProgress: 'Evaluación en Progreso',
      managerPreparingEvaluation: 'Tu evaluación de desempeño está siendo preparada por tu jefatura.',
      managerSubmittedEvaluation: 'Tu jefatura ha enviado tu evaluación. Por favor revísala y apruébala.',
      averageRating: 'Calificación Promedio',
      completedReviews: 'Revisiones Completadas',
      consistentlyExceeding: '🏆 Consistentemente superando expectativas en las evaluaciones de desempeño',
      performanceOutstanding: 'Rendimiento excepcional en todas las evaluaciones',
      performanceExceeding: 'Consistentemente superando expectativas en las evaluaciones de desempeño',
      performanceMeeting: 'Rendimiento sólido cumpliendo expectativas consistentemente',
      performanceImproving: 'Mostrando mejora en las evaluaciones de desempeño recientes',
      performanceNeedsWork: 'Áreas de enfoque identificadas para mejora del desempeño'
    },
    evaluations: {
      evaluation: 'Evaluación',
      evaluateEmployee: 'Evaluar Colaborador',
      employeeEvaluation: 'Evaluación de Colaborador',
      selectEmployeeToEvaluate: 'Selecciona un empleado para evaluar',
      overallPerformance: 'Desempeño General',
      overallRating: 'Calificación General',
      overallComments: 'Comentarios Generales',
      submitEvaluation: 'Enviar Evaluación',
      submitForApproval: 'Enviar para Aprobación del Empleado',
      submitting: 'Enviando...',
      evaluationSubmittedSuccess: 'Evaluación enviada para aprobación del empleado',
      evaluationApprovedSuccess: '¡Evaluación aprobada exitosamente!',
      awaitingEmployeeApproval: 'Esperando Aprobación del Empleado',
      evaluationCompleted: 'Evaluación Completada',
      unlocking: 'Desbloqueando...',
      unlock: 'Desbloquear',
      evaluationUnlocked: 'Evaluación desbloqueada y devuelta a borrador',
      progress: 'Progreso',
      of: 'de',
      itemsCompleted: 'elementos completados',
      okr: 'OKR',
      competency: 'Competencia',
      ratePerformance: 'Calificar Desempeño',
      optionalComment: 'Comentario Opcional',
      provideFeedback: 'Proporciona una evaluación general del desempeño del empleado',
      addSpecificFeedback: 'Añade comentarios específicos o ejemplos...',
      teamSummary: 'Resumen del Equipo',
      pendingReviews: 'Revisiones Pendientes',
      teamAverage: 'Promedio del Equipo',
      evaluationSubmitted: '¡Evaluación Enviada Exitosamente!',
      evaluationSubmittedDesc: 'La evaluación de desempeño de {name} ha sido guardada y enviada. Serás redirigido de vuelta al resumen del equipo.',
      redirecting: 'Redirigiendo...',
      newCompanyItemsAdded: 'Nuevos elementos de empresa agregados',
      employeeNeedReEvaluation: 'empleado necesita re-evaluación',
      employeesNeedReEvaluation: 'empleados necesitan re-evaluación',
      evaluationsAwaitingApproval: 'evaluaciones esperando tu aprobación',
      evaluationAwaitingApproval: 'evaluación esperando tu aprobación',
      comments: 'Comentarios',
      minimumCharacters: 'Mínimo {count} caracteres',
      tapToRate: 'Toca una estrella para calificar',
      commentPlaceholder: 'Proporciona comentarios específicos y ejemplos...',
      commentGuidance: 'Incluye ejemplos específicos y sugerencias prácticas.'
    },
    speech: {
      startRecording: 'Iniciar grabación de voz',
      stopRecording: 'Detener grabación',
      tapToSpeak: 'Toca el micrófono para dictar',
      microphoneAccess: 'Acceso al micrófono denegado. Por favor permite el acceso al micrófono.',
      networkError: 'Error de red. Por favor verifica tu conexión a internet.',
      noSpeechDetected: 'No se detectó voz. Por favor intenta de nuevo.',
      audioNotSupported: 'No se encontró micrófono. Por favor verifica tu configuración de audio.',
      speakNow: 'Habla ahora...',
      speechNotSupported: 'El reconocimiento de voz no es compatible con este navegador',
      transcriptionError: 'Error de reconocimiento de voz. Por favor intenta de nuevo.',
      lengthExceeded: 'El texto excede el límite máximo de longitud'
    },
    biometric: {
      setup: 'Configurar',
      use: 'Usar',
      setupSuccess: 'Autenticación biométrica configurada exitosamente',
      loginSuccess: 'Autenticación biométrica exitosa',
      notSupported: 'La autenticación biométrica no es compatible con este dispositivo',
      cancelled: 'La autenticación biométrica fue cancelada',
      failed: 'Falló la autenticación biométrica',
      httpsRequired: 'HTTPS requerido para autenticación biométrica',
      credentialExists: 'Ya existe una credencial biométrica para esta cuenta',
      noCredentials: 'No se encontraron credenciales biométricas para esta cuenta',
      tapToSetup: 'Toca para configurar autenticación biométrica',
      tapToAuth: 'Toca para autenticarte con biometría',
      settingUp: 'Configurando...',
      authenticating: 'Autenticando...',
      faceIdTouchId: 'Face ID / Touch ID',
      touchId: 'Touch ID',
      fingerprint: 'Huella Digital',
      biometric: 'Autenticación Biométrica',
      userInfoRequired: 'Información de usuario requerida para configurar autenticación biométrica',
      authentication: 'Autenticación Biométrica',
      settingsDescription: 'Gestiona tus métodos de autenticación biométrica para inicio de sesión seguro',
      addNew: 'Agregar Nueva Autenticación Biométrica',
      existingCredentials: 'Tus Credenciales Biométricas',
      confirmRemove: '¿Estás seguro de que deseas eliminar esta credencial biométrica?',
      removeSuccess: 'Credencial biométrica eliminada exitosamente',
      faceId: 'Face ID'
    },
    settings: {
      profile: 'Perfil',
      editProfile: 'Editar Perfil',
      changePassword: 'Cambiar Contraseña',
      currentPassword: 'Contraseña Actual',
      newPassword: 'Nueva Contraseña',
      confirmPassword: 'Confirmar Nueva Contraseña',
      passwordsMatch: 'Las contraseñas deben coincidir',
      passwordUpdated: 'Contraseña actualizada exitosamente',
      passwordSecurityNote: 'Nota de Seguridad: Su nueva contraseña debe tener al menos 8 caracteres e incluir una combinación de letras, números y símbolos.'
    },
    assignments: {
      assignmentManager: 'Gestor de Asignaciones',
      manageOKRsCompetencies: 'Gestionar OKRs y Competencias',
      companyWideItems: 'Elementos de Toda la Empresa',
      companyWideDescription: 'Estos elementos son establecidos por RRHH y se aplican automáticamente a todos los empleados. No puedes modificar estas asignaciones.',
      appliedToAllEmployees: 'Aplicado a: Todos los Colaboradores',
      selectEmployeesForBatch: 'Seleccionar Colaboradores para Asignación Masiva',
      selectEmployees: 'Seleccionar empleados',
      itemsAssigned: 'elementos asignados',
      employeesSelected: 'empleado(s) seleccionado(s) para asignación masiva',
      assignToSelected: 'Asignar a Seleccionados',
      individualAssignments: 'Asignaciones Individuales',
      individualDescription: 'Crear y asignar OKRs/competencias específicos a empleados individuales basándose en su rol y necesidades de desarrollo.',
      comingSoon: 'La interfaz de asignación individual estará disponible pronto...',
      createNewDepartmentItems: 'Crear Nuevos Elementos Departamentales',
      newOKR: 'Nuevo OKR',
      newCompetency: 'Nueva Competencia',
      create: 'Crear',
      evaluationDeadline: 'Fecha Límite de Evaluación (Opcional)',
      departmentLevelAssignments: 'Asignaciones de Nivel Departamental',
      departmentDescription: 'Estos elementos son creados por gerentes y aplicados a empleados dentro de departamentos específicos.',
      currentlyAssignedTo: 'Actualmente asignado a'
    },
    companyItems: {
      title: 'Elementos de Toda la Empresa',
      subtitle: 'elementos aplicados a todos los colaboradores',
      infoTitle: 'Elementos de Toda la Empresa',
      infoDescription: 'Los elementos creados aquí se aplican automáticamente a todos los colaboradores en todos los departamentos. Solo RRHH puede crear y gestionar estos elementos.',
      createNewTitle: 'Crear Nuevos Elementos de Toda la Empresa',
      newCompanyOKR: 'Nuevo OKR de Empresa',
      newCompanyCompetency: 'Nueva Competencia de Empresa',
      existingItemsTitle: 'Elementos Existentes de la Empresa',
      itemsAppliedToAll: 'elementos aplicados a todos los colaboradores',
      objective: 'Objetivo',
      competencyName: 'Nombre de la Competencia',
      keyResults: 'Resultados Clave',
      description: 'Descripción',
      activate: 'Activar',
      deactivate: 'Desactivar',
      active: 'Activo',
      inactive: 'Inactivo',
      createdBy: 'Creado por',
      appliedToAllEmployees: 'Aplicado a todos los colaboradores',
      noItemsTitle: 'Aún no hay elementos de toda la empresa',
      noItemsDescription: 'Crea tu primer OKR o competencia de toda la empresa para comenzar.',
      companyOKR: 'OKR de Empresa',
      companyCompetency: 'Competencia de Empresa',
      companyWide: 'Toda la Empresa',
      confirmDeactivate: 'Desactivar de Toda la Empresa',
      confirmActivate: 'Activar para Toda la Empresa',
      deactivateWarning: 'Esto eliminará el elemento de TODAS las evaluaciones de colaboradores en toda la empresa.',
      activateWarning: 'Esto hará que el elemento esté disponible para TODOS los colaboradores en toda la empresa.'
    },
    okrs: {
      objective: 'Objetivo',
      keyResults: 'Resultados Clave'
    },
    dashboard: {
      hrDashboard: 'Panel de RRHH',
      q1Reviews: 'Evaluaciones de Desempeño Q1 2024',
      newEvaluation: 'Nueva Evaluación',
      completionStatus: 'Estatus de Avance',
      complete: 'Completo',
      completed: 'Completadas',
      remaining: 'Pendientes',
      overdueEvaluations: 'Evaluaciones Vencidas',
      pastDueDate: 'Estas evaluaciones han pasado su fecha límite',
      sendReminders: 'Enviar Recordatorios',
      dueSoon: 'Próximas a Vencer',
      dueWithinDays: 'Vencen en los próximos 3 días',
      viewList: 'Ver Lista',
      ratingDistribution: 'Distribución de Calificaciones',
      generalResults: 'Resultados Generales',
      outstanding: 'Excepcional (5)',
      exceeds: 'Supera (4)',
      meets: 'Cumple (3)',
      below: 'Por Debajo (2)',
      needsImprovement: 'Necesita Mejorar (1)',
      quickActions: 'Acciones Rápidas',
      administrativeActions: 'Acciones Administrativas',
      generateReports: 'Generar Reportes',
      exportPDF: 'Exportar PDF',
      pdfExportCenter: 'Descarga de reportes',
      exportCenter: 'Centro de Exportación',
      selectReportsToExport: 'Selecciona los reportes que deseas exportar',
      selectReportsAndFormats: 'Elige reportes y formatos para exportar',
      companyOverview: 'Resumen de Empresa',
      allEmployeesAllDepartments: 'Todos los empleados de todos los departamentos',
      departmentSummary: 'Resumen por Departamento',
      departmentBreakdown: 'Desglose de desempeño por departamento',
      topPerformers: 'Mejores Desempeños',
      highestRatedEmployees: 'Empleados con calificaciones 4-5',
      needsAttention: 'Requiere Atención',
      employeesNeedingSupport: 'Empleados con calificaciones 1-2',
      managerReports: 'Reportes de Jefatura',
      reportsGroupedByManager: 'Reportes de desempeño agrupados por jefatura',
      customSelection: 'Selección Personalizada',
      selectSpecificEmployees: 'Elegir empleados o departamentos específicos',
      reportsSelected: 'reportes seleccionados',
      exporting: 'Exportando...',
      exportSelected: 'Exportar Seleccionados',
      exportError: 'Error de Exportación',
      evaluationNotFound: 'Evaluación no encontrada o acceso denegado',
      accessDenied: 'Acceso denegado',
      exportFailed: 'Error en la exportación',
      noEvaluationsFound: 'No se encontraron evaluaciones',
      hrRoleRequired: 'Acceso denegado - Se requiere rol de RRHH',
      managerOrHrRequired: 'Acceso denegado - Se requiere rol de Jefatura o RRHH',
      allPeriods: 'Todos los Períodos',
      manageUsers: 'Gestionar Usuarios',
      startEvaluating: 'Comenzar Evaluación',
      lastUpdated: 'Última actualización',
      newCycle: 'Nuevo Ciclo',
      cycleName: 'Nombre del Ciclo',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      createCycle: 'Crear Ciclo',
      creating: 'Creando...',
      overdueDrafts: 'Borradores de Evaluación Vencidos',
      pendingApprovals: 'Aprobaciones de Empleados Pendientes',
      daysPending: 'días atrás',
      submittedBy: 'Enviado por',
      overdue3Days: '>3 días',
      viewAll: 'Ver todo',
      companyWideItems: 'Agregar/Eliminar OKRs y Competencias de la Empresa',
      auditLogs: 'Registros de Auditoría',
      auditDashboard: 'Panel de Auditoría',
      auditDescription: 'Seguimiento de seguridad y cumplimiento',
      auditFilters: 'Filtros',
      allActions: 'Todas las Acciones',
      allTypes: 'Todos los Tipos',
      clearFilters: 'Limpiar Filtros',
      showDetails: 'Ver Detalles',
      hideDetails: 'Ocultar Detalles',
      auditDetails: 'Detalles del Registro',
      exportExcel: 'Exportar Excel',
      showingOf: 'Mostrando',
      noAuditLogs: 'No se encontraron registros con los filtros aplicados',
      timestamp: 'Fecha y Hora',
      user: 'Usuario',
      action: 'Acción',
      entity: 'Entidad',
      details: 'Detalles',
      ipAddress: 'Dirección IP',
      reason: 'Razón',
      oldData: 'Datos Anteriores',
      newData: 'Datos Nuevos',
      metadata: 'Metadatos',
      cycles: 'Ciclos',
      performanceCycles: 'Ciclos de Desempeño',
      cycleManagement: 'Gestionar ciclos de evaluación de desempeño',
      activeCycle: 'Activo',
      closedCycle: 'Cerrado',
      archivedCycle: 'Archivado',
      active: 'ACTIVO',
      closed: 'CERRADO',
      archived: 'ARCHIVADO',
      evaluationsText: 'evaluaciones',
      itemsText: 'elementos',
      assessmentsText: 'evaluaciones',
      manageCycles: 'Gestionar Ciclos',
      cycleStatus: 'Estado',
      cycleClosedBy: 'Cerrado por',
      cycleClosedAt: 'el',
      reopenCycle: 'Reabrir ciclo',
      closeCycle: 'Cerrar ciclo',
      archiveCycle: 'Archivar ciclo',
      deleteCycle: 'Eliminar ciclo',
      confirmClose: '¿Estás seguro de que quieres cerrar este ciclo? Esto hará que todas las evaluaciones sean de solo lectura para las jefaturas.',
      confirmReopen: '¿Estás seguro de que quieres reabrir este ciclo? Esto permitirá que las jefaturas editen las evaluaciones nuevamente.',
      confirmArchive: '¿Estás seguro de que quieres archivar este ciclo?',
      confirmDelete: '¿Estás seguro de que quieres eliminar',
      closeWarning: 'Esto hará que todas las evaluaciones sean de solo lectura para las jefaturas.',
      reopenWarning: 'Esto permitirá que las jefaturas editen las evaluaciones nuevamente.',
      deleteWarning: 'Los ciclos con datos no pueden ser eliminados. Considera archivarlos en su lugar.',
      onlyOneActive: 'Solo se permite un ciclo activo a la vez. Por favor cierra el ciclo activo actual primero.',
      cannotDeleteData: 'Este ciclo contiene datos y no puede ser eliminado.',
      dateRange: 'Rango de Fechas',
      exportAllPDF: 'Exportar Todo como PDF',
      exportAllExcel: 'Exportar Todo como Excel',
      clearAll: 'Limpiar Todo',
      // Department ratings page  
      departmentRatings: 'Calificaciones por Departamento',
      performanceInsights: 'Análisis de Desempeño',
      totalEvaluations: 'Evaluaciones Totales',
      completeDepartments: 'Departamentos Completos',
      departmentsNeedAttention: 'departamentos necesitan atención',
      swipeForDetails: 'Desliza para ver detalles →',
      noManager: 'Sin Jefatura',
      notAssigned: 'No asignado',
      employees: 'Empleados',
      evaluated: 'Evaluados',
      pending: 'Pendientes',
      performanceDistribution: 'Distribución de Desempeño',
      evaluations: 'evaluaciones',
      outstandingShort: 'Excepcional',
      exceedsShort: 'Supera',
      meetsShort: 'Cumple',
      belowShort: 'Por Debajo',
      needsImprovementShort: 'Requiere Atención',
      needAttention: 'necesitan atención',
      noCompletedEvaluations: 'Sin evaluaciones completadas aún',
      evaluationsWillAppear: 'Las evaluaciones aparecerán aquí una vez enviadas',
      noDepartmentsFound: 'No se Encontraron Departamentos',
      addEmployeesWithDepartments: 'Agrega empleados con departamentos para ver las distribuciones de calificación',
      employeesNeedReview: 'empleados requieren revisión',
      allEmployees: 'todos los empleados',
      viewAllEmployees: 'Ver todos los empleados de este departamento',
      pendingEvaluations: 'Evaluaciones Pendientes',
      managePendingEvaluations: 'Gestionar Evaluaciones Pendientes',
      employeesWithoutEvaluations: 'empleados sin evaluaciones',
      startEvaluation: 'Iniciar Evaluación',
      searchEmployees: 'Buscar empleados...',
      searchEmployeesManagers: 'Buscar empleados, jefes...',
      allEvaluationsCompleted: '¡Todas las evaluaciones completadas!',
      excellentWork: '¡Excelente trabajo! Todos los empleados han sido evaluados.',
      noManagerAssigned: 'Sin jefatura asignada',
      viewResults: 'Ver Resultados',
      scheduleOneOnOnes: 'Considera programar reuniones individuales con estos empleados',
      viewCompletedEvaluations: 'Ver las {count} evaluaciones completas',
      // Evaluation summary page
      okrAverage: 'Promedio OKR',
      competencyAverage: 'Promedio Competencias',
      totalAverage: 'Promedio Total',
      objectives: 'objetivos',
      skills: 'habilidades',
      items: 'elementos',
      managerComments: 'Comentarios de Jefatura',
      feedback: 'Retroalimentación',
      companyLevel: 'Empresa',
      departmentLevel: 'Departamento',
      managerLevel: 'Jefatura',
      searchDepartments: 'Buscar departamentos...',
      allDepartments: 'Todos los Departamentos',
      allStatus: 'Todos los Estados',
      hasEvaluation: 'Tiene Evaluación',
      noEvaluation: 'Sin Evaluación',
      partial: 'Parcial',
      closedOn: 'Cerrado el',
      performanceCycleClosedHR: 'está cerrado. Aún puedes hacer evaluaciones parciales, pero los managers no pueden editar evaluaciones.',
      performanceCycleClosedManager: 'está cerrado. Todas las evaluaciones son ahora de solo lectura.',
      performanceCycleArchived: 'está archivado. Todos los datos son de solo lectura para referencia histórica.',
      performanceCycleRestricted: 'tiene acceso restringido.',
      // Deadlines page
      all: 'Todos',
      overdue: 'Vencidos',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
      highPriority: 'Prioridad Alta',
      mediumPriority: 'Prioridad Media',
      lowPriority: 'Prioridad Baja',
      department: 'Departamento',
      manager: 'Jefatura',
      dueThisWeek: 'vencen esta semana',
      createdBy: 'Creado por',
      deadlineSetBy: 'Fecha límite establecida por',
      noDeadline: 'Sin fecha límite',
      allEvaluationItems: 'Todos los Elementos de Evaluación',
      itemsWithDeadlines: 'elementos con fechas límite',
      daysRemaining: 'días restantes',
      dayRemaining: 'día restante',
      dayOverdue: 'día vencido',
      dueToday: 'Vence hoy',
      managersWithIssues: 'Jefaturas con Problemas',
      employeesBehind: 'Empleados Atrasados', 
      overdueItems: 'Elementos Vencidos',
      managerEvaluationAccountability: 'Colaboradores con OKRs o Competencias Vencidas',
      managersWithEmployeesOverdue: 'Colaboradores con OKRs o competencias vencidas',
      allEmployeesWithOverdueEvaluations: 'Todos los Colaboradores con OKRs o Competencias Vencidas',
      employeesBehindOnEvaluations: 'colaboradores con OKRs o competencias vencidas',
      noManagerIssuesFound: 'No se Encontraron Problemas de Jefatura',
      allEmployeesUpToDate: 'Todos los empleados están al día con sus evaluaciones.',
      noOverdueEvaluations: 'Sin Evaluaciones Vencidas',
      employeesBehindEvaluations: 'empleados atrasados',
      overdueItemsCount: 'elementos vencidos',
      daysOverdue: 'días vencidos',
      switchToEmployeeList: 'Lista Completa',
      switchToManagerGroups: 'Agrupar por Jefatura'
    },
    users: {
      userManagement: 'Gestión de usuarios',
      totalUsers: 'usuarios en total',
      importUsersCSV: 'Importar Usuarios desde CSV',
      uploadCSVFile: 'Subir Archivo CSV',
      csvFormat: 'Formato CSV:',
      downloadExample: 'Descargar archivo CSV de ejemplo',
      databaseManagement: 'Gestión de Base de Datos',
      advancedOperations: 'Usar Prisma Studio para operaciones avanzadas y edición directa',
      openPrismaStudio: 'Abrir Prisma Studio',
      searchUsers: 'Buscar usuarios...',
      allRoles: 'Todos los Roles',
      active: 'Activo',
      inactive: 'Inactivo',
      department: 'Departamento',
      manager: 'Jefatura',
      manages: 'Gestiona',
      evaluationsReceived: 'evaluaciones recibidas',
      noUsersFound: 'No se encontraron usuarios que coincidan con los criterios',
      uploadingProcessing: 'Subiendo y procesando...',
      successfullyImported: 'Importados exitosamente',
      importFailed: 'Error en la importación',
      uploadFailed: 'Error en la subida',
      basicExampleCSV: 'CSV de Ejemplo Básico',
      advancedExampleCSV: 'CSV de Ejemplo Avanzado',
      usesPersonIdMatching: 'Usa PersonID para emparejar jefaturas',
      showsBothIdOptions: 'Muestra opciones de PersonID y EmployeeID',
      fieldExplanations: 'Explicación de Campos:',
      employeeIdExplanation: 'ID asignado por la empresa (EMP001, MGR001) - Requerido para integración HRIS',
      personIdExplanation: 'Cédula/ID Nacional - Identificador legalmente único',
      managerPersonIdExplanation: 'Cédula de la Jefatura para jerarquía',
      managerEmployeeIdExplanation: 'Alternativa: ID de Empleado de la Jefatura',
      advanced: 'Avanzado',
      advancedAdmin: 'Administración Avanzada',
      dangerZone: 'Zona de Peligro',
      resetDatabase: 'Resetear Base de Datos',
      resetDatabaseTitle: 'Reseteo Completo de Base de Datos',
      resetDatabaseDescription: 'Esto eliminará permanentemente TODOS los datos incluyendo usuarios, evaluaciones, empresas y ciclos de desempeño. Esta acción no se puede deshacer.',
      resetDatabaseWarning: '¡ADVERTENCIA: Esta acción destruirá todos los datos y no se puede revertir!',
      resetDatabaseConfirm: 'Escribe "RESET" para confirmar esta acción destructiva',
      resetDatabaseButton: 'Resetear Todo',
      resetSuccess: 'Base de datos reseteada exitosamente',
      resetFailed: 'Error al resetear la base de datos',
      addUser: 'Agregar Usuario',
      editUser: 'Editar Usuario',
      deleteUser: 'Eliminar Usuario',
      exportUsers: 'Exportar Todos los Usuarios',
      exportUsersDescription: 'Descargar información completa de usuarios como archivo Excel',
      exportExcel: 'Exportar Excel',
      exporting: 'Exportando...',
      exportSuccess: 'Usuarios exportados exitosamente',
      exportFailed: 'Error en la exportación',
      // Form labels
      name: 'Nombre',
      email: 'Correo Electrónico',
      username: 'Usuario',
      role: 'Rol',
      company: 'Empresa',
      employeeId: 'ID de Empleado',
      position: 'Posición',
      personID: 'Cédula Nacional (ID Persona)',
      userType: 'Tipo de Usuario',
      loginMethod: 'Método de Acceso',
      shift: 'Turno',
      activeUser: 'Usuario Activo',
      password: 'Contraseña',
      newPassword: 'Nueva Contraseña (dejar vacío para mantener actual)',
      pinCode: 'Código PIN (4 dígitos)',
      requiresPinOnly: 'Requiere Solo PIN (sin contraseña)',
      officeWorker: 'Trabajador de Oficina',
      operationalWorker: 'Trabajador Operativo',
      selectRole: 'Seleccionar Rol',
      selectCompany: 'Seleccionar Empresa',
      noManager: 'Sin Jefatura',
      createUser: 'Crear Usuario',
      updateUser: 'Actualizar Usuario',
      leaveEmptyToKeep: 'dejar vacío para mantener actual',
      fourDigitPin: 'PIN de 4 dígitos',
      // Delete confirmation
      deleteConfirmMessage: '¿Estás seguro de que quieres eliminar a',
      actionCannotBeUndone: 'Esta acción no se puede deshacer.',
      deleting: 'Eliminando...',
      // Interface text
      manageUsersDescription: 'Gestionar usuarios y permisos de la empresa',
      clearSearch: 'Limpiar búsqueda',
      usersCount: 'Usuarios',
      reportsTo: 'Reporta a:',
      reports: 'reportes',
      evaluations: 'evaluaciones',
      editUserTitle: 'Editar usuario',
      deleteUserTitle: 'Eliminar usuario',
      // Form placeholders
      enterPassword: 'Ingrese contraseña',
      namePlaceholder: 'Juan Pérez',
      emailPlaceholder: 'juan@empresa.com',
      usernamePlaceholder: 'juan.perez',
      departmentPlaceholder: 'Operaciones, Ventas, RRHH...',
      employeeIdPlaceholder: 'EMP001, MGR002...',
      positionPlaceholder: 'Chef Ejecutivo, Recepcionista, Gerente...',
      personIdPlaceholder: 'Cédula, DNI, ID Nacional...',
      shiftPlaceholder: 'Mañana, Noche, Rotativo...'
    }
  }
}