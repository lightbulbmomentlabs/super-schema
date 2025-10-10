import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowRight, Zap, Shield, Clock, CheckCircle, Sparkles, Target, Rocket, Moon, Compass, Library, Award, BarChart3 } from 'lucide-react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import LiquidEther from '@/components/backgrounds/LiquidEther'
import FloatingBadge from '@/components/FloatingBadge'
import BentoCard from '@/components/BentoCard'
import FAQItem from '@/components/FAQItem'
import TestimonialScroller from '@/components/TestimonialScroller'
import HubSpotIcon from '@/components/icons/HubSpotIcon'
import ResourcesDropdown from '@/components/ResourcesDropdown'
import { useKonamiCode } from '@/hooks/useKonamiCode'

export default function LandingPage() {
  const { isSignedIn } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [superModeActive, setSuperModeActive] = useState(false)
  const [isLateNight, setIsLateNight] = useState(false)

  // Check if it's late night (11 PM - 4 AM)
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours()
      setIsLateNight(hour >= 23 || hour < 4)
    }
    checkTime()
    const interval = setInterval(checkTime, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Konami code easter egg
  const activateSuperMode = useCallback(() => {
    setSuperModeActive(true)

    // Confetti explosion!
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#8B5CF6', '#EC4899', '#3B82F6']

    ;(function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()

    // Reset after 5 seconds
    setTimeout(() => setSuperModeActive(false), 5000)
  }, [])

  useKonamiCode(activateSuperMode)

  const bentoFeatures = [
    {
      icon: Zap,
      title: 'AI-Powered Schema Generation',
      description: 'Our AI reads your content faster than you can say "structured data" and generates optimal markup for answer engine optimization and SEO. No PhD in Schema.org required.',
      featured: true
    },
    {
      icon: HubSpotIcon,
      title: 'HubSpot Integration',
      description: 'Connect your HubSpot account and push schema markup directly to your blog posts and pages with one click. No copy-paste, no technical headaches.'
    },
    {
      icon: Compass,
      title: 'Discover Your Site in Seconds',
      description: 'Drop in your domain and watch us crawl, discover, and map every URL. Your entire sitemap, ready for schema superpowers.'
    },
    {
      icon: Library,
      title: 'Your Schema Arsenal',
      description: 'Build a library of schema-powered URLs. Organize, search, and manage all your structured data in one slick dashboard.'
    },
    {
      icon: Award,
      title: 'Quality Score That Actually Matters',
      description: 'Get instant feedback on your schema quality. We grade your markup and tell you exactly what to fix. No mystery, just results.'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Validation',
      description: 'Every schema is validated before it hits your code. Catch errors before search engines do. Sleep better at night.'
    },
    {
      icon: Rocket,
      title: 'One-Click Refinement',
      description: 'AI-powered optimization that boosts your schema quality score instantly with zero effort.',
      featured: true
    }
  ]

  const benefits = [
    'Boost Answer Engine Optimization (AEO) for AI search',
    'Enhanced rich snippets and featured results',
    'Better SEO rankings with structured data',
    'Automated schema type detection and generation',
    'Real-time JSON-LD validation and error checking',
    'User-friendly schema markup editor'
  ]

  const faqs = [
    {
      question: 'Do I really need schema markup? My site seems fine without it.',
      answer: 'Your site might *look* fine to humans, but search engines see it differently. Schema markup is like giving Google, ChatGPT, and other AI search engines a cheat sheet about your content. Without it, they\'re just guessing. With it, you\'re 434% more likely to rank in featured snippets and show up in AI-generated answers. So yeah, you kinda need it.'
    },
    {
      question: 'Can\'t I just write the schema myself?',
      answer: 'Sure! You could also hand-code your entire website in binary. But why? Manual schema markup is tedious, error-prone, and takes forever. One missing comma and the whole thing breaks. SuperSchema generates perfect, validated JSON-LD in seconds. Your time is worth more than wrestling with Schema.org documentation at midnight.'
    },
    {
      question: 'What\'s the difference between regular SEO and AEO?',
      answer: 'SEO (Search Engine Optimization) helps you rank in traditional search results. AEO (Answer Engine Optimization) helps you show up in AI-generated answers from ChatGPT, Perplexity, Google AI Overviews, and other AI tools. Think of it as future-proofing your SEO. Schema markup is crucial for both, but especially for AEO since AI engines rely heavily on structured data to understand and cite your content.'
    },
    {
      question: 'How much does it cost?',
      answer: 'We use a credit system. You get 2 free credits when you sign up (no credit card required). After that, credits are super affordable, way cheaper than paying a developer to write schema manually or dealing with broken markup that tanks your SEO.'
    },
    {
      question: 'Will this work with my [insert platform here]?',
      answer: 'Yep! SuperSchema generates standard JSON-LD schema markup that works with any website: HubSpot, WordPress, Shopify, Webflow, custom HTML, you name it. If your site loads in a browser, our schema will work with it. Just paste the generated code into your page\'s <head> section and you\'re golden.'
    },
    {
      question: 'Why not just use ChatGPT or another AI tool?',
      answer: 'ChatGPT is great for many things, but schema markup isn\'t one of them. Here\'s why: ChatGPT hallucinates, makes up data, and can\'t actually crawl your website to extract real information. It\'ll give you generic templates that miss crucial details. SuperSchema actually visits your URL, scrapes your real content, analyzes your page structure, automatically detects the right schema types, validates everything against Schema.org standards, and generates production-ready markup with your actual data. No hallucinations. No guessing. No manual data entry. Just accurate, complete schema that actually works.'
    },
    {
      question: 'What if I don\'t know what schema type I need?',
      answer: 'That\'s the beauty of AI! Just paste your URL and our system automatically detects what type of schema you need: Article, Product, LocalBusiness, Recipe, Event, you name it. No Schema.org PhD required. We analyze your content and structure, then generate the perfect markup for your page.'
    },
    {
      question: 'Is the generated schema actually valid?',
      answer: '100%. Every schema we generate is validated against Schema.org standards and Google\'s requirements. We run it through multiple validation checks before showing it to you. Plus, our system stays updated with the latest schema standards so you don\'t have to. No broken markup, no validation errors, no stress.'
    },
    {
      question: 'How quickly will I see results?',
      answer: 'Schema generation? Under 30 seconds. SEO results? That depends on Google and other search engines. Typically, search engines re-crawl and re-index your pages within a few days to weeks. You might see rich snippets appear faster, while ranking improvements can take a bit longer. The important thing: you\'re giving search engines and AI the data they need to understand and promote your content.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Super Mode Activation Message */}
      <AnimatePresence>
        {superModeActive && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl"
                >
                  🦸
                </motion.span>
                <span className="font-bold text-lg">SECRET UNLOCKED: You've activated SUPER mode!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? 'border-border/50 bg-background/80 backdrop-blur-xl shadow-lg'
            : 'border-border bg-background'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <SuperSchemaLogo className="h-8 w-8" />
            <span className="font-bold text-xl">SuperSchema</span>
          </motion.div>
          <div className="flex items-center space-x-6">
            <ResourcesDropdown />
            {isSignedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Liquid Ether Background */}
        <LiquidEther />

        <div className="container mx-auto text-center max-w-5xl relative z-10">
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex justify-center"
          >
            <FloatingBadge>
              {isLateNight ? 'Powered by AI & caffeine ☕' : 'Powered by AI'}
            </FloatingBadge>
          </motion.div>

          {/* Glass Card Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="backdrop-blur-xl bg-background/40 border border-border/50 rounded-3xl p-12 shadow-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="block mb-2"
              >
                AEO Schema Generator
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
              >
                That's Actually Super
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Stop wrestling with JSON-LD syntax at 2am. Our AI-powered schema markup tool automatically creates optimized structured data for answer engine optimization (AEO) and SEO.
              Because life's too short for manual schema markup. ⚡
            </motion.p>

            <AnimatePresence>
              {isLateNight && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground/80 text-sm">
                    <Moon className="h-4 w-4" />
                    <span>Still up? We've got your back.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="flex justify-center items-center"
            >
              <Link
                to="/sign-up"
                className="group relative inline-flex items-center px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-lg font-semibold shadow-lg hover:shadow-2xl hover:scale-105"
              >
                <span className="relative z-10">Get Your Superpowers</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />

                {/* Shine effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2 flex-wrap"
            >
              <span className="inline-flex items-center">
                <CheckCircle className="h-4 w-4 text-success mr-1" />
                2 free credits
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <CheckCircle className="h-4 w-4 text-success mr-1" />
                No credit card required
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <CheckCircle className="h-4 w-4 text-success mr-1" />
                No schema-induced headaches
              </span>
            </motion.p>
          </motion.div>

          {/* Social Proof / Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-foreground">10,000+</div>
              <div>Schemas Generated</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-foreground">99.9%</div>
              <div>Accuracy Rate</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-foreground">&lt; 30s</div>
              <div>Average Generation Time</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-7xl relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Schema Markup Superpowers
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional JSON-LD schema markup that makes Google, AI search engines, and answer engines go "wow, this site gets it." 🎯
            </p>
          </motion.div>

          {/* Bento Grid - Optimized layout for 7 features + testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* First row: Featured card (2x2) + 2 regular cards */}
            <BentoCard
              icon={bentoFeatures[0].icon}
              title={bentoFeatures[0].title}
              description={bentoFeatures[0].description}
              index={0}
              featured={true}
              className="md:col-span-3 md:row-span-2"
            />
            <BentoCard
              icon={bentoFeatures[1].icon}
              title={bentoFeatures[1].title}
              description={bentoFeatures[1].description}
              index={1}
              className="md:col-span-3"
            />
            <BentoCard
              icon={bentoFeatures[2].icon}
              title={bentoFeatures[2].title}
              description={bentoFeatures[2].description}
              index={2}
              className="md:col-span-3"
            />

            {/* Second row: 3 cards */}
            <BentoCard
              icon={bentoFeatures[3].icon}
              title={bentoFeatures[3].title}
              description={bentoFeatures[3].description}
              index={3}
              className="md:col-span-2"
            />
            <BentoCard
              icon={bentoFeatures[4].icon}
              title={bentoFeatures[4].title}
              description={bentoFeatures[4].description}
              index={4}
              className="md:col-span-2"
            />
            <BentoCard
              icon={bentoFeatures[5].icon}
              title={bentoFeatures[5].title}
              description={bentoFeatures[5].description}
              index={5}
              className="md:col-span-2"
            />

            {/* Third row: 1 card + Testimonials */}
            <BentoCard
              icon={bentoFeatures[6].icon}
              title={bentoFeatures[6].title}
              description={bentoFeatures[6].description}
              index={6}
              className="md:col-span-2"
            />

            {/* Testimonial Scroller - Spans 4 columns */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="md:col-span-4"
            >
              <TestimonialScroller />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Use Our AEO Schema Generator?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/30 p-8 rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-4">So Simple, It's Super</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Drop Your URL</p>
                    <p className="text-sm text-muted-foreground">Like a mic drop, but less dramatic</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Watch the Magic</p>
                    <p className="text-sm text-muted-foreground">AI does the heavy lifting (and the thinking)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Copy & Conquer</p>
                    <p className="text-sm text-muted-foreground">Grab your JSON-LD and become an SEO hero</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring System Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="/aeo-schema-generator-schema-quality-score.jpg"
                alt="Schema Quality Score Interface showing real-time scoring metrics"
                className="w-full h-auto rounded-[25px] shadow-2xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Know Your Schema Score
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Not all schema markup is created equal. Our intelligent scoring system grades your generated schema on completeness, accuracy, and AEO optimization potential.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Real-time Quality Scoring</p>
                    <p className="text-sm text-muted-foreground">See exactly how well your schema performs before you implement it</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Completeness Metrics</p>
                    <p className="text-sm text-muted-foreground">Understand what's missing and what could be improved</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">AEO Optimization Insights</p>
                    <p className="text-sm text-muted-foreground">Get specific recommendations for better AI search visibility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Refinement Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                One-Click AI Optimization
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Good schema is just the starting point. Our one-click AI refinement automatically optimizes your markup based on SEO and AEO best practices while boosting your schema score. No prompts needed: just click and watch your schema level up.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">One-Click Perfection</p>
                    <p className="text-sm text-muted-foreground">AI automatically applies best practices: no manual tweaking required</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Instant Score Boost</p>
                    <p className="text-sm text-muted-foreground">Watch your schema quality grade improve in real-time</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Best Practice Optimization</p>
                    <p className="text-sm text-muted-foreground">AI applies the latest SEO and AEO standards automatically</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="/aeo-schema-refinements.jpg"
                alt="AI Schema Refinement Interface showing one-click optimization"
                className="w-full h-auto rounded-[25px] shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Questions? We've Got Answers.
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you wanted to know about schema markup (but were too busy to ask)
            </p>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Be Super?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of smart folks using our AEO schema generator to skyrocket their AI search visibility and SEO rankings. No cape required. 🦸
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center px-8 py-3 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors text-lg font-medium"
          >
            Activate Superpowers
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2025 Lightbulb Moment Labs. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <Link to="/docs" className="hover:text-foreground transition-colors">
              Help
            </Link>
            {' • '}
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            {' • '}
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}