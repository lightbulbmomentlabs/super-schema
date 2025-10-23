import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle, Info, Copy, Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import SchemaGeneratorNav from '@/components/SchemaGeneratorNav'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import FAQItem from '../components/FAQItem'

// Item Types that can be reviewed
const REVIEWABLE_ITEM_TYPES = [
  { value: 'Book', label: 'Book' },
  { value: 'Course', label: 'Course' },
  { value: 'CreativeWorkSeason', label: 'Creative Work Season (TV Season)' },
  { value: 'CreativeWorkSeries', label: 'Creative Work Series (TV Series)' },
  { value: 'Episode', label: 'Episode (TV/Podcast)' },
  { value: 'Event', label: 'Event' },
  { value: 'Game', label: 'Game (Video Game)' },
  { value: 'HowTo', label: 'How-To' },
  { value: 'LocalBusiness', label: 'Local Business' },
  { value: 'MediaObject', label: 'Media Object (Video, Audio)' },
  { value: 'Movie', label: 'Movie' },
  { value: 'MusicPlaylist', label: 'Music Playlist' },
  { value: 'MusicRecording', label: 'Music Recording' },
  { value: 'Organization', label: 'Organization' },
  { value: 'Product', label: 'Product' },
  { value: 'Recipe', label: 'Recipe' },
  { value: 'SoftwareApplication', label: 'Software Application' }
]

interface ReviewFormData {
  // Item Being Reviewed
  itemType: string
  itemName: string
  itemUrl: string
  itemImageUrl: string

  // Review Information
  reviewTitle: string
  reviewBody: string
  datePublished: string

  // Author
  authorName: string
  authorType: 'Person' | 'Organization'
  authorUrl: string

  // Rating
  ratingValue: string
  bestRating: string
  worstRating: string

  // Optional Fields
  reviewAspect: string
  positiveNotes: string
  negativeNotes: string

  // Publisher
  publisherName: string
  publisherType: 'Person' | 'Organization'
}

