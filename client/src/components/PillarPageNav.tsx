import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SuperSchemaLogo from './SuperSchemaLogo'
import ResourcesDropdown from './ResourcesDropdown'

export default function PillarPageNav() {
  const { isSignedIn } = useUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <SuperSchemaLogo className="h-8 w-8" />
          <span className="font-bold text-xl">SuperSchema</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
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

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="flex flex-col space-y-3">
                <Link
                  to="/aeo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  AEO Guide
                </Link>
                <Link
                  to="/geo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  GEO Guide
                </Link>
                <Link
                  to="/ai-search-optimization"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  AI Search Optimization
                </Link>
                <Link
                  to="/schema-markup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  Schema Markup Guide
                </Link>
                <Link
                  to="/schema-markup-grader"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  Schema Markup Grader
                </Link>

                <div className="pt-3 border-t border-border space-y-3">
                  {isSignedIn ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center w-full px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/sign-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center w-full px-4 py-3 rounded-md border border-border hover:bg-accent transition-colors font-medium"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/sign-up"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center w-full px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
