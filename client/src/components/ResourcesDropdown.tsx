import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ChevronDown, BookOpen, Zap, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ResourcesDropdownProps {
  className?: string
}

export default function ResourcesDropdown({ className }: ResourcesDropdownProps) {
  const { isSignedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const learningResources = [
    { name: 'AEO Guide', path: '/aeo', description: 'Answer Engine Optimization complete guide' },
    { name: 'AI Search Optimization', path: '/ai-search-optimization', description: 'Get cited by AI engines (SGE, Copilot, Perplexity)' },
    { name: 'Schema Markup Guide', path: '/schema-markup', description: 'What, why, and how of structured data' }
  ]

  const schemaGenerators = [
    { name: 'FAQ', path: '/faq-schema-generator' },
    { name: 'Article', path: '/article-schema-generator' },
    { name: 'BlogPosting', path: '/blogposting-schema-generator' },
    { name: 'HowTo', path: '/howto-schema-generator' },
    { name: 'Product', path: '/product-schema-generator' },
    { name: 'LocalBusiness', path: '/localbusiness-schema-generator' },
    { name: 'Organization', path: '/organization-schema-generator' },
    { name: 'Event', path: '/event-schema-generator' },
    { name: 'Review', path: '/review-schema-generator' },
    { name: 'Breadcrumb', path: '/breadcrumb-schema-generator' }
  ]

  const freeTools = [
    { name: 'Schema Markup Grader', path: '/schema-markup-grader', description: 'Grade and validate your schema quality', requiresAuth: false }
  ]

  const tools = [
    { name: 'Generate Schema', path: '/generate', icon: Zap },
    { name: 'Schema Markup Grader', path: '/schema-markup-grader', icon: CheckCircle2, requiresAuth: false }
  ]

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Resources
        <ChevronDown className={cn('ml-1 h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[600px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-lg z-50 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Learning Hub */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Learning Hub</h3>
              </div>
              <div className="space-y-2">
                {learningResources.map((resource, index) => (
                  <Link
                    key={index}
                    to={resource.path}
                    onClick={() => setIsOpen(false)}
                    className="block p-2 rounded hover:bg-accent transition-colors group"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {resource.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {resource.description}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Schema Generators */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Free Schema Generators</h3>
              </div>
              <div className="grid grid-cols-2 gap-1 max-h-[300px] overflow-y-auto">
                {schemaGenerators.map((generator, index) => (
                  <Link
                    key={index}
                    to={generator.path}
                    onClick={() => setIsOpen(false)}
                    className="block p-2 rounded hover:bg-accent transition-colors text-sm hover:text-primary"
                  >
                    {generator.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Free Tools Section */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-foreground mb-3">Free Tools</h3>
              <div className="space-y-2">
                {freeTools.map((tool, index) => (
                  <Link
                    key={index}
                    to={tool.path}
                    onClick={() => setIsOpen(false)}
                    className="block p-2 rounded hover:bg-accent transition-colors group"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {tool.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tool.description}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* SuperSchema Tools Section */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool, index) => {
                const Icon = tool.icon
                // If tool doesn't require auth, always use its path. Otherwise, redirect to sign-up if not signed in
                const toolPath = (tool.requiresAuth === false || isSignedIn) ? tool.path : '/sign-up'
                return (
                  <Link
                    key={index}
                    to={toolPath}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">
                      {tool.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
