// IMPORTANT: Load environment variables FIRST
import '../config/env.js'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  User,
  CreditTransaction,
  SchemaGenerationResult,
  UsageAnalytics,
  CreditPack,
  PaymentIntent,
  PaginatedResponse,
  UserDomain,
  DiscoveredUrl,
  UrlLibraryFilters,
  SupportTicket
} from 'aeo-schema-generator-shared/types'

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          credit_balance: number
          total_credits_used: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          credit_balance?: number
          total_credits_used?: number
          is_active?: boolean
        }
        Update: {
          email?: string
          first_name?: string | null
          last_name?: string | null
          credit_balance?: number
          total_credits_used?: number
          is_active?: boolean
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          amount: number
          description: string
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          amount: number
          description: string
          stripe_payment_intent_id?: string | null
        }
      }
      schema_generations: {
        Row: {
          id: string
          user_id: string
          url: string
          schemas: any[] | null
          status: 'success' | 'failed' | 'processing'
          error_message: string | null
          credits_cost: number
          processing_time_ms: number | null
          discovered_url_id: string | null
          schema_score: any | null
          refinement_count: number
          created_at: string
        }
        Insert: {
          user_id: string
          url: string
          schemas?: any[] | null
          status?: 'success' | 'failed' | 'processing'
          error_message?: string | null
          credits_cost?: number
          processing_time_ms?: number | null
          discovered_url_id?: string | null
          schema_score?: any | null
          refinement_count?: number
        }
        Update: {
          schemas?: any[] | null
          status?: 'success' | 'failed' | 'processing'
          error_message?: string | null
          processing_time_ms?: number | null
          schema_score?: any | null
          refinement_count?: number
        }
      }
      usage_analytics: {
        Row: {
          id: string
          user_id: string | null
          action: 'schema_generation' | 'schema_validation' | 'credit_purchase' | 'login' | 'signup'
          metadata: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          action: 'schema_generation' | 'schema_validation' | 'credit_purchase' | 'login' | 'signup'
          metadata?: any | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      credit_packs: {
        Row: {
          id: string
          name: string
          credits: number
          price_in_cents: number
          savings: number | null
          is_popular: boolean
          is_active: boolean
          created_at: string
        }
      }
      payment_intents: {
        Row: {
          id: string
          user_id: string
          credit_pack_id: string
          stripe_payment_intent_id: string
          status: 'pending' | 'succeeded' | 'failed' | 'canceled'
          amount_in_cents: number
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          credit_pack_id: string
          stripe_payment_intent_id: string
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
          amount_in_cents: number
          credits: number
        }
        Update: {
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_name: string
          category: 'general' | 'feature_request' | 'bug_report'
          message: string
          status: 'open' | 'in_progress' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          user_email: string
          user_name: string
          category: 'general' | 'feature_request' | 'bug_report'
          message: string
          status?: 'open' | 'in_progress' | 'resolved'
        }
      }
    }
    Functions: {
      upsert_user_from_clerk: {
        Args: {
          p_user_id: string
          p_email: string
          p_first_name?: string
          p_last_name?: string
        }
        Returns: void
      }
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_description: string
          p_stripe_payment_intent_id?: string
        }
        Returns: void
      }
      consume_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_description: string
        }
        Returns: boolean
      }
      get_user_stats: {
        Args: {
          p_user_id: string
        }
        Returns: {
          credit_balance: number
          total_credits_used: number
          total_schemas_generated: number
          successful_generations: number
          failed_generations: number
          total_spent_cents: number
        }[]
      }
      track_usage: {
        Args: {
          p_user_id: string
          p_action: 'schema_generation' | 'schema_validation' | 'credit_purchase' | 'login' | 'signup'
          p_metadata?: any
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: void
      }
    }
  }
}

