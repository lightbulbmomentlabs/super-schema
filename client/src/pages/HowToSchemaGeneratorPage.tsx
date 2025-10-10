import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Trash2, Copy, Download, CheckCircle, ArrowRight, Sparkles, Zap, Clock, Target, Info, X, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import FAQItem from '@/components/FAQItem'
import toast from 'react-hot-toast'

interface HowToStep {
  name: string
  text: string
  image: string
  url: string
}

interface HowToFormData {
  name: string
  description: string
  image: string
  totalTimeHours: string
  totalTimeMinutes: string
  estimatedCost: string
  currency: string
  steps: HowToStep[]
  supplies: string[]
  tools: string[]
}

export default function HowToSchemaGeneratorPage() {
  const [formData, setFormData] = useState<HowToFormData>({
    name: '',
    description: '',
    image: '',
    totalTimeHours: '',
    totalTimeMinutes: '',
    estimatedCost: '',
    currency: 'USD',
    steps: [{ name: '', text: '', image: '', url: '' }],
    supplies: [],
    tools: []
  })
  const [generatedSchema, setGeneratedSchema] = useState<string>('')
  const [showOutput, setShowOutput] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]))
  const [currentSupply, setCurrentSupply] = useState('')
  const [currentTool, setCurrentTool] = useState('')

  // Update form field
  const updateField = (field: keyof HowToFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Update step field
  const updateStep = (index: number, field: keyof HowToStep, value: string) => {
    const newSteps = [...formData.steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData(prev => ({ ...prev, steps: newSteps }))
  }

  // Add new step
  const addStep = () => {
    const newSteps = [...formData.steps, { name: '', text: '', image: '', url: '' }]
    setFormData(prev => ({ ...prev, steps: newSteps }))
    setExpandedSteps(new Set([...expandedSteps, newSteps.length - 1]))
  }

  // Remove step
  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, steps: newSteps }))
      const newExpanded = new Set(expandedSteps)
      newExpanded.delete(index)
      setExpandedSteps(newExpanded)
    }
  }

  // Toggle step expansion
  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSteps(newExpanded)
  }

  // Add supply
  const addSupply = () => {
    if (currentSupply.trim()) {
      setFormData(prev => ({ ...prev, supplies: [...prev.supplies, currentSupply.trim()] }))
      setCurrentSupply('')
    }
  }

  // Remove supply
  const removeSupply = (index: number) => {
    setFormData(prev => ({ ...prev, supplies: prev.supplies.filter((_, i) => i !== index) }))
  }

  // Add tool
  const addTool = () => {
    if (currentTool.trim()) {
      setFormData(prev => ({ ...prev, tools: [...prev.tools, currentTool.trim()] }))
      setCurrentTool('')
    }
  }

  // Remove tool
  const removeTool = (index: number) => {
    setFormData(prev => ({ ...prev, tools: prev.tools.filter((_, i) => i !== index) }))
  }

  // Convert time to ISO 8601 duration
  const getTimeISO8601 = (): string => {
    const hours = parseInt(formData.totalTimeHours) || 0
    const minutes = parseInt(formData.totalTimeMinutes) || 0

    if (hours === 0 && minutes === 0) return ''

    let duration = 'PT'
    if (hours > 0) duration += `${hours}H`
    if (minutes > 0) duration += `${minutes}M`
    return duration
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
    if (!formData.name.trim()) {
      toast.error('HowTo title/name is required')
      return false
    }

    // At least one step required
    if (formData.steps.length === 0) {
      toast.error('At least one step is required')
      return false
    }

    // Validate each step
    for (let i = 0; i < formData.steps.length; i++) {
      const step = formData.steps[i]
      if (!step.name.trim() && !step.text.trim()) {
        toast.error(`Step ${i + 1}: Either step name or step text is required`)
        return false
      }
      if (step.image && !isValidUrl(step.image)) {
        toast.error(`Step ${i + 1}: Image URL is not valid`)
        return false
      }
      if (step.url && !isValidUrl(step.url)) {
        toast.error(`Step ${i + 1}: URL is not valid`)
        return false
      }
    }

    // Validate URLs
    if (formData.image && !isValidUrl(formData.image)) {
      toast.error('Main image URL is not valid')
      return false
    }

    // Validate cost
    if (formData.estimatedCost && isNaN(parseFloat(formData.estimatedCost))) {
      toast.error('Estimated cost must be a valid number')
      return false
    }

    return true
  }

  // Generate schema
  const generateSchema = () => {
    if (!validateForm()) return

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": formData.name.trim(),
      "step": formData.steps.map(step => {
        const stepObj: any = {
          "@type": "HowToStep"
        }
        if (step.name.trim()) stepObj.name = step.name.trim()
        if (step.text.trim()) stepObj.text = step.text.trim()
        if (step.image.trim()) stepObj.image = step.image.trim()
        if (step.url.trim()) stepObj.url = step.url.trim()
        return stepObj
      })
    }

    // Add optional fields
    if (formData.description.trim()) {
      schema.description = formData.description.trim()
    }
    if (formData.image.trim()) {
      schema.image = formData.image.trim()
    }

    const timeISO = getTimeISO8601()
    if (timeISO) {
      schema.totalTime = timeISO
    }

    if (formData.estimatedCost && !isNaN(parseFloat(formData.estimatedCost))) {
      schema.estimatedCost = {
        "@type": "MonetaryAmount",
        "currency": formData.currency,
        "value": formData.estimatedCost
      }
    }

    if (formData.supplies.length > 0) {
      schema.supply = formData.supplies.map(supply => ({
        "@type": "HowToSupply",
        "name": supply
      }))
    }

    if (formData.tools.length > 0) {
      schema.tool = formData.tools.map(tool => ({
        "@type": "HowToTool",
        "name": tool
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

    toast.success('HowTo Schema generated successfully!')
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
    a.download = 'howto-schema.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded HowTo schema!')
  }

  // Educational FAQ content
  const educationalFAQs = [
    {
      question: "What is HowTo Schema?",
      answer: "HowTo Schema is structured data markup (JSON-LD) that identifies step-by-step instructional content for search engines. It tells Google, Bing, and AI assistants that your content is a tutorial or guide. When properly implemented, it can appear as rich results with step-by-step instructions, images, time estimates, and costs, significantly improving visibility and user engagement."
    },
    {
      question: "Why do I need HowTo Schema for my tutorials?",
      answer: "HowTo Schema helps search engines understand and display your instructional content as rich results. It enables step-by-step visual carousels in Google search, inclusion in Google Discover, better visibility in voice search and AI assistants (ChatGPT, Perplexity), and improved click-through rates. Without HowTo Schema, your tutorials are just plain text in search results. Note: As of 2025, HowTo rich results only appear on desktop search (not mobile), though markup should still be on mobile pages for proper indexing."
    },
    {
      question: "What are the required fields for HowTo Schema?",
      answer: "Google requires: name (the title of your HowTo) and step (an array of HowToStep objects with instructions). Each step needs either a name or text field. Recommended fields include: description (brief summary), image (main image), totalTime (in ISO 8601 format like PT30M), estimatedCost (with currency), supply (materials needed), tool (tools needed), and images for each step to enable carousel display."
    },
    {
      question: "How do I add steps to HowTo Schema?",
      answer: "Each step in HowTo Schema is a HowToStep object containing: name (step title), text (detailed instruction), image (optional step image), and url (optional step URL). Steps must be in logical order. For best results, provide both name and text for each step, add step-specific images for carousel display, keep instructions clear and concise, and use 3-20 steps (too few or too many may not qualify for rich results)."
    },
    {
      question: "Should I add images to each step in HowTo Schema?",
      answer: "Yes! Adding images to each step significantly improves your chances of getting HowTo rich results with image carousels. Google recommends: providing at least one image per step, using high-quality images (at least 720px wide), ensuring images directly relate to the step instruction, and using consistent image dimensions across steps. Step images enable the visual carousel display that makes HowTo rich results highly engaging and clickable."
    },
    {
      question: "What's the difference between supplies and tools in HowTo Schema?",
      answer: "In HowTo Schema: Supply (HowToSupply) refers to consumable materials used up during the process (ingredients, paint, fabric, etc.) - things you use and run out of. Tool (HowToTool) refers to non-consumable equipment needed to complete the task (hammer, mixer, scissors, etc.) - things you use but keep. Both are optional but recommended for completeness. They help search engines understand what's needed and can appear in rich results."
    },
    {
      question: "How do I format time duration in HowTo Schema?",
      answer: "HowTo Schema uses ISO 8601 duration format for totalTime. Format: PT[hours]H[minutes]M. Examples: PT30M = 30 minutes, PT2H = 2 hours, PT1H30M = 1 hour 30 minutes, PT45M = 45 minutes. The 'PT' prefix is required (Period of Time). Our tool automatically converts your hour/minute inputs to proper ISO 8601 format. Including totalTime helps users decide if they have time to complete your tutorial."
    },
    {
      question: "Will HowTo Schema help my tutorials rank better in 2025?",
      answer: "HowTo Schema isn't a direct ranking factor, but it significantly improves search visibility and engagement. In 2025, it's essential for appearing in rich results with visual step carousels, Google Discover, voice search results, and AI-powered answer engines (ChatGPT, Perplexity, Google AI Overviews). Tutorials with proper HowTo Schema typically see 30-40% higher CTR from desktop search. Important: HowTo rich results only appear on desktop (not mobile) as of 2025, though markup should be on mobile pages for indexing."
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
        <title>Free HowTo Schema Generator | Create JSON-LD Tutorial Markup</title>
        <meta
          name="description"
          content="Generate valid HowTo schema markup for step-by-step tutorials and guides. Free tool with no signup required. Get rich snippets with image carousels in Google search."
        />
        <meta name="keywords" content="howto schema generator, tutorial schema markup, JSON-LD howto, howto structured data, step by step schema, tutorial JSON-LD" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://superschema.io/howto-schema-generator" />

        {/* Open Graph / Social Media Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free HowTo Schema Generator - Create JSON-LD Tutorial Markup" />
        <meta property="og:description" content="Generate valid HowTo schema markup for tutorials. Free tool for creating SEO-optimized JSON-LD structured data with step-by-step instructions." />
        <meta property="og:url" content="https://superschema.io/howto-schema-generator" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free HowTo Schema Generator - Create JSON-LD Tutorial Markup" />
        <meta name="twitter:description" content="Generate valid HowTo schema markup for tutorials. Free tool for creating SEO-optimized JSON-LD structured data." />

        {/* Structured Data - FAQ Schema for this page */}
        <script type="application/ld+json">
          {JSON.stringify(pageFAQSchema)}
        </script>

        {/* Structured Data - WebPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Free HowTo Schema Generator",
            "description": "Generate valid HowTo schema markup for your tutorials and step-by-step guides with our free, easy-to-use tool.",
            "url": "https://superschema.io/howto-schema-generator",
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
                  "name": "HowTo Schema Generator",
                  "item": "https://superschema.io/howto-schema-generator"
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
            "name": "HowTo Schema Generator",
            "applicationCategory": "DeveloperApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Free tool to generate valid HowTo schema markup in JSON-LD format for SEO and improved search visibility."
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
                Free HowTo Schema Generator
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto">
                Create valid JSON-LD HowTo schema markup for step-by-step tutorials and guides. Get rich snippets with image carousels in Google search.
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
                  Step Builder
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* HowTo Schema Builder Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Build Your HowTo Schema</h2>
              <p className="text-muted-foreground mb-8">
                Fill in your tutorial details below. Required fields are marked with an asterisk (*).
              </p>

              {/* HowTo Form */}
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Basic Information
                  </h3>

                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Title/Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., How to Bake Chocolate Chip Cookies"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
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
                      placeholder="A brief summary of what this tutorial teaches (150-250 characters recommended)"
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length} characters • Aim for 150-250 characters
                    </p>
                  </div>

                  {/* Main Image */}
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium mb-2">
                      Main Image URL <span className="text-muted-foreground text-xs">(Optional)</span>
                    </label>
                    <input
                      id="image"
                      type="url"
                      value={formData.image}
                      onChange={(e) => updateField('image', e.target.value)}
                      placeholder="https://example.com/tutorial-main-image.jpg"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Time and Cost */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Total Time */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Total Time <span className="text-muted-foreground text-xs">(Optional)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="number"
                            min="0"
                            value={formData.totalTimeHours}
                            onChange={(e) => updateField('totalTimeHours', e.target.value)}
                            placeholder="Hours"
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={formData.totalTimeMinutes}
                            onChange={(e) => updateField('totalTimeMinutes', e.target.value)}
                            placeholder="Minutes"
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      {(formData.totalTimeHours || formData.totalTimeMinutes) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ISO 8601: {getTimeISO8601()}
                        </p>
                      )}
                    </div>

                    {/* Estimated Cost */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Estimated Cost <span className="text-muted-foreground text-xs">(Optional)</span>
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.estimatedCost}
                          onChange={(e) => updateField('estimatedCost', e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <select
                          value={formData.currency}
                          onChange={(e) => updateField('currency', e.target.value)}
                          className="px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                          <option value="AUD">AUD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps Section */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Steps <span className="text-destructive ml-1">*</span>
                    </h3>
                    <button
                      onClick={addStep}
                      className="inline-flex items-center px-3 py-2 text-sm border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Step
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Add step-by-step instructions. Each step needs either a name or text. Images for steps enable carousel display.
                  </p>

                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="border border-border rounded-lg overflow-hidden">
                        {/* Step Header */}
                        <div
                          className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleStep(index)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {step.name || step.text || `Step ${index + 1}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {formData.steps.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeStep(index)
                                }}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                aria-label="Remove step"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {expandedSteps.has(index) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Step Content */}
                        <AnimatePresence>
                          {expandedSteps.has(index) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 space-y-4 border-t border-border">
                                {/* Step Name */}
                                <div>
                                  <label htmlFor={`step-name-${index}`} className="block text-sm font-medium mb-2">
                                    Step Name
                                  </label>
                                  <input
                                    id={`step-name-${index}`}
                                    type="text"
                                    value={step.name}
                                    onChange={(e) => updateStep(index, 'name', e.target.value)}
                                    placeholder="e.g., Mix dry ingredients"
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                  />
                                </div>

                                {/* Step Text */}
                                <div>
                                  <label htmlFor={`step-text-${index}`} className="block text-sm font-medium mb-2">
                                    Step Instructions
                                  </label>
                                  <textarea
                                    id={`step-text-${index}`}
                                    value={step.text}
                                    onChange={(e) => updateStep(index, 'text', e.target.value)}
                                    placeholder="Detailed instruction for this step..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                  />
                                </div>

                                {/* Step Image */}
                                <div>
                                  <label htmlFor={`step-image-${index}`} className="block text-sm font-medium mb-2">
                                    Step Image URL <span className="text-muted-foreground text-xs">(Optional, but recommended for carousel)</span>
                                  </label>
                                  <input
                                    id={`step-image-${index}`}
                                    type="url"
                                    value={step.image}
                                    onChange={(e) => updateStep(index, 'image', e.target.value)}
                                    placeholder="https://example.com/step-image.jpg"
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                  />
                                </div>

                                {/* Step URL */}
                                <div>
                                  <label htmlFor={`step-url-${index}`} className="block text-sm font-medium mb-2">
                                    Step URL <span className="text-muted-foreground text-xs">(Optional)</span>
                                  </label>
                                  <input
                                    id={`step-url-${index}`}
                                    type="url"
                                    value={step.url}
                                    onChange={(e) => updateStep(index, 'url', e.target.value)}
                                    placeholder="https://example.com/tutorial#step-1"
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplies and Tools */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Supplies & Tools <span className="text-muted-foreground text-xs ml-2">(Optional)</span>
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Supplies */}
                    <div>
                      <label htmlFor="supply-input" className="block text-sm font-medium mb-2">
                        Supplies (Materials needed)
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          id="supply-input"
                          type="text"
                          value={currentSupply}
                          onChange={(e) => setCurrentSupply(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSupply())}
                          placeholder="e.g., 2 cups flour"
                          className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <button
                          onClick={addSupply}
                          className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.supplies.map((supply, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-foreground rounded-full text-sm"
                          >
                            {supply}
                            <button
                              onClick={() => removeSupply(index)}
                              className="p-0.5 hover:bg-background rounded-full transition-colors"
                              aria-label="Remove supply"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tools */}
                    <div>
                      <label htmlFor="tool-input" className="block text-sm font-medium mb-2">
                        Tools (Equipment needed)
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          id="tool-input"
                          type="text"
                          value={currentTool}
                          onChange={(e) => setCurrentTool(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
                          placeholder="e.g., Mixing bowl"
                          className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <button
                          onClick={addTool}
                          className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tools.map((tool, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-foreground rounded-full text-sm"
                          >
                            {tool}
                            <button
                              onClick={() => removeTool(index)}
                              className="p-0.5 hover:bg-background rounded-full transition-colors"
                              aria-label="Remove tool"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-8">
                <button
                  onClick={generateSchema}
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg text-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate HowTo Schema
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
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Your HowTo Schema Markup</h2>
                  <p className="text-muted-foreground mb-6">
                    Copy the complete code below (including the <code className="text-sm bg-muted px-2 py-1 rounded">&lt;script&gt;</code> tags) and paste it into your tutorial page's HTML <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section.
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
                      <li>Paste it into your tutorial page's <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section</li>
                      <li>Test your implementation with <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Rich Results Test</a></li>
                      <li>Ensure all information in the schema matches what's visible on your page</li>
                      <li>Note: HowTo rich results only appear on desktop search (not mobile) as of 2025</li>
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
                Tired of filling out forms for every tutorial? Let SuperSchema do it automatically.
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
                    <span className="text-muted-foreground">Manual field entry for each tutorial</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Add each step individually</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Copy/paste for each guide</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">HowTo schema only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">No content extraction</span>
                  </li>
                </ul>
                <div className="text-center">
                  <p className="text-2xl font-bold">Free</p>
                  <p className="text-sm text-muted-foreground">Perfect for single tutorials</p>
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
                      <span>AI automatically extracts tutorial content from URL</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Analyzes your entire site automatically</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>One-click HubSpot integration</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multiple schema types (HowTo, Article, Product, FAQ, etc.)</span>
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
                    <p className="text-3xl font-bold">From $0.50/tutorial</p>
                    <p className="text-sm opacity-90">Save hours on every guide</p>
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
                Frequently Asked Questions About HowTo Schema
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about creating and implementing HowTo schema markup
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
              Ready to Automate Your Tutorial Schema?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Stop filling out forms manually. Let SuperSchema's AI analyze your tutorials and generate perfect structured data automatically for every guide.
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
                  href="https://schema.org/HowTo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  HowTo Schema Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
