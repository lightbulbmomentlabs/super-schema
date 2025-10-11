import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Network,
  Link2,
  Users,
  Building2,
  FileJson,
  Search,
  Zap,
  Target,
  Globe,
  GitBranch,
  AlertTriangle,
  ListChecks
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'

export default function EntityBasedSeoStrategiesPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'Entity-Based SEO Strategies: The Future of Generative Search | SuperSchema'
    window.scrollTo(0, 0)
  }, [])

  const entityConnections = [
    {
      from: 'Brand',
      to: 'Tool',
      icon: Building2,
      description: 'Organization defines product offerings'
    },
    {
      from: 'Tool',
      to: 'Person',
      icon: Users,
      description: 'Products connect to author entities'
    },
    {
      from: 'Person',
      to: 'Topic',
      icon: Target,
      description: 'Authors establish topical authority'
    },
    {
      from: 'Topic',
      to: 'Brand',
      icon: Network,
      description: 'Topics reinforce brand expertise'
    }
  ]

  const identificationProcess = [
    {
      step: 'Crawl',
      description: 'AI discovers pages and extracts potential entities from content, schema markup, and page structure.'
    },
    {
      step: 'Disambiguate',
      description: 'Determines if "Apple" means the fruit or the company. Uses context, sameAs links, and relationships to clarify.'
    },
    {
      step: 'Connect',
      description: 'Maps relationships between entities: brand → product → topic. Builds knowledge graph connections.'
    },
    {
      step: 'Rank',
      description: 'Assigns credibility scores based on authority signals, linkage quality, and entity consistency.'
    }
  ]

  const schemaTypes = [
    {
      type: 'Organization',
      purpose: 'Defines brand identity',
      description: 'Establishes who you are, what you do, and how you\'re connected across the web',
      icon: Building2
    },
    {
      type: 'Person',
      purpose: 'Connects authors and experts',
      description: 'Links content creators to their credentials, social profiles, and published work',
      icon: Users
    },
    {
      type: 'Product',
      purpose: 'Defines offerings',
      description: 'Describes what you sell or provide, with features, pricing, and relationships',
      icon: FileJson
    },
    {
      type: 'Article/HowTo/FAQ',
      purpose: 'Reinforces topical authority',
      description: 'Demonstrates expertise on specific subjects and question-answer relationships',
      icon: Target
    },
    {
      type: 'sameAs',
      purpose: 'Links external verification',
      description: 'Connects to Wikipedia, Wikidata, LinkedIn for entity disambiguation',
      icon: Link2
    }
  ]

  const entityStrategy = [
    {
      step: 1,
      title: 'Identify Your Primary Entities',
      description: 'Define your core brand, products, people, and topics. Map out the entity chain.',
      example: 'SuperSchema → Tool → Structured Data → AI Search → AEO',
      action: 'Create a list of every entity your brand represents or is connected to'
    },
    {
      step: 2,
      title: 'Add Context Through Schema Markup',
      description: 'Use JSON-LD to declare each entity with all required properties. Link related types together.',
      example: 'Organization schema → links to Product schema → links to Author (Person) schema',
      action: 'Implement consistent schema across all pages representing entities'
    },
    {
      step: 3,
      title: 'Connect Entities Across the Web',
      description: 'Use sameAs properties to link to authoritative sources. Ensures search engines can verify your identity.',
      example: 'Wikipedia, Wikidata, LinkedIn, Crunchbase, GitHub - all linked via sameAs',
      action: 'Add minimum 3-5 sameAs links to every Organization and Person entity'
    },
    {
      step: 4,
      title: 'Strengthen Internal Linking',
      description: 'Each page should represent one entity concept. Use semantic anchor text that reinforces relationships.',
      example: 'Link "Answer Engine Optimization" to AEO page, "Schema Markup" to schema guide',
      action: 'Audit internal links - replace generic "click here" with entity-rich anchor text'
    },
    {
      step: 5,
      title: 'Validate and Monitor',
      description: 'Test all schema with validation tools. Revalidate quarterly and after any major site changes.',
      example: 'Use SuperSchema\'s Grader or Google\'s Rich Results Test weekly',
      action: 'Set calendar reminder to validate schema every 90 days'
    }
  ]

  const entitySignals = [
    {
      signal: 'Entity Consistency',
      description: 'Same name/brand used identically across all schema types, pages, and external mentions.',
      strength: 'Critical',
      example: 'Always "SuperSchema" - never "Super Schema" or "superschema.ai"'
    },
    {
      signal: 'sameAs Linkage',
      description: 'Connected to Wikipedia, Wikidata, and authoritative sources that verify identity.',
      strength: 'High',
      example: 'Organization schema includes Wikipedia page, Wikidata entry, LinkedIn profile'
    },
    {
      signal: 'Relationship Mapping',
      description: 'Clear connections between brand, products, authors shown through linked schema types.',
      strength: 'High',
      example: 'Article schema connects to Author (Person) and Publisher (Organization)'
    },
    {
      signal: 'Mention Frequency',
      description: 'External citations and brand mentions across the web reinforce entity authority.',
      strength: 'Medium',
      example: 'News articles, blog posts, social media mentions with consistent naming'
    },
    {
      signal: 'Schema Completeness',
      description: 'All required properties filled, no validation errors, complete entity definitions.',
      strength: 'Critical',
      example: 'Organization includes name, url, logo, sameAs, founder, foundingDate'
    },
    {
      signal: 'Topical Authority',
      description: 'Content depth on entity-related topics demonstrates expertise and specialization.',
      strength: 'Medium',
      example: 'Multiple comprehensive articles on schema markup, AEO, and structured data'
    }
  ]

  const commonMistakes = [
    {
      mistake: 'Treating Entities Like Keywords',
      problem: 'Repeating entity names without proper schema definition or structured relationships.',
      fix: 'Define each entity once with complete schema, then reference it through linked properties.',
      severity: 'high'
    },
    {
      mistake: 'Ignoring sameAs Properties',
      problem: 'Missing external verification links means search engines can\'t confirm your identity.',
      fix: 'Add sameAs links to Wikipedia, Wikidata, LinkedIn, and other authoritative sources.',
      severity: 'critical'
    },
    {
      mistake: 'Inconsistent Entity Naming',
      problem: 'Using variations like "SuperSchema" vs "Super Schema" vs "superschema.ai" across pages.',
      fix: 'Pick one canonical name and use it identically everywhere - schema, content, URLs.',
      severity: 'critical'
    },
    {
      mistake: 'Neglecting Schema Updates',
      problem: 'After rebrands, mergers, or site changes, old schema remains - confusing search engines.',
      fix: 'Audit all schema quarterly. Update immediately after any major business changes.',
      severity: 'medium'
    },
    {
      mistake: 'Relying on Unstructured Backlinks',
      problem: 'Traditional backlinks don\'t provide entity context without proper schema markup.',
      fix: 'Combine quality backlinks with schema markup that defines entity relationships.',
      severity: 'medium'
    }
  ]

  const miniKnowledgeGraph = [
    {
      pageType: 'Homepage',
      schema: 'Organization',
      role: 'Hub',
      description: 'Central entity defining brand, mission, and offerings'
    },
    {
      pageType: 'Author Pages',
      schema: 'Person',
      role: 'Linked to Organization',
      description: 'Connects authors to brand via "worksFor" or "affiliation"'
    },
    {
      pageType: 'Blog Posts',
      schema: 'Article',
      role: 'Linked to Author + Organization',
      description: 'Content connects to both creator and publisher entities'
    },
    {
      pageType: 'Product Pages',
      schema: 'Product',
      role: 'Linked to Organization',
      description: 'Offerings connected to brand via "manufacturer" or "brand"'
    },
    {
      pageType: 'Topic/Guide Pages',
      schema: 'FAQ/HowTo',
      role: 'Linked to Organization + Authors',
      description: 'Expertise content reinforces topical entity authority'
    }
  ]

  const faqs = [
    {
      question: 'What\'s the difference between Entity SEO and Semantic SEO?',
      answer: 'Entity SEO focuses specifically on defining and connecting distinct entities (people, organizations, products) using structured data. Semantic SEO is broader - it\'s about optimizing for meaning, context, and relationships between concepts. Think of it this way: Entity SEO is the tactical implementation (schema markup, sameAs links, entity definitions), while Semantic SEO is the strategic approach (topic clusters, contextual relevance, user intent). Entity SEO is a subset of Semantic SEO.'
    },
    {
      question: 'How does structured data help Google understand entities?',
      answer: 'Structured data (schema markup) explicitly tells Google what each entity is and how it relates to other entities. Without schema, Google has to guess - "Is this a person or a company? Is this author related to this organization?" With schema, you declare it: "@type": "Person", "worksFor": {"@type": "Organization"}. The sameAs property is especially powerful - it links your entity to Wikipedia or Wikidata entries, letting Google inherit all that verified information and confirm your identity.'
    },
    {
      question: 'Is entity-based SEO the same as AEO?',
      answer: 'No, but they\'re closely related. Entity-based SEO is the foundation - it\'s how you define who you are and what you\'re about using structured data. AEO (Answer Engine Optimization) is the application - it\'s how you use that entity foundation to get cited in AI-generated answers. You need entity-based SEO first (clear identity, verified connections, consistent naming) before AEO tactics (answer formatting, question targeting, citation-worthy content) can work effectively.'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      <PillarPageNav />

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-20">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/geo" className="hover:text-foreground transition-colors">
            Generative Engine Optimization
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Entity-Based SEO Strategies</span>
        </nav>

        {/* Hero Section */}
        <section>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Entity-Based SEO Strategies:
            </span>{' '}
            The Future of Generative Search Optimization
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            Google, Bing, and every AI-powered search engine now think in entities - not keywords. To show up in generative results, your brand, content, and connections must form a clear knowledge graph.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Entity-Based SEO is the foundation of GEO (Generative Engine Optimization). It's about relationships, not repetition. Structure, not stuffing. Identity, not inference.
          </p>
          <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg mb-6">
            <p className="text-xl font-bold text-foreground mb-2">Google's Knowledge Graph: 570M → 8B Entities</p>
            <p className="text-muted-foreground">Then contracted 6.26% in June 2025's "clarity cleanup" - proving quality matters more than quantity.</p>
          </div>
          <div className="p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <p className="text-foreground font-semibold">
              SuperSchema helps you define your digital identity through clean, connected JSON-LD markup - the building blocks of entities.
            </p>
            <Link
              to={isSignedIn ? "/generate" : "/sign-up"}
              className="inline-flex items-center text-primary font-semibold mt-3 hover:translate-x-1 transition-transform"
            >
              Build Your Entity Graph <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* What Is Entity-Based SEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Is Entity-Based SEO?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Entities are people, places, things, or concepts recognized uniquely by search engines. They're not just words on a page - they're verified identities with attributes, relationships, and context.
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            Entity-based SEO replaces the need for traditional keyword density. It's about relationships, not repetition. Search engines don't count how many times you say "SEO tool" - they verify whether you are an SEO tool, made by whom, used for what.
          </p>
          <div className="p-6 bg-muted rounded-lg border border-border mb-8">
            <h3 className="font-semibold mb-3 text-foreground">Real Example:</h3>
            <p className="text-muted-foreground">
              When Google sees "SuperSchema," it shouldn't just read the words. It should recognize it as a <span className="text-foreground font-semibold">verified product</span> made by <span className="text-foreground font-semibold">Lightbulb Moment Labs</span>, used for <span className="text-foreground font-semibold">AEO optimization</span>, connected to <span className="text-foreground font-semibold">schema markup</span> and <span className="text-foreground font-semibold">structured data</span>.
            </p>
          </div>
          <h3 className="text-2xl font-semibold mb-6">How Entities Connect:</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {entityConnections.map((connection, index) => {
              const Icon = connection.icon
              return (
                <div key={index} className="p-6 border border-border rounded-lg bg-card">
                  <div className="flex items-center mb-3">
                    <Icon className="h-6 w-6 text-primary mr-2" />
                    <h4 className="font-semibold text-foreground">{connection.from} ↔ {connection.to}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{connection.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Why Entities Matter in GEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Entities Matter in Generative Engine Optimization (GEO)</h2>
          <p className="text-lg text-muted-foreground mb-8">
            AI engines like SGE, Copilot, and Perplexity don't rank pages - they reason about entities. They don't just match keywords - they evaluate credibility, trace relationships, and attribute sources based on entity authority.
          </p>
          <div className="space-y-4 mb-8">
            <div className="p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
              <h3 className="font-semibold mb-2 text-foreground">Understand Credibility</h3>
              <p className="text-muted-foreground">Is this a verified organization? Does this author have credentials? Are they connected to authoritative sources?</p>
            </div>
            <div className="p-6 border-l-4 border-blue-500 bg-blue-500/5 rounded-r-lg">
              <h3 className="font-semibold mb-2 text-foreground">Attribute Accurate Context</h3>
              <p className="text-muted-foreground">What is this content about? Who created it? What organization published it? How do these entities relate?</p>
            </div>
            <div className="p-6 border-l-4 border-purple-500 bg-purple-500/5 rounded-r-lg">
              <h3 className="font-semibold mb-2 text-foreground">Connect Authors, Organizations, Topics</h3>
              <p className="text-muted-foreground">Schema markup explicitly defines these connections through linked properties and relationship types.</p>
            </div>
            <div className="p-6 border-l-4 border-green-500 bg-green-500/5 rounded-r-lg">
              <h3 className="font-semibold mb-2 text-foreground">Build Trust Through Structured Relationships</h3>
              <p className="text-muted-foreground">Consistent entity signals across multiple pages and external sources create confidence in AI citation decisions.</p>
            </div>
          </div>
          <div className="p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <p className="text-xl font-semibold italic text-foreground">
              "Entities are how AI search builds trust - structured data is how you introduce yourself."
            </p>
          </div>
          <Link
            to="/ai-search-optimization/how-ai-engines-rank-sources"
            className="inline-flex items-center text-primary font-semibold mt-6 hover:translate-x-1 transition-transform"
          >
            Learn how AI engines evaluate and rank sources <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>

        {/* How Search Engines Identify Entities */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How Search Engines Identify and Rank Entities</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Understanding the entity identification process helps you optimize for what search engines actually do:
          </p>
          <div className="space-y-6">
            {identificationProcess.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{item.step}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 bg-muted rounded-lg border border-border">
            <h3 className="font-semibold mb-3 text-foreground flex items-center">
              <Network className="h-5 w-5 mr-2 text-primary" />
              Knowledge Graphs: The Foundation
            </h3>
            <p className="text-muted-foreground mb-3">
              Google's Knowledge Graph powers entity understanding. It expanded from 570 million entities to 8 billion entities in under 10 years. In June 2025, it contracted by 6.26% (wiping out 3 billion entities) in a "clarity cleanup" - proof that Google prioritizes quality, verified entities over quantity.
            </p>
            <p className="text-sm text-muted-foreground">
              Your goal: become one of the verified, high-quality entities that survived the cleanup.
            </p>
          </div>
        </section>

        {/* Schema Markup Bridge */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Schema Markup: The Bridge Between SEO and AI Understanding</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Schema markup is how you formally introduce your entities to search engines. It's not optional for entity-based SEO - it's the core mechanism.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {schemaTypes.map((type, index) => {
              const Icon = type.icon
              return (
                <div key={index} className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors">
                  <div className="flex items-center mb-3">
                    <Icon className="h-6 w-6 text-primary mr-2" />
                    <h3 className="text-xl font-semibold">{type.type}</h3>
                  </div>
                  <p className="text-primary font-semibold mb-2">→ {type.purpose}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              )
            })}
          </div>
          <div className="bg-muted p-6 rounded-lg border border-border mb-6">
            <p className="text-sm text-muted-foreground mb-2 font-mono">Example: Organization Entity with sameAs Links</p>
            <pre className="text-sm text-foreground overflow-x-auto">
{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SuperSchema",
  "url": "https://superschema.ai",
  "logo": "https://superschema.ai/logo.png",
  "sameAs": [
    "https://en.wikipedia.org/wiki/SuperSchema",
    "https://www.wikidata.org/wiki/Q123456",
    "https://www.linkedin.com/company/superschema",
    "https://twitter.com/superschema"
  ],
  "founder": {
    "@type": "Person",
    "name": "Lightbulb Moment Labs"
  }
}`}
            </pre>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={isSignedIn ? "/generate" : "/sign-up"}
              className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
            >
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h5 className="font-semibold mb-2 text-foreground">Generate Connected JSON-LD</h5>
              <p className="text-sm text-muted-foreground mb-3">AI-powered schema with entity relationships</p>
              <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Start Generating <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </div>
        </section>

        {/* 5-Step Strategy */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Building Your Entity Graph: The Core 5-Step Strategy</h2>
          <p className="text-lg text-muted-foreground mb-8">
            This is the practical framework for implementing entity-based SEO. Follow these steps sequentially:
          </p>
          <div className="space-y-8">
            {entityStrategy.map((item, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mr-4">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded mb-3">
                      <p className="text-sm font-mono text-foreground">Example: {item.example}</p>
                    </div>
                    <p className="text-sm text-foreground"><span className="font-semibold">Action:</span> {item.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Entity Signals */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Entity Signals That Boost Your GEO Visibility</h2>
          <p className="text-lg text-muted-foreground mb-8">
            These are the core signals that strengthen your entity authority in AI search systems:
          </p>
          <div className="space-y-4">
            {entitySignals.map((item, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground">{item.signal}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.strength === 'Critical' ? 'bg-red-500/20 text-red-600' :
                    item.strength === 'High' ? 'bg-orange-500/20 text-orange-600' :
                    'bg-blue-500/20 text-blue-600'
                  }`}>
                    {item.strength}
                  </span>
                </div>
                <p className="text-muted-foreground mb-3">{item.description}</p>
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm text-foreground"><span className="font-semibold">Example:</span> {item.example}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-r">
            <p className="text-foreground font-semibold">
              Pro Tip: Think of entity signals as your brand's reputation score for AI search.
            </p>
          </div>
        </section>

        {/* Common Mistakes */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Common Mistakes in Entity-Based SEO</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Avoid these common pitfalls that weaken entity recognition and authority:
          </p>
          <div className="space-y-6">
            {commonMistakes.map((item, index) => (
              <div key={index} className={`p-6 border-l-4 rounded-r-lg ${
                item.severity === 'critical' ? 'border-red-500 bg-red-500/5' :
                item.severity === 'high' ? 'border-orange-500 bg-orange-500/5' :
                'border-yellow-500 bg-yellow-500/5'
              }`}>
                <div className="flex items-start mb-3">
                  <AlertTriangle className={`h-6 w-6 mr-3 mt-1 flex-shrink-0 ${
                    item.severity === 'critical' ? 'text-red-500' :
                    item.severity === 'high' ? 'text-orange-500' :
                    'text-yellow-500'
                  }`} />
                  <h3 className="text-xl font-semibold text-foreground">{item.mistake}</h3>
                </div>
                <p className="text-muted-foreground mb-3"><span className="font-semibold">Why it matters:</span> {item.problem}</p>
                <p className="text-foreground"><span className="font-semibold text-green-600">Fix:</span> {item.fix}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to={isSignedIn ? "/generate" : "/sign-up"}
              className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
            >
              <CheckCircle className="h-8 w-8 text-primary mb-3" />
              <h5 className="font-semibold mb-2 text-foreground">Automatic Entity Alignment</h5>
              <p className="text-sm text-muted-foreground mb-3">SuperSchema ensures consistent entity definitions</p>
              <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Avoid the Guesswork <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </div>
        </section>

        {/* Mini Knowledge Graph */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Advanced Strategy: Building a "Mini Knowledge Graph" for Your Site</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create an internal entity ecosystem where every page connects to form a cohesive knowledge graph:
          </p>
          <div className="space-y-4 mb-8">
            {miniKnowledgeGraph.map((item, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-start">
                  <GitBranch className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{item.pageType}</h3>
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">{item.schema}</span>
                    </div>
                    <p className="text-primary font-semibold text-sm mb-2">{item.role}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-muted rounded-lg border border-border">
            <h3 className="font-semibold mb-3 text-foreground">How This Works:</h3>
            <p className="text-muted-foreground mb-3">
              Each schema type references others through properties like "author," "publisher," "worksFor," "manufacturer," and "brand." This creates an RDF Triple framework - a structured representation of relationships that search engines can follow.
            </p>
            <p className="text-sm text-muted-foreground">
              When AI systems crawl your site, they don't see isolated pages - they see a connected network of entities with verifiable relationships.
            </p>
          </div>
        </section>

        {/* The Future: RAG and GraphRAG */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Future: Entity-Based SEO Meets AI Retrieval</h2>
          <p className="text-lg text-muted-foreground mb-6">
            RAG (Retrieval-Augmented Generation) and GraphRAG represent the next evolution of AI search. These systems use knowledge graphs to enhance answer generation - and entity-based SEO is the foundation.
          </p>
          <div className="space-y-6 mb-8">
            <div className="p-6 border border-primary rounded-lg bg-primary/5">
              <h3 className="text-xl font-semibold mb-3 text-foreground">GraphRAG: The Next Generation</h3>
              <p className="text-muted-foreground mb-3">
                Microsoft Research's GraphRAG creates knowledge graphs from content, then uses those graphs to augment LLM queries. Result: substantial improvements in question-and-answer performance when analyzing complex information.
              </p>
              <p className="text-sm text-muted-foreground">
                Unlike classic RAG (which retrieves individual documents), GraphRAG highlights relationships between entities even if they never co-occur in the same document.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Why This Matters for You</h3>
              <p className="text-muted-foreground mb-3">
                Brands with structured, validated entity data will be favored in AI citations. When AI systems build their retrieval graphs, they need clear entity definitions, verified connections, and consistent relationships - exactly what entity-based SEO provides.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-3 text-foreground">What's Coming</h3>
              <p className="text-muted-foreground">
                Google, OpenAI, and Anthropic are all experimenting with knowledge graph integrations. The future of search isn't about ranking pages - it's about reasoning about entities. SuperSchema helps businesses future-proof for this AI-first discovery era.
              </p>
            </div>
          </div>
          <Link
            to="/geo"
            className="inline-flex items-center text-primary font-semibold hover:translate-x-1 transition-transform"
          >
            Learn more about Generative Engine Optimization <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>

        {/* TL;DR Playbook */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">TL;DR - Entity-Based SEO Playbook</h2>
          <div className="p-8 bg-muted rounded-lg">
            <ListChecks className="h-10 w-10 text-primary mb-4" />
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Define your brand, author, and product entities with complete schema markup</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Link entities using sameAs properties to Wikipedia, Wikidata, and authoritative sources</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Reinforce entity relationships through strategic internal linking with semantic anchor text</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Earn external mentions with consistent entity naming across all platforms</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Validate and iterate quarterly with schema testing tools</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 bg-primary rounded-lg p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Build Your Entity Graph, Strengthen Your Authority
            </h3>
            <p className="text-lg text-primary-foreground/80 mb-6">
              SuperSchema generates connected JSON-LD that defines your entities, maps relationships, and prepares you for AI discovery. Start with 2 free credits - no credit card required.
            </p>
            <Link
              to="/sign-up"
              className="inline-flex items-center px-8 py-3 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors text-lg font-semibold"
            >
              Get Your Free Credits
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
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

        {/* Related Resources */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Related Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/geo"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Generative Engine Optimization</h3>
                  <p className="text-muted-foreground mb-3">
                    Complete guide to optimizing for AI-generated search results
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
            <Link
              to="/ai-search-optimization/how-ai-engines-rank-sources"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">How AI Engines Rank Sources</h3>
                  <p className="text-muted-foreground mb-3">
                    Learn the 5 core signals AI uses to select and cite sources
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
            <Link
              to="/schema-markup"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Schema Markup Guide</h3>
                  <p className="text-muted-foreground mb-3">
                    Everything you need to know about implementing structured data
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
            <Link
              to="/aeo"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Answer Engine Optimization</h3>
                  <p className="text-muted-foreground mb-3">
                    Optimize for AI-powered search results and featured snippets
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
          </div>
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
          "headline": "Entity-Based SEO Strategies: The Future of Generative Search Optimization",
          "description": "Complete guide to entity-based SEO for generative search. Learn how to build knowledge graphs, use schema markup for entity definitions, and optimize for AI-driven search systems.",
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
          "datePublished": "2025-01-11",
          "dateModified": "2025-01-11"
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
              "name": "Generative Engine Optimization",
              "item": "https://superschema.ai/geo"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Entity-Based SEO Strategies",
              "item": "https://superschema.ai/geo/entity-based-seo-strategies"
            }
          ]
        }, null, 2)}
      </script>
    </motion.div>
  )
}
