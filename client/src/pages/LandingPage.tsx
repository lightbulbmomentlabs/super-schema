import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowRight, Zap, Shield, Clock, CheckCircle } from 'lucide-react'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'

export default function LandingPage() {
  const { isSignedIn } = useUser()

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Schema Generation',
      description: 'Our AI reads your content faster than you can say "structured data" and generates optimal markup for answer engine optimization and SEO. No PhD in Schema.org required.'
    },
    {
      icon: Shield,
      title: 'Schema.org Compliant',
      description: 'All generated JSON-LD schemas are validated against Schema.org standards. We speak fluent search engine, so you don\'t have to.'
    },
    {
      icon: Clock,
      title: 'Faster Than Your Coffee Break',
      description: 'Generate comprehensive, AEO-optimized schema markup in under 30 seconds. Seriously, you\'ll spend more time deciding what to have for lunch.'
    }
  ]

  const benefits = [
    'Boost Answer Engine Optimization (AEO) for AI search',
    'Enhanced rich snippets and featured results',
    'Better SEO rankings with structured data',
    'Automated schema type detection and generation',
    'Real-time JSON-LD validation and error checking',
    'User-friendly schema markup editor'
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SuperSchemaLogo className="h-8 w-8" />
            <span className="font-bold text-xl">SuperSchema</span>
          </div>
          <div className="space-x-4">
            {isSignedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            AEO Schema Generator
            <span className="text-primary block">That's Actually Super</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop wrestling with JSON-LD syntax at 2am. Our AI-powered schema markup tool automatically creates optimized structured data for answer engine optimization (AEO) and SEO.
            Because life's too short for manual schema markup. ⚡
          </p>
          <div className="space-x-4">
            <Link
              to="/sign-up"
              className="inline-flex items-center px-8 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-lg font-medium"
            >
              Get Your Superpowers
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="#demo"
              className="inline-flex items-center px-8 py-3 rounded-md border border-border hover:bg-accent transition-colors text-lg font-medium"
            >
              Watch Demo
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            2 free credits • No credit card required • No schema-induced headaches
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Schema Markup Superpowers for AEO & SEO
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional JSON-LD schema markup that makes Google, AI search engines, and answer engines go "wow, this site gets it." 🎯
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-border bg-card">
                <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Use Our AEO Schema Generator?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/30 p-8 rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-4">So Simple, It's Super</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Drop Your URL</p>
                    <p className="text-sm text-muted-foreground">Like a mic drop, but less dramatic</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Watch the Magic</p>
                    <p className="text-sm text-muted-foreground">AI does the heavy lifting (and the thinking)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Copy & Conquer</p>
                    <p className="text-sm text-muted-foreground">Grab your JSON-LD and become an SEO hero</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring System Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="/aeo-schema-generator-schema-quality-score.jpg"
                alt="Schema Quality Score Interface showing real-time scoring metrics"
                className="w-full h-auto rounded-[25px] shadow-2xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Know Your Schema Score
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Not all schema markup is created equal. Our intelligent scoring system grades your generated schema on completeness, accuracy, and AEO optimization potential.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Real-time Quality Scoring</p>
                    <p className="text-sm text-muted-foreground">See exactly how well your schema performs before you implement it</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Completeness Metrics</p>
                    <p className="text-sm text-muted-foreground">Understand what's missing and what could be improved</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">AEO Optimization Insights</p>
                    <p className="text-sm text-muted-foreground">Get specific recommendations for better AI search visibility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Refinement Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                One-Click AI Optimization
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Good schema is just the starting point. Our one-click AI refinement automatically optimizes your markup based on SEO and AEO best practices while boosting your schema score. No prompts needed: just click and watch your schema level up.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">One-Click Perfection</p>
                    <p className="text-sm text-muted-foreground">AI automatically applies best practices: no manual tweaking required</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Instant Score Boost</p>
                    <p className="text-sm text-muted-foreground">Watch your schema quality grade improve in real-time</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Best Practice Optimization</p>
                    <p className="text-sm text-muted-foreground">AI applies the latest SEO and AEO standards automatically</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="/aeo-schema-refinements.jpg"
                alt="AI Schema Refinement Interface showing one-click optimization"
                className="w-full h-auto rounded-[25px] shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions? We've Got Answers.
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you wanted to know about schema markup (but were too busy to ask)
            </p>
          </div>
          <div className="space-y-6">
            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                Do I really need schema markup? My site seems fine without it.
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                Your site might *look* fine to humans, but search engines see it differently. Schema markup is like giving Google, ChatGPT, and other AI search engines a cheat sheet about your content. Without it, they're just guessing. With it, you're 434% more likely to rank in featured snippets and show up in AI-generated answers. So yeah, you kinda need it.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                Can't I just write the schema myself?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                Sure! You could also hand-code your entire website in binary. But why? Manual schema markup is tedious, error-prone, and takes forever. One missing comma and the whole thing breaks. SuperSchema generates perfect, validated JSON-LD in seconds. Your time is worth more than wrestling with Schema.org documentation at midnight.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                What's the difference between regular SEO and AEO?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                SEO (Search Engine Optimization) helps you rank in traditional search results. AEO (Answer Engine Optimization) helps you show up in AI-generated answers from ChatGPT, Perplexity, Google AI Overviews, and other AI tools. Think of it as future-proofing your SEO. Schema markup is crucial for both, but especially for AEO since AI engines rely heavily on structured data to understand and cite your content.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                How much does it cost?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                We use a credit system. You get 2 free credits when you sign up (no credit card required). After that, credits are super affordable—way cheaper than paying a developer to write schema manually or dealing with broken markup that tanks your SEO. Check out our pricing page for current rates.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                Will this work with my [insert platform here]?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                Yep! SuperSchema generates standard JSON-LD schema markup that works with any website: HubSpot, WordPress, Shopify, Webflow, custom HTML, you name it. If your site loads in a browser, our schema will work with it. Just paste the generated code into your page's &lt;head&gt; section and you're golden.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                Why not just use ChatGPT or another AI tool?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                ChatGPT is great for many things, but schema markup isn't one of them. Here's why: ChatGPT hallucinates, makes up data, and can't actually crawl your website to extract real information. It'll give you generic templates that miss crucial details. SuperSchema actually visits your URL, scrapes your real content, analyzes your page structure, automatically detects the right schema types, validates everything against Schema.org standards, and generates production-ready markup with your actual data. No hallucinations. No guessing. No manual data entry. Just accurate, complete schema that actually works.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                What if I don't know what schema type I need?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                That's the beauty of AI! Just paste your URL and our system automatically detects what type of schema you need: Article, Product, LocalBusiness, Recipe, Event, you name it. No Schema.org PhD required. We analyze your content and structure, then generate the perfect markup for your page.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                Is the generated schema actually valid?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                100%. Every schema we generate is validated against Schema.org standards and Google's requirements. We run it through multiple validation checks before showing it to you. Plus, our system stays updated with the latest schema standards so you don't have to. No broken markup, no validation errors, no stress.
              </p>
            </details>

            <details className="group bg-card border border-border rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold text-lg flex items-center justify-between">
                How quickly will I see results?
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">
                Schema generation? Under 30 seconds. SEO results? That depends on Google and other search engines. Typically, search engines re-crawl and re-index your pages within a few days to weeks. You might see rich snippets appear faster, while ranking improvements can take a bit longer. The important thing: you're giving search engines and AI the data they need to understand and promote your content.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Be Super?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of smart folks using our AEO schema generator to skyrocket their AI search visibility and SEO rankings. No cape required. 🦸
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center px-8 py-3 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors text-lg font-medium"
          >
            Activate Superpowers
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 SuperSchema. Making schema markup super since... well, recently. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            {' • '}
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}