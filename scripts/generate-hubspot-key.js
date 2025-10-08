#!/usr/bin/env node

/**
 * Generate HubSpot Encryption Key
 *
 * This script generates a secure 256-bit encryption key for HubSpot OAuth token storage.
 * Add the generated key to your .env file as HUBSPOT_ENCRYPTION_KEY
 */

import crypto from 'crypto'

console.log('\n🔐 HubSpot Encryption Key Generator\n')
console.log('─'.repeat(50))

const key = crypto.randomBytes(32).toString('base64')

console.log('\n✨ Generated Encryption Key:\n')
console.log(`   ${key}\n`)
console.log('─'.repeat(50))
console.log('\n📝 Add this to your .env file:\n')
console.log(`   HUBSPOT_ENCRYPTION_KEY=${key}\n`)
console.log('─'.repeat(50))
console.log('\n⚠️  Keep this key secret and never commit it to git!')
console.log('   Store it securely in your password manager.\n')
