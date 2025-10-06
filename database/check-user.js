#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const userId = 'user_33Fdrdz4hyXRWshiOjEsVOGmbTv'

console.log('🔍 Checking user in Supabase...\n')

// Get user
const { data: user, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

if (userError) {
  console.error('❌ Error:', userError.message)
  process.exit(1)
}

if (!user) {
  console.log('❌ User not found!')
  process.exit(1)
}

console.log('✅ User found in database:')
console.log('━'.repeat(60))
console.log(`ID:              ${user.id}`)
console.log(`Email:           ${user.email}`)
console.log(`Name:            ${user.first_name} ${user.last_name}`)
console.log(`Credit Balance:  ${user.credit_balance} credits`)
console.log(`Total Used:      ${user.total_credits_used} credits`)
console.log(`Active:          ${user.is_active}`)
console.log(`Created:         ${user.created_at}`)
console.log(`Updated:         ${user.updated_at}`)
console.log('━'.repeat(60))

// Get recent transactions
const { data: transactions } = await supabase
  .from('credit_transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(5)

console.log('\n📊 Recent Transactions:')
console.log('━'.repeat(60))
if (transactions && transactions.length > 0) {
  transactions.forEach(t => {
    console.log(`${t.type.toUpperCase()}: ${t.amount} credits - ${t.description}`)
    console.log(`   Status: ${t.status}, Date: ${new Date(t.created_at).toLocaleString()}`)
  })
} else {
  console.log('No transactions found')
}
console.log('━'.repeat(60))
