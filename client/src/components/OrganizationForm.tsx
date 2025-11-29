import { useState, useEffect } from 'react'
import {
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  Globe,
  Phone,
  MapPin,
  Link2,
  Plus,
  Loader2
} from 'lucide-react'
import type { Organization, CreateOrganizationRequest, OrganizationAddress } from '@shared/types'
import { cn } from '@/utils/cn'

interface OrganizationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateOrganizationRequest) => Promise<void>
  organization?: Organization | null
  isLoading?: boolean
}

type FormSection = 'basic' | 'address' | 'contact' | 'social' | 'domains'

export default function OrganizationForm({
  isOpen,
  onClose,
  onSubmit,
  organization,
  isLoading = false
}: OrganizationFormProps) {
  const isEdit = !!organization

  // Form state
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [addressLocality, setAddressLocality] = useState('')
  const [addressRegion, setAddressRegion] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [addressCountry, setAddressCountry] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [sameAs, setSameAs] = useState<string[]>([])
  const [associatedDomains, setAssociatedDomains] = useState<string[]>([])
  const [isDefault, setIsDefault] = useState(false)

  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<FormSection>>(new Set(['basic']))
  const [newSocialUrl, setNewSocialUrl] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoPreviewError, setLogoPreviewError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Fix #35: double-submit prevention

  // Effect 1: Populate form when organization changes (edit mode)
  useEffect(() => {
    if (organization) {
      setName(organization.name || '')
      setUrl(organization.url || '')
      setLogoUrl(organization.logoUrl || '')
      setStreetAddress(organization.address?.streetAddress || '')
      setAddressLocality(organization.address?.addressLocality || '')
      setAddressRegion(organization.address?.addressRegion || '')
      setPostalCode(organization.address?.postalCode || '')
      setAddressCountry(organization.address?.addressCountry || '')
      setTelephone(organization.telephone || '')
      setEmail(organization.email || '')
      setSameAs(organization.sameAs || [])
      setAssociatedDomains(organization.associatedDomains || [])
      setIsDefault(organization.isDefault || false)
      // Expand sections that have data
      const sections = new Set<FormSection>(['basic'])
      if (organization.address?.streetAddress || organization.address?.addressLocality) {
        sections.add('address')
      }
      if (organization.telephone || organization.email) {
        sections.add('contact')
      }
      if (organization.sameAs && organization.sameAs.length > 0) {
        sections.add('social')
      }
      if (organization.associatedDomains && organization.associatedDomains.length > 0) {
        sections.add('domains')
      }
      setExpandedSections(sections)
    } else {
      // Reset form for new organization
      setName('')
      setUrl('')
      setLogoUrl('')
      setStreetAddress('')
      setAddressLocality('')
      setAddressRegion('')
      setPostalCode('')
      setAddressCountry('')
      setTelephone('')
      setEmail('')
      setSameAs([])
      setAssociatedDomains([])
      setIsDefault(false)
      setExpandedSections(new Set(['basic']))
    }
  }, [organization])

  // Effect 2: Clear errors when form opens (separate concern)
  useEffect(() => {
    if (isOpen) {
      setErrors({})
    }
  }, [isOpen])

  const toggleSection = (section: FormSection) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const addSocialUrl = () => {
    const trimmed = newSocialUrl.trim()
    if (trimmed && !sameAs.includes(trimmed)) {
      setSameAs([...sameAs, trimmed])
      setNewSocialUrl('')
    }
  }

  const removeSocialUrl = (urlToRemove: string) => {
    setSameAs(sameAs.filter(u => u !== urlToRemove))
  }

  /**
   * Normalize domain input - handles URLs, www prefixes, ports, and paths
   */
  const normalizeDomain = (input: string): string => {
    let domain = input.trim().toLowerCase()

    // Try to parse as URL first to extract hostname properly
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`
      const parsed = new URL(url)
      domain = parsed.hostname
    } catch {
      // Not a valid URL, continue with string processing
    }

    // Remove www. prefix
    domain = domain.replace(/^www\./, '')

    // Remove any trailing slashes or paths
    domain = domain.split('/')[0]

    // Remove port if present (unless it's a wildcard domain)
    if (!domain.startsWith('*.')) {
      domain = domain.split(':')[0]
    }

    return domain
  }

  const addDomain = () => {
    const normalized = normalizeDomain(newDomain)
    if (normalized && !associatedDomains.includes(normalized)) {
      setAssociatedDomains([...associatedDomains, normalized])
      setNewDomain('')
    }
  }

  const removeDomain = (domainToRemove: string) => {
    setAssociatedDomains(associatedDomains.filter(d => d !== domainToRemove))
  }

  /**
   * Validate URL using URL constructor for robust validation
   */
  const isValidUrl = (urlString: string): boolean => {
    try {
      const parsed = new URL(urlString)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Organization name is required'
    } else if (name.trim().length > 200) {
      newErrors.name = 'Organization name must be 200 characters or less'
    }

    // Email validation with length check
    if (email) {
      if (email.length > 254) {
        newErrors.email = 'Email address is too long'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // URL validation using URL constructor
    if (url) {
      if (!isValidUrl(url)) {
        newErrors.url = 'Please enter a valid URL (must start with http:// or https://)'
      }
    }

    // Logo URL validation
    if (logoUrl) {
      if (!isValidUrl(logoUrl)) {
        newErrors.logoUrl = 'Please enter a valid logo URL (must start with http:// or https://)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Fix #35: Prevent double-submit
    if (isSubmitting || isLoading) return

    if (!validate()) return

    const address: OrganizationAddress | undefined =
      streetAddress || addressLocality || addressRegion || postalCode || addressCountry
        ? {
            streetAddress: streetAddress || undefined,
            addressLocality: addressLocality || undefined,
            addressRegion: addressRegion || undefined,
            postalCode: postalCode || undefined,
            addressCountry: addressCountry || undefined
          }
        : undefined

    const data: CreateOrganizationRequest = {
      name: name.trim(),
      url: url.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      address,
      telephone: telephone.trim() || undefined,
      email: email.trim() || undefined,
      // Always send arrays for update operations so backend knows to update them
      // For create, empty arrays are fine (backend defaults to [])
      sameAs: sameAs,
      associatedDomains: associatedDomains,
      isDefault
    }

    // Fix #35: Set submitting state to prevent double-submit
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const SectionHeader = ({ section, title, icon: Icon }: { section: FormSection; title: string; icon: typeof Building2 }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 border-b border-border text-left"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      {expandedSections.has(section) ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-semibold">
              {isEdit ? 'Edit Organization' : 'Add Organization'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {/* Basic Info Section - Always Expanded */}
              <div className="mb-2">
                <SectionHeader section="basic" title="Basic Information" icon={Building2} />
                {expandedSections.has('basic') && (
                  <div className="py-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Organization Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Super Corp"
                        maxLength={200}
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary",
                          errors.name ? "border-destructive" : "border-input"
                        )}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://acme.com"
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary",
                          errors.url ? "border-destructive" : "border-input"
                        )}
                      />
                      {errors.url && (
                        <p className="text-xs text-destructive mt-1">{errors.url}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value)
                          setLogoPreviewError(false)
                        }}
                        placeholder="https://acme.com/logo.png"
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary",
                          errors.logoUrl ? "border-destructive" : "border-input"
                        )}
                      />
                      {errors.logoUrl && (
                        <p className="text-xs text-destructive mt-1">{errors.logoUrl}</p>
                      )}
                      {logoUrl && isValidUrl(logoUrl) && (
                        <div className="mt-2">
                          {!logoPreviewError ? (
                            <img
                              src={logoUrl}
                              alt="Logo preview"
                              className="h-12 w-12 object-contain rounded border border-border"
                              onError={() => setLogoPreviewError(true)}
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground">Unable to load image preview</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Address Section */}
              <div className="mb-2">
                <SectionHeader section="address" title="Address" icon={MapPin} />
                {expandedSections.has('address') && (
                  <div className="py-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="123 Main Street"
                        maxLength={500}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={addressLocality}
                          onChange={(e) => setAddressLocality(e.target.value)}
                          placeholder="Austin"
                          maxLength={100}
                          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={addressRegion}
                          onChange={(e) => setAddressRegion(e.target.value)}
                          placeholder="TX"
                          maxLength={100}
                          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="78701"
                          maxLength={20}
                          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={addressCountry}
                          onChange={(e) => setAddressCountry(e.target.value)}
                          placeholder="US"
                          maxLength={100}
                          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Section */}
              <div className="mb-2">
                <SectionHeader section="contact" title="Contact Information" icon={Phone} />
                {expandedSections.has('contact') && (
                  <div className="py-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        maxLength={30}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@acme.com"
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary",
                          errors.email ? "border-destructive" : "border-input"
                        )}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Social Profiles Section */}
              <div className="mb-2">
                <SectionHeader section="social" title="Social Profiles" icon={Link2} />
                {expandedSections.has('social') && (
                  <div className="py-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Add links to your social media profiles (LinkedIn, Twitter, Facebook, etc.)
                    </p>

                    {sameAs.length > 0 && (
                      <div className="space-y-2">
                        {sameAs.map((socialUrl) => (
                          <div
                            key={socialUrl}
                            className="flex items-center justify-between bg-muted/30 border border-border rounded-md px-3 py-2"
                          >
                            <span className="text-sm truncate flex-1 mr-2">{socialUrl}</span>
                            <button
                              type="button"
                              onClick={() => removeSocialUrl(socialUrl)}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSocialUrl()
                          }
                        }}
                        placeholder="https://linkedin.com/company/acme"
                        className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={addSocialUrl}
                        className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Associated Domains Section */}
              <div className="mb-2">
                <SectionHeader section="domains" title="Associated Domains" icon={Globe} />
                {expandedSections.has('domains') && (
                  <div className="py-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Schemas generated for these domains will automatically use this organization as the publisher.
                    </p>

                    {associatedDomains.length > 0 && (
                      <div className="space-y-2">
                        {associatedDomains.map((domain) => (
                          <div
                            key={domain}
                            className="flex items-center justify-between bg-muted/30 border border-border rounded-md px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-mono">{domain}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDomain(domain)}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addDomain()
                          }
                        }}
                        placeholder="example.com"
                        className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={addDomain}
                        className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Default Organization Checkbox */}
              <div className="py-3 border-t border-border mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">Set as default organization</span>
                    <p className="text-xs text-muted-foreground">
                      Used when no specific domain match is found
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-4 py-4 border-t border-border bg-muted/20 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading || isSubmitting}
                className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {(isLoading || isSubmitting) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
