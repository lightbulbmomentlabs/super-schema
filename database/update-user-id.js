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

async function updateUserId(email, newUserId) {
  console.log('🔍 Finding user by email...')

  // Find user by email
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (findError || !user) {
    console.error('❌ User not found with email:', email)
    return
  }

  console.log(`✅ Found user: ${user.id}`)
  console.log(`   Current balance: ${user.credit_balance} credits`)

  console.log(`\n🔄 Updating user ID to: ${newUserId}`)

  // Update the user ID directly
  const { error: updateError } = await supabase
    .from('users')
    .update({ id: newUserId })
    .eq('email', email)

  if (updateError) {
    console.error('❌ Error updating user ID:', updateError.message)
    console.log('\n⚠️  This is expected - we need to update related records first')
    console.log('💡 Let me try a different approach...')

    // Delete the old user and create new one with Clerk ID
    console.log('\n📝 Creating new user with Clerk ID...')
    const { error: createError } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        email: email,
        first_name: user.first_name,
        last_name: user.last_name,
        credit_balance: user.credit_balance,
        total_credits_used: user.total_credits_used,
        is_active: user.is_active
      })

    if (createError) {
      console.error('❌ Error creating user:', createError.message)

      // User might already exist, just add credits
      console.log('\n💰 User might already exist, adding credits instead...')
      const { error: addError } = await supabase.rpc('add_credits', {
        p_user_id: newUserId,
        p_amount: user.credit_balance,
        p_description: `Credits transferred from account ${user.id}`
      })

      if (addError) {
        console.error('❌ Error adding credits:', addError.message)
        return
      }
    }

    // Delete old account
    console.log('🗑️  Deleting old account...')
    await supabase.from('users').delete().eq('id', user.id)
    console.log('✅ Old account deleted')
  }

  // Get final user
  const { data: finalUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', newUserId)
    .single()

  if (!finalUser) {
    console.error('❌ Could not find updated user')
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Success!')
  console.log('='.repeat(60))
  console.log(`👤 User: ${finalUser.first_name} ${finalUser.last_name}`)
  console.log(`📧 Email: ${finalUser.email}`)
  console.log(`🆔 User ID: ${finalUser.id}`)
  console.log(`💳 Credits: ${finalUser.credit_balance}`)
  console.log('='.repeat(60))
  console.log('\n✨ Your account is ready to use!')
}

const email = process.argv[2] || 'kevinfremon@gmail.com'
const newUserId = process.argv[3]

if (!newUserId) {
  console.error('❌ Please provide the new Clerk user ID')
  console.log('\nUsage:')
  console.log('  node database/update-user-id.js <email> <clerk-user-id>')
  process.exit(1)
}

console.log('🚀 Updating User ID to Clerk ID')
console.log('=' .repeat(60))
console.log(`📧 Email: ${email}`)
console.log(`🆔 New Clerk ID: ${newUserId}`)
console.log('=' .repeat(60))
console.log()

updateUserId(email, newUserId)
  .catch(error => {
    console.error('❌ Error:', error.message)
  })
