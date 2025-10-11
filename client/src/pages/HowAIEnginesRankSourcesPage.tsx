import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Users,
  Shield,
  Target,
  FileJson,
  Search,
  Zap,
  Globe,
  Link2,
  BarChart3,
  ListChecks
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'

export default function HowAIEnginesRankSourcesPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'How AI Search Engines Rank and Cite Sources | SuperSchema'
    window.scrollTo(0, 0)
  }, [])

  const evolutionStages = [
    {
      stage: 'SEO',
      focus: 'Keywords + Links',
      description: 'Traditional search focused on keyword matching and backlink authority'
    },
    {
      stage: 'AEO',
      focus: 'Answers + Structure',
      description: 'Shift to direct answers with structured data and featured snippets'
    },
    {
      stage: 'GEO',
      focus: 'Trust + Citations',
      description: 'AI engines synthesize content and cite trusted sources'
    }
  ]

  const coreSignals = [
    {
      number: 1,
      title: 'Entity Understanding',
      icon: Users,
      description: 'Structured data identifies entities like Organization, Person, and Product. Research shows only pages with well-implemented schema appeared in AI Overviews.',
      stat: 'Schema quality (not just presence) affects visibility',
      action: 'Use Organization and Article schema to define who you are'
    },
    {
      number: 2,
      title: 'Contextual Relevance',
      icon: Target,
      description: 'AI looks at semantic meaning, not keyword density. RAG systems use embeddings to understand relationships between content, topics, and authors.',
      stat: 'Context beats keywords in AI search',
      action: 'JSON-LD defines relationships: "this article → about this topic → by this author"'
    },
    {
      number: 3,
      title: 'Authority & Reputation (E-E-A-T)',
      icon: Shield,
      description: 'Experience, Expertise, Authority, Trustworthiness. Trust is the most important E-E-A-T member per Google Quality Rater Guidelines.',
      stat: '80+ actionable E-E-A-T signals identified from Google patents',
      action: 'Implement Author and Organization schema with sameAs links to profiles'
    },
    {
      number: 4,
      title: 'Structured Data Completeness',
      icon: FileJson,
      description: 'Schema fills data gaps and confirms factual accuracy. The more complete your markup, the higher confidence AI has in your content.',
      stat: 'Complete schema = 3 steps ahead of competitors',
      action: 'Include author, date, description, and entity markup on every article'
    },
    {
      number: 5,
      title: 'Citation & Engagement Signals',
      icon: BarChart3,
      description: 'Post-publication signals like citations, mentions, shares, and dwell time reinforce trust in cited sources.',
      stat: 'Top 20 news sources = 67.3% of OpenAI citations',
      action: 'Create citation-worthy content that others want to reference'
    }
  ]

  const schemaProof = [
    {
      type: 'Author',
      benefit: 'Verified identity',
      description: 'Establishes who wrote the content and links to their credentials'
    },
    {
      type: 'Organization',
      benefit: 'Trusted brand',
      description: 'Defines your company with sameAs links to Wikipedia, social profiles'
    },
    {
      type: 'FAQ/HowTo',
      benefit: 'Direct Q&A',
      description: 'Creates explicit question-answer relationships AI can extract'
    },
    {
      type: 'Breadcrumbs',
      benefit: 'Site hierarchy',
      description: 'Helps LLMs infer topic clusters and content organization'
    }
  ]

  const trustFeatures = [
    {
      feature: 'Consistent Schema Across Pages',
      explanation: 'Use the same Organization, Author, and brand information sitewide. Inconsistency confuses AI systems.'
    },
    {
      feature: 'Recognized Organization Schema',
      explanation: 'Include sameAs links to Wikipedia, Wikidata, LinkedIn, and social profiles. Proves you\'re a real entity.'
    },
    {
      feature: 'Valid Markup Across Content Clusters',
      explanation: 'Every article, product, and page should have validated schema. Broken markup kills trust signals.'
    },
    {
      feature: 'Cited Across the Web',
      explanation: 'Backlinks, brand mentions, and citations from other sites reinforce your authority to AI engines.'
    }
  ]

  const citationChecklist = [
    {
      step: 'Implement JSON-LD schema on all key content',
      detail: 'Start with Article, Organization, and Person schema on your most important pages.'
    },
    {
      step: 'Use Article, Author, and Organization schema consistently',
      detail: 'Same author name, organization name, and URLs across every page. No variations.'
    },
    {
      step: 'Link brand, social, and author profiles using sameAs',
      detail: 'Add Wikipedia, Wikidata, LinkedIn, Twitter, and official website URLs to establish identity.'
    },
    {
      step: 'Validate everything via SuperSchema\'s Schema Markup Grader',
      detail: 'One invalid comma breaks the entire schema block. Always validate before publishing.'
    },
    {
      step: 'Publish expert content answering specific questions concisely',
      detail: 'AI engines cite content that directly answers questions in 40-60 words.'
    },
    {
      step: 'Update older content with new structured data',
      detail: 'Go back and add schema to high-traffic pages. AI engines re-crawl regularly.'
    }
  ]

  const platformInsights = [
    {
      platform: 'Google AI Overviews',
      stats: [
        '82.5% of citations from deep content pages (2+ clicks from homepage)',
        '49.21% from domains 15+ years old',
        'Reddit at 2.2% of all citations'
      ],
      insight: 'Favors established, deep content with strong authority signals'
    },
    {
      platform: 'Perplexity',
      stats: [
        'Uses RAG for real-time source retrieval',
        'Reddit at 6.6% of citations',
        'Prefers domains 10-15 years old',
        '60% citation overlap with Google top 10'
      ],
      insight: 'Pulls from top-ranking organic results plus real-time sources'
    },
    {
      platform: 'ChatGPT',
      stats: [
        'Wikipedia at 7.8% of all citations',
        '45.8% from domains 15+ years old',
        '11.99% from domains under 5 years old'
      ],
      insight: 'Balances encyclopedic sources with newer, specialized content'
    }
  ]

  const geoMethods = [
    {
      method: 'Cite Sources',
      boost: '40%+ visibility boost',
      description: 'Link to well-established sources in your niche. Signals credibility and grounding to AI engines.'
    },
    {
      method: 'Add Quotations',
      boost: '40%+ visibility boost',
      description: 'Include expert quotes from reputable sources. Enhances expertise and trustworthiness signals.'
    },
    {
      method: 'Include Statistics',
      boost: '30-40% visibility boost',
      description: 'Data-backed content performs significantly better. AI engines prioritize factual accuracy.'
    }
  ]

  const faqs = [
    {
      question: 'Can schema markup guarantee I\'ll be cited in AI search?',
      answer: 'No, schema markup can\'t guarantee citations - but it dramatically improves your odds. Research shows that only pages with well-implemented schema appeared in certain AI Overviews. Think of schema as a prerequisite: without it, AI engines struggle to understand who you are and whether to trust you. With it, you\'re competing on a level playing field with other authoritative sources. Combine schema with high E-E-A-T content and you maximize your citation chances.'
    },
    {
      question: 'How long does it take for AI engines to recognize my structured data?',
      answer: 'AI search engines crawl and index structured data at different speeds. Google typically re-crawls active sites within days to weeks. Once crawled, your schema is processed and can influence AI Overviews almost immediately. However, building trust and authority takes longer - expect 1-3 months for consistent citation visibility as AI engines validate your entity across multiple signals. Deploy schema now, then monitor Google Search Console for crawl activity and validation status.'
    },
    {
      question: 'Does JSON-LD affect normal SEO too?',
      answer: 'Yes. JSON-LD schema markup helps both traditional SEO and AI search visibility. For traditional SEO, schema enables rich results (star ratings, FAQs, recipe cards) which boost click-through rates by up to 30%. It also helps Google understand your content better, improving relevance matching. For AI search, schema is even more critical - it\'s how AI engines identify entities, verify facts, and decide which sources to cite. Implementing JSON-LD is a win-win for both SEO and AEO.'
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
          <Link to="/ai-search-optimization" className="hover:text-foreground transition-colors">
            AI Search Optimization
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">How AI Engines Rank Sources</span>
        </nav>

        {/* Hero Section */}
        <section>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
              How AI Search Engines Rank and Cite Sources
            </span>{' '}
            (And How to Become One of Them)
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            AI search engines like Google's AI Overviews, Bing Copilot, and Perplexity no longer just "list" websites - they synthesize them. The real question is: whose content gets quoted?
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            This guide breaks down how AI engines evaluate, trust, and rank sources - and how schema markup helps you become one of those trusted answers. The shift is dramatic: traditional SEO optimized for rankings, but AI search optimizes for citations.
          </p>
          <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg mb-6">
            <p className="text-2xl font-bold text-foreground mb-2">AI platforms cite an average of 6 sources per response</p>
            <p className="text-muted-foreground">Your goal: be one of those 6.</p>
          </div>
          <div className="p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <p className="text-foreground font-semibold">
              SuperSchema helps your content speak the language AI engines understand - clean, validated JSON-LD.
            </p>
            <Link
              to={isSignedIn ? "/generate" : "/sign-up"}
              className="inline-flex items-center text-primary font-semibold mt-3 hover:translate-x-1 transition-transform"
            >
              Generate Your Schema Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Evolution of Search */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Evolution of Search Ranking → Source Selection</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Search has undergone three major paradigm shifts. Understanding this evolution helps explain why schema markup matters more than ever.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {evolutionStages.map((stage, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <div className="text-3xl font-bold text-primary mb-2">{stage.stage}</div>
                <h3 className="text-xl font-semibold mb-2">{stage.focus}</h3>
                <p className="text-sm text-muted-foreground">{stage.description}</p>
              </div>
            ))}
          </div>
          <p className="text-lg text-muted-foreground mt-8">
            The new ranking paradigm: AI systems care less about keywords, more about credibility and structure. It's not about what you say - it's about whether AI can verify, understand, and trust it.
          </p>
          <Link
            to="/geo"
            className="inline-flex items-center text-primary font-semibold mt-4 hover:translate-x-1 transition-transform"
          >
            Learn more about Generative Engine Optimization (GEO) <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>

        {/* How AI Search Works */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How AI Search Engines Work (Simplified)</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Understanding the difference between "ranking pages" and "selecting sources" is critical:
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Traditional Search</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <span className="text-muted-foreground">Crawl websites</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3">2</div>
                  <span className="text-muted-foreground">Index content</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3">3</div>
                  <span className="text-muted-foreground">Rank by relevance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3">4</div>
                  <span className="text-muted-foreground">Display list of links</span>
                </div>
              </div>
            </div>
            <div className="p-6 border border-primary rounded-lg bg-primary/5">
              <h3 className="text-xl font-semibold mb-4 text-foreground">AI Search (RAG)</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <span className="text-foreground">Crawl websites</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mr-3">2</div>
                  <span className="text-foreground">Understand entities</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mr-3">3</div>
                  <span className="text-foreground">Summarize & synthesize</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mr-3">4</div>
                  <span className="text-foreground">Attribute sources</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-muted rounded-lg">
            <h4 className="font-semibold mb-3 text-foreground">What LLM Models (SGE, Copilot, Perplexity) Pull From:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">High E-E-A-T domains:</span> Established authority and trustworthiness</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">Structured content (schema):</span> Machine-readable data that defines entities</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">Consistent entity signals:</span> Same names, URLs, and identifiers across pages</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">Clean, validated markup:</span> No errors, all required properties included</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <p className="text-xl font-semibold italic text-foreground">
              "In AI search, context beats keywords - your data structure is your ranking signal."
            </p>
          </div>
        </section>

        {/* 5 Core Signals */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The 5 Core Signals AI Engines Use to Rank & Cite Sources</h2>
          <p className="text-lg text-muted-foreground mb-8">
            AI search engines evaluate sources using a combination of technical and authority signals. Master these 5 core areas:
          </p>
          <div className="space-y-8">
            {coreSignals.map((signal, index) => {
              const Icon = signal.icon
              return (
                <div key={index} className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mr-4">
                      {signal.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <Icon className="h-6 w-6 text-primary mr-2" />
                        <h3 className="text-2xl font-semibold">{signal.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-3">{signal.description}</p>
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded mb-3">
                        <p className="text-sm font-semibold text-foreground">{signal.stat}</p>
                      </div>
                      <p className="text-sm text-foreground"><span className="font-semibold">Action:</span> {signal.action}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Schema Strengthens Attribution */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How Schema Markup Strengthens AI Source Attribution</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Schema markup gives AI engines structured proof of who you are, what you publish, and why you're trustworthy. Here's how different schema types contribute:
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {schemaProof.map((item, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-xl font-semibold mb-2">{item.type}</h3>
                <p className="text-primary font-semibold mb-2">→ {item.benefit}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg mb-8">
            <p className="text-xl font-semibold text-foreground">
              Structured data = machine confidence
            </p>
          </div>
          <div className="bg-muted p-6 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2 font-mono">Example: Well-Structured Article Schema</p>
            <pre className="text-sm text-foreground overflow-x-auto">
{`{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How AI Search Engines Rank Sources",
  "author": {
    "@type": "Person",
    "name": "Jane Expert",
    "sameAs": [
      "https://linkedin.com/in/janeexpert",
      "https://twitter.com/janeexpert"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "SuperSchema",
    "url": "https://superschema.ai",
    "sameAs": [
      "https://en.wikipedia.org/wiki/SuperSchema",
      "https://www.wikidata.org/wiki/Q123456"
    ]
  },
  "datePublished": "2025-01-11",
  "dateModified": "2025-01-11",
  "description": "Complete guide to AI source ranking"
}`}
            </pre>
          </div>
          <Link
            to="/schema-markup"
            className="inline-flex items-center text-primary font-semibold mt-6 hover:translate-x-1 transition-transform"
          >
            Learn more about Schema Markup implementation <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>

        {/* Trust Entities */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What "Trust Entities" Look Like to AI</h2>
          <p className="text-lg text-muted-foreground mb-8">
            AI search doesn't just pick results - it selects representative voices for a topic. Here are the features of trustworthy entities:
          </p>
          <div className="space-y-4">
            {trustFeatures.map((item, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{item.feature}</h3>
                <p className="text-muted-foreground">{item.explanation}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-r">
            <p className="text-foreground font-semibold">
              Pro Tip: If Google can't clearly tell who you are, it won't quote you. Schema helps define your identity.
            </p>
          </div>
        </section>

        {/* Citation Checklist */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How to Improve Your Chances of Being Cited by AI Search</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Follow this practical checklist to maximize your citation potential:
          </p>
          <div className="space-y-6 mb-8">
            {citationChecklist.map((item, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-foreground">{item.step}</h3>
                  <p className="text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={isSignedIn ? "/generate" : "/sign-up"}
              className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
            >
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h5 className="font-semibold mb-2 text-foreground">Generate Citation-Worthy Schema</h5>
              <p className="text-sm text-muted-foreground mb-3">AI-powered JSON-LD generation for any URL</p>
              <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Start Generating <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
            <Link
              to="/schema-markup-grader"
              className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
            >
              <Search className="h-8 w-8 text-primary mb-3" />
              <h5 className="font-semibold mb-2 text-foreground">Validate Your Schema</h5>
              <p className="text-sm text-muted-foreground mb-3">Free tool to test schema quality and completeness</p>
              <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Grade Your Schema <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </div>
        </section>

        {/* Platform Insights */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Platform-Specific Citation Patterns</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Different AI platforms have distinct source selection patterns. Understanding these helps you optimize for each:
          </p>
          <div className="space-y-6">
            {platformInsights.map((platform, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-center mb-4">
                  <Globe className="h-6 w-6 text-primary mr-2" />
                  <h3 className="text-xl font-semibold">{platform.platform}</h3>
                </div>
                <ul className="space-y-2 mb-4">
                  {platform.stats.map((stat, statIndex) => (
                    <li key={statIndex} className="flex items-start text-sm text-muted-foreground">
                      <span className="text-primary mr-2">•</span>
                      <span>{stat}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-3 bg-primary/10 border border-primary/20 rounded">
                  <p className="text-sm font-semibold text-foreground">Key Insight: {platform.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GEO Methods */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">GEO Methods That Boost Visibility 30-40%</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Research from generative engine optimization studies shows these content strategies significantly improve AI citation rates:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {geoMethods.map((method, index) => (
              <div key={index} className="p-6 border border-primary rounded-lg bg-primary/5">
                <Link2 className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold mb-2">{method.method}</h3>
                <p className="text-primary font-bold text-lg mb-3">{method.boost}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            ))}
          </div>
          <p className="text-lg text-muted-foreground mt-8">
            Citations, quotations, and statistics = content richness + credibility signals AI engines prioritize.
          </p>
        </section>

        {/* The Future: GEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Future: GEO and Source Credibility</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Generative Engine Optimization (GEO) builds on AEO principles but focuses on who AI trusts, not just what ranks. As AI-generated answers become the default search experience, source selection replaces traditional ranking.
          </p>
          <p className="text-lg text-muted-foreground mb-6">
            Entity-based SEO and structured data are core inputs for GEO. AI engines need to verify identity, authority, and relationships - all defined through schema markup. The future of search visibility is citation attribution, not click-through rates.
          </p>
          <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg mb-6">
            <h4 className="font-semibold mb-2 text-foreground">New KPI: AI Attribution Rate</h4>
            <p className="text-muted-foreground">
              Track how often your brand/site is cited in AI answers. This metric, adapted from journalism analytics, is now critical for measuring AI search visibility.
            </p>
          </div>
          <Link
            to="/geo"
            className="inline-flex items-center text-primary font-semibold hover:translate-x-1 transition-transform"
          >
            Deep dive into Generative Engine Optimization <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>

        {/* TL;DR Checklist */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">TL;DR - AI Source Optimization Checklist</h2>
          <div className="p-8 bg-muted rounded-lg">
            <ListChecks className="h-10 w-10 text-primary mb-4" />
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Implement consistent JSON-LD sitewide (Article, Author, Organization)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Validate all schema types regularly with testing tools</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Build E-E-A-T with real authorship, organization data, and sameAs links</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Focus content around question-based topics with direct answers</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-foreground">Keep schema aligned with Google's guidelines and Schema.org spec</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 bg-primary rounded-lg p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Build the Structured Foundation AI Engines Look For
            </h3>
            <p className="text-lg text-primary-foreground/80 mb-6">
              SuperSchema generates clean, validated JSON-LD that maximizes your citation potential. Start with 2 free credits - no credit card required.
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
              to="/aeo"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Answer Engine Optimization Guide</h3>
                  <p className="text-muted-foreground mb-3">
                    Complete guide to optimizing for AI-powered search results
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
              to="/geo"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Generative Engine Optimization</h3>
                  <p className="text-muted-foreground mb-3">
                    How to be the source AI chooses for generated answers
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
            <Link
              to="/schema-markup/json-ld-vs-microdata"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">JSON-LD vs Microdata</h3>
                  <p className="text-muted-foreground mb-3">
                    Why JSON-LD is better for modern SEO and AI search
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
          "headline": "How AI Search Engines Rank and Cite Sources (And How to Become One of Them)",
          "description": "Complete guide to how AI search engines like Google AI Overviews, Perplexity, and ChatGPT select and cite sources. Learn the 5 core signals, E-E-A-T factors, and schema markup strategies.",
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
              "name": "AI Search Optimization",
              "item": "https://superschema.ai/ai-search-optimization"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "How AI Engines Rank Sources",
              "item": "https://superschema.ai/ai-search-optimization/how-ai-engines-rank-sources"
            }
          ]
        }, null, 2)}
      </script>
    </motion.div>
  )
}
