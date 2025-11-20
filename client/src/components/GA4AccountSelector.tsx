import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Plus, User } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useState, useRef, useEffect } from 'react'
import type { GA4Connection } from '@/services/ga4'

interface GA4AccountSelectorProps {
  connections: GA4Connection[]
  activeConnection: GA4Connection | null
  onSwitch: (connectionId: string) => void
  onAddAccount?: () => void
  isSwitching?: boolean
  className?: string
}

export default function GA4AccountSelector({
  connections,
  activeConnection,
  onSwitch,
  onAddAccount,
  isSwitching = false,
  className = ''
}: GA4AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
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

  // Don't show selector if no connections
  if (connections.length === 0) {
    return null
  }

  // Don't show selector if only one connection
  if (connections.length === 1 && !onAddAccount) {
    return null
  }

  const handleSwitch = (connectionId: string) => {
    onSwitch(connectionId)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-card border border-border',
          'hover:border-primary/50 hover:shadow-md',
          'transition-all duration-200',
          'flex items-center justify-between gap-3',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'border-primary/50 shadow-md'
        )}
      >
        {/* Active Account Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="inline-flex items-center justify-center rounded-lg p-2 bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate">
              {activeConnection?.googleAccountEmail || 'Select Account'}
            </p>
            <p className="text-xs text-muted-foreground">
              {connections.length} {connections.length === 1 ? 'account' : 'accounts'} connected
            </p>
          </div>
        </div>

        {/* Chevron Icon */}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'bg-card border border-border rounded-xl shadow-xl',
              'overflow-hidden'
            )}
          >
            {/* Connected Accounts */}
            <div className="py-2">
              {connections.map((connection) => {
                const isActive = connection.id === activeConnection?.id

                return (
                  <button
                    key={connection.id}
                    onClick={() => handleSwitch(connection.id)}
                    disabled={isActive || isSwitching}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between gap-3',
                      'hover:bg-muted/30 transition-colors duration-150',
                      'disabled:cursor-default',
                      isActive && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          'inline-flex items-center justify-center rounded-lg p-2',
                          isActive ? 'bg-primary/10' : 'bg-muted/20'
                        )}
                      >
                        <User
                          className={cn(
                            'h-4 w-4',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {connection.googleAccountEmail || 'Unknown Account'}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Connected {new Date(connection.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Add Account Button */}
            {onAddAccount && (
              <>
                <div className="border-t border-border/50" />
                <div className="py-2">
                  <button
                    onClick={() => {
                      onAddAccount()
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full px-4 py-3 flex items-center gap-3',
                      'hover:bg-muted/30 transition-colors duration-150',
                      'text-primary'
                    )}
                  >
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-primary/10">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Add Another Account</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
