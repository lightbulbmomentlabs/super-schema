import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useAuth } from '@clerk/clerk-react'

// Pages
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import DashboardPage from './pages/DashboardPage'
import GeneratePage from './pages/GeneratePage'
import CreditsPage from './pages/CreditsPage'
import LibraryPage from './pages/LibraryPage'
import SettingsPage from './pages/SettingsPage'
import AdminLayout from './components/AdminLayout'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminUsers from './pages/admin/AdminUsers'
import AdminMonitoring from './pages/admin/AdminMonitoring'
import AdminTickets from './pages/admin/AdminTickets'
import AdminContent from './pages/admin/AdminContent'
import HubSpotPage from './pages/HubSpotPage'
import HubSpotCallbackPage from './pages/HubSpotCallbackPage'
import WhatsNewPage from './pages/WhatsNewPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import WelcomePage from './pages/WelcomePage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import DocsPage from './pages/DocsPage'
import FreeSchemaGeneratorPage from './pages/FreeSchemaGeneratorPage'
import FAQSchemaGeneratorPage from './pages/FAQSchemaGeneratorPage'
import ArticleSchemaGeneratorPage from './pages/ArticleSchemaGeneratorPage'
import BlogPostingSchemaGeneratorPage from './pages/BlogPostingSchemaGeneratorPage'
import HowToSchemaGeneratorPage from './pages/HowToSchemaGeneratorPage'
import ProductSchemaGeneratorPage from './pages/ProductSchemaGeneratorPage'
import LocalBusinessSchemaGeneratorPage from './pages/LocalBusinessSchemaGeneratorPage'
import OrganizationSchemaGeneratorPage from './pages/OrganizationSchemaGeneratorPage'
import EventSchemaGeneratorPage from './pages/EventSchemaGeneratorPage'
import ReviewSchemaGeneratorPage from './pages/ReviewSchemaGeneratorPage'
import BreadcrumbSchemaGeneratorPage from './pages/BreadcrumbSchemaGeneratorPage'
import AEOPillarPage from './pages/AEOPillarPage'
import AISearchOptimizationPillarPage from './pages/AISearchOptimizationPillarPage'
import SchemaMarkupPillarPage from './pages/SchemaMarkupPillarPage'
import SchemaMarkupGraderPage from './pages/SchemaMarkupGraderPage'
import GEOPillarPage from './pages/GEOPillarPage'
import HowToWinFeaturedSnippetsPage from './pages/HowToWinFeaturedSnippetsPage'
import JsonLdVsMicrodataPage from './pages/JsonLdVsMicrodataPage'
import HowAIEnginesRankSourcesPage from './pages/HowAIEnginesRankSourcesPage'
import EntityBasedSeoStrategiesPage from './pages/EntityBasedSeoStrategiesPage'
import TeamSettingsPage from './pages/TeamSettingsPage'
import JoinTeamPage from './pages/JoinTeamPage'
import SchemaPropertyReferencePage from './pages/SchemaPropertyReferencePage'

// Components
import ModelTester from './components/ModelTester'
import ScrollToTop from './components/ScrollToTop'
import { AuthLoadingScreen } from './components/AuthLoadingScreen'

// Layout
import Layout from './components/Layout'

// Contexts
import { OnboardingProvider } from './contexts/OnboardingContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TeamProvider } from './contexts/TeamContext'

// Providers
import { ApiProvider } from './providers/ApiProvider'

// Hooks
import { usePendingHubSpotConnection } from './hooks/usePendingHubSpotConnection'
import { useVersionCheck } from './hooks/useVersionCheck'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx client errors (includes 401, 403, 404, 429, etc.)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Allow 1 retry for other errors (5xx, network issues, etc.)
        return failureCount < 1
      },
      refetchOnWindowFocus: false, // Don't auto-refetch when window regains focus
      refetchOnReconnect: false, // Don't auto-refetch when reconnecting
    },
  },
})

