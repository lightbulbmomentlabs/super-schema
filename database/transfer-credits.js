#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function transferCredits(fromEmail, toUserId) {
  console.log('🔍 Finding source account...')

  // Find the manual account by email
  const { data: fromUser, error: fromError } = await supabase
    .from('users')
    .select('*')
    .eq('email', fromEmail)
    .single()

  if (fromError || !fromUser) {
    console.error('❌ Source account not found')
    return
  }

  console.log(`✅ Found source account: ${fromUser.id}`)
  console.log(`   Balance: ${fromUser.credit_balance} credits`)

  // Check if target user exists
  console.log('\n🔍 Checking target account...')
  const { data: toUser, error: toError } = await supabase
    .from('users')
    .select('*')
    .eq('id', toUserId)
    .single()

  if (toError || !toUser) {
    console.error('❌ Target account not found. Make sure you signed up with Clerk first.')
    return
  }

  console.log(`✅ Found target account: ${toUser.id}`)
  console.log(`   Current balance: ${toUser.credit_balance} credits`)

  // Transfer credits
  const creditsToTransfer = fromUser.credit_balance
  console.log(`\n💰 Transferring ${creditsToTransfer} credits...`)

  const { error: addError } = await supabase.rpc('add_credits', {
    p_user_id: toUserId,
    p_amount: creditsToTransfer,
    p_description: `Credits transferred from manual account ${fromUser.id}`
  })

  if (addError) {
    console.error('❌ Error transferring credits:', addError.message)
    return
  }

  // Get updated balance
  const { data: updatedUser } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', toUserId)
    .single()

  console.log('✅ Credits transferred successfully!')
  console.log(`   New balance: ${updatedUser.credit_balance} credits`)

  // Delete the manual account
  console.log('\n🗑️  Cleaning up temporary account...')
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', fromUser.id)

  if (deleteError) {
    console.error('⚠️  Could not delete temporary account:', deleteError.message)
    console.log('   You can manually delete it later if needed')
  } else {
    console.log('✅ Temporary account deleted')
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Transfer Complete!')
  console.log('='.repeat(60))
  console.log(`📧 Email: ${toUser.email}`)
  console.log(`🆔 Clerk User ID: ${toUser.id}`)
  console.log(`💳 Total Credits: ${updatedUser.credit_balance}`)
  console.log('='.repeat(60))
  console.log('\n💡 You can now use your credits in the app!')
}

// Get command line arguments
const fromEmail = process.argv[2] || 'kevinfremon@gmail.com'
const toUserId = process.argv[3]

if (!toUserId) {
  console.error('❌ Please provide the Clerk user ID')
  console.log('\nUsage:')
  console.log('  node database/transfer-credits.js <from-email> <clerk-user-id>')
  console.log('\nExample:')
  console.log('  node database/transfer-credits.js kevinfremon@gmail.com user_2abc123xyz')
  process.exit(1)
}

console.log('🚀 Transferring Credits')
console.log('=' .repeat(60))
console.log(`📧 From: ${fromEmail} (manual account)`)
console.log(`🆔 To: ${toUserId} (Clerk account)`)
console.log('=' .repeat(60))
console.log()

transferCredits(fromEmail, toUserId)
  .then(() => {
    console.log('\n✨ Done!')
  })
  .catch(error => {
    console.error('❌ Error:', error.message)
  })
