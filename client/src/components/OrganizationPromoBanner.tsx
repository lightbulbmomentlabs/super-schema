import { motion } from 'framer-motion'
import { Building2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function OrganizationPromoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-primary/5 border border-primary/20 rounded-lg p-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            Your schemas are missing their wingman! 🏢
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Set up your Organization once, and we'll auto-fill your publisher info on every schema you generate. Less typing, more generating.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Set Up Organization
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
