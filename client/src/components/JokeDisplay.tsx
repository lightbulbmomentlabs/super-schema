import { useState, useEffect, useMemo } from 'react'
import { JOKES } from '@/constants/jokes'

interface JokeDisplayProps {
  deliveryDuration?: number
  punchlineDuration?: number
}

type Phase = 'delivery' | 'punchline'

// Fisher-Yates shuffle algorithm for randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function JokeDisplay({
  deliveryDuration = 4000,
  punchlineDuration = 4000
}: JokeDisplayProps = {}) {
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('delivery')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Shuffle jokes once on mount for randomization
  const shuffledJokes = useMemo(() => shuffleArray(JOKES), [])

  const currentJoke = shuffledJokes[currentJokeIndex]

  useEffect(() => {
    let phaseTimer: NodeJS.Timeout
    let transitionTimer: NodeJS.Timeout

    if (phase === 'delivery') {
      // After delivery duration, transition to punchline
      phaseTimer = setTimeout(() => {
        setIsTransitioning(true)
        transitionTimer = setTimeout(() => {
          setPhase('punchline')
          setIsTransitioning(false)
        }, 500) // 500ms transition
      }, deliveryDuration)
    } else {
      // After punchline duration, transition to next joke
      phaseTimer = setTimeout(() => {
        setIsTransitioning(true)
        transitionTimer = setTimeout(() => {
          // Move to next joke (loop back to start if at end)
          setCurrentJokeIndex((prev) => (prev + 1) % shuffledJokes.length)
          setPhase('delivery')
          setIsTransitioning(false)
        }, 500) // 500ms transition
      }, punchlineDuration)
    }

    // Cleanup timers on unmount or when dependencies change
    return () => {
      clearTimeout(phaseTimer)
      clearTimeout(transitionTimer)
    }
  }, [phase, currentJokeIndex, deliveryDuration, punchlineDuration, shuffledJokes.length])

  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div
        className="relative max-w-2xl w-full bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-2 border-primary/20 rounded-2xl shadow-lg p-8 overflow-hidden"
        role="status"
        aria-live="polite"
        aria-label="Loading joke"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />

        {/* Emoji Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="transition-transform duration-500"
            style={{
              transform: isTransitioning ? 'scale(0.8) rotate(-10deg)' : 'scale(1) rotate(0deg)'
            }}
          >
            <img
              src="/super-dad-jokes.png"
              alt="Super Dad Jokes"
              className="max-w-[80px] h-auto object-contain"
            />
          </div>
        </div>

        {/* Joke Content */}
        <div className="text-center space-y-6 min-h-[120px] flex items-center justify-center">
          <div
            className="transition-all duration-500 ease-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning
                ? 'translateY(-10px) scale(0.95)'
                : phase === 'delivery'
                ? 'translateY(0) scale(1)'
                : 'translateY(0) scale(1.02)',
            }}
          >
            {phase === 'delivery' ? (
              <p className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
                {currentJoke.delivery}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-2xl md:text-3xl font-bold text-primary leading-relaxed animate-bounce-subtle">
                  {currentJoke.punchline}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>😄</span>
                  <span className="italic">Super Dad Jokes</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-8 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => {
            const dotPhase = i === 0 ? 'delivery' : i === 1 ? 'transition' : 'punchline'
            const isActive =
              (dotPhase === 'delivery' && phase === 'delivery' && !isTransitioning) ||
              (dotPhase === 'transition' && isTransitioning) ||
              (dotPhase === 'punchline' && phase === 'punchline' && !isTransitioning)

            return (
              <div
                key={i}
                className="transition-all duration-300"
                style={{
                  width: isActive ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Custom CSS for subtle bounce animation */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0) scale(1.02);
          }
          50% {
            transform: translateY(-5px) scale(1.05);
          }
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 0.6s ease-in-out;
        }
      `}</style>
    </div>
  )
}
