/**
 * Translation Types Index
 * 
 * Main aggregation of all translation type definitions for the
 * performance management system. Provides a centralized interface
 * for type-safe multilingual support across the application.
 */

// Core foundation types
export * from './core'

// Feature-specific translation types
export * from './common'
export * from './auth'
export * from './evaluations'
export * from './features'
export * from './assignments'
export * from './dashboard'
export * from './users'

// Import individual interfaces for main aggregation
import type { StatusTranslations, RatingsTranslations } from './core'
import type { CommonTranslations } from './common'
import type { AuthTranslations, NavigationTranslations } from './auth'
import type { EvaluationsTranslations } from './evaluations'
import type { SpeechTranslations, BiometricTranslations, SettingsTranslations } from './features'
import type { AssignmentsTranslations, CompanyItemsTranslations, OKRsTranslations } from './assignments'
import type { DashboardTranslations } from './dashboard'
import type { UsersTranslations } from './users'

/**
 * Main Translations Interface
 * 
 * Aggregates all translation interfaces into a single, comprehensive
 * type definition for the entire application's multilingual support.
 */
export interface Translations {
  status: StatusTranslations
  ratings: RatingsTranslations
  common: CommonTranslations
  auth: AuthTranslations
  nav: NavigationTranslations
  evaluations: EvaluationsTranslations
  speech: SpeechTranslations
  biometric: BiometricTranslations
  settings: SettingsTranslations
  assignments: AssignmentsTranslations
  companyItems: CompanyItemsTranslations
  okrs: OKRsTranslations
  dashboard: DashboardTranslations
  users: UsersTranslations
}