import { useQuery, useMutation } from '@tanstack/react-query'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, TrendingUp, Database, ExternalLink, Library as LibraryIcon, Sparkles } from 'lucide-react'
import { apiService } from '@/services/api'
import { cn } from '@/utils/cn'
import LightningBoltIcon from '@/components/icons/LightningBoltIcon'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import { useOnboarding } from '@/hooks/useOnboarding'
import OnboardingWelcomeModal from '@/components/OnboardingWelcomeModal'

export default function DashboardPage() {
  // Use real Clerk user
  const { user } = useUser()
  const { isLoaded } = useAuth()
  const navigate = useNavigate()

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Dashboard'
  }, [])

  // Onboarding state
  const onboarding = useOnboarding()

  // Get user stats - Wait for Clerk to load before firing
  const statsQuery = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiService.getUserStats(),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  // Get user credits - Wait for Clerk to load before firing
  const creditsQuery = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  // Get recent generations - Wait for Clerk to load before firing
  const { data: historyData } = useQuery({
    queryKey: ['generation-history'],
    queryFn: () => apiService.getGenerationHistory(1, 5),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  // Get library URLs for dashboard stats - Wait for Clerk to load before firing
  const { data: libraryUrlsData } = useQuery({
    queryKey: ['dashboard-urls'],
    queryFn: () => apiService.getUserUrls({
      isHidden: false
    }),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  const recentGenerations = historyData?.data?.data || []
  const libraryUrls = libraryUrlsData?.data || []

  const stats = statsQuery.data?.data || {
    credit_balance: creditsQuery.data?.data?.creditBalance || 0,
    total_schemas_generated: recentGenerations.length || 0,
    successful_generations: recentGenerations.filter((g: any) => g.status === 'success').length || 0,
    total_spent_cents: 0
  }

  // Calculate dashboard metrics
  const totalUrls = libraryUrls.length
  const urlsWithSchema = libraryUrls.filter((url: any) => url.hasSchema).length
  const urlsWithoutSchema = libraryUrls.filter((url: any) => !url.hasSchema).length
  const schemaCoverage = totalUrls > 0 ? Math.round((urlsWithSchema / totalUrls) * 100) : 0

  const successRate = stats.total_schemas_generated > 0
    ? Math.round((stats.successful_generations / stats.total_schemas_generated) * 100)
    : 0

  // Calculate schema type breakdown
  const schemaTypes = libraryUrls
    .filter((url: any) => url.hasSchema && url.schema)
    .reduce((acc: Record<string, number>, url: any) => {
      try {
        const schema = typeof url.schema === 'string' ? JSON.parse(url.schema) : url.schema
        const schemas = Array.isArray(schema) ? schema : [schema]
        schemas.forEach((s: any) => {
          const type = s['@type'] || 'Unknown'
          acc[type] = (acc[type] || 0) + 1
        })
      } catch (e) {
        // Skip invalid schemas
      }
      return acc
    }, {})

  const schemaTypeArray = Object.entries(schemaTypes)
    .map(([type, count]) => ({ type, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6) // Top 6 schema types

  const maxSchemaCount = Math.max(...schemaTypeArray.map(s => s.count), 1)

  // Show welcome modal for first-time users with no schemas
  const showWelcomeModal = onboarding.isFirstTimeUser &&
    !onboarding.hasSeenWelcome &&
    stats.total_schemas_generated === 0

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Modal for first-time users */}
      {showWelcomeModal && (
        <OnboardingWelcomeModal
          userName={user?.firstName || undefined}
          onStart={onboarding.markWelcomeSeen}
          onSkip={onboarding.skipOnboarding}
        />
      )}

      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Your overview dashboard for schema generation analytics and insights.
        </p>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total URLs Discovered */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total URLs</p>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold">{totalUrls}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Discovered in library
            </p>
          </div>
        </div>

        {/* Schema Coverage */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Schema Coverage</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold">{schemaCoverage}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {urlsWithSchema} of {totalUrls} URLs
            </p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold">{successRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successful_generations} successful
            </p>
          </div>
        </div>

        {/* Credit Balance */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Credits</p>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.credit_balance}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Available balance
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Incomplete URLs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* URLs Needing Schema */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">URLs Needing Schema</h2>
            <span className="text-sm text-muted-foreground">{urlsWithoutSchema} total</span>
          </div>
          {totalUrls === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Database className="h-12 w-12 text-primary mb-3" />
              <p className="font-medium mb-1">Get started with your first URL</p>
              <p className="text-sm text-muted-foreground mb-4">Discover URLs or generate schema for any page</p>
              <button
                onClick={() => navigate('/generate')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Start Generating
              </button>
            </div>
          ) : urlsWithoutSchema === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <SuperSchemaLogo className="h-12 w-12 mb-3" animate={false} />
              <p className="text-muted-foreground">All URLs have schema!</p>
              <p className="text-sm text-muted-foreground mt-1">Great job on your coverage</p>
            </div>
          ) : (
            <div className="space-y-2">
              {libraryUrls
                .filter((url: any) => !url.hasSchema)
                .slice(0, 5)
                .map((url: any) => (
                  <div
                    key={url.id}
                    className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/30"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm truncate font-medium">{url.url}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/generate?url=${encodeURIComponent(url.url)}&auto=true`)}
                      className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      <LightningBoltIcon className="h-3 w-3" />
                      Generate
                    </button>
                  </div>
                ))}
              {urlsWithoutSchema > 5 && (
                <button
                  onClick={() => navigate('/library')}
                  className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                  View all {urlsWithoutSchema} URLs
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/generate')}
              className="w-full p-4 border-2 border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Discover URLs</p>
                  <p className="text-sm text-muted-foreground">Find new pages to generate schema for</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/generate')}
              className="w-full p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <LightningBoltIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Generate Schema</p>
                  <p className="text-sm text-muted-foreground">Create schema for any URL</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/credits?purchase=true')}
              className="w-full p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Buy Credits</p>
                  <p className="text-sm text-muted-foreground">Purchase credit packs</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/library')}
              className="w-full p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <LibraryIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">View Library</p>
                  <p className="text-sm text-muted-foreground">Manage all your schemas</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Schema Type Breakdown */}
      {schemaTypeArray.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Schema Type Distribution</h2>
            <span className="text-sm text-muted-foreground">{urlsWithSchema} total schemas</span>
          </div>
          <div className="space-y-3">
            {schemaTypeArray.map(({ type, count }) => {
              const percentage = Math.round((count / urlsWithSchema) * 100)
              const barWidth = Math.round((count / maxSchemaCount) * 100)

              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{type}</span>
                    <span className="text-muted-foreground">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Generations */}
      {recentGenerations.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>
          <div className="space-y-3">
            {recentGenerations.map((generation: any) => (
              <button
                key={generation.id}
                onClick={() => navigate(`/library?url=${encodeURIComponent(generation.url)}`)}
                className="w-full flex items-center justify-between p-4 border border-border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{generation.url}</p>
                  <p className="text-sm text-muted-foreground">
                    Generated {generation.schemas.length} schema{generation.schemas.length !== 1 ? 's' : ''}
                    {generation.schemas.length > 0 && (
                      <span className="ml-1">
                        ({generation.schemas.map((s: any) => s['@type']).join(', ')})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(generation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}