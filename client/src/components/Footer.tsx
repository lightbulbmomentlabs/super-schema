import { useState } from 'react'
import { Link } from 'react-router-dom'
import SupportModal from './SupportModal'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [showSupportModal, setShowSupportModal] = useState(false)

  return (
    <>
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Super Schema. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/docs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Help
              </Link>
              <button
                onClick={() => setShowSupportModal(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Support
              </button>
              <Link
                to="/tips"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Tips & Tricks
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </>
  )
}
