import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Copy, Download, CheckCircle, ArrowRight, Sparkles, Zap, Clock, Target, Info, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SchemaGeneratorNav from '@/components/SchemaGeneratorNav'
import FAQItem from '@/components/FAQItem'
import toast from 'react-hot-toast'

interface OpeningHoursDay {
  dayOfWeek: string
  opens: string
  closes: string
  is24Hours: boolean
  isClosed: boolean
}

interface LocalBusinessFormData {
  businessType: string
  name: string
  description: string
  telephone: string
  url: string
  priceRange: string

  // Address
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string

  // Geo
  latitude: string
  longitude: string

  // Opening Hours
  openingHoursDays: OpeningHoursDay[]

  // Restaurant-specific
  servesCuisine: string
  menuUrl: string

  // Rating
  aggregateRatingValue: string
  reviewCount: string
}

const BUSINESS_TYPES = [
  { value: 'LocalBusiness', label: 'Local Business (Generic)' },
  { value: 'AnimalShelter', label: 'Animal Shelter' },
  { value: 'AutomotiveBusiness', label: 'Automotive Business' },
  { value: 'ChildCare', label: 'Child Care' },
  { value: 'Dentist', label: 'Dentist' },
  { value: 'DryCleaningOrLaundry', label: 'Dry Cleaning / Laundry' },
  { value: 'EmergencyService', label: 'Emergency Service' },
  { value: 'EmploymentAgency', label: 'Employment Agency' },
  { value: 'EntertainmentBusiness', label: 'Entertainment Business' },
  { value: 'FinancialService', label: 'Financial Service' },
  { value: 'FoodEstablishment', label: 'Food Establishment' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Bakery', label: 'Bakery' },
  { value: 'BarOrPub', label: 'Bar / Pub' },
  { value: 'Cafe', label: 'Cafe / Coffee Shop' },
  { value: 'GovernmentOffice', label: 'Government Office' },
  { value: 'HealthAndBeautyBusiness', label: 'Health & Beauty Business' },
  { value: 'BeautySalon', label: 'Beauty Salon' },
  { value: 'DaySpa', label: 'Day Spa' },
  { value: 'HairSalon', label: 'Hair Salon' },
  { value: 'HealthClub', label: 'Health Club / Gym' },
  { value: 'NailSalon', label: 'Nail Salon' },
  { value: 'TattooParlor', label: 'Tattoo Parlor' },
  { value: 'HomeAndConstructionBusiness', label: 'Home & Construction Business' },
  { value: 'Electrician', label: 'Electrician' },
  { value: 'GeneralContractor', label: 'General Contractor' },
  { value: 'HousePainter', label: 'House Painter' },
  { value: 'Locksmith', label: 'Locksmith' },
  { value: 'MovingCompany', label: 'Moving Company' },
  { value: 'Plumber', label: 'Plumber' },
  { value: 'RoofingContractor', label: 'Roofing Contractor' },
  { value: 'InternetCafe', label: 'Internet Cafe' },
  { value: 'LegalService', label: 'Legal Service / Attorney' },
  { value: 'Library', label: 'Library' },
  { value: 'LodgingBusiness', label: 'Lodging Business / Hotel' },
  { value: 'MedicalBusiness', label: 'Medical Business' },
  { value: 'Dentist', label: 'Dentist' },
  { value: 'MedicalClinic', label: 'Medical Clinic' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Physician', label: 'Physician' },
  { value: 'ProfessionalService', label: 'Professional Service' },
  { value: 'RadioStation', label: 'Radio Station' },
  { value: 'RealEstateAgent', label: 'Real Estate Agent' },
  { value: 'RecyclingCenter', label: 'Recycling Center' },
  { value: 'SelfStorage', label: 'Self Storage' },
  { value: 'ShoppingCenter', label: 'Shopping Center' },
  { value: 'SportsActivityLocation', label: 'Sports Activity Location' },
  { value: 'Store', label: 'Store / Retail Shop' },
  { value: 'TelevisionStation', label: 'Television Station' },
  { value: 'TouristInformationCenter', label: 'Tourist Information Center' },
  { value: 'TravelAgency', label: 'Travel Agency' }
]

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Monday', short: 'Mo' },
  { value: 'Tuesday', label: 'Tuesday', short: 'Tu' },
  { value: 'Wednesday', label: 'Wednesday', short: 'We' },
  { value: 'Thursday', label: 'Thursday', short: 'Th' },
  { value: 'Friday', label: 'Friday', short: 'Fr' },
  { value: 'Saturday', label: 'Saturday', short: 'Sa' },
  { value: 'Sunday', label: 'Sunday', short: 'Su' }
]

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'IE', label: 'Ireland' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'PT', label: 'Portugal' },
  { value: 'GR', label: 'Greece' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'MX', label: 'Mexico' },
  { value: 'BR', label: 'Brazil' },
  { value: 'AR', label: 'Argentina' },
  { value: 'ZA', label: 'South Africa' }
]

