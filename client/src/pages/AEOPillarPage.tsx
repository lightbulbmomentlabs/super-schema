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
  FileJson,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'

export default function AEOPillarPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'Answer Engine Optimization (AEO): The Complete Guide | SuperSchema'

    // Scroll to top on mount
    window.scrollTo(0, 0)
  }, [])

  const schemaGenerators = [
    { name: 'FAQ Schema', path: '/faq-schema-generator', description: 'Perfect for Q&A content and AEO' },
    { name: 'Article Schema', path: '/article-schema-generator', description: 'News articles, blog posts, guides' },
    { name: 'BlogPosting Schema', path: '/blogposting-schema-generator', description: 'Blog-specific structured data' },
    { name: 'HowTo Schema', path: '/howto-schema-generator', description: 'Step-by-step instructions' },
    { name: 'Product Schema', path: '/product-schema-generator', description: 'E-commerce products with reviews' },
    { name: 'LocalBusiness Schema', path: '/localbusiness-schema-generator', description: 'Physical business locations' },
    { name: 'Organization Schema', path: '/organization-schema-generator', description: 'Company information' },
    { name: 'Event Schema', path: '/event-schema-generator', description: 'Conferences, webinars, meetups' },
    { name: 'Review Schema', path: '/review-schema-generator', description: 'Product and business reviews' },
    { name: 'Breadcrumb Schema', path: '/breadcrumb-schema-generator', description: 'Site navigation hierarchy' }
  ]

  const aeoSteps = [
    {
      number: 1,
      title: 'Identify Answerable Queries',
      description: 'Find questions people actually ask. Think "how to," "what is," "best," and "why." These are AI search gold mines.',
      tips: [
        'Use Google\'s "People Also Ask" boxes',
        'Check competitor content gaps',
        'Focus on listicles (32% of AI citations)',
        'Add current year markers like "2025" to increase citations'
      ]
    },
    {
      number: 2,
      title: 'Implement Relevant Schema Types',
      description: 'Add structured data that makes AI engines say "wow, this page gets it." Schema is how you speak machine.',
      tips: [
        'FAQPage schema for Q&A content',
        'HowTo schema for step-by-step guides',
        'Article schema for blog posts and news',
        'Use SuperSchema to auto-detect and generate'
      ]
    },
    {
      number: 3,
      title: 'Validate Your Markup',
      description: 'Broken schema = invisible to AI. Validate everything before it goes live. No excuses.',
      tips: [
        'Google Rich Results Test for validation',
        'SuperSchema quality score (aim for 80+)',
        'Check for duplicate or conflicting schema',
        'Monitor after CMS updates (they break things)'
      ]
    },
    {
      number: 4,
      title: 'Monitor AI Citations',
      description: 'Track where your content shows up in AI-generated answers. ChatGPT, Perplexity, Google AI Overviews - be everywhere.',
      tips: [
        'Search your brand in ChatGPT and Perplexity',
        'Monitor Google AI Overviews for your keywords',
        'Track featured snippet appearances',
        'Measure zero-click results (traffic won\'t tell the full story)'
      ]
    }
  ]

  const commonMistakes = [
    {
      mistake: 'Missing Entities',
      problem: 'Your schema doesn\'t define key entities like author, organization, or publisher.',
      fix: 'Add complete entity definitions. AI engines need context to understand and cite your content.',
      icon: AlertTriangle,
      severity: 'high'
    },
    {
      mistake: 'Duplicate Schema',
      problem: 'Multiple conflicting schema blocks on the same page confuse search engines.',
      fix: 'Consolidate into one comprehensive schema block. Quality over quantity.',
      icon: AlertTriangle,
      severity: 'high'
    },
    {
      mistake: 'Invalid JSON-LD Syntax',
      problem: 'One missing comma and the whole thing breaks. Search engines just ignore it.',
      fix: 'Always validate with Google Rich Results Test. Use SuperSchema to generate error-free markup.',
      icon: AlertTriangle,
      severity: 'critical'
    },
    {
      mistake: 'Keyword Stuffing',
      problem: 'Old SEO habits die hard. AI engines favor semantic richness over repetitive keywords.',
      fix: 'Write naturally. Focus on answering questions thoroughly, not hitting keyword density targets.',
      icon: AlertTriangle,
      severity: 'medium'
    },
    {
      mistake: 'Burying the Lede',
      problem: 'Answer buried in paragraph 3. AI engines want instant, direct answers.',
      fix: 'Front-load answers in the first 100-200 words. Use clear subheadings.',
      icon: AlertTriangle,
      severity: 'high'
    },
    {
      mistake: 'Schema That Doesn\'t Match Content',
      problem: 'Your schema says one thing, your visible content says another. That\'s a penalty risk.',
      fix: 'Schema must reflect what users actually see. Never lie to search engines.',
      icon: AlertTriangle,
      severity: 'critical'
    },
    {
      mistake: 'Ignoring Schema After CMS Updates',
      problem: 'Template changes, plugin updates, and theme switches silently break schema.',
      fix: 'Revalidate schema after any CMS changes. Set up automated monitoring.',
      icon: AlertTriangle,
      severity: 'medium'
    }
  ]

  const futureTrends = [
    {
      trend: 'Multimodal Search Convergence',
      description: 'Text, voice, and image search are merging. By 2025, 20%+ of searches are voice-based, and models like Gemini Pro support live camera queries.',
      impact: 'Schema needs to support multiple content types. Image markup, video markup, and audio metadata matter more than ever.'
    },
    {
      trend: 'Conversational AI Replacing Search Bars',
      description: 'ChatGPT grew from 400M to 700M users in 5 months. "Asking" now makes up 51.6% of all interactions. Traditional search is being replaced by AI conversations.',
      impact: 'Optimize for natural language queries. Answer engines prefer content that sounds conversational, not keyword-stuffed.'
    },
    {
      trend: 'Google AI Mode with Advanced Reasoning',
      description: 'Google AI Mode is rolling out with 1B+ users. It uses advanced reasoning to handle complex, multi-step queries - way beyond simple featured snippets.',
      impact: 'Create comprehensive content that connects multiple concepts. AI engines reward depth and relationships between topics.'
    },
    {
      trend: 'Market Share Disruption',
      description: 'Google commands 57% of the $300B search ad market, but OpenAI, Perplexity, Amazon, and TikTok are gaining fast. Google\'s share is projected to decline in 2025-2026.',
      impact: 'Don\'t optimize for just Google. Make your content citation-worthy for all AI platforms.'
    },
    {
      trend: 'Zero-Click Future',
      description: 'AI-generated answers mean fewer clicks. Users get answers without visiting your site. By 2026, 25% of organic traffic will shift to AI chatbots.',
      impact: 'Focus on brand visibility in AI answers, not just traffic. Being cited builds authority even without clicks.'
    },
    {
      trend: 'Quality Over Quantity Wins',
      description: 'Winners in 2025 prioritize conversions over traffic. AI engines favor authoritative, original content with genuine expertise.',
      impact: 'Stop chasing traffic metrics. Build content that AI engines trust and cite as the definitive source.'
    }
  ]

  const faqs = [
    {
      question: 'What\'s the difference between AEO and SEO?',
      answer: 'SEO (Search Engine Optimization) focuses on ranking in traditional search results - think blue links on Google. AEO (Answer Engine Optimization) focuses on getting your content cited in AI-generated answers from ChatGPT, Perplexity, Google AI Overviews, and other AI tools. SEO is about traffic. AEO is about being the answer. Both matter in 2025, but AEO is how you future-proof your visibility.'
    },
    {
      question: 'Do I still need SEO if I\'m doing AEO?',
      answer: 'Yes. AEO isn\'t a replacement for SEO - it\'s an extension. Strong SEO gets your content indexed and ranked, which helps AI platforms find it. AEO ensures AI can understand, extract, and cite your content. Use both strategies together for maximum visibility across traditional search engines, AI tools, and voice assistants.'
    },
    {
      question: 'How do I know if my AEO strategy is working?',
      answer: 'Check if your content appears in ChatGPT responses, Perplexity citations, and Google AI Overviews. Monitor featured snippet appearances in Google Search. Track brand mentions in AI-generated answers even if they don\'t link back (zero-click visibility still builds authority). Use tools like SuperSchema to ensure your schema quality score is 80+ for better AI citation chances.'
    },
    {
      question: 'Which schema types matter most for AEO?',
      answer: 'FAQPage, HowTo, and Article schema are AEO powerhouses. FAQPage directly answers common questions (perfect for AI). HowTo provides step-by-step guidance that AI loves to summarize. Article schema helps AI understand your content structure and authorship. Product, LocalBusiness, and Organization schema matter for specific industries. SuperSchema automatically detects which types you need.'
    },
    {
      question: 'Can schema markup hurt my SEO?',
      answer: 'Only if it\'s wrong. Invalid schema gets ignored. Schema that doesn\'t match your visible content can trigger penalties. Duplicate or conflicting schema confuses search engines. But properly implemented schema? That\'s pure upside - better rankings, rich snippets, and AI citations. Always validate with Google Rich Results Test or use SuperSchema to generate error-free markup.'
    },
    {
      question: 'How long does it take to see AEO results?',
      answer: 'Schema implementation is instant, but search engines need time to re-crawl and re-index your pages. Featured snippets can appear in days to weeks. Ranking improvements take longer - typically 2-8 weeks. AI citation in tools like ChatGPT depends on when they refresh their training data or search indexes. The key: implement schema now so you\'re ready when AI platforms next update.'
    },
    {
      question: 'What\'s a good schema quality score?',
      answer: 'Aim for 80+. Scores of 90-100 mean your schema is complete and optimized with all recommended properties. 70-89 is solid but could be better. 50-69 means you\'re missing important fields. Below 50? Use AI refinement ASAP. SuperSchema shows quality scores and offers one-click optimization to boost your score automatically.'
    },
    {
      question: 'Why are listicles so effective for AEO?',
      answer: 'Listicles make up 32% of all AI citations - the highest of any content format. Why? They\'re structured, scannable, and answer-focused. AI engines love clear, numbered points that can be easily extracted and summarized. Pair listicles with proper schema (FAQPage or HowTo) and you\'ve got an AEO goldmine.'
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
              Answer Engine Optimization (AEO): The Complete Guide
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              AI search is eating traditional search alive. 700M+ ChatGPT users aren't clicking blue links - they're getting instant answers. Here's how to make sure your content is the answer they get. 🎯
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-success" />
                700M+ ChatGPT Users
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Target className="h-4 w-4 mr-2 text-success" />
                1B+ Google AI Overview Users
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Zap className="h-4 w-4 mr-2 text-success" />
                25% Traffic Shift to AI by 2026
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-20">

        {/* What Is AEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Is Answer Engine Optimization?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Answer Engine Optimization (AEO) is the practice of optimizing your content so AI search platforms - ChatGPT, Perplexity, Google AI Overviews, Claude, and others - can find, understand, and cite your content as the definitive answer.
            </p>
            <p>
              While traditional SEO focuses on ranking in search results (those blue links you're used to), AEO focuses on being the answer that AI engines deliver directly to users. No click required. No scrolling through results. Just your content, front and center, as the authoritative source.
            </p>

            {/* AEO vs SEO Comparison Table */}
            <div className="my-8 overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Aspect</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Traditional SEO</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">AEO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Goal</td>
                    <td className="px-6 py-4">Rank in search results</td>
                    <td className="px-6 py-4">Be the cited answer</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Focus</td>
                    <td className="px-6 py-4">Keywords, backlinks, page speed</td>
                    <td className="px-6 py-4">Structured data, natural language, entities</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Content Style</td>
                    <td className="px-6 py-4">Long-form, keyword-rich</td>
                    <td className="px-6 py-4">Concise, answer-first, structured</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Platforms</td>
                    <td className="px-6 py-4">Google, Bing search results</td>
                    <td className="px-6 py-4">ChatGPT, Perplexity, AI Overviews, voice assistants</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Success Metric</td>
                    <td className="px-6 py-4">Traffic and rankings</td>
                    <td className="px-6 py-4">Citations and zero-click visibility</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Schema Importance</td>
                    <td className="px-6 py-4">Helpful for rich snippets</td>
                    <td className="px-6 py-4">Absolutely critical</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-6 my-8">
              <h4 className="font-semibold mb-2 text-foreground">📊 Visual Placeholder: Search → Snippet → AI Answer → User Path</h4>
              <p className="text-sm text-info-foreground">
                [Flow diagram showing the evolution: Traditional Search Results → Featured Snippet → AI-Generated Answer → Direct User Response. This illustrates how user behavior has shifted from clicking through 10 blue links to getting instant, AI-synthesized answers.]
              </p>
            </div>

            <p>
              Here's the brutal truth: search behavior is fundamentally changing. ChatGPT usage grew from 400 million to 700 million users in just 5 months. "Asking" (essentially search) now makes up 51.6% of all ChatGPT interactions. Google AI Overviews serve over 1 billion users. By 2026, experts predict 25% of organic traffic will shift to AI chatbots and virtual agents.
            </p>
            <p>
              Translation? If your content isn't optimized for AI search, you're invisible to a massive - and rapidly growing - segment of your audience.
            </p>
          </div>
        </section>

        {/* Why Schema Markup Is the Heart of AEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Schema Markup Is the Heart of AEO</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Schema markup is how you speak machine. Think of it as a cheat sheet for AI engines - a way to tell them exactly what your content is about, who wrote it, when it was published, and why it matters.
            </p>
            <p>
              Without schema, AI engines are guessing. With schema, they know. And when AI knows exactly what your content offers, it's 434% more likely to appear in featured snippets and AI-generated answers.
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
              <div className="flex items-start space-x-4">
                <FileJson className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">The Machine Readability Equation</h4>
                  <p className="text-sm">
                    <strong>Structured Data → Machine Understanding → AI Answer Eligibility → Citations & Visibility</strong>
                  </p>
                  <p className="text-sm mt-2">
                    Schema markup bridges the gap between human-readable content and machine-extractable data. When you add schema, you're not just optimizing for search engines - you're making your content AI-ready.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Here's why schema matters more for AEO than traditional SEO: AI engines don't have time to read your entire article and infer context. They need explicit signals. FAQPage schema tells them "here are questions and answers." HowTo schema says "here's a step-by-step process." Article schema provides authorship, publish dates, and topics.
            </p>
            <p>
              Users who click on rich results (powered by schema) do so 58% of the time compared to 41% for non-rich results. But in the AEO world, clicks aren't the only metric that matters. Being cited in an AI-generated answer - even without a click - builds brand authority and trust.
            </p>

            {/* Schema Type Links */}
            <div className="my-8">
              <h4 className="font-semibold mb-4 text-foreground text-lg">Essential Schema Types for AEO</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/faq-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">FAQ Schema</h5>
                      <p className="text-sm text-muted-foreground">Perfect for Q&A content</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                <Link
                  to="/howto-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">HowTo Schema</h5>
                      <p className="text-sm text-muted-foreground">Step-by-step guides</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                <Link
                  to="/article-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">Article Schema</h5>
                      <p className="text-sm text-muted-foreground">Blog posts and articles</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                <Link
                  to="/product-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">Product Schema</h5>
                      <p className="text-sm text-muted-foreground">E-commerce products</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </div>
            </div>

            <p className="font-semibold text-foreground">
              SuperSchema automatically detects which schema types your content needs, extracts real data from your page, and generates error-free JSON-LD in under 30 seconds. No manual data entry. No Schema.org documentation hunting. Just paste your URL and go.
            </p>
          </div>
        </section>

        {/* How to Optimize for AEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How to Optimize for AEO (Step-by-Step)</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p>
              AEO isn't rocket science - it's strategic, structured content that AI engines can easily understand and cite. Follow these four steps to dominate AI search results.
            </p>

            {aeoSteps.map((step, index) => (
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
              <h3 className="text-2xl font-bold mb-2 text-foreground">Use SuperSchema's AI Generator to Automate All Four Steps</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Paste your URL. Our AI identifies answerable queries, generates optimized schema, validates everything, and gives you a quality score - all in under 30 seconds.
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

        {/* Common AEO Mistakes */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Common AEO Mistakes (and How to Fix Them)</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Most AEO failures come from old SEO habits. Here are the mistakes killing your AI search visibility - and exactly how to fix them.
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
                      <item.icon className={`h-6 w-6 ${
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

            <div className="bg-success/10 border border-success/20 rounded-lg p-6 my-8">
              <div className="flex items-start space-x-4">
                <Search className="h-8 w-8 text-success flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Always Validate Before Going Live</h4>
                  <p className="text-sm">
                    Use Google's Rich Results Test to catch errors. Better yet, use SuperSchema's built-in validation and quality scoring. We check for invalid syntax, missing entities, duplicate schema, and compliance with Schema.org standards - so you don't have to.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Future of AEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Future of AEO and AI Search</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              AI search is moving fast. Really fast. Here's where we're headed - and how to stay ahead.
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
                The future of search is conversational, multimodal, and AI-powered. Winners prioritize <strong className="text-foreground">conversions over traffic</strong> and <strong className="text-foreground">quality over quantity</strong>.
              </p>
              <p>
                Brands that evolve with this landscape - combining structured data, natural language optimization, and genuine expertise - will thrive. Those that cling to old SEO tactics? They'll be invisible to the next generation of search.
              </p>
            </div>
          </div>
        </section>

        {/* Related Tools */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Related Tools & Resources</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              SuperSchema offers free schema generators for all major content types. Start optimizing for AEO today.
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
            Ready to Dominate AI Search?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands using SuperSchema to optimize for answer engines and future-proof their visibility. Start with 2 free credits - no credit card required.
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
          "headline": "Answer Engine Optimization (AEO): The Complete Guide",
          "description": "Learn how to optimize your content for AI search engines like ChatGPT, Perplexity, and Google AI Overviews. Comprehensive guide to schema markup, AEO best practices, and future trends.",
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
              "item": "https://superschema.ai/aeo"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "AEO Guide",
              "item": "https://superschema.ai/aeo"
            }
          ]
        }, null, 2)}
      </script>
    </div>
  )
}
