'use server'

import { prisma } from '@/lib/prisma-client'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface BiometricCredentialData {
  credentialId: string
  publicKey: string
  deviceName?: string
  deviceType: string
}

export interface BiometricAuthData {
  credentialId: string
  signature: string
  authenticatorData: string
  clientDataJSON: string
}

/**
 * Register a new biometric credential for the current user
 */
export async function registerBiometricCredential(data: BiometricCredentialData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Check if credential already exists
    const existingCredential = await prisma.biometricCredential.findUnique({
      where: { credentialId: data.credentialId }
    })

    if (existingCredential) {
      throw new Error('Credential already registered')
    }

    // Create new biometric credential
    const credential = await prisma.biometricCredential.create({
      data: {
        userId: session.user.id,
        credentialId: data.credentialId,
        publicKey: data.publicKey,
        deviceName: data.deviceName || detectDeviceName(),
        deviceType: data.deviceType,
        counter: 0
      }
    })

    revalidatePath('/settings')
    
    return {
      success: true,
      credential: {
        id: credential.id,
        deviceName: credential.deviceName,
        deviceType: credential.deviceType,
        createdAt: credential.createdAt
      }
    }
  } catch (error) {
    console.error('Biometric registration error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    }
  }
}

/**
 * Authenticate user with biometric credential
 */
export async function authenticateWithBiometric(data: BiometricAuthData) {
  try {
    // Find the credential in our database
    const credential = await prisma.biometricCredential.findUnique({
      where: { 
        credentialId: data.credentialId,
        isActive: true
      },
      include: { user: true }
    })

    if (!credential) {
      throw new Error('Credential not found')
    }

    // In a full implementation, you would:
    // 1. Verify the signature using the stored public key
    // 2. Validate the authenticator data
    // 3. Check the signature counter to prevent replay attacks
    
    // For now, we'll simulate successful verification
    const isValid = await verifyBiometricSignature(
      credential.publicKey,
      data.signature,
      data.authenticatorData,
      data.clientDataJSON,
      credential.counter
    )

    if (!isValid) {
      throw new Error('Invalid biometric signature')
    }

    // Update credential usage
    await prisma.biometricCredential.update({
      where: { id: credential.id },
      data: {
        lastUsed: new Date(),
        counter: credential.counter + 1
      }
    })

    return {
      success: true,
      user: {
        id: credential.user.id,
        email: credential.user.email,
        username: credential.user.username,
        name: credential.user.name,
        role: credential.user.role,
        companyId: credential.user.companyId
      }
    }
  } catch (error) {
    console.error('Biometric authentication error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

/**
 * Get user's biometric credentials
 */
export async function getBiometricCredentials() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    const credentials = await prisma.biometricCredential.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      select: {
        id: true,
        credentialId: true,
        deviceName: true,
        deviceType: true,
        lastUsed: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, credentials }
  } catch (error) {
    console.error('Error fetching credentials:', error)
    return { success: false, error: 'Failed to fetch credentials' }
  }
}

/**
 * Remove a biometric credential
 */
export async function removeBiometricCredential(credentialId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  try {
    // Verify the credential belongs to the current user
    const credential = await prisma.biometricCredential.findFirst({
      where: {
        credentialId,
        userId: session.user.id
      }
    })

    if (!credential) {
      throw new Error('Credential not found')
    }

    // Soft delete by setting isActive to false
    await prisma.biometricCredential.update({
      where: { id: credential.id },
      data: { isActive: false }
    })

    revalidatePath('/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Error removing credential:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove credential'
    }
  }
}

/**
 * Verify biometric signature (simplified implementation)
 * In production, this would use proper WebAuthn verification libraries
 */
async function verifyBiometricSignature(
  publicKey: string,
  signature: string,
  authenticatorData: string,
  clientDataJSON: string,
  _expectedCounter?: number // eslint-disable-line @typescript-eslint/no-unused-vars -- Reserved for future counter verification implementation
): Promise<boolean> {
  // This is a simplified implementation
  // In production, you would:
  // 1. Parse the authenticator data to extract the counter
  // 2. Verify the counter is greater than the stored counter
  // 3. Create the signed data from authenticatorData + clientDataJSON hash
  // 4. Verify the signature using the stored public key
  
  // For demo purposes, we'll return true if all required data is present
  return !!(publicKey && signature && authenticatorData && clientDataJSON)
}

/**
 * Detect device name from user agent
 */
function detectDeviceName(): string {
  // This would typically be done client-side
  // Here we'll return a generic name
  return 'Unknown Device'
}