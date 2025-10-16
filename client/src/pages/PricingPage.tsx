import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowRight, CheckCircle, Zap, Infinity, Sparkles, Star, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import ResourcesDropdown from '@/components/ResourcesDropdown'
import FAQItem from '@/components/FAQItem'
import SuperSchemaIcon from '@/components/icons/SuperSchemaIcon'
import { cn } from '@/utils/cn'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

interface CreditPack {
  name: string
  credits: number
  price: number
  savings: number
  isPopular: boolean
}

const creditPacks: CreditPack[] = [
  { name: 'Starter', credits: 20, price: 19.99, savings: 0, isPopular: false },
  { name: 'Builder', credits: 50, price: 44.99, savings: 10, isPopular: false },
  { name: 'Pro', credits: 100, price: 84.99, savings: 15, isPopular: true },
  { name: 'Power', credits: 250, price: 174.99, savings: 30, isPopular: false },
  { name: 'Agency', credits: 500, price: 299.99, savings: 40, isPopular: false },
  { name: 'SUPER', credits: 1000, price: 499.99, savings: 50, isPopular: false }
]

export default function PricingPage() {
  const { isSignedIn } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useState(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  })

  const faqs = [
    {
      question: 'How much does it cost?',
      answer: 'We use a simple credit system: 1 credit per URL generates all relevant schema types for that page (Article, BlogPosting, FAQPage, HowTo, etc.). You can add more schema types to the same URL for free, and each schema type includes 2 AI-powered refinements to perfect your markup. You get 2 free credits when you sign up (no credit card required). After that, credits are super affordable—way cheaper than paying a developer to write schema manually or dealing with broken markup that tanks your SEO.'
    },
    {
      question: 'Do credits expire?',
      answer: 'Nope! Never. Your credits stick around forever, ready whenever you need them. Buy them today, use them next year—we don\'t care. No expiration dates, no pressure, no stress. Just pure, eternal schema-generating power.'
    },
    {
      question: 'Can I upgrade or buy more credits anytime?',
      answer: 'Absolutely! You can purchase additional credit packs whenever you need them. Running low? Just grab another pack. No subscriptions, no commitments—just pay as you go. Plus, the more credits you buy at once, the better the per-credit price gets.'
    },
    {
      question: 'What do I get with each credit?',
      answer: 'Each credit lets you generate schema markup for one URL. But here\'s the kicker: we don\'t just generate one schema type. We automatically detect and generate ALL relevant schema types for that page (Article, Product, FAQ, HowTo, BreadcrumbList, etc.). Plus, you get 2 AI-powered refinements per schema type to optimize and perfect your markup. All of that for 1 credit.'
    },
    {
      question: 'What if I need more than 2 refinements?',
      answer: 'The first 2 AI refinements per schema type are included with your credit. If you need additional refinements beyond that, you can always manually edit the schema using our editor, or contact us about bulk refinement options for enterprise needs.'
    },
    {
      question: 'Is there a subscription option?',
      answer: 'Not yet! Right now we keep it simple with pay-as-you-go credits. No recurring charges, no surprise bills. You buy credits when you need them, and they never expire. We might add subscription plans in the future if there\'s enough demand, but for now, credits give you maximum flexibility.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor, Stripe. Your payment info is encrypted and we never store your card details on our servers.'
    },
    {
      question: 'Can I get a refund?',
      answer: 'Since credits are digital goods that are immediately available after purchase, we generally don\'t offer refunds. However, if you experience technical issues or aren\'t satisfied with the service, reach out to us and we\'ll work something out. We\'re humans, not robots.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className={cn(
          'sticky top-0 z-50 border-b transition-all duration-300',
          isScrolled
            ? 'border-border/50 bg-background/80 backdrop-blur-xl shadow-lg'
            : 'border-border bg-background'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <SuperSchemaLogo className="h-8 w-8" />
            <span className="font-bold text-xl">SuperSchema</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/pricing"
              className="text-sm font-medium text-foreground border-b-2 border-primary"
            >
              Pricing
            </Link>
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

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border bg-background"
            >
              <div className="container mx-auto px-4 py-4 space-y-4">
                <div className="flex flex-col space-y-3">
                  <Link
                    to="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-primary py-2"
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/aeo"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    AEO Guide
                  </Link>
                  <Link
                    to="/geo"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    GEO Guide
                  </Link>
                  <Link
                    to="/ai-search-optimization"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    AI Search Optimization
                  </Link>
                  <Link
                    to="/schema-markup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Schema Markup Guide
                  </Link>
                  <Link
                    to="/schema-markup-grader"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Schema Markup Grader
                  </Link>

                  <div className="pt-3 border-t border-border space-y-3">
                    {isSignedIn ? (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center w-full px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                      >
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/sign-in"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="inline-flex items-center justify-center w-full px-4 py-3 rounded-md border border-border hover:bg-accent transition-colors font-medium"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/sign-up"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="inline-flex items-center justify-center w-full px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                        >
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="block mb-2">Supercharge Your</span>
              <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Schema Game
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
              Simple, transparent pricing that scales with you.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Because you shouldn't need a PhD to price structured data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How Credits Work Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Credits Work</h2>
            <p className="text-xl text-muted-foreground">
              It's simple. Really simple.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1 Credit = 1 URL</h3>
              <p className="text-sm text-muted-foreground">
                Generate all relevant schema types for any URL with a single credit
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Schema Types</h3>
              <p className="text-sm text-muted-foreground">
                Article, Product, FAQ, HowTo, and more—all automatically detected and generated
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2 Free Refinements</h3>
              <p className="text-sm text-muted-foreground">
                Each schema includes 2 AI-powered refinements to perfect your markup
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Infinity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Credits Never Expire</h3>
              <p className="text-sm text-muted-foreground">
                Buy now, use later. Your credits stick around forever
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-lg text-center"
          >
            <p className="text-lg font-medium text-primary mb-2">
              Get Started with 2 Free Credits
            </p>
            <p className="text-sm text-muted-foreground">
              No credit card required. Test drive SuperSchema risk-free.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your Credit Pack
            </h2>
            <p className="text-xl text-muted-foreground">
              The more you buy, the more you save. No subscriptions, no surprises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditPacks.map((pack, index) => (
              <motion.div
                key={pack.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative border rounded-xl p-8 transition-all hover:shadow-xl',
                  pack.isPopular
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-105'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                {pack.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary to-purple-500 text-primary-foreground px-4 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{pack.name}</h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span className="text-4xl font-bold">${pack.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${(pack.price / pack.credits).toFixed(2)} per credit
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <SuperSchemaIcon className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{pack.credits} Credits</p>
                      <p className="text-xs text-muted-foreground">Generate schemas for {pack.credits} web pages</p>
                    </div>
                  </div>

                  {pack.savings > 0 ? (
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          Save {pack.savings}%
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-primary">
                          Perfect for testing the waters
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">All schema types included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">2 AI refinements per schema</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Credits never expire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Real-time validation</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/sign-up"
                  className={cn(
                    'block w-full text-center px-4 py-3 rounded-lg font-medium transition-colors',
                    pack.isPopular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                  )}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by SEO Pros
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands using SuperSchema to level up their structured data
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Schemas Generated</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Accuracy Rate</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-primary mb-2">&lt; 30s</div>
              <div className="text-muted-foreground">Average Generation Time</div>
            </motion.div>
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
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pricing Questions?
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about credits and pricing
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

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Generate Super Schemas?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Start with 2 free credits. No cape required.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center px-8 py-3 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors text-lg font-medium"
          >
            Activate Superpowers
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-sm text-primary-foreground/60 mt-4">
            No credit card required • 2 free credits • Credits never expire
          </p>
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
