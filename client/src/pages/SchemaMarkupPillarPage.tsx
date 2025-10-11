import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Code,
  Zap,
  Search,
  FileJson,
  ChevronRight,
  Shield,
  Eye,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'

export default function SchemaMarkupPillarPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'Schema Markup: What, Why, and How | SuperSchema'
    window.scrollTo(0, 0)
  }, [])

  const schemaGenerators = [
    { name: 'FAQ Schema', path: '/faq-schema-generator', description: 'Q&A content structured data' },
    { name: 'Article Schema', path: '/article-schema-generator', description: 'News, blog posts, guides' },
    { name: 'BlogPosting Schema', path: '/blogposting-schema-generator', description: 'Blog-specific markup' },
    { name: 'HowTo Schema', path: '/howto-schema-generator', description: 'Step-by-step instructions' },
    { name: 'Product Schema', path: '/product-schema-generator', description: 'E-commerce products' },
    { name: 'LocalBusiness Schema', path: '/localbusiness-schema-generator', description: 'Physical locations' },
    { name: 'Organization Schema', path: '/organization-schema-generator', description: 'Company information' },
    { name: 'Event Schema', path: '/event-schema-generator', description: 'Events and webinars' },
    { name: 'Review Schema', path: '/review-schema-generator', description: 'Product/business reviews' },
    { name: 'Breadcrumb Schema', path: '/breadcrumb-schema-generator', description: 'Site navigation' }
  ]

  const implementationSteps = [
    {
      number: 1,
      title: 'Generate Your Schema',
      description: 'Create structured data using AI or manually. SuperSchema\'s AI reads your content and generates optimized markup automatically.',
      tips: [
        'Use SuperSchema to auto-detect schema types',
        'Or write JSON-LD manually following Schema.org specs',
        'Include all required properties for your chosen type',
        'Add recommended properties for richer results'
      ]
    },
    {
      number: 2,
      title: 'Validate Your Markup',
      description: 'Test schema before deploying. Validation catches syntax errors, missing properties, and compliance issues.',
      tips: [
        'Use Google Rich Results Test for preview',
        'Check Schema.org Validator for spec compliance',
        'SuperSchema auto-validates and scores quality',
        'Fix all critical errors before deployment'
      ]
    },
    {
      number: 3,
      title: 'Embed Schema in Your HTML',
      description: 'Add JSON-LD to your page\'s <head> or <body>. Most platforms support schema injection via plugins or custom code.',
      tips: [
        'Place JSON-LD script in <head> section',
        'Or add before closing </body> tag',
        'Use SuperSchema\'s HubSpot integration for one-click deployment',
        'Ensure schema loads on every relevant page'
      ]
    },
    {
      number: 4,
      title: 'Test & Monitor Results',
      description: 'Verify implementation and track rich results in search. Schema benefits appear gradually as search engines re-crawl.',
      tips: [
        'Check Google Search Console for rich result reports',
        'Monitor "Enhancements" section for errors',
        'Re-validate after CMS or theme updates',
        'Track CTR improvements for schema-enhanced pages'
      ]
    }
  ]

  const schemaFormats = [
    {
      format: 'JSON-LD',
      placement: 'Separate <script> tag',
      googlePreference: '✅ Recommended',
      easeOfUse: 'Easy - doesn\'t touch HTML',
      maintenance: 'Simple updates',
      example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title"
}
</script>`
    },
    {
      format: 'Microdata',
      placement: 'Inline HTML attributes',
      googlePreference: 'Supported',
      easeOfUse: 'Medium - requires HTML changes',
      maintenance: 'More complex',
      example: `<article itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">Your Article Title</h1>
</article>`
    },
    {
      format: 'RDFa',
      placement: 'Inline HTML attributes',
      googlePreference: 'Supported',
      easeOfUse: 'Complex - verbose syntax',
      maintenance: 'Most complex',
      example: `<article vocab="https://schema.org/" typeof="Article">
  <h1 property="headline">Your Article Title</h1>
</article>`
    }
  ]

  const commonMistakes = [
    {
      mistake: 'Invalid JSON Syntax',
      problem: 'One missing comma, bracket, or quote breaks the entire schema. Search engines ignore broken markup.',
      fix: 'Always validate with Google Rich Results Test. Use SuperSchema to generate error-free JSON-LD automatically.',
      severity: 'critical'
    },
    {
      mistake: 'Schema Doesn\'t Match Visible Content',
      problem: 'Marking up content that users can\'t see violates Google\'s guidelines and risks penalties.',
      fix: 'Only mark up content that\'s visible on the page. Schema must reflect what users actually see. Never lie to search engines.',
      severity: 'critical'
    },
    {
      mistake: 'Missing Required Properties',
      problem: 'Each schema type has required properties. Missing them prevents rich results from appearing.',
      fix: 'Check Schema.org documentation for required properties. SuperSchema highlights missing fields and suggests fixes.',
      severity: 'high'
    },
    {
      mistake: 'Duplicate or Conflicting Schema',
      problem: 'Multiple schema blocks of the same type confuse search engines and dilute signals.',
      fix: 'Consolidate into one comprehensive schema block per type. Remove duplicate or plugin-generated schema.',
      severity: 'high'
    },
    {
      mistake: 'Using Deprecated Schema Types',
      problem: 'Old schema types lose support. Deprecated properties don\'t trigger rich results.',
      fix: 'Stay updated with Schema.org changelog. SuperSchema uses current spec and warns about deprecated types.',
      severity: 'medium'
    },
    {
      mistake: 'Ignoring Validation Errors',
      problem: 'Warnings and errors prevent rich results. "It\'s just a warning" means "it won\'t work."',
      fix: 'Fix all errors and warnings before deployment. Treat validation seriously - your rich results depend on it.',
      severity: 'high'
    }
  ]

  const faqs = [
    {
      question: 'What is schema markup?',
      answer: 'Schema markup is structured data vocabulary (from Schema.org) that helps search engines and AI understand your content. It\'s machine-readable code (usually JSON-LD) added to your HTML that defines what each piece of content represents - an article, product, event, FAQ, etc. Schema enables rich results in search, powers knowledge graphs, and makes your content AI-ready.'
    },
    {
      question: 'Which schema format should I use?',
      answer: 'Use JSON-LD. Google explicitly recommends it as the preferred format because it doesn\'t require changes to your HTML structure, is easier to maintain, and separates data from markup. While Microdata and RDFa are supported, JSON-LD is simpler, cleaner, and the industry standard. SuperSchema generates JSON-LD exclusively.'
    },
    {
      question: 'Do I need schema on every page?',
      answer: 'Not necessarily, but strategic schema implementation matters. Prioritize: homepage (Organization schema), blog posts (Article schema), FAQs (FAQPage schema), products (Product schema), and key landing pages. More schema = more opportunities for rich results and AI citations. But quality beats quantity - implement schema correctly on important pages first.'
    },
    {
      question: 'How long does it take to see results from schema?',
      answer: 'Schema implementation is instant, but search engines need time to re-crawl and re-index your pages. Rich snippets can appear within days to weeks. Ranking improvements take longer - typically 2-8 weeks. The key: implement schema now so you\'re ready when search engines next crawl your site. Use Google Search Console to monitor rich result status.'
    },
    {
      question: 'Can schema markup hurt my SEO?',
      answer: 'Only if implemented incorrectly. Invalid schema gets ignored (no harm, but no benefit). Schema that doesn\'t match visible content can trigger manual penalties. Duplicate or conflicting schema confuses search engines. But properly implemented schema? Pure upside - better rankings, rich snippets, and AI visibility. Always validate before deploying.'
    },
    {
      question: 'What\'s the difference between schema types?',
      answer: 'Schema types define what your content represents. Article schema is for blog posts and news. Product schema is for e-commerce items. FAQPage schema structures Q&A content. Event schema marks up conferences and webinars. Each type has specific properties that tell search engines exactly what your content offers. Choose the type that best matches your content\'s purpose.'
    },
    {
      question: 'How do I validate schema markup?',
      answer: 'Use Google\'s Rich Results Test (search.google.com/test/rich-results) to see how Google interprets your schema and preview rich results. Use Schema.org Validator for spec compliance. SuperSchema validates automatically and provides quality scores. Fix all errors before deployment - warnings and errors prevent rich results from appearing.'
    },
    {
      question: 'Which schema types should I prioritize?',
      answer: 'Start with: (1) Organization schema on your homepage for brand identity, (2) Article schema on blog posts for rich snippets, (3) FAQPage schema for Q&A content (great for AEO), (4) Breadcrumb schema for navigation context. Then add Product, LocalBusiness, HowTo, or Event schema based on your business model. Focus on types that match your content and business goals.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PillarPageNav />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Schema Markup: What, Why, and How
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              The foundation of rich results, AI understanding, and SEO dominance. Here's everything you need to know about structured data. 🎯
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-success" />
                434% More Likely for Rich Snippets
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <FileJson className="h-4 w-4 mr-2 text-success" />
                1,000+ Schema.org Types
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Code className="h-4 w-4 mr-2 text-success" />
                JSON-LD Preferred Format
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-20">

        {/* What Is Schema Markup */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Is Schema Markup?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Schema markup is a standardized vocabulary created by Schema.org (a collaboration between Google, Microsoft, Yahoo, and Yandex) that helps search engines and AI understand the meaning and context of your content.
            </p>
            <p>
              Think of schema as metadata for machines. While humans see a blog post, search engines see HTML code. Schema bridges that gap by explicitly defining: "This is an Article. This is the headline. This is the author. This is when it was published."
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
              <div className="flex items-start space-x-4">
                <FileJson className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Schema = Machine-Readable Context</h4>
                  <p className="text-sm">
                    Without schema, search engines guess based on HTML patterns. With schema, you explicitly tell them: "This is a product. Here's the price. Here's the rating. Here's availability." No guessing. No ambiguity. Just structured, machine-readable data.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Schema markup is typically implemented using JSON-LD (JavaScript Object Notation for Linked Data), a format Google explicitly recommends. It looks like this:
            </p>

            <div className="bg-muted/50 border border-border rounded-lg p-4 my-6 font-mono text-sm overflow-x-auto">
              <pre>{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "author": {
    "@type": "Person",
    "name": "Jane Doe"
  },
  "datePublished": "2025-01-10"
}
</script>`}</pre>
            </div>

            <p>
              This tells search engines: "This page contains an Article. The headline is 'Your Article Title.' The author is Jane Doe. It was published on January 10, 2025." Clear. Structured. Unambiguous.
            </p>

            <p>
              Schema.org provides over 1,000 types covering articles, products, events, recipes, FAQs, organizations, people, places, and more. Each type has specific properties that define its attributes.
            </p>
          </div>
        </section>

        {/* Why Schema Matters */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Schema Markup Matters</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Schema markup isn't just "nice to have" - it's a competitive advantage. Here's why it matters for SEO, rich results, and AI visibility:
            </p>

            <div className="my-8 space-y-6">
              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-success/10">
                    <Eye className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">Rich Snippets & Enhanced Search Results</h3>
                    <p className="text-sm">
                      Schema enables rich results: star ratings, recipe cards, event details, FAQ accordions, product pricing, and more. Pages with rich snippets get 58% of clicks compared to 41% for non-rich results. Schema = higher visibility, higher CTR.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">Entity Understanding & Knowledge Graph</h3>
                    <p className="text-sm">
                      Schema helps Google understand entities - people, places, organizations, products - and their relationships. This powers knowledge panels, entity carousels, and "People also ask" boxes. Schema makes your brand a recognized entity, not just a website.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-info/10">
                    <Zap className="h-6 w-6 text-info" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">AEO & AI Search Readiness</h3>
                    <p className="text-sm">
                      AI-powered search engines (ChatGPT, Perplexity, Google AI Overviews) rely on structured data to understand and cite content. Schema makes your content 434% more likely to appear in AI-generated answers. Without schema, you're invisible to AI search.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-warning/10">
                    <Search className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">Voice Search Optimization</h3>
                    <p className="text-sm">
                      Voice assistants (Alexa, Google Assistant, Siri) pull answers from schema-rich content. FAQPage schema directly answers voice queries. HowTo schema provides step-by-step instructions. Schema is how you win voice search.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="my-8 overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Metric</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Without Schema</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">With Schema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Rich Snippet Eligibility</td>
                    <td className="px-6 py-4">0% - Not eligible</td>
                    <td className="px-6 py-4 text-success">✅ Eligible for all types</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Click-Through Rate</td>
                    <td className="px-6 py-4">41% average CTR</td>
                    <td className="px-6 py-4 text-success">58% average CTR (+41%)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">AI Citation Probability</td>
                    <td className="px-6 py-4">Low - AI must guess</td>
                    <td className="px-6 py-4 text-success">434% more likely</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Knowledge Graph</td>
                    <td className="px-6 py-4">Not recognized as entity</td>
                    <td className="px-6 py-4 text-success">✅ Entity recognition</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Voice Search</td>
                    <td className="px-6 py-4">Rarely selected</td>
                    <td className="px-6 py-4 text-success">✅ Featured answers</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-success/10 border border-success/20 rounded-lg p-6 my-8">
              <p className="font-semibold text-foreground">Bottom Line:</p>
              <p className="mt-2">
                Schema isn't optional anymore. It's how search engines and AI understand your content. Implement it correctly, and you get rich results, higher CTR, AI citations, and entity recognition. Skip it, and you're competing with one hand tied behind your back.
              </p>
            </div>
          </div>
        </section>

        {/* Schema Formats */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Schema Markup Formats: JSON-LD vs Microdata vs RDFa</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              There are three main formats for schema markup: JSON-LD, Microdata, and RDFa. Google supports all three, but explicitly recommends JSON-LD. Here's why:
            </p>

            {/* Format Comparison Table */}
            <div className="my-8 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Format</th>
                    <th className="px-4 py-3 text-left font-semibold">Placement</th>
                    <th className="px-4 py-3 text-left font-semibold">Google Preference</th>
                    <th className="px-4 py-3 text-left font-semibold">Ease of Use</th>
                    <th className="px-4 py-3 text-left font-semibold">Maintenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schemaFormats.map((format, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 font-medium">{format.format}</td>
                      <td className="px-4 py-4">{format.placement}</td>
                      <td className="px-4 py-4">{format.googlePreference}</td>
                      <td className="px-4 py-4">{format.easeOfUse}</td>
                      <td className="px-4 py-4">{format.maintenance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-semibold mt-8 mb-4">Format Examples</h3>

            <div className="space-y-6">
              {schemaFormats.map((format, index) => (
                <div key={index} className="border border-border rounded-lg p-6 bg-card">
                  <h4 className="font-semibold text-lg mb-3 text-foreground">{format.format}</h4>
                  <div className="bg-muted/50 rounded p-4 font-mono text-xs overflow-x-auto mb-3">
                    <pre>{format.example}</pre>
                  </div>
                  {format.format === 'JSON-LD' && (
                    <div className="bg-success/10 border border-success/20 rounded p-3">
                      <p className="text-sm"><strong className="text-foreground">Why Google Recommends This:</strong> JSON-LD doesn't require changes to your HTML. It's clean, easy to maintain, and can be dynamically generated. You can add, update, or remove schema without touching page content.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
              <p className="font-semibold text-foreground mb-2">Our Recommendation: Use JSON-LD</p>
              <p className="text-sm">
                SuperSchema generates JSON-LD exclusively because it's simpler, cleaner, and the industry standard. Microdata and RDFa are legacy formats - still supported, but unnecessarily complex. JSON-LD is the future. Stick with it.
              </p>
            </div>

            <h3 className="text-2xl font-semibold mt-8 mb-4">Popular Schema Types</h3>
            <p>
              Schema.org offers 1,000+ types, but these are the most impactful for SEO and AEO:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
              <Link
                to="/faq-schema-generator"
                className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold group-hover:text-primary transition-colors">FAQ Schema</h5>
                    <p className="text-sm text-muted-foreground">Q&A content, perfect for AEO</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                </div>
              </Link>

              <Link
                to="/article-schema-generator"
                className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold group-hover:text-primary transition-colors">Article Schema</h5>
                    <p className="text-sm text-muted-foreground">Blog posts, news, guides</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Implementation Guide */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How to Add Schema to Your Website</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p>
              Adding schema to your website takes four steps: Generate, Validate, Embed, Test. Here's exactly how to do it:
            </p>

            {implementationSteps.map((step, index) => (
              <div key={index} className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                    <p className="mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start space-x-2">
                          <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-lg p-8 text-center my-8">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2 text-foreground">Skip Manual Coding with SuperSchema</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Paste your URL. Our AI detects schema types, extracts your content, and generates production-ready JSON-LD in under 30 seconds. No manual data entry. No Schema.org documentation hunting.
              </p>
              <Link
                to="/sign-up"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
              >
                Start Free (2 Credits)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Google Guidelines */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Google's Schema Guidelines & Best Practices</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Google has strict guidelines for schema markup. Follow them, or risk penalties. Here's what matters:
            </p>

            <div className="space-y-4 my-8">
              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">JSON-LD is Preferred</h4>
                    <p className="text-sm">Google explicitly recommends JSON-LD over Microdata and RDFa. It's cleaner, easier to maintain, and doesn't require HTML changes. Stick with JSON-LD.</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Schema Must Match Visible Content</h4>
                    <p className="text-sm">Never mark up content that users can't see. Schema must reflect what's actually on the page. Lying to search engines violates guidelines and triggers penalties.</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Avoid Duplicate Schema</h4>
                    <p className="text-sm">One schema block per type per page. Multiple Article schemas or conflicting data confuses search engines. Consolidate into one comprehensive block.</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-6 w-6 text-info flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Keep Schema Updated</h4>
                    <p className="text-sm">CMS updates, theme changes, and plugin updates can break schema. Re-validate after any major site changes. Monitor Google Search Console for schema errors.</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-start space-x-3">
                  <Code className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Include All Required Properties</h4>
                    <p className="text-sm">Each schema type has required properties. Missing them prevents rich results. Check Schema.org documentation or use SuperSchema to auto-include required fields.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-6 my-8">
              <h4 className="font-semibold mb-2 text-foreground">📚 Official Google Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>• <a href="https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Structured Data Introduction</a></li>
                <li>• <a href="https://developers.google.com/search/docs/appearance/structured-data/sd-policies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Structured Data Guidelines</a></li>
                <li>• <a href="https://schema.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Schema.org Official Documentation</a></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Validation Tools */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Schema Validation Tools</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Never deploy schema without validating it first. These tools catch errors, preview rich results, and ensure compliance:
            </p>

            <div className="space-y-4 my-8">
              <div className="border border-primary rounded-lg p-6 bg-primary/5">
                <h4 className="font-semibold text-lg mb-2 text-foreground">Google Rich Results Test</h4>
                <p className="text-sm mb-3">Google's official tool shows how your schema will appear in search results. Tests eligibility for rich snippets and highlights errors.</p>
                <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-semibold">
                  search.google.com/test/rich-results →
                </a>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <h4 className="font-semibold text-lg mb-2 text-foreground">Schema.org Validator</h4>
                <p className="text-sm mb-3">Official Schema.org validation tool. Checks compliance with spec, identifies syntax errors, and validates property values.</p>
                <a href="https://validator.schema.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-semibold">
                  validator.schema.org →
                </a>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <h4 className="font-semibold text-lg mb-2 text-foreground">SuperSchema Quality Scoring</h4>
                <p className="text-sm mb-3">Our AI validates schema and provides quality scores (0-100). Highlights missing properties, suggests optimizations, and auto-fixes common errors.</p>
                <Link to={isSignedIn ? "/generate" : "/sign-up"} className="text-primary hover:underline text-sm font-semibold">
                  Try SuperSchema →
                </Link>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 my-8">
              <p className="font-semibold text-foreground mb-2">⚠️ Always Fix Validation Errors</p>
              <p className="text-sm">
                Warnings aren't optional - they prevent rich results. "Just a warning" means "won't work." Fix all errors and warnings before deploying schema. Your rich results depend on it.
              </p>
            </div>
          </div>
        </section>

        {/* Common Mistakes */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Common Schema Markup Mistakes</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Most schema failures come from preventable mistakes. Here's what kills rich results - and how to fix it:
            </p>

            <div className="space-y-4 my-8">
              {commonMistakes.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-6 ${
                    item.severity === 'critical'
                      ? 'border-destructive/50 bg-destructive/5'
                      : item.severity === 'high'
                      ? 'border-warning/50 bg-warning/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      item.severity === 'critical'
                        ? 'bg-destructive/20'
                        : item.severity === 'high'
                        ? 'bg-warning/20'
                        : 'bg-muted'
                    }`}>
                      <AlertTriangle className={`h-6 w-6 ${
                        item.severity === 'critical'
                          ? 'text-destructive'
                          : item.severity === 'high'
                          ? 'text-warning'
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-foreground">{item.mistake}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.severity === 'critical'
                            ? 'bg-destructive/20 text-destructive'
                            : item.severity === 'high'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mb-2"><strong className="text-foreground">Problem:</strong> {item.problem}</p>
                      <p className="text-sm"><strong className="text-success">Fix:</strong> {item.fix}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Schema Generators */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Free Schema Generators</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              SuperSchema offers free schema generators for all major content types. Generate production-ready JSON-LD in seconds.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
              {schemaGenerators.map((generator, index) => (
                <Link
                  key={index}
                  to={generator.path}
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">{generator.name}</h5>
                      <p className="text-sm text-muted-foreground">{generator.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 my-8">
              <Link
                to={isSignedIn ? "/generate" : "/sign-up"}
                className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
              >
                <Zap className="h-8 w-8 text-primary mb-3" />
                <h5 className="font-semibold mb-2 text-foreground">Generate Schema</h5>
                <p className="text-sm text-muted-foreground mb-3">AI-powered schema generation for any URL</p>
                <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Start Generating <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
              <Link
                to={isSignedIn ? "/library" : "/sign-up"}
                className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
              >
                <Search className="h-8 w-8 text-primary mb-3" />
                <h5 className="font-semibold mb-2 text-foreground">Schema Library</h5>
                <p className="text-sm text-muted-foreground mb-3">Manage all your URLs and schema in one place</p>
                <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  View Library <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Implement Schema Markup?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands using SuperSchema to generate valid, optimized JSON-LD in seconds. Start with 2 free credits - no credit card required.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center px-8 py-3 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors text-lg font-semibold"
          >
            Get Your Free Credits
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>

      {/* Footer */}
      <Footer />

      {/* Schema Markup - FAQPage, Article, and BreadcrumbList */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        }, null, 2)}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Schema Markup: What, Why, and How",
          "description": "Complete guide to schema markup, structured data, and JSON-LD. Learn what schema is, why it matters for SEO and AI, and how to implement it correctly.",
          "author": {
            "@type": "Organization",
            "name": "SuperSchema",
            "url": "https://superschema.ai"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Lightbulb Moment Labs",
            "url": "https://superschema.ai"
          },
          "datePublished": "2025-01-10",
          "dateModified": "2025-01-10"
        }, null, 2)}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://superschema.ai"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Resources",
              "item": "https://superschema.ai/schema-markup"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Schema Markup Guide",
              "item": "https://superschema.ai/schema-markup"
            }
          ]
        }, null, 2)}
      </script>
    </div>
  )
}
