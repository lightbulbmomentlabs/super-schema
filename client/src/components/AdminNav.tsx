import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Users,
  Activity,
  MessageSquare,
  FileText,
  Rocket
} from 'lucide-react'
import { useAdminBadgeCounts } from '@/hooks/useAdminBadgeCounts'
import AdminBadge from './AdminBadge'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badgeCount?: number
}

export default function AdminNav() {
  // Get badge counts for tabs with notifications
  const { monitoringCount, ticketsCount, usersCount } = useAdminBadgeCounts()

  const navItems: NavItem[] = [
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/users', label: 'Users', icon: Users, badgeCount: usersCount },
    { to: '/admin/monitoring', label: 'Monitoring', icon: Activity, badgeCount: monitoringCount },
    { to: '/admin/tickets', label: 'Tickets', icon: MessageSquare, badgeCount: ticketsCount },
    { to: '/admin/content', label: 'Content', icon: FileText },
    { to: '/admin/beta-requests', label: 'Beta Requests', icon: Rocket },
  ]
  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8" role="tablist">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                role="tab"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-4 border-b-2 transition-colors font-medium text-sm ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badgeCount !== undefined && <AdminBadge count={item.badgeCount} />}
              </NavLink>
            )
          })}
        </div>

        {/* Mobile Navigation - Dropdown */}
        <div className="md:hidden py-3">
          <select
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-medium"
            onChange={(e) => {
              window.location.href = e.target.value
            }}
            value={window.location.pathname}
          >
            {navItems.map((item) => (
              <option key={item.to} value={item.to}>
                {item.label}{item.badgeCount ? ` (${item.badgeCount})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  )
}
