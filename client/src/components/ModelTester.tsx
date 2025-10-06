import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Settings,
  TestTube2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiService } from '@/services/api'
import { cn } from '@/utils/cn'
import type { JsonLdSchema } from '@shared/types'

const AVAILABLE_MODELS = [
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    description: 'Fast, cost-effective model with structured output support',
    cost: 'Low',
    capabilities: ['structured-output', 'temperature']
  },
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    description: 'High-performance model with advanced reasoning',
    cost: 'Medium',
    capabilities: ['structured-output', 'temperature']
  }
] as const

interface ModelTestResult {
  model: string
  success: boolean
  responseTime: number
  schemasGenerated: number
  error?: string
  schemas?: JsonLdSchema[]
}

interface ModelTesterProps {
  className?: string
}

export default function ModelTester({ className }: ModelTesterProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o-mini', 'gpt-4o'])
  const [testUrl, setTestUrl] = useState('https://example.com')
  const [testResults, setTestResults] = useState<ModelTestResult[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())

  // Test a single model
  const testModelMutation = useMutation({
    mutationFn: async ({ model, url }: { model: string; url: string }) => {
      try {
        const response = await apiService.testModelPerformance(model, url, {
          includeImages: true,
          includeVideos: true,
          includeProducts: true,
          includeEvents: true,
          includeArticles: true,
          includeOrganization: true,
          includeLocalBusiness: true,
          requestedSchemaTypes: ['Article']
        })

        if (response.success && response.data) {
          return {
            model,
            success: true,
            responseTime: response.data.responseTime,
            schemasGenerated: response.data.schemas.length,
            schemas: response.data.schemas
          }
        } else {
          throw new Error('Schema generation failed')
        }
      } catch (error: any) {
        return {
          model,
          success: false,
          responseTime: 0,
          schemasGenerated: 0,
          error: error.response?.data?.error || error.message || 'Unknown error'
        }
      }
    }
  })

  const runModelComparison = async () => {
    if (selectedModels.length === 0) {
      toast.error('Please select at least one model to test')
      return
    }

    setIsComparing(true)
    setTestResults([])

    try {
      for (const model of selectedModels) {
        toast(`Testing ${model}...`, { icon: '🧪' })

        const result = await testModelMutation.mutateAsync({ model, url: testUrl })

        setTestResults(prev => [...prev, result])

        if (result.success) {
          toast.success(`${model}: Generated ${result.schemasGenerated} schemas in ${result.responseTime}ms`)
        } else {
          toast.error(`${model}: ${result.error}`)
        }

        // Add delay between tests to avoid rate limits
        if (selectedModels.indexOf(model) < selectedModels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      toast.success('Model comparison completed!')
    } catch (error) {
      toast.error('Model comparison failed')
      console.error('Model comparison error:', error)
    } finally {
      setIsComparing(false)
    }
  }

  const toggleModel = (modelValue: string) => {
    setSelectedModels(prev =>
      prev.includes(modelValue)
        ? prev.filter(m => m !== modelValue)
        : [...prev, modelValue]
    )
  }

  const clearResults = () => {
    setTestResults([])
    setExpandedResults(new Set())
  }

  const toggleResultExpansion = (index: number) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getModelInfo = (modelValue: string) => {
    return AVAILABLE_MODELS.find(m => m.value === modelValue)
  }

  const getBestPerformingModel = () => {
    const successfulResults = testResults.filter(r => r.success)
    if (successfulResults.length === 0) return null

    return successfulResults.reduce((best, current) => {
      const currentScore = (current.schemasGenerated * 1000) / current.responseTime
      const bestScore = (best.schemasGenerated * 1000) / best.responseTime
      return currentScore > bestScore ? current : best
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <TestTube2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Model Performance Tester</h2>
        </div>
        <div className="text-sm text-gray-500">
          Compare OpenAI models for schema generation
        </div>
      </div>

      {/* Test Configuration */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Test Configuration
        </h3>

        {/* Test URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test URL
          </label>
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Models to Test ({selectedModels.length} selected)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVAILABLE_MODELS.map((model) => (
              <div
                key={model.value}
                onClick={() => toggleModel(model.value)}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-colors",
                  selectedModels.includes(model.value)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{model.label}</div>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded",
                        model.cost === 'Low' || model.cost === 'Very Low' ? 'bg-green-100 text-green-700' :
                        model.cost === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        model.cost === 'High' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {model.cost} Cost
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {model.description}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {model.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {cap}
                        </span>
                      ))}
                      {model.capabilities.length === 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Basic
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center",
                    selectedModels.includes(model.value)
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}>
                    {selectedModels.includes(model.value) && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Actions */}
        <div className="flex gap-3">
          <button
            onClick={runModelComparison}
            disabled={isComparing || selectedModels.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
              isComparing || selectedModels.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {isComparing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube2 className="h-4 w-4" />
            )}
            {isComparing ? 'Testing Models...' : 'Run Comparison'}
          </button>

          {testResults.length > 0 && (
            <button
              onClick={clearResults}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Test Results
            </h3>
            {getBestPerformingModel() && (
              <div className="text-sm text-green-600 font-medium">
                Best: {getBestPerformingModel()?.model}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {testResults.map((result, index) => {
              const modelInfo = getModelInfo(result.model)
              const isExpanded = expandedResults.has(index)
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg border",
                    result.success
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  )}
                >
                  {/* Main Result Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{modelInfo?.label || result.model}</div>
                          <div className="text-sm text-gray-600">
                            {result.success ? (
                              `Generated ${result.schemasGenerated} schemas`
                            ) : (
                              result.error
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {result.responseTime}ms
                          </div>
                          {result.success && (
                            <div className="text-xs text-gray-500 mt-1">
                              {((result.schemasGenerated * 1000) / result.responseTime).toFixed(1)} schemas/sec
                            </div>
                          )}
                        </div>
                        {result.success && result.schemas && result.schemas.length > 0 && (
                          <button
                            onClick={() => toggleResultExpansion(index)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Schemas
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Schema Content */}
                  {isExpanded && result.success && result.schemas && (
                    <div className="border-t border-green-200 bg-white">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">Generated Schemas</h5>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(result.schemas, null, 2), 'All schemas')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            Copy All
                          </button>
                        </div>

                        {result.schemas.map((schema, schemaIndex) => (
                          <div key={schemaIndex} className="border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Schema {schemaIndex + 1}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {schema['@type'] || 'Unknown Type'}
                                </span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(schema, null, 2), `Schema ${schemaIndex + 1}`)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </button>
                            </div>
                            <div className="p-3">
                              <pre className="text-xs bg-gray-50 border rounded p-3 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(schema, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Performance Summary */}
          {testResults.filter(r => r.success).length > 1 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Performance Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {Math.min(...testResults.filter(r => r.success).map(r => r.responseTime))}ms
                  </div>
                  <div className="text-gray-600">Fastest Response</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {Math.max(...testResults.filter(r => r.success).map(r => r.schemasGenerated))}
                  </div>
                  <div className="text-gray-600">Most Schemas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {testResults.filter(r => r.success).length}/{testResults.length}
                  </div>
                  <div className="text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}