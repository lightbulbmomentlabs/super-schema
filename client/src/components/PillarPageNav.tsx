import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowRight } from 'lucide-react'
import SuperSchemaLogo from './SuperSchemaLogo'
import ResourcesDropdown from './ResourcesDropdown'

export default function PillarPageNav() {
  const { isSignedIn } = useUser()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <SuperSchemaLogo className="h-8 w-8" />
          <span className="font-bold text-xl">SuperSchema</span>
        </Link>
        <div className="flex items-center space-x-6">
          <ResourcesDropdown />
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
  )
}
