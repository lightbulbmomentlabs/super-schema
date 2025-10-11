import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  Search,
  Brain,
  Bot,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'

export default function AISearchOptimizationPillarPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'AI Search Optimization: Get Cited by AI Engines | SuperSchema'
    window.scrollTo(0, 0)
  }, [])

  const schemaGenerators = [
    { name: 'FAQ Schema', path: '/faq-schema-generator', description: 'Perfect for Q&A content and AI citations' },
    { name: 'Article Schema', path: '/article-schema-generator', description: 'News articles, blog posts, guides' },
    { name: 'HowTo Schema', path: '/howto-schema-generator', description: 'Step-by-step instructions' },
    { name: 'Product Schema', path: '/product-schema-generator', description: 'E-commerce products with reviews' },
    { name: 'Organization Schema', path: '/organization-schema-generator', description: 'Company information and authority' },
    { name: 'Breadcrumb Schema', path: '/breadcrumb-schema-generator', description: 'Site navigation hierarchy' }
  ]

  const optimizationSteps = [
    {
      number: 1,
      title: 'Create Comprehensive, Answer-First Content',
      description: 'AI engines prioritize content that directly answers queries. Front-load your answers, use clear headings, and provide depth.',
      tips: [
        'Answer the query in the first 100-200 words',
        'Use question-based headings (H2/H3)',
        'Provide 1,500-3,000+ word comprehensive guides',
        'Include examples, data, and expert insights'
      ]
    },
    {
      number: 2,
      title: 'Implement Essential Schema Markup',
      description: 'Schema tells AI exactly what your content means. FAQ, Article, and HowTo schema are citation magnets.',
      tips: [
        'Add Article schema to all blog posts and guides',
        'Use FAQ schema for Q&A sections (3-8 questions)',
        'Implement HowTo schema for tutorials',
        'Include Organization schema for E-E-A-T signals'
      ]
    },
    {
      number: 3,
      title: 'Optimize for E-E-A-T Signals',
      description: 'Experience, Expertise, Authoritativeness, Trust—AI engines assess these before citing sources.',
      tips: [
        'Add author bios with credentials',
        'Link to authoritative sources',
        'Display publication and update dates',
        'Show trust signals (reviews, case studies, credentials)'
      ]
    },
    {
      number: 4,
      title: 'Monitor Your AI Citations',
      description: 'Track where your content appears in AI-generated answers across platforms.',
      tips: [
        'Search target queries in ChatGPT, Perplexity, and SGE',
        'Document when your domain gets cited',
        'Track patterns in cited content types',
        'Monitor referral traffic from AI platforms'
      ]
    }
  ]

  const platformStrategies = [
    {
      platform: 'Google SGE (Search Generative Experience)',
      icon: Search,
      description: 'Google\'s AI-powered search experience synthesizes answers from high-quality, schema-rich sources.',
      strategies: [
        'Maintain strong traditional SEO (SGE favors already-ranking content)',
        'Implement comprehensive FAQ and Article schema',
        'Focus on E-E-A-T signals (Google\'s core ranking factor)',
        'Create in-depth content (1,500+ words for pillar topics)',
        'Optimize Core Web Vitals and mobile experience'
      ],
      tip: 'SGE shows conversational follow-ups. Structure content to answer both primary and related questions.'
    },
    {
      platform: 'Microsoft Copilot',
      icon: Bot,
      description: 'Powered by GPT-4 with Bing integration. Prefers precision, authority, and recent content.',
      strategies: [
        'Optimize for Bing Webmaster Tools (often overlooked)',
        'Use precise, factual statements (GPT-4 values accuracy)',
        'Add "last updated" dates prominently',
        'Implement schema for all structured content',
        'Submit sitemaps to Bing and verify schema'
      ],
      tip: 'Copilot loves numbered lists and step-by-step instructions. Combine HowTo schema with formatted lists.'
    },
    {
      platform: 'Perplexity',
      icon: Brain,
      description: 'Research-focused AI search that values depth, precision, and expert sources.',
      strategies: [
        'Provide comprehensive, research-backed answers',
        'Cite your own sources (studies, data, experts)',
        'Use academic-style precision in language',
        'Include statistics and specific examples',
        'Implement schema to clarify content structure'
      ],
      tip: 'Perplexity shows source previews. Your meta description and opening paragraph appear in those previews.'
    },
    {
      platform: 'ChatGPT (Browsing Mode)',
      icon: Sparkles,
      description: 'Browses the web for current information. Prioritizes authoritative, well-structured content.',
      strategies: [
        'Target conversational, long-tail queries',
        'Structure content with clear H2/H3 hierarchy',
        'Answer comprehensively in opening paragraphs',
        'Avoid gating key information behind CTAs',
        'Make content easily crawlable (no paywalls for main info)'
      ],
      tip: 'ChatGPT cites sources that provide complete answers. Don\'t force email signups to access core information.'
    }
  ]

  const commonMistakes = [
    {
      mistake: 'Thin, Surface-Level Content',
      problem: 'AI engines favor comprehensive, authoritative answers. 300-word blog posts don\'t cut it.',
      fix: 'Create in-depth content (1,500-3,000+ words for pillar topics). Answer the full spectrum of related questions, not just one narrow query.',
      severity: 'high'
    },
    {
      mistake: 'Missing or Incomplete Schema',
      problem: 'Without schema, AI has to guess what your content means. That puts you at a disadvantage.',
      fix: 'Implement at minimum: Article schema (blog posts), FAQ schema (Q&A), and Organization schema (homepage). Use SuperSchema to auto-generate.',
      severity: 'critical'
    },
    {
      mistake: 'Burying the Answer',
      problem: 'AI engines want instant answers. If your answer is in paragraph 5, you won\'t get cited.',
      fix: 'Front-load answers in the first 100-200 words. Use a clear H2 question heading, then provide a direct answer immediately.',
      severity: 'high'
    },
    {
      mistake: 'Ignoring E-E-A-T Signals',
      problem: 'AI assesses source credibility before citing. No author bio? No credentials? You\'re less likely to be cited.',
      fix: 'Add author credentials, publication dates, expert quotes, and links to authoritative sources. Show why AI should trust you.',
      severity: 'high'
    },
    {
      mistake: 'Keyword Stuffing',
      problem: 'Old SEO habits. AI engines prioritize semantic richness and natural language over keyword density.',
      fix: 'Write naturally. Answer questions thoroughly. Use synonyms and related terms. AI understands context better than keyword matchers.',
      severity: 'medium'
    },
    {
      mistake: 'Gating Content Behind Email Signups',
      problem: 'If AI can\'t access your core content without signup, it can\'t cite you.',
      fix: 'Keep your best informational content open and crawlable. Save gated content for tools, templates, and extras—not core answers.',
      severity: 'high'
    }
  ]

  const futureTrends = [
    {
      trend: 'Multimodal AI Search',
      description: 'Text, voice, image, and video search are converging. Models like Gemini Pro already support live camera queries and visual search.',
      impact: 'Start adding ImageObject and VideoObject schema. Optimize alt text, captions, and transcripts for AI understanding.'
    },
    {
      trend: 'Zero-Click Dominance',
      description: 'By 2026, 25% of organic traffic will shift to AI chatbots. Users get answers without clicking.',
      impact: 'Focus on brand visibility in AI answers, not just traffic. Being cited builds authority even without clicks.'
    },
    {
      trend: 'Real-Time AI Search',
      description: 'AI engines are moving toward real-time web access. Perplexity, ChatGPT browsing, and SGE all pull current information.',
      impact: 'Keep content updated. Add "last updated" dates. Fresh content with recent data gets prioritized.'
    },
    {
      trend: 'Platform Diversification',
      description: 'Google\'s 57% search market share is being challenged. OpenAI, Perplexity, Amazon Alexa, and TikTok are gaining fast.',
      impact: 'Don\'t optimize only for Google. Make your content citation-worthy across all AI platforms with universal schema standards.'
    },
    {
      trend: 'Quality Over Quantity',
      description: 'Winning brands in 2025 prioritize conversions over traffic. AI engines favor original, expert content with genuine value.',
      impact: 'Stop chasing traffic metrics. Build content AI engines trust and cite as the definitive source.'
    }
  ]

  const faqs = [
    {
      question: 'What is AI Search Optimization?',
      answer: 'AI Search Optimization is the process of structuring your content so AI-powered search engines like Google\'s SGE, Microsoft Copilot, Perplexity, and ChatGPT can understand, cite, and recommend it. Unlike traditional SEO which focuses on ranking web pages, AI search optimization ensures your content becomes a trusted source for AI-generated answers.'
    },
    {
      question: 'How is AI search different from traditional Google search?',
      answer: 'Traditional Google search returns a list of blue links ranked by relevance. AI search engines synthesize information from multiple sources to generate a single conversational answer. Instead of competing for position #1, you\'re competing to be cited as a source within that AI-generated response.'
    },
    {
      question: 'Which schema types matter most for AI search?',
      answer: 'FAQ, Article, and HowTo schema are the most effective for AI search. FAQPage directly answers common questions (perfect for AI). HowTo provides step-by-step guidance that AI loves to summarize. Article schema helps AI understand your content structure and authorship. Product, LocalBusiness, and Organization schema matter for specific industries.'
    },
    {
      question: 'How do I get cited by Google\'s SGE?',
      answer: 'To get cited by Google\'s Search Generative Experience (SGE), focus on comprehensive answers with proper schema markup, high E-E-A-T signals, and structured content. Use FAQ and Article schema, answer questions directly, include expert credentials, and provide clear, factual information that AI can confidently cite.'
    },
    {
      question: 'Does schema guarantee I\'ll be cited by AI?',
      answer: 'No, schema doesn\'t guarantee citations, but it dramatically increases your chances. Schema provides machine-readable context about your content. Combined with quality content, authoritative sources, and proper formatting, schema helps AI engines understand and trust your information enough to cite it.'
    },
    {
      question: 'How can I track AI citations?',
      answer: 'Monitor AI citations by regularly searching relevant queries in SGE, Copilot, Perplexity, and ChatGPT (with browsing enabled). Document when your domain appears as a cited source. Track patterns in which content types and schema implementations get cited most often. Some enterprise tools like BrightEdge offer SGE tracking.'
    },
    {
      question: 'Do I still need traditional SEO if I\'m doing AI search optimization?',
      answer: 'Yes. AI search optimization complements traditional SEO—it doesn\'t replace it. Many AI engines (like SGE and Copilot) rely on traditional search rankings to determine which content to cite. Strong SEO helps your content get indexed and found, while AI optimization ensures it can be understood and cited.'
    },
    {
      question: 'How long does it take to see results?',
      answer: 'Schema implementation is instant, but AI engines need time to re-crawl and understand your content. You might see citations appear within days to weeks, depending on how often AI platforms refresh their indexes or browse the web. The key: implement schema now so you\'re ready when they next update.'
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
              AI Search Optimization: Get Cited by AI Engines
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Google SGE, Microsoft Copilot, Perplexity, and ChatGPT are the new gatekeepers. Here's how to get your content cited as the authoritative source. 🎯
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <Bot className="h-4 w-4 mr-2 text-success" />
                4 Major AI Search Platforms
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Target className="h-4 w-4 mr-2 text-success" />
                Schema-Powered Citations
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-success" />
                Future-Proof Visibility
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-20">

        {/* What Is AI Search Optimization */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Is AI Search Optimization?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              AI Search Optimization is the practice of making your content citation-worthy for AI-powered search engines. While traditional SEO focuses on ranking in search results, AI search optimization focuses on being the answer that platforms like Google SGE, Microsoft Copilot, Perplexity, and ChatGPT cite as authoritative sources.
            </p>
            <p>
              The shift is fundamental: users aren't clicking through 10 blue links anymore. They're asking AI engines for answers and trusting the sources AI cites. If your content isn't optimized for AI understanding, you're invisible to this massive and growing audience.
            </p>

            {/* Comparison Table */}
            <div className="my-8 overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Aspect</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Traditional Search</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">AI Search</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">User Behavior</td>
                    <td className="px-6 py-4">Click through results</td>
                    <td className="px-6 py-4">Get instant answers</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Success Metric</td>
                    <td className="px-6 py-4">Ranking position</td>
                    <td className="px-6 py-4">Being cited as source</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Content Style</td>
                    <td className="px-6 py-4">Keyword-focused</td>
                    <td className="px-6 py-4">Answer-first, comprehensive</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Schema Importance</td>
                    <td className="px-6 py-4">Helpful for rich snippets</td>
                    <td className="px-6 py-4">Absolutely critical</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Platforms</td>
                    <td className="px-6 py-4">Google, Bing results pages</td>
                    <td className="px-6 py-4">ChatGPT, Perplexity, SGE, Copilot</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-6 my-8">
              <h4 className="font-semibold mb-2 text-foreground">📊 The New Search Journey</h4>
              <p className="text-sm">
                Users now ask AI engines directly instead of searching Google. They get synthesized answers with cited sources. Your goal: be one of those cited sources. Schema markup is how you tell AI engines exactly what your content offers and why it's authoritative.
              </p>
            </div>
          </div>
        </section>

        {/* How to Optimize for AI Search */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How to Optimize for AI Search (Step-by-Step)</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p>
              Getting cited by AI search engines requires a different approach than traditional SEO. Follow these four steps to become an AI-citation magnet.
            </p>

            {optimizationSteps.map((step, index) => (
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
              <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2 text-foreground">SuperSchema Automates All Four Steps</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Paste your URL. Our AI analyzes your content, generates optimized schema, validates everything, and gives you a quality score—in under 30 seconds.
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

        {/* Platform-Specific Strategies */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Platform-Specific Optimization Strategies</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              While core principles apply across platforms, each AI search engine has unique preferences. Here's how to optimize for each major player.
            </p>

            <div className="space-y-6 my-8">
              {platformStrategies.map((platform, index) => (
                <div key={index} className="border border-border rounded-lg p-6 bg-card">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <platform.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">{platform.platform}</h3>
                      <p className="text-sm">{platform.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {platform.strategies.map((strategy, strategyIndex) => (
                      <li key={strategyIndex} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-primary/10 border border-primary/20 rounded p-3">
                    <p className="text-sm"><strong className="text-foreground">Pro Tip:</strong> {platform.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Common Mistakes */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Common AI Search Optimization Mistakes</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Most AI search failures come from applying old SEO tactics. Here's what kills your citation chances—and how to fix it.
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

        {/* Future of AI Search */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Future of AI Search</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              AI search is evolving fast. Here's where it's headed—and how to stay ahead of the curve.
            </p>

            <div className="space-y-6 my-8">
              {futureTrends.map((trend, index) => (
                <div key={index} className="border border-border rounded-lg p-6 bg-card">
                  <h4 className="font-bold text-lg mb-2 text-foreground">{trend.trend}</h4>
                  <p className="mb-3">{trend.description}</p>
                  <div className="bg-primary/10 border border-primary/20 rounded p-3">
                    <p className="text-sm"><strong className="text-foreground">Impact:</strong> {trend.impact}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg p-8 my-8">
              <h3 className="text-2xl font-bold mb-4 text-foreground">The Bottom Line</h3>
              <p className="text-lg mb-4">
                The future of search is conversational, multimodal, and AI-powered. Winners prioritize <strong className="text-foreground">quality over quantity</strong> and <strong className="text-foreground">citations over traffic</strong>.
              </p>
              <p>
                Brands that combine structured data, comprehensive content, and genuine expertise will dominate AI search. Those that ignore it? They'll be invisible to the next generation of searchers.
              </p>
            </div>
          </div>
        </section>

        {/* Related Tools */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Essential Schema Types for AI Search</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              SuperSchema offers free schema generators for all major content types. Start optimizing for AI search today.
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

        {/* Final CTA */}
        <section className="bg-primary rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Cited by AI Search Engines?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands using SuperSchema to optimize for AI search and future-proof their visibility. Start with 2 free credits—no credit card required.
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
          "headline": "AI Search Optimization: Get Cited by AI Engines (SGE, Copilot, Perplexity)",
          "description": "Learn how to optimize your content for AI search engines like Google SGE, Microsoft Copilot, Perplexity, and ChatGPT. Complete guide with schema strategies and platform-specific tactics.",
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
              "item": "https://superschema.ai/ai-search-optimization"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "AI Search Optimization",
              "item": "https://superschema.ai/ai-search-optimization"
            }
          ]
        }, null, 2)}
      </script>
    </div>
  )
}
