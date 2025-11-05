import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton, useUser, useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Library,
  Settings,
  Shield,
  Menu,
  X,
  Bell
} from 'lucide-react'
import { cn } from '@/utils/cn'
import SuperSchemaLogo from './SuperSchemaLogo'
import LightningBoltIcon from './icons/LightningBoltIcon'
import HubSpotIcon from './icons/HubSpotIcon'
import Footer from './Footer'
import ThemeToggle from './ThemeToggle'
import ResourcesDropdown from './ResourcesDropdown'
import TeamSwitcher from './TeamSwitcher'
import { NotificationBadge } from './NotificationBadge'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useWhatsNewNotifications } from '@/hooks/useWhatsNewNotifications'
import { apiService } from '@/services/api'
import { HeaderSkeleton } from './skeletons/HeaderSkeleton'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Generate', href: '/generate', icon: LightningBoltIcon },
  { name: 'URL Library', href: '/library', icon: Library },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, isLoaded: isUserLoaded } = useUser()
  const { isLoaded: isAuthLoaded } = useAuth()
  const isAdmin = useIsAdmin()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fetch release notes for notification badge
  const { data: notesData } = useQuery({
    queryKey: ['release-notes'],
    queryFn: () => apiService.getReleaseNotes(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const notes = notesData?.data || []
  const { unreadCount } = useWhatsNewNotifications(notes)

  // Check if user and auth are still loading
  const isLoading = !isUserLoaded || !isAuthLoaded

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <SuperSchemaLogo className="h-8 w-8" />
              <span className="font-bold text-lg">SuperSchema</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <HeaderSkeleton />
            ) : (
              <>
                <ResourcesDropdown />
                <TeamSwitcher />
                <span className="text-sm text-muted-foreground">
                  Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <ThemeToggle />
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="w-full px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}

              {/* HubSpot Link */}
              <Link
                to="/hubspot"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors',
                  location.pathname === '/hubspot'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <HubSpotIcon className="mr-3 h-5 w-5" />
                HubSpot
              </Link>

              {/* What's New Link */}
              <Link
                to="/whats-new"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors',
                  location.pathname === '/whats-new'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Bell className="mr-3 h-5 w-5" />
                <span className="flex items-center gap-2">
                  What's New
                  {unreadCount > 0 && location.pathname !== '/whats-new' && (
                    <NotificationBadge count={unreadCount} />
                  )}
                </span>
              </Link>

              {/* Admin Link (if admin) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors',
                    location.pathname === '/admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Shield className="mr-3 h-5 w-5" />
                  Admin
                </Link>
              )}

              {/* Resources Section */}
              <div className="pt-3 border-t border-border mt-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                  Resources
                </div>
                <Link
                  to="/aeo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  AEO Guide
                </Link>
                <Link
                  to="/geo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  GEO Guide
                </Link>
                <Link
                  to="/ai-search-optimization"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  AI Search Optimization
                </Link>
                <Link
                  to="/schema-markup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  Schema Markup Guide
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="hidden md:flex md:w-48 md:flex-col md:fixed md:inset-y-16 md:left-0 md:bottom-12">
            <div className="flex flex-col flex-1 min-h-0 border-r border-border bg-card">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'mr-3 flex-shrink-0 h-5 w-5',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}
                        />
                        {item.name}
                      </Link>
                    )
                  })}

                  {/* HubSpot Integration - Available to all users */}
                  <div className="pt-4 pb-2">
                    <div className="h-px bg-border" />
                  </div>
                  <Link
                    to="/hubspot"
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      location.pathname === '/hubspot'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <HubSpotIcon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5',
                        location.pathname === '/hubspot' ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                    />
                    HubSpot
                  </Link>

                  {/* What's New - Available to all users */}
                  <Link
                    to="/whats-new"
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      location.pathname === '/whats-new'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Bell
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5',
                        location.pathname === '/whats-new' ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                    />
                    <span className="flex items-center gap-2">
                      What's New
                      {unreadCount > 0 && location.pathname !== '/whats-new' && (
                        <NotificationBadge count={unreadCount} />
                      )}
                    </span>
                  </Link>

                  {/* Admin-Only Links */}
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        className={cn(
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                          location.pathname === '/admin'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Shield
                          className={cn(
                            'mr-3 flex-shrink-0 h-5 w-5',
                            location.pathname === '/admin' ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}
                        />
                        Admin
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto md:ml-48">
            {children}
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}