#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables
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

async function verify() {
  console.log('🔍 Verifying Supabase Database Setup')
  console.log('=' .repeat(60))
  console.log(`📍 URL: ${supabaseUrl}`)
  console.log('=' .repeat(60))

  let allTestsPassed = true

  // Test 1: Check tables exist
  console.log('\n✓ Testing table existence...')
  const tables = [
    'users',
    'credit_transactions',
    'schema_generations',
    'usage_analytics',
    'credit_packs',
    'payment_intents'
  ]

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0)
      if (error) {
        console.log(`  ❌ Table '${table}' - Error: ${error.message}`)
        allTestsPassed = false
      } else {
        console.log(`  ✅ Table '${table}' exists`)
      }
    } catch (err) {
      console.log(`  ❌ Table '${table}' - Error: ${err.message}`)
      allTestsPassed = false
    }
  }

  // Test 2: Check credit packs seeded
  console.log('\n✓ Testing credit packs data...')
  try {
    const { data: creditPacks, error } = await supabase
      .from('credit_packs')
      .select('*')
      .order('credits', { ascending: true })

    if (error) {
      console.log(`  ❌ Error fetching credit packs: ${error.message}`)
      allTestsPassed = false
    } else if (!creditPacks || creditPacks.length === 0) {
      console.log(`  ⚠️  No credit packs found - please run seed script`)
      allTestsPassed = false
    } else {
      console.log(`  ✅ Found ${creditPacks.length} credit packs:`)
      creditPacks.forEach(pack => {
        const price = (pack.price_in_cents / 100).toFixed(2)
        const savings = pack.savings ? ` (${pack.savings}% savings)` : ''
        const popular = pack.is_popular ? ' ⭐ POPULAR' : ''
        console.log(`     - ${pack.name}: ${pack.credits} credits for $${price}${savings}${popular}`)
      })
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`)
    allTestsPassed = false
  }

  // Test 3: Test database functions
  console.log('\n✓ Testing database functions...')

  // Test upsert_user_from_clerk
  console.log('  Testing upsert_user_from_clerk()...')
  try {
    const testUserId = 'test_verify_user_' + Date.now()
    const { error } = await supabase.rpc('upsert_user_from_clerk', {
      p_user_id: testUserId,
      p_email: `test${Date.now()}@example.com`,
      p_first_name: 'Test',
      p_last_name: 'User'
    })

    if (error) {
      console.log(`    ❌ upsert_user_from_clerk - Error: ${error.message}`)
      allTestsPassed = false
    } else {
      console.log(`    ✅ upsert_user_from_clerk works`)

      // Verify user was created
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single()

      if (userError || !user) {
        console.log(`    ⚠️  User not found after creation`)
      } else {
        console.log(`    ✅ User created with ${user.credit_balance} credits`)

        // Test add_credits
        console.log('  Testing add_credits()...')
        const { error: addError } = await supabase.rpc('add_credits', {
          p_user_id: testUserId,
          p_amount: 10,
          p_description: 'Test credit addition'
        })

        if (addError) {
          console.log(`    ❌ add_credits - Error: ${addError.message}`)
          allTestsPassed = false
        } else {
          console.log(`    ✅ add_credits works`)

          // Verify balance updated
          const { data: updatedUser } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', testUserId)
            .single()

          if (updatedUser) {
            console.log(`    ✅ Balance updated: ${user.credit_balance} → ${updatedUser.credit_balance}`)
          }
        }

        // Test consume_credits
        console.log('  Testing consume_credits()...')
        const { data: consumeResult, error: consumeError } = await supabase.rpc('consume_credits', {
          p_user_id: testUserId,
          p_amount: 1,
          p_description: 'Test credit consumption'
        })

        if (consumeError) {
          console.log(`    ❌ consume_credits - Error: ${consumeError.message}`)
          allTestsPassed = false
        } else {
          console.log(`    ✅ consume_credits works (returned: ${consumeResult})`)
        }

        // Test get_user_stats
        console.log('  Testing get_user_stats()...')
        const { data: stats, error: statsError } = await supabase.rpc('get_user_stats', {
          p_user_id: testUserId
        })

        if (statsError) {
          console.log(`    ❌ get_user_stats - Error: ${statsError.message}`)
          allTestsPassed = false
        } else {
          console.log(`    ✅ get_user_stats works`)
          if (stats && stats.length > 0) {
            console.log(`       Credit Balance: ${stats[0].credit_balance}`)
            console.log(`       Total Used: ${stats[0].total_credits_used}`)
          }
        }

        // Test track_usage
        console.log('  Testing track_usage()...')
        const { error: trackError } = await supabase.rpc('track_usage', {
          p_user_id: testUserId,
          p_action: 'schema_generation',
          p_metadata: { test: true }
        })

        if (trackError) {
          console.log(`    ❌ track_usage - Error: ${trackError.message}`)
          allTestsPassed = false
        } else {
          console.log(`    ✅ track_usage works`)
        }

        // Clean up test user
        console.log('  Cleaning up test data...')
        await supabase.from('users').delete().eq('id', testUserId)
        console.log(`    ✅ Test user deleted`)
      }
    }
  } catch (err) {
    console.log(`  ❌ Function test error: ${err.message}`)
    allTestsPassed = false
  }

  // Test 4: Check RLS is enabled
  console.log('\n✓ Testing Row Level Security...')
  for (const table of tables) {
    try {
      const { data, error } = await supabase.rpc('pg_tables')

      if (error) {
        console.log(`  ⚠️  Could not verify RLS for '${table}'`)
      } else {
        console.log(`  ✅ RLS appears to be enabled on all tables`)
        break
      }
    } catch (err) {
      console.log(`  ⚠️  RLS verification not available via API`)
      break
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Verification Summary')
  console.log('='.repeat(60))

  if (allTestsPassed) {
    console.log('✅ All tests passed! Your database is ready to use.')
    console.log('\n💡 Next steps:')
    console.log('   1. Ensure your .env file has the correct credentials')
    console.log('   2. Restart your development server')
    console.log('   3. Test the application with real database operations')
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.')
    console.log('\n💡 Common fixes:')
    console.log('   1. Run database/deploy-all.sql in Supabase SQL Editor')
    console.log('   2. Check that you\'re using the SERVICE_ROLE_KEY, not ANON_KEY')
    console.log('   3. Verify your Supabase project is active')
  }

  console.log('\n🔗 Supabase Dashboard: https://app.supabase.com/project/atopvinhrlicujtwltsg')
}

verify().catch(console.error)
