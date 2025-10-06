import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const newCreditPacks = [
  {
    name: 'Starter',
    credits: 20,
    price_in_cents: 1999,
    savings: 0,
    is_popular: false,
    is_active: true
  },
  {
    name: 'Builder',
    credits: 50,
    price_in_cents: 4499,
    savings: 10,
    is_popular: false,
    is_active: true
  },
  {
    name: 'Pro',
    credits: 100,
    price_in_cents: 8499,
    savings: 15,
    is_popular: true,
    is_active: true
  },
  {
    name: 'Power',
    credits: 250,
    price_in_cents: 17499,
    savings: 30,
    is_popular: false,
    is_active: true
  },
  {
    name: 'Agency',
    credits: 500,
    price_in_cents: 29999,
    savings: 40,
    is_popular: false,
    is_active: true
  },
  {
    name: 'SUPER',
    credits: 1000,
    price_in_cents: 49999,
    savings: 50,
    is_popular: false,
    is_active: true
  }
]

async function updateCreditPacks() {
  console.log('🚀 Updating credit packs...\n')

  // First, deactivate all existing packs
  const { error: deactivateError } = await supabase
    .from('credit_packs')
    .update({ is_active: false })
    .eq('is_active', true) // Update all active packs

  if (deactivateError) {
    console.error('❌ Error deactivating old packs:', deactivateError)
    process.exit(1)
  }

  console.log('✅ Deactivated old credit packs\n')

  // Insert/update new packs
  for (const pack of newCreditPacks) {
    const pricePerCredit = (pack.price_in_cents / 100 / pack.credits).toFixed(2)

    console.log(`📦 ${pack.name}`)
    console.log(`   ${pack.credits} credits`)
    console.log(`   $${(pack.price_in_cents / 100).toFixed(2)}`)
    console.log(`   $${pricePerCredit}/credit`)
    if (pack.savings > 0) {
      console.log(`   ${pack.savings}% off`)
    }
    if (pack.is_popular) {
      console.log(`   ⭐ Most Popular`)
    }
    console.log('')

    const { error } = await supabase
      .from('credit_packs')
      .insert(pack)

    if (error) {
      console.error(`❌ Error updating ${pack.name}:`, error)
      process.exit(1)
    }
  }

  console.log('✅ Successfully updated all credit packs!')
  console.log('\n📊 Summary:')
  console.log(`   Total packs: ${newCreditPacks.length}`)
  console.log(`   Most popular: ${newCreditPacks.find(p => p.is_popular)?.name}`)

  process.exit(0)
}

updateCreditPacks()
