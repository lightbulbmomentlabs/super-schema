import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Settings,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import LightningBoltIcon from './icons/LightningBoltIcon'
import SchemaEditor from './SchemaEditor'
import SchemaScore from './SchemaScore'
import RichResultsPreview from './RichResultsPreview'
import LowCreditWarning from './LowCreditWarning'
import DuplicateUrlModal from './DuplicateUrlModal'
import { apiService } from '@/services/api'
import { cn } from '@/utils/cn'
import { MAX_REFINEMENTS } from '@shared/config/refinement'
import type { JsonLdSchema, SchemaScore as SchemaScoreType } from '@shared/types'

interface SchemaGeneratorProps {
  selectedUrl?: string
  autoGenerate?: boolean
}

interface GenerationOptions {
  includeImages: boolean
  includeVideos: boolean
  includeProducts: boolean
  includeEvents: boolean
  includeArticles: boolean
  includeOrganization: boolean
  includeLocalBusiness: boolean
}

const SCHEMA_TYPES = [
  { value: 'Article', label: 'Article', description: 'Blog posts, news articles, and editorial content' },
  { value: 'BlogPosting', label: 'Blog Post', description: 'Specific type of article for blog content' },
  { value: 'NewsArticle', label: 'News Article', description: 'News stories and press releases' },
  { value: 'FAQPage', label: 'FAQ Page', description: 'Frequently asked questions and answers' },
  { value: 'HowTo', label: 'How-To Guide', description: 'Step-by-step instructional content' },
  { value: 'LocalBusiness', label: 'Local Business', description: 'Physical business location information' },
  { value: 'Organization', label: 'Organization', description: 'Company, brand, or organization details' },
  { value: 'Product', label: 'Product', description: 'Product listings with price and availability' },
  { value: 'QAPage', label: 'Q&A Page', description: 'Single question and answer pairs' },
  { value: 'Review', label: 'Review', description: 'Customer reviews and ratings' },
  { value: 'WebPage', label: 'Web Page', description: 'Basic page structure and metadata' },
  { value: 'BreadcrumbList', label: 'Breadcrumbs', description: 'Site navigation breadcrumbs' },
  { value: 'ImageObject', label: 'Images', description: 'Featured images and media' },
  { value: 'VideoObject', label: 'Videos', description: 'Video content and metadata' }
] as const

const defaultOptions: GenerationOptions = {
  includeImages: true,
  includeVideos: true,
  includeProducts: true,
  includeEvents: true,
  includeArticles: true,
  includeOrganization: true,
  includeLocalBusiness: true
}

