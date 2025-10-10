import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <div className="text-sm text-muted-foreground mb-8">
          <p><strong>Effective Date:</strong> October 1, 2025</p>
          <p><strong>Last Updated:</strong> October 1, 2025</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <p className="text-lg">
            This Privacy Policy explains how <strong>Lightbulb Moment Labs, Inc.</strong> ("Company," "we," "our," or "us") collects, uses, and protects your information when you use <strong>SuperSchema</strong> (the "Service").
          </p>

          <p>
            By using the Service, you agree to the terms of this Privacy Policy.
          </p>

          <hr className="my-8 border-border" />

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">a. Information You Provide:</h3>
            <p>
              When you sign up for an account, we collect information you provide through our authentication provider, <strong>Clerk</strong>, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Profile photo (if enabled)</li>
              <li>Authentication metadata</li>
            </ul>
            <p className="mt-4">
              Clerk handles secure authentication, session management, and password storage. You can review their privacy practices here: <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://clerk.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">b. Usage Data:</h3>
            <p>
              We automatically collect information about how you interact with the Service, such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pages visited</li>
              <li>Schema generation activity</li>
              <li>Browser type and device</li>
              <li>IP address and approximate location</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">c. Cookies and Analytics:</h3>
            <p>
              We may use cookies or similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remember your preferences</li>
              <li>Track usage trends</li>
              <li>Improve website performance</li>
            </ul>
            <p className="mt-4">
              We may use third-party analytics providers (e.g., Google Analytics) to understand how users interact with our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve the Service</li>
              <li>Authenticate and secure your account</li>
              <li>Track credit usage and manage billing</li>
              <li>Communicate with you about updates or support</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Share Information</h2>
            <p>We only share your information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With trusted service providers (e.g., Clerk, hosting, analytics) necessary to operate the Service</li>
              <li>If required by law, subpoena, or legal process</li>
              <li>To investigate fraud, abuse, or violations of our Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Retention</h2>
            <p>
              We retain your information as long as your account is active or as needed to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fulfill the purposes outlined in this policy</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className="mt-4">
              You may request account deletion at any time by contacting <strong>support@superschema.ai</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <p>We take reasonable measures to protect your data, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>SSL encryption</li>
              <li>Secure authentication via Clerk</li>
              <li>Limited employee access to sensitive information</li>
            </ul>
            <p className="mt-4">
              No method of transmission is 100% secure, but we strive to maintain industry-standard safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and update your personal data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent where applicable</li>
            </ul>
            <p className="mt-4">
              To exercise your rights, email <strong>support@superschema.ai</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
            <p>
              The Service is not intended for individuals under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we'll revise the "Last Updated" date above. Significant changes will be communicated via the website or email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at:</p>
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
