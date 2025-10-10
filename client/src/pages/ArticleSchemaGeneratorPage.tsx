import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Trash2, Copy, Download, CheckCircle, ArrowRight, Sparkles, Zap, Clock, Target, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import FAQItem from '@/components/FAQItem'
import toast from 'react-hot-toast'

interface ArticleFormData {
  headline: string
  authorName: string
  authorUrl: string
  publisherName: string
  publisherLogoUrl: string
  datePublished: string
  dateModified: string
  imageUrls: string[]
  description: string
  articleUrl: string
}

export default function ArticleSchemaGeneratorPage() {
  const [formData, setFormData] = useState<ArticleFormData>({
    headline: '',
    authorName: '',
    authorUrl: '',
    publisherName: '',
    publisherLogoUrl: '',
    datePublished: '',
    dateModified: '',
    imageUrls: [''],
    description: '',
    articleUrl: ''
  })
  const [generatedSchema, setGeneratedSchema] = useState<string>('')
  const [showOutput, setShowOutput] = useState(false)
  const [copied, setCopied] = useState(false)

  // Update form field
  const updateField = (field: keyof ArticleFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Update image URL at index
  const updateImageUrl = (index: number, value: string) => {
    const newImageUrls = [...formData.imageUrls]
    newImageUrls[index] = value
    setFormData(prev => ({ ...prev, imageUrls: newImageUrls }))
  }

  // Add new image URL field
  const addImageUrl = () => {
    setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }))
  }

  // Remove image URL field
  const removeImageUrl = (index: number) => {
    if (formData.imageUrls.length > 1) {
      const newImageUrls = formData.imageUrls.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, imageUrls: newImageUrls }))
    }
  }

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    if (!url) return true // Empty is okay for optional fields
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    // Required fields
    if (!formData.headline.trim()) {
      toast.error('Headline is required')
      return false
    }
    if (formData.headline.length > 110) {
      toast.error('Headline must be 110 characters or less')
      return false
    }
    if (!formData.authorName.trim()) {
      toast.error('Author name is required')
      return false
    }
    if (!formData.publisherName.trim()) {
      toast.error('Publisher name is required')
      return false
    }
    if (!formData.publisherLogoUrl.trim()) {
      toast.error('Publisher logo URL is required')
      return false
    }
    if (!isValidUrl(formData.publisherLogoUrl)) {
      toast.error('Publisher logo URL is not valid')
      return false
    }
    if (!formData.datePublished) {
      toast.error('Date published is required')
      return false
    }

    // At least one image URL required
    const validImageUrls = formData.imageUrls.filter(url => url.trim())
    if (validImageUrls.length === 0) {
      toast.error('At least one image URL is required')
      return false
    }

    // Validate all URLs
    if (formData.authorUrl && !isValidUrl(formData.authorUrl)) {
      toast.error('Author URL is not valid')
      return false
    }
    if (formData.articleUrl && !isValidUrl(formData.articleUrl)) {
      toast.error('Article URL is not valid')
      return false
    }
    for (const imageUrl of validImageUrls) {
      if (!isValidUrl(imageUrl)) {
        toast.error('One or more image URLs are not valid')
        return false
      }
    }

    // Date validation
    const pubDate = new Date(formData.datePublished)
    if (pubDate > new Date()) {
      toast.error('Date published cannot be in the future')
      return false
    }
    if (formData.dateModified) {
      const modDate = new Date(formData.dateModified)
      if (modDate < pubDate) {
        toast.error('Date modified cannot be before date published')
        return false
      }
    }

    return true
  }

  // Generate schema
  const generateSchema = () => {
    if (!validateForm()) return

    const validImageUrls = formData.imageUrls.filter(url => url.trim())

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": formData.headline.trim(),
      "image": validImageUrls.length === 1 ? validImageUrls[0] : validImageUrls,
      "datePublished": formData.datePublished,
      "author": {
        "@type": "Person",
        "name": formData.authorName.trim()
      },
      "publisher": {
        "@type": "Organization",
        "name": formData.publisherName.trim(),
        "logo": {
          "@type": "ImageObject",
          "url": formData.publisherLogoUrl.trim()
        }
      }
    }

    // Add optional fields
    if (formData.authorUrl) {
      schema.author.url = formData.authorUrl.trim()
    }
    if (formData.dateModified) {
      schema.dateModified = formData.dateModified
    }
    if (formData.description) {
      schema.description = formData.description.trim()
    }
    if (formData.articleUrl) {
      schema.url = formData.articleUrl.trim()
    }

    const schemaString = JSON.stringify(schema, null, 2)
    const schemaWithScriptTags = `<script type="application/ld+json">\n${schemaString}\n</script>`
    setGeneratedSchema(schemaWithScriptTags)
    setShowOutput(true)

    // Scroll to output
    setTimeout(() => {
      document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    toast.success('Article Schema generated successfully!')
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
    a.download = 'article-schema.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded Article schema!')
  }

  // Educational FAQ content
  const educationalFAQs = [
    {
      question: "What is Article Schema?",
      answer: "Article Schema is structured data markup (JSON-LD) that helps search engines understand blog posts, news articles, and content pages. When properly implemented, it enables rich snippets in Google search results, including headline, image, date, and author information, significantly improving click-through rates and visibility."
    },
    {
      question: "Why do I need Article Schema for my blog?",
      answer: "Article Schema helps search engines like Google, Bing, and AI-powered answer engines (ChatGPT, Perplexity) properly index and display your content. It can lead to rich snippets in search results, inclusion in Google's Top Stories carousel, better visibility in AI Overviews, and improved click-through rates. Without Article Schema, search engines must guess what your content is about, potentially missing key details."
    },
    {
      question: "What's the difference between Article, BlogPosting, and NewsArticle?",
      answer: "All three are subtypes of Article schema. Use Article for general content pages, BlogPosting for blog posts on blogs and personal websites, and NewsArticle for journalistic articles on news websites. BlogPosting and NewsArticle inherit all Article properties but may have additional specific requirements. For most blogs and content sites, Article or BlogPosting works perfectly."
    },
    {
      question: "What are the required fields for Article Schema?",
      answer: "Google recommends (but doesn't strictly require): headline (max 110 characters), image URLs (at least one, ideally three for different aspect ratios), author name, publisher name with logo, datePublished, and optionally dateModified. While technically optional, including all recommended fields significantly improves your chances of getting rich snippets."
    },
    {
      question: "How do I add images to Article Schema?",
      answer: "Include at least one high-quality image URL in your Article Schema. Google recommends providing three images in different aspect ratios (1x1, 4x3, and 16x9) for optimal display across devices. Images should be directly related to the article content and at least 1200px wide for best results in rich snippets."
    },
    {
      question: "What's the difference between datePublished and dateModified?",
      answer: "datePublished is the date when the article was first published online (required). dateModified is the date when the article was last significantly updated (optional). If you've made major revisions to your content, adding dateModified helps search engines understand the content is current. dateModified must be the same as or after datePublished."
    },
    {
      question: "Do I need a publisher logo for Article Schema?",
      answer: "Yes, the publisher logo is highly recommended by Google. The logo must be at least 112x112 pixels and should represent your organization or website. It appears in rich snippets and helps establish credibility. If you're a solo blogger, you can use your personal brand logo or website logo."
    },
    {
      question: "Will Article Schema help my blog rank better in 2025?",
      answer: "Article Schema isn't a direct ranking factor, but it significantly improves your search visibility and click-through rates. In 2025, it's essential for appearing in rich snippets, Top Stories, Google Discover, and AI-powered search results. Structured data helps search engines understand your content context, leading to better targeting and higher quality traffic. Sites with proper Article Schema typically see 20-30% higher CTR from search results."
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
        <title>Free Article Schema Generator | Create JSON-LD Article Markup</title>
        <meta
          name="description"
          content="Generate valid Article schema markup in seconds with our free tool. Create SEO-optimized JSON-LD structured data for blogs, news articles, and content pages."
        />
        <meta name="keywords" content="article schema generator, blog schema markup, JSON-LD article, article structured data, BlogPosting schema, news article schema" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://superschema.io/article-schema-generator" />

        {/* Open Graph / Social Media Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free Article Schema Generator - Create JSON-LD Article Markup" />
        <meta property="og:description" content="Generate valid Article schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data for blogs and articles." />
        <meta property="og:url" content="https://superschema.io/article-schema-generator" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Article Schema Generator - Create JSON-LD Article Markup" />
        <meta name="twitter:description" content="Generate valid Article schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data." />

        {/* Structured Data - FAQ Schema for this page */}
        <script type="application/ld+json">
          {JSON.stringify(pageFAQSchema)}
        </script>

        {/* Structured Data - WebPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Free Article Schema Generator",
            "description": "Generate valid Article schema markup for your blog posts and articles with our free, easy-to-use tool.",
            "url": "https://superschema.io/article-schema-generator",
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
                  "name": "Article Schema Generator",
                  "item": "https://superschema.io/article-schema-generator"
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
            "name": "Article Schema Generator",
            "applicationCategory": "DeveloperApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Free tool to generate valid Article schema markup in JSON-LD format for SEO and improved search visibility."
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
                Free Article Schema Generator
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto">
                Create valid JSON-LD Article schema markup for better SEO and rich snippets in Google search results.
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

        {/* Article Schema Builder Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Build Your Article Schema</h2>
              <p className="text-muted-foreground mb-8">
                Fill in your article details below. Required fields are marked with an asterisk (*).
              </p>

              {/* Article Form */}
              <div className="space-y-8">
                {/* Article Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Article Information
                  </h3>

                  {/* Headline */}
                  <div>
                    <label htmlFor="headline" className="block text-sm font-medium mb-2">
                      Headline <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="headline"
                      type="text"
                      value={formData.headline}
                      onChange={(e) => updateField('headline', e.target.value)}
                      placeholder="e.g., 10 Best Practices for SEO in 2025"
                      maxLength={110}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <p className={`text-xs mt-1 ${formData.headline.length > 110 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formData.headline.length}/110 characters {formData.headline.length > 100 && '(Max 110 for rich snippets)'}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Description <span className="text-muted-foreground text-xs">(Recommended)</span>
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="A brief summary of your article content (150-250 characters recommended)"
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length} characters • Aim for 150-250 characters
                    </p>
                  </div>

                  {/* Article URL */}
                  <div>
                    <label htmlFor="articleUrl" className="block text-sm font-medium mb-2">
                      Article URL <span className="text-muted-foreground text-xs">(Optional)</span>
                    </label>
                    <input
                      id="articleUrl"
                      type="url"
                      value={formData.articleUrl}
                      onChange={(e) => updateField('articleUrl', e.target.value)}
                      placeholder="https://example.com/your-article"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="datePublished" className="block text-sm font-medium mb-2">
                        Date Published <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="datePublished"
                        type="date"
                        value={formData.datePublished}
                        onChange={(e) => updateField('datePublished', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="dateModified" className="block text-sm font-medium mb-2">
                        Date Modified <span className="text-muted-foreground text-xs">(Optional)</span>
                      </label>
                      <input
                        id="dateModified"
                        type="date"
                        value={formData.dateModified}
                        onChange={(e) => updateField('dateModified', e.target.value)}
                        min={formData.datePublished}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Author Information */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Author Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="authorName" className="block text-sm font-medium mb-2">
                        Author Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="authorName"
                        type="text"
                        value={formData.authorName}
                        onChange={(e) => updateField('authorName', e.target.value)}
                        placeholder="e.g., Jane Doe"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="authorUrl" className="block text-sm font-medium mb-2">
                        Author Profile URL <span className="text-muted-foreground text-xs">(Recommended)</span>
                      </label>
                      <input
                        id="authorUrl"
                        type="url"
                        value={formData.authorUrl}
                        onChange={(e) => updateField('authorUrl', e.target.value)}
                        placeholder="https://linkedin.com/in/janedoe"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        LinkedIn, Twitter, or author page URL
                      </p>
                    </div>
                  </div>
                </div>

                {/* Publisher Information */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Publisher Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="publisherName" className="block text-sm font-medium mb-2">
                        Publisher Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="publisherName"
                        type="text"
                        value={formData.publisherName}
                        onChange={(e) => updateField('publisherName', e.target.value)}
                        placeholder="e.g., My Awesome Blog"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your website or organization name
                      </p>
                    </div>
                    <div>
                      <label htmlFor="publisherLogoUrl" className="block text-sm font-medium mb-2">
                        Publisher Logo URL <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="publisherLogoUrl"
                        type="url"
                        value={formData.publisherLogoUrl}
                        onChange={(e) => updateField('publisherLogoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum 112x112px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Article Images
                    </h3>
                    <button
                      onClick={addImageUrl}
                      className="inline-flex items-center px-3 py-2 text-sm border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Image
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground -mt-2">
                    At least one image required. Google recommends 3 images in different aspect ratios (1x1, 4x3, 16x9) for best results.
                  </p>

                  {formData.imageUrls.map((imageUrl, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor={`image-${index}`} className="block text-sm font-medium mb-2">
                          Image URL {index + 1} {index === 0 && <span className="text-destructive">*</span>}
                        </label>
                        <input
                          id={`image-${index}`}
                          type="url"
                          value={imageUrl}
                          onChange={(e) => updateImageUrl(index, e.target.value)}
                          placeholder="https://example.com/article-image.jpg"
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                      {formData.imageUrls.length > 1 && (
                        <button
                          onClick={() => removeImageUrl(index)}
                          className="mt-8 p-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-8">
                <button
                  onClick={generateSchema}
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg text-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Article Schema
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
              <div className="container mx-auto max-w-5xl">
                <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Your Article Schema Markup</h2>
                  <p className="text-muted-foreground mb-6">
                    Copy the complete code below (including the <code className="text-sm bg-muted px-2 py-1 rounded">&lt;script&gt;</code> tags) and paste it into your article's HTML <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section.
                  </p>

                  {/* Schema Output */}
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-[500px] overflow-y-auto">
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
                      <li>Paste it into your article's <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section</li>
                      <li>Test your implementation with <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Rich Results Test</a></li>
                      <li>Ensure all information in the schema matches what's visible on your page</li>
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
                Tired of filling out forms for every article? Let SuperSchema do it automatically.
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
                    <span className="text-muted-foreground">Manual field entry for each article</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">One article at a time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Copy/paste for each article</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Article schema only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">No content extraction</span>
                  </li>
                </ul>
                <div className="text-center">
                  <p className="text-2xl font-bold">Free</p>
                  <p className="text-sm text-muted-foreground">Perfect for single articles</p>
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
                      <span>AI automatically extracts article details from URL</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Analyzes your entire blog automatically</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>One-click HubSpot integration</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multiple schema types (Article, Product, FAQ, etc.)</span>
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
                    <p className="text-3xl font-bold">From $0.50/article</p>
                    <p className="text-sm opacity-90">Save hours on every blog</p>
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
                Frequently Asked Questions About Article Schema
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about creating and implementing Article schema markup
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
              Ready to Automate Your Article Schema?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Stop filling out forms manually. Let SuperSchema's AI analyze your articles and generate perfect structured data automatically for every post.
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
                  href="https://developers.google.com/search/docs/appearance/structured-data/article"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Article Schema Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
