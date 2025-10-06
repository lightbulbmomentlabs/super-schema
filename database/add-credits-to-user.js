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

async function addCreditsToUser(email, credits, description) {
  console.log('🔍 Looking for user with email:', email)

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (userError || !user) {
    console.error('❌ User not found with email:', email)
    console.log('\n💡 Tip: The user must sign up in the app first before we can add credits.')
    return
  }

  console.log(`✅ Found user: ${user.first_name || ''} ${user.last_name || ''} (${user.email})`)
  console.log(`   Current balance: ${user.credit_balance} credits`)

  // Add credits using the database function
  console.log(`\n💰 Adding ${credits} credits...`)
  const { error: addError } = await supabase.rpc('add_credits', {
    p_user_id: user.id,
    p_amount: credits,
    p_description: description
  })

  if (addError) {
    console.error('❌ Error adding credits:', addError.message)
    return
  }

  // Get updated balance
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', user.id)
    .single()

  if (updateError || !updatedUser) {
    console.error('❌ Error fetching updated balance')
    return
  }

  console.log('✅ Credits added successfully!')
  console.log(`   New balance: ${updatedUser.credit_balance} credits`)
  console.log(`   Increase: ${user.credit_balance} → ${updatedUser.credit_balance}`)

  // Verify transaction was recorded
  const { data: transaction, error: txError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!txError && transaction) {
    console.log('\n📝 Transaction recorded:')
    console.log(`   Type: ${transaction.type}`)
    console.log(`   Amount: ${transaction.amount}`)
    console.log(`   Description: ${transaction.description}`)
    console.log(`   Date: ${new Date(transaction.created_at).toLocaleString()}`)
  }
}

// Get command line arguments
const email = process.argv[2] || 'kevinfremon@gmail.com'
const credits = parseInt(process.argv[3]) || 50
const description = process.argv[4] || 'Testing credits added by admin'

console.log('🚀 Adding Credits to User Account')
console.log('=' .repeat(60))
console.log(`📧 Email: ${email}`)
console.log(`💳 Credits: ${credits}`)
console.log(`📝 Description: ${description}`)
console.log('=' .repeat(60))

addCreditsToUser(email, credits, description)
  .then(() => {
    console.log('\n✨ Done!')
  })
  .catch(error => {
    console.error('❌ Error:', error.message)
  })
