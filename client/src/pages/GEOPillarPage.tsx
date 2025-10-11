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

export default function GEOPillarPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'Generative Engine Optimization (GEO): Be the Source AI Chooses | SuperSchema'

    // Scroll to top on mount
    window.scrollTo(0, 0)
  }, [])

  const schemaGenerators = [
    { name: 'Organization Schema', path: '/organization-schema-generator', description: 'Establish entity authority' },
    { name: 'Article Schema', path: '/article-schema-generator', description: 'Content context for AI' },
    { name: 'FAQ Schema', path: '/faq-schema-generator', description: 'Direct answer formatting' },
    { name: 'BlogPosting Schema', path: '/blogposting-schema-generator', description: 'Blog credibility signals' },
    { name: 'Product Schema', path: '/product-schema-generator', description: 'E-commerce products with reviews' },
    { name: 'LocalBusiness Schema', path: '/localbusiness-schema-generator', description: 'Physical business locations' },
    { name: 'HowTo Schema', path: '/howto-schema-generator', description: 'Step-by-step instructions' },
    { name: 'Event Schema', path: '/event-schema-generator', description: 'Conferences, webinars, meetups' },
    { name: 'Review Schema', path: '/review-schema-generator', description: 'Product and business reviews' },
    { name: 'Breadcrumb Schema', path: '/breadcrumb-schema-generator', description: 'Site navigation hierarchy' }
  ]

  const geoSteps = [
    {
      number: 1,
      title: 'Entity Optimization',
      description: 'Define your brand as a clear, recognizable entity. AI needs to know who you are before it can cite you as an authority.',
      tips: [
        'Consistent NAP (Name, Address, Phone) across the web',
        'Use precise terminology in your content',
        'Build entity relationships through mentions and partnerships',
        'Implement Organization schema to establish authority'
      ]
    },
    {
      number: 2,
      title: 'Consistent Structured Data',
      description: 'Schema isn\'t optional for GEO - it\'s mandatory. AI can\'t parse what it can\'t read. Machine-readable markup is your ticket to AI training datasets.',
      tips: [
        'Implement schema sitewide, not just on select pages',
        'Validate regularly (broken schema = invisibility)',
        'Include authorship, dates, and publisher info',
        'Use SuperSchema for error-free, comprehensive implementation'
      ]
    },
    {
      number: 3,
      title: 'Credibility Signals',
      description: 'AI models train on authoritative sources. E-E-A-T isn\'t just for Google anymore - it\'s how you earn a spot in AI training data.',
      tips: [
        'Add citations from authoritative sources',
        'Include author bios with credentials and expertise',
        'Display transparent publish and update dates',
        'Build backlinks from reputable sites in your industry'
      ]
    },
    {
      number: 4,
      title: 'Cited References',
      description: 'AI loves well-sourced content. The more you cite credible references, the more AI trusts your content as training-worthy.',
      tips: [
        'Link to reputable sources (research papers, industry reports)',
        'Include statistics with proper attribution',
        'Reference authoritative domains (.edu, .gov, industry leaders)',
        'AI rewards depth - cite multiple sources per claim'
      ]
    }
  ]

  const commonMistakes = [
    {
      mistake: 'Missing Entity Definitions',
      problem: 'Your brand isn\'t clearly defined as an entity. AI doesn\'t know who you are or why you matter.',
      fix: 'Implement Organization schema with complete details. Define your brand consistently across all platforms.',
      icon: AlertTriangle,
      severity: 'critical'
    },
    {
      mistake: 'Inconsistent Schema Implementation',
      problem: 'Schema on some pages, broken on others. Inconsistency confuses AI models during training crawls.',
      fix: 'Deploy schema sitewide. Use SuperSchema to ensure every page has validated, error-free markup.',
      icon: AlertTriangle,
      severity: 'high'
    },
    {
      mistake: 'No Author Credentials',
      problem: 'Content without clear authorship gets ignored by AI. Models prioritize content with verified expertise.',
      fix: 'Add author schema with credentials, expertise, and social profiles. Build authority around individuals, not just brands.',
      icon: AlertTriangle,
      severity: 'high'
    },
    {
      mistake: 'Ignoring E-E-A-T Signals',
      problem: 'Experience, Expertise, Authoritativeness, Trust - AI models evaluate these before including content in training data.',
      fix: 'Showcase real expertise. Add author bios, credentials, case studies, and industry recognition.',
      icon: AlertTriangle,
      severity: 'high'
    },
    {
      mistake: 'Schema Doesn\'t Match Content',
      problem: 'Your schema says one thing, your visible content says another. That\'s an instant disqualification for AI training datasets.',
      fix: 'Schema must accurately reflect what users see. Never lie to search engines or AI models.',
      icon: AlertTriangle,
      severity: 'critical'
    },
    {
      mistake: 'Ignoring Schema After Updates',
      problem: 'CMS updates, template changes, and plugin installations silently break schema. AI can\'t parse broken markup.',
      fix: 'Revalidate schema after any site changes. Set up automated monitoring to catch breaks before they hurt you.',
      icon: AlertTriangle,
      severity: 'medium'
    }
  ]

  const futureTrends = [
    {
      trend: 'LLM Traffic Overtakes Google by 2027',
      description: 'Research from Semrush predicts that LLM-driven traffic will surpass traditional Google search by the end of 2027. We\'re already seeing an 800% year-over-year increase in referrals from LLMs.',
      impact: 'GEO isn\'t optional anymore. Brands that ignore generative AI will lose visibility in the primary way people search by 2027.'
    },
    {
      trend: 'Entity Authority Becomes Currency',
      description: 'AI models prioritize entities with clear authority signals. Consistent schema, E-E-A-T compliance, and cited references determine whether your brand is training-worthy.',
      impact: 'Build entity authority now. Organizations with strong schema implementation will dominate AI-generated answers.'
    },
    {
      trend: 'Multi-Platform AI Discovery',
      description: 'Users search across ChatGPT, Perplexity, Google AI Mode, Claude, and Gemini. Over 1 billion prompts are sent to ChatGPT daily, and 71% of Americans use AI search to research purchases.',
      impact: 'Optimize for all AI platforms, not just Google. GEO ensures your content is cited across every generative AI tool.'
    },
    {
      trend: 'Zero-Click AI Answers Dominate',
      description: 'By 2026, 25% of organic traffic will shift to AI chatbots. Users get answers without ever clicking through to your site.',
      impact: 'Focus on brand visibility in AI answers, not just traffic. Being cited builds authority even without clicks.'
    },
    {
      trend: 'Ethical AI and Source Attribution',
      description: 'As AI models face scrutiny over training data, platforms are prioritizing transparent source attribution. Brands with clean, well-structured data get cited more often.',
      impact: 'Transparency wins. Use schema to signal credibility, accuracy, and ethical content practices.'
    },
    {
      trend: 'GEO as Competitive Differentiator',
      description: 'Early GEO adopters are already seeing 3-5x higher citation rates in AI-generated answers. By 2026, GEO will be table stakes for B2B brands.',
      impact: 'The brands building GEO now will dominate AI discovery in 2026. Waiting means playing catch-up.'
    }
  ]

  const faqs = [
    {
      question: 'What\'s the difference between GEO and AEO?',
      answer: 'AEO (Answer Engine Optimization) focuses on getting your content cited in AI-generated answers - think featured snippets, AI Overviews, and voice assistant responses. GEO (Generative Engine Optimization) goes deeper: it\'s about becoming the training source AI models rely on. AEO is about being the answer. GEO is about being the source AI can\'t ignore. Both matter, but GEO builds long-term entity authority that persists across all AI platforms.'
    },
    {
      question: 'Do I need GEO if I already do SEO?',
      answer: 'Absolutely. SEO gets you ranked in traditional search results. GEO ensures you\'re cited in AI-generated answers. By 2027, LLM traffic is projected to overtake Google search. If you\'re only doing SEO, you\'re optimizing for yesterday\'s search behavior. GEO extends your SEO efforts - they synergize, not compete. Strong SEO gets your content indexed. GEO ensures AI can understand, cite, and train on it.'
    },
    {
      question: 'How does schema help with GEO?',
      answer: 'Schema is machine-readable credibility. AI models parse structured data to understand entities, relationships, authorship, and context. Without schema, AI has to guess what your content means. With schema, you\'re telling AI exactly who you are, what you do, and why you\'re authoritative. Organization, Article, and FAQ schema are critical for GEO. Use SuperSchema to generate error-free markup that AI models trust.'
    },
    {
      question: 'Which schema types matter most for GEO?',
      answer: 'Organization schema (establishes entity authority), Article schema (provides content context), FAQ schema (direct answer formatting), and Author schema (builds E-E-A-T signals). These schema types signal to AI that your content is credible, well-structured, and training-worthy. SuperSchema automatically detects which schema types you need based on your content.'
    },
    {
      question: 'How do I measure GEO success?',
      answer: 'Check if your brand appears in ChatGPT responses, Perplexity citations, and Google AI Overviews. Monitor your entity\'s presence across AI platforms. Track brand mentions in AI-generated answers (even without links - visibility builds authority). Use tools like SuperSchema to ensure your schema quality score is 80+ for better AI parsing. GEO success isn\'t about clicks - it\'s about becoming the default source AI cites.'
    },
    {
      question: 'Is GEO just for big brands?',
      answer: 'No. GEO levels the playing field. Small brands with strong schema, clear entity definitions, and credible content can outrank Fortune 500 companies in AI-generated answers. AI doesn\'t care about your brand size - it cares about authority signals. If your content is well-structured, cited, and authoritative, AI will use it as a training source regardless of your company size.'
    },
    {
      question: 'Can GEO hurt my SEO?',
      answer: 'Only if you do it wrong. Invalid schema gets ignored. Schema that doesn\'t match visible content can trigger penalties. But properly implemented GEO? Pure upside. It enhances your SEO by making your content more parseable, more authoritative, and more citation-worthy across both traditional search engines and AI platforms. GEO and SEO work together - strong schema benefits both.'
    },
    {
      question: 'When will GEO become critical?',
      answer: 'It already is. Over 1 billion prompts are sent to ChatGPT daily. 71% of Americans use AI search to research purchases. By 2027, LLM traffic will overtake traditional Google search. The brands optimizing for GEO now will dominate AI discovery in 2026. Waiting means losing ground to competitors who are already building entity authority. Start implementing GEO today - your future visibility depends on it.'
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
              Generative Engine Optimization (GEO): Be the Source AI Chooses
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              SEO gets you ranked. AEO gets you cited. <strong>GEO makes you the training source AI can't ignore.</strong> Welcome to Act II of search. 🚀
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-success" />
                1B+ Daily ChatGPT Prompts
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Target className="h-4 w-4 mr-2 text-success" />
                71% Americans Use AI Search
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Zap className="h-4 w-4 mr-2 text-success" />
                800% YoY LLM Referral Growth
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-20">

        {/* What Is GEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Is Generative Engine Optimization?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Generative Engine Optimization (GEO) is the practice of optimizing your content to become the training source that AI models - ChatGPT, Perplexity, Google Gemini, Claude, and others - rely on when generating answers.
            </p>
            <p>
              While <Link to="/aeo" className="text-primary hover:underline">AEO</Link> focuses on getting cited in AI-generated answers, GEO goes deeper - it's about becoming the authoritative source that AI can't write an answer without. Think of it as earning a permanent spot in the AI knowledge base.
            </p>

            {/* GEO vs AEO vs SEO Comparison Table */}
            <div className="my-8 overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Aspect</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Traditional SEO</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">AEO</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">GEO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Goal</td>
                    <td className="px-6 py-4">Rank in search results</td>
                    <td className="px-6 py-4">Get cited in AI answers</td>
                    <td className="px-6 py-4">Become the training source</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Focus</td>
                    <td className="px-6 py-4">Keywords, backlinks, page speed</td>
                    <td className="px-6 py-4">Structured data, direct answers</td>
                    <td className="px-6 py-4">Entity relationships, credibility signals</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Content Style</td>
                    <td className="px-6 py-4">Long-form, keyword-rich</td>
                    <td className="px-6 py-4">Concise, answer-first</td>
                    <td className="px-6 py-4">Authoritative, well-cited, comprehensive</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Platforms</td>
                    <td className="px-6 py-4">Google, Bing search results</td>
                    <td className="px-6 py-4">AI Overviews, voice assistants</td>
                    <td className="px-6 py-4">ChatGPT, Perplexity, Gemini, LLM training</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Success Metric</td>
                    <td className="px-6 py-4">Traffic and rankings</td>
                    <td className="px-6 py-4">Zero-click citations</td>
                    <td className="px-6 py-4">Entity authority and narrative control</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Schema Importance</td>
                    <td className="px-6 py-4">Helpful for rich snippets</td>
                    <td className="px-6 py-4">Important for featured snippets</td>
                    <td className="px-6 py-4">Critical for AI parsing</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-6 my-8">
              <h4 className="font-semibold mb-2 text-foreground">🎯 The Bottom Line</h4>
              <p className="text-sm text-info-foreground">
                SEO, AEO, and GEO synergize - they don't compete. Use all three for maximum visibility across traditional search, AI answers, and LLM training datasets. GEO is the future-proof layer that extends your SEO and AEO efforts.
              </p>
            </div>

            <p>
              Here's the reality: over 1 billion prompts are sent to ChatGPT daily. 71% of Americans use AI search to research purchases. By 2027, LLM traffic is projected to overtake traditional Google search. If your content isn't optimized for GEO, you're invisible to the next generation of search.
            </p>
          </div>
        </section>

        {/* Why Schema Markup Is Essential for GEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Schema Markup Is Essential for GEO</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Schema isn't optional for GEO - it's mandatory. Structured data is how AI models understand entities, relationships, authorship, and credibility. Without schema, you're just text on a page. With schema, you're a trusted, parseable source.
            </p>
            <p>
              Think of schema as machine-readable credibility signals. AI models parse Organization schema to understand who you are. Article schema provides content context and authorship. FAQ schema formats direct answers that AI loves to cite.
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
              <div className="flex items-start space-x-4">
                <FileJson className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">The GEO Schema Equation</h4>
                  <p className="text-sm">
                    <strong>Structured Data → Entity Authority → AI Training Eligibility → Narrative Control</strong>
                  </p>
                  <p className="text-sm mt-2">
                    Schema bridges the gap between human-readable content and machine-parseable authority. When you implement schema, you're signaling to AI: "This content is credible, structured, and training-worthy."
                  </p>
                </div>
              </div>
            </div>

            <p>
              The brands that build strong schema now will dominate AI-generated answers in 2026. Early GEO adopters are already seeing 3-5x higher citation rates across AI platforms. Don't wait for competitors to steal your spot in AI training datasets.
            </p>

            {/* Schema Type Links */}
            <div className="my-8">
              <h4 className="font-semibold mb-4 text-foreground text-lg">Essential Schema Types for GEO</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/organization-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">Organization Schema</h5>
                      <p className="text-sm text-muted-foreground">Establish entity authority</p>
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
                      <p className="text-sm text-muted-foreground">Content context for AI</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                <Link
                  to="/faq-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">FAQ Schema</h5>
                      <p className="text-sm text-muted-foreground">Direct answer formatting</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                <Link
                  to="/blogposting-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">BlogPosting Schema</h5>
                      <p className="text-sm text-muted-foreground">Blog credibility signals</p>
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

        {/* How to Optimize for GEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How to Optimize for GEO (Step-by-Step)</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <p>
              GEO isn't rocket science - it's strategic, authoritative content that AI models trust and train on. Follow these four steps to dominate AI discovery.
            </p>

            {geoSteps.map((step, index) => (
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
              <h3 className="text-2xl font-bold mb-2 text-foreground">Use SuperSchema's AI Generator to Build GEO Authority</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Paste your URL. Our AI detects your entity, generates comprehensive schema, validates everything, and gives you a quality score - all in under 30 seconds.
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

        {/* Common GEO Mistakes */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Common GEO Mistakes (and How to Fix Them)</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Even experienced marketers screw up GEO. Here are the mistakes killing your AI training eligibility - and exactly how to fix them.
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

        {/* Future of GEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Future of GEO and AI Discovery</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              GEO isn't a trend - it's the next SEO frontier. Here's where AI discovery is headed, and why early adopters will dominate.
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
                The future of search is conversational, multimodal, and AI-powered. Winners prioritize <strong className="text-foreground">entity authority over traffic</strong> and <strong className="text-foreground">citations over clicks</strong>.
              </p>
              <p>
                Brands that build GEO now - combining structured data, credibility signals, and genuine expertise - will dominate AI discovery. Those that wait? They'll be invisible to the next generation of search.
              </p>
            </div>
          </div>
        </section>

        {/* Related Tools */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Related Tools & Resources</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              SuperSchema offers free schema generators for all major content types. Start building GEO authority today.
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
            Ready to Dominate AI Discovery?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands using SuperSchema to build GEO authority and future-proof their visibility. Start with 2 free credits - no credit card required.
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
          "headline": "Generative Engine Optimization (GEO): Be the Source AI Chooses",
          "description": "Learn how to optimize your content to become the training source AI models rely on. Comprehensive guide to GEO, schema markup, entity optimization, and building authority for AI discovery.",
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
              "name": "Resources",
              "item": "https://superschema.ai/geo"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "GEO Guide",
              "item": "https://superschema.ai/geo"
            }
          ]
        }, null, 2)}
      </script>
    </div>
  )
}
