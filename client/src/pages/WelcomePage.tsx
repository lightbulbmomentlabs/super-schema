import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Sparkles, Zap, TrendingUp, ArrowRight, Clock, Target, Rocket } from 'lucide-react'
import { apiService } from '@/services/api'
import AnimatedGradientBackground from '@/components/AnimatedGradientBackground'
import FloatingAIIcons from '@/components/FloatingAIIcons'
import GlowingBadge from '@/components/GlowingBadge'
import ScoreAnimationPreview from '@/components/ScoreAnimationPreview'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { user } = useUser()

  // Set page title
  useEffect(() => {
    document.title = 'Welcome to SuperSchema!'
  }, [])

  // Initialize user account and grant welcome credits
  useEffect(() => {
    const initializeAccount = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        console.warn('⚠️ [Welcome] No email address available, skipping initialization')
        return
      }

      try {
        console.log('🎉 [Welcome] Initializing new user account...')
        await apiService.initializeUser({
          email: user.primaryEmailAddress.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined
        })
        console.log('✅ [Welcome] User account initialized successfully with 2 free credits!')
      } catch (error: any) {
        console.error('❌ [Welcome] Failed to initialize user:', error)
      }
    }

    initializeAccount()
  }, [user])

  // Fire Google Ads conversion tracking on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion_event_page_view_1', {});
      console.log('🎉 Google Ads conversion tracking fired: conversion_event_page_view_1')
    }
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Above the Fold */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background */}
        <AnimatedGradientBackground />

        {/* Floating AI Icons */}
        <FloatingAIIcons />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Column - Main Content */}
            <motion.div
              className="text-center lg:text-left space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {/* Welcome Message */}
              <div className="space-y-2">
                <motion.div
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Welcome to the Future{user?.firstName ? `, ${user.firstName}` : ''}!</span>
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                    ChatGPT, Perplexity & Gemini
                  </span>{' '}
                  <br />
                  <span>are Searching.</span>
                </motion.h1>

                <motion.p
                  className="text-2xl md:text-3xl font-semibold text-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Get Discovered.
                </motion.p>
              </div>

              {/* Subtext */}
              <motion.p
                className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                You're early to the AI search revolution. Let's make your content <span className="font-bold text-primary">super</span>.
              </motion.p>

              {/* Credits Badge */}
              <motion.div
                className="flex justify-center lg:justify-start"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <GlowingBadge icon={Zap} text="2 Free Schemas Ready!" />
              </motion.div>

              {/* Primary CTA */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={() => navigate('/generate')}
                  className="group w-full lg:w-auto inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-primary to-purple-500 text-primary-foreground rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold text-lg shadow-lg"
                >
                  <svg viewBox="0 0 1500 1500" className="h-6 w-6 flex-shrink-0 group-hover:rotate-12 transition-transform" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M478,1436.7c-11.8,0-23.2-2.2-33.6-6.7-18.5-8-32.7-22.2-40.9-41.1-7.6-17.6-9.7-38.2-6.1-61.4.4-2.3.9-4.6,1.7-6.8l158.4-461.2c-30.2-1.6-62-.5-95.5.7-39.1,1.4-79.5,2.9-118.2-.5-39.1-3.4-69.9-22.4-86.5-53.7-18-33.8-16.1-76.8,5.2-115.2,0-.1.1-.2.2-.3,45.2-79.9,86.2-166.8,125.8-250.9,41.7-88.4,84.7-179.9,133.4-264.7,35-61,87.7-97.6,148.5-103.2,1.2-.1,2.5-.2,3.7-.2l411.1,1.1c7.8,0,15.3,2.3,21.8,6.5.3.2.6.3.9.5,3.7,2,9.8,5.2,15.5,11,21.1,21.3,24.4,55.4,18.6,78-.7,2.8-1.8,5.6-3.1,8.2l-166.3,325.7,223.8.9c2.9,0,5.8.3,8.7,1,39.6,9,65,42.5,63.2,83.5-1.4,32.6-22.3,55.9-37.6,72.9-1.9,2.1-3.7,4.1-5.3,6-108.5,125-223.1,248.2-333.9,367.4-107.6,115.6-218.8,235.2-324,356-14.8,18.8-33.9,32.8-55.1,40.4-11.4,4.1-22.9,6.1-34.2,6.1ZM476.7,1356.7c4.5.7,17.5-2.7,28-16.4.5-.6,1-1.2,1.5-1.8,106.2-122,218.2-242.3,326.4-358.7,110.4-118.6,224.5-241.3,332.1-365.3,2.1-2.4,4.2-4.8,6.3-7.1,5.3-5.9,16.2-18,17.2-23,0-.4,0-.7,0-.9l-241.1-.9c-1,0-1.9,0-2.9-.1-18.4-1.4-35.5-10.5-47-24.9-11.5-14.4-16.6-33.2-13.9-51.5.6-4.3,2-8.5,3.9-12.4l174.1-341-385.5-1c-24,2.6-57.5,15.9-84.6,63.1-47.1,82.1-89.4,172-130.4,259-40.2,85.3-81.8,173.5-128.4,256-7.7,14.1-9.5,29.2-4.5,38.7,3.6,6.7,11.2,10.6,22.8,11.6,33.8,2.9,70.1,1.6,108.4.2,36.5-1.3,74.3-2.7,110.7-.2,1.7.1,3.4.3,5.1.7,21.5,4.3,40.4,17.7,51.9,36.7,11.4,18.8,14.4,41.5,8.2,62.3-.2.6-.3,1.1-.5,1.7l-158.5,461.6c-.9,8.1.1,12.2.7,13.7ZM1107.7,79.7s0,0,0,0c0,0,0,0,0,0Z"/>
                    <path d="M567.8,583.5c19-3.1,28.4,20.2,42.1,31.6,37.7,31.3,88.7,25.9,127.7-.4,15.1-10.2,35.2-42.4,51.8-25.3,24.3,24.9-25.9,57.7-44.6,68.7-50.5,29.8-111,40.7-159.4.7-7.9-6.5-31.7-31.3-34.6-40.1-4.7-14.2.9-32.6,17-35.2Z"/>
                    <path d="M585,402.2c50.5-4.5,40,106.3-13.3,97.6-40.5-6.7-24.7-94.2,13.3-97.6Z"/>
                    <path d="M783.5,402.1c9.3-1.1,19.4,5.5,24.5,12.9,23.8,34.5-11,107-47.5,79.5-27.2-20.5-9.8-88.7,23-92.4Z"/>
                  </svg>
                  <span>Generate Your First Schema</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-xs text-muted-foreground text-center lg:text-left">
                  No credit card required • Your first schemas are on us
                </p>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                className="flex flex-wrap gap-6 justify-center lg:justify-start pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">1,000+</span> users optimized
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">+18 pts</span> avg. score boost
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Product Preview */}
            <motion.div
              className="flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <ScoreAnimationPreview />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Value Strip */}
      <div className="relative z-10 bg-card/50 backdrop-blur-md border-y border-border py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Value Card 1 */}
            <motion.div
              className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">30-Second Setup</h3>
              <p className="text-sm text-muted-foreground">URL in, schema out. No complexity.</p>
            </motion.div>

            {/* Value Card 2 */}
            <motion.div
              className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-3">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-1">AI-Optimized</h3>
              <p className="text-sm text-muted-foreground">Built for ChatGPT, Perplexity, Gemini</p>
            </motion.div>

            {/* Value Card 3 */}
            <motion.div
              className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-3">
                <Rocket className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-1">Instant Results</h3>
              <p className="text-sm text-muted-foreground">Copy, paste, rank higher</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Social Proof Banner */}
      <motion.div
        className="relative z-10 bg-gradient-to-r from-success/10 via-info/10 to-primary/10 border-y border-success/20 py-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-sm">
            <motion.div
              className="flex items-center gap-2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4 text-success" />
            </motion.div>
            <p className="text-foreground font-medium">
              Join <span className="font-bold">1,000+ users</span> getting discovered by AI search engines
            </p>
          </div>
        </div>
      </motion.div>

      {/* Secondary CTA - Subtle */}
      <div className="relative z-10 py-8 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          Skip to Dashboard →
        </button>
      </div>
    </div>
  )
}