export default function SchemaGenerator({ selectedUrl, autoGenerate = false }: SchemaGeneratorProps = {}) {
  // Use real Clerk user
  const { user } = useUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [options, setOptions] = useState<GenerationOptions>(defaultOptions)
  const [showOptions, setShowOptions] = useState(false)
  const [selectedSchemaType, setSelectedSchemaType] = useState<string>('Article')
  const [showSchemaSelector, setShowSchemaSelector] = useState(false)
  const [generatedSchemas, setGeneratedSchemas] = useState<JsonLdSchema[]>([])
  const [htmlScriptTags, setHtmlScriptTags] = useState<string>('')
  const [generationMetadata, setGenerationMetadata] = useState<any>(null)
  const [schemaScore, setSchemaScore] = useState<SchemaScoreType | null>(null)
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined)
  const [refinementCount, setRefinementCount] = useState(0)
  const [isRefining, setIsRefining] = useState(false)
  const [highlightedChanges, setHighlightedChanges] = useState<string[]>([])
  const urlInputRef = useRef<HTMLInputElement>(null)

  // Duplicate URL modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateUrlData, setDuplicateUrlData] = useState<{
    url: string
    urlId?: string
    createdAt?: string
  } | null>(null)

  // Get user credits
  const { data: creditsData, refetch: refetchCredits } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Handle selectedUrl prop from URL Discovery or Library quick generate
  useEffect(() => {
    if (selectedUrl) {
      setUrl(selectedUrl)

      // Only trigger generation automatically if autoGenerate is true
      if (autoGenerate) {
        // Add a small delay to ensure credits are loaded
        const checkCreditsAndGenerate = async () => {
          const creditBalance = creditsData?.data?.creditBalance || 0
          if (creditBalance >= 1) {
            // Check if URL already exists with schema
            try {
              const checkResult = await apiService.checkUrlExists(selectedUrl)
              if (checkResult.success && checkResult.data.exists && checkResult.data.hasSchema) {
                // Show duplicate URL modal
                setDuplicateUrlData({
                  url: selectedUrl,
                  urlId: checkResult.data.urlId,
                  createdAt: checkResult.data.createdAt
                })
                setShowDuplicateModal(true)
                return
              }
            } catch (error) {
              console.error('Error checking URL existence:', error)
              // Continue with generation if check fails
            }

            generateMutation.mutate({
              url: selectedUrl,
              options: {
                ...options,
                requestedSchemaTypes: [selectedSchemaType]
              }
            })
          } else if (creditsData) {
            // Only show error if credits data is loaded
            toast.error('Insufficient credits. Please purchase more credits to continue.')
          }
        }

        // If credits aren't loaded yet, wait a bit
        if (!creditsData) {
          setTimeout(checkCreditsAndGenerate, 200)
        } else {
          checkCreditsAndGenerate()
        }
      }
    }
  }, [selectedUrl, autoGenerate, creditsData])

  // Schema generation mutation
  const generateMutation = useMutation({
    mutationFn: ({ url, options }: { url: string; options: GenerationOptions & { requestedSchemaTypes?: string[] } }) =>
      apiService.generateSchema(url, options),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setGeneratedSchemas(response.data.schemas)
        setHtmlScriptTags(response.data.htmlScriptTags || '') // Store HTML script tags
        setGenerationMetadata(response.data.metadata)

        setSchemaScore(response.data.schemaScore || null)
        setRefinementCount(0) // Reset refinement count for new schema
        refetchCredits() // Refresh credit balance

        // Invalidate library queries to reflect new URLs immediately
        queryClient.invalidateQueries({ queryKey: ['domains'] })
        queryClient.invalidateQueries({ queryKey: ['urls'] })

        toast.success(`Successfully generated ${response.data.schemas.length} schema(s)!`)
      }
    },
    onError: (error: any) => {
      // Handle content validation errors with helpful feedback
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error

        // Check if this is a content validation error
        if (errorMessage.includes('Content not suitable for schema generation') ||
            errorMessage.includes('not accessible') ||
            errorMessage.includes('validation')) {
          // Show a more user-friendly message for content validation
          toast.error('Content Analysis', {
            duration: 8000, // Show longer for detailed feedback
          })

          // Also set the error as metadata so we can display it properly
          setGenerationMetadata({
            url,
            error: errorMessage,
            isValidationError: true,
            processingTimeMs: error.response.data.data?.metadata?.processingTimeMs || 0
          })
          return
        }
      }

      // Handle other errors normally
      const message = error.response?.data?.error || 'Failed to generate schema'
      toast.error(message)
      console.error('Schema generation error:', error)
    }
  })

  // Schema validation mutation
  const validateMutation = useMutation({
    mutationFn: (schemas: JsonLdSchema[]) =>
      apiService.validateMultipleSchemas(schemas),
    onError: (error: any) => {
      toast.error('Failed to validate schemas')
      console.error('Validation error:', error)
    }
  })

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    // Check if user has credits
    const creditBalance = creditsData?.data?.creditBalance || 0
    if (creditBalance < 1) {
      toast.error('Insufficient credits. Please purchase more credits to continue.')
      return
    }

    try {
      new URL(url) // Validate URL format
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    // Check if URL already exists with schema
    try {
      const checkResult = await apiService.checkUrlExists(url)
      if (checkResult.success && checkResult.data.exists && checkResult.data.hasSchema) {
        // Show duplicate URL modal
        setDuplicateUrlData({
          url,
          urlId: checkResult.data.urlId,
          createdAt: checkResult.data.createdAt
        })
        setShowDuplicateModal(true)
        return
      }
    } catch (error) {
      console.error('Error checking URL existence:', error)
      // Continue with generation if check fails
    }

    generateMutation.mutate({
      url,
      options: {
        ...options,
        requestedSchemaTypes: [selectedSchemaType]
      }
    })
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    // Clear previous results and validation errors when URL changes
    if (generatedSchemas.length > 0 || generationMetadata || schemaScore) {
      setGeneratedSchemas([])
      setHtmlScriptTags('')
      setGenerationMetadata(null)
      setSchemaScore(null)
      setPreviousScore(undefined)
      setRefinementCount(0)
      setHighlightedChanges([])
    }
  }

  // Modal handlers
  const handleCloseModal = () => {
    setShowDuplicateModal(false)
    setDuplicateUrlData(null)
  }

  const handleViewExisting = () => {
    if (duplicateUrlData?.urlId) {
      navigate(`/library?urlId=${duplicateUrlData.urlId}`)
    }
    handleCloseModal()
  }

  const handleGenerateAnyway = () => {
    handleCloseModal()
    if (url) {
      generateMutation.mutate({
        url,
        options: {
          ...options,
          requestedSchemaTypes: [selectedSchemaType]
        }
      })
    }
  }

  const handleRefineSchema = async () => {
    if (!generatedSchemas.length || refinementCount >= MAX_REFINEMENTS || isRefining) return

    setIsRefining(true)
    setPreviousScore(schemaScore?.overallScore)

    try {
      const response = await apiService.refineSchema(generatedSchemas, url, {
        ...options,
        requestedSchemaTypes: [selectedSchemaType]
      })

      if (response.success && response.data) {
        setGeneratedSchemas(response.data.schemas)
        setHtmlScriptTags(response.data.htmlScriptTags || '')
        setSchemaScore(response.data.schemaScore || null)
        setHighlightedChanges(response.data.highlightedChanges || [])
        setRefinementCount(prev => prev + 1)

        const remaining = MAX_REFINEMENTS - (refinementCount + 1)
        toast.success(`Schema refined! ${remaining} refinement${remaining !== 1 ? 's' : ''} remaining.`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to refine schema')
      console.error('Schema refinement error:', error)
    } finally {
      setIsRefining(false)
    }
  }

  const handleSchemaChange = (schemas: JsonLdSchema[]) => {
    setGeneratedSchemas(schemas)
  }

  const handleValidate = async (schemas: JsonLdSchema[]) => {
    return validateMutation.mutateAsync(schemas)
  }

  const isGenerating = generateMutation.isPending
  const isValidating = validateMutation.isPending
  const creditBalance = creditsData?.data?.creditBalance || 0

  return (
    <div className="space-y-6 max-w-[2000px]">
      {/* Low Credit Warning */}
      <LowCreditWarning threshold={3} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schema Generator</h1>
          <p className="text-muted-foreground">
            Generate AI-optimized JSON-LD schema markup for any website
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Credits:</span>
          <span className="font-medium">{creditBalance}</span>
        </div>
      </div>

      {/* 2-Column Layout: Form on Left (40%), Editor on Right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(500px,2fr)_minmax(0,3fr)] gap-6">
        {/* LEFT COLUMN - Generation Form */}
        <div className="space-y-6 min-w-[500px]">
          {/* Generation Form */}
          <div className="bg-card border border-border rounded-lg p-6">
            <form onSubmit={handleGenerate} className="space-y-4">
          {/* Schema Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Primary Schema Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSchemaSelector(!showSchemaSelector)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
                disabled={isGenerating}
              >
                <span className="text-sm">
                  {(() => {
                    const selected = SCHEMA_TYPES.find(s => s.value === selectedSchemaType)
                    return selected ? selected.label : 'Select schema type...'
                  })()}
                </span>
                <span className="text-muted-foreground">▼</span>
              </button>

              {showSchemaSelector && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {SCHEMA_TYPES.map((schemaType) => (
                    <label
                      key={schemaType.value}
                      className="flex items-start space-x-3 p-3 hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="schemaType"
                        value={schemaType.value}
                        checked={selectedSchemaType === schemaType.value}
                        onChange={(e) => {
                          setSelectedSchemaType(e.target.value)
                          setShowSchemaSelector(false)
                        }}
                        className="mt-0.5 rounded border-border"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{schemaType.label}</div>
                        <div className="text-xs text-muted-foreground">{schemaType.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Schema Type Preview */}
            {selectedSchemaType && (
              <div className="mt-2">
                {(() => {
                  const selected = SCHEMA_TYPES.find(s => s.value === selectedSchemaType)
                  return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                      {selected?.label}
                    </span>
                  )
                })()}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Website URL
            </label>
            <div className="flex space-x-2">
              <input
                ref={urlInputRef}
                type="url"
                id="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isGenerating}
                required
              />
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className={cn(
                  'px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors',
                  showOptions && 'bg-accent'
                )}
                disabled={isGenerating}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          {showOptions && (
            <div className="border border-border rounded-md p-4 bg-muted/20">
              <h3 className="text-sm font-medium mb-3">Generation Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(options).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-border"
                      disabled={isGenerating}
                    />
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!url || isGenerating || creditBalance < 1}
            className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Generating Schema...
              </>
            ) : (
              <>
                <LightningBoltIcon className="h-4 w-4 mr-2" />
                Generate Schema (1 credit)
              </>
            )}
          </button>

          {creditBalance < 1 && (
            <div className="flex items-center justify-center p-3 bg-warning border border-warning rounded-md">
              <AlertCircle className="h-4 w-4 text-warning-foreground mr-2" />
              <span className="text-sm text-warning-foreground">
                You need at least 1 credit to generate schema.
                <button className="ml-1 underline hover:no-underline">
                  Purchase credits
                </button>
              </span>
            </div>
          )}
            </form>
          </div>

          {/* Generation Status */}
          {(isGenerating || generationMetadata) && (
            <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Generating Schema...</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing content and generating optimized markup
                    </p>
                  </div>
                </>
              ) : generationMetadata?.isValidationError ? (
                <>
                  <AlertCircle className="h-5 w-5 text-warning-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-warning-foreground">Content Analysis Feedback</p>
                    <p className="text-sm text-warning-foreground mt-1 leading-relaxed">
                      {generationMetadata.error}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {generationMetadata.processingTimeMs}ms
                      </span>
                      <span className="flex items-center text-success-foreground">
                        <CreditCard className="h-3 w-3 mr-1" />
                        No credits used
                      </span>
                      <a
                        href={generationMetadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View source
                      </a>
                    </div>
                  </div>
                </>
              ) : generationMetadata ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Schema Generated Successfully</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {generationMetadata.processingTimeMs}ms
                      </span>
                      <span className="flex items-center">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {generationMetadata.creditsUsed} credit used
                      </span>
                      <a
                        href={generationMetadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View source
                      </a>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
            </div>
          )}

          {/* Schema Quality Score */}
          {schemaScore && generationMetadata && (
            <SchemaScore
              score={schemaScore}
              url={generationMetadata.url}
              onRefineSchema={handleRefineSchema}
              isRefining={isRefining}
              canRefine={refinementCount < MAX_REFINEMENTS}
              previousScore={previousScore}
              refinementCount={refinementCount}
              maxRefinements={MAX_REFINEMENTS}
            />
          )}

        </div>

        {/* RIGHT COLUMN - Schema Editor */}
        <div className="space-y-6">
          {/* Generated Schemas */}
          {generatedSchemas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Generated Schemas</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{generatedSchemas.length} schema{generatedSchemas.length !== 1 ? 's' : ''} generated</span>
            </div>
          </div>

          <SchemaEditor
            schemas={generatedSchemas}
            htmlScriptTags={htmlScriptTags}
            onSchemaChange={handleSchemaChange}
            onValidate={handleValidate}
            height="500px"
            highlightedChanges={highlightedChanges}
          />

          {/* Rich Results Preview */}
          <RichResultsPreview schemas={generatedSchemas} />

          {/* Schema Types Summary */}
          <div className="bg-muted/20 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Generated Schema Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generatedSchemas.map((schema, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="font-medium text-sm">{schema['@type']}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Schema {index + 1}
                  </div>
                  <div className="text-xs text-success-foreground mt-1">
                    ✓ Generated
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              💡 Click the tabs above to view and edit each schema individually
            </div>
          </div>
            </div>
          )}

          {/* Help Text */}
          {generatedSchemas.length === 0 && !isGenerating && (
            <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
              <LightningBoltIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Ready to Generate Schema</h3>
              <p className="text-sm max-w-md mx-auto">
                Enter a website URL in the form to automatically generate optimized JSON-LD schema markup
                that will improve your site's visibility in search engines and AI-powered search.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate URL Modal */}
      <DuplicateUrlModal
        isOpen={showDuplicateModal}
        onClose={handleCloseModal}
        url={duplicateUrlData?.url || ''}
        createdAt={duplicateUrlData?.createdAt}
        onViewExisting={handleViewExisting}
        onGenerateAnyway={handleGenerateAnyway}
      />
    </div>
  )
}