import type { 
  SpeechTranslations, 
  BiometricTranslations, 
  SettingsTranslations,
  AssignmentsTranslations,
  CompanyItemsTranslations,
  OKRsTranslations 
} from '../types'

export const speech: SpeechTranslations = {
  startRecording: 'Start voice recording',
  stopRecording: 'Stop recording',
  listening: 'Listening...',
  tapToSpeak: 'Tap microphone to dictate',
  microphoneAccess: 'Microphone access denied. Please allow microphone access.',
  networkError: 'Network error. Please check your internet connection.',
  noSpeechDetected: 'No speech detected. Please try again.',
  audioNotSupported: 'No microphone found. Please check your audio settings.',
  speakNow: 'Speak now...',
  speechNotSupported: 'Speech recognition is not supported in this browser',
  transcriptionError: 'Speech recognition error. Please try again.',
  lengthExceeded: 'Text exceeds the maximum length limit'
}

export const biometric: BiometricTranslations = {
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
}

export const settings: SettingsTranslations = {
  profile: 'Profile',
  editProfile: 'Edit Profile',
  changePassword: 'Change Password',
  currentPassword: 'Current Password',
  newPassword: 'New Password',
  confirmPassword: 'Confirm New Password',
  passwordsMatch: 'Passwords must match',
  passwordUpdated: 'Password updated successfully',
  passwordSecurityNote: 'Security Note: Your new password should be at least 8 characters long and contain a mix of letters, numbers, and symbols.',
  currentPasswordPlaceholder: 'Enter your current password',
  newPasswordPlaceholder: 'Enter your new password (min 8 characters)',
  confirmPasswordPlaceholder: 'Confirm your new password'
}

export const assignments: AssignmentsTranslations = {
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
}

export const companyItems: CompanyItemsTranslations = {
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
}

export const okrs: OKRsTranslations = {
  objective: 'Objective',
  keyResults: 'Key Results'
}