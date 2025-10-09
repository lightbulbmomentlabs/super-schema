import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Book, Zap, Compass, Library, Award, CreditCard, Code, HelpCircle, CheckCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import Footer from '@/components/Footer'

interface DocSection {
  id: string
  title: string
  icon: any
  content: React.ReactNode
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))

  useEffect(() => {
    document.title = 'Super Schema | Documentation'
  }, [])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Welcome to SuperSchema</h3>
            <p className="text-muted-foreground mb-4">
              SuperSchema is an AI-powered tool that automatically generates schema markup (JSON-LD) for your website.
              Schema markup helps search engines and AI tools like ChatGPT, Perplexity, and Google AI Overviews better
              understand your content, leading to better rankings and visibility.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Quick Start Guide</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Sign up for a free account (you'll get 2 free credits to start)</li>
              <li>Go to the Generate page</li>
              <li>Paste a URL or use URL Discovery to crawl your website</li>
              <li>Click "Generate Schema" and watch the AI work its magic</li>
              <li>Copy the generated JSON-LD code and add it to your website's &lt;head&gt; section</li>
            </ol>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info-foreground">
              <strong>💡 Pro Tip:</strong> Start with your most important pages (homepage, product pages, blog posts)
              to see the biggest impact on your search visibility.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'url-discovery',
      title: 'URL Discovery',
      icon: Compass,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">What is URL Discovery?</h3>
            <p className="text-muted-foreground mb-4">
              URL Discovery is our website crawler that automatically finds all the pages on your website.
              Instead of manually entering URLs one by one, just drop in your domain and let us do the heavy lifting.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">How to Use URL Discovery</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the Generate page</li>
              <li>Find the "URL Discovery" section at the top</li>
              <li>Enter your domain (e.g., example.com)</li>
              <li>Click "Discover URLs"</li>
              <li>Wait while our crawler finds all your pages (usually takes 10-30 seconds)</li>
              <li>All discovered URLs are automatically saved to your Library</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What Gets Discovered?</h4>
            <p className="text-muted-foreground mb-2">Our crawler finds:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>All pages linked from your homepage</li>
              <li>Blog posts and articles</li>
              <li>Product pages</li>
              <li>Category and archive pages</li>
              <li>Static pages (about, contact, etc.)</li>
            </ul>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <p className="text-sm text-warning-foreground">
              <strong>⚠️ Note:</strong> URL Discovery finds pages that are publicly accessible and linked from other pages.
              It won't find pages that require login or aren't linked anywhere.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'schema-generation',
      title: 'Schema Generation',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">How Schema Generation Works</h3>
            <p className="text-muted-foreground mb-4">
              SuperSchema uses AI to analyze your webpage and automatically generate the correct schema markup.
              No manual data entry, no Schema.org documentation hunting—just paste a URL and go.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Generating Your First Schema</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Navigate to the Generate page</li>
              <li>Enter a URL in the "URL to Generate Schema" field</li>
              <li>Click "Generate Schema"</li>
              <li>The AI will analyze your page (takes 5-15 seconds)</li>
              <li>Review the generated schema in the editor</li>
              <li>Copy the HTML script tags or push directly to HubSpot</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Supported Schema Types</h4>
            <p className="text-muted-foreground mb-2">SuperSchema automatically detects and generates:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li><strong>Article:</strong> Blog posts, news articles, guides</li>
              <li><strong>BlogPosting:</strong> Blog posts specifically</li>
              <li><strong>Product:</strong> E-commerce products with prices, reviews</li>
              <li><strong>LocalBusiness:</strong> Physical businesses with locations</li>
              <li><strong>Organization:</strong> Company information</li>
              <li><strong>Person:</strong> Author bios, team member pages</li>
              <li><strong>Event:</strong> Conferences, webinars, meetups</li>
              <li><strong>Recipe:</strong> Food recipes with ingredients and instructions</li>
              <li><strong>FAQPage:</strong> FAQ sections</li>
              <li><strong>HowTo:</strong> Step-by-step guides</li>
              <li><strong>WebPage:</strong> Generic web pages</li>
              <li>...and more!</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What the AI Extracts</h4>
            <p className="text-muted-foreground mb-2">SuperSchema automatically pulls:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Titles, headings, and content</li>
              <li>Author information</li>
              <li>Publication dates</li>
              <li>Images and media</li>
              <li>Product prices and availability</li>
              <li>Ratings and reviews</li>
              <li>Business hours and contact info</li>
              <li>Event dates and locations</li>
            </ul>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info-foreground">
              <strong>💡 Accuracy:</strong> Our AI reads your actual page content, so the schema is based on real data—not
              generic templates or hallucinations like you'd get from ChatGPT.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'quality-refinement',
      title: 'Schema Quality & Refinement',
      icon: Award,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Understanding Quality Scores</h3>
            <p className="text-muted-foreground mb-4">
              Every schema gets a quality score from 0-100 based on completeness, accuracy, and best practices.
              Higher scores mean better chances of rich snippets and AI citations.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Quality Score Breakdown</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="px-3 py-1 bg-success/20 text-success-foreground rounded font-semibold text-sm">90-100</div>
                <div>
                  <p className="font-medium">Excellent</p>
                  <p className="text-sm text-muted-foreground">Complete, optimized schema with all recommended properties</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="px-3 py-1 bg-info/20 text-info-foreground rounded font-semibold text-sm">70-89</div>
                <div>
                  <p className="font-medium">Good</p>
                  <p className="text-sm text-muted-foreground">Solid schema with most important properties present</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="px-3 py-1 bg-warning/20 text-warning-foreground rounded font-semibold text-sm">50-69</div>
                <div>
                  <p className="font-medium">Fair</p>
                  <p className="text-sm text-muted-foreground">Basic schema, missing some recommended properties</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="px-3 py-1 bg-destructive/20 text-destructive-foreground rounded font-semibold text-sm">0-49</div>
                <div>
                  <p className="font-medium">Needs Work</p>
                  <p className="text-sm text-muted-foreground">Minimal schema, consider using AI refinement</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">AI Refinement</h4>
            <p className="text-muted-foreground mb-3">
              Use AI refinement to automatically improve your schema quality score. The AI analyzes your schema
              and adds missing properties, fixes issues, and optimizes for search engines.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Refinement Limits:</strong> You can refine each schema up to 2 times</p>
              <p><strong>Cost:</strong> Each refinement costs 1 credit (same as generation)</p>
              <p><strong>Results:</strong> Average quality score improvement of 15-25 points</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">How to Use Refinement</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Generate or view a schema from your Library</li>
              <li>Check the quality score in the "Schema Quality" section</li>
              <li>Click "Refine with AI" button (shows remaining refinements)</li>
              <li>Wait 10-20 seconds for the AI to optimize your schema</li>
              <li>Review the changes highlighted in the results</li>
              <li>Check the improved quality score</li>
            </ol>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info-foreground">
              <strong>💡 When to Refine:</strong> Refine schemas with scores below 80, or when you need that extra
              edge for competitive keywords and AI citations.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'library-management',
      title: 'Library Management',
      icon: Library,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Your Schema Library</h3>
            <p className="text-muted-foreground mb-4">
              The Library is your central hub for managing all URLs and their schemas. Every URL you discover
              or generate schema for is automatically saved here.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Library Features</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5 flex-shrink-0" />
                <span><strong>Organize by Domain:</strong> URLs are automatically grouped by domain</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5 flex-shrink-0" />
                <span><strong>Filter by Schema Status:</strong> View all URLs, only those with schema, or those needing schema</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5 flex-shrink-0" />
                <span><strong>Search:</strong> Quickly find URLs by searching paths or domains</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5 flex-shrink-0" />
                <span><strong>Hide/Unhide URLs:</strong> Keep your library clean by hiding URLs you don't need</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5 flex-shrink-0" />
                <span><strong>Bulk Delete:</strong> Select multiple URLs and delete them at once</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5 flex-shrink-0" />
                <span><strong>Live Editor:</strong> View and edit schema directly from the Library</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Library Workflow</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Discover URLs or generate schema for individual pages</li>
              <li>Review URLs in your Library (filter by "Needs Schema")</li>
              <li>Click on URLs without schema to quickly generate from the Library</li>
              <li>Edit and refine schemas as needed</li>
              <li>Push to HubSpot or copy code for manual implementation</li>
              <li>Hide or delete URLs you no longer need</li>
            </ol>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info-foreground">
              <strong>💡 Tip:</strong> Use the Library filters to track your schema coverage. The "Has Schema"
              vs "Needs Schema" tabs show exactly which pages still need attention.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'hubspot-integration',
      title: 'HubSpot Integration',
      icon: ExternalLink,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Push Schema to HubSpot</h3>
            <p className="text-muted-foreground mb-4">
              Connect your HubSpot account to automatically push schema markup directly to your HubSpot blog posts,
              pages, and landing pages. No manual copy-paste required.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Connecting HubSpot</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the HubSpot page in SuperSchema</li>
              <li>Click "Connect HubSpot Account"</li>
              <li>Log in to your HubSpot account and authorize SuperSchema</li>
              <li>You'll be redirected back to SuperSchema with your portal connected</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Domain Association</h4>
            <p className="text-muted-foreground mb-3">
              If you have multiple HubSpot portals, associate domains with each portal for automatic selection:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the HubSpot page</li>
              <li>Find your connected portal</li>
              <li>In the "Associated Domains" section, click "Add Domain"</li>
              <li>Enter the domain that's hosted in this HubSpot portal</li>
              <li>Click "Add"</li>
            </ol>
            <p className="text-muted-foreground mt-3">
              Now when you push schema for a URL from that domain, SuperSchema will automatically select the
              correct HubSpot portal.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Pushing Schema to HubSpot</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Generate schema for a URL (or open it from your Library)</li>
              <li>Click "Push to HubSpot" button</li>
              <li>Select the matching HubSpot content (blog post, page, or landing page)</li>
              <li>Click "Push Schema"</li>
              <li>Schema is automatically added to your page's head HTML</li>
            </ol>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <p className="text-sm text-warning-foreground">
              <strong>⚠️ Requirements:</strong> HubSpot integration requires Marketing Hub Professional/Enterprise
              or CMS Hub Professional/Enterprise.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Troubleshooting</h4>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm">Getting "Domain Not Associated" warning?</p>
                <p className="text-sm text-muted-foreground">
                  This means you have multiple HubSpot portals and haven't associated domains yet. Follow the
                  Domain Association steps above, or click "Go to HubSpot Settings" in the modal.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Can't find my HubSpot page?</p>
                <p className="text-sm text-muted-foreground">
                  Make sure the URL domain matches your HubSpot domain. The content matcher searches by URL,
                  so the domains must match exactly.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Connection showing as "Inactive"?</p>
                <p className="text-sm text-muted-foreground">
                  Click "Validate" to refresh the connection. If it stays inactive, you may need to reconnect
                  your HubSpot account.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'credits-billing',
      title: 'Credits & Billing',
      icon: CreditCard,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">How Credits Work</h3>
            <p className="text-muted-foreground mb-4">
              SuperSchema uses a credit-based system. Each action that uses AI (like generating or refining schema)
              costs 1 credit. No subscriptions, no monthly fees—just pay for what you use.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What Costs Credits?</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center space-x-2">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">1 credit</span>
                <span>Generating schema for a URL</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What's FREE?</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
                <span>URL Discovery (crawling your website)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
                <span>Saving URLs to your Library</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
                <span>Editing schema manually</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
                <span>Viewing and managing your Library</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
                <span>2 free AI refinements per schema (improves quality automatically)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
                <span>Pushing schema to HubSpot</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
                <span>Copying schema code</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Free Credits</h4>
            <p className="text-muted-foreground mb-2">
              New users get 2 free credits when they sign up. No credit card required.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Purchasing Credits</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the Credits page</li>
              <li>Click "Purchase Credits"</li>
              <li>Choose a credit pack (larger packs = better value)</li>
              <li>Complete checkout with Stripe</li>
              <li>Credits are added instantly</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Checking Your Balance</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>View your credit balance on the Dashboard</li>
              <li>See detailed transaction history on the Credits page</li>
              <li>Get low balance warnings when you have less than 5 credits</li>
            </ul>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info-foreground">
              <strong>💡 Value:</strong> Credits never expire, and you only pay for AI-powered features. Manual
              editing and organization are completely free.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'implementation',
      title: 'Schema Implementation',
      icon: Code,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Adding Schema to Your Website</h3>
            <p className="text-muted-foreground mb-4">
              Once you've generated schema, you need to add it to your website. SuperSchema generates JSON-LD
              format, which is the easiest and most recommended method by Google.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">HubSpot (Automatic)</h4>
            <p className="text-muted-foreground mb-2">
              If you use HubSpot, use our integration to push schema automatically:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
              <li>Connect your HubSpot account</li>
              <li>Generate schema</li>
              <li>Click "Push to HubSpot"</li>
              <li>Done! Schema is added to your page's head</li>
            </ol>
            <div className="mt-3 bg-info/10 border border-info/20 rounded-lg p-3">
              <p className="text-sm text-info-foreground">
                <strong>Note:</strong> HubSpot integration is currently in beta and available to select users. Stay tuned for general availability!
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">WordPress</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Copy the schema script tags from SuperSchema</li>
              <li>Install a plugin like "Insert Headers and Footers" or "Code Snippets"</li>
              <li>Paste the schema in the "Head" section for that specific page</li>
              <li>Save and publish</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Shopify</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Copy the schema script tags</li>
              <li>Go to your Shopify admin → Online Store → Themes</li>
              <li>Click "Actions" → "Edit code"</li>
              <li>Find your page template (e.g., product.liquid, article.liquid)</li>
              <li>Paste the schema before the closing &lt;/head&gt; tag</li>
              <li>Save the file</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Webflow</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Copy the schema script tags</li>
              <li>In Webflow, go to your page settings</li>
              <li>Scroll to "Custom Code" section</li>
              <li>Paste the schema in "Head Code"</li>
              <li>Save and publish</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Custom HTML / Other Platforms</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Copy the complete schema script tags from SuperSchema</li>
              <li>Open your HTML file or page template</li>
              <li>Paste the schema inside the &lt;head&gt; section, before the closing &lt;/head&gt; tag</li>
              <li>Save and deploy your changes</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Verify Your Schema</h4>
            <p className="text-muted-foreground mb-2">After adding schema to your site:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
              <li>Go to Google's Rich Results Test: <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">search.google.com/test/rich-results</a></li>
              <li>Enter your page URL</li>
              <li>Click "Test URL"</li>
              <li>Check for any errors or warnings</li>
              <li>If valid, you're all set!</li>
            </ol>
          </div>

          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <p className="text-sm text-success-foreground">
              <strong>✅ Best Practice:</strong> Always test your schema after adding it to your site. Google's
              Rich Results Test will catch any formatting issues and show you exactly what search engines see.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: HelpCircle,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Why isn't my schema showing up in search results?</h4>
            <p className="text-sm text-muted-foreground">
              Schema doesn't guarantee rich snippets—it just makes them possible. Google needs to: (1) crawl and
              index your page, (2) validate your schema, and (3) decide your content deserves a rich snippet.
              This can take days or weeks. Keep your schema valid, content high-quality, and be patient.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Can I edit the schema after generating it?</h4>
            <p className="text-sm text-muted-foreground">
              Absolutely! The schema editor lets you manually edit any field. Just be careful not to break the
              JSON structure. If you mess up, you can always regenerate or use AI refinement.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What if I run out of credits?</h4>
            <p className="text-sm text-muted-foreground">
              You can still access all your existing schemas, edit them manually, and manage your Library. You just
              won't be able to generate new schemas or use AI refinement until you purchase more credits.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Do credits expire?</h4>
            <p className="text-sm text-muted-foreground">
              Nope! Credits never expire. Buy them whenever you need them, use them whenever you want.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Can I get a refund?</h4>
            <p className="text-sm text-muted-foreground">
              Credit purchases are non-refundable, but we're confident you'll love the results. Start with the
              2 free credits to test it out before purchasing.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Is my data secure?</h4>
            <p className="text-sm text-muted-foreground">
              Yes. We use industry-standard encryption for all data. Your HubSpot tokens are encrypted at rest,
              and we never store your payment information (handled by Stripe).
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Can I cancel my account?</h4>
            <p className="text-sm text-muted-foreground">
              There's no subscription to cancel. Just stop using SuperSchema whenever you want. Any unused credits
              will remain in your account if you decide to come back.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Does SuperSchema work for e-commerce?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! SuperSchema automatically detects Product schema for e-commerce pages, including price, availability,
              reviews, and ratings. Works with Shopify, WooCommerce, and any other platform.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What's the difference between SuperSchema and other schema tools?</h4>
            <p className="text-sm text-muted-foreground">
              Most schema tools give you generic templates that require manual data entry. SuperSchema actually
              visits your URL, reads your real content, and generates complete, accurate schema automatically.
              Plus, we have quality scoring, AI refinement, and HubSpot integration built in.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Can I use SuperSchema for client work?</h4>
            <p className="text-sm text-muted-foreground">
              Absolutely! Agencies and freelancers use SuperSchema to quickly generate schema for client sites.
              Just generate the schema and add it to your client's website—no special license needed.
            </p>
          </div>
        </div>
      )
    }
  ]

  // Filter sections based on search query
  const filteredSections = sections.filter(section => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      section.title.toLowerCase().includes(query) ||
      section.content.toString().toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <SuperSchemaLogo className="h-8 w-8" />
            <span className="font-bold text-xl">SuperSchema</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about using SuperSchema
            </p>
          </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-4">
          {filteredSections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSections.has(section.id)

            return (
              <div key={section.id} className="border border-border rounded-lg overflow-hidden bg-card">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-left">{section.title}</h2>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 py-6 border-t border-border">
                    {section.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try a different search term or browse all sections above
            </p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 p-6 bg-info/10 border border-info/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <button
            onClick={() => {
              // Trigger the existing support modal
              const supportButton = document.querySelector('footer button') as HTMLButtonElement
              if (supportButton) supportButton.click()
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>

    {/* Footer */}
    <Footer />
  </div>
  )
}
