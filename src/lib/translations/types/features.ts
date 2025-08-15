/**
 * Features Translation Types
 * 
 * Defines translation types for specialized application features including
 * speech recognition, biometric authentication, and user settings.
 */

export interface SpeechTranslations {
  startRecording: string
  stopRecording: string
  listening: string
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

export interface BiometricTranslations {
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

export interface SettingsTranslations {
  title: string
  subtitle: string
  profile: string
  profileDescription: string
  editProfile: string
  changePassword: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  passwordsMatch: string
  passwordUpdated: string
  passwordSecurityNote: string
  currentPasswordPlaceholder: string
  newPasswordPlaceholder: string
  confirmPasswordPlaceholder: string
  noCredentials: string
  noCredentialsDescription: string
  failedToLoadCredentials: string
  failedToRemoveCredential: string
}