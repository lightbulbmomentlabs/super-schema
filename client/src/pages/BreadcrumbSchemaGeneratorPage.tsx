import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle, Info, Copy, Download, Plus, Trash2, ArrowUp, ArrowDown, ChevronRight as BreadcrumbSeparator } from 'lucide-react'
import toast from 'react-hot-toast'
import SuperSchemaLogo from '../components/SuperSchemaLogo'
import FAQItem from '../components/FAQItem'

interface BreadcrumbItem {
  position: number
  name: string
  url: string
}

export default function BreadcrumbSchemaGeneratorPage() {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { position: 1, name: 'Home', url: 'https://example.com' },
    { position: 2, name: 'Category', url: 'https://example.com/category' },
    { position: 3, name: 'Current Page', url: 'https://example.com/category/page' }
  ])

  const [generatedSchema, setGeneratedSchema] = useState<string>('')

  // Auto-recalculate positions whenever breadcrumbs change
  useEffect(() => {
    const recalculated = breadcrumbs.map((item, index) => ({
      ...item,
      position: index + 1
    }))
    if (JSON.stringify(recalculated) !== JSON.stringify(breadcrumbs)) {
      setBreadcrumbs(recalculated)
    }
  }, [breadcrumbs])

  // Add breadcrumb
  const addBreadcrumb = () => {
    const newPosition = breadcrumbs.length + 1
    setBreadcrumbs([
      ...breadcrumbs,
      { position: newPosition, name: '', url: '' }
    ])
  }

  // Remove breadcrumb
  const removeBreadcrumb = (index: number) => {
    if (breadcrumbs.length <= 2) {
      toast.error('Minimum 2 breadcrumb items required')
      return
    }
    setBreadcrumbs(breadcrumbs.filter((_, i) => i !== index))
  }

  // Update breadcrumb
  const updateBreadcrumb = (index: number, field: keyof Omit<BreadcrumbItem, 'position'>, value: string) => {
    setBreadcrumbs(breadcrumbs.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  // Move breadcrumb up
  const moveBreadcrumbUp = (index: number) => {
    if (index === 0) return
    const newBreadcrumbs = [...breadcrumbs]
    const temp = newBreadcrumbs[index]
    newBreadcrumbs[index] = newBreadcrumbs[index - 1]
    newBreadcrumbs[index - 1] = temp
    setBreadcrumbs(newBreadcrumbs)
  }

  // Move breadcrumb down
  const moveBreadcrumbDown = (index: number) => {
    if (index === breadcrumbs.length - 1) return
    const newBreadcrumbs = [...breadcrumbs]
    const temp = newBreadcrumbs[index]
    newBreadcrumbs[index] = newBreadcrumbs[index + 1]
    newBreadcrumbs[index + 1] = temp
    setBreadcrumbs(newBreadcrumbs)
  }

  // Validation
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateForm = (): boolean => {
    if (breadcrumbs.length < 2) {
      toast.error('At least 2 breadcrumb items are required')
      return false
    }

    for (let i = 0; i < breadcrumbs.length; i++) {
      const item = breadcrumbs[i]

      if (!item.name.trim()) {
        toast.error(`Breadcrumb ${i + 1} name is required`)
        return false
      }

      if (!item.url.trim()) {
        toast.error(`Breadcrumb ${i + 1} URL is required`)
        return false
      }

      if (!isValidUrl(item.url.trim())) {
        toast.error(`Breadcrumb ${i + 1} has an invalid URL`)
        return false
      }
    }

    return true
  }

  // Generate Schema
  const generateSchema = () => {
    if (!validateForm()) return

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.name.trim(),
        "item": item.url.trim()
      }))
    }

    const schemaString = JSON.stringify(schema, null, 2)
    const fullSchema = `<script type="application/ld+json">\n${schemaString}\n</script>`
    setGeneratedSchema(fullSchema)

    toast.success('BreadcrumbList Schema generated successfully!')
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSchema)
    toast.success('Schema copied to clipboard!')
  }

  // Download as file
  const downloadSchema = () => {
    const blob = new Blob([generatedSchema], { type: 'application/ld+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'breadcrumb-schema.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Schema downloaded!')
  }

  // Educational FAQs
  const educationalFAQs = [
    {
      question: "What is BreadcrumbList schema markup and why use it?",
      answer: "BreadcrumbList schema markup is structured data that tells search engines about the hierarchical navigation path on your website. It helps Google display breadcrumb navigation directly in search results, showing users exactly where a page sits in your site's structure. This improves user experience, increases click-through rates, and helps search engines better understand your site architecture."
    },
    {
      question: "How does BreadcrumbList schema help with SEO and user experience?",
      answer: "BreadcrumbList schema can display your site's navigation path directly in Google search results, replacing or supplementing the URL. This gives users a clear preview of where they'll land before clicking, increases trust, and can improve click-through rates. It also helps search engines understand your site hierarchy, which can improve crawling efficiency and potentially boost rankings for category and parent pages."
    },
    {
      question: "What are the required properties for BreadcrumbList schema?",
      answer: "The required properties are: 1) itemListElement (an array of breadcrumb items), and for each item: 2) @type (should be 'ListItem'), 3) position (integer starting at 1), 4) name (text label for the breadcrumb), and 5) item (the URL, though this can be omitted for the last/current page). The positions must be sequential integers starting at 1."
    },
    {
      question: "How many breadcrumb items should I include?",
      answer: "Google requires at least 2 breadcrumb items in your BreadcrumbList. There's no strict maximum, but typically breadcrumb trails contain 3-5 items representing the path from homepage to the current page. Include as many levels as needed to accurately represent the page's position in your site hierarchy, but avoid making trails unnecessarily deep or complex."
    },
    {
      question: "Should I include the homepage in my breadcrumb trail?",
      answer: "Yes, it's recommended to include the homepage as the first item in your breadcrumb trail (position 1). This establishes the full navigation path from the site root to the current page. However, you don't need to include the domain name in the breadcrumb text - simply use 'Home' or your site name as the label."
    },
    {
      question: "Do I need to include the current page in the breadcrumb schema?",
      answer: "Including the current page as the last breadcrumb item is optional but recommended for completeness. If you do include it, you can optionally omit the 'item' URL property for the last breadcrumb since users are already on that page. Google's guidelines state that representing the current page is up to you based on your site's design."
    },
    {
      question: "What's the difference between breadcrumb navigation and URL structure?",
      answer: "Breadcrumb navigation represents the logical, user-friendly path through your site's content hierarchy, while URL structure is the technical path in your site's file system. Google recommends breadcrumbs represent a 'typical user path' rather than mirroring URL structure. For example, a product might have the URL /p/12345 but the breadcrumb could be 'Home > Electronics > Laptops > Gaming Laptops' which is more meaningful to users."
    },
    {
      question: "How can I validate my BreadcrumbList schema markup?",
      answer: "Use Google's Rich Results Test (search.google.com/test/rich-results) to validate your BreadcrumbList schema. The tool will check for required properties, correct position sequencing, and valid URL formats. You can also use Schema Markup Validator (validator.schema.org) for general validation. After implementation, monitor Google Search Console for any structured data errors or warnings."
    }
  ]

  return (
    <>
      <Helmet>
        <title>Free Breadcrumb Schema Generator | Create Valid JSON-LD Markup</title>
        <meta name="description" content="Generate perfect BreadcrumbList schema markup for your website navigation. Free visual breadcrumb builder with auto-positioning and Google-compliant JSON-LD output." />
        <meta name="keywords" content="breadcrumb schema, breadcrumblist generator, json-ld generator, schema markup, structured data, breadcrumb navigation, site hierarchy, breadcrumb seo" />
        <link rel="canonical" href="https://superschema.ai/breadcrumb-schema-generator" />

        {/* Open Graph */}
        <meta property="og:title" content="Free Breadcrumb Schema Generator | SuperSchema" />
        <meta property="og:description" content="Generate perfect BreadcrumbList schema markup with our visual breadcrumb builder. Free tool with auto-positioning." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://superschema.ai/breadcrumb-schema-generator" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Breadcrumb Schema Generator | SuperSchema" />
        <meta name="twitter:description" content="Generate perfect BreadcrumbList schema markup in seconds. Free visual breadcrumb builder." />

        {/* Structured Data for the page itself */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Breadcrumb Schema Generator",
            "description": "Free tool to generate BreadcrumbList schema markup with visual breadcrumb builder",
            "applicationCategory": "DeveloperApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Organization",
              "name": "SuperSchema"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <SuperSchemaLogo className="h-8 w-8" />
                <span className="font-bold text-xl">SuperSchema</span>
              </Link>
              <Link
                to="/sign-up"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Try SuperSchema
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Free Breadcrumb Schema Generator
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Create perfect BreadcrumbList JSON-LD schema markup with our visual breadcrumb builder. Auto-positioning, validation, and Google-compliant output.
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Visual Breadcrumb Builder</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Auto-Positioning</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Drag-Free Reordering</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Live Preview</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">

              {/* Live Breadcrumb Preview */}
              <div className="mb-8 p-6 bg-muted/30 border border-border rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-primary" />
                  Live Preview
                </h3>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  {breadcrumbs.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors cursor-default" title={item.url || 'No URL'}>
                        {item.name || `Item ${index + 1}`}
                      </span>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="h-4 w-4 mx-2 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
                <div className="space-y-8">

                  {/* Breadcrumb Items */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold flex items-center">
                        <Info className="h-5 w-5 mr-2 text-primary" />
                        Breadcrumb Items
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        Minimum 2 items required
                      </span>
                    </div>

                    <div className="space-y-4">
                      {breadcrumbs.map((item, index) => (
                        <div key={index} className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => moveBreadcrumbUp(index)}
                                  disabled={index === 0}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Move up"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => moveBreadcrumbDown(index)}
                                  disabled={index === breadcrumbs.length - 1}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Move down"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                                {item.position}
                              </div>
                              <h4 className="font-medium">Breadcrumb {item.position}</h4>
                            </div>
                            <button
                              onClick={() => removeBreadcrumb(index)}
                              disabled={breadcrumbs.length <= 2}
                              className="px-3 py-1 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Name <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateBreadcrumb(index, 'name', e.target.value)}
                                placeholder="e.g., Home, Products, Category"
                                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                URL <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="url"
                                value={item.url}
                                onChange={(e) => updateBreadcrumb(index, 'url', e.target.value)}
                                placeholder="https://example.com/category"
                                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addBreadcrumb}
                      className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-dashed border-input rounded-md hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Breadcrumb Item
                    </button>
                  </div>

                  {/* Guidelines */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                    <h3 className="font-semibold mb-2 flex items-center text-blue-900 dark:text-blue-100">
                      <Info className="h-5 w-5 mr-2" />
                      Guidelines
                    </h3>
                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <li>• Breadcrumbs should represent a typical user navigation path, not URL structure</li>
                      <li>• Position starts at 1 and auto-increments for each item</li>
                      <li>• Order matters - items go from broad (Home) to specific (Current Page)</li>
                      <li>• The last item (current page) can optionally omit the URL</li>
                      <li>• Use the up/down arrows to reorder items</li>
                    </ul>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4">
                    <button
                      onClick={generateSchema}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-lg"
                    >
                      Generate Breadcrumb Schema
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Generated Schema Output */}
        <AnimatePresence>
          {generatedSchema && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="py-16 bg-muted/20"
            >
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold mb-6 text-center">Your Breadcrumb Schema</h2>

                  <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </button>
                      <button
                        onClick={downloadSchema}
                        className="inline-flex items-center px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>

                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                      <code>{generatedSchema}</code>
                    </pre>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        How to Use This Schema
                      </h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Copy the generated schema markup above</li>
                        <li>Paste it in the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> section of your web page</li>
                        <li>Place it before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag</li>
                        <li>Validate using Google's Rich Results Test</li>
                        <li>Monitor breadcrumb appearance in search results</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Educational FAQ Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
              <p className="text-center text-muted-foreground mb-12">
                Everything you need to know about BreadcrumbList schema markup
              </p>

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
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-center">Why Use This Generator?</h2>
              <p className="text-center text-muted-foreground mb-12">
                Compare your options for creating BreadcrumbList schema markup
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-lg -mx-6 -mt-6 mb-6"></div>
                  <h3 className="text-xl font-semibold mb-4">Manual Coding</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>⏱️ Complex array structure</li>
                    <li>🐛 Manual position tracking</li>
                    <li>📚 Sequential numbering required</li>
                    <li>🔄 Error-prone reordering</li>
                    <li>❌ No visual preview</li>
                  </ul>
                </motion.div>

                <motion.div
                  className="bg-card border-2 border-primary rounded-lg p-6 shadow-lg relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-purple-500 rounded-t-lg -mx-6 -mt-6 mb-6"></div>
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    BEST VALUE
                  </div>
                  <h3 className="text-xl font-semibold mb-4">This Generator</h3>
                  <ul className="space-y-2 text-sm">
                    <li>⚡ Visual breadcrumb builder</li>
                    <li>✅ Auto-positioning</li>
                    <li>🎯 Live preview</li>
                    <li>↕️ Easy reordering</li>
                    <li>📋 Copy & paste ready</li>
                  </ul>
                </motion.div>

                <motion.div
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-lg -mx-6 -mt-6 mb-6"></div>
                  <h3 className="text-xl font-semibold mb-4">SuperSchema</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>🤖 Auto-generate from site structure</li>
                    <li>🔄 Dynamic breadcrumb updates</li>
                    <li>🚀 CMS integration</li>
                    <li>📊 Multi-page management</li>
                    <li>👥 Automated site-wide deployment</li>
                  </ul>
                  <Link
                    to="/sign-up"
                    className="mt-4 block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                  >
                    Try SuperSchema
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready for Automated Breadcrumb Management?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                SuperSchema automatically generates breadcrumb schema markup across your entire website based on your site structure, with dynamic updates and seamless CMS integration.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/sign-up"
                  className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                >
                  Start Free Trial
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center px-6 py-3 border border-input rounded-md hover:bg-muted transition-colors font-medium"
                >
                  View Documentation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <Link to="/" className="flex items-center space-x-2 mb-4">
                    <SuperSchemaLogo className="h-8 w-8" />
                    <span className="font-bold text-lg">SuperSchema</span>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    AI-powered schema markup for modern websites
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Product</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link to="/generate" className="hover:text-foreground transition-colors">Generate Schema</Link></li>
                    <li><Link to="/library" className="hover:text-foreground transition-colors">Schema Library</Link></li>
                    <li><Link to="/hubspot" className="hover:text-foreground transition-colors">HubSpot Integration</Link></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Free Tools</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link to="/faq-schema-generator" className="hover:text-foreground transition-colors">FAQ Schema Generator</Link></li>
                    <li><Link to="/article-schema-generator" className="hover:text-foreground transition-colors">Article Schema Generator</Link></li>
                    <li><Link to="/product-schema-generator" className="hover:text-foreground transition-colors">Product Schema Generator</Link></li>
                    <li><Link to="/localbusiness-schema-generator" className="hover:text-foreground transition-colors">LocalBusiness Schema Generator</Link></li>
                    <li><Link to="/organization-schema-generator" className="hover:text-foreground transition-colors">Organization Schema Generator</Link></li>
                    <li><Link to="/event-schema-generator" className="hover:text-foreground transition-colors">Event Schema Generator</Link></li>
                    <li><Link to="/review-schema-generator" className="hover:text-foreground transition-colors">Review Schema Generator</Link></li>
                    <li><Link to="/breadcrumb-schema-generator" className="hover:text-foreground transition-colors">Breadcrumb Schema Generator</Link></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Company</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                    <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                    <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} SuperSchema. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
