import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Code,
  FileJson,
  ChevronRight,
  ListChecks,
  Zap,
  Search
} from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/Footer'
import FAQItem from '@/components/FAQItem'
import PillarPageNav from '@/components/PillarPageNav'

export default function JsonLdVsMicrodataPage() {
  const { isSignedIn } = useUser()

  useEffect(() => {
    document.title = 'JSON-LD vs Microdata: Which Schema Format to Use | SuperSchema'
    window.scrollTo(0, 0)
  }, [])

  const formats = [
    {
      name: 'JSON-LD',
      appearance: 'Separate <script> block',
      trait: 'Google\'s preferred format - clean and maintainable'
    },
    {
      name: 'Microdata',
      appearance: 'Inline HTML attributes',
      trait: 'Legacy format - harder to manage at scale'
    },
    {
      name: 'RDFa',
      appearance: 'HTML attribute extensions',
      trait: 'Advanced linked data - steeper learning curve'
    }
  ]

  const comparisonRows = [
    {
      feature: 'Ease of Implementation',
      jsonLd: 'Simple script block',
      microdata: 'Requires HTML annotation'
    },
    {
      feature: 'Maintenance',
      jsonLd: 'Easy - separate from content',
      microdata: 'Difficult - tangled with HTML'
    },
    {
      feature: 'Page Load Impact',
      jsonLd: 'Minimal (one script)',
      microdata: 'Bloats HTML markup'
    },
    {
      feature: 'CMS Compatibility',
      jsonLd: 'Works everywhere',
      microdata: 'Depends on CMS flexibility'
    },
    {
      feature: 'Error Visibility',
      jsonLd: 'Easy to spot and fix',
      microdata: 'Hidden in HTML chaos'
    },
    {
      feature: 'Google Preference',
      jsonLd: 'Recommended since 2015',
      microdata: 'Supported but not preferred'
    },
    {
      feature: 'Dynamic Content',
      jsonLd: 'Perfect for APIs/JS injection',
      microdata: 'Requires template changes'
    },
    {
      feature: 'Scalability',
      jsonLd: 'Scales effortlessly',
      microdata: 'Gets messy fast'
    }
  ]

  const jsonLdAdvantages = [
    {
      title: 'Cleaner Data for AI Models',
      description: 'AI search engines like ChatGPT, Perplexity, and Google AI Overviews parse JSON-LD faster and more accurately than inline Microdata. Consistent, structured data = better AEO performance.'
    },
    {
      title: 'Easier Validation, Fewer Errors',
      description: 'Validation tools can instantly spot JSON-LD issues. Microdata errors hide in your HTML. Fewer errors = better crawl budget and indexing.'
    },
    {
      title: 'Dynamic Injection at Scale',
      description: 'Need to add schema to 10,000 pages? JSON-LD can be injected via APIs, Tag Manager, or JavaScript. Microdata requires manual HTML editing on every template.'
    },
    {
      title: 'Cross-Platform Resilience',
      description: 'Works seamlessly across HubSpot, Webflow, WordPress, Shopify, and custom builds. Microdata implementations vary wildly by platform.'
    }
  ]

  const microdataUseCases = [
    {
      scenario: 'Legacy Static Sites',
      explanation: 'Old websites with hard-coded HTML templates where adding <script> tags is restricted.'
    },
    {
      scenario: 'CMS Script Restrictions',
      explanation: 'Some locked-down CMS platforms block custom JavaScript but allow HTML attribute editing.'
    },
    {
      scenario: 'HTML-Only Policies',
      explanation: 'Rare environments (government, enterprise) with strict no-JavaScript policies.'
    }
  ]

  const migrationSteps = [
    {
      step: 'Copy Your Existing Microdata HTML',
      detail: 'Grab the HTML section containing itemscope, itemtype, and itemprop attributes.'
    },
    {
      step: 'Convert to JSON-LD Format',
      detail: 'Use an online converter or SuperSchema\'s AI-powered generator to transform it into clean JSON-LD.'
    },
    {
      step: 'Validate the New Markup',
      detail: 'Test with SuperSchema\'s free Schema Markup Grader or Google\'s Rich Results Test.'
    },
    {
      step: 'Deploy JSON-LD Sitewide',
      detail: 'Add the <script> block to your header, footer, or via Tag Manager.'
    },
    {
      step: 'Revalidate After Crawl',
      detail: 'Request re-indexing via Google Search Console and verify rich results appear.'
    }
  ]

  const commonMistakes = [
    {
      mistake: 'Missing @context or @type',
      why: 'Without these required fields, Google can\'t identify what your schema describes. It becomes useless noise.',
      fix: 'Always start with "@context": "https://schema.org" and "@type": "YourSchemaType".'
    },
    {
      mistake: 'Double-Tagging (Both Formats Live)',
      why: 'Leaving Microdata live while adding JSON-LD confuses search engines and can cause conflicts.',
      fix: 'Remove all Microdata attributes after deploying JSON-LD.'
    },
    {
      mistake: 'Invalid Characters or Line Breaks',
      why: 'JSON-LD is strict. One misplaced comma, unclosed quote, or line break kills the entire block.',
      fix: 'Use a JSON validator before publishing. Tools catch syntax errors instantly.'
    },
    {
      mistake: 'Forgetting to Validate',
      why: 'Broken schema = invisible to Google. No validation = you\'re flying blind.',
      fix: 'Always validate with Google\'s Rich Results Test or SuperSchema\'s Grader.'
    },
    {
      mistake: 'Not Removing Old Microdata',
      why: 'Duplicate schema can cause Google to misinterpret which data to trust.',
      fix: 'Do a full audit - search your HTML for itemprop and itemscope, then delete.'
    }
  ]

  const faqs = [
    {
      question: 'Is JSON-LD required for Google rich results?',
      answer: 'No, but it\'s strongly recommended. Google supports JSON-LD, Microdata, and RDFa - all three can trigger rich results. However, Google\'s official documentation calls JSON-LD "the simplest and most flexible" approach. It\'s easier to implement, maintain, and scale, which is why it\'s preferred for modern websites.'
    },
    {
      question: 'Can I use both JSON-LD and Microdata on the same page?',
      answer: 'Technically yes, but it\'s not recommended. Google won\'t merge attributes from both formats for the same entity unless you use identical IDs. This can cause conflicts and confusion. Best practice: pick one format (JSON-LD) and stick with it sitewide.'
    },
    {
      question: 'Will switching to JSON-LD improve my rankings?',
      answer: 'Not directly. Schema markup (regardless of format) doesn\'t boost rankings on its own. However, JSON-LD makes it easier for search engines and AI models to understand your content, which can lead to rich results, featured snippets, and better visibility in AI search platforms. Better visibility = more traffic = indirect ranking benefits.'
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
          <Link to="/schema-markup" className="hover:text-foreground transition-colors">
            Schema Markup Guide
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">JSON-LD vs Microdata</span>
        </nav>

        {/* Hero Section */}
        <section>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
              JSON-LD vs Microdata:
            </span>{' '}
            Which Schema Format Should You Use (and Why It Matters)
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            If you've ever looked under the hood of a website's structured data, you've probably seen two main flavors: JSON-LD and Microdata. Both tell search engines what your content means - but they do it in very different ways.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Understanding the difference helps with performance, validation, and AEO readiness. Google's current recommendation strongly favors JSON-LD - and for good reason. It's cleaner, easier to maintain, and plays better with AI-driven search platforms like ChatGPT, Perplexity, and Google AI Overviews.
          </p>
          <div className="p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <p className="text-foreground font-semibold">
              SuperSchema automatically generates clean JSON-LD markup - no HTML tangling required. Start with 2 free credits.
            </p>
            <Link
              to={isSignedIn ? "/generate" : "/sign-up"}
              className="inline-flex items-center text-primary font-semibold mt-3 hover:translate-x-1 transition-transform"
            >
              Generate JSON-LD Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* What Schema Markup Formats Are */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Schema Markup Formats Are (and Why They Exist)</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Schema markup is the language search engines use to interpret content meaning. Instead of guessing what your page is about, schema tells them explicitly: "This is an article," "This is a product with a price," or "This is a local business with hours and reviews."
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            There are three primary formats for implementing schema markup:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {formats.map((format, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <Code className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold mb-2">{format.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{format.appearance}</p>
                <p className="text-sm font-medium text-foreground">{format.trait}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What Is JSON-LD */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Is JSON-LD?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            JSON-LD stands for JavaScript Object Notation for Linked Data. It's structured data placed inside a <code className="text-primary bg-primary/10 px-2 py-1 rounded">&lt;script type="application/ld+json"&gt;</code> tag - completely separate from your HTML content.
          </p>
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Separate from HTML</p>
                <p className="text-muted-foreground">Clean and easy to maintain without touching your content structure.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Google's Preferred Format Since 2015</p>
                <p className="text-muted-foreground">Officially recommended in Google's Search Central documentation.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Ideal for Automation and AI</p>
                <p className="text-muted-foreground">Perfect for programmatic generation - like SuperSchema's AI-powered approach.</p>
              </div>
            </div>
          </div>
          <div className="bg-muted p-6 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2 font-mono">Example: Organization Schema in JSON-LD</p>
            <pre className="text-sm text-foreground overflow-x-auto">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SuperSchema",
  "url": "https://superschema.ai",
  "logo": "https://superschema.ai/logo.png"
}
</script>`}
            </pre>
          </div>
        </section>

        {/* What Is Microdata */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Is Microdata?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Microdata is schema markup embedded directly into HTML elements using attributes like <code className="text-primary bg-primary/10 px-2 py-1 rounded">itemscope</code>, <code className="text-primary bg-primary/10 px-2 py-1 rounded">itemtype</code>, and <code className="text-primary bg-primary/10 px-2 py-1 rounded">itemprop</code>.
          </p>
          <div className="bg-muted p-6 rounded-lg border border-border mb-6">
            <p className="text-sm text-muted-foreground mb-2 font-mono">Example: Organization Schema in Microdata</p>
            <pre className="text-sm text-foreground overflow-x-auto">
{`<div itemscope itemtype="https://schema.org/Organization">
  <span itemprop="name">SuperSchema</span>
  <link itemprop="url" href="https://superschema.ai">
  <img itemprop="logo" src="https://superschema.ai/logo.png">
</div>`}
            </pre>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            While Microdata works and is still recognized by Google, it's messier and harder to manage - especially at scale. Every property has to be manually wrapped in HTML tags, creating a maintenance nightmare.
          </p>
          <div className="p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r">
            <p className="text-sm font-semibold text-foreground">
              Microdata is still recognized by Google but rarely recommended for modern websites.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">JSON-LD vs Microdata: Key Differences</h2>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  <th className="text-left p-4 font-semibold text-foreground">JSON-LD</th>
                  <th className="text-left p-4 font-semibold text-foreground">Microdata</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="p-4 font-medium text-foreground">{row.feature}</td>
                    <td className="p-4 text-muted-foreground">{row.jsonLd}</td>
                    <td className="p-4 text-muted-foreground">{row.microdata}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 p-6 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <p className="text-foreground font-semibold">
              Pro Tip: Google's own documentation calls JSON-LD "the simplest and most flexible approach for modern structured data."
            </p>
          </div>
        </section>

        {/* Why JSON-LD Is Better for SEO and AEO */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why JSON-LD Is Better for SEO and AEO</h2>
          <p className="text-lg text-muted-foreground mb-8">
            JSON-LD isn't just easier to implement - it's built for the future of search. As AI-driven answer engines become the norm, clean structured data matters more than ever.
          </p>
          <div className="grid gap-6 mb-8">
            {jsonLdAdvantages.map((advantage, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors">
                <FileJson className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold mb-2">{advantage.title}</h3>
                <p className="text-muted-foreground">{advantage.description}</p>
              </div>
            ))}
          </div>
          <div className="p-6 bg-primary/5 border border-primary rounded-lg">
            <p className="text-foreground mb-3">
              Want to optimize your content for AI search engines like ChatGPT, Perplexity, and Google AI Overviews?
            </p>
            <Link
              to="/aeo"
              className="inline-flex items-center text-primary font-semibold hover:translate-x-1 transition-transform"
            >
              Learn how JSON-LD powers Answer Engine Optimization <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* When Microdata Might Still Be Useful */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">When Microdata Might Still Be Useful</h2>
          <p className="text-lg text-muted-foreground mb-8">
            To be fair, there are rare scenarios where Microdata might be your only option:
          </p>
          <div className="space-y-4 mb-6">
            {microdataUseCases.map((useCase, index) => (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-2">{useCase.scenario}</h3>
                <p className="text-muted-foreground">{useCase.explanation}</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r">
            <p className="text-sm text-foreground">
              Even in these cases, JSON-LD can often be added via Google Tag Manager, WordPress plugins, or custom scripts.
            </p>
          </div>
        </section>

        {/* How to Switch from Microdata to JSON-LD */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How to Switch from Microdata to JSON-LD (Step-by-Step)</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Migrating from Microdata to JSON-LD is straightforward - here's how to do it:
          </p>
          <div className="space-y-6 mb-8">
            {migrationSteps.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{item.step}</h3>
                  <p className="text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/schema-markup-grader"
              className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
            >
              <Search className="h-8 w-8 text-primary mb-3" />
              <h5 className="font-semibold mb-2 text-foreground">Free Schema Markup Grader</h5>
              <p className="text-sm text-muted-foreground mb-3">Test your new JSON-LD markup instantly</p>
              <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Grade Your Schema <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
            <Link
              to={isSignedIn ? "/generate" : "/sign-up"}
              className="flex-1 p-6 border border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all group"
            >
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h5 className="font-semibold mb-2 text-foreground">Generate JSON-LD</h5>
              <p className="text-sm text-muted-foreground mb-3">AI-powered schema generation for any URL</p>
              <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Start Generating <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </div>
        </section>

        {/* Common Mistakes When Migrating Schema */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Common Mistakes When Migrating Schema</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Avoid these common pitfalls when switching from Microdata to JSON-LD:
          </p>
          <div className="space-y-6">
            {commonMistakes.map((item, index) => (
              <div key={index} className="p-6 border-l-4 border-orange-500 bg-orange-500/5 rounded-r-lg">
                <div className="flex items-start mb-3">
                  <AlertTriangle className="h-6 w-6 text-orange-500 mr-3 flex-shrink-0 mt-1" />
                  <h3 className="text-xl font-semibold text-foreground">{item.mistake}</h3>
                </div>
                <p className="text-muted-foreground mb-3"><span className="font-semibold">Why it matters:</span> {item.why}</p>
                <p className="text-foreground"><span className="font-semibold text-green-600">Fix:</span> {item.fix}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-6 bg-red-500/10 border-l-4 border-red-500 rounded-r">
            <p className="text-foreground font-semibold">
              One invalid comma can break your entire schema block - always validate before publishing.
            </p>
          </div>
        </section>

        {/* JSON-LD Is the Future */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">JSON-LD Is the Future (and the Foundation of AEO)</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Search is evolving fast. Traditional SEO focused on ranking in a list of ten blue links. Answer Engine Optimization (AEO) focuses on being the source AI chooses for direct answers.
          </p>
          <p className="text-lg text-muted-foreground mb-6">
            Search engines → AI assistants → generative search - all rely on structured, linked data. JSON-LD aligns perfectly with that direction. It's machine-readable, AI-friendly, and built for scale.
          </p>
          <p className="text-xl text-foreground font-semibold italic mb-8">
            "If Schema is the language of machines, JSON-LD is the cleanest accent."
          </p>
          <div className="bg-primary rounded-lg p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Start Generating Perfectly Formatted JSON-LD
            </h3>
            <p className="text-lg text-primary-foreground/80 mb-6">
              SuperSchema's AI-powered generator creates clean, validated JSON-LD schema for any URL. Start with 2 free credits - no credit card required.
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
              to="/schema-markup"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Schema Markup Guide</h3>
                  <p className="text-muted-foreground mb-3">
                    Complete guide to schema markup fundamentals and implementation
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
            <Link
              to="/aeo/how-to-win-featured-snippets"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">How to Win Featured Snippets</h3>
                  <p className="text-muted-foreground mb-3">
                    Tactical strategies for dominating Position 0 with schema markup
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
              to="/schema-markup-grader"
              className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Schema Markup Grader</h3>
                  <p className="text-muted-foreground mb-3">
                    Free tool to validate and grade your schema implementation
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
          "headline": "JSON-LD vs Microdata: Which Schema Format Should You Use (and Why It Matters)",
          "description": "Complete comparison guide for JSON-LD vs Microdata schema markup formats. Learn which format Google prefers, migration steps, and why JSON-LD is better for SEO and AEO.",
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
              "name": "Schema Markup Guide",
              "item": "https://superschema.ai/schema-markup"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "JSON-LD vs Microdata",
              "item": "https://superschema.ai/schema-markup/json-ld-vs-microdata"
            }
          ]
        }, null, 2)}
      </script>
    </motion.div>
  )
}
