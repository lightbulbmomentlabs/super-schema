import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle, Info, Copy, Download, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SchemaGeneratorNav from '@/components/SchemaGeneratorNav'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import FAQItem from '../components/FAQItem'

// Organization Types
const ORGANIZATION_TYPES = [
  { value: 'Organization', label: 'Organization (Generic)' },
  { value: 'Corporation', label: 'Corporation' },
  { value: 'EducationalOrganization', label: 'Educational Organization' },
  { value: 'GovernmentOrganization', label: 'Government Organization' },
  { value: 'NGO', label: 'NGO (Non-Governmental Organization)' },
  { value: 'LocalBusiness', label: 'Local Business' },
  { value: 'MedicalOrganization', label: 'Medical Organization' },
  { value: 'PerformingGroup', label: 'Performing Group' },
  { value: 'SportsOrganization', label: 'Sports Organization' },
  { value: 'Airline', label: 'Airline' },
  { value: 'Consortium', label: 'Consortium' },
  { value: 'FundingScheme', label: 'Funding Scheme' },
  { value: 'LibrarySystem', label: 'Library System' },
  { value: 'NewsMediaOrganization', label: 'News Media Organization' },
  { value: 'OnlineBusiness', label: 'Online Business' },
  { value: 'ResearchOrganization', label: 'Research Organization' },
  { value: 'WorkersUnion', label: 'Workers Union' }
]

// Countries
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'IE', label: 'Ireland' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'PT', label: 'Portugal' },
  { value: 'GR', label: 'Greece' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'AE', label: 'United Arab Emirates' }
]

