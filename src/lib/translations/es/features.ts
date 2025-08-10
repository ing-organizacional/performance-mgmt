import type { 
  SpeechTranslations, 
  BiometricTranslations, 
  SettingsTranslations,
  AssignmentsTranslations,
  CompanyItemsTranslations,
  OKRsTranslations 
} from '../types'

export const speech: SpeechTranslations = {
  startRecording: 'Iniciar grabación de voz',
  stopRecording: 'Detener grabación',
  listening: 'Escuchando...',
  tapToSpeak: 'Toca el micrófono para dictar',
  microphoneAccess: 'Acceso al micrófono denegado. Por favor permite el acceso al micrófono.',
  networkError: 'Error de red. Por favor verifica tu conexión a internet.',
  noSpeechDetected: 'No se detectó voz. Por favor intenta de nuevo.',
  audioNotSupported: 'No se encontró micrófono. Por favor verifica tu configuración de audio.',
  speakNow: 'Habla ahora...',
  speechNotSupported: 'El reconocimiento de voz no es compatible con este navegador',
  transcriptionError: 'Error de reconocimiento de voz. Por favor intenta de nuevo.',
  lengthExceeded: 'El texto excede el límite máximo de longitud'
}

export const biometric: BiometricTranslations = {
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
}

export const settings: SettingsTranslations = {
  title: 'Configuración',
  subtitle: 'Gestiona tu perfil y configuración de seguridad',
  profile: 'Perfil',
  profileDescription: 'Tu información personal y detalles de la cuenta',
  editProfile: 'Editar Perfil',
  changePassword: 'Cambiar Contraseña',
  currentPassword: 'Contraseña Actual',
  newPassword: 'Nueva Contraseña',
  confirmPassword: 'Confirmar Nueva Contraseña',
  passwordsMatch: 'Las contraseñas deben coincidir',
  passwordUpdated: 'Contraseña actualizada exitosamente',
  passwordSecurityNote: 'Nota de Seguridad: Su nueva contraseña debe tener al menos 8 caracteres e incluir una combinación de letras, números y símbolos.',
  currentPasswordPlaceholder: 'Ingrese su contraseña actual',
  newPasswordPlaceholder: 'Ingrese su nueva contraseña (mín 8 caracteres)',
  confirmPasswordPlaceholder: 'Confirme su nueva contraseña',
  noCredentials: 'Aún no se han configurado credenciales biométricas',
  noCredentialsDescription: 'Configure la autenticación biométrica arriba para mejorar la seguridad de su cuenta',
  failedToLoadCredentials: 'Error al cargar las credenciales',
  failedToRemoveCredential: 'Error al eliminar la credencial'
}

export const assignments: AssignmentsTranslations = {
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
}

export const companyItems: CompanyItemsTranslations = {
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
}

export const okrs: OKRsTranslations = {
  objective: 'Objetivo',
  keyResults: 'Resultados Clave'
}