class DatabaseService {
  private supabase: SupabaseClient<Database>
  private mockUsers = new Map<string, User>() // In-memory store for development

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('🔍 DatabaseService Constructor Debug:')
    console.log('  SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING')
    console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Missing Supabase configuration - using mock database for development')
      this.supabase = null as any
    } else {
      console.log('✅ Initializing Supabase client with real database')
      this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
  }

  private isDatabaseAvailable(): boolean {
    return this.supabase !== null
  }

  // User operations
  async upsertUserFromClerk(
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: upsertUserFromClerk', { userId, email, firstName, lastName })
      // Create user in mock store
      const user: User = {
        id: userId,
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        creditBalance: 0, // Will be updated by addCredits
        totalCreditsUsed: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.mockUsers.set(userId, user)
      return
    }

    const { error } = await this.supabase.rpc('upsert_user_from_clerk', {
      p_user_id: userId,
      p_email: email,
      p_first_name: firstName || null,
      p_last_name: lastName || null
    })

    if (error) throw error
  }

  async getUser(userId: string): Promise<User | null> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getUser', { userId })
      // Check if user exists in mock store
      let user = this.mockUsers.get(userId)

      // Auto-initialize user if they don't exist (for development)
      if (!user && userId === 'mock-user-id') {
        console.log('Mock: Auto-initializing user with 2 credits')
        user = {
          id: userId,
          email: 'dev@example.com',
          firstName: 'Dev',
          lastName: 'User',
          creditBalance: 2,
          totalCreditsUsed: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        this.mockUsers.set(userId, user)
      }

      return user || null
    }

    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data ? {
      id: data.id,
      email: data.email,
      firstName: data.first_name || undefined,
      lastName: data.last_name || undefined,
      creditBalance: data.credit_balance,
      totalCreditsUsed: data.total_credits_used,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        email: updates.email,
        first_name: updates.firstName || null,
        last_name: updates.lastName || null
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name || undefined,
      lastName: data.last_name || undefined,
      creditBalance: data.credit_balance,
      totalCreditsUsed: data.total_credits_used,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // Credit operations
  async addCredits(
    userId: string,
    amount: number,
    description: string,
    stripePaymentIntentId?: string
  ): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: addCredits', { userId, amount, description, stripePaymentIntentId })
      // Add credits to mock user
      const user = this.mockUsers.get(userId)
      if (user) {
        user.creditBalance += amount
        user.updatedAt = new Date().toISOString()
        this.mockUsers.set(userId, user)
      }
      return
    }

    const { error } = await this.supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
      p_stripe_payment_intent_id: stripePaymentIntentId || null
    })

    if (error) throw error
  }

  async consumeCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: consumeCredits', { userId, amount, description })
      // Check if user has sufficient credits and consume them
      const user = this.mockUsers.get(userId)
      if (!user || user.creditBalance < amount) {
        return false
      }

      user.creditBalance -= amount
      user.totalCreditsUsed += amount
      user.updatedAt = new Date().toISOString()
      this.mockUsers.set(userId, user)
      return true
    }

    const { data, error } = await this.supabase.rpc('consume_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description
    })

    if (error) throw error
    return data || false
  }

  async getCreditTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<CreditTransaction>> {
    const offset = (page - 1) * limit

    const { data, error, count } = await this.supabase
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: data.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        amount: row.amount,
        description: row.description,
        stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
        createdAt: row.created_at
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrevious: page > 1
      }
    }
  }

  // Credit pack operations
  async getCreditPacks(): Promise<CreditPack[]> {
    const { data, error } = await this.supabase
      .from('credit_packs')
      .select('*')
      .eq('is_active', true)
      .order('credits', { ascending: true })

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      name: row.name,
      credits: row.credits,
      priceInCents: row.price_in_cents,
      savings: row.savings || undefined,
      isPopular: row.is_popular
    }))
  }

  async getCreditPack(id: string): Promise<CreditPack | null> {
    const { data, error } = await this.supabase
      .from('credit_packs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data ? {
      id: data.id,
      name: data.name,
      credits: data.credits,
      priceInCents: data.price_in_cents,
      savings: data.savings || undefined,
      isPopular: data.is_popular
    } : null
  }

  // Schema generation operations
  async createSchemaGeneration(
    userId: string,
    url: string,
    creditsCost: number = 1
  ): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      const generationId = `mock-generation-${Date.now()}`
      console.log('Mock: createSchemaGeneration', { userId, url, creditsCost, generationId })
      return generationId
    }

    const { data, error } = await this.supabase
      .from('schema_generations')
      .insert({
        user_id: userId,
        url,
        credits_cost: creditsCost
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async updateSchemaGeneration(
    id: string,
    updates: {
      schemas?: any[]
      status?: 'success' | 'failed' | 'processing'
      errorMessage?: string
      processingTimeMs?: number
      schemaScore?: any
      refinementCount?: number
    }
  ): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: updateSchemaGeneration', { id, updates })
      return
    }

    const updateData: any = {
      schemas: updates.schemas,
      status: updates.status,
      error_message: updates.errorMessage || null,
      processing_time_ms: updates.processingTimeMs || null,
      schema_score: updates.schemaScore || null
    }

    // Only include refinement_count if it's explicitly provided
    if (updates.refinementCount !== undefined) {
      updateData.refinement_count = updates.refinementCount
    }

    const { error } = await this.supabase
      .from('schema_generations')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
  }

  async getSchemaGenerations(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<SchemaGenerationResult>> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getSchemaGenerations', { userId, page, limit })
      // Return empty result for development
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasNext: false,
          hasPrevious: false
        }
      }
    }

    const offset = (page - 1) * limit

    const { data, error, count } = await this.supabase
      .from('schema_generations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: data.map(row => ({
        id: row.id,
        userId: row.user_id,
        url: row.url,
        schemas: row.schemas || [],
        status: row.status,
        errorMessage: row.error_message || undefined,
        creditsCost: row.credits_cost,
        processingTimeMs: row.processing_time_ms || undefined,
        createdAt: row.created_at
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrevious: page > 1
      }
    }
  }

  // Analytics operations
  async trackUsage(
    userId: string,
    action: 'schema_generation' | 'schema_validation' | 'credit_purchase' | 'login' | 'signup',
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: trackUsage', { userId, action, metadata, ipAddress, userAgent })
      return
    }

    const { error } = await this.supabase.rpc('track_usage', {
      p_user_id: userId,
      p_action: action,
      p_metadata: metadata || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null
    })

    if (error) throw error
  }

  // User statistics
  async getUserStats(userId: string) {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getUserStats', { userId })
      // Return mock user stats for development
      const user = this.mockUsers.get(userId)
      return {
        credit_balance: user?.creditBalance || 0,
        total_credits_used: user?.totalCreditsUsed || 0,
        total_schemas_generated: 0,
        successful_generations: 0,
        failed_generations: 0,
        total_spent_cents: 0
      }
    }

    // Get user credit balance from users table
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('credit_balance, total_credits_used')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Get schema generation stats
    const { data: schemaStats, error: schemaError } = await this.supabase
      .from('schema_generations')
      .select('status')
      .eq('user_id', userId)

    if (schemaError) throw schemaError

    const totalSchemas = schemaStats?.length || 0
    const successfulGenerations = schemaStats?.filter(s => s.status === 'success').length || 0
    const failedGenerations = schemaStats?.filter(s => s.status === 'failed').length || 0

    // Get total spent from payment intents
    const { data: paymentStats, error: paymentError } = await this.supabase
      .from('payment_intents')
      .select('amount_in_cents')
      .eq('user_id', userId)
      .eq('status', 'succeeded')

    if (paymentError) throw paymentError

    const totalSpentCents = paymentStats?.reduce((sum, p) => sum + (p.amount_in_cents || 0), 0) || 0

    return {
      credit_balance: userData?.credit_balance || 0,
      total_credits_used: userData?.total_credits_used || 0,
      total_schemas_generated: totalSchemas,
      successful_generations: successfulGenerations,
      failed_generations: failedGenerations,
      total_spent_cents: totalSpentCents
    }
  }

  // Payment intent operations
  async createPaymentIntent(paymentData: {
    userId: string
    creditPackId: string
    stripePaymentIntentId: string
    amountInCents: number
    credits: number
    status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
  }): Promise<string> {
    const { data, error } = await this.supabase
      .from('payment_intents')
      .insert({
        user_id: paymentData.userId,
        credit_pack_id: paymentData.creditPackId,
        stripe_payment_intent_id: paymentData.stripePaymentIntentId,
        amount_in_cents: paymentData.amountInCents,
        credits: paymentData.credits,
        status: paymentData.status || 'pending'
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async updatePaymentIntent(
    stripePaymentIntentId: string,
    status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  ): Promise<void> {
    const { error } = await this.supabase
      .from('payment_intents')
      .update({ status })
      .eq('stripe_payment_intent_id', stripePaymentIntentId)

    if (error) throw error
  }

  async getPaymentHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<PaymentIntent>> {
    const offset = (page - 1) * limit

    const { data, error, count } = await this.supabase
      .from('payment_intents')
      .select(`
        *,
        credit_packs(name, credits, price_in_cents)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: data.map(row => ({
        id: row.id,
        userId: row.user_id,
        creditPackId: row.credit_pack_id,
        stripePaymentIntentId: row.stripe_payment_intent_id,
        status: row.status,
        amountInCents: row.amount_in_cents,
        credits: row.credits,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrevious: page > 1
      }
    }
  }

  // URL Library operations
  async saveOrUpdateDomain(userId: string, domain: string): Promise<UserDomain> {
    const { data, error } = await this.supabase
      .from('user_domains')
      .upsert({
        user_id: userId,
        domain,
        last_crawled_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,domain',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      domain: data.domain,
      lastCrawledAt: data.last_crawled_at,
      totalUrlsDiscovered: data.total_urls_discovered,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async getUserDomains(userId: string): Promise<UserDomain[]> {
    const { data, error } = await this.supabase
      .from('user_domains')
      .select('*')
      .eq('user_id', userId)
      .order('last_crawled_at', { ascending: false })

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      domain: row.domain,
      lastCrawledAt: row.last_crawled_at,
      totalUrlsDiscovered: row.total_urls_discovered,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async deleteDomain(domainId: string): Promise<void> {
    // Delete the domain (CASCADE will automatically delete all associated discovered_urls)
    const { error } = await this.supabase
      .from('user_domains')
      .delete()
      .eq('id', domainId)

    if (error) throw error
  }

  async saveDiscoveredUrls(
    userId: string,
    domainId: string,
    urls: Array<{ url: string; path: string; depth: number }>
  ): Promise<void> {
    // Prepare bulk insert data
    const urlsToInsert = urls.map(url => ({
      user_id: userId,
      domain_id: domainId,
      url: url.url,
      path: url.path,
      depth: url.depth,
      is_hidden: false, // Explicitly set is_hidden to false for new URLs
      has_schema: false // Explicitly set has_schema to false for new URLs
    }))

    // Insert URLs (on conflict, do nothing to preserve existing data)
    const { error } = await this.supabase
      .from('discovered_urls')
      .upsert(urlsToInsert, {
        onConflict: 'user_id,url',
        ignoreDuplicates: true
      })

    if (error) throw error

    // Update domain's total_urls_discovered count
    const { error: countError } = await this.supabase
      .from('user_domains')
      .update({
        total_urls_discovered: urls.length,
        last_crawled_at: new Date().toISOString()
      })
      .eq('id', domainId)

    if (countError) throw countError
  }

  async getUserUrls(userId: string, filters?: UrlLibraryFilters): Promise<DiscoveredUrl[]> {
    let query = this.supabase
      .from('discovered_urls')
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (filters?.domainId) {
      query = query.eq('domain_id', filters.domainId)
    }
    if (filters?.hasSchema !== undefined) {
      query = query.eq('has_schema', filters.hasSchema)
    }
    // Only filter by is_hidden if explicitly provided
    // By default (when isHidden is undefined), show only non-hidden URLs
    if (filters?.isHidden !== undefined) {
      query = query.eq('is_hidden', filters.isHidden)
    } else {
      // Default: don't show hidden URLs
      query = query.eq('is_hidden', false)
    }
    if (filters?.search) {
      query = query.ilike('url', `%${filters.search}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      domainId: row.domain_id,
      url: row.url,
      path: row.path,
      depth: row.depth,
      isHidden: row.is_hidden,
      hasSchema: row.has_schema,
      lastSchemaGeneratedAt: row.last_schema_generated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async hideUrl(urlId: string): Promise<void> {
    const { error } = await this.supabase
      .from('discovered_urls')
      .update({ is_hidden: true })
      .eq('id', urlId)

    if (error) throw error
  }

  async unhideUrl(urlId: string): Promise<void> {
    const { error } = await this.supabase
      .from('discovered_urls')
      .update({ is_hidden: false })
      .eq('id', urlId)

    if (error) throw error
  }

  async getDiscoveredUrlByUrl(userId: string, url: string): Promise<DiscoveredUrl | null> {
    const { data, error } = await this.supabase
      .from('discovered_urls')
      .select('*')
      .eq('user_id', userId)
      .eq('url', url)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      id: data.id,
      userId: data.user_id,
      domainId: data.domain_id,
      url: data.url,
      path: data.path,
      depth: data.depth,
      isHidden: data.is_hidden,
      hasSchema: data.has_schema,
      lastSchemaGeneratedAt: data.last_schema_generated_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async getSchemaByDiscoveredUrlId(discoveredUrlId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('schema_generations')
      .select('*')
      .eq('discovered_url_id', discoveredUrlId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      id: data.id,
      userId: data.user_id,
      url: data.url,
      schemas: data.schemas,
      schemaScore: data.schema_score,
      refinementCount: data.refinement_count,
      status: data.status,
      creditsCost: data.credits_cost,
      processingTimeMs: data.processing_time_ms,
      errorMessage: data.error_message,
      discoveredUrlId: data.discovered_url_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async updateSchemaGeneration(schemaId: string, schemas: any[]): Promise<void> {
    const { error } = await this.supabase
      .from('schema_generations')
      .update({ schemas })
      .eq('id', schemaId)

    if (error) throw error
  }

  async incrementRefinementCount(schemaId: string): Promise<void> {
    // Get current count
    const { data, error: fetchError } = await this.supabase
      .from('schema_generations')
      .select('refinement_count')
      .eq('id', schemaId)
      .single()

    if (fetchError) throw fetchError

    // Increment count
    const { error: updateError } = await this.supabase
      .from('schema_generations')
      .update({ refinement_count: (data.refinement_count || 0) + 1 })
      .eq('id', schemaId)

    if (updateError) throw updateError
  }

  /**
   * Save a single URL to the library (used during direct schema generation)
   * Optionally associates the URL with a domain
   * Uses UPDATE for existing URLs to preserve has_schema status
   */
  async saveSingleUrlToLibrary(
    userId: string,
    url: string,
    path: string,
    depth: number,
    domainId?: string | null
  ): Promise<DiscoveredUrl> {
    console.log('💾 saveSingleUrlToLibrary called:', { userId, url, domainId })

    // First, check if URL already exists
    const { data: existing, error: checkError } = await this.supabase
      .from('discovered_urls')
      .select('*')
      .eq('user_id', userId)
      .eq('url', url)
      .maybeSingle()

    if (checkError) {
      throw new Error(`Failed to check existing URL: ${checkError.message}`)
    }

    let data

    if (existing) {
      // URL exists - UPDATE only the timestamp and domain (preserve has_schema)
      console.log('📝 URL exists, updating timestamp only:', { existingId: existing.id, hasSchema: existing.has_schema })
      const { data: updated, error: updateError } = await this.supabase
        .from('discovered_urls')
        .update({
          domain_id: domainId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update URL in library: ${updateError.message}`)
      }
      data = updated
    } else {
      // URL doesn't exist - INSERT new record
      console.log('✨ URL is new, inserting into library')
      const { data: inserted, error: insertError } = await this.supabase
        .from('discovered_urls')
        .insert({
          user_id: userId,
          url,
          path,
          depth,
          domain_id: domainId || null,
          is_hidden: false,
          has_schema: false
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to insert URL to library: ${insertError.message}`)
      }
      data = inserted
    }

    console.log('✅ saveSingleUrlToLibrary completed:', { id: data.id, hasSchema: data.has_schema })

    return {
      id: data.id,
      userId: data.user_id,
      domainId: data.domain_id,
      url: data.url,
      path: data.path,
      depth: data.depth,
      isHidden: data.is_hidden,
      hasSchema: data.has_schema,
      lastSchemaGeneratedAt: data.last_schema_generated_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  /**
   * Update schema generation record with discovered_url_id link
   * Also updates the discovered_url to mark has_schema = true
   */
  async linkSchemaToDiscoveredUrl(
    schemaId: string,
    discoveredUrlId: string
  ): Promise<void> {
    console.log('🔗 linkSchemaToDiscoveredUrl called:', { schemaId, discoveredUrlId })

    // First, update discovered_urls to mark has_schema = true
    // This ensures the URL is marked BEFORE we link the schema
    const { data: urlData, error: urlError } = await this.supabase
      .from('discovered_urls')
      .update({
        has_schema: true,
        last_schema_generated_at: new Date().toISOString()
      })
      .eq('id', discoveredUrlId)
      .select()
      .single()

    if (urlError) {
      throw new Error(`Failed to update URL schema status: ${urlError.message}`)
    }

    console.log('✅ URL marked as has_schema:', { urlId: discoveredUrlId, hasSchema: urlData.has_schema })

    // Then update schema_generations to link to discovered URL
    const { error: schemaError } = await this.supabase
      .from('schema_generations')
      .update({ discovered_url_id: discoveredUrlId })
      .eq('id', schemaId)

    if (schemaError) {
      throw new Error(`Failed to link schema to URL: ${schemaError.message}`)
    }

    console.log('🔗 Schema linked to URL successfully')
  }

  async deleteDiscoveredUrl(urlId: string, userId: string): Promise<void> {
    console.log('🗑️ Deleting discovered URL:', { urlId, userId })

    // First verify the URL belongs to the user
    const { data: url, error: fetchError } = await this.supabase
      .from('discovered_urls')
      .select('id')
      .eq('id', urlId)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      throw new Error(`Failed to verify URL ownership: ${fetchError.message}`)
    }

    if (!url) {
      throw new Error('URL not found or does not belong to user')
    }

    // Delete the URL (schema_generations will be unlinked via setting discovered_url_id to NULL)
    const { error: deleteError } = await this.supabase
      .from('discovered_urls')
      .delete()
      .eq('id', urlId)
      .eq('user_id', userId)

    if (deleteError) {
      throw new Error(`Failed to delete URL: ${deleteError.message}`)
    }

    console.log('✅ URL deleted successfully')
  }

  // ===================
  // ADMIN METHODS
  // ===================

  async searchUsersByEmail(query: string): Promise<User[]> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: searchUsersByEmail', { query })
      const users = Array.from(this.mockUsers.values())
      return users.filter(u => u.email.toLowerCase().includes(query.toLowerCase()))
    }

    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .ilike('email', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name || undefined,
      lastName: row.last_name || undefined,
      creditBalance: row.credit_balance,
      totalCreditsUsed: row.total_credits_used,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async getAllUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getAllUsers')
      return Array.from(this.mockUsers.values())
    }

    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name || undefined,
      lastName: row.last_name || undefined,
      creditBalance: row.credit_balance,
      totalCreditsUsed: row.total_credits_used,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async getUserActivity(userId: string, limit: number = 20): Promise<UsageAnalytics[]> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getUserActivity', { userId })
      return []
    }

    const { data, error } = await this.supabase
      .from('usage_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      userId: row.user_id || undefined,
      action: row.action,
      metadata: row.metadata || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      createdAt: row.created_at
    }))
  }

  async deleteUserCompletely(userId: string): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: deleteUserCompletely', { userId })
      this.mockUsers.delete(userId)
      return
    }

    // Delete in order due to foreign key constraints
    // 1. Delete discovered URLs
    const { error: urlsError } = await this.supabase
      .from('discovered_urls')
      .delete()
      .eq('user_id', userId)

    if (urlsError) throw urlsError

    // 2. Delete user domains
    const { error: domainsError } = await this.supabase
      .from('user_domains')
      .delete()
      .eq('user_id', userId)

    if (domainsError) throw domainsError

    // 3. Delete schema generations
    const { error: schemasError } = await this.supabase
      .from('schema_generations')
      .delete()
      .eq('user_id', userId)

    if (schemasError) throw schemasError

    // 4. Delete credit transactions
    const { error: transactionsError } = await this.supabase
      .from('credit_transactions')
      .delete()
      .eq('user_id', userId)

    if (transactionsError) throw transactionsError

    // 5. Delete payment intents
    const { error: paymentsError } = await this.supabase
      .from('payment_intents')
      .delete()
      .eq('user_id', userId)

    if (paymentsError) throw paymentsError

    // 6. Delete usage analytics
    const { error: analyticsError } = await this.supabase
      .from('usage_analytics')
      .delete()
      .eq('user_id', userId)

    if (analyticsError) throw analyticsError

    // 7. Finally, delete the user
    const { error: userError } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) throw userError

    console.log(`✅ User ${userId} deleted completely with all associated data`)
  }

  async getPlatformStats(): Promise<{
    totalUsers: number
    activeUsers: number
    totalSchemas: number
    totalCreditsDistributed: number
    totalCreditsUsed: number
  }> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getPlatformStats')
      return {
        totalUsers: this.mockUsers.size,
        activeUsers: this.mockUsers.size,
        totalSchemas: 0,
        totalCreditsDistributed: 0,
        totalCreditsUsed: 0
      }
    }

    // Get total users
    const { count: totalUsers, error: usersError } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) throw usersError

    // Get active users (last 30 days) - count distinct users
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activeUserData, error: activeError } = await this.supabase
      .from('usage_analytics')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (activeError) throw activeError

    // Count distinct users
    const activeUsers = activeUserData
      ? new Set(activeUserData.map(a => a.user_id)).size
      : 0

    // Get total schemas
    const { count: totalSchemas, error: schemasError } = await this.supabase
      .from('schema_generations')
      .select('*', { count: 'exact', head: true })

    if (schemasError) throw schemasError

    // Get credit stats
    const { data: creditStats, error: creditError } = await this.supabase
      .from('users')
      .select('credit_balance, total_credits_used')

    if (creditError) throw creditError

    const totalCreditsDistributed = creditStats.reduce((sum, u) => sum + u.credit_balance, 0)
    const totalCreditsUsed = creditStats.reduce((sum, u) => sum + u.total_credits_used, 0)

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalSchemas: totalSchemas || 0,
      totalCreditsDistributed,
      totalCreditsUsed
    }
  }

  /**
   * Check if a normalized URL exists in the user's library with schema
   * Returns the URL ID and creation date if found
   */
  async checkUrlExists(userId: string, normalizedUrl: string): Promise<{
    exists: boolean
    urlId?: string
    createdAt?: string
    hasSchema: boolean
  }> {
    const { data, error} = await this.supabase
      .from('discovered_urls')
      .select('id, created_at, has_schema, is_hidden')
      .eq('user_id', userId)
      .eq('url', normalizedUrl)
      .maybeSingle()

    if (error) throw error

    if (!data || data.is_hidden) {
      return { exists: false, hasSchema: false }
    }

    return {
      exists: true,
      urlId: data.id,
      createdAt: data.created_at,
      hasSchema: data.has_schema
    }
  }

  // ===================
  // SUPPORT TICKET METHODS
  // ===================

  async createSupportTicket(
    userId: string,
    userEmail: string,
    userName: string,
    category: 'general' | 'feature_request' | 'bug_report',
    message: string
  ): Promise<SupportTicket> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: createSupportTicket', { userId, category, message })
      const mockTicket: SupportTicket = {
        id: `mock-ticket-${Date.now()}`,
        userId,
        userEmail,
        userName,
        category,
        message,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return mockTicket
    }

    const { data, error } = await this.supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        category,
        message,
        status: 'open'
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      userEmail: data.user_email,
      userName: data.user_name,
      category: data.category,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getSupportTickets')
      return []
    }

    const { data, error } = await this.supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      category: row.category,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async deleteSupportTicket(ticketId: string): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: deleteSupportTicket', { ticketId })
      return
    }

    const { error } = await this.supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId)

    if (error) throw error
  }

  async deleteSupportTickets(ticketIds: string[]): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: deleteSupportTickets', { ticketIds })
      return
    }

    const { error } = await this.supabase
      .from('support_tickets')
      .delete()
      .in('id', ticketIds)

    if (error) throw error
  }
}

export const db = new DatabaseService()