// Contact Point Types
const CONTACT_POINT_TYPES = [
  { value: 'customer service', label: 'Customer Service' },
  { value: 'technical support', label: 'Technical Support' },
  { value: 'billing support', label: 'Billing Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'reservations', label: 'Reservations' },
  { value: 'credit card support', label: 'Credit Card Support' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'baggage tracking', label: 'Baggage Tracking' },
  { value: 'roadside assistance', label: 'Roadside Assistance' },
  { value: 'package tracking', label: 'Package Tracking' }
]

interface ContactPoint {
  contactType: string
  telephone: string
  email: string
  availableLanguage: string
}

interface OrganizationFormData {
  organizationType: string

  // Basic Information
  name: string
  legalName: string
  alternateName: string
  url: string
  logo: string
  description: string
  slogan: string

  // Contact Information
  email: string
  telephone: string
  faxNumber: string

  // Address
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string

  // Social Media (sameAs array)
  sameAsUrls: string[]

  // Organizational Details
  foundingDate: string
  founder: string
  numberOfEmployees: string
  taxID: string
  naicsCode: string
  dunsNumber: string

  // Contact Points
  contactPoints: ContactPoint[]
}

export default function OrganizationSchemaGeneratorPage() {
  const [formData, setFormData] = useState<OrganizationFormData>({
    organizationType: 'Organization',
    name: '',
    legalName: '',
    alternateName: '',
    url: '',
    logo: '',
    description: '',
    slogan: '',
    email: '',
    telephone: '',
    faxNumber: '',
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: 'US',
    sameAsUrls: [''],
    foundingDate: '',
    founder: '',
    numberOfEmployees: '',
    taxID: '',
    naicsCode: '',
    dunsNumber: '',
    contactPoints: []
  })

  const [generatedSchema, setGeneratedSchema] = useState<string>('')

  // Update field helper
  const updateField = (field: keyof OrganizationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Social Media URL management
  const addSameAsUrl = () => {
    setFormData(prev => ({
      ...prev,
      sameAsUrls: [...prev.sameAsUrls, '']
    }))
  }

  const removeSameAsUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sameAsUrls: prev.sameAsUrls.filter((_, i) => i !== index)
    }))
  }

  const updateSameAsUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      sameAsUrls: prev.sameAsUrls.map((url, i) => i === index ? value : url)
    }))
  }

  // Contact Point management
  const addContactPoint = () => {
    setFormData(prev => ({
      ...prev,
      contactPoints: [...prev.contactPoints, {
        contactType: 'customer service',
        telephone: '',
        email: '',
        availableLanguage: 'English'
      }]
    }))
  }

  const removeContactPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contactPoints: prev.contactPoints.filter((_, i) => i !== index)
    }))
  }

  const updateContactPoint = (index: number, field: keyof ContactPoint, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactPoints: prev.contactPoints.map((cp, i) =>
        i === index ? { ...cp, [field]: value } : cp
      )
    }))
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
    if (!formData.name.trim()) {
      toast.error('Organization name is required')
      return false
    }

    if (!formData.url.trim()) {
      toast.error('Organization URL is required')
      return false
    }

    if (!isValidUrl(formData.url.trim())) {
      toast.error('Please enter a valid URL for the organization website')
      return false
    }

    if (formData.logo.trim() && !isValidUrl(formData.logo.trim())) {
      toast.error('Please enter a valid URL for the logo')
      return false
    }

    return true
  }

  // Generate Schema
  const generateSchema = () => {
    if (!validateForm()) return

    const schema: any = {
      "@context": "https://schema.org",
      "@type": formData.organizationType,
      "name": formData.name.trim()
    }

    // Basic Information
    if (formData.legalName.trim()) schema.legalName = formData.legalName.trim()
    if (formData.alternateName.trim()) schema.alternateName = formData.alternateName.trim()
    schema.url = formData.url.trim()
    if (formData.logo.trim()) schema.logo = formData.logo.trim()
    if (formData.description.trim()) schema.description = formData.description.trim()
    if (formData.slogan.trim()) schema.slogan = formData.slogan.trim()

    // Contact Information
    if (formData.email.trim()) schema.email = formData.email.trim()
    if (formData.telephone.trim()) schema.telephone = formData.telephone.trim()
    if (formData.faxNumber.trim()) schema.faxNumber = formData.faxNumber.trim()

    // Address - only add if at least one field is filled
    const hasAddress = formData.streetAddress.trim() || formData.addressLocality.trim() ||
                      formData.addressRegion.trim() || formData.postalCode.trim()

    if (hasAddress) {
      const address: any = {
        "@type": "PostalAddress"
      }
      if (formData.streetAddress.trim()) address.streetAddress = formData.streetAddress.trim()
      if (formData.addressLocality.trim()) address.addressLocality = formData.addressLocality.trim()
      if (formData.addressRegion.trim()) address.addressRegion = formData.addressRegion.trim()
      if (formData.postalCode.trim()) address.postalCode = formData.postalCode.trim()
      address.addressCountry = formData.addressCountry

      schema.address = address
    }

    // Social Media (sameAs)
    const validSameAsUrls = formData.sameAsUrls
      .filter(url => url.trim() && isValidUrl(url.trim()))
      .map(url => url.trim())

    if (validSameAsUrls.length > 0) {
      schema.sameAs = validSameAsUrls
    }

    // Organizational Details
    if (formData.foundingDate.trim()) schema.foundingDate = formData.foundingDate.trim()
    if (formData.founder.trim()) schema.founder = formData.founder.trim()
    if (formData.numberOfEmployees.trim()) {
      schema.numberOfEmployees = {
        "@type": "QuantitativeValue",
        "value": formData.numberOfEmployees.trim()
      }
    }
    if (formData.taxID.trim()) schema.taxID = formData.taxID.trim()
    if (formData.naicsCode.trim()) schema.naics = formData.naicsCode.trim()
    if (formData.dunsNumber.trim()) schema.duns = formData.dunsNumber.trim()

    // Contact Points
    const validContactPoints = formData.contactPoints.filter(
      cp => cp.telephone.trim() || cp.email.trim()
    )

    if (validContactPoints.length > 0) {
      schema.contactPoint = validContactPoints.map(cp => {
        const point: any = {
          "@type": "ContactPoint",
          "contactType": cp.contactType
        }
        if (cp.telephone.trim()) point.telephone = cp.telephone.trim()
        if (cp.email.trim()) point.email = cp.email.trim()
        if (cp.availableLanguage.trim()) point.availableLanguage = cp.availableLanguage.trim()
        return point
      })
    }

    const schemaString = JSON.stringify(schema, null, 2)
    const fullSchema = `<script type="application/ld+json">\n${schemaString}\n</script>`
    setGeneratedSchema(fullSchema)

    toast.success('Organization Schema generated successfully!')
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
    a.download = 'organization-schema.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Schema downloaded!')
  }

  // Educational FAQs
  const educationalFAQs = [
    {
      question: "What is Organization schema markup?",
      answer: "Organization schema markup is structured data that helps search engines understand key information about your organization, including your name, logo, contact details, and social profiles. It's particularly important for establishing your brand's knowledge panel in Google Search results."
    },
    {
      question: "Why should I add Organization schema to my website?",
      answer: "Adding Organization schema helps Google create and enhance your Knowledge Panel, improves how your brand appears in search results, helps disambiguate your organization from others with similar names, and provides users with quick access to your contact information and social profiles directly in search results."
    },
    {
      question: "Where should I place Organization schema on my site?",
      answer: "Google recommends placing Organization schema on your homepage or 'About Us' page. You should only include this markup once per website, typically on the main page that represents your organization as a whole."
    },
    {
      question: "What's the difference between Organization and LocalBusiness schema?",
      answer: "Organization schema is broader and applies to any type of organization (corporations, NGOs, government agencies, etc.), while LocalBusiness is a subtype specifically for businesses with physical locations that serve local customers. LocalBusiness includes additional properties like opening hours and service areas that don't apply to all organizations."
    },
    {
      question: "How does Organization schema help with Google Knowledge Panels?",
      answer: "Organization schema provides Google with verified information about your company that can populate your Knowledge Panel, including your logo (which must be at least 112x112px), official name, description, social profiles, and contact details. This gives you more control over how your brand appears in search results."
    },
    {
      question: "What are sameAs URLs and why are they important?",
      answer: "The sameAs property is an array of URLs pointing to your official profiles on other websites (Facebook, Twitter, LinkedIn, Wikipedia, etc.). These help Google verify your organization's identity and can appear as clickable links in your Knowledge Panel, making it easier for users to find and follow you across platforms."
    },
    {
      question: "Should I include my organization's logo in the schema?",
      answer: "Yes! Including a logo URL is highly recommended as Google uses this to display your official logo in search results and Knowledge Panels. The logo should be at least 112x112 pixels, and Google recommends using a square or wide rectangle format. Make sure you have rights to use the logo you specify."
    },
    {
      question: "How can I validate my Organization schema markup?",
      answer: "Use Google's Rich Results Test (search.google.com/test/rich-results) or Schema Markup Validator (validator.schema.org) to check your markup for errors. These tools will identify any missing required properties, formatting issues, or invalid data types. Regular validation ensures your schema continues working as search engines update their requirements."
    }
  ]

  return (
    <>
      <Helmet>
        <title>Free Organization Schema Generator | Create Valid JSON-LD Markup</title>
        <meta name="description" content="Generate perfect Organization schema markup for your website in seconds. Free tool for corporations, NGOs, educational institutions, and all organization types. Improve your Google Knowledge Panel." />
        <meta name="keywords" content="organization schema, organization schema generator, json-ld generator, schema markup, structured data, knowledge panel, corporation schema, NGO schema, educational organization schema" />
        <link rel="canonical" href="https://superschema.ai/organization-schema-generator" />

        {/* Open Graph */}
        <meta property="og:title" content="Free Organization Schema Generator | SuperSchema" />
        <meta property="og:description" content="Generate perfect Organization schema markup for your website in seconds. Free tool for all organization types." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://superschema.ai/organization-schema-generator" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Organization Schema Generator | SuperSchema" />
        <meta name="twitter:description" content="Generate perfect Organization schema markup in seconds. Free tool for corporations, NGOs, and all organization types." />

        {/* Structured Data for the page itself */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Organization Schema Generator",
            "description": "Free tool to generate Organization schema markup for any type of organization",
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
                Free Organization Schema Generator
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Create perfect Organization JSON-LD schema markup in seconds. Enhance your Google Knowledge Panel and improve your brand's search presence.
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Google-Compliant Markup</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>15+ Organization Types</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Social Media Integration</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Contact Points Support</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
                <div className="space-y-8">

                  {/* Organization Type */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Organization Type
                    </h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type of Organization
                      </label>
                      <select
                        value={formData.organizationType}
                        onChange={(e) => updateField('organizationType', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {ORGANIZATION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose the most specific type that describes your organization
                      </p>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Basic Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Organization Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Acme Corporation"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Legal Name
                      </label>
                      <input
                        type="text"
                        value={formData.legalName}
                        onChange={(e) => updateField('legalName', e.target.value)}
                        placeholder="Acme Corporation, Inc."
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Official registered company name
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Alternate Name
                      </label>
                      <input
                        type="text"
                        value={formData.alternateName}
                        onChange={(e) => updateField('alternateName', e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Common abbreviation or DBA name
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Website URL <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => updateField('url', e.target.value)}
                        placeholder="https://www.acmecorp.com"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        value={formData.logo}
                        onChange={(e) => updateField('logo', e.target.value)}
                        placeholder="https://www.acmecorp.com/logo.png"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum 112x112px for Google Knowledge Panel (square or wide rectangle recommended)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Acme Corporation is a leading provider of innovative solutions..."
                        rows={4}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Slogan / Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.slogan}
                        onChange={(e) => updateField('slogan', e.target.value)}
                        placeholder="Innovation That Matters"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Contact Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="info@acmecorp.com"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Telephone
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => updateField('telephone', e.target.value)}
                        placeholder="+1-555-123-4567"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fax Number
                      </label>
                      <input
                        type="tel"
                        value={formData.faxNumber}
                        onChange={(e) => updateField('faxNumber', e.target.value)}
                        placeholder="+1-555-123-4568"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Address
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={formData.streetAddress}
                        onChange={(e) => updateField('streetAddress', e.target.value)}
                        placeholder="123 Main Street, Suite 100"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.addressLocality}
                          onChange={(e) => updateField('addressLocality', e.target.value)}
                          placeholder="San Francisco"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          State / Province
                        </label>
                        <input
                          type="text"
                          value={formData.addressRegion}
                          onChange={(e) => updateField('addressRegion', e.target.value)}
                          placeholder="CA"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => updateField('postalCode', e.target.value)}
                          placeholder="94102"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Country
                        </label>
                        <select
                          value={formData.addressCountry}
                          onChange={(e) => updateField('addressCountry', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {COUNTRIES.map(country => (
                            <option key={country.value} value={country.value}>{country.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Social Media (sameAs) */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Social Media & Online Presence
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add URLs to your official profiles on social media and other websites. These appear in your Google Knowledge Panel.
                    </p>

                    {formData.sameAsUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateSameAsUrl(index, e.target.value)}
                          placeholder="https://www.facebook.com/acmecorp"
                          className="flex-1 px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {formData.sameAsUrls.length > 1 && (
                          <button
                            onClick={() => removeSameAsUrl(index)}
                            className="px-3 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={addSameAsUrl}
                      className="inline-flex items-center px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Social Profile
                    </button>
                  </div>

                  {/* Organizational Details */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Organizational Details
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Founding Date
                      </label>
                      <input
                        type="date"
                        value={formData.foundingDate}
                        onChange={(e) => updateField('foundingDate', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Founder Name
                      </label>
                      <input
                        type="text"
                        value={formData.founder}
                        onChange={(e) => updateField('founder', e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Number of Employees
                      </label>
                      <input
                        type="number"
                        value={formData.numberOfEmployees}
                        onChange={(e) => updateField('numberOfEmployees', e.target.value)}
                        placeholder="100"
                        min="1"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tax ID / VAT Number
                      </label>
                      <input
                        type="text"
                        value={formData.taxID}
                        onChange={(e) => updateField('taxID', e.target.value)}
                        placeholder="12-3456789"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        NAICS Code
                      </label>
                      <input
                        type="text"
                        value={formData.naicsCode}
                        onChange={(e) => updateField('naicsCode', e.target.value)}
                        placeholder="541511"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        North American Industry Classification System code
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        DUNS Number
                      </label>
                      <input
                        type="text"
                        value={formData.dunsNumber}
                        onChange={(e) => updateField('dunsNumber', e.target.value)}
                        placeholder="123456789"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Dun & Bradstreet unique identifier
                      </p>
                    </div>
                  </div>

                  {/* Contact Points */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Contact Points (Optional)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add specific contact methods for different departments or services
                    </p>

                    {formData.contactPoints.map((cp, index) => (
                      <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Contact Point {index + 1}</h4>
                          <button
                            onClick={() => removeContactPoint(index)}
                            className="px-3 py-1 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Contact Type
                          </label>
                          <select
                            value={cp.contactType}
                            onChange={(e) => updateContactPoint(index, 'contactType', e.target.value)}
                            className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {CONTACT_POINT_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Telephone
                            </label>
                            <input
                              type="tel"
                              value={cp.telephone}
                              onChange={(e) => updateContactPoint(index, 'telephone', e.target.value)}
                              placeholder="+1-555-123-4567"
                              className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={cp.email}
                              onChange={(e) => updateContactPoint(index, 'email', e.target.value)}
                              placeholder="support@acmecorp.com"
                              className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Available Language
                          </label>
                          <input
                            type="text"
                            value={cp.availableLanguage}
                            onChange={(e) => updateContactPoint(index, 'availableLanguage', e.target.value)}
                            placeholder="English, Spanish"
                            className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addContactPoint}
                      className="inline-flex items-center px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact Point
                    </button>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4">
                    <button
                      onClick={generateSchema}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-lg"
                    >
                      Generate Organization Schema
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
                  <h2 className="text-3xl font-bold mb-6 text-center">Your Organization Schema</h2>

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
                        <li>Paste it in the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> section of your homepage or About page</li>
                        <li>Place it before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag</li>
                        <li>Validate using Google's Rich Results Test</li>
                        <li>Monitor your Knowledge Panel in Google Search</li>
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
                Everything you need to know about Organization schema markup
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
                Compare your options for creating Organization schema markup
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
                    <li>⏱️ Time-consuming setup</li>
                    <li>🐛 Prone to syntax errors</li>
                    <li>📚 Requires JSON-LD knowledge</li>
                    <li>🔄 Manual updates needed</li>
                    <li>❌ Easy to miss properties</li>
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
                    <li>🎯 15+ organization types</li>
                    <li>💯 100% free to use</li>
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
                    <li>🤖 AI-powered schema generation</li>
                    <li>🔄 Automatic updates & sync</li>
                    <li>🚀 Direct CMS integration</li>
                    <li>📊 Performance tracking</li>
                    <li>👥 Multi-user collaboration</li>
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
              <h2 className="text-3xl font-bold mb-4">Ready for Automated Schema Management?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                SuperSchema automatically generates, updates, and manages all your schema markup across your entire website. No more manual updates or JSON-LD headaches.
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