export default function LocalBusinessSchemaGeneratorPage() {
  const [formData, setFormData] = useState<LocalBusinessFormData>({
    businessType: 'LocalBusiness',
    name: '',
    description: '',
    telephone: '',
    url: '',
    priceRange: '',
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: 'US',
    latitude: '',
    longitude: '',
    openingHoursDays: DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day.value,
      opens: '09:00',
      closes: '17:00',
      is24Hours: false,
      isClosed: false
    })),
    servesCuisine: '',
    menuUrl: '',
    aggregateRatingValue: '',
    reviewCount: ''
  })

  const [generatedSchema, setGeneratedSchema] = useState<string>('')
  const [showOutput, setShowOutput] = useState(false)
  const [copied, setCopied] = useState(false)

  // Update form field
  const updateField = (field: keyof LocalBusinessFormData, value: string | string[] | OpeningHoursDay[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Update opening hours for a specific day
  const updateOpeningHours = (index: number, field: keyof OpeningHoursDay, value: string | boolean) => {
    const newOpeningHours = [...formData.openingHoursDays]
    newOpeningHours[index] = { ...newOpeningHours[index], [field]: value }
    setFormData(prev => ({ ...prev, openingHoursDays: newOpeningHours }))
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

  // Validate form
  const validateForm = (): boolean => {
    // Required fields
    if (!formData.name.trim()) {
      toast.error('Business name is required')
      return false
    }

    if (!formData.streetAddress.trim()) {
      toast.error('Street address is required')
      return false
    }

    if (!formData.addressLocality.trim()) {
      toast.error('City is required')
      return false
    }

    if (!formData.addressRegion.trim()) {
      toast.error('State/Region is required')
      return false
    }

    if (!formData.postalCode.trim()) {
      toast.error('Postal code is required')
      return false
    }

    // Validate URLs
    if (formData.url && !isValidUrl(formData.url)) {
      toast.error('Website URL is not valid')
      return false
    }

    if (formData.menuUrl && !isValidUrl(formData.menuUrl)) {
      toast.error('Menu URL is not valid')
      return false
    }

    return true
  }

  // Generate schema
  const generateSchema = () => {
    if (!validateForm()) return

    const schema: any = {
      "@context": "https://schema.org",
      "@type": formData.businessType,
      "name": formData.name.trim(),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": formData.streetAddress.trim(),
        "addressLocality": formData.addressLocality.trim(),
        "addressRegion": formData.addressRegion.trim(),
        "postalCode": formData.postalCode.trim(),
        "addressCountry": formData.addressCountry
      }
    }

    // Add optional basic fields
    if (formData.description.trim()) schema.description = formData.description.trim()
    if (formData.telephone.trim()) schema.telephone = formData.telephone.trim()
    if (formData.url.trim()) schema.url = formData.url.trim()
    if (formData.priceRange) schema.priceRange = formData.priceRange

    // Add geo coordinates if provided
    if (formData.latitude.trim() && formData.longitude.trim()) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": formData.latitude.trim(),
        "longitude": formData.longitude.trim()
      }
    }

    // Add opening hours
    const activeHours = formData.openingHoursDays.filter(day => !day.isClosed)
    if (activeHours.length > 0) {
      schema.openingHoursSpecification = activeHours.map(day => {
        const spec: any = {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": day.dayOfWeek
        }

        if (day.is24Hours) {
          spec.opens = "00:00"
          spec.closes = "23:59"
        } else {
          spec.opens = day.opens
          spec.closes = day.closes
        }

        return spec
      })
    }

    // Add restaurant-specific fields
    if (formData.businessType === 'Restaurant' || formData.businessType === 'FoodEstablishment') {
      if (formData.servesCuisine.trim()) schema.servesCuisine = formData.servesCuisine.trim()
      if (formData.menuUrl.trim()) schema.hasMenu = formData.menuUrl.trim()
    }

    // Add aggregateRating if provided
    if (formData.aggregateRatingValue && formData.reviewCount) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": formData.aggregateRatingValue,
        "reviewCount": formData.reviewCount
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

    toast.success('LocalBusiness Schema generated successfully!')
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
    a.download = 'localbusiness-schema.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded LocalBusiness schema!')
  }

  // Check if restaurant type
  const isRestaurantType = ['Restaurant', 'FoodEstablishment', 'Bakery', 'BarOrPub', 'Cafe'].includes(formData.businessType)

  // Educational FAQ content
  const educationalFAQs = [
    {
      question: "What is LocalBusiness Schema?",
      answer: "LocalBusiness schema is structured data markup that helps search engines understand information about brick-and-mortar businesses with physical locations. It uses the schema.org LocalBusiness type to provide details including business name, address, phone number, opening hours, and geographic coordinates. When properly implemented, it enhances your local SEO and helps your business appear in local search results, Google Maps, and the Local Pack."
    },
    {
      question: "Why is LocalBusiness Schema important for local SEO?",
      answer: "LocalBusiness schema is crucial for local SEO because it helps search engines accurately understand and display your business information in local search results. It improves your chances of appearing in the Google Local Pack (the map with 3 business listings), enhances your Google Business Profile, and provides rich snippets showing hours, ratings, and contact info directly in search results. In 2025, proper LocalBusiness schema is essential for competing in local search and can significantly increase foot traffic and phone calls to your business."
    },
    {
      question: "What are the required properties for LocalBusiness schema?",
      answer: "For LocalBusiness schema, Google requires the business name and a complete postal address (street address, city, state/region, postal code, and country). While not strictly required, Google strongly recommends including telephone number, website URL, geographic coordinates (latitude/longitude), opening hours, and business type (e.g., Restaurant, Store, Dentist). The more complete your schema, the better your local SEO performance."
    },
    {
      question: "How do I add LocalBusiness schema to my website?",
      answer: "Copy the generated JSON-LD code (including the script tags) and paste it into the HTML of your website's homepage or location page, preferably in the <head> section or just before the closing </body> tag. For multi-location businesses, add unique LocalBusiness schema to each location page. If you're using WordPress, many SEO plugins like Yoast or RankMath can help you add LocalBusiness schema without editing code."
    },
    {
      question: "What's the difference between LocalBusiness types (Restaurant, Store, etc.)?",
      answer: "LocalBusiness is the generic type, but Google recommends using the most specific subtype that matches your business. For example, use Restaurant for restaurants, Store for retail shops, Dentist for dental practices, or BeautySalon for beauty salons. Using specific types enables additional properties (like servesCuisine for restaurants or hasMenu) and helps search engines better understand and categorize your business for more relevant local search results."
    },
    {
      question: "Do I need geographic coordinates (latitude/longitude) for LocalBusiness schema?",
      answer: "While not strictly required, geographic coordinates are highly recommended for LocalBusiness schema. Latitude and longitude help search engines precisely locate your business on maps and improve accuracy in local search results. You can easily find your coordinates by searching your business address on Google Maps, right-clicking the location marker, and selecting the coordinates that appear. Include them in your schema for the best results."
    },
    {
      question: "How do I format opening hours for LocalBusiness schema?",
      answer: "Opening hours use the OpeningHoursSpecification format with dayOfWeek (Monday-Sunday), opens time (HH:MM format like 09:00), and closes time (17:00). You can specify different hours for different days. For businesses open 24 hours, use opens: '00:00' and closes: '23:59'. For days you're closed, simply omit that day from the schema. You can also specify seasonal hours or special holiday hours with validFrom and validThrough dates."
    },
    {
      question: "Will LocalBusiness schema help my Google Business Profile ranking?",
      answer: "LocalBusiness schema complements your Google Business Profile but doesn't directly replace it. Both are important: your Google Business Profile is managed through Google My Business and appears in Google Maps, while LocalBusiness schema is on your website and helps search engines understand your business information. Having consistent information in both places strengthens your local SEO signals and improves your overall local search visibility and ranking in 2025."
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
        <title>Free LocalBusiness Schema Generator | Create Local Business Markup</title>
        <meta
          name="description"
          content="Generate valid LocalBusiness schema markup in seconds with our free tool. Create SEO-optimized JSON-LD structured data for local businesses, restaurants, and stores."
        />
        <meta name="keywords" content="local business schema generator, localbusiness markup, JSON-LD local business, local SEO schema, google business schema, restaurant schema" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://superschema.io/localbusiness-schema-generator" />

        {/* Open Graph / Social Media Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free LocalBusiness Schema Generator - Create Local Business Markup" />
        <meta property="og:description" content="Generate valid LocalBusiness schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data for local businesses." />
        <meta property="og:url" content="https://superschema.io/localbusiness-schema-generator" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free LocalBusiness Schema Generator - Create Local Business Markup" />
        <meta name="twitter:description" content="Generate valid LocalBusiness schema markup in seconds. Free tool for creating SEO-optimized JSON-LD structured data." />

        {/* Structured Data - FAQ Schema for this page */}
        <script type="application/ld+json">
          {JSON.stringify(pageFAQSchema)}
        </script>

        {/* Structured Data - WebPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Free LocalBusiness Schema Generator",
            "description": "Generate valid LocalBusiness schema markup for your local business with our free, easy-to-use tool.",
            "url": "https://superschema.io/localbusiness-schema-generator",
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
                  "name": "LocalBusiness Schema Generator",
                  "item": "https://superschema.io/localbusiness-schema-generator"
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
            "name": "LocalBusiness Schema Generator",
            "applicationCategory": "DeveloperApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Free tool to generate valid LocalBusiness schema markup in JSON-LD format for local SEO and improved search visibility."
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
                Free LocalBusiness Schema Generator
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto">
                Create valid JSON-LD LocalBusiness schema markup for better local SEO, Google Maps visibility, and Local Pack rankings.
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

        {/* LocalBusiness Schema Builder Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Build Your LocalBusiness Schema</h2>
              <p className="text-muted-foreground mb-8">
                Fill in your business details below. Required fields are marked with an asterisk (*).
              </p>

              {/* Form */}
              <div className="space-y-8">
                {/* Business Type */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Business Type
                  </h3>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium mb-2">
                      Business Type <span className="text-muted-foreground text-xs">(Recommended)</span>
                    </label>
                    <select
                      id="businessType"
                      value={formData.businessType}
                      onChange={(e) => updateField('businessType', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      {BUSINESS_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select the most specific business type for better search results
                    </p>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Basic Information
                  </h3>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Business Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., Joe's Coffee Shop"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Description <span className="text-muted-foreground text-xs">(Recommended)</span>
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="A brief description of your business"
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="telephone" className="block text-sm font-medium mb-2">
                        Phone Number <span className="text-muted-foreground text-xs">(Recommended)</span>
                      </label>
                      <input
                        id="telephone"
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => updateField('telephone', e.target.value)}
                        placeholder="e.g., +1-555-123-4567"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="url" className="block text-sm font-medium mb-2">
                        Website URL <span className="text-muted-foreground text-xs">(Recommended)</span>
                      </label>
                      <input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => updateField('url', e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="priceRange" className="block text-sm font-medium mb-2">
                      Price Range <span className="text-muted-foreground text-xs">(Optional)</span>
                    </label>
                    <select
                      id="priceRange"
                      value={formData.priceRange}
                      onChange={(e) => updateField('priceRange', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="">Not specified</option>
                      <option value="$">$ - Inexpensive</option>
                      <option value="$$">$$ - Moderate</option>
                      <option value="$$$">$$$ - Expensive</option>
                      <option value="$$$$">$$$$ - Very Expensive</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Business Address
                  </h3>

                  <div>
                    <label htmlFor="streetAddress" className="block text-sm font-medium mb-2">
                      Street Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="streetAddress"
                      type="text"
                      value={formData.streetAddress}
                      onChange={(e) => updateField('streetAddress', e.target.value)}
                      placeholder="e.g., 123 Main Street"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="addressLocality" className="block text-sm font-medium mb-2">
                        City <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="addressLocality"
                        type="text"
                        value={formData.addressLocality}
                        onChange={(e) => updateField('addressLocality', e.target.value)}
                        placeholder="e.g., San Francisco"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="addressRegion" className="block text-sm font-medium mb-2">
                        State/Region <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="addressRegion"
                        type="text"
                        value={formData.addressRegion}
                        onChange={(e) => updateField('addressRegion', e.target.value)}
                        placeholder="e.g., CA"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium mb-2">
                        Postal Code <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => updateField('postalCode', e.target.value)}
                        placeholder="e.g., 94102"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="addressCountry" className="block text-sm font-medium mb-2">
                        Country <span className="text-destructive">*</span>
                      </label>
                      <select
                        id="addressCountry"
                        value={formData.addressCountry}
                        onChange={(e) => updateField('addressCountry', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        {COUNTRIES.map(country => (
                          <option key={country.value} value={country.value}>{country.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Geographic Coordinates */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Geographic Coordinates
                  </h3>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Highly recommended for accurate map placement. Find coordinates on Google Maps by right-clicking your location.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="latitude" className="block text-sm font-medium mb-2">
                        Latitude
                      </label>
                      <input
                        id="latitude"
                        type="text"
                        value={formData.latitude}
                        onChange={(e) => updateField('latitude', e.target.value)}
                        placeholder="e.g., 37.7749"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="longitude" className="block text-sm font-medium mb-2">
                        Longitude
                      </label>
                      <input
                        id="longitude"
                        type="text"
                        value={formData.longitude}
                        onChange={(e) => updateField('longitude', e.target.value)}
                        placeholder="e.g., -122.4194"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Opening Hours
                  </h3>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Specify your business hours for each day of the week.
                  </p>

                  <div className="space-y-3">
                    {formData.openingHoursDays.map((day, index) => (
                      <div key={day.dayOfWeek} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-muted/30 rounded-lg">
                        <div className="w-28 font-medium">
                          {DAYS_OF_WEEK[index].label}
                        </div>

                        <div className="flex-1 flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={day.isClosed}
                              onChange={(e) => updateOpeningHours(index, 'isClosed', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm">Closed</span>
                          </label>

                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={day.is24Hours}
                              onChange={(e) => updateOpeningHours(index, 'is24Hours', e.target.checked)}
                              disabled={day.isClosed}
                              className="mr-2"
                            />
                            <span className="text-sm">24 Hours</span>
                          </label>

                          {!day.isClosed && !day.is24Hours && (
                            <>
                              <input
                                type="time"
                                value={day.opens}
                                onChange={(e) => updateOpeningHours(index, 'opens', e.target.value)}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                              />
                              <span className="text-sm text-muted-foreground">to</span>
                              <input
                                type="time"
                                value={day.closes}
                                onChange={(e) => updateOpeningHours(index, 'closes', e.target.value)}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restaurant-specific fields */}
                {isRestaurantType && (
                  <div className="space-y-6 pt-6 border-t border-border">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Restaurant Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="servesCuisine" className="block text-sm font-medium mb-2">
                          Cuisine Type
                        </label>
                        <input
                          id="servesCuisine"
                          type="text"
                          value={formData.servesCuisine}
                          onChange={(e) => updateField('servesCuisine', e.target.value)}
                          placeholder="e.g., Italian, Mexican, American"
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="menuUrl" className="block text-sm font-medium mb-2">
                          Menu URL
                        </label>
                        <input
                          id="menuUrl"
                          type="url"
                          value={formData.menuUrl}
                          onChange={(e) => updateField('menuUrl', e.target.value)}
                          placeholder="https://example.com/menu"
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Ratings */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    Ratings & Reviews
                  </h3>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Add rating information to display star ratings in search results (optional but recommended).
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="aggregateRatingValue" className="block text-sm font-medium mb-2">
                        Average Rating
                      </label>
                      <input
                        id="aggregateRatingValue"
                        type="text"
                        value={formData.aggregateRatingValue}
                        onChange={(e) => updateField('aggregateRatingValue', e.target.value)}
                        placeholder="e.g., 4.5"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="reviewCount" className="block text-sm font-medium mb-2">
                        Number of Reviews
                      </label>
                      <input
                        id="reviewCount"
                        type="text"
                        value={formData.reviewCount}
                        onChange={(e) => updateField('reviewCount', e.target.value)}
                        placeholder="e.g., 127"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
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
                  Generate LocalBusiness Schema
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
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Your LocalBusiness Schema Markup</h2>
                  <p className="text-muted-foreground mb-6">
                    Copy the complete code below (including the <code className="text-sm bg-muted px-2 py-1 rounded">&lt;script&gt;</code> tags) and paste it into your website's HTML <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section.
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
                      <li>Paste it into your website's <code className="text-sm bg-muted px-2 py-1 rounded">&lt;head&gt;</code> section or footer</li>
                      <li>Test your implementation with <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Rich Results Test</a></li>
                      <li>Ensure all information matches what's on your website and Google Business Profile</li>
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
                Tired of filling out forms for every location? Let SuperSchema do it automatically.
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
                    <span className="text-muted-foreground">Manual field entry for each location</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">One location at a time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">Copy/paste for each location</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">LocalBusiness schema only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-muted-foreground mr-2">•</span>
                    <span className="text-muted-foreground">No Google Business Profile integration</span>
                  </li>
                </ul>
                <div className="text-center">
                  <p className="text-2xl font-bold">Free</p>
                  <p className="text-sm text-muted-foreground">Perfect for single locations</p>
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
                      <span>AI automatically extracts business details from your website</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multi-location business support</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Google Business Profile integration</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multiple schema types (LocalBusiness, Product, FAQ, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Automatic updates when business info changes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Real-time validation & monitoring</span>
                    </li>
                  </ul>

                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold">From $0.50/location</p>
                    <p className="text-sm opacity-90">Save hours on every business location</p>
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
                Frequently Asked Questions About LocalBusiness Schema
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about creating and implementing LocalBusiness schema markup
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
              Ready to Automate Your LocalBusiness Schema?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Stop filling out forms manually. Let SuperSchema's AI analyze your business locations and generate perfect structured data automatically.
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
                  href="https://developers.google.com/search/docs/appearance/structured-data/local-business"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  LocalBusiness Schema Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
