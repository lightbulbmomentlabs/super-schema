import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Download, Copy, Check, Star, DollarSign, Package, ChevronRight } from 'lucide-react'

interface ProductFormData {
  name: string
  description: string
  images: string
  brandName: string
  sku: string
  mpn: string

  // Offers
  price: string
  priceCurrency: string
  availability: string
  offerUrl: string
  priceValidUntil: string

  // Ratings
  aggregateRatingValue: string
  aggregateRatingBest: string
  reviewCount: string

  // Optional review
  reviewText: string
  reviewRating: string
  reviewAuthor: string

  // Additional
  condition: string
  gtin: string
}

export default function ProductSchemaGeneratorPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    images: '',
    brandName: '',
    sku: '',
    mpn: '',
    price: '',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    offerUrl: '',
    priceValidUntil: '',
    aggregateRatingValue: '',
    aggregateRatingBest: '5',
    reviewCount: '',
    reviewText: '',
    reviewRating: '',
    reviewAuthor: '',
    condition: 'https://schema.org/NewCondition',
    gtin: ''
  })

  const [generatedSchema, setGeneratedSchema] = useState('')
  const [copied, setCopied] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    generateSchema()
  }, [formData])

  const validateUrl = (url: string): boolean => {
    if (!url) return true // Empty is valid (optional field)
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validatePrice = (price: string): boolean => {
    if (!price) return true
    return /^\d+(\.\d{1,2})?$/.test(price)
  }

  const generateSchema = () => {
    const errors: string[] = []

    // Validation
    if (!formData.name.trim()) {
      errors.push('Product name is required')
    }

    if (!formData.price.trim()) {
      errors.push('Price is required')
    } else if (!validatePrice(formData.price)) {
      errors.push('Price must be a valid number (e.g., 29.99)')
    }

    // Validate image URLs
    const imageUrls = formData.images
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    const invalidImageUrls = imageUrls.filter(url => !validateUrl(url))
    if (invalidImageUrls.length > 0) {
      errors.push('One or more image URLs are invalid')
    }

    if (formData.offerUrl && !validateUrl(formData.offerUrl)) {
      errors.push('Offer URL is invalid')
    }

    setValidationErrors(errors)

    // Don't generate schema if there are critical errors
    if (errors.length > 0) {
      setGeneratedSchema('')
      return
    }

    // Build schema object
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
    const validImageUrls = imageUrls.filter(url => validateUrl(url))
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

    // Add SKU if provided
    if (formData.sku.trim()) {
      schema.sku = formData.sku.trim()
    }

    // Add MPN if provided
    if (formData.mpn.trim()) {
      schema.mpn = formData.mpn.trim()
    }

    // Add GTIN if provided
    if (formData.gtin.trim()) {
      schema.gtin = formData.gtin.trim()
    }

    // Add offers (required for rich results)
    if (formData.price.trim()) {
      const offer: any = {
        "@type": "Offer",
        "price": formData.price.trim(),
        "priceCurrency": formData.priceCurrency
      }

      if (formData.availability) {
        offer.availability = formData.availability
      }

      if (formData.offerUrl && validateUrl(formData.offerUrl)) {
        offer.url = formData.offerUrl.trim()
      }

      if (formData.priceValidUntil) {
        offer.priceValidUntil = formData.priceValidUntil
      }

      if (formData.condition) {
        offer.itemCondition = formData.condition
      }

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

    // Generate the complete script tag
    const schemaJson = JSON.stringify(schema, null, 2)
    const scriptTag = `<script type="application/ld+json">
${schemaJson}
</script>`

    setGeneratedSchema(scriptTag)
  }

  const handleCopy = async () => {
    if (generatedSchema) {
      await navigator.clipboard.writeText(generatedSchema)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (generatedSchema) {
      const blob = new Blob([generatedSchema], { type: 'application/ld+json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'product-schema.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // FAQ Schema for the educational section
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Product Schema?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Product schema is structured data markup that helps search engines understand product information on your website. It uses the schema.org Product type to provide details about products including name, price, availability, ratings, and images."
        }
      },
      {
        "@type": "Question",
        "name": "Why is Product Schema important for e-commerce SEO?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Product schema enables rich snippets in search results, displaying price, availability, star ratings, and images directly in Google search. This increases click-through rates, improves visibility, and helps customers make purchase decisions before clicking through to your site."
        }
      },
      {
        "@type": "Question",
        "name": "What are the required properties for Product schema?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For Product schema, you need the product name and at least one of the following: offers (with price and availability), review, or aggregateRating. Google recommends including as many properties as possible including images, brand, SKU, and detailed offer information."
        }
      },
      {
        "@type": "Question",
        "name": "How do I add Product schema to my website?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Copy the generated JSON-LD code (including the script tags) and paste it into the HTML of your product page, preferably in the <head> section or just before the closing </body> tag. The schema should be included on every product page."
        }
      },
      {
        "@type": "Question",
        "name": "What's the difference between Product snippets and Merchant listings?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Product snippets are for informational product pages where direct purchase isn't possible, while Merchant listings are for pages where customers can directly purchase products. Merchant listings support additional properties like shipping details, return policy, and apparel sizing information."
        }
      },
      {
        "@type": "Question",
        "name": "Can Product schema display star ratings in search results?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, when you include aggregateRating or review properties in your Product schema, Google can display star ratings in search results. This requires valid rating data with ratingValue, bestRating, and reviewCount (for aggregateRating)."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need both review and aggregateRating properties?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, you only need one for rich results eligibility, but including both is recommended when available. aggregateRating shows overall product ratings, while individual reviews provide specific customer feedback. Both enhance your rich snippet appearance."
        }
      },
      {
        "@type": "Question",
        "name": "How can I test my Product schema markup?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Use Google's Rich Results Test tool to validate your Product schema. Simply paste your URL or the schema code, and Google will show you if it's eligible for rich results and highlight any errors or warnings that need fixing."
        }
      }
    ]
  }

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
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

  return (
    <>
      <Helmet>
        <title>Free Product Schema Generator | Create Product Schema Markup</title>
        <meta name="description" content="Free Product schema generator for e-commerce SEO. Create valid JSON-LD Product schema markup with prices, ratings, and availability. Improve your rich snippets instantly." />
        <link rel="canonical" href="https://superschema.io/product-schema-generator" />
        <meta property="og:title" content="Free Product Schema Generator | Create Product Schema Markup" />
        <meta property="og:description" content="Generate Product schema markup for e-commerce SEO. Add prices, ratings, and availability to get rich snippets in Google search results." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://superschema.io/product-schema-generator" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full mb-6">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Free E-commerce SEO Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free Product Schema Generator
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Create valid Product schema markup to display prices, ratings, and availability in Google search results. Improve your e-commerce SEO instantly.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-card rounded-lg shadow-lg p-6 border">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                Product Information
              </h2>

              <form className="space-y-6">
                {/* Core Product Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Core Information</h3>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Executive Anvil"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for..."
                    />
                  </div>

                  <div>
                    <label htmlFor="images" className="block text-sm font-medium mb-2">
                      Image URLs (comma-separated for multiple)
                    </label>
                    <textarea
                      id="images"
                      value={formData.images}
                      onChange={(e) => handleInputChange('images', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="https://example.com/product.jpg, https://example.com/product-2.jpg"
                    />
                  </div>

                  <div>
                    <label htmlFor="brandName" className="block text-sm font-medium mb-2">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      id="brandName"
                      value={formData.brandName}
                      onChange={(e) => handleInputChange('brandName', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="ACME"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sku" className="block text-sm font-medium mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0446310786"
                      />
                    </div>

                    <div>
                      <label htmlFor="mpn" className="block text-sm font-medium mb-2">
                        MPN
                      </label>
                      <input
                        type="text"
                        id="mpn"
                        value={formData.mpn}
                        onChange={(e) => handleInputChange('mpn', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="925872"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gtin" className="block text-sm font-medium mb-2">
                      GTIN/UPC/EAN
                    </label>
                    <input
                      type="text"
                      id="gtin"
                      value={formData.gtin}
                      onChange={(e) => handleInputChange('gtin', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="00000000000000"
                    />
                  </div>
                </div>

                {/* Offers Section */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Offer Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium mb-2">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="price"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="119.99"
                      />
                    </div>

                    <div>
                      <label htmlFor="priceCurrency" className="block text-sm font-medium mb-2">
                        Currency
                      </label>
                      <select
                        id="priceCurrency"
                        value={formData.priceCurrency}
                        onChange={(e) => handleInputChange('priceCurrency', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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

                  <div>
                    <label htmlFor="availability" className="block text-sm font-medium mb-2">
                      Availability
                    </label>
                    <select
                      id="availability"
                      value={formData.availability}
                      onChange={(e) => handleInputChange('availability', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="https://schema.org/NewCondition">New</option>
                      <option value="https://schema.org/UsedCondition">Used</option>
                      <option value="https://schema.org/RefurbishedCondition">Refurbished</option>
                      <option value="https://schema.org/DamagedCondition">Damaged</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="offerUrl" className="block text-sm font-medium mb-2">
                      Offer URL
                    </label>
                    <input
                      type="url"
                      id="offerUrl"
                      value={formData.offerUrl}
                      onChange={(e) => handleInputChange('offerUrl', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="https://example.com/products/executive-anvil"
                    />
                  </div>

                  <div>
                    <label htmlFor="priceValidUntil" className="block text-sm font-medium mb-2">
                      Price Valid Until
                    </label>
                    <input
                      type="date"
                      id="priceValidUntil"
                      value={formData.priceValidUntil}
                      onChange={(e) => handleInputChange('priceValidUntil', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Rating Section */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Ratings & Reviews
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="aggregateRatingValue" className="block text-sm font-medium mb-2">
                        Rating Value
                      </label>
                      <input
                        type="text"
                        id="aggregateRatingValue"
                        value={formData.aggregateRatingValue}
                        onChange={(e) => handleInputChange('aggregateRatingValue', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="4.4"
                      />
                    </div>

                    <div>
                      <label htmlFor="aggregateRatingBest" className="block text-sm font-medium mb-2">
                        Best Rating
                      </label>
                      <input
                        type="text"
                        id="aggregateRatingBest"
                        value={formData.aggregateRatingBest}
                        onChange={(e) => handleInputChange('aggregateRatingBest', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <label htmlFor="reviewCount" className="block text-sm font-medium mb-2">
                        Review Count
                      </label>
                      <input
                        type="text"
                        id="reviewCount"
                        value={formData.reviewCount}
                        onChange={(e) => handleInputChange('reviewCount', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="89"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm font-medium mb-3 text-muted-foreground">Individual Review (Optional)</p>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="reviewText" className="block text-sm font-medium mb-2">
                          Review Text
                        </label>
                        <textarea
                          id="reviewText"
                          value={formData.reviewText}
                          onChange={(e) => handleInputChange('reviewText', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Great product, highly recommended!"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="reviewRating" className="block text-sm font-medium mb-2">
                            Review Rating
                          </label>
                          <input
                            type="text"
                            id="reviewRating"
                            value={formData.reviewRating}
                            onChange={(e) => handleInputChange('reviewRating', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="5"
                          />
                        </div>

                        <div>
                          <label htmlFor="reviewAuthor" className="block text-sm font-medium mb-2">
                            Review Author
                          </label>
                          <input
                            type="text"
                            id="reviewAuthor"
                            value={formData.reviewAuthor}
                            onChange={(e) => handleInputChange('reviewAuthor', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h3 className="font-semibold text-destructive mb-2">Validation Errors</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generated Schema */}
              <div className="bg-card rounded-lg shadow-lg p-6 border">
                <h2 className="text-2xl font-bold mb-4">Your Product Schema Markup</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy the complete code below (including the <code className="bg-secondary px-1 py-0.5 rounded">&lt;script&gt;</code> tags) and paste it into your website's HTML.
                </p>

                <div className="relative">
                  <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm max-h-[500px] overflow-y-auto">
                    <code>{generatedSchema || '// Fill out the form to generate your schema'}</code>
                  </pre>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCopy}
                    disabled={!generatedSchema}
                    className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!generatedSchema}
                    className="flex-1 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON
                  </button>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Quick Tips</h3>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Include at least one: price, rating, or review</li>
                  <li>• Add multiple product images for better visibility</li>
                  <li>• Use aggregateRating to show star ratings in search</li>
                  <li>• Test your schema with Google Rich Results Test</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((faq, index) => (
                <div key={index} className="bg-card rounded-lg p-6 shadow-md border">
                  <h3 className="text-xl font-semibold mb-3">{faq.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Section */}
          <div className="mt-16 bg-card rounded-lg shadow-lg p-8 border">
            <h2 className="text-3xl font-bold mb-8 text-center">Free Tool vs SuperSchema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Free Generator
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Instant client-side generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Complete script tags included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>No sign-up required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Multiple images support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">✗</span>
                    <span>Manual implementation required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">✗</span>
                    <span>One product at a time</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  SuperSchema
                </h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Automatic schema detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Bulk product schema generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>E-commerce platform integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Automatic updates when products change</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Multi-product support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Schema validation & monitoring</span>
                  </li>
                </ul>
                <a
                  href="/sign-up"
                  className="block w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-center"
                >
                  Try SuperSchema Free
                </a>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-lg p-8 text-center text-primary-foreground">
            <h2 className="text-2xl font-bold mb-4">Ready to Automate Your Product Schema?</h2>
            <p className="text-lg mb-6 text-primary-foreground/90">
              Stop manually creating schema for every product. Let SuperSchema handle it automatically for your entire catalog.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/sign-up"
                className="bg-white text-primary px-8 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              >
                Get Started Free
                <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href="/docs"
                className="bg-primary-foreground/10 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/20"
              >
                See How It Works
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
