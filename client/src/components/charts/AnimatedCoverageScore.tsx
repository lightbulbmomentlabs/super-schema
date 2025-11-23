import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, CheckCircle } from 'lucide-react';

export default function AnimatedCoverageScore() {
  const [count, setCount] = useState(0);
  const targetPercentage = 73;

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetPercentage / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setCount(Math.min(Math.round(currentStep * increment), targetPercentage));
      } else {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  // Calculate the circle progress
  const circumference = 2 * Math.PI * 120;
  const progress = (count / 100) * circumference;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main circle container */}
      <div className="relative flex items-center justify-center p-8">
        {/* SVG Circle */}
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 280 280">
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r="120"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            className="text-muted/20"
          />

          {/* Animated progress circle */}
          <motion.circle
            cx="140"
            cy="140"
            r="120"
            stroke="url(#gradient)"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
            className="text-center"
          >
            <div className="text-6xl font-black bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              {count}%
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Coverage Score
            </div>
          </motion.div>
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/40"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Stats row below circle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="grid grid-cols-3 gap-4 mt-8"
      >
        <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-2xl font-bold">284</span>
          </div>
          <div className="text-xs text-muted-foreground">Pages Discovered</div>
        </div>

        <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-2xl font-bold">+12%</span>
          </div>
          <div className="text-xs text-muted-foreground">This Month</div>
        </div>

        <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-2xl font-bold">8</span>
          </div>
          <div className="text-xs text-muted-foreground">AI Engines</div>
        </div>
      </motion.div>
    </div>
  );
}
