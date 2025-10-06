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

async function createUserAndAddCredits(email, firstName, lastName, creditsToAdd) {
  console.log('🔍 Checking if user exists...')

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  let userId

  if (existingUser) {
    console.log(`✅ User already exists: ${existingUser.first_name} ${existingUser.last_name}`)
    console.log(`   Current balance: ${existingUser.credit_balance} credits`)
    userId = existingUser.id
  } else {
    // Create a manual user ID (in production, this would come from Clerk)
    userId = 'manual_' + Date.now()

    console.log('📝 Creating new user...')
    const { error: createError } = await supabase.rpc('upsert_user_from_clerk', {
      p_user_id: userId,
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName
    })

    if (createError) {
      console.error('❌ Error creating user:', createError.message)
      return
    }

    console.log(`✅ User created with ID: ${userId}`)
    console.log(`   Email: ${email}`)
    console.log(`   Initial balance: 2 credits (free signup bonus)`)
  }

  // Add additional credits
  if (creditsToAdd > 0) {
    console.log(`\n💰 Adding ${creditsToAdd} credits...`)
    const { error: addError } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: creditsToAdd,
      p_description: 'Testing credits added by admin'
    })

    if (addError) {
      console.error('❌ Error adding credits:', addError.message)
      return
    }
  }

  // Get final balance
  const { data: finalUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (fetchError || !finalUser) {
    console.error('❌ Error fetching final user data')
    return
  }

  console.log('\n✅ Success!')
  console.log('=' .repeat(60))
  console.log(`👤 User: ${finalUser.first_name} ${finalUser.last_name}`)
  console.log(`📧 Email: ${finalUser.email}`)
  console.log(`💳 Final Balance: ${finalUser.credit_balance} credits`)
  console.log(`🆔 User ID: ${finalUser.id}`)
  console.log('=' .repeat(60))

  // Show recent transactions
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (transactions && transactions.length > 0) {
    console.log('\n📝 Recent Transactions:')
    transactions.forEach((tx, i) => {
      const date = new Date(tx.created_at).toLocaleString()
      const sign = tx.amount > 0 ? '+' : ''
      console.log(`   ${i + 1}. ${sign}${tx.amount} credits - ${tx.description} (${date})`)
    })
  }

  console.log('\n💡 Tip: You can now use these credits in your app at http://localhost:3000')
}

// Get command line arguments
const email = process.argv[2] || 'kevinfremon@gmail.com'
const firstName = process.argv[3] || 'Kevin'
const lastName = process.argv[4] || 'Fremon'
const creditsToAdd = parseInt(process.argv[5]) || 50

console.log('🚀 Creating User & Adding Credits')
console.log('=' .repeat(60))
console.log(`📧 Email: ${email}`)
console.log(`👤 Name: ${firstName} ${lastName}`)
console.log(`💳 Credits to add: ${creditsToAdd}`)
console.log('=' .repeat(60))
console.log()

createUserAndAddCredits(email, firstName, lastName, creditsToAdd)
  .then(() => {
    console.log('\n✨ All done!')
  })
  .catch(error => {
    console.error('❌ Error:', error.message)
  })
