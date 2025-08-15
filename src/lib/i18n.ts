/**
 * Internationalization (i18n) Entry Point
 * 
 * Re-exports the modular translation system that provides:
 * - Complete bilingual support for English and Spanish
 * - Type-safe translations with TypeScript interfaces
 * - Modular structure split by feature areas
 * - 290+ translation keys covering all application features
 * - Support for complex UI states and error messages
 */

// Re-export from modular translations structure
export type { Language, Translations } from './translations'
export { translations } from './translations'