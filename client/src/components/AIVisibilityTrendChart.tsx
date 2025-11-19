import { motion } from 'framer-motion'
import { TrendingUp, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/utils/cn'
import type { TrendDataPoint } from '@/services/ga4'

interface AIVisibilityTrendChartProps {
  trend: TrendDataPoint[]
  isLoading?: boolean
  className?: string
}

export default function AIVisibilityTrendChart({
  trend,
  isLoading = false,
  className = ''
}: AIVisibilityTrendChartProps) {
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
  if (trend.length === 0) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-2xl p-8',
        'h-full flex flex-col',
        className
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI Visibility Trend
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No trend data available yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Check back after AI crawlers start visiting your site
          </p>
        </div>
      </div>
    )
  }

  // Format date for display (e.g., "Jan 15" or "1/15")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
  }

  // Format data for recharts
  const chartData = trend.map(point => ({
    date: formatDate(point.date),
    score: point.score,
    crawlerCount: point.crawlerCount,
    fullDate: point.date // Keep for tooltip
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-foreground mb-1">{data.fullDate}</p>
          <p className="text-sm text-primary font-bold">
            Score: {data.score}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.crawlerCount} {data.crawlerCount === 1 ? 'crawler' : 'crawlers'}
          </p>
        </div>
      )
    }
    return null
  }

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
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI Visibility Trend
          </h3>
          <p className="text-sm text-muted-foreground">
            Your AI visibility score over time
          </p>
        </div>
      </div>

      {/* Chart - flex-1 to fill available space */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
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
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{
                fill: 'hsl(var(--primary))',
                strokeWidth: 2,
                r: 4,
                stroke: 'hsl(var(--card))'
              }}
              activeDot={{
                r: 6,
                fill: 'hsl(var(--primary))',
                stroke: 'hsl(var(--card))',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer info */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">
              Latest Score: <span className="font-bold text-primary">{trend[trend.length - 1]?.score || 0}</span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {trend.length} {trend.length === 1 ? 'day' : 'days'} of data
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
