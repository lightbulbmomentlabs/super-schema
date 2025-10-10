import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Trash2, Copy, Download, CheckCircle, ArrowRight, Sparkles, Zap, Clock, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import FAQItem from '@/components/FAQItem'
import toast from 'react-hot-toast'

interface FAQ {
  id: string
  question: string
  answer: string
}

export default function FAQSchemaGeneratorPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([
    { id: '1', question: '', answer: '' },
    { id: '2', question: '', answer: '' }
  ])
  const [generatedSchema, setGeneratedSchema] = useState<string>('')
  const [showOutput, setShowOutput] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate unique ID for new FAQs
  const generateId = () => Date.now().toString()

  // Add new FAQ
  const addFAQ = () => {
    setFaqs([...faqs, { id: generateId(), question: '', answer: '' }])
  }

  // Remove FAQ
  const removeFAQ = (id: string) => {
    if (faqs.length > 2) {
      setFaqs(faqs.filter(faq => faq.id !== id))
    }
  }

  // Update FAQ
  const updateFAQ = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(faq =>
      faq.id === id ? { ...faq, [field]: value } : faq
    ))
  }

  // Generate JSON-LD schema
  const generateSchema = () => {
    // Validate all FAQs have content
    const hasEmptyFields = faqs.some(faq => !faq.question.trim() || !faq.answer.trim())

    if (hasEmptyFields) {
      toast.error('Please fill in all questions and answers')
      return
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question.trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer.trim()
        }
      }))
    }

    const schemaString = JSON.stringify(schema, null, 2)
    const schemaWithScriptTags = `<script type="application/ld+json">\n${schemaString}\n</script>`
    setGeneratedSchema(schemaWithScriptTags)
    setShowOutput(true)

    // Scroll to output
    setTimeout(() => {
      document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    toast.success('FAQ Schema generated successfully!')
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedSchema)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  // Download as JSON file
  const downloadJSON = () => {
    const blob = new Blob([generatedSchema], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faq-schema.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded FAQ schema!')
  }

  // Educational FAQ content
  const educationalFAQs = [
    {
      question: "What is FAQ Schema?",
      answer: "FAQ Schema is a type of structured data markup (JSON-LD) that helps search engines understand the questions and answers on your page. When implemented correctly, it can display your FAQs directly in Google search results as rich snippets, increasing visibility and click-through rates by up to 30%."
    },
    {
      question: "Why do I need FAQ Schema on my website?",
      answer: "FAQ Schema helps search engines like Google, Bing, and AI-powered answer engines (ChatGPT, Perplexity) better understand your content. This leads to enhanced search visibility, rich snippets in search results, improved click-through rates, and better Answer Engine Optimization (AEO) for AI search. Without it, you're missing out on valuable SERP real estate."
    },
    {
      question: "How do I implement FAQ Schema on my website?",
      answer: "After generating your FAQ schema with this tool, copy the JSON-LD code and paste it into your website's HTML within a <script type=\"application/ld+json\"> tag, typically in the <head> section or just before the closing </body> tag. Most modern CMS platforms like WordPress, Shopify, and HubSpot allow you to add custom scripts easily."
    },
    {
      question: "What's the difference between this free tool and SuperSchema?",
      answer: "This free tool is perfect for manually creating FAQ schema when you know exactly what questions and answers you want to include. SuperSchema, our premium product, automatically analyzes your entire website, intelligently detects the right schema types, generates multiple schema types per page, validates in real-time, integrates with HubSpot, and manages your entire schema library. SuperSchema saves hours of manual work and ensures your entire site is optimized."
    },
    {
      question: "Is the generated FAQ schema valid and Google-compliant?",
      answer: "Yes! This tool generates valid JSON-LD schema that follows schema.org standards and Google's structured data guidelines. However, we recommend testing your implementation using Google's Rich Results Test tool after adding it to your website to ensure proper implementation."
    },
    {
      question: "How many FAQ items should I include?",
      answer: "Google recommends including at least 2 FAQ items for valid schema. For best results, include 3-10 genuinely useful questions that your users frequently ask. Focus on quality over quantity—each question should provide real value and be clearly visible on your page."
    },
    {
      question: "Can I use FAQ Schema on every page?",
      answer: "You should only use FAQ Schema on pages that genuinely contain frequently asked questions visible to users. Don't add FAQ schema to product pages, blog posts, or other pages just to gain SERP space—Google's systems can detect this and may penalize your site. Use it authentically on dedicated FAQ pages or pages with legitimate FAQ sections."
    },
    {
      question: "Will FAQ Schema help my website rank better in 2025?",
      answer: "While FAQ Schema itself isn't a direct ranking factor, it significantly improves your visibility in search results through rich snippets, enhances user experience by providing quick answers, and optimizes your content for AI-powered search engines (AEO). These factors collectively contribute to better SEO performance and higher click-through rates in 2025 and beyond."
    }
  ]

  // Generate page FAQ schema
  const pageFAQSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": educationalFAQs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Free FAQ Schema Generator | Create JSON-LD FAQ Markup Instantly</title>
        <meta
          name="description"
          content="Generate valid FAQ schema markup in seconds with our free FAQ Schema Generator. Create SEO-optimized JSON-LD structured data for better Google rich snippets and answer engine optimization (AEO)."
        />
        <meta name="keywords" content="FAQ schema generator, FAQ schema markup, JSON-LD generator, FAQ structured data, schema markup tool, free FAQ schema, SEO schema generator" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://superschema.io/faq-schema-generator" />

        {/* Open Graph / Social Media Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free FAQ Schema Generator - Create JSON-LD FAQ Markup" />
        <meta property="og:description" content="Generate valid FAQ schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data." />
        <meta property="og:url" content="https://superschema.io/faq-schema-generator" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free FAQ Schema Generator - Create JSON-LD FAQ Markup" />
        <meta name="twitter:description" content="Generate valid FAQ schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data." />

        {/* Structured Data - FAQ Schema for this page */}
        <script type="application/ld+json">
          {JSON.stringify(pageFAQSchema)}
        </script>

        {/* Structured Data - WebPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Free FAQ Schema Generator",
            "description": "Generate valid FAQ schema markup for your website with our free, easy-to-use FAQ Schema Generator tool.",
            "url": "https://superschema.io/faq-schema-generator",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://superschema.io"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "FAQ Schema Generator",
                  "item": "https://superschema.io/faq-schema-generator"
                }
              ]
            }
          })}
        </script>

        {/* Structured Data - SoftwareApplication Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "FAQ Schema Generator",
            "applicationCategory": "DeveloperApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Free tool to generate valid FAQ schema markup in JSON-LD format for SEO and answer engine optimization."
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <SuperSchemaLogo className="h-8 w-8" />
              <span className="font-bold text-xl">SuperSchema</span>
            </Link>
            <Link
              to="/sign-up"
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Try SuperSchema
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Free FAQ Schema Generator
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto">
                Create valid JSON-LD FAQ schema markup in seconds. Boost your SEO with rich snippets and improve your Answer Engine Optimization (AEO).
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

        {/* FAQ Builder Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Build Your FAQ Schema</h2>
              <p className="text-muted-foreground mb-8">
                Add your frequently asked questions and answers below. You need at least 2 FAQ items to generate valid schema markup.
              </p>

              {/* FAQ Form */}
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-muted/30 border border-border rounded-lg p-6 relative"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg">FAQ #{index + 1}</h3>
                      {faqs.length > 2 && (
                        <button
                          onClick={() => removeFAQ(faq.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                          aria-label="Remove FAQ"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`question-${faq.id}`} className="block text-sm font-medium mb-2">
                          Question
                        </label>
                        <input
                          id={`question-${faq.id}`}
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                          placeholder="e.g., What is FAQ schema markup?"
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {faq.question.length} characters
                        </p>
                      </div>

                      <div>
                        <label htmlFor={`answer-${faq.id}`} className="block text-sm font-medium mb-2">
                          Answer
                        </label>
                        <textarea
                          id={`answer-${faq.id}`}
                          value={faq.answer}
                          onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                          placeholder="Provide a clear, comprehensive answer to the question..."
                          rows={4}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {faq.answer.length} characters • Aim for 40-300 characters for best results
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={addFAQ}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all font-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Another FAQ
                </button>
                <button
                  onClick={generateSchema}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate FAQ Schema
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Output Section */}
        <AnimatePresence>
          {showOutput && (
            <motion.section
              id="output-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="py-12 px-4 bg-muted/30"
            >
              <div className="container mx-auto max-w-4xl">
                <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Your FAQ Schema Markup</h2>
                  <p className="text-muted-foreground mb-6">
                    Copy the complete code below (including the <code className="text-sm bg-muted px-2 py-1 rounded">&lt;script&gt;</code> tags) and paste it into your website's HTML <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section.
                  </p>

                  {/* Schema Output */}
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed">
                      <code>{generatedSchema}</code>
                    </pre>

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-5 w-5 mr-2" />
                            Copy to Clipboard
                          </>
                        )}
                      </button>
                      <button
                        onClick={downloadJSON}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all font-medium"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download JSON
                      </button>
                    </div>
                  </div>

                  {/* Implementation Tips */}
                  <div className="mt-8 bg-info/10 border border-info/20 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-info" />
                      Next Steps
                    </h3>
                    <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                      <li>Copy the complete code above (including script tags)</li>
                      <li>Paste it into your website's <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section</li>
                      <li>Test your implementation with <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Rich Results Test</a></li>
                      <li>Ensure your FAQs are visible on the page (schema must match visible content)</li>
                    </ol>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Comparison Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Great Tool. But There's a Better Way.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                This free tool works great for one page. But what about your entire website?
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Tool */}
              <div className="bg-card border border-border rounded-xl p-8">
                <h3 className="text-xl font-bold mb-4">Free Manual Tool</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Manual question/answer entry</span>
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
                    <span className="text-muted-foreground">Limited to FAQ schema only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">No content analysis</span>
                  </li>
                </ul>
                <div className="text-center">
                  <p className="text-2xl font-bold">Free</p>
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
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">RECOMMENDED</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Zap className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>AI-powered automatic schema generation</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Analyzes your entire website automatically</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>One-click HubSpot integration</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multiple schema types (Article, Product, LocalBusiness, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Real-time validation & quality scoring</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Manage your entire schema library</span>
                    </li>
                  </ul>

                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold">From $0.50/page</p>
                    <p className="text-sm opacity-90">Save hours on every website</p>
                  </div>

                  <Link
                    to="/sign-up"
                    className="block w-full text-center px-6 py-3 bg-white text-primary rounded-lg hover:bg-white/90 transition-all font-semibold shadow-lg"
                  >
                    Try SuperSchema Free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Educational FAQ Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions About FAQ Schema
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about creating and implementing FAQ schema markup
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
              Ready to Automate Your Schema?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Stop doing schema markup manually. Let SuperSchema's AI analyze your website and generate perfect structured data for every page in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-background text-foreground rounded-lg hover:bg-background/90 transition-all text-lg font-semibold shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-primary-foreground text-primary-foreground rounded-lg hover:bg-white/10 transition-all text-lg font-semibold"
              >
                Learn More
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
                  href="https://developers.google.com/search/docs/appearance/structured-data/faqpage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  FAQ Schema Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
