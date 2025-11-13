import { X, Award, CheckCircle, Sparkles, TrendingUp, Lightbulb } from 'lucide-react'
import { detectEligibleRichResults } from '@/utils/richResultsDetector'

interface SuccessPreviewInterstitialProps {
  isOpen: boolean
  onClose: () => void
  onGenerateAnother: () => void
  data: {
    schemaScore: number
    schemaType: string
    schemas: any[]
    creditsRemaining: number
    url: string
  }
}

export default function SuccessPreviewInterstitial({
  isOpen,
  onClose,
  onGenerateAnother,
  data
}: SuccessPreviewInterstitialProps) {
  if (!isOpen) return null

  const { schemaScore, schemaType, schemas, creditsRemaining, url } = data

  // Detect eligible rich results
  const eligibleResults = detectEligibleRichResults(schemas)

  // Get quality rating
  const getQualityRating = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-success', bg: 'bg-success/10', border: 'border-success' }
    if (score >= 75) return { label: 'Good', color: 'text-info', bg: 'bg-info/10', border: 'border-info' }
    if (score >= 60) return { label: 'Fair', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning' }
    return { label: 'Needs Work', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive' }
  }

  const qualityRating = getQualityRating(schemaScore)

  // Get letter grade
  const getLetterGrade = (score: number) => {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'A-'
    if (score >= 80) return 'B+'
    if (score >= 75) return 'B'
    if (score >= 70) return 'B-'
    if (score >= 65) return 'C+'
    if (score >= 60) return 'C'
    return 'D'
  }

  // Extract actual content from the schema for preview
  const primarySchema = schemas?.[0] || {}
  const extractImageUrl = (image: any): string | null => {
    if (!image) return null
    if (typeof image === 'string') return image
    if (image.url) return image.url
    if (Array.isArray(image) && image[0]) {
      return typeof image[0] === 'string' ? image[0] : image[0].url
    }
    return null
  }

  const previewTitle = primarySchema.headline || primarySchema.name || primarySchema.title || url.split('/').pop() || 'Your Page Title'
  const previewDescription = primarySchema.description || 'Enhanced with structured data for better visibility and click-through rates in Google Search results.'
  const previewImage = extractImageUrl(primarySchema.image || primarySchema.logo)
  const previewDomain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-card border border-border rounded-lg shadow-2xl max-w-3xl w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
        {/* Close button - subtle in top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <Award className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Success! Your Page is Now Optimized</h2>
          <p className="text-muted-foreground">
            Here's what this schema will do for your content
          </p>
        </div>

        {/* Value Demonstration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card 1: Rich Results Eligible */}
          <div className="border border-success bg-success/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-sm">Rich Results Eligible</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Your page can now appear with enhanced visuals in Google Search
            </p>
            {eligibleResults.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {eligibleResults.map((result, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 text-xs bg-success/10 text-success rounded"
                  >
                    {result}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: AI Search Optimized */}
          <div className="border border-info bg-info/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-info" />
              <h3 className="font-semibold text-sm">AI Search Optimized</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Structured for better understanding by AI engines
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>ChatGPT</span>
              <span>•</span>
              <span>Perplexity</span>
              <span>•</span>
              <span>Gemini</span>
            </div>
          </div>

          {/* Card 3: Quality Score */}
          <div className={`border ${qualityRating.border} ${qualityRating.bg} rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-5 w-5 ${qualityRating.color}`} />
              <h3 className="font-semibold text-sm">Schema Quality</h3>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-3xl font-bold ${qualityRating.color}`}>
                {schemaScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${qualityRating.bg} ${qualityRating.color}`}>
                Grade: {getLetterGrade(schemaScore)}
              </span>
              <span className="text-xs text-muted-foreground">{qualityRating.label}</span>
            </div>
          </div>
        </div>

        {/* Rich Result Preview Section */}
        <div className="bg-muted/30 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-3">How your page can appear in search:</h3>

          {/* Google Search Result Mockup */}
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              {previewImage ? (
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden">
                  <img
                    src={previewImage}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">{previewDomain}</div>
                <div className="text-info font-medium text-base mb-1 line-clamp-1">
                  {previewTitle}
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {previewDescription}
                </div>
                {eligibleResults.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span className="text-success font-medium">
                      Eligible for {eligibleResults[0]} rich results
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Callout */}
        <div className="bg-info/10 border border-info rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Pro tip from successful users:</p>
              <p className="text-sm text-muted-foreground">
                Most users optimize 5-10 high-traffic pages first for maximum impact.
                You have <span className="font-semibold text-foreground">{creditsRemaining} {creditsRemaining === 1 ? 'credit' : 'credits'}</span> remaining to continue optimizing.
              </p>
            </div>
          </div>
        </div>

        {/* Single Primary CTA */}
        <button
          onClick={onGenerateAnother}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-4 px-6 font-semibold text-lg transition-colors shadow-sm"
        >
          Generate Another Schema
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your current schema is ready to view and edit below
        </p>
      </div>
    </div>
  )
}
