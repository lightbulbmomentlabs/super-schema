import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SuperSchemaLogo from './SuperSchemaLogo'

export default function SchemaGeneratorNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <SuperSchemaLogo className="h-8 w-8" />
          <span className="font-bold text-xl">SuperSchema</span>
        </Link>

        {/* Desktop - Simple CTA */}
        <Link
          to="/sign-up"
          className="hidden md:inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Try SuperSchema
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>

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
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link
                to="/aeo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                AEO Guide
              </Link>
              <Link
                to="/geo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                GEO Guide
              </Link>
              <Link
                to="/ai-search-optimization"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                AI Search Optimization
              </Link>
              <Link
                to="/schema-markup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                Schema Markup Guide
              </Link>
              <Link
                to="/schema-markup-grader"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                Schema Markup Grader
              </Link>

              <div className="pt-3 border-t border-border">
                <Link
                  to="/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center w-full px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  Try SuperSchema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
