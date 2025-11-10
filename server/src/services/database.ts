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
  SupportTicket,
  ReleaseNote
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
          is_admin: boolean
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
          is_admin?: boolean
        }
        Update: {
          email?: string
          first_name?: string | null
          last_name?: string | null
          credit_balance?: number
          total_credits_used?: number
          is_active?: boolean
          is_admin?: boolean
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
          schema_type: string
          deletion_count: number
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
          schema_type?: string
          deletion_count?: number
        }
        Update: {
          schemas?: any[] | null
          status?: 'success' | 'failed' | 'processing'
          error_message?: string | null
          processing_time_ms?: number | null
          schema_score?: any | null
          refinement_count?: number
          schema_type?: string
          deletion_count?: number
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

    console.log('🔍 [Database] Get user:', {
      userId,
      found: !!data,
      organizationName: data?.organization_name,
      email: data?.email
    })

    return data ? {
      id: data.id,
      email: data.email,
      firstName: data.first_name || undefined,
      lastName: data.last_name || undefined,
      organizationName: data.organization_name || undefined,
      creditBalance: data.credit_balance,
      totalCreditsUsed: data.total_credits_used,
      isActive: data.is_active,
      isAdmin: data.is_admin || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    // Build update object with only provided fields
    const updateData: any = {}

    if (updates.email !== undefined) {
      updateData.email = updates.email
    }
    if (updates.firstName !== undefined) {
      updateData.first_name = updates.firstName || null
    }
    if (updates.lastName !== undefined) {
      updateData.last_name = updates.lastName || null
    }
    if (updates.organizationName !== undefined) {
      updateData.organization_name = updates.organizationName || null
    }

    console.log('🔧 [Database] Updating user:', { userId, updates, updateData })

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ [Database] Update user error:', error)
      throw error
    }

    console.log('✅ [Database] User updated successfully:', {
      userId: data.id,
      organizationName: data.organization_name,
      email: data.email
    })

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name || undefined,
      lastName: data.last_name || undefined,
      organizationName: data.organization_name || undefined,
      creditBalance: data.credit_balance,
      totalCreditsUsed: data.total_credits_used,
      isActive: data.is_active,
      isAdmin: data.is_admin || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    console.log('🔧 [Database] Updating user admin status:', { userId, isAdmin })

    const { data, error } = await this.supabase
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ [Database] Update admin status error:', error)
      throw error
    }

    console.log('✅ [Database] User admin status updated successfully:', {
      userId: data.id,
      email: data.email,
      isAdmin: data.is_admin
    })

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name || undefined,
      lastName: data.last_name || undefined,
      organizationName: data.organization_name || undefined,
      creditBalance: data.credit_balance,
      totalCreditsUsed: data.total_credits_used,
      isActive: data.is_active,
      isAdmin: data.is_admin,
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

  /**
   * Atomically consume credits with pessimistic row-level locking
   * Prevents race conditions where concurrent requests could cause negative balances
   * @param userId - The user ID
   * @param amount - Number of credits to consume
   * @param description - Description for the credit transaction
   * @returns true if credits were consumed, false if insufficient credits or lock unavailable
   */
  async consumeCreditsAtomic(
    userId: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      // Fallback to non-atomic version for mock environment
      return this.consumeCredits(userId, amount, description)
    }

    try {
      const { data, error } = await this.supabase.rpc('consume_credits_atomic', {
        p_user_id: userId,
        p_amount: amount,
        p_description: description
      })

      if (error) {
        // Check if it's a lock timeout error
        if (error.message?.includes('lock_not_available') ||
            error.message?.includes('could not obtain lock')) {
          console.warn(`[Credit Lock] Lock unavailable for user ${userId}, will retry`)
          return false
        }
        throw error
      }

      return data || false
    } catch (error) {
      console.error('[Credit Atomic] Error consuming credits:', error)
      throw error
    }
  }

  /**
   * Refund credits to a user
   * Used when schema generation fails after credits were consumed
   * @param userId - The user ID
   * @param amount - Number of credits to refund
   * @param description - Description for the refund transaction
   */
  async refundCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: refundCredits', { userId, amount, description })
      const user = this.mockUsers.get(userId)
      if (user) {
        user.creditBalance += amount
        user.totalCreditsUsed -= amount
        user.updatedAt = new Date().toISOString()
        this.mockUsers.set(userId, user)
      }
      return
    }

    const { error } = await this.supabase.rpc('refund_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description
    })

    if (error) {
      console.error('[Credit Refund] Error refunding credits:', error)
      throw error
    }

    console.log(`[Credit Refund] Refunded ${amount} credits to user ${userId}: ${description}`)
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
    creditsCost: number = 1,
    schemaType: string = 'Auto'
  ): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      const generationId = `mock-generation-${Date.now()}`
      console.log('Mock: createSchemaGeneration', { userId, url, creditsCost, schemaType, generationId })
      return generationId
    }

    const { data, error } = await this.supabase
      .from('schema_generations')
      .insert({
        user_id: userId,
        url,
        credits_cost: creditsCost,
        schema_type: schemaType
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
      schema_type?: string
      failureReason?: string
      failureStage?: string
      aiModelProvider?: string
      stackTrace?: string
      requestContext?: any
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

    // Only include schema_type if it's explicitly provided
    if (updates.schema_type !== undefined) {
      updateData.schema_type = updates.schema_type
      console.log(`✅ updateSchemaGeneration: Adding schema_type="${updates.schema_type}" to update for record ${id}`)
    } else {
      console.log(`⚠️ updateSchemaGeneration: schema_type is undefined, not updating for record ${id}`)
    }

    // Include failure tracking fields if provided (Phase 1: Enhanced Failure Tracking)
    if (updates.failureReason !== undefined) {
      updateData.failure_reason = updates.failureReason
    }
    if (updates.failureStage !== undefined) {
      updateData.failure_stage = updates.failureStage
    }
    if (updates.aiModelProvider !== undefined) {
      updateData.ai_model_provider = updates.aiModelProvider
    }
    if (updates.stackTrace !== undefined) {
      updateData.stack_trace = updates.stackTrace
    }
    if (updates.requestContext !== undefined) {
      updateData.request_context = updates.requestContext
    }

    console.log(`💾 updateSchemaGeneration: Updating record ${id} with:`, {
      hasSchemas: !!updateData.schemas,
      status: updateData.status,
      schema_type: updateData.schema_type,
      schema_score: updateData.schema_score,
      refinement_count: updateData.refinement_count
    })

    const { data: updatedData, error } = await this.supabase
      .from('schema_generations')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error(`❌ updateSchemaGeneration: Database update failed for ${id}:`, error)
      throw error
    }

    console.log(`✅ updateSchemaGeneration: Successfully updated record ${id}`)
    console.log(`📊 Updated schema_score:`, updatedData?.[0]?.schema_score)
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

  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('payment_intents')
      .select('*')
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw error
    }

    return data
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

  async getSchemaById(schemaId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('schema_generations')
      .select('*')
      .eq('id', schemaId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    console.log(`🔍 getSchemaById: Fetched schema ${schemaId}:`, {
      schema_score: data.schema_score,
      refinement_count: data.refinement_count,
      hasSchemas: !!data.schemas
    })

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
      isImportedSchema: data.is_imported_schema || false,
      hasBeenRefined: data.has_been_refined || false,
      importedAt: data.imported_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // Simplified method to only update schemas array (used by refinement endpoints)
  async updateSchemaContent(schemaId: string, schemas: any[]): Promise<void> {
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
      organizationName: row.organization_name || undefined,
      creditBalance: row.credit_balance,
      totalCreditsUsed: row.total_credits_used,
      isActive: row.is_active,
      isAdmin: row.is_admin || false,
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
      organizationName: row.organization_name || undefined,
      creditBalance: row.credit_balance,
      totalCreditsUsed: row.total_credits_used,
      isActive: row.is_active,
      isAdmin: row.is_admin || false,
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
    totalRevenue: number
    revenueThisMonth: number
    payingCustomers: number
    conversionRate: number
    newUsersThisWeek: number
    newUsersThisMonth: number
    schemasToday: number
    schemasThisWeek: number
    averageCreditsPerUser: number
    creditPackBreakdown: Array<{ packId: string; packName: string; purchases: number; revenue: number }>
  }> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getPlatformStats')
      return {
        totalUsers: this.mockUsers.size,
        activeUsers: this.mockUsers.size,
        totalSchemas: 0,
        totalCreditsDistributed: 0,
        totalCreditsUsed: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        payingCustomers: 0,
        conversionRate: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        schemasToday: 0,
        schemasThisWeek: 0,
        averageCreditsPerUser: 0,
        creditPackBreakdown: []
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
    const averageCreditsPerUser = totalUsers ? Math.round(totalCreditsUsed / (totalUsers || 1)) : 0

    // Get revenue stats from succeeded payment intents
    const { data: payments, error: paymentsError } = await this.supabase
      .from('payment_intents')
      .select('amount_in_cents, credits, credit_pack_id, user_id, created_at')
      .eq('status', 'succeeded')

    if (paymentsError) throw paymentsError

    const totalRevenue = payments ? payments.reduce((sum, p) => sum + p.amount_in_cents, 0) / 100 : 0

    // Revenue this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const revenueThisMonth = payments
      ? payments
          .filter(p => new Date(p.created_at) >= startOfMonth)
          .reduce((sum, p) => sum + p.amount_in_cents, 0) / 100
      : 0

    // Paying customers (unique users with successful payments)
    const payingCustomers = payments
      ? new Set(payments.map(p => p.user_id)).size
      : 0

    // Conversion rate
    const conversionRate = totalUsers ? ((payingCustomers / (totalUsers || 1)) * 100) : 0

    // New users this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { count: newUsersThisWeek, error: newUsersWeekError } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    if (newUsersWeekError) throw newUsersWeekError

    // New users this month
    const { count: newUsersThisMonth, error: newUsersMonthError } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    if (newUsersMonthError) throw newUsersMonthError

    // Schemas generated today
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const { count: schemasToday, error: schemasTodayError } = await this.supabase
      .from('schema_generations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString())

    if (schemasTodayError) throw schemasTodayError

    // Schemas generated this week
    const { count: schemasThisWeek, error: schemasWeekError } = await this.supabase
      .from('schema_generations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    if (schemasWeekError) throw schemasWeekError

    // Credit pack breakdown
    const { data: creditPacks, error: creditPacksError } = await this.supabase
      .from('credit_packs')
      .select('id, name')

    if (creditPacksError) throw creditPacksError

    const creditPackBreakdown = creditPacks ? creditPacks.map(pack => {
      const packPayments = payments?.filter(p => p.credit_pack_id === pack.id) || []
      return {
        packId: pack.id,
        packName: pack.name,
        purchases: packPayments.length,
        revenue: packPayments.reduce((sum, p) => sum + p.amount_in_cents, 0) / 100
      }
    }).sort((a, b) => b.purchases - a.purchases) : []

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalSchemas: totalSchemas || 0,
      totalCreditsDistributed,
      totalCreditsUsed,
      totalRevenue,
      revenueThisMonth,
      payingCustomers,
      conversionRate,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      schemasToday: schemasToday || 0,
      schemasThisWeek: schemasThisWeek || 0,
      averageCreditsPerUser,
      creditPackBreakdown
    }
  }

  /**
   * Get ALL schemas for a discovered URL (supports multiple schema types)
   * Returns array of all schema generation records for this URL
   */
  async getSchemasByDiscoveredUrlId(discoveredUrlId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('schema_generations')
      .select('*')
      .eq('discovered_url_id', discoveredUrlId)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log(`🔍 Raw database response for URL ${discoveredUrlId}:`,
      (data || []).map(row => ({ id: row.id, schema_type: row.schema_type, created_at: row.created_at })))

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      url: row.url,
      schemas: row.schemas,
      schemaType: row.schema_type,
      schemaScore: row.schema_score,
      refinementCount: row.refinement_count,
      deletionCount: row.deletion_count,
      status: row.status,
      creditsCost: row.credits_cost,
      processingTimeMs: row.processing_time_ms,
      errorMessage: row.error_message,
      discoveredUrlId: row.discovered_url_id,
      isImportedSchema: row.is_imported_schema || false,
      hasBeenRefined: row.has_been_refined || false,
      importedAt: row.imported_at,
      createdAt: row.created_at
    }))
  }

  /**
   * Get a specific schema type for a URL
   * Used to check if a type already exists before generation
   */
  async getSchemaByUrlIdAndType(discoveredUrlId: string, schemaType: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('schema_generations')
      .select('*')
      .eq('discovered_url_id', discoveredUrlId)
      .eq('schema_type', schemaType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      url: data.url,
      schemas: data.schemas,
      schemaType: data.schema_type,
      schemaScore: data.schema_score,
      refinementCount: data.refinement_count,
      deletionCount: data.deletion_count,
      status: data.status,
      creditsCost: data.credits_cost,
      processingTimeMs: data.processing_time_ms,
      errorMessage: data.error_message,
      discoveredUrlId: data.discovered_url_id,
      createdAt: data.created_at
    }
  }

  /**
   * Increment deletion count for schema type (tracks regeneration attempts)
   * Used to enforce max 1 regeneration per schema type
   */
  async incrementDeletionCount(schemaId: string): Promise<void> {
    // Get current count
    const { data, error: fetchError } = await this.supabase
      .from('schema_generations')
      .select('deletion_count')
      .eq('id', schemaId)
      .single()

    if (fetchError) throw fetchError

    // Increment count
    const { error: updateError } = await this.supabase
      .from('schema_generations')
      .update({ deletion_count: (data.deletion_count || 0) + 1 })
      .eq('id', schemaId)

    if (updateError) throw updateError
  }

  /**
   * Check if a normalized URL exists in the user's library with schema
   * Returns the URL ID, creation date, and array of existing schema types
   */
  /**
   * Batch check hasSchema status for multiple URLs
   */
  async batchCheckHasSchema(userId: string, urls: string[]): Promise<Map<string, boolean>> {
    if (!this.isDatabaseAvailable()) {
      return new Map(urls.map(url => [url, false]))
    }

    if (urls.length === 0) {
      return new Map()
    }

    const { data, error } = await this.supabase
      .from('discovered_urls')
      .select('url, has_schema')
      .eq('user_id', userId)
      .in('url', urls)

    if (error) {
      console.error('Error batch checking hasSchema:', error)
      return new Map(urls.map(url => [url, false]))
    }

    const resultMap = new Map<string, boolean>()
    data?.forEach(row => {
      resultMap.set(row.url, row.has_schema || false)
    })

    // Add false for URLs not found in database
    urls.forEach(url => {
      if (!resultMap.has(url)) {
        resultMap.set(url, false)
      }
    })

    return resultMap
  }

  async checkUrlExists(userId: string, normalizedUrl: string): Promise<{
    exists: boolean
    urlId?: string
    createdAt?: string
    hasSchema: boolean
    schemaTypes?: string[]
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

    // If URL has schemas, get all schema types
    let schemaTypes: string[] = []
    if (data.has_schema) {
      const schemas = await this.getSchemasByDiscoveredUrlId(data.id)
      schemaTypes = schemas.map(s => s.schemaType).filter(Boolean)
    }

    return {
      exists: true,
      urlId: data.id,
      createdAt: data.created_at,
      hasSchema: data.has_schema,
      schemaTypes
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

  // ===================
  // RELEASE NOTES METHODS
  // ===================

  async getPublishedReleaseNotes(): Promise<any[]> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getPublishedReleaseNotes')
      return []
    }

    const { data, error } = await this.supabase
      .from('release_notes')
      .select('*')
      .eq('is_published', true)
      .order('release_date', { ascending: false })

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      releaseDate: row.release_date,
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async getAllReleaseNotes(): Promise<any[]> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getAllReleaseNotes')
      return []
    }

    const { data, error } = await this.supabase
      .from('release_notes')
      .select('*')
      .order('release_date', { ascending: false })

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      releaseDate: row.release_date,
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async createReleaseNote(params: {
    title: string
    description: string
    category: 'new_feature' | 'enhancement' | 'performance' | 'bug_fix'
    releaseDate: string
    isPublished: boolean
  }): Promise<any> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: createReleaseNote', params)
      return {
        id: `mock-release-note-${Date.now()}`,
        ...params,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    const { data, error } = await this.supabase
      .from('release_notes')
      .insert({
        title: params.title,
        description: params.description,
        category: params.category,
        release_date: params.releaseDate,
        is_published: params.isPublished
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      releaseDate: data.release_date,
      isPublished: data.is_published,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async updateReleaseNote(
    noteId: string,
    updates: {
      title?: string
      description?: string
      category?: 'new_feature' | 'enhancement' | 'performance' | 'bug_fix'
      releaseDate?: string
      isPublished?: boolean
    }
  ): Promise<any> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: updateReleaseNote', { noteId, updates })
      return {
        id: noteId,
        ...updates,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.releaseDate !== undefined) updateData.release_date = updates.releaseDate
    if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished

    const { data, error } = await this.supabase
      .from('release_notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      releaseDate: data.release_date,
      isPublished: data.is_published,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async deleteReleaseNote(noteId: string): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: deleteReleaseNote', { noteId })
      return
    }

    const { error } = await this.supabase
      .from('release_notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error
  }

  // ============================================
  // HubSpot Integration Methods
  // ============================================

  async createHubSpotConnection(params: {
    userId: string
    hubspotPortalId: string
    portalName?: string
    accessToken: string
    refreshToken: string
    tokenExpiresAt: Date
    scopes: string[]
    region?: string
  }): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: createHubSpotConnection', params)
      return 'mock-connection-id'
    }

    // Use upsert to handle reconnections - updates existing connection if it exists
    const { data, error } = await this.supabase
      .from('hubspot_connections')
      .upsert({
        user_id: params.userId,
        hubspot_portal_id: params.hubspotPortalId,
        portal_name: params.portalName,
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        token_expires_at: params.tokenExpiresAt.toISOString(),
        scopes: params.scopes,
        region: params.region || 'na1',
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,hubspot_portal_id'
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async getHubSpotConnection(connectionId: string) {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getHubSpotConnection', { connectionId })
      return null
    }

    const { data, error } = await this.supabase
      .from('hubspot_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      hubspotPortalId: data.hubspot_portal_id,
      portalName: data.portal_name,
      region: data.region || 'na1',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.token_expires_at,
      scopes: data.scopes,
      isActive: data.is_active,
      lastValidatedAt: data.last_validated_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async getUserHubSpotConnections(userId: string) {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getUserHubSpotConnections', { userId })
      return []
    }

    const { data, error } = await this.supabase
      .from('hubspot_connections')
      .select('id, hubspot_portal_id, portal_name, region, scopes, associated_domains, is_active, last_validated_at, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(row => ({
      id: row.id,
      userId,
      hubspotPortalId: row.hubspot_portal_id,
      portalName: row.portal_name,
      region: row.region || 'na1',
      scopes: row.scopes,
      associatedDomains: row.associated_domains || [],
      isActive: row.is_active,
      lastValidatedAt: row.last_validated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async updateHubSpotTokens(
    connectionId: string,
    tokens: {
      accessToken: string
      refreshToken: string
      tokenExpiresAt: Date
    }
  ): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: updateHubSpotTokens', { connectionId })
      return
    }

    const { error } = await this.supabase
      .from('hubspot_connections')
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.tokenExpiresAt.toISOString()
      })
      .eq('id', connectionId)

    if (error) throw error
  }

  async updateHubSpotConnectionValidation(connectionId: string): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: updateHubSpotConnectionValidation', { connectionId })
      return
    }

    const { error } = await this.supabase
      .from('hubspot_connections')
      .update({
        last_validated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    if (error) throw error
  }

  async deactivateHubSpotConnection(connectionId: string): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: deactivateHubSpotConnection', { connectionId })
      return
    }

    const { error } = await this.supabase
      .from('hubspot_connections')
      .update({
        is_active: false
      })
      .eq('id', connectionId)

    if (error) throw error
  }

  async addDomainToConnection(connectionId: string, domain: string): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: addDomainToConnection', { connectionId, domain })
      return true
    }

    const { data, error } = await this.supabase
      .rpc('add_domain_to_hubspot_connection', {
        p_connection_id: connectionId,
        p_domain: domain
      })

    if (error) throw error
    return data as boolean
  }

  async removeDomainFromConnection(connectionId: string, domain: string): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: removeDomainFromConnection', { connectionId, domain })
      return true
    }

    const { data, error } = await this.supabase
      .rpc('remove_domain_from_hubspot_connection', {
        p_connection_id: connectionId,
        p_domain: domain
      })

    if (error) throw error
    return data as boolean
  }

  async findConnectionByDomain(userId: string, domain: string) {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: findConnectionByDomain', { userId, domain })
      return null
    }

    const { data, error } = await this.supabase
      .rpc('find_hubspot_connection_by_domain', {
        p_user_id: userId,
        p_domain: domain
      })
      .single()

    if (error) {
      // No match found is not an error
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    if (!data) return null

    return {
      id: data.id,
      userId,
      hubspotPortalId: data.portal_id,
      portalName: data.portal_name,
      scopes: data.scopes,
      associatedDomains: data.associated_domains || [],
      createdAt: data.created_at
    }
  }

  /**
   * Get HubSpot connection statistics for admin monitoring
   * Helps track the health of the HubSpot integration, especially regional API usage
   */
  async getHubSpotStats(): Promise<{
    totalConnections: number
    activeConnections: number
    connectionsByRegion: {
      na1: number
      eu1: number
      ap1: number
    }
    recentSyncs24h: number
    recentSyncFailures24h: number
    topUsersByConnections: Array<{
      userId: string
      userEmail: string
      connectionCount: number
    }>
  }> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getHubSpotStats')
      return {
        totalConnections: 0,
        activeConnections: 0,
        connectionsByRegion: { na1: 0, eu1: 0, ap1: 0 },
        recentSyncs24h: 0,
        recentSyncFailures24h: 0,
        topUsersByConnections: []
      }
    }

    // Get total and active connections
    const { count: totalConnections, error: totalError } = await this.supabase
      .from('hubspot_connections')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    const { count: activeConnections, error: activeError } = await this.supabase
      .from('hubspot_connections')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) throw activeError

    // Get connections by region
    const { data: regionData, error: regionError } = await this.supabase
      .from('hubspot_connections')
      .select('region')
      .eq('is_active', true)

    if (regionError) throw regionError

    const connectionsByRegion = {
      na1: 0,
      eu1: 0,
      ap1: 0
    }

    regionData?.forEach(row => {
      const region = (row.region || 'na1') as 'na1' | 'eu1' | 'ap1'
      connectionsByRegion[region]++
    })

    // Get recent sync stats (last 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { count: recentSyncs24h, error: syncsError } = await this.supabase
      .from('hubspot_sync_jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString())

    if (syncsError) throw syncsError

    const { count: recentSyncFailures24h, error: failuresError } = await this.supabase
      .from('hubspot_sync_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', twentyFourHoursAgo.toISOString())

    if (failuresError) throw failuresError

    // Get top users by connections (simple query without RPC)
    const { data: connectionsWithUsers, error: topUsersError } = await this.supabase
      .from('hubspot_connections')
      .select('user_id')
      .eq('is_active', true)

    if (topUsersError) throw topUsersError

    // Count connections per user
    const userConnectionCounts = new Map<string, number>()
    connectionsWithUsers?.forEach(row => {
      const count = userConnectionCounts.get(row.user_id) || 0
      userConnectionCounts.set(row.user_id, count + 1)
    })

    // Get top 5 users and their emails
    const topUserIds = Array.from(userConnectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId]) => userId)

    const topUsersByConnections = []
    for (const userId of topUserIds) {
      const { data: userData } = await this.supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      topUsersByConnections.push({
        userId,
        userEmail: userData?.email || 'Unknown',
        connectionCount: userConnectionCounts.get(userId) || 0
      })
    }

    return {
      totalConnections: totalConnections || 0,
      activeConnections: activeConnections || 0,
      connectionsByRegion,
      recentSyncs24h: recentSyncs24h || 0,
      recentSyncFailures24h: recentSyncFailures24h || 0,
      topUsersByConnections
    }
  }

  // ============================================
  // Pending HubSpot Connections Methods
  // ============================================

  /**
   * Create a pending HubSpot connection for marketplace-first installations
   * This allows users to install from HubSpot Marketplace before creating a SuperSchema account
   */
  async createPendingHubSpotConnection(params: {
    stateToken: string
    oauthCode: string
    hubspotPortalId?: string
    portalName?: string
    redirectUri: string
    scopes?: string[]
    expiresInMinutes?: number
  }): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: createPendingHubSpotConnection', params)
      return 'mock-pending-id'
    }

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + (params.expiresInMinutes || 30))

    const { data, error } = await this.supabase
      .from('pending_hubspot_connections')
      .insert({
        state_token: params.stateToken,
        oauth_code: params.oauthCode,
        hubspot_portal_id: params.hubspotPortalId,
        portal_name: params.portalName,
        redirect_uri: params.redirectUri,
        scopes: params.scopes,
        expires_at: expiresAt.toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Pending Connection] Error creating:', error)
      throw error
    }

    console.log(`[Pending Connection] Created for state ${params.stateToken}, expires ${expiresAt.toISOString()}`)
    return data.id
  }

  /**
   * Get a pending HubSpot connection by state token
   */
  async getPendingHubSpotConnection(stateToken: string) {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getPendingHubSpotConnection', { stateToken })
      return null
    }

    const { data, error } = await this.supabase
      .from('pending_hubspot_connections')
      .select('*')
      .eq('state_token', stateToken)
      .is('claimed_at', null)
      .single()

    if (error) {
      // Not found is not an error for this use case
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      console.warn(`[Pending Connection] State ${stateToken} has expired`)
      return null
    }

    return {
      id: data.id,
      stateToken: data.state_token,
      oauthCode: data.oauth_code,
      hubspotPortalId: data.hubspot_portal_id,
      portalName: data.portal_name,
      redirectUri: data.redirect_uri,
      scopes: data.scopes,
      expiresAt: data.expires_at,
      createdAt: data.created_at
    }
  }

  /**
   * Claim a pending HubSpot connection (atomically)
   * Uses the database function for row-level locking
   */
  async claimPendingHubSpotConnection(
    stateToken: string,
    userId: string
  ): Promise<{
    oauthCode: string
    redirectUri: string
    portalId?: string
    portalName?: string
  } | null> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: claimPendingHubSpotConnection', { stateToken, userId })
      return {
        oauthCode: 'mock-code',
        redirectUri: 'http://localhost',
        portalId: 'mock-portal',
        portalName: 'Mock Portal'
      }
    }

    try {
      const { data, error } = await this.supabase.rpc('claim_pending_hubspot_connection', {
        p_state_token: stateToken,
        p_user_id: userId
      })

      if (error) {
        console.error('[Pending Connection] Error claiming:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.warn(`[Pending Connection] No connection found or already claimed: ${stateToken}`)
        return null
      }

      const connection = Array.isArray(data) ? data[0] : data

      console.log(`[Pending Connection] Successfully claimed by user ${userId}`)
      return {
        oauthCode: connection.oauth_code,
        redirectUri: connection.redirect_uri,
        portalId: connection.portal_id,
        portalName: connection.portal_name
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('expired')) {
        console.warn(`[Pending Connection] State ${stateToken} has expired`)
        return null
      }
      if (error.message?.includes('already claimed')) {
        console.warn(`[Pending Connection] State ${stateToken} already claimed`)
        return null
      }
      throw error
    }
  }

  /**
   * Clean up expired pending connections
   * Should be called periodically (e.g., via cron job)
   */
  async cleanupExpiredPendingConnections(): Promise<number> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: cleanupExpiredPendingConnections')
      return 0
    }

    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_pending_hubspot_connections')

      if (error) {
        console.error('[Pending Connection] Cleanup error:', error)
        throw error
      }

      const count = data as number
      if (count > 0) {
        console.log(`[Pending Connection] Cleaned up ${count} expired connections`)
      }
      return count
    } catch (error) {
      console.error('[Pending Connection] Cleanup failed:', error)
      throw error
    }
  }

  async createHubSpotSyncJob(params: {
    userId: string
    connectionId: string
    schemaGenerationId?: string
    hubspotContentId: string
    hubspotContentType: 'blog_post' | 'page' | 'landing_page'
    hubspotContentTitle?: string
    hubspotContentUrl?: string
  }): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: createHubSpotSyncJob', params)
      return 'mock-sync-job-id'
    }

    const { data, error } = await this.supabase
      .from('hubspot_sync_jobs')
      .insert({
        user_id: params.userId,
        connection_id: params.connectionId,
        schema_generation_id: params.schemaGenerationId,
        hubspot_content_id: params.hubspotContentId,
        hubspot_content_type: params.hubspotContentType,
        hubspot_content_title: params.hubspotContentTitle,
        hubspot_content_url: params.hubspotContentUrl,
        status: 'pending',
        retry_count: 0
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async updateHubSpotSyncJobSuccess(syncJobId: string): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: updateHubSpotSyncJobSuccess', { syncJobId })
      return
    }

    const { error } = await this.supabase
      .from('hubspot_sync_jobs')
      .update({
        status: 'success',
        synced_at: new Date().toISOString()
      })
      .eq('id', syncJobId)

    if (error) throw error
  }

  async updateHubSpotSyncJobFailure(syncJobId: string, errorMessage: string): Promise<void> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: updateHubSpotSyncJobFailure', { syncJobId, errorMessage })
      return
    }

    const { error } = await this.supabase
      .from('hubspot_sync_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage
      })
      .eq('id', syncJobId)

    if (error) throw error
  }

  async getHubSpotSyncHistory(userId: string, limit: number = 50, offset: number = 0) {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getHubSpotSyncHistory', { userId, limit, offset })
      return []
    }

    const { data, error } = await this.supabase
      .rpc('get_hubspot_sync_history', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset
      })

    if (error) throw error

    return data.map((row: any) => ({
      id: row.id,
      hubspotContentType: row.hubspot_content_type,
      hubspotContentTitle: row.hubspot_content_title,
      hubspotContentUrl: row.hubspot_content_url,
      status: row.status,
      errorMessage: row.error_message,
      syncedAt: row.synced_at,
      createdAt: row.created_at,
      portalName: row.portal_name
    }))
  }

  /**
   * Get schema generation failures with filtering and pagination
   * Part of Phase 1: Enhanced Failure Tracking
   */
  async getSchemaFailures(params: {
    page?: number
    limit?: number
    failureReason?: string
    failureStage?: string
    userId?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    failures: Array<{
      id: string
      userId: string
      userEmail: string
      url: string
      failureReason: string
      failureStage: string
      errorMessage: string
      aiModelProvider: string
      stackTrace: string
      requestContext: any
      processingTimeMs: number
      createdAt: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getSchemaFailures', params)
      return {
        failures: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      }
    }

    const page = params.page || 1
    const limit = params.limit || 20
    const offset = (page - 1) * limit

    // Build query with filters
    let query = this.supabase
      .from('schema_generations')
      .select('*, users!inner(email)', { count: 'exact' })
      .eq('status', 'failed')
      .order('created_at', { ascending: false })

    // Apply optional filters
    if (params.failureReason) {
      query = query.eq('failure_reason', params.failureReason)
    }
    if (params.failureStage) {
      query = query.eq('failure_stage', params.failureStage)
    }
    if (params.userId) {
      query = query.eq('user_id', params.userId)
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate)
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch schema failures:', error)
      throw error
    }

    const failures = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.users?.email || 'Unknown',
      url: row.url,
      failureReason: row.failure_reason || 'unknown',
      failureStage: row.failure_stage || 'unknown',
      errorMessage: row.error_message || '',
      aiModelProvider: row.ai_model_provider || 'unknown',
      stackTrace: row.stack_trace || '',
      requestContext: row.request_context || {},
      processingTimeMs: row.processing_time_ms || 0,
      createdAt: row.created_at
    }))

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      failures,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  }

  /**
   * Delete a schema failure record (hard delete)
   * Only allows deletion of records with status = 'failed' for safety
   */
  async deleteSchemaFailure(id: string): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: deleteSchemaFailure', id)
      return true
    }

    // Delete only if status is 'failed' (safety check)
    const { error } = await this.supabase
      .from('schema_generations')
      .delete()
      .eq('id', id)
      .eq('status', 'failed')

    if (error) {
      console.error('Failed to delete schema failure:', error)
      throw error
    }

    return true
  }

  /**
   * Get aggregated schema failure statistics
   * Part of Phase 1: Enhanced Failure Tracking
   */
  async getSchemaFailureStats(params?: {
    startDate?: string
    endDate?: string
  }): Promise<{
    totalFailures: number
    failuresByReason: Array<{ reason: string; count: number; percentage: number }>
    failuresByStage: Array<{ stage: string; count: number; percentage: number }>
    failuresByAiModel: Array<{ model: string; count: number; percentage: number }>
    recentFailures24h: number
    failureRate: number
    topFailingUrls: Array<{ url: string; count: number }>
    affectedUsers: number
  }> {
    if (!this.isDatabaseAvailable()) {
      console.log('Mock: getSchemaFailureStats', params)
      return {
        totalFailures: 0,
        failuresByReason: [],
        failuresByStage: [],
        failuresByAiModel: [],
        recentFailures24h: 0,
        failureRate: 0,
        topFailingUrls: [],
        affectedUsers: 0
      }
    }

    // Build base query with optional date filters
    let baseQuery = this.supabase
      .from('schema_generations')
      .select('*')
      .eq('status', 'failed')

    if (params?.startDate) {
      baseQuery = baseQuery.gte('created_at', params.startDate)
    }
    if (params?.endDate) {
      baseQuery = baseQuery.lte('created_at', params.endDate)
    }

    const { data: failures, error } = await baseQuery

    if (error) {
      console.error('Failed to fetch schema failure stats:', error)
      throw error
    }

    const totalFailures = failures?.length || 0

    // Get total generation attempts for failure rate calculation
    let totalQuery = this.supabase
      .from('schema_generations')
      .select('*', { count: 'exact', head: true })

    if (params?.startDate) {
      totalQuery = totalQuery.gte('created_at', params.startDate)
    }
    if (params?.endDate) {
      totalQuery = totalQuery.lte('created_at', params.endDate)
    }

    const { count: totalAttempts } = await totalQuery
    const failureRate = totalAttempts && totalAttempts > 0
      ? Math.round((totalFailures / totalAttempts) * 100)
      : 0

    // Aggregate by failure reason
    const reasonCounts: Record<string, number> = {}
    const stageCounts: Record<string, number> = {}
    const modelCounts: Record<string, number> = {}
    const urlCounts: Record<string, number> = {}
    const affectedUserIds = new Set<string>()

    failures?.forEach((failure: any) => {
      const reason = failure.failure_reason || 'unknown'
      const stage = failure.failure_stage || 'unknown'
      const model = failure.ai_model_provider || 'unknown'
      const url = failure.url

      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
      modelCounts[model] = (modelCounts[model] || 0) + 1
      urlCounts[url] = (urlCounts[url] || 0) + 1
      affectedUserIds.add(failure.user_id)
    })

    // Convert to arrays and sort
    const failuresByReason = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalFailures > 0 ? Math.round((count / totalFailures) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    const failuresByStage = Object.entries(stageCounts)
      .map(([stage, count]) => ({
        stage,
        count,
        percentage: totalFailures > 0 ? Math.round((count / totalFailures) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    const failuresByAiModel = Object.entries(modelCounts)
      .map(([model, count]) => ({
        model,
        count,
        percentage: totalFailures > 0 ? Math.round((count / totalFailures) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    const topFailingUrls = Object.entries(urlCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get recent failures (last 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { count: recentFailures24h } = await this.supabase
      .from('schema_generations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', twentyFourHoursAgo.toISOString())

    return {
      totalFailures,
      failuresByReason,
      failuresByStage,
      failuresByAiModel,
      recentFailures24h: recentFailures24h || 0,
      failureRate,
      topFailingUrls,
      affectedUsers: affectedUserIds.size
    }
  }
}

export const db = new DatabaseService()