import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth(() => {
  // Create response
  const response = NextResponse.next()

  // Add security headers
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-eval needed for Next.js dev mode
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]

  // Set Content Security Policy
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // Set other security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSRF protection via SameSite cookies (handled by NextAuth)
  // Additional CSRF token validation would go in API routes
  
  return response
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}