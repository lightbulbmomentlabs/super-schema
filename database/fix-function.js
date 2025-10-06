#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fix() {
  console.log('🔧 Applying fix for get_user_stats function...')

  const sql = readFileSync(join(__dirname, 'migrations/004_fix_get_user_stats.sql'), 'utf-8')

  // Test the function after
  console.log('✅ Please run migrations/004_fix_get_user_stats.sql in Supabase SQL Editor')
  console.log('🔗 https://app.supabase.com/project/atopvinhrlicujtwltsg/sql/new')
  console.log('\nSQL to run:')
  console.log(sql)
}

fix()
