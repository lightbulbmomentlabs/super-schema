import { useEffect, useState } from 'react'
import { Sparkles, Zap, TrendingUp, Stars } from 'lucide-react'

interface RefiningOverlayProps {
  isRefining: boolean
}

export default function RefiningOverlay({ isRefining }: RefiningOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  // Fun messages that rotate while refining
  const messages = [
    { icon: Sparkles, text: "Teaching the AIs to love your content...", subtext: "ChatGPT, Perplexity, and Gemini approved" },
    { icon: TrendingUp, text: "Supercharging your AEO score...", subtext: "From invisible to irresistible" },
    { icon: Zap, text: "Making it super!", subtext: "Because good isn't good enough" },
    { icon: Stars, text: "Translating to AI-speak...", subtext: "Crystal clear for every AI engine" },
  ]

  // Rotate messages every 2.5 seconds
  useEffect(() => {
    if (!isRefining) {
      setMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [isRefining, messages.length])

  if (!isRefining) return null

  const CurrentIcon = messages[messageIndex].icon

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 px-4">
        {/* Animated icon with pulsing glow */}
        <div className="relative">
          {/* Pulsing glow rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/30 animate-pulse" />
          </div>

          {/* Main icon */}
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary via-purple-500 to-primary animate-spin-slow">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-background">
              <CurrentIcon className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>

          {/* Orbiting sparkles */}
          <div className="absolute inset-0 animate-spin-slow">
            <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 h-4 w-4 text-primary" />
          </div>
          <div className="absolute inset-0 animate-spin-reverse">
            <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 h-4 w-4 text-purple-500" />
          </div>
        </div>

        {/* Message with fade transition */}
        <div className="text-center space-y-2 animate-fade-in">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-pulse">
            {messages[messageIndex].text}
          </h3>
          <p className="text-sm text-muted-foreground animate-fade-in">
            {messages[messageIndex].subtext}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex space-x-2">
          {messages.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                idx === messageIndex
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              <Sparkles
                className="h-3 w-3 text-primary/40"
                style={{
                  filter: 'blur(1px)',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
