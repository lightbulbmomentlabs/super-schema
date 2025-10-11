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
  Shield,
  Brain,
  FileJson,
  ChevronRight,
  Network
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
    { name: 'Author Schema', path: '/organization-schema-generator', description: 'Build E-E-A-T signals' },
    { name: 'Article Schema', path: '/article-schema-generator', description: 'Content context for AI' },
    { name: 'FAQ Schema', path: '/faq-schema-generator', description: 'Direct answer formatting' },
    { name: 'BlogPosting Schema', path: '/blogposting-schema-generator', description: 'Blog credibility signals' }
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
      description: 'Schema isn\'t optional for GEO—it\'s mandatory. AI can\'t parse what it can\'t read. Machine-readable markup is your ticket to AI training datasets.',
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
      description: 'AI models train on authoritative sources. E-E-A-T isn\'t just for Google anymore—it\'s how you earn a spot in AI training data.',
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
        'AI rewards depth—cite multiple sources per claim'
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
      problem: 'Experience, Expertise, Authoritativeness, Trust—AI models evaluate these before including content in training data.',
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
    }
  ]

  const comparisonData = [
    {
      aspect: 'Primary Goal',
      seo: 'Rank in traditional search results',
      aeo: 'Get cited in AI-generated answers',
      geo: 'Become the training source AI relies on'
    },
    {
      aspect: 'Target Platforms',
      seo: 'Google, Bing, traditional search engines',
      aeo: 'AI Overviews, featured snippets, voice assistants',
      geo: 'ChatGPT, Perplexity, Gemini, Claude, LLM training'
    },
    {
      aspect: 'Success Metric',
      seo: 'Clicks and website traffic',
      aeo: 'Zero-click citations and visibility',
      geo: 'Entity authority and narrative control'
    },
    {
      aspect: 'Content Focus',
      seo: 'Keywords and backlinks',
      aeo: 'Direct answers and structured data',
      geo: 'Entity relationships and credibility signals'
    },
    {
      aspect: 'Schema Priority',
      seo: 'Optional (helpful for rich results)',
      aeo: 'Important (enables featured snippets)',
      geo: 'Critical (required for AI parsing)'
    },
    {
      aspect: 'Timeline',
      seo: '2000s–present',
      aeo: '2020s–present',
      geo: '2024–future'
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
      answer: 'AEO (Answer Engine Optimization) focuses on getting your content cited in AI-generated answers—think featured snippets, AI Overviews, and voice assistant responses. GEO (Generative Engine Optimization) goes deeper: it\'s about becoming the training source AI models rely on. AEO is about being the answer. GEO is about being the source AI can\'t ignore. Both matter, but GEO builds long-term entity authority that persists across all AI platforms.'
    },
    {
      question: 'Do I need GEO if I already do SEO?',
      answer: 'Absolutely. SEO gets you ranked in traditional search results. GEO ensures you\'re cited in AI-generated answers. By 2027, LLM traffic is projected to overtake Google search. If you\'re only doing SEO, you\'re optimizing for yesterday\'s search behavior. GEO extends your SEO efforts—they synergize, not compete. Strong SEO gets your content indexed. GEO ensures AI can understand, cite, and train on it.'
    },
    {
      question: 'How does schema help with GEO?',
      answer: 'Schema is machine-readable credibility. AI models parse structured data to understand entities, relationships, authorship, and context. Without schema, AI has to guess what your content means. With schema, you\'re telling AI exactly who you are, what you do, and why you\'re authoritative. Organization, Author, Article, and FAQ schema are critical for GEO. Use SuperSchema to generate error-free markup that AI models trust.'
    },
    {
      question: 'Which schema types matter most for GEO?',
      answer: 'Organization schema (establishes entity authority), Author schema (builds E-E-A-T signals), Article schema (provides content context), and FAQ schema (direct answer formatting). These four schema types signal to AI that your content is credible, well-structured, and training-worthy. SuperSchema automatically detects which schema types you need based on your content.'
    },
    {
      question: 'How do I measure GEO success?',
      answer: 'Check if your brand appears in ChatGPT responses, Perplexity citations, and Google AI Overviews. Monitor your entity\'s presence across AI platforms. Track brand mentions in AI-generated answers (even without links—visibility builds authority). Use tools like SuperSchema to ensure your schema quality score is 80+ for better AI parsing. GEO success isn\'t about clicks—it\'s about becoming the default source AI cites.'
    },
    {
      question: 'Is GEO just for big brands?',
      answer: 'No. GEO levels the playing field. Small brands with strong schema, clear entity definitions, and credible content can outrank Fortune 500 companies in AI-generated answers. AI doesn\'t care about your brand size—it cares about authority signals. If your content is well-structured, cited, and authoritative, AI will use it as a training source regardless of your company size.'
    },
    {
      question: 'Can GEO hurt my SEO?',
      answer: 'Only if you do it wrong. Invalid schema gets ignored. Schema that doesn\'t match visible content can trigger penalties. But properly implemented GEO? Pure upside. It enhances your SEO by making your content more parseable, more authoritative, and more citation-worthy across both traditional search engines and AI platforms. GEO and SEO work together—strong schema benefits both.'
    },
    {
      question: 'When will GEO become critical?',
      answer: 'It already is. Over 1 billion prompts are sent to ChatGPT daily. 71% of Americans use AI search to research purchases. By 2027, LLM traffic will overtake traditional Google search. The brands optimizing for GEO now will dominate AI discovery in 2026. Waiting means losing ground to competitors who are already building entity authority. Start implementing GEO today—your future visibility depends on it.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <PillarPageNav />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Brain className="h-4 w-4" />
              <span>The Next Frontier of Search</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Generative Engine Optimization (GEO): How to Be the Source AI Chooses
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              SEO gets you ranked. AEO gets you cited. <strong>GEO makes you the training source AI can't ignore.</strong> Welcome to Act II of search.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={isSignedIn ? '/generate' : '/sign-up'}
                className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Generate Perfect Schema for GEO
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/aeo"
                className="inline-flex items-center px-6 py-3 rounded-md border border-border hover:bg-accent transition-colors font-medium"
              >
                Learn About AEO First
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What Is GEO */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6">What Is GEO?</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                Generative Engine Optimization (GEO) is the evolution of search optimization for the AI era. While <Link to="/aeo" className="text-primary hover:underline">AEO</Link> focuses on getting your content cited in AI-generated answers, GEO goes deeper—it's about <strong>becoming the training source</strong> that AI models rely on.
              </p>
              <p>
                Think of it this way: AEO is about showing up in the answer. GEO is about being the authority AI can't write an answer without.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                <div className="p-6 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-4xl font-bold text-primary mb-2">1B+</div>
                  <div className="text-sm text-muted-foreground">Daily prompts to ChatGPT (2025)</div>
                </div>
                <div className="p-6 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-4xl font-bold text-primary mb-2">71%</div>
                  <div className="text-sm text-muted-foreground">Americans using AI search for purchases</div>
                </div>
                <div className="p-6 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-4xl font-bold text-primary mb-2">800%</div>
                  <div className="text-sm text-muted-foreground">YoY increase in LLM referrals (2024-2025)</div>
                </div>
              </div>
              <p>
                <strong>AEO = Get cited in answers.</strong><br />
                <strong>GEO = Become the source AI trains on.</strong>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-center">How GEO Differs from AEO and SEO</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              The evolution from SEO → AEO → GEO isn't about replacement—it's about expansion. Each builds on the last.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-background rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-4 text-left font-semibold">Aspect</th>
                    <th className="p-4 text-left font-semibold">SEO</th>
                    <th className="p-4 text-left font-semibold">AEO</th>
                    <th className="p-4 text-left font-semibold text-primary">GEO</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-4 font-medium">{row.aspect}</td>
                      <td className="p-4 text-muted-foreground">{row.seo}</td>
                      <td className="p-4 text-muted-foreground">{row.aeo}</td>
                      <td className="p-4 font-medium">{row.geo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 p-6 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-center">
                <strong>Key Takeaway:</strong> They synergize, not compete. GEO extends your SEO & AEO efforts. Do all three for maximum visibility across traditional search, AI answers, and LLM training datasets.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schema's Role in GEO */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6">The Role of Schema in GEO</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
              <p>
                Schema isn't optional for GEO—it's <strong>mandatory</strong>. Structured data is how you signal credibility, authority, and context to AI models. Without schema, your content is just text on a page. With schema, you're telling AI exactly who you are, what you do, and why you matter.
              </p>
              <p>
                Think of schema as machine-readable credibility signals. AI models parse structured data to understand entities, relationships, authorship, and content structure. The better your schema, the more likely AI includes your content in training datasets.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {schemaGenerators.map((schema, index) => (
                <Link
                  key={index}
                  to={schema.path}
                  className="p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <FileJson className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {schema.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{schema.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/10 text-center">
              <p className="mb-4">
                <strong>Want perfect schema?</strong> SuperSchema generates it automatically.
              </p>
              <Link
                to={isSignedIn ? '/generate' : '/sign-up'}
                className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Try SuperSchema Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How to Optimize for GEO */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">How to Optimize for GEO</h2>
            <div className="space-y-12">
              {geoSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                      {step.number}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start space-x-2">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ethical Considerations */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Ethical Considerations</h2>
            </div>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                GEO isn't about gaming AI models—it's about building genuine authority. As generative AI faces increasing scrutiny over training data ethics, platforms prioritize transparent, credible sources. Here's how to do GEO the right way:
              </p>
              <ul className="space-y-4 my-6">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Data Transparency:</strong> Be clear about what you claim. If your schema says you're an expert, prove it with credentials and case studies.
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Source Attribution:</strong> Give credit where it's due. Cite your sources, link to research, and acknowledge contributors.
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Avoid Manipulation:</strong> Schema must match visible content. Never lie to search engines or AI models—it's not worth the penalty.
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Trust Over Tricks:</strong> AI rewards authenticity. Build real expertise, create valuable content, and use schema to signal credibility—not to fake it.
                  </div>
                </li>
              </ul>
              <div className="p-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="m-0">
                  <strong>Remember:</strong> Schema that lies gets penalized. Schema that helps gets cited. Do GEO ethically, and you'll build lasting authority across all AI platforms.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Future of GEO */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">The Future of GEO and AI Discovery</h2>
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              GEO isn't a trend—it's the next SEO frontier. Here's where AI discovery is headed, and why early adopters win big.
            </p>
            <div className="grid grid-cols-1 gap-6">
              {futureTrends.map((trend, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-6 rounded-lg border border-border bg-background"
                >
                  <h3 className="font-bold text-xl mb-3 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>{trend.trend}</span>
                  </h3>
                  <p className="text-muted-foreground mb-4">{trend.description}</p>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm m-0">
                      <strong className="text-primary">Impact:</strong> {trend.impact}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-12 p-8 rounded-lg bg-primary text-primary-foreground text-center">
              <h3 className="text-2xl font-bold mb-4">The brands building GEO now will dominate AI discovery in 2026.</h3>
              <p className="mb-6 opacity-90">
                Don't wait for competitors to steal your spot in AI training datasets. Start optimizing today.
              </p>
              <Link
                to={isSignedIn ? '/generate' : '/sign-up'}
                className="inline-flex items-center px-6 py-3 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors font-medium"
              >
                Start Building GEO Authority
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-center">Common GEO Mistakes to Avoid</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Even experienced marketers screw up GEO. Here's what to watch for.
            </p>
            <div className="grid grid-cols-1 gap-6">
              {commonMistakes.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`p-6 rounded-lg border ${
                      item.severity === 'critical'
                        ? 'border-red-500/20 bg-red-500/5'
                        : item.severity === 'high'
                        ? 'border-orange-500/20 bg-orange-500/5'
                        : 'border-yellow-500/20 bg-yellow-500/5'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <Icon className={`h-6 w-6 flex-shrink-0 mt-1 ${
                        item.severity === 'critical'
                          ? 'text-red-500'
                          : item.severity === 'high'
                          ? 'text-orange-500'
                          : 'text-yellow-500'
                      }`} />
                      <div className="flex-grow">
                        <h3 className="font-bold text-lg mb-2">{item.mistake}</h3>
                        <p className="text-muted-foreground mb-3">
                          <strong>Problem:</strong> {item.problem}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Fix:</strong> {item.fix}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Everything you need to know about Generative Engine Optimization.
            </p>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Zap className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Dominate AI Discovery?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              SuperSchema generates perfect, GEO-optimized schema markup automatically. No technical skills required. Start building entity authority today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={isSignedIn ? '/generate' : '/sign-up'}
                className="inline-flex items-center px-8 py-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-lg"
              >
                Generate Schema Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/schema-markup-grader"
                className="inline-flex items-center px-8 py-4 rounded-md border border-border hover:bg-accent transition-colors font-medium text-lg"
              >
                Grade Your Existing Schema
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
