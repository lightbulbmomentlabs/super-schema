import { useEffect } from 'react'
import { AlertCircle, Activity } from 'lucide-react'
import AdminErrorsSection from '@/components/AdminErrorsSection'
import AdminHubSpotStats from '@/components/AdminHubSpotStats'
import AdminSchemaFailures from '@/components/AdminSchemaFailures'
import { markTabAsViewed } from '@/hooks/useAdminBadgeCounts'

export default function AdminMonitoring() {
  // Mark this tab as viewed when component mounts
  // This resets the badge count for the Monitoring tab
  useEffect(() => {
    markTabAsViewed('monitoring')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Monitoring</h2>
        <p className="text-muted-foreground mt-1">
          Monitor errors, HubSpot integration health, and schema generation failures
        </p>
      </div>

      {/* Error Logs Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Error Logs</h2>
        </div>
        <AdminErrorsSection />
      </div>

      {/* HubSpot Integration Stats */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">HubSpot Integration Health</h2>
        </div>
        <AdminHubSpotStats />
      </div>

      {/* Schema Generation Failures */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Schema Generation Failures</h2>
        </div>
        <AdminSchemaFailures />
      </div>
    </div>
  )
}
