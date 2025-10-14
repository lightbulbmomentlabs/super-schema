import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Trash2, Copy, Download, CheckCircle, ArrowRight, Sparkles, Zap, Clock, Target, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SchemaGeneratorNav from '@/components/SchemaGeneratorNav'
import FAQItem from '@/components/FAQItem'
import toast from 'react-hot-toast'

interface ProductFormData {
  name: string
  description: string
  imageUrls: string[]
  brandName: string
  sku: string
  mpn: string
  gtin: string

  // Offers
  price: string
  priceCurrency: string
  availability: string
  offerUrl: string
  priceValidUntil: string
  condition: string

  // Ratings
  aggregateRatingValue: string
  aggregateRatingBest: string
  reviewCount: string

  // Optional review
  reviewText: string
  reviewRating: string
  reviewAuthor: string
}

export default function ProductSchemaGeneratorPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    imageUrls: [''],
    brandName: '',
    sku: '',
    mpn: '',
    gtin: '',
    price: '',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    offerUrl: '',
    priceValidUntil: '',
    condition: 'https://schema.org/NewCondition',
    aggregateRatingValue: '',
    aggregateRatingBest: '5',
    reviewCount: '',
    reviewText: '',
    reviewRating: '',
    reviewAuthor: ''
  })

  const [generatedSchema, setGeneratedSchema] = useState<string>('')
  const [showOutput, setShowOutput] = useState(false)
  const [copied, setCopied] = useState(false)

  // Update form field
  const updateField = (field: keyof ProductFormData, value: string | string[]) => {
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
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Validate price
  const validatePrice = (price: string): boolean => {
    if (!price) return true
    return /^\d+(\.\d{1,2})?$/.test(price)
  }

  // Validate form
  const validateForm = (): boolean => {
    // Required fields
    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return false
    }

    if (!formData.price.trim()) {
      toast.error('Price is required')
      return false
    }

    if (!validatePrice(formData.price)) {
      toast.error('Price must be a valid number (e.g., 29.99)')
      return false
    }

    // Validate image URLs
    const validImageUrls = formData.imageUrls.filter(url => url.trim())
    for (const imageUrl of validImageUrls) {
      if (!isValidUrl(imageUrl)) {
        toast.error('One or more image URLs are not valid')
        return false
      }
    }

    // Validate other URLs
    if (formData.offerUrl && !isValidUrl(formData.offerUrl)) {
      toast.error('Offer URL is not valid')
      return false
    }

    return true
  }

  // Generate schema
  const generateSchema = () => {
    if (!validateForm()) return

    const validImageUrls = formData.imageUrls.filter(url => url.trim())

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": formData.name.trim()
    }

    // Add description if provided
    if (formData.description.trim()) {
      schema.description = formData.description.trim()
    }

    // Add images (array or single string)
    if (validImageUrls.length > 0) {
      schema.image = validImageUrls.length === 1 ? validImageUrls[0] : validImageUrls
    }

    // Add brand if provided
    if (formData.brandName.trim()) {
      schema.brand = {
        "@type": "Brand",
        "name": formData.brandName.trim()
      }
    }

    // Add SKU, MPN, GTIN if provided
    if (formData.sku.trim()) schema.sku = formData.sku.trim()
    if (formData.mpn.trim()) schema.mpn = formData.mpn.trim()
    if (formData.gtin.trim()) schema.gtin = formData.gtin.trim()

    // Add offers (required for rich results)
    if (formData.price.trim()) {
      const offer: any = {
        "@type": "Offer",
        "price": formData.price.trim(),
        "priceCurrency": formData.priceCurrency
      }

      if (formData.availability) offer.availability = formData.availability
      if (formData.offerUrl && isValidUrl(formData.offerUrl)) offer.url = formData.offerUrl.trim()
      if (formData.priceValidUntil) offer.priceValidUntil = formData.priceValidUntil
      if (formData.condition) offer.itemCondition = formData.condition

      schema.offers = offer
    }

    // Add aggregateRating if provided
    if (formData.aggregateRatingValue && formData.reviewCount) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": formData.aggregateRatingValue,
        "bestRating": formData.aggregateRatingBest || "5",
        "reviewCount": formData.reviewCount
      }
    }

    // Add individual review if provided
    if (formData.reviewText && formData.reviewRating && formData.reviewAuthor) {
      schema.review = {
        "@type": "Review",
        "reviewBody": formData.reviewText.trim(),
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": formData.reviewRating,
          "bestRating": formData.aggregateRatingBest || "5"
        },
        "author": {
          "@type": "Person",
          "name": formData.reviewAuthor.trim()
        }
      }
    }

    const schemaString = JSON.stringify(schema, null, 2)
    const schemaWithScriptTags = `<script type="application/ld+json">\n${schemaString}\n</script>`
    setGeneratedSchema(schemaWithScriptTags)
    setShowOutput(true)

    // Scroll to output
    setTimeout(() => {
      document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    toast.success('Product Schema generated successfully!')
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
    a.download = 'product-schema.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded Product schema!')
  }

  // Educational FAQ content
  const educationalFAQs = [
    {
      question: "What is Product Schema?",
      answer: "Product schema is structured data markup that helps search engines understand product information on your website. It uses the schema.org Product type to provide details about products including name, price, availability, ratings, and images. When properly implemented, it enables rich snippets in Google search results showing price, availability, star ratings, and product images directly in search results."
    },
    {
      question: "Why is Product Schema important for e-commerce SEO?",
      answer: "Product schema enables rich snippets in search results, displaying price, availability, star ratings, and images directly in Google search. This increases click-through rates by 20-30%, improves visibility in Google Shopping, and helps customers make purchase decisions before clicking through to your site. In 2025, Product schema is essential for competing in e-commerce search results and appearing in Google's Shopping Graph."
    },
    {
      question: "What are the required properties for Product schema?",
      answer: "For Product schema, you need the product name and at least one of the following: offers (with price and availability), review, or aggregateRating. Google recommends including as many properties as possible including images, brand, SKU, descriptions, and detailed offer information. The more complete your Product schema, the better your chances of getting rich results."
    },
    {
      question: "How do I add Product schema to my website?",
      answer: "Copy the generated JSON-LD code (including the script tags) and paste it into the HTML of your product page, preferably in the <head> section or just before the closing </body> tag. The schema should be included on every product page. For e-commerce platforms like Shopify, WooCommerce, or BigCommerce, you can use plugins or add the code to your theme template."
    },
    {
      question: "What's the difference between Product snippets and Merchant listings?",
      answer: "Product snippets are for informational product pages where direct purchase isn't possible, while Merchant listings are for pages where customers can directly purchase products. Merchant listings support additional properties like shipping details, return policy, and apparel sizing information. Both use Product schema but have different eligibility requirements and display formats in Google search."
    },
    {
      question: "Can Product schema display star ratings in search results?",
      answer: "Yes, when you include aggregateRating or review properties in your Product schema, Google can display star ratings in search results. This requires valid rating data with ratingValue, bestRating, and reviewCount (for aggregateRating). Reviews must be genuine customer reviews following Google's review snippet guidelines. Fake or incentivized reviews can result in manual actions against your site."
    },
    {
      question: "Do I need both review and aggregateRating properties?",
      answer: "No, you only need one for rich results eligibility, but including both is recommended when available. aggregateRating shows overall product ratings across all reviews, while individual reviews provide specific customer feedback. Both enhance your rich snippet appearance and can improve click-through rates. Make sure all reviews are real and comply with Google's guidelines."
    },
    {
      question: "How can I test my Product schema markup?",
      answer: "Use Google's Rich Results Test tool to validate your Product schema. Simply paste your URL or the schema code, and Google will show you if it's eligible for rich results and highlight any errors or warnings that need fixing. You can also use Google Search Console's Rich Results report to monitor Product schema performance and identify issues on your live site."
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
        <title>Free Product Schema Generator | Create JSON-LD Product Markup</title>
        <meta
          name="description"
          content="Generate valid Product schema markup in seconds with our free tool. Create SEO-optimized JSON-LD structured data for e-commerce products with prices, ratings, and reviews."
        />
        <meta name="keywords" content="product schema generator, e-commerce schema markup, JSON-LD product, product structured data, product rich snippets, google shopping schema" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://superschema.io/product-schema-generator" />

        {/* Open Graph / Social Media Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free Product Schema Generator - Create JSON-LD Product Markup" />
        <meta property="og:description" content="Generate valid Product schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data for e-commerce products." />
        <meta property="og:url" content="https://superschema.io/product-schema-generator" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Product Schema Generator - Create JSON-LD Product Markup" />
        <meta name="twitter:description" content="Generate valid Product schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data." />

        {/* Structured Data - FAQ Schema for this page */}
        <script type="application/ld+json">
          {JSON.stringify(pageFAQSchema)}
        </script>

        {/* Structured Data - WebPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Free Product Schema Generator",
            "description": "Generate valid Product schema markup for your e-commerce products with our free, easy-to-use tool.",
            "url": "https://superschema.io/product-schema-generator",
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
                  "name": "Product Schema Generator",
                  "item": "https://superschema.io/product-schema-generator"
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
            "name": "Product Schema Generator",
            "applicationCategory": "DeveloperApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Free tool to generate valid Product schema markup in JSON-LD format for e-commerce SEO and improved search visibility."
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <SchemaGeneratorNav />

        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Free Product Schema Generator
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto">
                Create valid JSON-LD Product schema markup for better SEO, rich snippets, and higher click-through rates in Google search.
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

        {/* Product Schema Builder Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Build Your Product Schema</h2>
              <p className="text-muted-foreground mb-8">
                Fill in your product details below. Required fields are marked with an asterisk (*).
              </p>

              {/* Product Form */}
              <div className="space-y-8">
                {/* Product Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Product Information
                  </h3>

                  {/* Product Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Product Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., Executive Anvil Pro 3000"
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
                      placeholder="A brief description of your product and its key features"
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Brand, SKU, MPN */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="brandName" className="block text-sm font-medium mb-2">
                        Brand Name <span className="text-muted-foreground text-xs">(Recommended)</span>
                      </label>
                      <input
                        id="brandName"
                        type="text"
                        value={formData.brandName}
                        onChange={(e) => updateField('brandName', e.target.value)}
                        placeholder="e.g., ACME"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="sku" className="block text-sm font-medium mb-2">
                        SKU <span className="text-muted-foreground text-xs">(Optional)</span>
                      </label>
                      <input
                        id="sku"
                        type="text"
                        value={formData.sku}
                        onChange={(e) => updateField('sku', e.target.value)}
                        placeholder="e.g., 0446310786"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="mpn" className="block text-sm font-medium mb-2">
                        MPN <span className="text-muted-foreground text-xs">(Optional)</span>
                      </label>
                      <input
                        id="mpn"
                        type="text"
                        value={formData.mpn}
                        onChange={(e) => updateField('mpn', e.target.value)}
                        placeholder="e.g., 925872"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* GTIN */}
                  <div>
                    <label htmlFor="gtin" className="block text-sm font-medium mb-2">
                      GTIN/UPC/EAN <span className="text-muted-foreground text-xs">(Optional)</span>
                    </label>
                    <input
                      id="gtin"
                      type="text"
                      value={formData.gtin}
                      onChange={(e) => updateField('gtin', e.target.value)}
                      placeholder="e.g., 00000000000000"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Product Images
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
                    Add product images (recommended for rich results). Images should be high-quality and at least 1200px wide.
                  </p>

                  {formData.imageUrls.map((imageUrl, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor={`image-${index}`} className="block text-sm font-medium mb-2">
                          Image URL {index + 1} {index === 0 && <span className="text-muted-foreground text-xs">(Recommended)</span>}
                        </label>
                        <input
                          id={`image-${index}`}
                          type="url"
                          value={imageUrl}
                          onChange={(e) => updateImageUrl(index, e.target.value)}
                          placeholder="https://example.com/product-image.jpg"
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

                {/* Offer Information */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Offer Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium mb-2">
                        Price <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="price"
                        type="text"
                        value={formData.price}
                        onChange={(e) => updateField('price', e.target.value)}
                        placeholder="119.99"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="priceCurrency" className="block text-sm font-medium mb-2">
                        Currency
                      </label>
                      <select
                        id="priceCurrency"
                        value={formData.priceCurrency}
                        onChange={(e) => updateField('priceCurrency', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                        <option value="JPY">JPY</option>
                        <option value="CNY">CNY</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="availability" className="block text-sm font-medium mb-2">
                        Availability
                      </label>
                      <select
                        id="availability"
                        value={formData.availability}
                        onChange={(e) => updateField('availability', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="https://schema.org/InStock">In Stock</option>
                        <option value="https://schema.org/OutOfStock">Out of Stock</option>
                        <option value="https://schema.org/PreOrder">Pre-Order</option>
                        <option value="https://schema.org/Discontinued">Discontinued</option>
                        <option value="https://schema.org/InStoreOnly">In Store Only</option>
                        <option value="https://schema.org/LimitedAvailability">Limited Availability</option>
                        <option value="https://schema.org/OnlineOnly">Online Only</option>
                        <option value="https://schema.org/SoldOut">Sold Out</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium mb-2">
                        Condition
                      </label>
                      <select
                        id="condition"
                        value={formData.condition}
                        onChange={(e) => updateField('condition', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="https://schema.org/NewCondition">New</option>
                        <option value="https://schema.org/UsedCondition">Used</option>
                        <option value="https://schema.org/RefurbishedCondition">Refurbished</option>
                        <option value="https://schema.org/DamagedCondition">Damaged</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="offerUrl" className="block text-sm font-medium mb-2">
                      Offer URL <span className="text-muted-foreground text-xs">(Optional)</span>
                    </label>
                    <input
                      id="offerUrl"
                      type="url"
                      value={formData.offerUrl}
                      onChange={(e) => updateField('offerUrl', e.target.value)}
                      placeholder="https://example.com/products/executive-anvil"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="priceValidUntil" className="block text-sm font-medium mb-2">
                      Price Valid Until <span className="text-muted-foreground text-xs">(Optional)</span>
                    </label>
                    <input
                      id="priceValidUntil"
                      type="date"
                      value={formData.priceValidUntil}
                      onChange={(e) => updateField('priceValidUntil', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Ratings & Reviews */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Ratings & Reviews
                  </h3>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Add rating information to display star ratings in search results (optional but recommended).
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="aggregateRatingValue" className="block text-sm font-medium mb-2">
                        Rating Value
                      </label>
                      <input
                        id="aggregateRatingValue"
                        type="text"
                        value={formData.aggregateRatingValue}
                        onChange={(e) => updateField('aggregateRatingValue', e.target.value)}
                        placeholder="4.4"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="aggregateRatingBest" className="block text-sm font-medium mb-2">
                        Best Rating
                      </label>
                      <input
                        id="aggregateRatingBest"
                        type="text"
                        value={formData.aggregateRatingBest}
                        onChange={(e) => updateField('aggregateRatingBest', e.target.value)}
                        placeholder="5"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="reviewCount" className="block text-sm font-medium mb-2">
                        Review Count
                      </label>
                      <input
                        id="reviewCount"
                        type="text"
                        value={formData.reviewCount}
                        onChange={(e) => updateField('reviewCount', e.target.value)}
                        placeholder="89"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm font-medium mb-3 text-muted-foreground">Individual Review (Optional)</p>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="reviewText" className="block text-sm font-medium mb-2">
                          Review Text
                        </label>
                        <textarea
                          id="reviewText"
                          value={formData.reviewText}
                          onChange={(e) => updateField('reviewText', e.target.value)}
                          rows={2}
                          placeholder="Great product, highly recommended!"
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="reviewRating" className="block text-sm font-medium mb-2">
                            Review Rating
                          </label>
                          <input
                            id="reviewRating"
                            type="text"
                            value={formData.reviewRating}
                            onChange={(e) => updateField('reviewRating', e.target.value)}
                            placeholder="5"
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="reviewAuthor" className="block text-sm font-medium mb-2">
                            Review Author
                          </label>
                          <input
                            id="reviewAuthor"
                            type="text"
                            value={formData.reviewAuthor}
                            onChange={(e) => updateField('reviewAuthor', e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>
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
                  Generate Product Schema
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
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Your Product Schema Markup</h2>
                  <p className="text-muted-foreground mb-6">
                    Copy the complete code below (including the <code className="text-sm bg-muted px-2 py-1 rounded">&lt;script&gt;</code> tags) and paste it into your product page's HTML <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section.
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
                      <li>Paste it into your product page's <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section</li>
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
                Tired of filling out forms for every product? Let SuperSchema do it automatically.
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
                    <span className="text-muted-foreground">Manual field entry for each product</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">One product at a time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Copy/paste for each product</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Product schema only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">No content extraction</span>
                  </li>
                </ul>
                <div className="text-center">
                  <p className="text-2xl font-bold">Free</p>
                  <p className="text-sm text-muted-foreground">Perfect for single products</p>
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
                      <span>AI automatically extracts product details from URL</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Analyzes your entire product catalog automatically</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>One-click HubSpot integration</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multiple schema types (Product, Article, FAQ, etc.)</span>
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
                    <p className="text-3xl font-bold">From $0.50/product</p>
                    <p className="text-sm opacity-90">Save hours on every product page</p>
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
                Frequently Asked Questions About Product Schema
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about creating and implementing Product schema markup
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
              Ready to Automate Your Product Schema?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Stop filling out forms manually. Let SuperSchema's AI analyze your products and generate perfect structured data automatically for every product page.
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
                  href="https://developers.google.com/search/docs/appearance/structured-data/product"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Product Schema Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
