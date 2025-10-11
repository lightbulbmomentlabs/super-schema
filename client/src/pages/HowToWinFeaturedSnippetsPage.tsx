import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap,
  FileJson,
  ChevronRight,
  ListChecks,
  Code
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'

export default function HowToWinFeaturedSnippetsPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'How to Win Featured Snippets in 2025 | SuperSchema'
    window.scrollTo(0, 0)
  }, [])

  const snippetTypes = [
    {
      type: 'Paragraph Snippets',
      description: 'Brief text answers (40-60 words) that directly answer "what is" or "who is" queries.',
      example: 'Definitions, quick explanations, summaries'
    },
    {
      type: 'List Snippets',
      description: 'Ordered or unordered lists that answer "how to" or "best" queries.',
      example: 'Steps, rankings, ingredients, checklists'
    },
    {
      type: 'Table Snippets',
      description: 'Structured data comparing features, pricing, or specifications.',
      example: 'Product comparisons, pricing tables, specifications'
    },
    {
      type: 'Video Snippets',
      description: 'YouTube videos with specific timestamps for visual how-to content.',
      example: 'Tutorials, demonstrations, walkthroughs'
    }
  ]

  const choiceFactors = [
    {
      factor: 'Query Intent Match',
      explanation: 'Google looks for direct, clear answers that match exactly what the user is asking. Vague or tangential content gets skipped.',
      tip: 'Answer the question in the first sentence. Don\'t bury the lede.'
    },
    {
      factor: 'Content Structure',
      explanation: 'Lists, tables, and concise paragraphs win. Wall-of-text content loses. Google needs clean, scannable formatting.',
      tip: 'Use H2/H3 headings, bullet points, and short paragraphs (<50 words).'
    },
    {
      factor: 'Technical Clarity',
      explanation: 'Clean HTML and schema markup help Google parse your content faster. Messy code = confusion = no snippet.',
      tip: 'Validate your schema with SuperSchema. Broken markup kills eligibility.'
    },
    {
      factor: 'Entity Consistency',
      explanation: 'Google must trust the source. Consistent NAP (Name, Address, Phone), author credentials, and Organization schema build authority.',
      tip: 'Implement Organization and Author schema to signal credibility.'
    }
  ]

  const commonMistakes = [
    {
      mistake: 'Overly Long Answers',
      why: 'Google truncates anything over ~60 words. If your answer doesn\'t fit, it won\'t get pulled.',
      fix: 'Keep paragraph answers under 50 words. Be concise.'
    },
    {
      mistake: 'Keyword Stuffing',
      why: 'Old SEO tactics kill snippet chances. Google wants natural language, not robotic repetition.',
      fix: 'Write like you\'re teaching a human, not a search engine.'
    },
    {
      mistake: 'Missing or Incorrect Schema',
      why: 'Schema helps Google understand context. Wrong schema types or broken JSON-LD = invisibility.',
      fix: 'Use HowTo schema for steps, FAQPage for Q&A, Article for definitions. Validate everything.'
    },
    {
      mistake: 'Inconsistent Entity Naming',
      why: 'If your Organization schema says "Acme Inc" but your content says "ACME Corporation," Google gets confused.',
      fix: 'Pick one name and stick to it across schema, content, and NAP.'
    },
    {
      mistake: 'Duplicate Headings',
      why: 'Repeating "What is X?" 5 times dilutes focus. Google doesn\'t know which answer to pull.',
      fix: 'Use unique, descriptive H2/H3 tags for each section.'
    }
  ]

  const checklist = [
    'Identify question-based queries (use Google\'s "People Also Ask" boxes)',
    'Write short, direct answers (40-50 words for paragraphs)',
    'Use descriptive H2/H3 headings that match user intent',
    'Add HowTo, FAQ, or Article schema to reinforce structure',
    'Validate schema with Schema Markup Grader before publishing'
  ]

  const faqs = [
    {
      question: 'How long does it take to win a featured snippet?',
      answer: 'It varies. If you already rank in the top 10 for a query, you could win the snippet in days to weeks after optimizing. If you\'re not ranking yet, focus on SEO first. Schema implementation is instant, but Google needs time to re-crawl and re-index your pages. Typically, expect 2-8 weeks for snippet eligibility after optimization.'
    },
    {
      question: 'Can schema alone get me a featured snippet?',
      answer: 'No. Schema helps, but it\'s not magic. You still need to rank in the top 10, answer the query directly, and structure your content properly. Think of schema as a signal boost, not a shortcut. It tells Google "here\'s a clear, structured answer" - but your content still has to deserve the snippet.'
    },
    {
      question: 'What\'s the difference between featured snippets and AI answers?',
      answer: 'Featured snippets are Google\'s top-of-page answer boxes pulled from a single source. AI answers (like AI Overviews, Perplexity, or ChatGPT) synthesize information from multiple sources. But here\'s the key: AI engines often train on or cite snippet-eligible content. Optimizing for snippets also optimizes for AI search. It\'s the same foundation - clear, structured, schema-enhanced answers.'
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
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/aeo" className="hover:text-foreground transition-colors">AEO Guide</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Featured Snippets</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              How to Win Featured Snippets (and Steal the Top Spot in AI Search)
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              Featured snippets aren't just SEO trophies anymore - they're training data for AI engines like SGE, Copilot, and Perplexity. When you optimize for Position 0, you're teaching AI platforms to cite your content as the authoritative answer.
            </p>
            <p className="text-base text-muted-foreground">
              This guide shows you exactly how to structure content, implement schema markup, and claim featured snippets before your competitors do. Let's make your content the answer AI can't ignore.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-16">

        {/* What Are Featured Snippets */}
        <section>
          <h2 className="text-3xl font-bold mb-6">What Are Featured Snippets (and Why They Matter Now)</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Featured snippets are Google's answer boxes that appear at the top of search results, above all other organic listings. They pull a direct answer from a webpage and display it prominently - often called "Position 0" because they outrank even the #1 result.
            </p>
            <p>
              But here's what changed in 2024-2025: featured snippets are no longer just about clicks. AI engines like Google SGE, Microsoft Copilot, and Perplexity use snippet-eligible content as training data and citation sources. When you win a snippet, you're not just visible in Google - you're visible to every AI platform pulling from that same structured, authoritative content.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
              {snippetTypes.map((snippet, index) => (
                <div key={index} className="p-5 border border-border rounded-lg bg-card">
                  <h4 className="font-bold text-foreground mb-2">{snippet.type}</h4>
                  <p className="text-sm mb-3">{snippet.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Best for:</strong> {snippet.example}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <p className="text-sm m-0">
                <strong className="text-foreground">Key Insight:</strong> Featured snippets drive zero-click visibility. Users get answers without leaving Google. But AI engines see these as authoritative sources. Being cited builds brand authority even without traffic.
              </p>
            </div>
          </div>
        </section>

        {/* How Google Chooses Snippets */}
        <section>
          <h2 className="text-3xl font-bold mb-6">How Google Chooses Featured Snippets</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Google doesn't randomly pick snippets. There's a logic to it. Understanding how Google evaluates snippet-worthiness helps you structure content that wins.
            </p>

            <div className="space-y-4 my-8">
              {choiceFactors.map((item, index) => (
                <div key={index} className="border border-border rounded-lg p-6 bg-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-2">{item.factor}</h4>
                      <p className="text-sm mb-3">{item.explanation}</p>
                      <div className="flex items-start space-x-2">
                        <Target className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-primary m-0"><strong>Action:</strong> {item.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-6">
              <p className="text-sm m-0">
                <strong className="text-foreground">Think of it as teaching Google's AI to quote you - not just rank you.</strong> Structure, clarity, and schema are your tools.
              </p>
            </div>
          </div>
        </section>

        {/* Structuring Content */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Structuring Content to Earn Featured Snippets</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Winning snippets isn't about luck - it's about format. Here's how to structure your content so Google can easily extract and display the answer.
            </p>

            <div className="space-y-4 my-8">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2">Use a Direct Question → Answer Format</h4>
                <p className="text-sm">
                  Start with an H2 or H3 that matches the user's query exactly (e.g., "How do I optimize for featured snippets?"). Follow immediately with a concise answer in the first sentence.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2">Keep Paragraph Answers Under 50 Words</h4>
                <p className="text-sm">
                  Google truncates long paragraphs. If your answer doesn't fit in ~2-3 sentences, it won't get pulled. Be ruthlessly concise.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2">Use Lists for "How-To" or "Best-Of" Content</h4>
                <p className="text-sm">
                  Ordered lists (numbered steps) and unordered lists (bullet points) are snippet gold. Google loves scannable, structured formatting.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2">Write Descriptive H2/H3 Headings That Match Intent</h4>
                <p className="text-sm">
                  Don't use generic headings like "Overview" or "Introduction." Use specific, question-based headings: "How do I...?", "What is...?", "Why does...?"
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2">Add Schema Markup to Reinforce Structure</h4>
                <p className="text-sm">
                  HowTo schema for step-by-step guides. FAQPage schema for Q&A content. Article schema for definitions. Schema tells Google "this is a clear, structured answer."
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-lg p-6 text-center my-8">
              <ListChecks className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="text-xl font-bold mb-2 text-foreground">Not Sure Which Schema to Use?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use our <Link to="/howto-schema-generator" className="text-primary hover:underline font-semibold">HowTo Schema Generator</Link> to create AI-ready markup automatically. Perfect for step-by-step guides and tutorials.
              </p>
            </div>
          </div>
        </section>

        {/* Schema Markup Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">How Schema Markup Boosts Your Snippet Chances</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Schema markup is how you speak machine. It tells Google (and AI engines) exactly what your content represents - a how-to guide, a Q&A, a product comparison - without forcing them to guess.
            </p>
            <p>
              Structured data doesn't guarantee snippets, but it dramatically increases eligibility. Pages with proper schema are 434% more likely to appear in featured snippets than pages without.
            </p>

            <div className="my-8">
              <h4 className="font-semibold mb-4 text-foreground">Key Schema Types That Influence Snippet Eligibility</h4>
              <div className="grid grid-cols-1 gap-4">
                <Link
                  to="/faq-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">FAQPage Schema</h5>
                      <p className="text-sm text-muted-foreground">Perfect for question-and-answer boxes. Google pulls these for "what is" and "how do I" queries.</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                  </div>
                </Link>

                <Link
                  to="/howto-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">HowTo Schema</h5>
                      <p className="text-sm text-muted-foreground">Structured step-by-step instructions. Ideal for tutorials, recipes, and process guides.</p>
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
                      <p className="text-sm text-muted-foreground">Defines authorship, publish dates, and content context. Great for definitions and explanations.</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                  </div>
                </Link>

                <Link
                  to="/product-schema-generator"
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold group-hover:text-primary transition-colors">Product Schema</h5>
                      <p className="text-sm text-muted-foreground">Pricing, features, and review data. Powers table snippets and product comparison boxes.</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start space-x-3 mb-3">
                <Code className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <h4 className="font-semibold text-foreground">Example: HowTo Schema for a Featured Snippet</h4>
              </div>
              <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Win Featured Snippets",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Identify Answerable Queries",
      "text": "Use Google's People Also Ask boxes to find questions people actually ask."
    },
    {
      "@type": "HowToStep",
      "name": "Write Concise Answers",
      "text": "Keep paragraph answers under 50 words for snippet eligibility."
    },
    {
      "@type": "HowToStep",
      "name": "Add Schema Markup",
      "text": "Use HowTo or FAQ schema to signal structured content to Google."
    }
  ]
}`}
              </pre>
            </div>

            <p className="font-semibold text-foreground">
              SuperSchema automatically generates this markup for you. No manual JSON editing. No Schema.org documentation hunting. Just paste your URL, and we handle the rest.
            </p>
          </div>
        </section>

        {/* Common Mistakes */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Common Mistakes That Kill Snippet Potential</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Most content fails to win snippets because of preventable mistakes. Here's what kills your chances - and how to fix it.
            </p>

            <div className="space-y-4 my-8">
              {commonMistakes.map((item, index) => (
                <div key={index} className="border border-warning/50 bg-warning/5 rounded-lg p-5">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-1">{item.mistake}</h4>
                      <p className="text-sm mb-2"><strong>Why it fails:</strong> {item.why}</p>
                      <p className="text-sm m-0"><strong className="text-success">Fix:</strong> {item.fix}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-6">
              <p className="text-sm m-0">
                <strong className="text-foreground">Rule of thumb:</strong> Google wants clarity, not cleverness. Write like you're teaching, not selling.
              </p>
            </div>
          </div>
        </section>

        {/* The Future */}
        <section>
          <h2 className="text-3xl font-bold mb-6">The Future: Featured Snippets in AI Search Results</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Featured snippets are evolving beyond Google. AI Overviews (formerly SGE), Microsoft Copilot, and Perplexity all pull from the same structured, snippet-eligible content. When you optimize for snippets, you're optimizing for every AI platform.
            </p>
            <p>
              This is <Link to="/aeo" className="text-primary hover:underline">Answer Engine Optimization (AEO)</Link> in action: creating content that's structured, answerable, and machine-readable. Schema markup is the bridge between human content and AI understanding.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
              <div className="p-5 border border-border rounded-lg bg-card">
                <h4 className="font-bold text-foreground mb-2">AI Overviews (SGE)</h4>
                <p className="text-sm">
                  Google's generative AI feature pulls from snippet-eligible content. Proper schema increases your chances of being cited in AI-generated summaries.
                </p>
              </div>
              <div className="p-5 border border-border rounded-lg bg-card">
                <h4 className="font-bold text-foreground mb-2">Microsoft Copilot</h4>
                <p className="text-sm">
                  Copilot uses Bing's index, which prioritizes structured data and clear answers - the same signals that win featured snippets.
                </p>
              </div>
              <div className="p-5 border border-border rounded-lg bg-card">
                <h4 className="font-bold text-foreground mb-2">Perplexity AI</h4>
                <p className="text-sm">
                  Perplexity cites authoritative sources with strong schema and clear content structure. Snippet optimization = Perplexity citation eligibility.
                </p>
              </div>
              <div className="p-5 border border-border rounded-lg bg-card">
                <h4 className="font-bold text-foreground mb-2">ChatGPT Web Search</h4>
                <p className="text-sm">
                  As ChatGPT adds real-time web search, it will prioritize parseable, structured content. Schema-enhanced pages have the edge.
                </p>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <p className="text-sm m-0">
                <strong className="text-foreground">Bottom line:</strong> SuperSchema helps you future-proof your content for every AI platform. Win the snippet, win the AI citation.
              </p>
            </div>
          </div>
        </section>

        {/* TL;DR Checklist */}
        <section>
          <h2 className="text-3xl font-bold mb-6">TL;DR - Featured Snippet Checklist</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Here's your step-by-step checklist for winning featured snippets:
            </p>

            <div className="bg-card border border-border rounded-lg p-6">
              <ul className="space-y-3 m-0">
                {checklist.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-lg p-8 text-center my-8">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2 text-foreground">Ready to Automate Your Snippet-Winning Schema?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Stop manually coding JSON-LD. SuperSchema analyzes your content, detects the right schema types, and generates validated markup in under 30 seconds.
              </p>
              <Link
                to={isSignedIn ? '/generate' : '/sign-up'}
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
              >
                Try Super Schema Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
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
          <h2 className="text-3xl font-bold mb-6">Related Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/aeo"
              className="p-5 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold group-hover:text-primary transition-colors mb-1">Answer Engine Optimization (AEO)</h5>
                  <p className="text-sm text-muted-foreground">Complete guide to optimizing for AI search platforms</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
              </div>
            </Link>

            <Link
              to="/schema-markup"
              className="p-5 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold group-hover:text-primary transition-colors mb-1">Schema Markup Guide</h5>
                  <p className="text-sm text-muted-foreground">Everything you need to know about structured data</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
              </div>
            </Link>

            <Link
              to="/schema-markup-grader"
              className="p-5 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold group-hover:text-primary transition-colors mb-1">Schema Markup Grader</h5>
                  <p className="text-sm text-muted-foreground">Free tool to analyze and score your schema markup</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />

      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "How to Win Featured Snippets (and Steal the Top Spot in AI Search)",
          "description": "Learn tactical strategies for winning featured snippets and dominating Position 0 in Google search. Complete guide to structuring content, implementing schema markup, and optimizing for AI search platforms.",
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
          "dateModified": "2025-01-11",
          "keywords": "featured snippets, position 0, answer engine optimization, AEO, schema markup, AI search, Google snippets"
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
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": "How to Win Featured Snippets",
              "item": "https://superschema.ai/aeo/how-to-win-featured-snippets"
            }
          ]
        }, null, 2)}
      </script>

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
    </div>
  )
}
