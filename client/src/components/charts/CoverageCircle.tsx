import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CoverageCircleProps {
  percentage: number;
  label?: string;
}

export default function CoverageCircle({ percentage = 73, label = "AI Coverage" }: CoverageCircleProps) {
  const data = [
    { name: 'Covered', value: percentage },
    { name: 'Uncovered', value: 100 - percentage },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex flex-col items-center justify-center"
    >
      <div className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              animationDuration={1500}
              animationBegin={400}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center"
          >
            <div className="text-4xl font-black text-foreground">
              {percentage}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {label}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
