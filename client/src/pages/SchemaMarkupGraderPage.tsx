import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  Code,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import PillarPageNav from '@/components/PillarPageNav'
import SchemaScore from '@/components/SchemaScore'
import FAQItem from '@/components/FAQItem'
import Footer from '@/components/Footer'
import { calculateSchemaScore } from '@/utils/calculateSchemaScore'
import type { SchemaScore as SchemaScoreType } from '@shared/types'

type InputMethod = 'code' | 'url'

export default function SchemaMarkupGraderPage() {
  const { isSignedIn } = useUser()
  const [inputMethod, setInputMethod] = useState<InputMethod>('code')
  const [schemaCode, setSchemaCode] = useState('')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [schemaScore, setSchemaScore] = useState<SchemaScoreType | null>(null)
  const [gradedSchema, setGradedSchema] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Grade schema from pasted code
  const gradeSchemaCode = () => {
    setError(null)
    setSchemaScore(null)
    setGradedSchema(null)

    if (!schemaCode.trim()) {
      toast.error('Please paste your schema code')
      return
    }

    try {
      // Try to parse the JSON
      const parsed = JSON.parse(schemaCode)

      // Handle both single schema and array of schemas
      const schemas = Array.isArray(parsed) ? parsed : [parsed]

      // Validate it's a schema (has @context and @type)
      if (!parsed['@context'] && !parsed['@type']) {
        throw new Error('Invalid schema: missing @context or @type')
      }

      // Calculate score
      const score = calculateSchemaScore(schemas)
      setSchemaScore(score)
      setGradedSchema(parsed)

      toast.success('Schema graded successfully!')

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format')
      toast.error('Invalid schema code. Please check your JSON.')
    }
  }

  // Grade schema from URL
  const gradeSchemaFromUrl = async () => {
    setError(null)
    setSchemaScore(null)
    setGradedSchema(null)
    setIsLoading(true)

    if (!url.trim()) {
      toast.error('Please enter a URL')
      setIsLoading(false)
      return
    }

    try {
      // Validate URL format
      new URL(url)

      // Extract schema from URL
      const response = await fetch('/api/schema/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (!data.success || !data.data.schemas || data.data.schemas.length === 0) {
        setError('No schema markup found on this page')
        toast.error('No schema markup found on this page')
        setIsLoading(false)
        return
      }

      // Select the most complete schema for grading (based on number of properties)
      const schemas = data.data.schemas

      // Find the schema with the most properties (most complete)
      const mostCompleteSchema = schemas.reduce((best: any, current: any) => {
        const bestKeys = Object.keys(best || {}).length
        const currentKeys = Object.keys(current).length
        return currentKeys > bestKeys ? current : best
      }, schemas[0])

      // Grade the most complete schema
      const score = calculateSchemaScore([mostCompleteSchema])
      setSchemaScore(score)
      setGradedSchema(mostCompleteSchema)

      if (schemas.length > 1) {
        toast.success(`Found ${schemas.length} schemas - grading the most complete one!`)
      } else {
        toast.success('Schema graded successfully!')
      }

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('URL')) {
        setError('Invalid URL format')
        toast.error('Invalid URL format')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to extract schema from URL')
        toast.error('Failed to extract schema from URL')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Copy schema code
  const copySchema = async () => {
    if (!gradedSchema) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(gradedSchema, null, 2))
      toast.success('Copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  // Download schema
  const downloadSchema = () => {
    if (!gradedSchema) return

    const blob = new Blob([JSON.stringify(gradedSchema, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graded-schema.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded schema!')
  }

  const faqs = [
    {
      question: "What is a schema quality score?",
      answer: "Your schema quality score (0-100) measures how complete and well-optimized your structured data is. It evaluates required properties, recommended properties, advanced AEO features, and overall content quality. Higher scores mean better SEO and AI search visibility."
    },
    {
      question: "How is my schema graded?",
      answer: "We analyze your schema based on: Required Properties (35% weight) - essential @context, @type, and core fields; Recommended Properties (25%) - SEO-important fields like description, author, dates; Advanced AEO Features (25%) - AI optimization like keywords, speakable, mainEntityOfPage; and Content Quality (15%) - proper formatting and structure."
    },
    {
      question: "What's a good schema quality score?",
      answer: "90-100 (A/A+): Excellent - comprehensive AEO optimization. 75-89 (B): Good - strong SEO foundation with minor improvements needed. 60-74 (C): Fair - basic schema with significant room for improvement. Below 60 (D/F): Needs major work - missing critical properties that hurt SEO."
    },
    {
      question: "Can I grade schema from any website?",
      answer: "Yes! Just paste any URL and our grader will automatically extract and analyze the schema markup on that page. This is perfect for competitive analysis, checking client websites, or auditing your own pages before deploying changes."
    },
    {
      question: "What if my URL has no schema?",
      answer: "If we can't find schema on your URL, that means your page is missing valuable SEO and AI optimization! You can either add schema manually using our free generators, or use SuperSchema to automatically generate optimized schema for your entire site in minutes."
    },
    {
      question: "How do I improve my schema score?",
      answer: "Focus on the Priority Action Items shown in your grading results. Start with critical items (missing @context, @type, core properties) first. Then add recommended properties like description, author, dates. Finally, boost your score with advanced AEO features like keywords, speakable, and structured content."
    },
    {
      question: "What's the difference between this grader and SuperSchema?",
      answer: "This free grader analyzes ONE schema at a time and tells you what's wrong. SuperSchema automatically generates perfect, high-scoring schemas for your entire website, validates them in real-time, manages your schema library, integrates with HubSpot for one-click deployment, and includes AI-powered refinement. SuperSchema saves hours of manual work."
    },
    {
      question: "Should I fix my schema or regenerate it with SuperSchema?",
      answer: "If your score is below 75 (B-), it's often faster to regenerate with SuperSchema than fix manually. SuperSchema's AI automatically includes all required and recommended properties, optimizes for AEO, and generates A-grade schemas instantly. Manual fixing is tedious and error-prone—let AI do it perfectly."
    }
  ]

  // Page schema for SEO
  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "Schema Markup Grader",
        "url": "https://superschema.ai/schema-markup-grader",
        "description": "Free tool to validate and grade your schema markup quality. Paste your schema code or URL to get an instant quality score with actionable improvement suggestions.",
        "applicationCategory": "DeveloperApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "Schema quality scoring (0-100)",
          "Dual input: paste code or URL",
          "Actionable improvement suggestions",
          "Priority action items",
          "Export graded schema"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Free Schema Markup Grader | Validate & Score Your Structured Data | SuperSchema</title>
        <meta
          name="description"
          content="Instantly grade your schema markup quality. Paste your schema code or URL to get a detailed score (0-100) with actionable improvement suggestions. No signup required. Improve your SEO and AEO today."
        />
        <meta name="keywords" content="schema markup grader, schema validator, schema quality score, check schema, validate schema, schema SEO, structured data validator" />

        {/* Open Graph */}
        <meta property="og:title" content="Free Schema Markup Grader | SuperSchema" />
        <meta property="og:description" content="Validate and grade your schema markup quality. Get instant scores with actionable suggestions to improve your SEO." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://superschema.ai/schema-markup-grader" />

        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify(pageSchema)}
        </script>
      </Helmet>

      {/* Header with Resources dropdown */}
      <PillarPageNav />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Free Schema Markup Grader
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Instantly validate and grade your schema markup quality. Get actionable suggestions to boost your SEO and AI search visibility.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <CheckCircle className="h-4 w-4 text-success mr-2" />
                No signup required
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <CheckCircle className="h-4 w-4 text-success mr-2" />
                Instant results
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <CheckCircle className="h-4 w-4 text-success mr-2" />
                Detailed improvement tips
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grader Tool Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {/* Input Method Tabs */}
            <div className="flex gap-2 mb-8 border-b border-border">
              <button
                onClick={() => setInputMethod('code')}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all border-b-2 ${
                  inputMethod === 'code'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code className="h-5 w-5" />
                <span>Paste Schema Code</span>
              </button>
              <button
                onClick={() => setInputMethod('url')}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all border-b-2 ${
                  inputMethod === 'url'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="h-5 w-5" />
                <span>Check URL</span>
              </button>
            </div>

            {/* Code Input */}
            {inputMethod === 'code' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium mb-2">
                  Paste Your Schema Markup (JSON-LD)
                </label>
                <textarea
                  value={schemaCode}
                  onChange={(e) => setSchemaCode(e.target.value)}
                  placeholder={`{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your article title",
  ...
}`}
                  className="w-full h-64 px-4 py-3 rounded-lg border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <button
                  onClick={gradeSchemaCode}
                  disabled={!schemaCode.trim()}
                  className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Grade My Schema
                </button>
              </motion.div>
            )}

            {/* URL Input */}
            {inputMethod === 'url' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium mb-2">
                  Enter Website URL
                </label>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll automatically extract and grade any schema markup we find on your page
                </p>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={gradeSchemaFromUrl}
                  disabled={!url.trim() || isLoading}
                  className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Extracting Schema...
                    </>
                  ) : (
                    <>
                      <Globe className="h-5 w-5 mr-2" />
                      Extract & Grade Schema
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-lg bg-destructive border border-destructive text-destructive-foreground flex items-start"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {schemaScore && gradedSchema && (
        <section id="results-section" className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-8 text-center">Your Schema Quality Report</h2>

              {/* Schema Score Component */}
              <SchemaScore
                score={schemaScore}
                url={inputMethod === 'url' ? url : 'Pasted Schema'}
                className="mb-8"
              />

              {/* Schema Code Display */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Graded Schema</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copySchema}
                      className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={downloadSchema}
                      className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto max-h-96 text-sm font-mono border border-border">
                  {JSON.stringify(gradedSchema, null, 2)}
                </pre>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Want Perfect Schema Automatically?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Stop manually grading and fixing schema. SuperSchema automatically generates A-grade markup for your entire site in minutes—not hours.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-6 border border-primary-foreground/20">
              <Sparkles className="h-8 w-8 text-primary-foreground mb-3" />
              <h3 className="font-semibold text-primary-foreground mb-2">AI-Generated Schemas</h3>
              <p className="text-sm text-primary-foreground/80">Automatically create perfect, high-scoring schemas for every page</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-6 border border-primary-foreground/20">
              <Zap className="h-8 w-8 text-primary-foreground mb-3" />
              <h3 className="font-semibold text-primary-foreground mb-2">One-Click Refinement</h3>
              <p className="text-sm text-primary-foreground/80">AI optimizes your schema to boost scores from C to A+ instantly</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-6 border border-primary-foreground/20">
              <CheckCircle className="h-8 w-8 text-primary-foreground mb-3" />
              <h3 className="font-semibold text-primary-foreground mb-2">Real-Time Validation</h3>
              <p className="text-sm text-primary-foreground/80">Every schema validated before deployment—no errors, ever</p>
            </div>
          </div>
          <Link
            to="/sign-up"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-background text-foreground hover:bg-background/90 transition-colors text-lg font-semibold shadow-lg"
          >
            Start Generating Perfect Schemas
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-sm text-primary-foreground/70 mt-4">
            2 free credits • No credit card required
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Common Questions About Schema Grading
          </h2>
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

      <Footer />
    </div>
  )
}
