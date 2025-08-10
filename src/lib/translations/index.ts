export type { Language, Translations } from './types'
export { en } from './en'
export { es } from './es'

import type { Language, Translations } from './types'
import { en } from './en'
import { es } from './es'

export const translations: Record<Language, Translations> = {
  en,
  es
}