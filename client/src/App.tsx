import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
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
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'

// Components
import ModelTester from './components/ModelTester'

// Layout
import Layout from './components/Layout'

// Contexts
import { OnboardingProvider } from './contexts/OnboardingContext'

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
  )
}

export default App