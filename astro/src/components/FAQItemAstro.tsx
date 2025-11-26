import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'

interface FAQItemAstroProps {
  question: string
  answer: string
  index: number
}

export default function FAQItemAstro({ question, answer, index }: FAQItemAstroProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between group"
      >
        <span className="font-semibold text-lg pr-8 group-hover:text-primary transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
