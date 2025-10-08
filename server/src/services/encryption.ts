/**
 * Encryption Service
 * Provides AES-256-GCM encryption/decryption for sensitive data like OAuth tokens
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For AES, this is always 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derive encryption key from passphrase using PBKDF2
 */
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Encrypt a string using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encrypted
 */
export function encrypt(text: string): string {
  const encryptionKey = process.env.HUBSPOT_ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('HUBSPOT_ENCRYPTION_KEY environment variable is not set')
  }

  if (encryptionKey.length < 32) {
    throw new Error('HUBSPOT_ENCRYPTION_KEY must be at least 32 characters')
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive key from passphrase + salt
    const key = deriveKey(encryptionKey, salt)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const tag = cipher.getAuthTag()

    // Combine salt, iv, tag, and encrypted data
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted
    ].join(':')
  } catch (error) {
    console.error('❌ [Encryption] Failed to encrypt data:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 * @param encryptedText - Encrypted string in format: salt:iv:tag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  const encryptionKey = process.env.HUBSPOT_ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('HUBSPOT_ENCRYPTION_KEY environment variable is not set')
  }

  try {
    // Split the encrypted text
    const parts = encryptedText.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted text format')
    }

    const [saltHex, ivHex, tagHex, encrypted] = parts

    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    // Derive key from passphrase + salt
    const key = deriveKey(encryptionKey, salt)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('❌ [Encryption] Failed to decrypt data:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * Generate a random encryption key (for setup)
 * Use this to generate HUBSPOT_ENCRYPTION_KEY value
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64')
}

/**
 * Hash a value using SHA-256 (one-way, for comparison)
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Verify if encryption is configured correctly
 */
export function verifyEncryptionSetup(): boolean {
  try {
    const encryptionKey = process.env.HUBSPOT_ENCRYPTION_KEY
    if (!encryptionKey || encryptionKey.length < 32) {
      return false
    }

    // Test encrypt/decrypt
    const testData = 'encryption_test_' + Date.now()
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)

    return testData === decrypted
  } catch (error) {
    console.error('❌ [Encryption] Setup verification failed:', error)
    return false
  }
}
