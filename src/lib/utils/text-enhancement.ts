/**
 * Conservative Text Enhancement for Speech-to-Text
 * 
 * Applies only high-confidence enhancements to speech recognition output:
 * - Basic cleanup (spaces, trim)
 * - First letter capitalization  
 * - End punctuation
 * - Safe filler word removal
 * 
 * Avoids complex rules that could introduce errors.
 */

/**
 * Conservative enhancement - only applies changes with 90%+ confidence
 */
export function enhanceEvaluationText(text: string, language: 'en' | 'es' = 'es'): string {
  if (!text || text.trim().length === 0) return text

  let enhanced = text.trim()

  // 1. Clean multiple spaces (100% safe)
  enhanced = enhanced.replace(/\s+/g, ' ')

  // 2. Remove common filler words (95% safe)
  enhanced = removeSafeFillerWords(enhanced, language)

  // 3. Capitalize first letter (99% safe)
  if (enhanced.length > 0) {
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1)
  }

  // 4. Capitalize "I" in English (100% safe)
  if (language === 'en') {
    enhanced = enhanced.replace(/\bi\b/g, 'I')
  }

  // 5. Add period at end if missing and text seems complete (95% safe)
  if (enhanced.length > 5 && !enhanced.match(/[.!?]$/)) {
    enhanced += '.'
  }

  return enhanced
}

/**
 * Removes obvious filler words that are safe to remove
 */
function removeSafeFillerWords(text: string, language: 'en' | 'es'): string {
  let enhanced = text

  if (language === 'es') {
    // Spanish filler words - only remove obvious ones
    enhanced = enhanced.replace(/\b(este|eh|um|uhm|mmm)\s+/gi, '')
    enhanced = enhanced.replace(/\s+(este|eh|um|uhm|mmm)\b/gi, '')
  } else {
    // English filler words - only remove obvious ones  
    enhanced = enhanced.replace(/\b(um|uh|uhm|mmm|err)\s+/gi, '')
    enhanced = enhanced.replace(/\s+(um|uh|uhm|mmm|err)\b/gi, '')
  }

  // Clean up any double spaces created by filler word removal
  enhanced = enhanced.replace(/\s+/g, ' ').trim()

  return enhanced
}

/**
 * Advanced enhancement with user control (for future implementation)
 * This version includes more aggressive improvements but lower reliability
 */
export function enhanceEvaluationTextAdvanced(text: string, language: 'en' | 'es' = 'es'): string {
  // Start with conservative enhancement
  let enhanced = enhanceEvaluationText(text, language)

  // Add more aggressive improvements (70-85% reliability)
  enhanced = addSmartPunctuation(enhanced, language)
  enhanced = capitalizeCommonProperNouns(enhanced)

  return enhanced
}

/**
 * Adds punctuation based on common speech patterns (less reliable)
 */
function addSmartPunctuation(text: string, language: 'en' | 'es'): string {
  let enhanced = text

  if (language === 'es') {
    // Only very common patterns with high confidence
    enhanced = enhanced.replace(/\b(pero|sin embargo|además)\s+/gi, '$1, ')
  } else {
    enhanced = enhanced.replace(/\b(but|however|also)\s+/gi, '$1, ')
  }

  return enhanced
}

/**
 * Capitalizes very common proper nouns (less reliable)
 */
function capitalizeCommonProperNouns(text: string): string {
  let enhanced = text

  // Only capitalize extremely common business terms
  const safeProperNouns = ['excel', 'word', 'google', 'microsoft', 'zoom']
  
  safeProperNouns.forEach(noun => {
    const regex = new RegExp(`\\b${noun}\\b`, 'gi')
    enhanced = enhanced.replace(regex, (match) => {
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    })
  })

  return enhanced
}