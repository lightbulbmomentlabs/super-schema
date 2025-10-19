import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  MessageCircleQuestion,
  FileText,
  BookOpen,
  ListChecks,
  ShoppingBag,
  Store,
  Building2,
  Calendar,
  Star,
  Navigation,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  Target,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import SchemaGeneratorNav from '@/components/SchemaGeneratorNav'
import FAQItem from '@/components/FAQItem'

interface SchemaGenerator {
  name: string
  path: string
  icon: typeof MessageCircleQuestion
  description: string
}

export default function FreeSchemaGeneratorPage() {
  // Schema generators list with icons and descriptions
  const schemaGenerators: SchemaGenerator[] = [
    {
      name: 'FAQ Schema',
      path: '/faq-schema-generator',
      icon: MessageCircleQuestion,
      description: 'Generate FAQ schema markup for frequently asked questions pages'
    },
    {
      name: 'Article Schema',
      path: '/article-schema-generator',
      icon: FileText,
      description: 'Create Article schema for blog posts and news articles'
    },
    {
      name: 'BlogPosting Schema',
      path: '/blogposting-schema-generator',
      icon: BookOpen,
      description: 'Build BlogPosting schema for blog content and posts'
    },
    {
      name: 'HowTo Schema',
      path: '/howto-schema-generator',
      icon: ListChecks,
      description: 'Generate HowTo schema for step-by-step instructional content'
    },
    {
      name: 'Product Schema',
      path: '/product-schema-generator',
      icon: ShoppingBag,
      description: 'Create Product schema for ecommerce and product pages'
    },
    {
      name: 'LocalBusiness Schema',
      path: '/localbusiness-schema-generator',
      icon: Store,
      description: 'Build LocalBusiness schema for local shops and service providers'
    },
    {
      name: 'Organization Schema',
      path: '/organization-schema-generator',
      icon: Building2,
      description: 'Generate Organization schema for company and business profiles'
    },
    {
      name: 'Event Schema',
      path: '/event-schema-generator',
      icon: Calendar,
      description: 'Create Event schema for conferences, webinars, and events'
    },
    {
      name: 'Review Schema',
      path: '/review-schema-generator',
      icon: Star,
      description: 'Build Review schema for product and business reviews'
    },
    {
      name: 'Breadcrumb Schema',
      path: '/breadcrumb-schema-generator',
      icon: Navigation,
      description: 'Generate Breadcrumb schema for website navigation and hierarchy'
    }
  ]

  // Educational FAQ content
  const educationalFAQs = [
    {
      question: 'What are free schema markup generators?',
      answer: 'Free schema markup generators are tools that help you create structured data (JSON-LD) for your website without needing to write code manually. They provide an interface where you input your content details, and they automatically generate valid schema markup that search engines can understand. These tools are perfect for creating schema for individual pages when you know exactly what content you want to mark up.'
    },
    {
      question: 'Why should I use schema markup on my website?',
      answer: 'Schema markup helps search engines like Google, Bing, and AI-powered answer engines (ChatGPT, Perplexity, Google AI Overviews) better understand your content. This leads to rich snippets in search results, improved click-through rates (up to 30% higher), better visibility in AI search results, enhanced Answer Engine Optimization (AEO), and ultimately more qualified traffic to your site. Without schema markup, you\'re leaving visibility and traffic on the table.'
    },
    {
      question: 'Which schema type should I use for my page?',
      answer: 'Choose the schema type that best matches your content: FAQ for Q&A pages, Article/BlogPosting for blog content, HowTo for tutorials, Product for ecommerce, LocalBusiness for physical locations, Organization for company info, Event for upcoming events, Review for testimonials, and Breadcrumb for navigation. Many pages benefit from multiple schema types—for example, a blog post might use both Article and Breadcrumb schema.'
    },
    {
      question: 'Are these free schema generators SEO-compliant?',
      answer: 'Yes! All our free schema generators create valid JSON-LD markup that follows Schema.org standards and Google\'s structured data guidelines. The generated code is production-ready and passes Google\'s Rich Results Test. However, always test your implementation after adding it to your website to ensure it works correctly in your specific environment.'
    },
    {
      question: 'How do I implement generated schema on my website?',
      answer: 'After generating your schema markup, copy the complete code (including the <script> tags) and paste it into your page\'s HTML <head> section. Most modern CMS platforms like WordPress, HubSpot, Shopify, and Webflow allow you to add custom scripts easily. After implementation, test it using Google\'s Rich Results Test to verify it\'s working correctly.'
    },
    {
      question: 'What\'s the difference between free manual tools and SuperSchema?',
      answer: 'Free manual tools are perfect for creating schema one page at a time when you know exactly what you want. SuperSchema is our premium AI-powered platform that automatically analyzes your entire website, intelligently detects the right schema types for each page, generates all relevant schema types automatically, validates in real-time, integrates with HubSpot, and manages your complete schema library. If you have more than a few pages to optimize, SuperSchema saves you hours of manual work and ensures consistency across your entire site.'
    }
  ]

  // Generate page FAQ schema
  const pageFAQSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: educationalFAQs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Free Schema Markup Generators | 10 JSON-LD Tools for SEO & AEO</title>
        <meta
          name="description"
          content="Free schema markup generators for FAQ, Article, Product, LocalBusiness, and more. Create SEO-optimized JSON-LD structured data in seconds. No signup required."
        />
        <meta
          name="keywords"
          content="free schema generator, schema markup tool, JSON-LD generator, FAQ schema, Article schema, Product schema, LocalBusiness schema, free SEO tools, schema markup generator"
        />

        {/* Canonical URL */}
        <link rel="canonical" href="https://superschema.io/free-schema-generator" />

        {/* Open Graph / Social Media Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free Schema Markup Generators - 10 SEO Tools" />
        <meta property="og:description" content="Free tools to generate FAQ, Article, Product, and other schema markup types. Create valid JSON-LD structured data in seconds." />
        <meta property="og:url" content="https://superschema.io/free-schema-generator" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Schema Markup Generators - 10 SEO Tools" />
        <meta name="twitter:description" content="Free tools to generate FAQ, Article, Product, and other schema markup types. Create valid JSON-LD structured data in seconds." />

        {/* Structured Data - FAQ Schema for this page */}
        <script type="application/ld+json">
          {JSON.stringify(pageFAQSchema)}
        </script>

        {/* Structured Data - WebPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Free Schema Markup Generators',
            description: '10 free schema markup generators for creating SEO-optimized JSON-LD structured data',
            url: 'https://superschema.io/free-schema-generator',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://superschema.io'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Free Schema Generators',
                  item: 'https://superschema.io/free-schema-generator'
                }
              ]
            }
          })}
        </script>

        {/* Structured Data - CollectionPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Free Schema Markup Generators',
            description: 'Collection of 10 free schema markup generators for different content types',
            numberOfItems: schemaGenerators.length,
            about: {
              '@type': 'Thing',
              name: 'Schema Markup'
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <SchemaGeneratorNav />

        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Free Schema Markup Generators
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Create valid JSON-LD structured data for your website. 10 professional schema generators—completely free, no signup required.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-1" />
                  100% Free
                </span>
                <span className="inline-flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-1" />
                  No Signup Required
                </span>
                <span className="inline-flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-1" />
                  Google Compliant
                </span>
                <span className="inline-flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-1" />
                  Instant Generation
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Schema Generators Grid */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemaGenerators.map((generator, index) => {
                const Icon = generator.icon
                return (
                  <motion.div
                    key={generator.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      to={generator.path}
                      className="block h-full bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                            {generator.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {generator.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Why Schema Markup Section (Educational/SEO) */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Use Schema Markup?
              </h2>
              <p className="text-xl text-muted-foreground">
                Structured data helps search engines understand your content and display it in rich, engaging ways
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Rich Snippets</h3>
                <p className="text-sm text-muted-foreground">
                  Stand out in search results with enhanced listings featuring ratings, images, and key information
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Answer Engine Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Get cited by AI engines like ChatGPT, Perplexity, and Google AI Overviews
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Better SEO</h3>
                <p className="text-sm text-muted-foreground">
                  Help search engines understand your content context, leading to better rankings and visibility
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mid-Page Conversion Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Love the Free Tools? There's an Even Better Way.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                These manual tools are great for one-off pages. But what if you could save hours and automate your entire site?
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Tool */}
              <div className="bg-card border border-border rounded-xl p-8">
                <h3 className="text-xl font-bold mb-4">Free Manual Tools</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Manual data entry for each page</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">One page at a time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Copy/paste for each page</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Single schema type per tool</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">No library management</span>
                  </li>
                </ul>
                <div className="text-center">
                  <p className="text-2xl font-bold">Free Forever</p>
                  <p className="text-sm text-muted-foreground">Perfect for single pages</p>
                </div>
              </div>

              {/* SuperSchema */}
              <div className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground rounded-xl p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">SuperSchema</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">SAVE HOURS</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Zap className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>AI automatically extracts data from your URLs</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Analyzes and optimizes your entire website</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>One-click HubSpot integration</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multiple schema types per page automatically</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Real-time validation & quality scoring</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Centralized schema library & management</span>
                    </li>
                  </ul>

                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold">From $0.50/URL</p>
                    <p className="text-sm opacity-90">Go from hours to seconds</p>
                  </div>

                  <Link
                    to="/sign-up"
                    className="block w-full text-center px-6 py-3 bg-white text-primary rounded-lg hover:bg-white/90 transition-all font-semibold shadow-lg"
                  >
                    Try SuperSchema Free
                  </Link>
                  <p className="text-center text-xs mt-3 opacity-75">
                    2 free credits • No credit card required
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about free schema markup generators
              </p>
            </div>

            <div className="space-y-4">
              {educationalFAQs.map((faq, index) => (
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
        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Supercharge Your Schema Workflow?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Stop doing schema markup page by page. Let SuperSchema's AI analyze your entire website and generate perfect structured data in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-background text-foreground rounded-lg hover:bg-background/90 transition-all text-lg font-semibold shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-primary-foreground text-primary-foreground rounded-lg hover:bg-white/10 transition-all text-lg font-semibold"
              >
                Learn More About SuperSchema
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-75">
              2 free credits • No credit card required • Setup in under 2 minutes
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © 2025 Lightbulb Moment Labs. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link to="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link to="/docs" className="hover:text-foreground transition-colors">
                  Help
                </Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <a
                  href="https://schema.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Schema.org Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
