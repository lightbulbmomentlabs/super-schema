import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle, Info, Copy, Download, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SchemaGeneratorNav from '@/components/SchemaGeneratorNav'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import FAQItem from '../components/FAQItem'

// Event Types
const EVENT_TYPES = [
  { value: 'Event', label: 'Event (Generic)' },
  { value: 'MusicEvent', label: 'Music Event (Concerts, Performances)' },
  { value: 'TheaterEvent', label: 'Theater Event (Plays, Shows)' },
  { value: 'SportsEvent', label: 'Sports Event (Games, Matches)' },
  { value: 'BusinessEvent', label: 'Business Event (Conferences, Trade Shows)' },
  { value: 'EducationEvent', label: 'Education Event (Classes, Workshops, Seminars)' },
  { value: 'Festival', label: 'Festival (Music, Cultural)' },
  { value: 'SocialEvent', label: 'Social Event (Parties, Gatherings)' },
  { value: 'ExhibitionEvent', label: 'Exhibition Event (Art Shows, Expos)' },
  { value: 'SaleEvent', label: 'Sale Event' },
  { value: 'ComedyEvent', label: 'Comedy Event (Stand-up Shows)' },
  { value: 'DanceEvent', label: 'Dance Event (Performances)' },
  { value: 'LiteraryEvent', label: 'Literary Event (Book Readings, Signings)' },
  { value: 'ScreeningEvent', label: 'Screening Event (Movie Screenings)' }
]

// Event Status
const EVENT_STATUS = [
  { value: 'EventScheduled', label: 'Scheduled' },
  { value: 'EventPostponed', label: 'Postponed' },
  { value: 'EventRescheduled', label: 'Rescheduled' },
  { value: 'EventCancelled', label: 'Cancelled' },
  { value: 'EventMovedOnline', label: 'Moved Online' }
]

// Event Attendance Mode
const ATTENDANCE_MODES = [
  { value: 'OfflineEventAttendanceMode', label: 'In-Person Only (Offline)' },
  { value: 'OnlineEventAttendanceMode', label: 'Virtual Only (Online)' },
  { value: 'MixedEventAttendanceMode', label: 'Hybrid (In-Person + Virtual)' }
]

// Currencies
const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'INR', label: 'INR - Indian Rupee' }
]

