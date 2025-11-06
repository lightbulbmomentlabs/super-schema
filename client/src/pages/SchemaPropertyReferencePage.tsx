import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  Copy,
  Check,
  ArrowRight,
  Code,
  Sparkles,
  Target,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'
import toast from 'react-hot-toast'

interface CodeSnippetProps {
  code: string
  title: string
  description?: string
  points?: string
}

function CodeSnippet({ code, title, description, points }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card mb-6">
      <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            {points && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {points}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-foreground font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export default function SchemaPropertyReferencePage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'Schema Property Reference Guide | SuperSchema'
    window.scrollTo(0, 0)
  }, [])

  const faqData = [
    {
      question: 'Where do I paste these snippets?',
      answer: 'In the schema editor after generating your schema. Add the property inside the main schema object (after existing properties, before the closing <code>}</code>). Make sure to add a comma after the previous property.'
    },
    {
      question: 'Do I need all of these properties?',
      answer: 'No. Focus on "Recommended Properties" first (biggest score impact), then add "Advanced AEO Features" if you want to reach 90+. Only add properties where you have real data—never make up fake information.'
    },
    {
      question: 'What if I don\'t have some of this information?',
      answer: 'Skip properties you don\'t have. Don\'t make up fake data—it\'s worse than leaving it blank. For example, if you don\'t have ratings, don\'t add fake aggregateRating data.'
    },
    {
      question: 'Can I copy multiple snippets at once?',
      answer: 'Yes! Just make sure to add a comma after each property (except the last one). Proper JSON formatting is important—each property needs to be separated by commas.'
    },
    {
      question: 'Will this break my schema?',
      answer: 'These snippets are valid schema.org properties. As long as you maintain proper JSON formatting (commas, brackets, quotes), your schema will remain valid. Use the grader to verify after making changes.'
    },
    {
      question: 'How much will my score improve?',
      answer: 'It depends on what you\'re missing. Adding a structured author can boost your score by 15-25 points. Adding all recommended properties can take you from a C to an A. Check the property impact table to see point values for each property.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <PillarPageNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Back to Home
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            Schema Property Reference
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl"
          >
            Copy-ready code snippets to boost your schema quality score. No fluff—just the exact properties you need to paste into your schema.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Code className="h-4 w-4 mr-2" />
              Copy & Paste Ready
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Instant Score Boost
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Target className="h-4 w-4 mr-2" />
              No Technical Knowledge Required
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-20">

        {/* How to Use This Guide */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">How to Use This Guide</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6 bg-card">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Find Your Schema Type</h3>
              <p className="text-muted-foreground text-sm">
                Scroll to the section for your content type (Article, Product, Organization, etc.)
              </p>
            </div>

            <div className="border border-border rounded-lg p-6 bg-card">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Copy the Snippet</h3>
              <p className="text-muted-foreground text-sm">
                Click the copy button on any property you want to add
              </p>
            </div>

            <div className="border border-border rounded-lg p-6 bg-card">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Paste & Customize</h3>
              <p className="text-muted-foreground text-sm">
                Replace placeholder values with your real content and regenerate
              </p>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="border border-border rounded-lg p-6 bg-card">
          <h3 className="font-semibold text-lg mb-4">Jump to Schema Type:</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <a href="#article" className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              Article / BlogPosting
            </a>
            <a href="#product" className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              Product
            </a>
            <a href="#organization" className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              Organization
            </a>
            <a href="#person" className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              Person
            </a>
            <a href="#recipe" className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              Recipe
            </a>
            <a href="#event" className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              Event
            </a>
          </div>
        </section>

        {/* Article/BlogPosting Schema */}
        <section id="article">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Article / BlogPosting Schema</h2>
            <p className="text-muted-foreground">
              Perfect for blog posts, news articles, and editorial content. These properties help search engines understand your content and display it in rich results.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-6 text-foreground">Recommended Properties (25% of score)</h3>

          <CodeSnippet
            title="Author (Structured)"
            points="15-25 points"
            description="Structured author with profile links for maximum credibility"
            code={`"author": {
  "@type": "Person",
  "name": "Your Name",
  "url": "https://yoursite.com/author/yourname",
  "sameAs": [
    "https://twitter.com/yourhandle",
    "https://linkedin.com/in/yourprofile"
  ]
}`}
          />

          <CodeSnippet
            title="Publisher (With Logo)"
            points="15-25 points"
            description="Organization info with logo for rich results"
            code={`"publisher": {
  "@type": "Organization",
  "name": "Your Company Name",
  "logo": {
    "@type": "ImageObject",
    "url": "https://yoursite.com/logo.png",
    "width": 600,
    "height": 60
  },
  "url": "https://yoursite.com"
}`}
          />

          <CodeSnippet
            title="Dates (Published & Modified)"
            points="18 points total"
            description="When the article was published and last updated"
            code={`"datePublished": "2024-11-06T08:00:00-05:00",
"dateModified": "2024-11-06T14:30:00-05:00"`}
          />

          <CodeSnippet
            title="Description"
            points="15-20 points"
            description="100-150 character summary (this becomes your search preview)"
            code={`"description": "Your 100-150 character summary here that describes the article content clearly and concisely for search results."`}
          />

          <CodeSnippet
            title="Image (Structured)"
            points="12-20 points"
            description="Featured image with dimensions for better display"
            code={`"image": {
  "@type": "ImageObject",
  "url": "https://yoursite.com/featured-image.jpg",
  "width": 1200,
  "height": 630,
  "caption": "Descriptive image caption"
}`}
          />

          <CodeSnippet
            title="URL"
            points="10 points"
            description="The canonical URL of this article"
            code={`"url": "https://yoursite.com/your-article-url"`}
          />

          <h3 className="text-2xl font-bold mb-6 mt-12 text-foreground">Advanced AEO Features (25% of score)</h3>

          <CodeSnippet
            title="Keywords (Array)"
            points="5-10 points"
            description="3-5 main topics for better topical relevance"
            code={`"keywords": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"]`}
          />

          <CodeSnippet
            title="About"
            points="AEO boost"
            description="The main subject matter of the article"
            code={`"about": {
  "@type": "Thing",
  "name": "Main Topic",
  "description": "What this article is primarily about"
}`}
          />

          <CodeSnippet
            title="Article Section"
            points="AEO boost"
            description="The category or section this article belongs to"
            code={`"articleSection": "Your Category Name"`}
          />

          <CodeSnippet
            title="Word Count"
            points="AEO boost"
            description="Total words in the article"
            code={`"wordCount": 1500`}
          />

          <CodeSnippet
            title="Language"
            points="AEO boost"
            description="Content language code"
            code={`"inLanguage": "en-US"`}
          />

          <CodeSnippet
            title="Speakable"
            points="5-10 points"
            description="Voice search optimization (which parts can be read aloud)"
            code={`"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": [".article-headline", ".article-intro"]
}`}
          />

          <CodeSnippet
            title="Mentions"
            points="AEO boost"
            description="Related topics or entities mentioned in the article"
            code={`"mentions": [
  {
    "@type": "Thing",
    "name": "Related Topic 1"
  },
  {
    "@type": "Thing",
    "name": "Related Topic 2"
  }
]`}
          />

          <CodeSnippet
            title="Main Entity"
            points="AEO boost"
            description="The primary entity this page is about"
            code={`"mainEntityOfPage": {
  "@type": "WebPage",
  "@id": "https://yoursite.com/your-article-url"
}`}
          />
        </section>

        {/* Product Schema */}
        <section id="product">
          <div className="mb-8 pt-12 border-t border-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Product Schema</h2>
            <p className="text-muted-foreground">
              Essential for e-commerce pages, product listings, and review sites. These properties enable rich product snippets in search results.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-6 text-foreground">Recommended Properties</h3>

          <CodeSnippet
            title="Description"
            points="15-20 points"
            description="100-150 character product description"
            code={`"description": "Clear product description between 100-150 characters for optimal display in search results."`}
          />

          <CodeSnippet
            title="Image (Multiple)"
            points="12-20 points"
            description="Product images (multiple recommended)"
            code={`"image": [
  "https://yoursite.com/product-image-1.jpg",
  "https://yoursite.com/product-image-2.jpg",
  "https://yoursite.com/product-image-3.jpg"
]`}
          />

          <CodeSnippet
            title="Brand"
            points="Important"
            description="The brand or manufacturer"
            code={`"brand": {
  "@type": "Brand",
  "name": "Your Brand Name"
}`}
          />

          <CodeSnippet
            title="SKU & Identifiers"
            points="Important"
            description="Product identifiers for better matching"
            code={`"sku": "ABC-123",
"gtin": "00000000000000",
"mpn": "MANUFACTURER-PART-NUMBER"`}
          />

          <h3 className="text-2xl font-bold mb-6 mt-12 text-foreground">Advanced AEO Features</h3>

          <CodeSnippet
            title="Aggregate Rating"
            points="10-15 points"
            description="Overall customer ratings (major AEO boost)"
            code={`"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.5",
  "reviewCount": "89",
  "bestRating": "5",
  "worstRating": "1"
}`}
          />

          <CodeSnippet
            title="Individual Review"
            points="AEO boost"
            description="Sample customer review"
            code={`"review": {
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "Reviewer Name"
  },
  "datePublished": "2024-11-01",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "reviewBody": "Great product! Highly recommend for anyone looking for quality."
}`}
          />

          <CodeSnippet
            title="Offers"
            points="Required for products"
            description="Price and availability information"
            code={`"offers": {
  "@type": "Offer",
  "url": "https://yoursite.com/product-url",
  "priceCurrency": "USD",
  "price": "29.99",
  "availability": "https://schema.org/InStock",
  "priceValidUntil": "2025-12-31",
  "seller": {
    "@type": "Organization",
    "name": "Your Store Name"
  }
}`}
          />
        </section>

        {/* Organization Schema */}
        <section id="organization">
          <div className="mb-8 pt-12 border-t border-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Organization Schema</h2>
            <p className="text-muted-foreground">
              For company pages, about pages, and business information. Helps establish authority and credibility in search results.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-6 text-foreground">Recommended Properties</h3>

          <CodeSnippet
            title="Logo"
            points="Important"
            description="Company logo for brand recognition"
            code={`"logo": "https://yoursite.com/logo.png"`}
          />

          <CodeSnippet
            title="Description"
            points="15-20 points"
            description="Company description (100-150 characters)"
            code={`"description": "Brief description of your organization between 100-150 characters for search results."`}
          />

          <CodeSnippet
            title="URL"
            points="10 points"
            description="Company website URL"
            code={`"url": "https://yoursite.com"`}
          />

          <CodeSnippet
            title="Contact Information"
            points="Important"
            description="How customers can reach you"
            code={`"contactPoint": {
  "@type": "ContactPoint",
  "telephone": "+1-555-555-5555",
  "contactType": "customer service",
  "email": "support@yoursite.com",
  "availableLanguage": ["English", "Spanish"]
}`}
          />

          <CodeSnippet
            title="Address"
            points="Important"
            description="Physical business address"
            code={`"address": {
  "@type": "PostalAddress",
  "streetAddress": "123 Main Street",
  "addressLocality": "City Name",
  "addressRegion": "ST",
  "postalCode": "12345",
  "addressCountry": "US"
}`}
          />

          <h3 className="text-2xl font-bold mb-6 mt-12 text-foreground">Advanced AEO Features</h3>

          <CodeSnippet
            title="Same As (Social Profiles)"
            points="5-10 points"
            description="Social media profiles (major AEO boost)"
            code={`"sameAs": [
  "https://facebook.com/yourpage",
  "https://twitter.com/yourhandle",
  "https://linkedin.com/company/yourcompany",
  "https://instagram.com/yourhandle",
  "https://youtube.com/@yourchannel"
]`}
          />

          <CodeSnippet
            title="Founding Information"
            points="AEO boost"
            description="When the company was founded"
            code={`"foundingDate": "2020-01-15",
"founder": {
  "@type": "Person",
  "name": "Founder Name"
}`}
          />
        </section>

        {/* Person Schema */}
        <section id="person">
          <div className="mb-8 pt-12 border-t border-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Person Schema</h2>
            <p className="text-muted-foreground">
              For author pages, team member profiles, and personal brands. Establishes credibility for content creators.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-6 text-foreground">Recommended Properties</h3>

          <CodeSnippet
            title="Basic Person Information"
            points="Core properties"
            description="Essential person details"
            code={`"@context": "https://schema.org",
"@type": "Person",
"name": "Full Name",
"url": "https://yoursite.com/about",
"image": "https://yoursite.com/headshot.jpg",
"description": "Brief bio between 100-150 characters about this person and their expertise."`}
          />

          <CodeSnippet
            title="Job Title & Company"
            points="Important"
            description="Professional role and organization"
            code={`"jobTitle": "Job Title",
"worksFor": {
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://companysite.com"
}`}
          />

          <h3 className="text-2xl font-bold mb-6 mt-12 text-foreground">Advanced AEO Features</h3>

          <CodeSnippet
            title="Social Profiles"
            points="5-10 points"
            description="Professional social media links (major AEO boost)"
            code={`"sameAs": [
  "https://twitter.com/username",
  "https://linkedin.com/in/username",
  "https://github.com/username",
  "https://medium.com/@username"
]`}
          />

          <CodeSnippet
            title="Contact Information"
            points="Optional"
            description="How to reach this person"
            code={`"email": "email@example.com",
"telephone": "+1-555-555-5555"`}
          />
        </section>

        {/* Recipe Schema */}
        <section id="recipe">
          <div className="mb-8 pt-12 border-t border-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Recipe Schema</h2>
            <p className="text-muted-foreground">
              Essential for food blogs and cooking sites. Enables rich recipe cards in search results with ratings, cook time, and more.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-6 text-foreground">Recommended Properties</h3>

          <CodeSnippet
            title="Author"
            points="15-25 points"
            description="Recipe creator information"
            code={`"author": {
  "@type": "Person",
  "name": "Chef Name",
  "url": "https://yoursite.com/author/chef-name"
}`}
          />

          <CodeSnippet
            title="Dates"
            points="18 points"
            description="When recipe was published and updated"
            code={`"datePublished": "2024-11-06",
"dateModified": "2024-11-06"`}
          />

          <CodeSnippet
            title="Image (Multiple)"
            points="12-20 points"
            description="Recipe photos (multiple recommended)"
            code={`"image": [
  "https://yoursite.com/recipe-photo-1.jpg",
  "https://yoursite.com/recipe-photo-2.jpg",
  "https://yoursite.com/recipe-photo-3.jpg"
]`}
          />

          <CodeSnippet
            title="Recipe Details"
            points="Required"
            description="Cook times and serving information"
            code={`"recipeYield": "4 servings",
"prepTime": "PT15M",
"cookTime": "PT30M",
"totalTime": "PT45M",
"recipeCategory": "Main Course",
"recipeCuisine": "Italian"`}
          />

          <h3 className="text-2xl font-bold mb-6 mt-12 text-foreground">Advanced AEO Features</h3>

          <CodeSnippet
            title="Keywords"
            points="5-10 points"
            description="Recipe topics for better discovery"
            code={`"keywords": ["quick dinner", "pasta", "italian food", "weeknight meals", "family friendly"]`}
          />

          <CodeSnippet
            title="Nutrition Information"
            points="AEO boost"
            description="Nutritional facts (highly valued)"
            code={`"nutrition": {
  "@type": "NutritionInformation",
  "calories": "350 calories",
  "proteinContent": "25g",
  "fatContent": "10g",
  "carbohydrateContent": "40g",
  "fiberContent": "5g",
  "sugarContent": "8g"
}`}
          />

          <CodeSnippet
            title="Aggregate Rating"
            points="10-15 points"
            description="User ratings for the recipe"
            code={`"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "ratingCount": "127",
  "bestRating": "5",
  "worstRating": "1"
}`}
          />
        </section>

        {/* Event Schema */}
        <section id="event">
          <div className="mb-8 pt-12 border-t border-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Event Schema</h2>
            <p className="text-muted-foreground">
              For conferences, webinars, concerts, and any scheduled events. Enables rich event listings in search results.
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-6 text-foreground">Recommended Properties</h3>

          <CodeSnippet
            title="Event Dates & Location"
            points="Required"
            description="When and where the event happens"
            code={`"startDate": "2024-12-15T19:00:00-05:00",
"endDate": "2024-12-15T22:00:00-05:00",
"eventStatus": "https://schema.org/EventScheduled",
"eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
"location": {
  "@type": "Place",
  "name": "Venue Name",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Event Street",
    "addressLocality": "City Name",
    "addressRegion": "ST",
    "postalCode": "12345",
    "addressCountry": "US"
  }
}`}
          />

          <CodeSnippet
            title="Organizer"
            points="Important"
            description="Who is hosting the event"
            code={`"organizer": {
  "@type": "Organization",
  "name": "Event Organizer Name",
  "url": "https://organizer-site.com"
}`}
          />

          <CodeSnippet
            title="Image"
            points="12-20 points"
            description="Event poster or promotional image"
            code={`"image": "https://yoursite.com/event-poster.jpg"`}
          />

          <CodeSnippet
            title="Description"
            points="15-20 points"
            description="Event description (100-150 characters)"
            code={`"description": "Brief event description between 100-150 characters highlighting what attendees can expect."`}
          />

          <h3 className="text-2xl font-bold mb-6 mt-12 text-foreground">Advanced AEO Features</h3>

          <CodeSnippet
            title="Offers (Tickets)"
            points="Important"
            description="Ticket pricing and availability"
            code={`"offers": {
  "@type": "Offer",
  "url": "https://yoursite.com/tickets",
  "price": "25.00",
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock",
  "validFrom": "2024-11-01T00:00:00"
}`}
          />

          <CodeSnippet
            title="Performer"
            points="AEO boost"
            description="Featured speakers or performers"
            code={`"performer": {
  "@type": "Person",
  "name": "Performer Name",
  "url": "https://performersite.com"
}`}
          />
        </section>

        {/* Property Impact Table */}
        <section className="pt-12 border-t border-border">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Property Impact Reference</h2>
          <p className="text-muted-foreground mb-6">
            Quick reference for score impact, effort required, and when to add each property.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">Property</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">Points</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">Effort</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">Best For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">@context, @type, name</td>
                  <td className="px-4 py-3 text-sm">33 each</td>
                  <td className="px-4 py-3 text-sm">Auto</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">Critical</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">All schemas (auto-included)</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">author (structured)</td>
                  <td className="px-4 py-3 text-sm">15-25</td>
                  <td className="px-4 py-3 text-sm">2 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">High</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Articles, recipes</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">publisher (structured)</td>
                  <td className="px-4 py-3 text-sm">15-25</td>
                  <td className="px-4 py-3 text-sm">2 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">High</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Articles, news</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">description (100-150 char)</td>
                  <td className="px-4 py-3 text-sm">15-20</td>
                  <td className="px-4 py-3 text-sm">3 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">High</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">All content types</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">image (structured)</td>
                  <td className="px-4 py-3 text-sm">12-20</td>
                  <td className="px-4 py-3 text-sm">1 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Medium</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">All content types</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">aggregateRating</td>
                  <td className="px-4 py-3 text-sm">10-15</td>
                  <td className="px-4 py-3 text-sm">5 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">High</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Products, recipes, services</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">datePublished, dateModified</td>
                  <td className="px-4 py-3 text-sm">18 total</td>
                  <td className="px-4 py-3 text-sm">1 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Medium</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Articles, recipes, news</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">keywords (array)</td>
                  <td className="px-4 py-3 text-sm">5-10</td>
                  <td className="px-4 py-3 text-sm">2 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Medium</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Articles, products</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">speakable</td>
                  <td className="px-4 py-3 text-sm">5-10</td>
                  <td className="px-4 py-3 text-sm">3 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Medium</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Articles (voice search)</td>
                </tr>
                <tr className="bg-card hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">sameAs (social links)</td>
                  <td className="px-4 py-3 text-sm">5-10</td>
                  <td className="px-4 py-3 text-sm">2 min</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Medium</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Person, Organization</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Common Patterns */}
        <section className="pt-12 border-t border-border">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Common Patterns (Reusable Blocks)</h2>
          <p className="text-muted-foreground mb-6">
            Copy these patterns once and reuse across all your schemas. Just update the values with your real information.
          </p>

          <CodeSnippet
            title="Basic Author Pattern"
            description="Use this exact structure for any article, blog post, or recipe"
            code={`"author": {
  "@type": "Person",
  "name": "Your Name Here",
  "url": "https://yoursite.com/author/yourname",
  "sameAs": [
    "https://twitter.com/yourhandle",
    "https://linkedin.com/in/yourprofile"
  ]
}`}
          />

          <CodeSnippet
            title="Basic Publisher Pattern"
            description="Standard publisher format for all content types"
            code={`"publisher": {
  "@type": "Organization",
  "name": "Your Company Name",
  "logo": {
    "@type": "ImageObject",
    "url": "https://yoursite.com/logo.png",
    "width": 600,
    "height": 60
  },
  "url": "https://yoursite.com"
}`}
          />

          <CodeSnippet
            title="Structured Image Pattern"
            description="Better than plain string URLs (higher quality score)"
            code={`"image": {
  "@type": "ImageObject",
  "url": "https://yoursite.com/image.jpg",
  "width": 1200,
  "height": 630,
  "caption": "Descriptive caption for accessibility"
}`}
          />
        </section>

        {/* FAQ Section */}
        <section className="pt-12 border-t border-border">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Boost Your Schema Score?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Copy the properties you need, paste them into your schema, and watch your score improve. It's that simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/grader"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-background text-foreground hover:bg-background/90 transition-colors"
            >
              Grade Your Schema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to={isSignedIn ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              {isSignedIn ? 'Go to Dashboard' : 'Get Started Free'}
            </Link>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  )
}
