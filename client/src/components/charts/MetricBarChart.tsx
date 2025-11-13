import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'

interface MetricBarChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>
  dataKey?: string
  xAxisKey?: string
  height?: number
  color?: string
  showGrid?: boolean
  showLegend?: boolean
  yAxisLabel?: string
  formatValue?: (value: number) => string
  colors?: string[]
}

export default function MetricBarChart({
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  color = 'hsl(var(--primary))',
  showGrid = true,
  showLegend = false,
  yAxisLabel,
  formatValue = (value) => value.toString(),
  colors,
}: MetricBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
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
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'hsl(var(--foreground))',
          }}
          labelStyle={{
            color: 'hsl(var(--foreground))',
          }}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
          formatter={(value: any) => [formatValue(Number(value)), dataKey]}
        />
        {showLegend && <Legend />}
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {colors ? (
            data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))
          ) : (
            <Cell fill={color} />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
