import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import { detectEligibleRichResults } from '@/utils/richResultsDetector'
import type { JsonLdSchema } from '@shared/types'

interface RichResultsPreviewProps {
  schemas: JsonLdSchema[]
  className?: string
}

export default function RichResultsPreview({ schemas, className }: RichResultsPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!schemas || schemas.length === 0) return null

  // Get the primary schema (first one)
  const schema = schemas[0]
  const schemaType = schema['@type']

  // Detect eligible rich result types
  const eligibleTypes = detectEligibleRichResults(schema)

  return (
    <div className={cn('bg-card border border-border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
            <span className="text-xl">🔍</span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-base">Google Search Preview</h3>
            <p className="text-xs text-muted-foreground">
              {eligibleTypes.length > 0
                ? `Eligible for ${eligibleTypes.length} rich result${eligibleTypes.length !== 1 ? 's' : ''}`
                : 'See how your schema appears in search'}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border p-6 space-y-4">
          {/* Eligible Rich Results Badge */}
          {eligibleTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {eligibleTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center space-x-1 px-3 py-1 bg-success border border-success rounded-full text-xs text-success-foreground"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-medium">{type}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rich Result Preview Based on Type */}
          {schemaType === 'Article' && <ArticlePreview schema={schema} />}
          {schemaType === 'FAQPage' && <FAQPreview schema={schema} />}
          {schemaType === 'Product' && <ProductPreview schema={schema} />}
          {schemaType === 'Organization' && <OrganizationPreview schema={schema} />}
          {schemaType === 'BreadcrumbList' && <BreadcrumbPreview schema={schema} />}

          {/* Fallback for unsupported types */}
          {!['Article', 'FAQPage', 'Product', 'Organization', 'BreadcrumbList'].includes(schemaType) && (
            <GenericPreview schema={schema} />
          )}

          {/* Info Footer */}
          <div className="flex items-start space-x-2 p-3 bg-info border border-info rounded-lg text-xs text-info-foreground">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              This preview shows how your structured data may appear in Google Search results. Actual appearance may
              vary based on Google's algorithms and user device.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Article Preview Component
function ArticlePreview({ schema }: { schema: JsonLdSchema }) {
  const headline = schema.headline || schema.name || 'Your Article Headline'
  const description = schema.description || 'Article description will appear here...'
  const author = typeof schema.author === 'object' ? schema.author.name : schema.author
  const datePublished = schema.datePublished ? formatDate(schema.datePublished) : ''
  const url = schema.url || schema.mainEntityOfPage?.['@id'] || 'example.com/article'
  const image = extractImageUrl(schema.image)

  // Extract domain from URL
  const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">Article Rich Result Preview</div>
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        {/* URL breadcrumb */}
        <div className="flex items-center text-xs text-gray-600 mb-1">
          <span className="font-normal">{domain}</span>
        </div>

        {/* Headline */}
        <h3 className="text-blue-800 hover:underline text-xl font-normal cursor-pointer mb-1 line-clamp-2">
          {headline}
        </h3>

        {/* Meta info */}
        <div className="flex items-center text-xs text-gray-600 mb-2 space-x-2">
          {datePublished && (
            <>
              <span>📅</span>
              <span>{datePublished}</span>
            </>
          )}
          {author && (
            <>
              {datePublished && <span>·</span>}
              <span>✍️</span>
              <span>{author}</span>
            </>
          )}
        </div>

        {/* Image and description */}
        <div className="flex space-x-3">
          {image && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden">
                <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }} />
              </div>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// FAQ Preview Component
function FAQPreview({ schema }: { schema: JsonLdSchema }) {
  const name = schema.name || 'FAQ Section'
  const questions = schema.mainEntity || []
  const displayQuestions = Array.isArray(questions) ? questions.slice(0, 3) : []

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">FAQ Rich Result Preview</div>
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm space-y-3">
        <h3 className="text-blue-800 text-xl font-normal">{name}</h3>
        <div className="space-y-2">
          {displayQuestions.map((item: any, index: number) => (
            <div key={index} className="border-t border-gray-200 pt-2">
              <div className="flex items-start space-x-2">
                <ChevronDown className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {item.acceptedAnswer?.text || 'Answer text appears here...'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {displayQuestions.length === 0 && (
            <p className="text-xs text-gray-500 italic">No FAQ items detected in schema</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Product Preview Component
function ProductPreview({ schema }: { schema: JsonLdSchema }) {
  const name = schema.name || 'Product Name'
  const description = schema.description || 'Product description...'
  const price = schema.offers?.price || schema.price
  const currency = schema.offers?.priceCurrency || 'USD'
  const availability = schema.offers?.availability || ''
  const rating = schema.aggregateRating?.ratingValue
  const reviewCount = schema.aggregateRating?.reviewCount
  const image = extractImageUrl(schema.image)

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">Product Rich Result Preview</div>
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex space-x-4">
          {image && (
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 rounded overflow-hidden">
                <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }} />
              </div>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-blue-800 text-lg font-normal mb-1">{name}</h3>
            {rating && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <span className="text-yellow-500">{'⭐'.repeat(Math.round(rating))}</span>
                <span className="ml-2">{rating}/5</span>
                {reviewCount && <span className="ml-1">({reviewCount} reviews)</span>}
              </div>
            )}
            {price && (
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {currency} ${price}
              </div>
            )}
            {availability && (
              <div className="text-xs text-success-foreground mb-2">
                ✓ {availability.replace('https://schema.org/', '')}
              </div>
            )}
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Organization Preview Component
function OrganizationPreview({ schema }: { schema: JsonLdSchema }) {
  const name = schema.name || 'Organization Name'
  const description = schema.description || ''
  const url = schema.url || ''
  const logo = extractImageUrl(schema.logo)

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">Knowledge Panel Preview</div>
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start space-x-4">
          {logo && (
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                <img src={logo} alt="" className="w-full h-full object-contain" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }} />
              </div>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-2xl font-normal text-gray-900 mb-1">{name}</h3>
            {url && <p className="text-sm text-blue-700 mb-2">{url}</p>}
            {description && <p className="text-sm text-gray-600 line-clamp-3">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// Breadcrumb Preview Component
function BreadcrumbPreview({ schema }: { schema: JsonLdSchema }) {
  const items = schema.itemListElement || []

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">Breadcrumb Trail Preview</div>
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center text-sm text-gray-600">
          {Array.isArray(items) && items.map((item: any, index: number) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">›</span>}
              <span className="text-blue-700 hover:underline cursor-pointer">{item.name || item.item?.name}</span>
            </span>
          ))}
          {(!Array.isArray(items) || items.length === 0) && (
            <span className="text-gray-500 italic">Home › Category › Page</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Generic Preview for unsupported types
function GenericPreview({ schema }: { schema: JsonLdSchema }) {
  const name = schema.name || schema.headline || 'Content Title'
  const description = schema.description || ''
  const schemaType = schema['@type']
  const image = extractImageUrl(schema.image)
  const url = schema.url || 'example.com'

  // Extract domain from URL
  const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">{schemaType} Schema Preview</div>
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        {/* URL breadcrumb */}
        <div className="flex items-center text-xs text-gray-600 mb-1">
          <span className="font-normal">{domain}</span>
        </div>

        {/* Title */}
        <h3 className="text-blue-800 hover:underline text-xl font-normal cursor-pointer mb-1 line-clamp-2">
          {name}
        </h3>

        {/* Image and description */}
        <div className="flex space-x-3">
          {image && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden">
                <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }} />
              </div>
            </div>
          )}
          <div className="flex-1">
            {description && <p className="text-sm text-gray-600 line-clamp-3">{description}</p>}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3 italic">
          This schema type ({schemaType}) may be eligible for rich results in Google Search.
        </p>
      </div>
    </div>
  )
}

// Helper functions
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}

function extractImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'string') return image
  if (image.url) return image.url
  if (Array.isArray(image) && image[0]) {
    return typeof image[0] === 'string' ? image[0] : image[0].url
  }
  return null
}
