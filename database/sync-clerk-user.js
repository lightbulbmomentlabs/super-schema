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
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function syncClerkUser(clerkUserId, email, firstName, lastName, creditsToAdd) {
  console.log('🔄 Syncing Clerk user to database...')

  // Create or update the Clerk user
  const { error: upsertError } = await supabase.rpc('upsert_user_from_clerk', {
    p_user_id: clerkUserId,
    p_email: email,
    p_first_name: firstName,
    p_last_name: lastName
  })

  if (upsertError) {
    console.error('❌ Error syncing user:', upsertError.message)
    return
  }

  console.log('✅ User synced successfully')

  // Check current balance
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', clerkUserId)
    .single()

  if (!user) {
    console.error('❌ User not found after sync')
    return
  }

  console.log(`   Current balance: ${user.credit_balance} credits`)

  // Add credits if specified
  if (creditsToAdd > 0) {
    console.log(`\n💰 Adding ${creditsToAdd} credits...`)

    const { error: addError } = await supabase.rpc('add_credits', {
      p_user_id: clerkUserId,
      p_amount: creditsToAdd,
      p_description: 'Testing credits from admin'
    })

    if (addError) {
      console.error('❌ Error adding credits:', addError.message)
      return
    }

    // Get updated balance
    const { data: updatedUser } = await supabase
      .from('users')
      .select('credit_balance')
      .eq('id', clerkUserId)
      .single()

    console.log('✅ Credits added successfully!')
    console.log(`   New balance: ${updatedUser.credit_balance} credits`)
  }

  // Now handle the old manual account if it exists
  const { data: manualAccount } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .neq('id', clerkUserId)
    .single()

  if (manualAccount) {
    console.log(`\n🔍 Found old manual account with ${manualAccount.credit_balance} credits`)
    console.log('💰 Transferring credits from old account...')

    // Transfer credits
    const { error: transferError } = await supabase.rpc('add_credits', {
      p_user_id: clerkUserId,
      p_amount: manualAccount.credit_balance,
      p_description: `Credits transferred from manual account ${manualAccount.id}`
    })

    if (transferError) {
      console.error('❌ Error transferring credits:', transferError.message)
    } else {
      console.log('✅ Credits transferred successfully')

      // Delete old account
      await supabase.from('users').delete().eq('id', manualAccount.id)
      console.log('✅ Old account deleted')
    }
  }

  // Get final balance
  const { data: finalUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', clerkUserId)
    .single()

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Setup Complete!')
  console.log('='.repeat(60))
  console.log(`👤 User: ${finalUser.first_name} ${finalUser.last_name}`)
  console.log(`📧 Email: ${finalUser.email}`)
  console.log(`🆔 Clerk ID: ${finalUser.id}`)
  console.log(`💳 Total Credits: ${finalUser.credit_balance}`)
  console.log('='.repeat(60))
  console.log('\n✨ You can now use your credits in the app!')
}

const clerkUserId = process.argv[2]
const email = process.argv[3] || 'kevinfremon@gmail.com'
const firstName = process.argv[4] || 'Kevin'
const lastName = process.argv[5] || 'Fremon'
const creditsToAdd = parseInt(process.argv[6]) || 50

if (!clerkUserId) {
  console.error('❌ Please provide Clerk user ID')
  console.log('\nUsage:')
  console.log('  node database/sync-clerk-user.js <clerk-user-id> [email] [first-name] [last-name] [credits]')
  process.exit(1)
}

console.log('🚀 Syncing Clerk User')
console.log('=' .repeat(60))
console.log(`🆔 Clerk ID: ${clerkUserId}`)
console.log(`📧 Email: ${email}`)
console.log(`👤 Name: ${firstName} ${lastName}`)
console.log(`💳 Credits to add: ${creditsToAdd}`)
console.log('=' .repeat(60))
console.log()

syncClerkUser(clerkUserId, email, firstName, lastName, creditsToAdd)
  .catch(error => {
    console.error('❌ Error:', error.message)
  })
