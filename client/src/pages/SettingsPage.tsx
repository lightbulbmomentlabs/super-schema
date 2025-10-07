import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  User,
  CreditCard,
  TrendingUp,
  Settings as SettingsIcon,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { apiService } from '@/services/api'

export default function SettingsPage() {
  const { user } = useUser()
  const navigate = useNavigate()

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Settings'
  }, [])

  // Get user stats
  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiService.getUserStats()
  })

  // Get user credits
  const { data: creditsData } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits()
  })

  // Get library URLs for stats
  const { data: libraryUrlsData } = useQuery({
    queryKey: ['dashboard-urls'],
    queryFn: () => apiService.getUserUrls({
      isHidden: false
    })
  })

  const stats = statsData?.data || {}
  const creditBalance = creditsData?.data?.creditBalance || 0
  const libraryUrls = libraryUrlsData?.data || []

  const totalUrls = libraryUrls.length
  const urlsWithSchema = libraryUrls.filter((url: any) => url.hasSchema).length
  const schemaCoverage = totalUrls > 0 ? Math.round((urlsWithSchema / totalUrls) * 100) : 0

  const formatDate = (date: number | string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your generation history? This action cannot be undone.')) {
      return
    }
    // TODO: Implement clear history API call
    alert('Clear history feature coming soon!')
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.')) {
      return
    }
    // TODO: Implement account deletion with Clerk
    alert('Account deletion feature coming soon!')
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Information */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Account Information</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-base mt-1">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-base mt-1">{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-base mt-1">
                {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account ID</label>
              <p className="text-base mt-1 font-mono text-sm">{user?.id}</p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={() => window.open('https://accounts.clerk.com/user', '_blank')}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Manage account details in Clerk
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Billing & Credits */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Billing & Credits</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Balance</label>
              <p className="text-3xl font-bold mt-1">{creditBalance}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Spent</label>
              <p className="text-3xl font-bold mt-1">
                ${((stats.total_spent_cents || 0) / 100).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => navigate('/dashboard/credits')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Buy Credits
            </button>
            <button
              onClick={() => navigate('/dashboard/credits')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              View Payment History
            </button>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Usage Statistics</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Schemas Generated</label>
              <p className="text-3xl font-bold mt-1">{stats.total_schemas_generated || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">URLs Discovered</label>
              <p className="text-3xl font-bold mt-1">{totalUrls}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Schema Coverage</label>
              <p className="text-3xl font-bold mt-1">{schemaCoverage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Preferences</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Auto-save to Library</p>
              <p className="text-sm text-muted-foreground">
                Automatically save discovered URLs to your library
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border">
            <div>
              <p className="font-medium">Low Credit Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email alerts when credit balance is low
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border">
            <div>
              <p className="font-medium">Default Schema Format</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred schema output format
              </p>
            </div>
            <select className="px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="json-ld">JSON-LD</option>
              <option value="microdata">Microdata</option>
              <option value="rdfa">RDFa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-destructive rounded-lg bg-destructive/50">
        <div className="p-6 border-b border-destructive">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
            <h2 className="text-xl font-semibold text-destructive-foreground">Danger Zone</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-destructive-foreground">Clear Generation History</p>
              <p className="text-sm text-destructive-foreground">
                Permanently delete all schema generation history
              </p>
            </div>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 border border-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-destructive">
            <div>
              <p className="font-medium text-destructive-foreground">Delete Account</p>
              <p className="text-sm text-destructive-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
