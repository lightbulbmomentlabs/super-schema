import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Pages
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import GeneratePage from './pages/GeneratePage'
import CreditsPage from './pages/CreditsPage'
import LibraryPage from './pages/LibraryPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import HubSpotPage from './pages/HubSpotPage'
import HubSpotCallbackPage from './pages/HubSpotCallbackPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import DocsPage from './pages/DocsPage'
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

// Components
import ModelTester from './components/ModelTester'

// Layout
import Layout from './components/Layout'

// Contexts
import { OnboardingProvider } from './contexts/OnboardingContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Providers
import { ApiProvider } from './providers/ApiProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
})

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <OnboardingProvider>
            <div className="min-h-screen bg-background">
              <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/docs" element={<DocsPage />} />
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
          <Route path="/ai-search-optimization" element={<AISearchOptimizationPillarPage />} />
          <Route path="/ai-search-optimization/how-ai-engines-rank-sources" element={<HowAIEnginesRankSourcesPage />} />
          <Route path="/schema-markup" element={<SchemaMarkupPillarPage />} />
          <Route path="/schema-markup/json-ld-vs-microdata" element={<JsonLdVsMicrodataPage />} />

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

          {/* Settings - Standalone route at root level */}
          <Route path="/settings" element={
            <Layout>
              <SettingsPage />
            </Layout>
          } />

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

          {/* Admin - Standalone route for admin access */}
          <Route path="/admin" element={
            <Layout>
              <AdminPage />
            </Layout>
          } />

          {/* Fallback route */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
          </div>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </OnboardingProvider>
      </ApiProvider>
    </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App