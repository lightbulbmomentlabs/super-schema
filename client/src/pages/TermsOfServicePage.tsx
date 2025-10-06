import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <div className="text-sm text-muted-foreground mb-8">
          <p><strong>Effective Date:</strong> January 1, 2025</p>
          <p><strong>Last Updated:</strong> January 1, 2025</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <p className="text-lg">
            Welcome to <strong>SuperSchema</strong>, a service provided by <strong>Lightbulb Moment Labs, Inc.</strong> ("Company," "we," "our," or "us").
          </p>

          <p>
            By accessing or using SuperSchema (the "Service"), you ("you," "user," or "Customer") agree to be bound by these Terms of Service ("Terms"). If you do not agree with these Terms, you may not use the Service.
          </p>

          <hr className="my-8 border-border" />

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Eligibility</h2>
            <p>
              You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Account Registration</h2>
            <p>To access certain features of SuperSchema, you must register for an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information;</li>
              <li>Maintain the security of your account credentials;</li>
              <li>Notify us immediately of any unauthorized use or breach of security;</li>
              <li>Be responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Use of the Service</h2>
            <p>
              SuperSchema allows users to generate structured data (JSON-LD schema markup) using AI technology. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for unlawful purposes;</li>
              <li>Interfere with or disrupt the Service or servers;</li>
              <li>Attempt to reverse engineer, decompile, or copy any part of the Service or software;</li>
              <li>Misuse any credit, exploit the system, or engage in abusive behavior;</li>
              <li>Generate excessive requests or abuse rate limits.</li>
            </ul>
            <p className="mt-4">
              We reserve the right to suspend or terminate your account at any time for violations of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Credits and Payments</h2>
            <p>The Service operates on a <strong>credit-based model</strong>:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Each schema generation deducts credits from your account based on the complexity and number of schemas generated;</li>
              <li>New users receive 2 free credits upon registration (no credit card required);</li>
              <li>Credits can be purchased in bundles and do not expire unless otherwise stated;</li>
              <li><strong>All credit purchases are final and non-refundable</strong>, including unused or partially used credits;</li>
              <li>We do not provide refunds or prorated reimbursements for any reason, except where required by law;</li>
              <li>We reserve the right to change credit pricing at any time with notice.</li>
            </ul>
            <p className="mt-4">
              It is your responsibility to review current pricing and available bundles before purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
            <p>
              All content, trademarks, branding, and software associated with SuperSchema are the intellectual property of <strong>Lightbulb Moment Labs, Inc.</strong> or its licensors.
            </p>
            <p className="mt-4">
              You retain ownership of the website content you submit for analysis, but you grant us a limited, non-exclusive license to process that content for the purpose of generating schema markup.
            </p>
            <p className="mt-4">
              The schema markup output is considered <strong>user-generated content</strong>, and you may use it freely on your own websites or client projects without attribution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Disclaimer of Warranties</h2>
            <p>
              SuperSchema is provided "<strong>as is</strong>" and "<strong>as available</strong>" without warranties of any kind, either express or implied, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Warranties of merchantability or fitness for a particular purpose;</li>
              <li>Warranties that the Service will be error-free, uninterrupted, or produce results suitable for SEO or third-party search engine performance;</li>
              <li>Warranties that AI-generated schema will guarantee improved search rankings or visibility.</li>
            </ul>
            <p className="mt-4">
              You use the Service at your own risk. While we validate all generated schema against Schema.org standards, we cannot guarantee specific SEO outcomes or search engine acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Lightbulb Moment Labs, Inc. shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any indirect, incidental, special, consequential, or punitive damages;</li>
              <li>Loss of profits, revenue, data, or use arising from your access to or use of the Service;</li>
              <li>Any damages resulting from search engine penalties, ranking changes, or algorithm updates.</li>
            </ul>
            <p className="mt-4">
              In no event shall our total liability exceed the greater of:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The amount you paid for credits in the 6 months preceding the claim; or</li>
              <li>$100 USD.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
            <p>
              You may stop using the Service at any time. We may terminate or suspend your access to the Service without notice if:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You breach these Terms;</li>
              <li>We suspect fraud or abuse;</li>
              <li>Required by law or business necessity.</li>
            </ul>
            <p className="mt-4">
              Upon termination, any unused credits will be forfeited and are not eligible for refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Modifications to Terms</h2>
            <p>
              We reserve the right to update or modify these Terms at any time. When we do, we'll update the "Last Updated" date above.
            </p>
            <p className="mt-4">
              Your continued use of the Service constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and interpreted under the laws of the State of <strong>Delaware</strong>, without regard to conflict-of-law principles.
            </p>
            <p className="mt-4">
              You agree to resolve any disputes exclusively in the courts located in <strong>New Castle County, Delaware</strong>, unless otherwise required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
            <p>If you have any questions about these Terms, you may contact us at:</p>
            <div className="mt-4 space-y-2">
              <p>📧 <strong>support@superschema.ai</strong></p>
              <p>📬 Lightbulb Moment Labs, Inc.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
