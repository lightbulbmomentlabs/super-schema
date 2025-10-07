import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Testimonial {
  name: string
  role: string
  company: string
  text: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah M.",
    role: "SEO Director",
    company: "Digital Growth Agency",
    text: "Honestly didn't think schema markup could save me this much time. Our clients used to wait days for schema implementation. Now it's done before they finish their coffee. Game changer.",
    rating: 5
  },
  {
    name: "Marcus T.",
    role: "E-commerce Owner",
    company: "Urban Threads Co.",
    text: "I've tried three other schema tools and they all felt like homework. This one actually makes sense. Got my entire product catalog schema'd in an afternoon. Rich snippets started showing up within a week.",
    rating: 5
  },
  {
    name: "Jennifer K.",
    role: "Marketing Manager",
    company: "SaaS Startup",
    text: "The quality score feature is clutch. Finally understand why my schema wasn't performing. Fixed everything they flagged and our search visibility doubled. Worth every penny.",
    rating: 5
  },
  {
    name: "David R.",
    role: "Agency Owner",
    company: "Peak Performance Marketing",
    text: "We're managing 40+ client sites. The URL discovery and library features are insane. I can bulk-generate schema for entire websites and keep everything organized. Clients think we're wizards.",
    rating: 5
  },
  {
    name: "Amanda L.",
    role: "Content Strategist",
    company: "Freelance",
    text: "I'm not technical at all and this tool doesn't make me feel stupid. The AI just gets it right. No more begging developers for help or spending hours in Schema.org documentation.",
    rating: 5
  }
]

export default function TestimonialScroller() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const current = testimonials[currentIndex]

  return (
    <div className="h-full flex flex-col justify-between p-8 bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl border border-border relative overflow-hidden">
      {/* Quote decoration */}
      <Quote className="absolute top-6 right-6 h-16 w-16 text-primary/10 rotate-180" />

      <div className="relative z-10">
        <div className="flex items-center mb-6">
          <div className="flex space-x-1">
            {[...Array(current.rating)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-lg leading-relaxed mb-6 text-foreground/90">
                "{current.text}"
              </p>

              <div>
                <p className="font-semibold text-foreground">{current.name}</p>
                <p className="text-sm text-muted-foreground">{current.role}</p>
                <p className="text-sm text-muted-foreground">{current.company}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center space-x-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-primary'
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