// Ticket Availability
const AVAILABILITY_OPTIONS = [
  { value: 'InStock', label: 'In Stock / Available' },
  { value: 'SoldOut', label: 'Sold Out' },
  { value: 'PreSale', label: 'Pre-Sale' }
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

interface Performer {
  name: string
  type: 'Person' | 'Organization'
}

interface EventFormData {
  eventType: string

  // Basic Information
  name: string
  description: string
  url: string
  imageUrls: string

  // Date & Time
  startDate: string
  startTime: string
  endDate: string
  endTime: string

  // Event Status & Mode
  eventStatus: string
  attendanceMode: string

  // Physical Location
  venueName: string
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string

  // Virtual Location
  virtualLocationUrl: string

  // Organizer
  organizerName: string
  organizerUrl: string
  organizerType: 'Person' | 'Organization'

  // Performers
  performers: Performer[]

  // Offers/Tickets
  ticketPrice: string
  priceCurrency: string
  availability: string
  ticketUrl: string
  validFrom: string

  // Additional Details
  typicalAgeRange: string
  duration: string
}

export default function EventSchemaGeneratorPage() {
  const [formData, setFormData] = useState<EventFormData>({
    eventType: 'Event',
    name: '',
    description: '',
    url: '',
    imageUrls: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    eventStatus: 'EventScheduled',
    attendanceMode: 'OfflineEventAttendanceMode',
    venueName: '',
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: 'US',
    virtualLocationUrl: '',
    organizerName: '',
    organizerUrl: '',
    organizerType: 'Organization',
    performers: [],
    ticketPrice: '',
    priceCurrency: 'USD',
    availability: 'InStock',
    ticketUrl: '',
    validFrom: '',
    typicalAgeRange: '',
    duration: ''
  })

  const [generatedSchema, setGeneratedSchema] = useState<string>('')

  // Update field helper
  const updateField = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Performer management
  const addPerformer = () => {
    setFormData(prev => ({
      ...prev,
      performers: [...prev.performers, { name: '', type: 'Person' }]
    }))
  }

  const removePerformer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      performers: prev.performers.filter((_, i) => i !== index)
    }))
  }

  const updatePerformer = (index: number, field: keyof Performer, value: any) => {
    setFormData(prev => ({
      ...prev,
      performers: prev.performers.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
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
      toast.error('Event name is required')
      return false
    }

    if (!formData.startDate.trim()) {
      toast.error('Start date is required')
      return false
    }

    if (!formData.startTime.trim()) {
      toast.error('Start time is required')
      return false
    }

    // Location validation based on attendance mode
    const needsPhysicalLocation = formData.attendanceMode === 'OfflineEventAttendanceMode' ||
                                   formData.attendanceMode === 'MixedEventAttendanceMode'
    const needsVirtualLocation = formData.attendanceMode === 'OnlineEventAttendanceMode' ||
                                  formData.attendanceMode === 'MixedEventAttendanceMode'

    if (needsPhysicalLocation && !formData.venueName.trim()) {
      toast.error('Venue name is required for in-person or hybrid events')
      return false
    }

    if (needsVirtualLocation && !formData.virtualLocationUrl.trim()) {
      toast.error('Virtual location URL is required for online or hybrid events')
      return false
    }

    if (needsVirtualLocation && !isValidUrl(formData.virtualLocationUrl.trim())) {
      toast.error('Please enter a valid URL for the virtual location')
      return false
    }

    if (formData.url.trim() && !isValidUrl(formData.url.trim())) {
      toast.error('Please enter a valid event URL')
      return false
    }

    if (formData.ticketUrl.trim() && !isValidUrl(formData.ticketUrl.trim())) {
      toast.error('Please enter a valid ticket URL')
      return false
    }

    return true
  }

  // Generate Schema
  const generateSchema = () => {
    if (!validateForm()) return

    const schema: any = {
      "@context": "https://schema.org",
      "@type": formData.eventType,
      "name": formData.name.trim(),
      "eventStatus": `https://schema.org/${formData.eventStatus}`,
      "eventAttendanceMode": `https://schema.org/${formData.attendanceMode}`
    }

    // Basic Information
    if (formData.description.trim()) schema.description = formData.description.trim()
    if (formData.url.trim()) schema.url = formData.url.trim()

    // Images
    if (formData.imageUrls.trim()) {
      const imageArray = formData.imageUrls.split(',')
        .map(url => url.trim())
        .filter(url => url && isValidUrl(url))

      if (imageArray.length > 0) {
        schema.image = imageArray.length === 1 ? imageArray[0] : imageArray
      }
    }

    // Start Date & Time (combine into ISO-8601 format)
    const startDateTime = `${formData.startDate}T${formData.startTime}`
    schema.startDate = startDateTime

    // End Date & Time (optional)
    if (formData.endDate.trim() && formData.endTime.trim()) {
      const endDateTime = `${formData.endDate}T${formData.endTime}`
      schema.endDate = endDateTime
    }

    // Location - Physical
    const needsPhysicalLocation = formData.attendanceMode === 'OfflineEventAttendanceMode' ||
                                   formData.attendanceMode === 'MixedEventAttendanceMode'

    if (needsPhysicalLocation && formData.venueName.trim()) {
      const location: any = {
        "@type": "Place",
        "name": formData.venueName.trim()
      }

      // Add address if any field is filled
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

        location.address = address
      }

      // For mixed events, use array with both physical and virtual
      if (formData.attendanceMode === 'MixedEventAttendanceMode' && formData.virtualLocationUrl.trim()) {
        schema.location = [
          location,
          {
            "@type": "VirtualLocation",
            "url": formData.virtualLocationUrl.trim()
          }
        ]
      } else {
        schema.location = location
      }
    }
    // Location - Virtual only
    else if (formData.attendanceMode === 'OnlineEventAttendanceMode' && formData.virtualLocationUrl.trim()) {
      schema.location = {
        "@type": "VirtualLocation",
        "url": formData.virtualLocationUrl.trim()
      }
    }

    // Organizer
    if (formData.organizerName.trim()) {
      const organizer: any = {
        "@type": formData.organizerType,
        "name": formData.organizerName.trim()
      }
      if (formData.organizerUrl.trim()) organizer.url = formData.organizerUrl.trim()
      schema.organizer = organizer
    }

    // Performers
    const validPerformers = formData.performers.filter(p => p.name.trim())
    if (validPerformers.length > 0) {
      schema.performer = validPerformers.map(p => ({
        "@type": p.type,
        "name": p.name.trim()
      }))
    }

    // Offers/Tickets
    if (formData.ticketPrice.trim()) {
      const offer: any = {
        "@type": "Offer",
        "price": formData.ticketPrice.trim(),
        "priceCurrency": formData.priceCurrency,
        "availability": `https://schema.org/${formData.availability}`
      }
      if (formData.ticketUrl.trim()) offer.url = formData.ticketUrl.trim()
      if (formData.validFrom.trim()) offer.validFrom = formData.validFrom.trim()

      schema.offers = offer
    }

    // Additional Details
    if (formData.typicalAgeRange.trim()) schema.typicalAgeRange = formData.typicalAgeRange.trim()
    if (formData.duration.trim()) schema.duration = formData.duration.trim()

    const schemaString = JSON.stringify(schema, null, 2)
    const fullSchema = `<script type="application/ld+json">\n${schemaString}\n</script>`
    setGeneratedSchema(fullSchema)

    toast.success('Event Schema generated successfully!')
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
    a.download = 'event-schema.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Schema downloaded!')
  }

  // Check if physical location fields should be shown
  const showPhysicalLocation = formData.attendanceMode === 'OfflineEventAttendanceMode' ||
                                formData.attendanceMode === 'MixedEventAttendanceMode'

  // Check if virtual location field should be shown
  const showVirtualLocation = formData.attendanceMode === 'OnlineEventAttendanceMode' ||
                               formData.attendanceMode === 'MixedEventAttendanceMode'

  // Educational FAQs
  const educationalFAQs = [
    {
      question: "What is Event schema markup and why do I need it?",
      answer: "Event schema markup is structured data that tells search engines about your event's key details like date, time, location, and ticket information. It helps your event appear in Google's event search experience, Google Maps, and rich results, making it easier for people to discover and attend your event."
    },
    {
      question: "How does Event schema help my events appear in Google Search?",
      answer: "When you add Event schema to your event pages, Google can display enhanced search results showing the event date, time, location, and ticket availability directly in search results. Your events may also appear in the Google Events experience, a dedicated feature that shows relevant events to users based on their searches and location."
    },
    {
      question: "What's the difference between Event types (MusicEvent, SportsEvent, etc.)?",
      answer: "Event subtypes like MusicEvent, SportsEvent, and TheaterEvent are more specific classifications that help search engines better understand and categorize your event. While the generic 'Event' type works for all events, using a specific type can provide additional context and may improve how your event appears in specialized search features."
    },
    {
      question: "What are the required properties for Event schema?",
      answer: "Google requires three essential properties for Event schema: 1) name (the event title), 2) startDate (when the event begins in ISO-8601 format), and 3) location (either a physical Place with address or a VirtualLocation URL). While other properties are recommended, these three are mandatory for your event to be eligible for rich results."
    },
    {
      question: "How do I mark up virtual or hybrid events?",
      answer: "For virtual events, use eventAttendanceMode: OnlineEventAttendanceMode and provide a VirtualLocation with the streaming URL. For hybrid events, use MixedEventAttendanceMode and include both a physical Place location and a VirtualLocation. This tells Google that attendees can participate either in-person or virtually."
    },
    {
      question: "Should I include ticket pricing in my Event schema?",
      answer: "Yes! Including ticket pricing through the 'offers' property is highly recommended. It allows Google to display ticket prices, availability, and purchase links directly in search results. This transparency helps potential attendees make quick decisions and can increase ticket sales by reducing friction in the buying process."
    },
    {
      question: "What is eventAttendanceMode and when should I use it?",
      answer: "eventAttendanceMode indicates how people can attend your event. Use 'OfflineEventAttendanceMode' for in-person only events, 'OnlineEventAttendanceMode' for virtual/online only events, and 'MixedEventAttendanceMode' for hybrid events that offer both options. This became especially important during COVID-19 and remains valuable as virtual and hybrid events continue."
    },
    {
      question: "How can I validate my Event schema markup?",
      answer: "Use Google's Rich Results Test (search.google.com/test/rich-results) to validate your Event schema. The tool will check for errors, missing required properties, and provide warnings for recommended fields. You can also use Schema Markup Validator (validator.schema.org) for a broader validation. Regular testing ensures your events remain eligible for rich results."
    }
  ]

  return (
    <>
      <Helmet>
        <title>Free Event Schema Generator | Create Valid JSON-LD Markup</title>
        <meta name="description" content="Generate perfect Event schema markup for concerts, conferences, festivals, and all event types. Free tool with support for virtual, in-person, and hybrid events. Improve your Google event listings." />
        <meta name="keywords" content="event schema, event schema generator, json-ld generator, schema markup, structured data, music event schema, sports event schema, virtual event markup, hybrid event schema" />
        <link rel="canonical" href="https://superschema.ai/event-schema-generator" />

        {/* Open Graph */}
        <meta property="og:title" content="Free Event Schema Generator | SuperSchema" />
        <meta property="og:description" content="Generate perfect Event schema markup for any type of event. Free tool supporting virtual, in-person, and hybrid events." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://superschema.ai/event-schema-generator" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Event Schema Generator | SuperSchema" />
        <meta name="twitter:description" content="Generate perfect Event schema markup in seconds. Free tool for concerts, conferences, festivals, and all event types." />

        {/* Structured Data for the page itself */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Event Schema Generator",
            "description": "Free tool to generate Event schema markup for concerts, conferences, festivals, and all event types",
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
                Free Event Schema Generator
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Create perfect Event JSON-LD schema markup in seconds. Support for concerts, conferences, festivals, and all event types including virtual and hybrid events.
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Google-Compliant Markup</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>14+ Event Types</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Virtual & Hybrid Support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <span>Ticket Integration</span>
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

                  {/* Event Type */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Event Type
                    </h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type of Event
                      </label>
                      <select
                        value={formData.eventType}
                        onChange={(e) => updateField('eventType', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {EVENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose the most specific type that describes your event
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
                        Event Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Summer Music Festival 2025"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Join us for an unforgettable evening of live music featuring top artists..."
                        rows={4}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Event URL
                      </label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => updateField('url', e.target.value)}
                        placeholder="https://www.example.com/summer-festival-2025"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Link to the event page or registration
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Image URLs
                      </label>
                      <input
                        type="text"
                        value={formData.imageUrls}
                        onChange={(e) => updateField('imageUrls', e.target.value)}
                        placeholder="https://example.com/event-image.jpg, https://example.com/event-image-2.jpg"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Comma-separated URLs. Google recommends 16x9, 4x3, and 1x1 aspect ratios
                      </p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Date & Time
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Start Date <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => updateField('startDate', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Start Time <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => updateField('startTime', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => updateField('endDate', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => updateField('endTime', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Dates will be formatted in ISO-8601 format (e.g., 2025-07-15T19:00)
                    </p>
                  </div>

                  {/* Event Status & Attendance Mode */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Event Status & Attendance
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Event Status
                      </label>
                      <select
                        value={formData.eventStatus}
                        onChange={(e) => updateField('eventStatus', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {EVENT_STATUS.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Event Attendance Mode
                      </label>
                      <select
                        value={formData.attendanceMode}
                        onChange={(e) => updateField('attendanceMode', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {ATTENDANCE_MODES.map(mode => (
                          <option key={mode.value} value={mode.value}>{mode.label}</option>
                        ))}
                      </select>
                      <p className="text-sm text-muted-foreground mt-1">
                        How attendees can participate in this event
                      </p>
                    </div>
                  </div>

                  {/* Physical Location (conditional) */}
                  {showPhysicalLocation && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold flex items-center">
                        <Info className="h-5 w-5 mr-2 text-primary" />
                        Physical Location
                      </h3>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Venue Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.venueName}
                          onChange={(e) => updateField('venueName', e.target.value)}
                          placeholder="Madison Square Garden"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={formData.streetAddress}
                          onChange={(e) => updateField('streetAddress', e.target.value)}
                          placeholder="4 Pennsylvania Plaza"
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
                            placeholder="New York"
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
                            placeholder="NY"
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
                            placeholder="10001"
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
                  )}

                  {/* Virtual Location (conditional) */}
                  {showVirtualLocation && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold flex items-center">
                        <Info className="h-5 w-5 mr-2 text-primary" />
                        Virtual Location
                      </h3>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Virtual Location URL <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="url"
                          value={formData.virtualLocationUrl}
                          onChange={(e) => updateField('virtualLocationUrl', e.target.value)}
                          placeholder="https://zoom.us/j/123456789 or https://www.youtube.com/watch?v=..."
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Link to the streaming platform or virtual event space
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Organizer */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Organizer Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Organizer Name
                      </label>
                      <input
                        type="text"
                        value={formData.organizerName}
                        onChange={(e) => updateField('organizerName', e.target.value)}
                        placeholder="Acme Events Inc."
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Organizer URL
                      </label>
                      <input
                        type="url"
                        value={formData.organizerUrl}
                        onChange={(e) => updateField('organizerUrl', e.target.value)}
                        placeholder="https://www.acmeevents.com"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Organizer Type
                      </label>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="Organization"
                            checked={formData.organizerType === 'Organization'}
                            onChange={(e) => updateField('organizerType', e.target.value)}
                            className="mr-2"
                          />
                          <span>Organization</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="Person"
                            checked={formData.organizerType === 'Person'}
                            onChange={(e) => updateField('organizerType', e.target.value)}
                            className="mr-2"
                          />
                          <span>Person</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Performers */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Performers / Participants (Optional)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add speakers, musicians, artists, or participants
                    </p>

                    {formData.performers.map((performer, index) => (
                      <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Performer {index + 1}</h4>
                          <button
                            onClick={() => removePerformer(index)}
                            className="px-3 py-1 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={performer.name}
                            onChange={(e) => updatePerformer(index, 'name', e.target.value)}
                            placeholder="John Doe or Band Name"
                            className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Type
                          </label>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                value="Person"
                                checked={performer.type === 'Person'}
                                onChange={(e) => updatePerformer(index, 'type', e.target.value)}
                                className="mr-2"
                              />
                              <span>Person</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                value="Organization"
                                checked={performer.type === 'Organization'}
                                onChange={(e) => updatePerformer(index, 'type', e.target.value)}
                                className="mr-2"
                              />
                              <span>Organization / Band</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addPerformer}
                      className="inline-flex items-center px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Performer
                    </button>
                  </div>

                  {/* Offers/Tickets */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Tickets & Pricing (Optional)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Ticket Price
                        </label>
                        <input
                          type="text"
                          value={formData.ticketPrice}
                          onChange={(e) => updateField('ticketPrice', e.target.value)}
                          placeholder="29.99"
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Currency
                        </label>
                        <select
                          value={formData.priceCurrency}
                          onChange={(e) => updateField('priceCurrency', e.target.value)}
                          className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {CURRENCIES.map(currency => (
                            <option key={currency.value} value={currency.value}>{currency.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Availability
                      </label>
                      <select
                        value={formData.availability}
                        onChange={(e) => updateField('availability', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {AVAILABILITY_OPTIONS.map(avail => (
                          <option key={avail.value} value={avail.value}>{avail.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ticket Purchase URL
                      </label>
                      <input
                        type="url"
                        value={formData.ticketUrl}
                        onChange={(e) => updateField('ticketUrl', e.target.value)}
                        placeholder="https://www.ticketmaster.com/event/..."
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tickets Valid From
                      </label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => updateField('validFrom', e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        When tickets go on sale
                      </p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Additional Details (Optional)
                    </h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Typical Age Range
                      </label>
                      <input
                        type="text"
                        value={formData.typicalAgeRange}
                        onChange={(e) => updateField('typicalAgeRange', e.target.value)}
                        placeholder="18+, All ages, 13-18, etc."
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => updateField('duration', e.target.value)}
                        placeholder="PT2H30M (2 hours 30 minutes)"
                        className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        ISO 8601 duration format: PT2H (2 hours), PT30M (30 minutes), PT1H30M (1.5 hours)
                      </p>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4">
                    <button
                      onClick={generateSchema}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-lg"
                    >
                      Generate Event Schema
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
                  <h2 className="text-3xl font-bold mb-6 text-center">Your Event Schema</h2>

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
                        <li>Paste it in the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> section of your event page</li>
                        <li>Place it before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag</li>
                        <li>Validate using Google's Rich Results Test</li>
                        <li>Monitor your event's appearance in Google Search</li>
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
                Everything you need to know about Event schema markup
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
                Compare your options for creating Event schema markup
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
                    <li>⏱️ Complex date formatting</li>
                    <li>🐛 Nested location objects</li>
                    <li>📚 ISO-8601 format required</li>
                    <li>🔄 Manual updates for changes</li>
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
                    <li>🎯 14+ event types</li>
                    <li>🌐 Virtual & hybrid support</li>
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
                    <li>🤖 AI-powered event generation</li>
                    <li>🔄 Recurring event support</li>
                    <li>🚀 Direct CMS integration</li>
                    <li>📊 Event performance tracking</li>
                    <li>👥 Calendar sync & automation</li>
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
              <h2 className="text-3xl font-bold mb-4">Ready for Automated Event Management?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                SuperSchema automatically generates and manages schema markup for all your events, including support for recurring events, calendar sync, and direct integration with your event platform.
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