export default function ReviewSchemaGeneratorPage() {
  const [formData, setFormData] = useState<ReviewFormData>({
    itemType: 'Product',
    itemName: '',
    itemUrl: '',
    itemImageUrl: '',
    reviewTitle: '',
    reviewBody: '',
    datePublished: '',
    authorName: '',
    authorType: 'Person',
    authorUrl: '',
    ratingValue: '',
    bestRating: '5',
    worstRating: '1',
    reviewAspect: '',
    positiveNotes: '',
    negativeNotes: '',
    publisherName: '',
    publisherType: 'Organization'
  })

  const [generatedSchema, setGeneratedSchema] = useState<string>('')

  // Update field helper
  const updateField = (field: keyof ReviewFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
    if (!formData.itemName.trim()) {
      toast.error('Item name is required')
      return false
    }

    if (!formData.reviewBody.trim()) {
      toast.error('Review body is required')
      return false
    }

    if (!formData.authorName.trim()) {
      toast.error('Author name is required')
      return false
    }

    if (formData.authorName.trim().length > 100) {
      toast.error('Author name must be under 100 characters')
      return false
    }

    if (!formData.ratingValue.trim()) {
      toast.error('Rating value is required')
      return false
    }

    const rating = parseFloat(formData.ratingValue)
    const best = parseFloat(formData.bestRating)
    const worst = parseFloat(formData.worstRating)

    if (isNaN(rating) || isNaN(best) || isNaN(worst)) {
      toast.error('Rating values must be valid numbers')
      return false
    }

    if (rating < worst || rating > best) {
      toast.error(`Rating must be between ${worst} and ${best}`)
      return false
    }

    if (formData.itemUrl.trim() && !isValidUrl(formData.itemUrl.trim())) {
      toast.error('Please enter a valid URL for the item')
      return false
    }

    if (formData.itemImageUrl.trim() && !isValidUrl(formData.itemImageUrl.trim())) {
      toast.error('Please enter a valid URL for the item image')
      return false
    }

    if (formData.authorUrl.trim() && !isValidUrl(formData.authorUrl.trim())) {
      toast.error('Please enter a valid URL for the author')
      return false
    }

    return true
  }

  // Generate Schema
  const generateSchema = () => {
    if (!validateForm()) return

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Review"
    }

    // Item Being Reviewed
    const itemReviewed: any = {
      "@type": formData.itemType,
      "name": formData.itemName.trim()
    }
    if (formData.itemUrl.trim()) itemReviewed.url = formData.itemUrl.trim()
    if (formData.itemImageUrl.trim()) itemReviewed.image = formData.itemImageUrl.trim()
    schema.itemReviewed = itemReviewed

    // Review Information
    if (formData.reviewTitle.trim()) schema.name = formData.reviewTitle.trim()
    schema.reviewBody = formData.reviewBody.trim()
    if (formData.datePublished.trim()) schema.datePublished = formData.datePublished.trim()

    // Author
    const author: any = {
      "@type": formData.authorType,
      "name": formData.authorName.trim()
    }
    if (formData.authorUrl.trim()) author.url = formData.authorUrl.trim()
    schema.author = author

    // Rating
    const reviewRating: any = {
      "@type": "Rating",
      "ratingValue": formData.ratingValue.trim(),
      "bestRating": formData.bestRating.trim(),
      "worstRating": formData.worstRating.trim()
    }
    schema.reviewRating = reviewRating

    // Optional Fields
    if (formData.reviewAspect.trim()) schema.reviewAspect = formData.reviewAspect.trim()
    if (formData.positiveNotes.trim()) schema.positiveNotes = formData.positiveNotes.trim()
    if (formData.negativeNotes.trim()) schema.negativeNotes = formData.negativeNotes.trim()

    // Publisher
    if (formData.publisherName.trim()) {
      schema.publisher = {
        "@type": formData.publisherType,
        "name": formData.publisherName.trim()
      }
    }

    const schemaString = JSON.stringify(schema, null, 2)
    const fullSchema = `<script type="application/ld+json">\n${schemaString}\n</script>`
    setGeneratedSchema(fullSchema)

    toast.success('Review Schema generated successfully!')
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
    a.download = 'review-schema.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Schema downloaded!')
  }

  // Educational FAQs
  const educationalFAQs = [
    {
      question: "What is Review schema markup and why is it important?",
      answer: "Review schema markup is structured data that helps search engines understand and display individual reviews of products, businesses, books, movies, and other items. It can lead to rich results in Google Search showing star ratings, author information, and review snippets, which can significantly improve click-through rates and help users make informed decisions."
    },
    {
      question: "How does Review schema help my content appear in Google Search?",
      answer: "When properly implemented, Review schema can enable rich snippets in search results that display star ratings, review counts, author names, and review excerpts. This enhanced display makes your content more visible and attractive in search results, potentially increasing traffic and engagement. Reviews may also appear in Google's review snippets feature for eligible items."
    },
    {
      question: "What types of items can I review with Review schema?",
      answer: "You can review a wide variety of items including products, local businesses, books, movies, courses, software applications, games, recipes, events, organizations, TV shows, music recordings, and more. However, Google requires that reviews be about specific items (like 'iPhone 15 Pro') rather than broad categories (like 'smartphones')."
    },
    {
      question: "What are the required properties for Review schema?",
      answer: "Google requires three essential properties for Review schema: 1) itemReviewed (the specific item being reviewed with its name and type), 2) reviewRating (a Rating object with at least a ratingValue), and 3) author (the person or organization who wrote the review, with a name under 100 characters). The review should also include reviewBody text."
    },
    {
      question: "What's the difference between a Review and an AggregateRating?",
      answer: "A Review represents a single individual review with one person's opinion, rating, and comments. An AggregateRating represents the average rating based on multiple reviews or ratings combined together. For example, a product might have 50 individual Reviews and one AggregateRating showing the average of all 50 ratings. Both can be used together on the same page."
    },
    {
      question: "Can I publish reviews on my own website for my own business?",
      answer: "No. Google's guidelines explicitly prohibit self-serving reviews. You cannot publish Review schema markup on your own website about your own business, products, or services. Reviews must be genuinely sourced from actual users or third-party reviewers. This policy ensures review authenticity and prevents manipulation of search results. Violations can result in manual actions against your site."
    },
    {
      question: "How should I structure ratings (1-5 stars vs other scales)?",
      answer: "While the most common rating scale is 1-5 stars, Review schema supports any scale you define using worstRating and bestRating properties. For example, you could use 0-10, 1-100, or even 0-4. The ratingValue should fall within your defined scale. Google will normalize and display the rating appropriately. Just ensure you clearly communicate your scale to users and remain consistent across all reviews."
    },
    {
      question: "How can I validate my Review schema markup?",
      answer: "Use Google's Rich Results Test (search.google.com/test/rich-results) to validate your Review schema. This tool checks for required properties, proper formatting, and eligibility for rich results. You can also use Schema Markup Validator (validator.schema.org) for general schema validation. Remember to test with actual content rather than placeholder data for accurate results."
    }
  ]

  return (
    <>
      <Helmet>
        <title>Free Review Schema Generator | Create Valid JSON-LD Markup</title>
        <meta name="description" content="Generate perfect Review schema markup for products, businesses, books, movies, and more. Free tool with support for ratings, author information, and Google-compliant review markup." />
        <meta name="keywords" content="review schema, review schema generator, json-ld generator, schema markup, structured data, product review schema, business review markup, star rating schema, review snippet" />
        <link rel="canonical" href="https://superschema.ai/review-schema-generator" />

        {/* Open Graph */}
        <meta property="og:title" content="Free Review Schema Generator | SuperSchema" />
        <meta property="og:description" content="Generate perfect Review schema markup for any reviewable item. Free tool supporting products, businesses, books, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://superschema.ai/review-schema-generator" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Review Schema Generator | SuperSchema" />
        <meta name="twitter:description" content="Generate perfect Review schema markup in seconds. Free tool for product reviews, business reviews, and all review types." />

        {/* Structured Data for the page itself */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Review Schema Generator",
            "description": "Free tool to generate Review schema markup for products, businesses, books, movies, and more",
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
        <SchemaGeneratorNav />

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
                Free Review Schema Generator
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Create perfect Review JSON-LD schema markup in seconds. Generate Google-compliant review markup for products, businesses, books, movies, and 17+ item types.
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Google-Compliant Markup</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>17+ Item Types</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Star Rating Support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Rich Snippet Ready</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Google Guidelines Info Box */}
              <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center text-amber-900 dark:text-amber-100">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Important Google Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <li>• Reviews must be about a <strong>specific item</strong>, not a category (e.g., "iPhone 15 Pro" not "smartphones")</li>
                  <li>• Reviews should be <strong>genuinely sourced from users</strong> or legitimate critics</li>
                  <li>• <strong>Self-reviews are prohibited</strong> - you cannot review your own business/products on your own website</li>
                  <li>• Author name must be a <strong>valid name under 100 characters</strong></li>
                  <li>• Reviews should include both <strong>body text and author name</strong></li>
                  <li>• Do not aggregate reviews from other websites without proper sourcing</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
                <div className="space-y-8">

                  {/* Item Being Reviewed */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Item Being Reviewed
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type of Item
                      </label>
                      <select
                        value={formData.itemType}
                        onChange={(e) => updateField('itemType', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {REVIEWABLE_ITEM_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose the type that best describes what you're reviewing
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Item Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.itemName}
                        onChange={(e) => updateField('itemName', e.target.value)}
                        placeholder="e.g., iPhone 15 Pro, The Great Gatsby, Joe's Pizza"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        The specific name of the item being reviewed
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Item URL
                      </label>
                      <input
                        type="url"
                        value={formData.itemUrl}
                        onChange={(e) => updateField('itemUrl', e.target.value)}
                        placeholder="https://www.example.com/product"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Link to the item's page
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Item Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.itemImageUrl}
                        onChange={(e) => updateField('itemImageUrl', e.target.value)}
                        placeholder="https://www.example.com/image.jpg"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Review Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Review Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Review Title / Headline
                      </label>
                      <input
                        type="text"
                        value={formData.reviewTitle}
                        onChange={(e) => updateField('reviewTitle', e.target.value)}
                        placeholder="Great product! Highly recommend"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Review Body <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={formData.reviewBody}
                        onChange={(e) => updateField('reviewBody', e.target.value)}
                        placeholder="I've been using this product for 3 months and it's exceeded my expectations in every way..."
                        rows={6}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        The actual review content
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Date Published
                      </label>
                      <input
                        type="date"
                        value={formData.datePublished}
                        onChange={(e) => updateField('datePublished', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        When this review was published
                      </p>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Author Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Author Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.authorName}
                        onChange={(e) => updateField('authorName', e.target.value)}
                        placeholder="Jane Smith"
                        maxLength={100}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Must be under 100 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Author Type
                      </label>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="Person"
                            checked={formData.authorType === 'Person'}
                            onChange={(e) => updateField('authorType', e.target.value)}
                            className="mr-2"
                          />
                          <span>Person</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="Organization"
                            checked={formData.authorType === 'Organization'}
                            onChange={(e) => updateField('authorType', e.target.value)}
                            className="mr-2"
                          />
                          <span>Organization</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Author URL
                      </label>
                      <input
                        type="url"
                        value={formData.authorUrl}
                        onChange={(e) => updateField('authorUrl', e.target.value)}
                        placeholder="https://www.example.com/author/jane-smith"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Author's profile or website
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Rating
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Rating Value <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.ratingValue}
                          onChange={(e) => updateField('ratingValue', e.target.value)}
                          placeholder="4.5"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Best Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.bestRating}
                          onChange={(e) => updateField('bestRating', e.target.value)}
                          placeholder="5"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Worst Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.worstRating}
                          onChange={(e) => updateField('worstRating', e.target.value)}
                          placeholder="1"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Common scale is 1-5 stars. Rating value must be between worst and best rating.
                    </p>
                  </div>

                  {/* Optional Fields */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Additional Details (Optional)
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Review Aspect
                      </label>
                      <input
                        type="text"
                        value={formData.reviewAspect}
                        onChange={(e) => updateField('reviewAspect', e.target.value)}
                        placeholder="e.g., Quality, Value for Money, Customer Service, Ease of Use"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Which specific aspect of the item this review focuses on
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Positive Notes (Pros)
                      </label>
                      <textarea
                        value={formData.positiveNotes}
                        onChange={(e) => updateField('positiveNotes', e.target.value)}
                        placeholder="What was good about the item..."
                        rows={3}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Negative Notes (Cons)
                      </label>
                      <textarea
                        value={formData.negativeNotes}
                        onChange={(e) => updateField('negativeNotes', e.target.value)}
                        placeholder="What could be improved..."
                        rows={3}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>

                  {/* Publisher */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Publisher (Optional)
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Publisher Name
                      </label>
                      <input
                        type="text"
                        value={formData.publisherName}
                        onChange={(e) => updateField('publisherName', e.target.value)}
                        placeholder="Tech Review Magazine"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        The organization or website publishing this review
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Publisher Type
                      </label>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="Organization"
                            checked={formData.publisherType === 'Organization'}
                            onChange={(e) => updateField('publisherType', e.target.value)}
                            className="mr-2"
                          />
                          <span>Organization</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="Person"
                            checked={formData.publisherType === 'Person'}
                            onChange={(e) => updateField('publisherType', e.target.value)}
                            className="mr-2"
                          />
                          <span>Person</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4">
                    <button
                      onClick={generateSchema}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-lg"
                    >
                      Generate Review Schema
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
                  <h2 className="text-3xl font-bold mb-6 text-center">Your Review Schema</h2>

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
                        <li>Paste it in the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> section of the page containing the review</li>
                        <li>Place it before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag</li>
                        <li>Validate using Google's Rich Results Test</li>
                        <li>Monitor for rich snippet appearance in search results</li>
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
                Everything you need to know about Review schema markup
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
                Compare your options for creating Review schema markup
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
                    <li>⏱️ Complex nested objects</li>
                    <li>🐛 Easy to miss required fields</li>
                    <li>📚 Rating structure complexity</li>
                    <li>🔄 Manual updates for each review</li>
                    <li>❌ Prone to validation errors</li>
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
                    <li>⚡ Instant schema generation</li>
                    <li>✅ Google-compliant markup</li>
                    <li>🎯 17+ item types supported</li>
                    <li>⭐ Star rating validation</li>
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
                    <li>🤖 AI-powered review extraction</li>
                    <li>🔄 Automatic aggregation</li>
                    <li>🚀 Direct CMS integration</li>
                    <li>📊 Review analytics & tracking</li>
                    <li>👥 Multi-review management</li>
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
              <h2 className="text-3xl font-bold mb-4">Ready for Automated Review Management?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                SuperSchema automatically generates and manages review schema markup across your website, including aggregate ratings, multi-review pages, and seamless integration with your review platform.
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