function AppContent() {
  // Auto-claim pending HubSpot connections after signup (marketplace-first flow)
  usePendingHubSpotConnection()

  // Check for new app versions every 30 minutes
  useVersionCheck()

  // Check if Clerk auth is loaded
  const { isLoaded } = useAuth()

  // Show loading screen while Clerk initializes
  // This prevents flash of Welcome page for authenticated users
  if (!isLoaded) {
    return <AuthLoadingScreen />
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/free-schema-generator" element={<FreeSchemaGeneratorPage />} />
          <Route path="/faq-schema-generator" element={<FAQSchemaGeneratorPage />} />
          <Route path="/article-schema-generator" element={<ArticleSchemaGeneratorPage />} />
          <Route path="/blogposting-schema-generator" element={<BlogPostingSchemaGeneratorPage />} />
          <Route path="/howto-schema-generator" element={<HowToSchemaGeneratorPage />} />
          <Route path="/product-schema-generator" element={<ProductSchemaGeneratorPage />} />
          <Route path="/localbusiness-schema-generator" element={<LocalBusinessSchemaGeneratorPage />} />
          <Route path="/organization-schema-generator" element={<OrganizationSchemaGeneratorPage />} />
          <Route path="/event-schema-generator" element={<EventSchemaGeneratorPage />} />
          <Route path="/review-schema-generator" element={<ReviewSchemaGeneratorPage />} />
          <Route path="/breadcrumb-schema-generator" element={<BreadcrumbSchemaGeneratorPage />} />

          {/* Resources - Public pillar pages */}
          <Route path="/aeo" element={<AEOPillarPage />} />
          <Route path="/aeo/how-to-win-featured-snippets" element={<HowToWinFeaturedSnippetsPage />} />
          <Route path="/geo" element={<GEOPillarPage />} />
          <Route path="/geo/entity-based-seo-strategies" element={<EntityBasedSeoStrategiesPage />} />
          <Route path="/ai-search-optimization" element={<AISearchOptimizationPillarPage />} />
          <Route path="/ai-search-optimization/how-ai-engines-rank-sources" element={<HowAIEnginesRankSourcesPage />} />
          <Route path="/schema-markup" element={<SchemaMarkupPillarPage />} />
          <Route path="/schema-markup/json-ld-vs-microdata" element={<JsonLdVsMicrodataPage />} />
          <Route path="/schema-markup/improve-quality-score" element={<SchemaPropertyReferencePage />} />

          {/* Free Tools */}
          <Route path="/schema-markup-grader" element={<SchemaMarkupGraderPage />} />

          {/* Generate - Standalone route at root level */}
          <Route path="/generate" element={
            <Layout>
              <GeneratePage />
            </Layout>
          } />

          {/* Library - Standalone route at root level */}
          <Route path="/library" element={
            <Layout>
              <LibraryPage />
            </Layout>
          } />

          {/* HubSpot - Standalone route at root level */}
          <Route path="/hubspot" element={
            <Layout>
              <HubSpotPage />
            </Layout>
          } />

          {/* HubSpot OAuth Callback - No layout needed */}
          <Route path="/hubspot/callback" element={<HubSpotCallbackPage />} />

          {/* What's New - Standalone route at root level */}
          <Route path="/whats-new" element={
            <Layout>
              <WhatsNewPage />
            </Layout>
          } />

          {/* Settings - Standalone route at root level */}
          <Route path="/settings" element={
            <Layout>
              <SettingsPage />
            </Layout>
          } />

          {/* Team routes */}
          <Route path="/team/settings" element={
            <Layout>
              <TeamSettingsPage />
            </Layout>
          } />

          <Route path="/team/join/:token" element={<JoinTeamPage />} />

          {/* Protected routes - Temporarily bypassed for testing */}
          <Route path="/dashboard/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/model-tester" element={<ModelTester />} />
              </Routes>
            </Layout>
          } />

          {/* Model Tester - Standalone route for easy access */}
          <Route path="/model-tester" element={
            <Layout>
              <ModelTester />
            </Layout>
          } />

          {/* Admin - Nested routes with tabs, wrapped in main Layout for sidebar */}
          <Route path="/admin" element={
            <Layout>
              <AdminLayout />
            </Layout>
          }>
            <Route index element={<Navigate to="/admin/analytics" replace />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="monitoring" element={<AdminMonitoring />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="content" element={<AdminContent />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <TeamProvider>
            <OnboardingProvider>
              <ScrollToTop />
              <AppContent />
              {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </OnboardingProvider>
          </TeamProvider>
        </ApiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App