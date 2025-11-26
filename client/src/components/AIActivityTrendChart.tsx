import { motion } from 'framer-motion'
import { Activity, Calendar, RefreshCw } from 'lucide-react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { cn } from '@/utils/cn'
import type { ActivitySnapshot } from '@/services/ga4'

interface AIActivityTrendChartProps {
  snapshots: ActivitySnapshot[]
  isLoading?: boolean
  onRetry?: () => void
  className?: string
}

export default function AIActivityTrendChart({
  snapshots,
  isLoading = false,
  onRetry,
  className = ''
}: AIActivityTrendChartProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'animate-pulse h-full flex flex-col',
        className
      )}>
        <div className="h-8 w-64 bg-muted/20 rounded mb-6" />
        <div className="flex-1 bg-muted/20 rounded" />
      </div>
    )
  }

  // Empty state
  if (snapshots.length === 0) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'h-full flex flex-col',
        className
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI Activity Trend
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No activity data available yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Activity snapshots will be recorded daily starting tonight
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 hover:border-primary/50 transition-all inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Again
            </button>
          )}
        </div>
      </div>
    )
  }

  // Format date for display (e.g., "1/15")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
  }

  // Format data for recharts
  const chartData = snapshots.map(snapshot => ({
    date: formatDate(snapshot.date),
    fullDate: snapshot.date,
    aiSessions: snapshot.aiSessions,
    uniqueCrawlers: snapshot.uniqueCrawlers,
    aiCrawledPages: snapshot.aiCrawledPages,
    totalActivePages: snapshot.totalActivePages,
    // Calculate non-AI pages for stacked area
    nonAiPages: Math.max(0, snapshot.totalActivePages - snapshot.aiCrawledPages)
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-xl min-w-[200px]">
          <p className="text-sm font-semibold text-foreground mb-3 border-b border-border/50 pb-2">
            {data.fullDate}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">AI Sessions:</span>
              <span className="text-sm font-bold text-blue-500">{data.aiSessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Unique Crawlers:</span>
              <span className="text-sm font-bold text-purple-500">{data.uniqueCrawlers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">AI Crawled Pages:</span>
              <span className="text-sm font-bold text-green-500">{data.aiCrawledPages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Pages:</span>
              <span className="text-sm font-bold text-foreground">{data.totalActivePages}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate stats for footer
  const totalSessions = snapshots.reduce((sum, s) => sum + s.aiSessions, 0)
  const maxCrawlers = Math.max(...snapshots.map(s => s.uniqueCrawlers))
  const avgCrawledPages = Math.round(
    snapshots.reduce((sum, s) => sum + s.aiCrawledPages, 0) / snapshots.length
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'hover:shadow-2xl hover:border-primary/50 transition-all duration-300',
        'h-full flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI Activity Trend
          </h3>
          <p className="text-sm text-muted-foreground">
            Daily AI crawler activity metrics
          </p>
        </div>
      </div>

      {/* Chart - flex-1 to fill available space */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="aiPagesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(34, 197, 94)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="rgb(34, 197, 94)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="totalPagesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(148, 163, 184)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="rgb(148, 163, 184)" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            {/* Left Y-axis for sessions and pages */}
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            {/* Right Y-axis for crawler count */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {/* Stacked area for pages (background layer) */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="aiCrawledPages"
              name="AI Crawled Pages"
              stackId="pages"
              stroke="rgb(34, 197, 94)"
              fill="url(#aiPagesGradient)"
              strokeWidth={0}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="nonAiPages"
              name="Other Pages"
              stackId="pages"
              stroke="rgb(148, 163, 184)"
              fill="url(#totalPagesGradient)"
              strokeWidth={0}
            />

            {/* Line for AI sessions */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="aiSessions"
              name="AI Sessions"
              stroke="rgb(59, 130, 246)"
              strokeWidth={3}
              dot={{
                fill: 'rgb(59, 130, 246)',
                strokeWidth: 2,
                r: 4,
                stroke: 'hsl(var(--card))'
              }}
              activeDot={{
                r: 6,
                fill: 'rgb(59, 130, 246)',
                stroke: 'hsl(var(--card))',
                strokeWidth: 2
              }}
            />

            {/* Line for unique crawlers (right axis) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="uniqueCrawlers"
              name="Unique Crawlers"
              stroke="rgb(168, 85, 247)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{
                fill: 'rgb(168, 85, 247)',
                strokeWidth: 2,
                r: 3,
                stroke: 'hsl(var(--card))'
              }}
              activeDot={{
                r: 5,
                fill: 'rgb(168, 85, 247)',
                stroke: 'hsl(var(--card))',
                strokeWidth: 2
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer stats */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Total Sessions</p>
            <p className="font-bold text-blue-500">{totalSessions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Peak Crawlers</p>
            <p className="font-bold text-purple-500">{maxCrawlers}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Avg Pages/Day</p>
            <p className="font-bold text-green-500">{avgCrawledPages}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
