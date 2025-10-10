import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <SuperSchemaLogo className="h-8 w-8" animate={false} />
              <span className="font-bold text-xl">SuperSchema</span>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'shadow-none border-0 p-[30px]',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-border hover:bg-accent',
                formFieldInput: 'border-border focus:ring-primary',
                footerActionLink: 'text-primary hover:text-primary/80'
              }
            }}
            redirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>

      {/* Right side - Image/Content */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <div className="text-center text-primary-foreground max-w-md p-8">
            <img src="/super-schema-man.png" alt="SuperSchema" className="max-w-[150px] h-auto mx-auto mb-6 opacity-90" />
            <h2 className="text-2xl font-bold mb-4">
              AI-Powered Schema Generation
            </h2>
            <p className="text-lg opacity-90">
              Generate optimized JSON-LD schema markup in seconds with our advanced AI technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}