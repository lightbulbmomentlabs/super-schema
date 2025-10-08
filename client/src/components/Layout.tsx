import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import {
  LayoutDashboard,
  Library,
  Settings,
  Shield,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/utils/cn'
import SuperSchemaLogo from './SuperSchemaLogo'
import LightningBoltIcon from './icons/LightningBoltIcon'
import Footer from './Footer'
import ThemeToggle from './ThemeToggle'
import { useIsAdmin } from '@/hooks/useIsAdmin'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Generate', href: '/generate', icon: LightningBoltIcon },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user } = useUser()
  const isAdmin = useIsAdmin()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <SuperSchemaLogo className="h-8 w-8" />
              <span className="font-bold text-lg">SuperSchema</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
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
          </div>
        </div>
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

                  {/* Admin-Only Links */}
                  {isAdmin && (
                    <>
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
                        <ExternalLink
                          className={cn(
                            'mr-3 flex-shrink-0 h-5 w-5',
                            location.pathname === '/hubspot' ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}
                        />
                        HubSpot
                      </Link>
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