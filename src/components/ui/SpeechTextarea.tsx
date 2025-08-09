'use client'

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import SpeechToTextButton from './SpeechToTextButton'
import { useToast } from '@/hooks/useToast'

interface SpeechTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  rows?: number
  maxLength?: number
  showCharCount?: boolean
  label?: string
  required?: boolean
}

export interface SpeechTextareaRef {
  focus: () => void
}

const SpeechTextarea = forwardRef<SpeechTextareaRef, SpeechTextareaProps>(({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  label,
  required = false
}, ref) => {
  const { t } = useLanguage()
  const { error: showError } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Expose focus method to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus()
    }
  }))

  const handleSpeechTranscript = useCallback((transcript: string) => {
    if (!transcript.trim()) return

    // Insert transcript at cursor position or append to existing text
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentValue = value || ''
      
      // Add a space before the transcript if there's existing text and it doesn't end with space
      const needsSpace = currentValue && !currentValue.endsWith(' ') && start === currentValue.length
      const finalTranscript = needsSpace ? ` ${transcript}` : transcript
      
      const newValue = currentValue.substring(0, start) + finalTranscript + currentValue.substring(end)
      
      // Check max length if specified
      if (maxLength && newValue.length > maxLength) {
        showError(t.speech?.lengthExceeded || `Text exceeds the limit of ${maxLength} characters`)
        return
      }
      
      onChange(newValue)
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        textarea.focus()
        const newCursorPosition = start + finalTranscript.length
        textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      }, 0)
    } else {
      // Fallback: append to end
      const needsSpace = value && !value.endsWith(' ')
      const finalTranscript = needsSpace ? ` ${transcript}` : transcript
      const newValue = (value || '') + finalTranscript
      
      if (maxLength && newValue.length > maxLength) {
        showError(t.speech?.lengthExceeded || `Text exceeds the limit of ${maxLength} characters`)
        return
      }
      
      onChange(newValue)
    }

    // Provide haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [value, onChange, maxLength, showError, t.speech])

  const handleSpeechError = useCallback((error: string) => {
    // Translate error codes to user-friendly messages
    let errorMessage = error
    
    switch (error) {
      case 'network-error':
        errorMessage = t.speech?.networkError || 'Network error'
        break
      case 'microphone-access-denied':
        errorMessage = t.speech?.microphoneAccess || 'Microphone access denied'
        break
      case 'no-speech-detected':
        errorMessage = t.speech?.noSpeechDetected || 'No speech detected'
        break
      case 'audio-not-supported':
        errorMessage = t.speech?.audioNotSupported || 'Audio not supported'
        break
      default:
        if (error.startsWith('speech-error-')) {
          errorMessage = t.speech?.transcriptionError || 'Transcription error'
        }
        break
    }
    
    showError(errorMessage)
  }, [t.speech, showError])

  const characterCount = value ? value.length : 0
  const isOverLimit = maxLength && characterCount > maxLength

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={`w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 ${
            isOverLimit ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        />
        
        {/* Speech-to-text button */}
        <div className="absolute top-2 right-2">
          <SpeechToTextButton
            onTranscript={handleSpeechTranscript}
            onError={handleSpeechError}
            disabled={disabled}
            className="relative"
          />
        </div>
        
        {/* Focus indicator for speech button */}
        {isFocused && (
          <div className="absolute top-2 right-2 w-9 h-9 border-2 border-blue-500 rounded-lg opacity-50 pointer-events-none" />
        )}
      </div>
      
      {/* Character count and help text */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {t.speech?.tapToSpeak || 'Tap microphone to speak'}
        </div>
        
        {showCharCount && maxLength && (
          <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {characterCount}/{maxLength}
          </div>
        )}
      </div>
    </div>
  )
})

SpeechTextarea.displayName = 'SpeechTextarea'

export default SpeechTextarea