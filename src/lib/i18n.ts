export type Language = 'en' | 'es'

export interface Translations {
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
    editButton: string
    cancelButton: string
    saveButton: string
    standardized: string
    company: string
    department: string
    manager: string
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
  }
  
  // Navigation
  nav: {
    performanceManagement: string
    employeeEvaluations: string
    myEvaluations: string
    selectEmployee: string
    employees: string
    assignments: string
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
    okr: string
    competency: string
    ratePerformance: string
    optionalComment: string
    provideFeedback: string
    addSpecificFeedback: string
    needsImprovement: string
    belowExpectations: string
    meetsExpectations: string
    exceedsExpectations: string
    outstanding: string
    teamSummary: string
    pendingReviews: string
    teamAverage: string
    completed: string
    inProgress: string
    notStarted: string
    evaluationSubmitted: string
    evaluationSubmittedDesc: string
    redirecting: string
    comments: string
    minimumCharacters: string
    tapToRate: string
    commentPlaceholder: string
    commentGuidance: string
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
    completed: string
    remaining: string
    overdueEvaluations: string
    pastDueDate: string
    sendReminders: string
    dueSoon: string
    dueWithinDays: string
    viewList: string
    ratingDistribution: string
    outstanding: string
    exceeds: string
    meets: string
    below: string
    needsImprovement: string
    quickActions: string
    exportAllEvaluations: string
    generateReports: string
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
    companyWideItems: string
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
  }
}

export const translations: Record<Language, Translations> = {
  en: {
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
      editButton: 'Edit',
      cancelButton: 'Cancel',
      saveButton: 'Save',
      standardized: 'Standardized',
      company: 'Company',
      department: 'Department',
      manager: 'Manager'
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
      worker: 'Worker'
    },
    nav: {
      performanceManagement: 'Performance Management',
      employeeEvaluations: 'Employee Evaluations',
      myEvaluations: 'My Evaluations',
      selectEmployee: 'Select an employee to evaluate',
      employees: 'employees',
      assignments: 'Assignments'
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
      okr: 'OKR',
      competency: 'Competency',
      ratePerformance: 'Rate Performance',
      optionalComment: 'Optional Comment',
      provideFeedback: 'Provide an overall assessment of the employee\'s performance',
      addSpecificFeedback: 'Add specific feedback or examples...',
      needsImprovement: 'Needs Improvement',
      belowExpectations: 'Below Expectations',
      meetsExpectations: 'Meets Expectations',
      exceedsExpectations: 'Exceeds Expectations',
      outstanding: 'Outstanding',
      teamSummary: 'Team Summary',
      pendingReviews: 'Pending Reviews',
      teamAverage: 'Team Average',
      completed: 'Completed',
      inProgress: 'In Progress',
      notStarted: 'Not Started',
      evaluationSubmitted: 'Evaluation Submitted Successfully!',
      evaluationSubmittedDesc: 'The performance evaluation for {name} has been saved and submitted. You\'ll be redirected back to the team overview.',
      redirecting: 'Redirecting...',
      comments: 'Comments',
      minimumCharacters: 'Minimum {count} characters',
      tapToRate: 'Tap a star to rate this item',
      commentPlaceholder: 'Provide specific feedback and examples...',
      commentGuidance: 'Include specific examples and actionable suggestions.'
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
      evaluationDeadline: 'Evaluation Deadline (Optional)'
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
      completed: 'Completed',
      remaining: 'Remaining',
      overdueEvaluations: 'Overdue Evaluations',
      pastDueDate: 'These evaluations are past their due date',
      sendReminders: 'Send Reminders',
      dueSoon: 'Due Soon',
      dueWithinDays: 'Due within the next 3 days',
      viewList: 'View List',
      ratingDistribution: 'Rating Distribution',
      outstanding: 'Outstanding (5)',
      exceeds: 'Exceeds (4)',
      meets: 'Meets (3)',
      below: 'Below (2)',
      needsImprovement: 'Needs Improvement (1)',
      quickActions: 'Quick Actions',
      exportAllEvaluations: 'Export All Evaluations',
      generateReports: 'Generate Reports',
      allPeriods: 'All Periods',
      manageUsers: 'Manage Users',
      startEvaluating: 'Start Evaluating',
      lastUpdated: 'Last updated',
      newCycle: 'New Cycle',
      cycleName: 'Cycle Name',
      startDate: 'Start Date',
      endDate: 'End Date',
      createCycle: 'Create Cycle',
      creating: 'Creating...',
      companyWideItems: 'Company-Wide OKRs & Competencies'
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
      addUser: 'Add User'
    }
  },
  es: {
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
      editButton: 'Editar',
      cancelButton: 'Cancelar',
      saveButton: 'Guardar',
      standardized: 'Estandarizado',
      company: 'Empresa',
      department: 'Departamento',
      manager: 'Jefatura'
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
      worker: 'Trabajador'
    },
    nav: {
      performanceManagement: 'Gestión de Desempeño',
      employeeEvaluations: 'Evaluaciones de Colaboradores',
      myEvaluations: 'Mis Evaluaciones',
      selectEmployee: 'Selecciona un empleado para evaluar',
      employees: 'empleados',
      assignments: 'Asignaciones'
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
      okr: 'OKR',
      competency: 'Competencia',
      ratePerformance: 'Calificar Desempeño',
      optionalComment: 'Comentario Opcional',
      provideFeedback: 'Proporciona una evaluación general del desempeño del empleado',
      addSpecificFeedback: 'Añade comentarios específicos o ejemplos...',
      needsImprovement: 'Necesita Mejorar',
      belowExpectations: 'Por Debajo de las Expectativas',
      meetsExpectations: 'Cumple las Expectativas',
      exceedsExpectations: 'Supera las Expectativas',
      outstanding: 'Excepcional',
      teamSummary: 'Resumen del Equipo',
      pendingReviews: 'Revisiones Pendientes',
      teamAverage: 'Promedio del Equipo',
      completed: 'Completado',
      inProgress: 'En Progreso',
      notStarted: 'Sin Iniciar',
      evaluationSubmitted: '¡Evaluación Enviada Exitosamente!',
      evaluationSubmittedDesc: 'La evaluación de desempeño de {name} ha sido guardada y enviada. Serás redirigido de vuelta al resumen del equipo.',
      redirecting: 'Redirigiendo...',
      comments: 'Comentarios',
      minimumCharacters: 'Mínimo {count} caracteres',
      tapToRate: 'Toca una estrella para calificar',
      commentPlaceholder: 'Proporciona comentarios específicos y ejemplos...',
      commentGuidance: 'Incluye ejemplos específicos y sugerencias prácticas.'
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
      evaluationDeadline: 'Fecha Límite de Evaluación (Opcional)'
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
      completionStatus: 'Estado de Completitud',
      completed: 'Completadas',
      remaining: 'Pendientes',
      overdueEvaluations: 'Evaluaciones Vencidas',
      pastDueDate: 'Estas evaluaciones han pasado su fecha límite',
      sendReminders: 'Enviar Recordatorios',
      dueSoon: 'Próximas a Vencer',
      dueWithinDays: 'Vencen en los próximos 3 días',
      viewList: 'Ver Lista',
      ratingDistribution: 'Distribución de Calificaciones',
      outstanding: 'Excepcional (5)',
      exceeds: 'Supera (4)',
      meets: 'Cumple (3)',
      below: 'Por Debajo (2)',
      needsImprovement: 'Necesita Mejorar (1)',
      quickActions: 'Acciones Rápidas',
      exportAllEvaluations: 'Exportar Todas las Evaluaciones',
      generateReports: 'Generar Reportes',
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
      companyWideItems: 'OKRs y Competencias de Toda la Empresa'
    },
    users: {
      userManagement: 'Gestión de Usuarios',
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
      addUser: 'Agregar Usuario'
    }
  }
}